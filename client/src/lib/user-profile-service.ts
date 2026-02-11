import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  increment
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';
import type { UserProfile, AuthUser } from '@/types/comments';

export class UserProfileService {
  private get profilesCollection() {
    if (!db) throw new Error('Firebase is not configured');
    return collection(db, 'userProfiles');
  }

  // Get or create user profile
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (!isFirebaseConfigured) return null;
    try {
      const profileRef = doc(db, 'userProfiles', uid);
      const profileDoc = await getDoc(profileRef);

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        return {
          uid: profileDoc.id,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          bio: data.bio,
          website: data.website,
          location: data.location,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          commentCount: data.commentCount || 0,
          lastSeen: data.lastSeen?.toDate() || new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Create or update user profile from Firebase Auth
  async createOrUpdateProfile(authUser: AuthUser): Promise<UserProfile> {
    if (!isFirebaseConfigured) throw new Error('Firebase is not configured');
    try {
      const profileRef = doc(db, 'userProfiles', authUser.uid);
      const existingProfile = await getDoc(profileRef);

      if (existingProfile.exists()) {
        // Update existing profile
        await updateDoc(profileRef, {
          displayName: authUser.displayName,
          email: authUser.email,
          photoURL: authUser.photoURL,
          lastSeen: serverTimestamp()
        });

        const updatedDoc = await getDoc(profileRef);
        const data = updatedDoc.data();
        if (!data) throw new Error('Failed to get updated profile data');
        
        return {
          uid: updatedDoc.id,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          bio: data.bio,
          website: data.website,
          location: data.location,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          commentCount: data.commentCount || 0,
          lastSeen: data.lastSeen?.toDate() || new Date()
        };
      } else {
        // Create new profile
        const newProfile: Omit<UserProfile, 'uid'> = {
          displayName: authUser.displayName || 'Anonymous User',
          email: authUser.email || '',
          photoURL: authUser.photoURL || undefined,
          bio: '',
          website: '',
          location: '',
          joinedAt: new Date(),
          commentCount: 0,
          lastSeen: new Date()
        };

        await setDoc(profileRef, {
          ...newProfile,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp()
        });

        return {
          uid: authUser.uid,
          ...newProfile
        };
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw new Error('Failed to create/update user profile');
    }
  }

  // Increment user's comment count
  async incrementCommentCount(uid: string): Promise<void> {
    try {
      const profileRef = doc(db, 'userProfiles', uid);
      await updateDoc(profileRef, {
        commentCount: increment(1),
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error incrementing comment count:', error);
    }
  }

  // Search users by display name
  async searchUsers(searchQuery: string): Promise<UserProfile[]> {
    try {
      if (searchQuery.length < 2) return [];

      const q = query(
        this.profilesCollection,
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          displayName: data.displayName,
          email: data.email,
          photoURL: data.photoURL,
          bio: data.bio,
          website: data.website,
          location: data.location,
          joinedAt: data.joinedAt?.toDate() || new Date(),
          commentCount: data.commentCount || 0,
          lastSeen: data.lastSeen?.toDate() || new Date()
        };
      });
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  // Get user profile by display name
  async getUserByDisplayName(displayName: string): Promise<UserProfile | null> {
    try {
      const q = query(
        this.profilesCollection,
        where('displayName', '==', displayName)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      return {
        uid: doc.id,
        displayName: data.displayName,
        email: data.email,
        photoURL: data.photoURL,
        bio: data.bio,
        website: data.website,
        location: data.location,
        joinedAt: data.joinedAt?.toDate() || new Date(),
        commentCount: data.commentCount || 0,
        lastSeen: data.lastSeen?.toDate() || new Date()
      };
    } catch (error) {
      console.error('Error getting user by display name:', error);
      return null;
    }
  }
}

export const userProfileService = new UserProfileService();
