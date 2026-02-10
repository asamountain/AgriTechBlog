import { useState } from 'react';

/**
 * Manages anonymous user identity via localStorage.
 * Used for private notes and tracking user's own highlights.
 */
export function useAnonymousUser() {
  const [userId] = useState(() => {
    let id = localStorage.getItem('anonymous_user_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('anonymous_user_id', id);
    }
    return id;
  });

  const userName = localStorage.getItem('commenter_name') || '';
  const userEmail = localStorage.getItem('commenter_email') || '';

  return { userId, userName, userEmail };
}
