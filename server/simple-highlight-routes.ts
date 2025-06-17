import type { Express } from "express";
import { z } from "zod";

// MongoDB storage instance will be passed from routes
let mongoStorage: any = null;

const highlightSchema = z.object({
  blogPostId: z.union([z.number(), z.string()]),
  text: z.string(),
  startOffset: z.number(),
  endOffset: z.number(),
  elementPath: z.string(),
});

const commentSchema = z.object({
  highlightId: z.string(),
  content: z.string(),
  isPrivate: z.boolean().default(false),
  parentId: z.string().optional(),
});

export function setupSimpleHighlightRoutes(app: Express, storage: any) {
  mongoStorage = storage;

  // Get highlights for a blog post
  app.get("/api/highlights/:postId", async (req, res) => {
    try {
      const postId = req.params.postId;
      const highlights = await mongoStorage.getHighlightsByPostId(postId);
      res.json(highlights || []);
    } catch (error) {
      console.error("Error fetching highlights:", error);
      res.status(500).json({ error: "Failed to fetch highlights" });
    }
  });

  // Create a new highlight  
  app.post("/api/highlights", async (req, res) => {
    try {
      const validatedData = highlightSchema.parse(req.body);
      const highlightId = await mongoStorage.createHighlight(validatedData);
      res.json({ id: highlightId });
    } catch (error) {
      console.error("Error creating highlight:", error);
      res.status(500).json({ error: "Failed to create highlight" });
    }
  });

  // Add comment to highlight
  app.post("/api/highlights/:highlightId/comments", async (req, res) => {
    try {
      const { highlightId } = req.params;
      const validatedData = commentSchema.parse({
        ...req.body,
        highlightId,
      });

      const commentId = await mongoStorage.addHighlightComment(validatedData);
      res.json({ id: commentId });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Update comment
  app.patch("/api/highlight-comments/:commentId", async (req, res) => {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const success = await mongoStorage.updateHighlightComment(commentId, content);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Comment not found" });
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  // Delete comment
  app.delete("/api/highlight-comments/:commentId", async (req, res) => {
    try {
      const { commentId } = req.params;

      const success = await mongoStorage.deleteHighlightComment(commentId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Comment not found" });
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });
}