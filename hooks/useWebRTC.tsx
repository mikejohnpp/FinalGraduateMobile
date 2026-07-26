import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { RTCPeerConnection, RTCIceCandidate, RTCSessionDescription, mediaDevices, MediaStream } from 'react-native-webrtc';
import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import { sendCallSignal, subscribeCallSignals, unsubscribeCallSignals } from '@/lib/chatSocket';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import { Alert } from 'react-native';

const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

export type CallState = 'IDLE' | 'CALLING' | 'RINGING' | 'IN_CALL';

interface CallContextType {
    callState: CallState;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    remoteUserId: number | null;
    isAudioMuted: boolean;
    isVideoMuted: boolean;
    startCall: (toUserId: number, conversationId: number, isVideo?: boolean) => Promise<void>;
    acceptCall: () => Promise<void>;
    rejectCall: () => void;
    hangup: () => void;
    toggleMuteAudio: () => void;
    toggleMuteVideo: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const CallProvider = ({ children }: { children: ReactNode }) => {
    const [callState, setCallState] = useState<CallState>('IDLE');
    const [remoteUserId, setRemoteUserId] = useState<number | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isAudioMuted, setIsAudioMuted] = useState(false);
    const [isVideoMuted, setIsVideoMuted] = useState(false);

    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteUserIdRef = useRef<number | null>(null);
    const conversationIdRef = useRef<number | null>(null);
    const callTypeRef = useRef<'AUDIO' | 'VIDEO'>('VIDEO');
    const callStartTimeRef = useRef<number | null>(null);

    // ICE candidate của đầu bên kia có thể tới TRƯỚC tín hiệu OFFER/ANSWER, mà
    // addIceCandidate lại yêu cầu peer connection đã có remote description
    // (nếu không sẽ ném "The remote description was null"). Vì vậy phải đệm các
    // candidate đến sớm rồi nạp một lượt ngay sau khi setRemoteDescription xong.
    const pendingCandidatesRef = useRef<any[]>([]);
    const hasRemoteDescRef = useRef(false);


    const ringtoneAudio = useRef<AudioPlayer | null>(null);
    const callingAudio = useRef<AudioPlayer | null>(null);

    const currentUserId = useSelector((state: RootState) => state.user.userId);

    useEffect(() => {
        remoteUserIdRef.current = remoteUserId;
    }, [remoteUserId]);

    // Init sounds (expo-audio: createAudioPlayer đồng bộ, không cần await).
    useEffect(() => {
        try {
            const ringtone = createAudioPlayer(require('../assets/sounds/ringtone.mp3'));
            ringtone.loop = true;
            const calling = createAudioPlayer(require('../assets/sounds/calling.mp3'));
            calling.loop = true;
            ringtoneAudio.current = ringtone;
            callingAudio.current = calling;
        } catch (err) {
            console.log('Error loading sounds', err);
        }

        return () => {
            ringtoneAudio.current?.remove();
            callingAudio.current?.remove();
        };
    }, []);

    // Play sounds. expo-audio không có stop(); dùng pause() + seekTo(0) để tua về đầu.
    useEffect(() => {
        if (callState === 'CALLING') {
            callingAudio.current?.play();
        } else {
            callingAudio.current?.pause();
            callingAudio.current?.seekTo(0);
        }

        if (callState === 'RINGING') {
            ringtoneAudio.current?.play();
        } else {
            ringtoneAudio.current?.pause();
            ringtoneAudio.current?.seekTo(0);
        }
    }, [callState]);

