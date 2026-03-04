export interface Comment {
  id: string;
  postId: string;
  content: string;
  authorName: string;
  authorEmail: string;
  authorId: string; // Firebase Auth UID (required)
  authorAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
  likes: number;
  replies: Comment[];
  parentId?: string;
  isApproved: boolean;
}

export interface CommentFormData {
  content: string;
  // Removed authorName and authorEmail - will come from Firebase Auth
}

export interface CommentWithUser extends Comment {
  user: {
    displayName: string;
    email: string;
    photoURL?: string;
    uid: string;
  };
}

// New interface for user profiles
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  website?: string;
  location?: string;
  joinedAt: Date;
  commentCount: number;
  lastSeen: Date;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}
