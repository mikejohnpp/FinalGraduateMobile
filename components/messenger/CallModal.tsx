import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useWebRTC } from '@/hooks/useWebRTC';
import { RTCView } from 'react-native-webrtc';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CallModal() {
    const {
        callState,
        localStream,
        remoteStream,
        isAudioMuted,
        isVideoMuted,
        acceptCall,
        rejectCall,
        hangup,
        toggleMuteAudio,
        toggleMuteVideo,
    } = useWebRTC();

    if (callState === 'IDLE') return null;

    return (
        <Modal animationType="fade" transparent={true} visible={callState !== 'IDLE'}>
            <View style={styles.container}>
                {/* Background or Streams */}
                {callState === 'IN_CALL' ? (
                    <View style={styles.videoContainer}>
                        {remoteStream && (
                            <RTCView
                                streamURL={remoteStream.toURL()}
                                objectFit={'cover'}
                                style={styles.remoteVideo}
                            />
                        )}
                        {localStream && (
                            <View style={styles.localVideoContainer}>
                                <RTCView
                                    streamURL={localStream.toURL()}
                                    objectFit={'cover'}
                                    style={styles.localVideo}
                                    mirror={true}
                                />
                            </View>
                        )}
                    </View>
                ) : (
                    <View style={styles.overlay}>
                        <Text style={styles.statusText}>
                            {callState === 'RINGING' ? 'Có cuộc gọi đến...' : 'Đang đổ chuông...'}
                        </Text>
                    </View>
                )}

                {/* Controls */}
                <SafeAreaView style={styles.controlsSafeArea}>
                    <View style={styles.controlsContainer}>
                        {callState === 'RINGING' && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.button, styles.btnAccept]} onPress={acceptCall}>
                                    <Feather name="phone" size={32} color="#fff" />
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.button, styles.btnReject]} onPress={rejectCall}>
                                    <Feather name="phone-off" size={32} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {callState === 'CALLING' && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity style={[styles.button, styles.btnReject]} onPress={hangup}>
                                    <Feather name="phone-off" size={32} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}

                        {callState === 'IN_CALL' && (
                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.button, isAudioMuted ? styles.btnReject : styles.btnSecondary]}
                                    onPress={toggleMuteAudio}
                                >
                                    <Feather name={isAudioMuted ? "mic-off" : "mic"} size={28} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.button, styles.btnReject, { paddingHorizontal: 32, width: 'auto', borderRadius: 32 }]} onPress={hangup}>
                                    <Feather name="phone-off" size={28} color="#fff" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.button, isVideoMuted ? styles.btnReject : styles.btnSecondary]}
                                    onPress={toggleMuteVideo}
                                >
                                    <Feather name={isVideoMuted ? "video-off" : "video"} size={28} color="#fff" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </SafeAreaView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        zIndex: 10,
    },
    statusText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 40,
    },
    videoContainer: {
        flex: 1,
        backgroundColor: '#000',
    },
    remoteVideo: {
        flex: 1,
    },
    localVideoContainer: {
        position: 'absolute',
        right: 20,
        bottom: 120,
        width: 120,
        height: 160,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#4b5563',
        backgroundColor: '#1f2937',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    localVideo: {
        flex: 1,
    },
    controlsSafeArea: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
    },
    controlsContainer: {
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    actionRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
    },
    button: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    btnAccept: {
        backgroundColor: '#22c55e',
    },
    btnReject: {
        backgroundColor: '#ef4444',
    },
    btnSecondary: {
        backgroundColor: '#4b5563',
    },
});