    const cleanup = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((track) => track.stop());
        }
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        setLocalStream(null);
        setRemoteStream(null);
        setCallState('IDLE');
        setRemoteUserId(null);
        remoteUserIdRef.current = null;
        localStreamRef.current = null;
        peerConnection.current = null;
        conversationIdRef.current = null;
        callStartTimeRef.current = null;
        pendingCandidatesRef.current = [];
        hasRemoteDescRef.current = false;
    }, []);

    // Nạp các ICE candidate đã đệm sau khi remote description sẵn sàng.
    const flushPendingCandidates = useCallback(async () => {
        const pc = peerConnection.current;
        if (!pc) return;
        const queued = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const c of queued) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(c));
            } catch (e) {
                console.log('addIceCandidate (queued) failed', e);
            }
        }
    }, []);


    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (callState === 'CALLING') {
            timeoutId = setTimeout(() => {
                Alert.alert('Cuộc gọi nhỡ', 'Người dùng không bắt máy.');
                if (remoteUserIdRef.current && conversationIdRef.current) {
                    sendCallSignal('HANGUP', {
                        toUserId: remoteUserIdRef.current,
                        conversationId: conversationIdRef.current,
                        callType: callTypeRef.current,
                        durationSeconds: 0,
                    });
                }
                cleanup();
            }, 60000);
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [callState, cleanup]);

    const initPeerConnection = useCallback((remoteId: number) => {
        if (peerConnection.current) {
            peerConnection.current.close();
        }
        pendingCandidatesRef.current = [];
        hasRemoteDescRef.current = false;
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendCallSignal('ICE', {
                    toUserId: remoteId,
                    candidate: event.candidate.candidate,
                    sdpMid: event.candidate.sdpMid,
                    sdpMLineIndex: event.candidate.sdpMLineIndex,
                });
            }
        };
        pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) {
                setRemoteStream(event.streams[0]);
            }
        };
        peerConnection.current = pc;
        return pc;
    }, []);

    const startCall = async (toUserId: number, conversationId: number, isVideo: boolean = true) => {
        setRemoteUserId(toUserId);
        remoteUserIdRef.current = toUserId;
        conversationIdRef.current = conversationId;
        callTypeRef.current = isVideo ? 'VIDEO' : 'AUDIO';
        setCallState('CALLING');

        try {
            const stream = await mediaDevices.getUserMedia({
                video: isVideo,
                audio: true,
            }) as MediaStream;
            setLocalStream(stream);
            localStreamRef.current = stream;

            const pc = initPeerConnection(toUserId);
            stream.getTracks().forEach((track) => pc.addTrack(track, stream));

            const offer = await pc.createOffer({});
            await pc.setLocalDescription(offer);

            sendCallSignal('OFFER', {
                toUserId,
                sdpOffer: offer.sdp,
                callType: isVideo ? 'VIDEO' : 'AUDIO',
                conversationId,
            });
        } catch (error) {
            console.error('Error accessing media devices.', error);
            cleanup();
        }
    };

    const acceptCall = async () => {
        const currentRemoteId = remoteUserIdRef.current;
        if (!peerConnection.current || !currentRemoteId) return;

        setCallState('IN_CALL');
        callStartTimeRef.current = Date.now();

        try {
            const stream = await mediaDevices.getUserMedia({
                video: true,
                audio: true,
            }) as MediaStream;
            setLocalStream(stream);
            localStreamRef.current = stream;

            stream.getTracks().forEach((track) => peerConnection.current?.addTrack(track, stream));

            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);

            sendCallSignal('ANSWER', {
                toUserId: currentRemoteId,
                sdpAnswer: answer.sdp,
            });
        } catch (error) {
            console.error('Error accepting call.', error);
            rejectCall();
        }
    };

    const rejectCall = () => {
        const currentRemoteId = remoteUserIdRef.current;
        if (currentRemoteId) {
            sendCallSignal('REJECT', {
                toUserId: currentRemoteId,
                conversationId: conversationIdRef.current,
                callType: callTypeRef.current,
                durationSeconds: 0,
            });
        }
        cleanup();
    };

    const hangup = () => {
        const currentRemoteId = remoteUserIdRef.current;
        if (currentRemoteId) {
            const durationSeconds = callStartTimeRef.current
                ? Math.floor((Date.now() - callStartTimeRef.current) / 1000)
                : 0;
            sendCallSignal('HANGUP', {
                toUserId: currentRemoteId,
                conversationId: conversationIdRef.current,
                callType: callTypeRef.current,
                durationSeconds,
            });
        }
        cleanup();
    };

    const toggleMuteAudio = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsAudioMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleMuteVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoMuted(!videoTrack.enabled);
            }
        }
    };

    useEffect(() => {
        const sub = subscribeCallSignals(async (signal) => {
            const { type, payload } = signal;
            if (payload.fromUserId === currentUserId) return;

            switch (type) {
                case 'OFFER': {
                    const callerId = payload.fromUserId as number;
                    setRemoteUserId(callerId);
                    remoteUserIdRef.current = callerId;
                    if (payload.conversationId) conversationIdRef.current = payload.conversationId as number;
                    if (payload.callType) callTypeRef.current = payload.callType as 'AUDIO' | 'VIDEO';
                    setCallState('RINGING');
                    const pc = initPeerConnection(callerId);
                    await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.sdpOffer }));
                    hasRemoteDescRef.current = true;
                    await flushPendingCandidates();
                    break;
                }
                case 'ANSWER':
                    if (peerConnection.current) {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdpAnswer }));
                        hasRemoteDescRef.current = true;
                        await flushPendingCandidates();
                        setCallState('IN_CALL');
                        callStartTimeRef.current = Date.now();
                    }
                    break;
                case 'ICE': {
                    const candidate = {
                        candidate: payload.candidate,
                        sdpMid: payload.sdpMid,
                        sdpMLineIndex: payload.sdpMLineIndex,
                    };
                    // Chưa có remote description → đệm lại, tránh lỗi
                    // "The remote description was null".
                    if (!peerConnection.current || !hasRemoteDescRef.current) {
                        pendingCandidatesRef.current.push(candidate);
                        break;
                    }
                    try {
                        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {
                        console.log('addIceCandidate failed', e);
                    }
                    break;
                }

                case 'REJECT':
                case 'HANGUP':
                    cleanup();
                    break;
            }
        });

        return () => {
            unsubscribeCallSignals();
        };
    }, [cleanup, currentUserId, initPeerConnection, flushPendingCandidates]);


    const contextValue: CallContextType = {
        callState,
        localStream,
        remoteStream,
        remoteUserId,
        isAudioMuted,
        isVideoMuted,
        startCall,
        acceptCall,
        rejectCall,
        hangup,
        toggleMuteAudio,
        toggleMuteVideo,
    };

    return <CallContext.Provider value={contextValue}>{children}</CallContext.Provider>;
};

export const useWebRTC = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useWebRTC must be used within a CallProvider');
    }
    return context;
};
