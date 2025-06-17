import type { Express } from "express";
import { mongoHighlightStorage } from "./mongodb-highlight-storage";
import { highlightSchema, highlightCommentSchema } from "@shared/schema";
import { z } from "zod";
import { requireAuth } from "./auth-mongodb";

export function setupHighlightRoutes(app: Express, wss: any) {
  // Get highlights for a blog post
  app.get("/api/highlights/:postId", async (req, res) => {
    try {
      const postId = parseInt(req.params.postId);
      if (isNaN(postId)) {
        return res.status(400).json({ error: "Invalid post ID" });
      }

      const highlights = await mongoHighlightStorage.getHighlightsByPostId(postId);
      res.json(highlights);
    } catch (error) {
      console.error("Error fetching highlights:", error);
      res.status(500).json({ error: "Failed to fetch highlights" });
    }
  });

  // Create a new highlight
  app.post("/api/highlights", requireAuth, async (req: any, res) => {
    try {
      const highlightData = {
        ...req.body,
        userId: req.user.id,
      };
      const validatedData = highlightSchema.parse(highlightData);
      const highlightId = await mongoHighlightStorage.createHighlight(validatedData);
      
      // Broadcast to WebSocket clients
      broadcastHighlightUpdate(wss, validatedData.blogPostId, 'highlight_created', {
        highlightId,
        ...validatedData
      });

      res.status(201).json({ id: highlightId });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating highlight:", error);
      res.status(500).json({ error: "Failed to create highlight" });
    }
  });

  // Add comment to highlight
  app.post("/api/highlights/:highlightId/comments", requireAuth, async (req: any, res) => {
    try {
      const highlightId = req.params.highlightId;

      const commentData = {
        ...req.body,
        highlightId,
        userId: req.user.id,
      };

      const validatedData = highlightCommentSchema.parse(commentData);
      const commentId = await mongoHighlightStorage.addComment(validatedData);

      // Get the created comment with user details
      const comment = await mongoHighlightStorage.getCommentWithUser(commentId);

      // Broadcast to WebSocket clients
      broadcastHighlightUpdate(wss, highlightId, 'comment_added', {
        commentId,
        comment
      });

      res.status(201).json({ id: commentId, comment });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Update comment
  app.patch("/api/highlight-comments/:commentId", requireAuth, async (req: any, res) => {
    try {
      const commentId = req.params.commentId;

      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required" });
      }

      const success = await mongoHighlightStorage.updateComment(commentId, content, req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }

      // Get updated comment
      const comment = await mongoHighlightStorage.getCommentWithUser(commentId);

      // Broadcast to WebSocket clients
      broadcastHighlightUpdate(wss, commentId, 'comment_updated', {
        commentId,
        comment
      });

      res.json({ success: true, comment });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  // Delete comment
  app.delete("/api/highlight-comments/:commentId", requireAuth, async (req: any, res) => {
    try {
      const commentId = req.params.commentId;

      const success = await mongoHighlightStorage.deleteComment(commentId, req.user.id);
      if (!success) {
        return res.status(404).json({ error: "Comment not found or unauthorized" });
      }

      // Broadcast to WebSocket clients
      broadcastHighlightUpdate(wss, commentId, 'comment_deleted', {
        commentId
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });
}

// Helper function to broadcast updates via WebSocket
function broadcastHighlightUpdate(wss: any, targetId: number, type: string, data: any) {
  if (!wss?.clients) return;

  const message = JSON.stringify({
    type,
    targetId,
    data,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client: any) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      try {
        client.send(message);
      } catch (error) {
        console.error("Error broadcasting to client:", error);
      }
    }
  });
}