// Các interface dùng chung — port từ web (FinalGraduateFrontend/src/types).

// ---- Kết quả API ----
export interface ApiResult {
    code: number;
    success?: boolean;
    message?: string;
    exception?: string;
}

export interface ApiResultGeneric<T> extends ApiResult {
    data?: T;
}

// ---- Phân trang ----
export interface CursorPageResponse<T> {
    data: T[];
    nextCursor: string | null;
    hasMore: boolean;
}

export interface PageResponse<T> {
    data: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

// ---- Cơ sở ----
export interface IBase {
    id: number;
}

// ---- Auth ----
export interface TokenResult {
    token: string;
    userId: number;
}

export interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
}

// ---- User ----
export interface IAuthor {
    id: number;
    name: string;
    avatar: string | null;
    nickName: string | null;
}

export interface UserProfileDTO {
    id: number;
    userName: string;
    nickName: string | null;
    avatar: string | null;
    email: string | null;
    phoneNumber: number | null;
    dateOfBirth: string | null;
    role: string;
    isActive: boolean;
    coverPhoto: string | null;
    friendCount: number;
    bio: string | null;
    location: string | null;
    education: string | null;
    workplace: string | null;
    hometown: string | null;
    relationship: string | null;
    gender: string | null;
    pronouns: string | null;
    language: string | null;
}

export interface IProfileUpdate {
    nickName?: string;
    bio?: string;
    location?: string;
    education?: string;
    workplace?: string;
    hometown?: string;
    relationship?: string;
    gender?: string;
    pronouns?: string;
    language?: string;
    dateOfBirth?: string;
    phoneNumber?: number;
}

// ---- Post ----
export interface IPost extends IBase {
    author: IAuthor;
    isGroupPosted: boolean;
    createdAt: string;
    commentCount: number;
    content: string;
    likeCount: number;
    hasLiked?: boolean;
    authorRole?: string;
    group?: {
        id: number;
        name: string;
        avatar: string | null;
    };
    sentiment: string | null;
    confidence: number | null;
    cancelReason: string | null;
}

export interface IPostDetails extends IBase {
    author: IAuthor;
    isGroupPosted: boolean;
    createdAt: string;
    content: string;
    likeCount: number;
    hasLiked?: boolean;
    sentiment: string | null;
    confidence: number | null;
    cancelReason: string | null;
}

export interface IPostCreate {
    userId: number;
    content: string;
    isGroupPosted?: boolean;
    groupId?: number | null;
}

export interface IPostUpdate {
    content: string;
}

// ---- Comment ----
export interface IComment {
    id: number;
    author: IAuthor;
    postId: number;
    parentId: number | null; // null = comment gốc, có ID = reply
    content: string;
    likeCount: number;
    replyCount: number;
    liked: boolean;
    createdAt: string;
    sentiment: string | null;
    confidence: number | null;
    cancelReason: string | null;
}

export interface ICommentCreate {
    userId: number;
    content: string;
    parentId?: number | null;
}

export interface ICommentUpdate {
    content: string;
}

// ---- Friend ----
export interface IFriendship {
    user: IAuthor;
    friendSince: string;
    mutualFriendCount: number;
}

export interface IFriendRequest {
    requestId: number; // ID dùng cho accept/decline
    sender: IAuthor;
    mutualFriendCount: number;
    createdAt: string;
}

export interface IFriendRequestCreate {
    userId: number;
    targetUserId: number;
}

export interface IFriendSuggestion {
    user: IAuthor;
    mutualFriendCount: number;
}

// ---- Group ----
export interface IGroup {
    id: number;
    name: string;
    coverPhoto: string | null;
    avatar: string | null;
    privacy: 'public' | 'private';
    memberCount: number;
    isJoined: boolean;
    isPending?: boolean;
    role: 'ADMIN' | 'MODERATOR' | 'MEMBER' | null;
    mutualFriendCount: number;
}

export interface IGroupCreate {
    name: string;
    privacy: 'public' | 'private';
    invitees?: number[];
}

// ---- Chat / Messenger ----
export interface ChatUserResponse {
    id: number;
    username: string;
    avatarUrl: string;
}

export interface Conversation {
    id: number;
    name: string;
    group: boolean;
    createdAt: string;
    active: boolean;
    members: ChatUserResponse[];
}

export type MessageType = 'TEXT' | 'VIDEO_CALL' | 'AUDIO_CALL';

export interface ChatMessage {
    id: number;
    conversationId?: number;
    content: string;
    createdAt: string;
    // Backend trả về sender dưới dạng object `user`, không phải `senderId`.
    user: ChatUserResponse;
    active?: boolean;
    messageType?: MessageType;
    callDuration?: number | null;
}


export interface MessageChat {
    conversationId: number;
    conversationName: string;
    group: boolean;
    createAd: string;
    members: ChatUserResponse[];
    messages: ChatMessage[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
}




