// WebSocket functionality disabled to fix text selection issues
// This file replaces the problematic WebSocket implementation

export function useWebSocket(postId?: number) {
  return { 
    isConnected: false, 
    sendMessage: () => {} 
  };
}