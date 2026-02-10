import React, { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { userProfileService } from '@/lib/user-profile-service';
import { commentService } from '@/lib/comment-service';
import type { UserProfile, Comment } from '@/types/comments';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Globe, MessageCircle, Heart, ExternalLink } from 'lucide-react';
import { AdaptiveLoader } from '@/components/loading';

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<'profile' | 'comments'>('profile');

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => userProfileService.getUserProfile(userId!),
    enabled: !!userId,
  });

  // Fetch user's comments
  const { data: userComments, isLoading: commentsLoading } = useQuery({
    queryKey: ['userComments', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get all comments and filter by authorId
      const allComments = await commentService.getComments('all'); // This will need to be updated
      return allComments.filter(comment => comment.authorId === userId);
    },
    enabled: !!userId && activeTab === 'comments',
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <AdaptiveLoader size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">User Not Found</h1>
          <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex items-start space-x-6">
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.displayName}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                <span className="text-3xl font-bold text-gray-600">
                  {profile.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {profile.displayName}
              </h1>
              
              <div className="flex items-center space-x-6 text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {profile.joinedAt.toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4" />
                  <span>{profile.commentCount} comments</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Last seen {profile.lastSeen.toLocaleDateString()}</span>
                </div>
              </div>

              {profile.bio && (
                <p className="text-gray-700 text-lg leading-relaxed mb-4">
                  {profile.bio}
                </p>
              )}

              <div className="flex items-center space-x-4">
                {profile.location && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{profile.location}</span>
                  </div>
                )}
                
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Website</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'comments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Comments ({profile.commentCount})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                  <p className="text-gray-600">
                    {profile.bio || "This user hasn't added a bio yet."}
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Contact Information</h3>
                  <div className="space-y-2 text-gray-600">
                    <div>Email: {profile.email}</div>
                    {profile.website && (
                      <div>
                        Website: 
                        <a 
                          href={profile.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 ml-2"
                        >
                          {profile.website}
                        </a>
                      </div>
                    )}
                    {profile.location && (
                      <div>Location: {profile.location}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Activity</h3>
                  <div className="space-y-2 text-gray-600">
                    <div>Member since: {profile.joinedAt.toLocaleDateString()}</div>
                    <div>Total comments: {profile.commentCount}</div>
                    <div>Last active: {profile.lastSeen.toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                {commentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <AdaptiveLoader size="md" text="Loading comments..." />
                  </div>
                ) : userComments && userComments.length > 0 ? (
                  <div className="space-y-4">
                    {userComments.map((comment) => (
                      <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500">
                            Comment on: {comment.postId}
                          </span>
                          <span className="text-sm text-gray-400">
                            {comment.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-800">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No comments found for this user.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
