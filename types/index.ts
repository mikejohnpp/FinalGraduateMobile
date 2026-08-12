export interface ApiResult {
  code: number;
  success?: boolean;
  message?: string;
  exception?: string;
}

export interface ApiResultGeneric<T> extends ApiResult {
  data?: T;
}

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

export interface IBase {
  id: number;
}

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';

export interface MediaInput {
  url: string;
  mediaType?: MediaType;
  position?: number;
}

export interface MediaItem {
  id: number;
  url: string;
  mediaType: MediaType;
  position: number;
}

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
  userName?: string;
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
  avatar?: string;
  coverPhoto?: string;
}

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
  media: MediaItem[];
  sentiment: string | null;
  confidence: number | null;
  cancelReason: string | null;
  status?: string | null;
}

export interface IPostDetails extends IBase {
  author: IAuthor;
  isGroupPosted: boolean;
  createdAt: string;
  content: string;
  likeCount: number;
  hasLiked?: boolean;
  media: MediaItem[];
  sentiment: string | null;
  confidence: number | null;
  cancelReason: string | null;
  status?: string | null;
}

export interface IPostCreate {
  userId: number;
  content: string;
  isGroupPosted?: boolean;
  groupId?: number | null;

  media?: MediaInput[] | null;
}

export interface IPostUpdate {
  content: string;

  media?: MediaInput[] | null;
}

export interface IComment {
  id: number;
  author: IAuthor;
  postId: number;
  parentId: number | null;
  content: string;
  media: MediaItem[];
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

  media?: MediaInput[] | null;
}

export interface ICommentUpdate {
  content: string;

  media?: MediaInput[] | null;
}

export interface IFriendship {
  user: IAuthor;
  friendSince: string;
  mutualFriendCount: number;
}

export interface IFriendRequest {
  requestId: number;
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

export type FriendStatus = 'FRIENDS' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'NOT_FRIENDS';

export interface IFriendStatusResponse {
  status: FriendStatus;
  requestId?: number;
}

export interface IStoryRequest {
  userId: number;
  content?: string;
  urlImage?: string;
  urlVideo?: string;
  type: 'STORY' | 'REEL';
  color?: string;
}

export interface IStoryUser {
  id: number;
  username: string;
  avatarUrl?: string;
}

export interface IStoryDTO {
  id: number;
  content: string | null;
  urlImage: string | null;
  urlVideo: string | null;
  user: IStoryUser;
  createdAt: string;
  isActive: boolean;
  type: string;
  color: string | null;
}

export interface IGroupedStory {
  user: IStoryUser;
  stories: IStoryDTO[];
  hasUnread?: boolean;
}

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

export interface IGroupMember {
  userId: number;
  name: string;
  avatar: string | null;
  role: 'ADMIN' | 'MODERATOR' | 'MEMBER';
}

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

export type MessageType = 'TEXT' | 'VIDEO_CALL' | 'AUDIO_CALL' | 'IMAGE' | 'FILE';

export interface ChatMessage {
  id: number;
  conversationId?: number;
  content: string;
  createdAt: string;

  user: ChatUserResponse;
  active?: boolean;
  messageType?: MessageType;
  callDuration?: number | null;
}

export interface MessageNotification {
  conversationId: number;
  conversationName: string | null;
  isGroup: boolean;
  messageId: number;
  content: string;
  messageType?: MessageType;
  createdAt: string;
  sender: ChatUserResponse;
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

export interface IGroupAdmin {
  id: number;
  name: string;
  avatarUrl?: string;
  coverUrl?: string;
  privacy: 'PUBLIC' | 'PRIVATE';
  memberCount: number;
  description?: string;
  createdAt: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface IGroupStats {
  pendingReviews: number;
  reportedContent: number;
  pendingPosts: number;
  memberRequests: number;
  groupStatusViolations: number;
  moderationNotifications: number;
  weeklyPosts: number;
  weeklyPostsChange: number;
  weeklyComments: number;
  weeklyCommentsChange: number;
  weeklyReactions: number;
  weeklyReactionsChange: number;
  activeMembers: number;
  activeMembersChange: number;
  weeklyActivity: { label: string; value: number }[];
}

export interface IGroupAdminMember {
  id: number;
  userId: number;
  username: string;
  avatarUrl?: string;
  requestedAt: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  joinedPlatformAt?: string;
}

export interface IGroupAdminPost {
  id: number;
  authorId: number;
  authorName: string;
  authorAvatarUrl?: string;
  content: string;
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export type NotificationType =
  | 'COMMENT'
  | 'REPLY'
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPT'
  | 'GROUP_JOIN_REQUEST'
  | 'GROUP_JOIN_APPROVED'
  | 'GROUP_POST_PENDING'
  | 'GROUP_POST_APPROVED';

export interface INotification {
  id: number;
  actor: IAuthor | null;
  type: NotificationType;
  entityType: string | null;
  entityId: number | null;
  message: string | null;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}
