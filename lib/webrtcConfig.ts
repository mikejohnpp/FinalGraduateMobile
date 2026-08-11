import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra as {
    turnUsername?: string;
    turnCredential?: string;
} | undefined;

const turnUsername = extra?.turnUsername ?? '';
const turnCredential = extra?.turnCredential ?? '';

export const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
        urls: 'turn:standard.relay.metered.ca:80',
        username: turnUsername,
        credential: turnCredential,
    },
    {
        urls: 'turn:standard.relay.metered.ca:80?transport=tcp',
        username: turnUsername,
        credential: turnCredential,
    },
    {
        urls: 'turn:standard.relay.metered.ca:443',
        username: turnUsername,
        credential: turnCredential,
    },
    {
        urls: 'turns:standard.relay.metered.ca:443?transport=tcp',
        username: turnUsername,
        credential: turnCredential,
    },
];
