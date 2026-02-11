import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
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

// Convert TipTap task list items to GFM task list syntax
turndownService.addRule('taskItem', {
  filter: (node) => {
    return node.nodeName === 'LI' && node.getAttribute('data-type') === 'taskItem';
  },
  replacement: (content, node) => {
    const checked = (node as Element).getAttribute('data-checked') === 'true';
    const checkbox = checked ? '[x]' : '[ ]';
    const cleanContent = content.replace(/^\n+|\n+$/g, '').replace(/\n/g, '\n    ');
    return `- ${checkbox} ${cleanContent}\n`;
  },
});

// Ensure task list <ul> doesn't add extra formatting
turndownService.addRule('taskList', {
  filter: (node) => {
    return node.nodeName === 'UL' && node.getAttribute('data-type') === 'taskList';
  },
  replacement: (content) => {
    return '\n' + content + '\n';
  },
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
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: '', // Start empty, will be set in useEffect
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
    },
    onUpdate: ({ editor }) => {
      // Auto-convert bullet items starting with [ ] or [x] to task items
      const { state } = editor;
      const { $from } = state.selection;

      // Walk up the node tree to find a listItem
      for (let depth = $from.depth; depth > 0; depth--) {
        const node = $from.node(depth);
        if (node.type.name === 'listItem') {
          const textContent = node.textContent;
          const match = textContent.match(/^\[([ x])\]\s?/);
          if (match) {
            const isChecked = match[1] === 'x';
            setTimeout(() => {
              editor
                .chain()
                .focus()
                .command(({ tr, state: s }: any) => {
                  // Find the start of text inside the list item and delete the [ ] prefix
                  const resolvedPos = s.selection.$from;
                  for (let d = resolvedPos.depth; d > 0; d--) {
                    if (resolvedPos.node(d).type.name === 'listItem') {
                      const start = resolvedPos.start(d);
                      // +1 to skip into the paragraph inside the list item
                      const innerStart = start + 1;
                      tr.delete(innerStart, innerStart + match[0].length);
                      return true;
                    }
                  }
                  return false;
                })
                .toggleBulletList()
                .toggleTaskList()
                .updateAttributes('taskItem', { checked: isChecked })
                .run();
            }, 0);
            return; // Skip markdown conversion — the setTimeout will trigger another update
          }
          break;
        }
      }

      // Normal HTML→Markdown conversion
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
