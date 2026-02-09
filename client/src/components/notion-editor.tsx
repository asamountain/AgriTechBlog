import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { useEffect } from 'react';
import TurndownService from 'turndown';
import { marked } from 'marked';
import './notion-editor.css';

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  fence: '```',
  preformattedCode: true, // Better whitespace preservation
});

// Configure marked for Markdown to HTML conversion
marked.setOptions({
  gfm: true,
  breaks: true,
});

interface NotionEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function NotionEditor({ content, onChange, placeholder = 'Type "/" for commands...' }: NotionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        hardBreak: false, // Prevent hard breaks from interfering with space handling
      }),
      Placeholder.configure({
        placeholder,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'notion-image',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'notion-link',
        },
      }),
    ],
    content: '', // Start empty, will be set in useEffect
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      // Convert HTML to Markdown when saving
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
  });

  // Convert Markdown to HTML when loading content
  // Only update on initial mount or when content truly changes from external source
  useEffect(() => {
    if (editor && content) {
      try {
        // Convert markdown to HTML for display
        const html = marked(content) as string;
        const currentHtml = editor.getHTML();
        
        // Get current markdown from editor to compare
        const currentMarkdown = turndownService.turndown(currentHtml);
        
        // Only update if content is significantly different (avoid cursor reset during typing)
        // This prevents re-renders while the user is typing
        if (content !== currentMarkdown && html !== currentHtml) {
          editor.commands.setContent(html, false); // false = don't trigger onUpdate
        }
      } catch (error) {
        console.error('Error converting markdown to HTML:', error);
        // Fallback: treat as plain text
        editor.commands.setContent(`<p>${content}</p>`, false);
      }
    }
  }, []); // Empty array - only run on mount to prevent cursor jumping

  if (!editor) {
    return null;
  }

  return (
    <div className="notion-editor-wrapper">
      <EditorContent editor={editor} />
    </div>
  );
}
