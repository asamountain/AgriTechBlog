import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { InputRule } from '@tiptap/core';
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

// Custom Emoji Input Rules Extension
const EmojiInputRule = Extension.create({
  name: 'emojiInputRule',

  addInputRules() {
    const emojis: Record<string, string> = {
      'think': '🤔',
      'smile': '😊',
      'laugh': '😂',
      'wink': '😉',
      'heart': '❤️',
      'rocket': '🚀',
      'check': '✅',
      'fire': '🔥',
      'star': '⭐',
      'party': '🎉',
      'pray': '🙏',
      'thumb': '👍',
      'eyes': '👀',
      'leaf': '🍃',
      'seed': '🌱',
      'tech': '💻',
      'data': '📊',
      'iot': '📡',
      'farm': '🚜',
      'sun': '☀️',
      'rain': '🌧️',
      'warn': '⚠️',
      'idea': '💡',
      'cool': '😎',
      'sad': '😢',
      'angry': '😠',
      'confused': '😕',
      'love': '😍',
      'hand': '👋',
      'clap': '👏',
      'ok': '👌',
      'money': '💰',
      'time': '⏰',
      'gift': '🎁',
      'book': '📚',
      'tool': '🛠️',
      'bug': '🐛',
      'link': '🔗',
      'earth': '🌍',
      'globe': '🌐',
    };

    return Object.entries(emojis).map(([key, emoji]) => {
      return new InputRule({
        find: new RegExp(`:${key}:$`),
        handler: ({ state, range }) => {
          const { tr } = state;
          const start = range.from;
          const end = range.to;

          tr.insertText(emoji, start, end);
        },
      });
    });
  },
});

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  fence: '```',
  preformattedCode: true, // Better whitespace preservation
  bulletListMarker: '-',
  blankReplacement: (content, node) => {
    return (node as any).isBlock ? '\n\n' : '';
  },
});

// Ensure blank lines before headings and other blocks for proper markdown parsing
turndownService.addRule('headings-newline', {
  filter: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'blockquote', 'ul', 'ol', 'pre'],
  replacement: (content, node) => {
    return '\n\n' + content + '\n\n';
  }
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
        openOnClick: true,
        HTMLAttributes: {
          class: 'notion-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      EmojiInputRule,
    ],
    content: '', // Start empty, will be set in useEffect
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
      handlePaste: (view: EditorView, event: ClipboardEvent) => {
        const items = Array.from(event.clipboardData?.items || []);
        
        // 1. Handle image paste (existing logic)
        const imageItem = items.find(item => item.type.startsWith('image'));
        if (imageItem) {
          const file = imageItem.getAsFile();
          if (file) {
            event.preventDefault();
            
            const formData = new FormData();
            formData.append('image', file);

            fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData,
            })
              .then(res => res.json())
              .then(data => {
                if (data.url) {
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({ src: data.url })
                    )
                  );
                }
              })
              .catch(err => {
                console.error('Failed to upload pasted image:', err);
              });
            
            return true;
          }
        }

        // 2. Handle Markdown paste from text/plain
        const text = event.clipboardData?.getData('text/plain');
        const html = event.clipboardData?.getData('text/html');

        // If we have markdown-like text and NO HTML (or minimal HTML), convert it
        // Claude often provides both, but the HTML should be preferred if it's rich.
        // If the user is specifically pasting markdown (e.g. from a code block), 
        // we detect common markdown patterns.
        const isMarkdown = text && (
          text.match(/^#+\s/m) || // Headings
          text.match(/^\s*[-*+]\s/m) || // Lists
          text.match(/\[.*\]\(.*\)/) || // Links
          text.match(/^\s*>\s/m) || // Blockquotes
          text.match(/(\*\*|__)(.*?)\1/) // Bold
        );

        if (text && isMarkdown && (!html || html.length < text.length)) {
          event.preventDefault();
          try {
            const convertedHtml = marked(text) as string;
            editor?.commands.insertContent(convertedHtml);
            return true;
          } catch (e) {
            console.error('Failed to convert pasted markdown:', e);
          }
        }

        return false;
      },
      handleDrop: (view: any, event: any, _slice: any, moved: boolean) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();

            const formData = new FormData();
            formData.append('image', file);

            fetch('/api/admin/upload-image', {
              method: 'POST',
              body: formData,
            })
              .then(res => res.json())
              .then(data => {
                if (data.url) {
                  const { schema } = view.state;
                  const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                  const node = schema.nodes.image.create({ src: data.url });
                  const transaction = view.state.tr.insert(coordinates?.pos ?? view.state.selection.from, node);
                  view.dispatch(transaction);
                }
              })
              .catch(err => {
                console.error('Failed to upload dropped image:', err);
              });
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }: { editor: any }) => {
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
      // Clean up multiple newlines created by turndown block rules
      const markdown = turndownService.turndown(html).replace(/\n{3,}/g, '\n\n').trim();
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
