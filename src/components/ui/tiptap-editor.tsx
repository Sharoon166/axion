'use client';

import React, { useImperativeHandle, forwardRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import '../../styles/tiptap.css';
import StarterKit from '@tiptap/starter-kit';
import { Image } from '@tiptap/extension-image';
import { Link } from '@tiptap/extension-link';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import CharacterCount from '@tiptap/extension-character-count';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import { createLowlight } from 'lowlight';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Image as ImageIcon,
  Table as TableIcon,
  Code2,
  Palette,
  Minus,
  Eraser,
  Upload,
} from 'lucide-react';
import TurndownService from 'turndown';
import { toast } from 'sonner';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  onMarkdownChange?: (markdown: string) => void;
}

const TiptapEditor = forwardRef(function TiptapEditor(
  { content, onChange, placeholder = 'Start writing...', onMarkdownChange }: TiptapEditorProps,
  ref,
) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [localImages, setLocalImages] = useState<{ file: File; localUrl: string }[]>([]);
  const lowlight = createLowlight();
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  // Store images locally until submit
  const addLocalImage = (file: File) => {
    const localUrl = URL.createObjectURL(file);
    setLocalImages((prev) => [...prev, { file, localUrl }]);
    return localUrl;
  };

  // Tiptap editor instance
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 hover:text-blue-800 underline',
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
        HTMLAttributes: {
          class: 'bg-gray-100 rounded-lg p-4 font-mono text-sm',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      CharacterCount,
      HorizontalRule,
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      if (onMarkdownChange) {
        const markdown = turndownService.turndown(html);
        onMarkdownChange(markdown);
      }
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
        'data-placeholder': placeholder,
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile();
              if (file) {
                event.preventDefault();
                if (file.size > 5 * 1024 * 1024) {
                  toast.error('Image size should be less than 5MB');
                  return true;
                }
                if (!file.type.startsWith('image/')) {
                  toast.error('Please select a valid image file');
                  return true;
                }
                const localUrl = addLocalImage(file);
                editor?.chain().focus().setImage({ src: localUrl }).run();
                return true;
              }
            }
          }
        }
        return false;
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (files && files.length) {
          for (const file of files) {
            if (file.type.startsWith('image/')) {
              event.preventDefault();
              if (file.size > 5 * 1024 * 1024) {
                toast.error('Image size should be less than 5MB');
                return true;
              }
              if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return true;
              }
              const localUrl = addLocalImage(file);
              editor?.chain().focus().setImage({ src: localUrl }).run();
              return true;
            }
          }
        }
        return false;
      },
    },
    immediatelyRender: false,
  });

  useImperativeHandle(ref, () => ({
    async processContentOnSubmit() {
      if (!editor) return '';
      const html = editor.getHTML();
      let updatedHtml = html;

      // Upload all local images to Cloudinary
      for (const { file, localUrl } of localImages) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Upload failed: ${res.status}`);
          }

          const data = await res.json();
          if (data.success && data.url) {
            // Replace the local URL with the Cloudinary URL
            updatedHtml = updatedHtml.replaceAll(localUrl, data.url);
            // Clean up the local URL
            URL.revokeObjectURL(localUrl);
          } else {
            throw new Error(data.error || 'Upload failed');
          }
        } catch (error) {
          console.error('Image upload failed:', error);
          toast.error(`Image upload failed`);
          // Keep the local URL if upload fails
        }
      }

      // Clear local images after processing
      setLocalImages([]);
      return updatedHtml;
    },
  }));

  if (!editor) {
    return null;
  }

  // Custom menu button for image upload
  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image size should be less than 5MB');
          return;
        }
        if (!file.type.startsWith('image/')) {
          toast.error('Please select a valid image file');
          return;
        }
        const localUrl = addLocalImage(file);
        editor.chain().focus().setImage({ src: localUrl }).run();
      }
    };
    input.click();
  };

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const colors = [
    '#000000',
    '#374151',
    '#6B7280',
    '#9CA3AF',
    '#EF4444',
    '#F97316',
    '#F59E0B',
    '#EAB308',
    '#22C55E',
    '#10B981',
    '#06B6D4',
    '#0EA5E9',
    '#3B82F6',
    '#6366F1',
    '#8B5CF6',
    '#A855F7',
    '#EC4899',
    '#F43F5E',
  ];
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 bg-gray-50 flex flex-wrap gap-1 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {/* Text Formatting */}
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('strike') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
          >
            <Strikethrough className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('code') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCode().run()}
          >
            <Code className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Headings */}
          <Button
            type="button"
            variant={editor.isActive('heading', { level: 1 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <Heading1 className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('heading', { level: 2 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('heading', { level: 3 }) ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <Heading3 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Lists */}
          <Button
            type="button"
            variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Code Block */}
          <Button
            type="button"
            variant={editor.isActive('codeBlock') ? 'default' : 'ghost'}
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Media & Links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="ghost" size="sm">
                <ImageIcon className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleImageUpload}>
                <Upload className="w-4 h-4 mr-2" />
                Upload Image
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" variant="ghost" size="sm" onClick={addTable}>
            <TableIcon className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Horizontal Rule */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus className="w-4 h-4" />
          </Button>

          {/* Clear Formatting */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          >
            <Eraser className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Color Picker */}
          <div className="relative">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette className="w-4 h-4" />
            </Button>

            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-max">
                <div className="grid grid-cols-6 gap-1">
                  {colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        editor.chain().focus().setColor(color).run();
                        setShowColorPicker(false);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Undo/Redo */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>
      </div>
      {/* Editor Content */}
      <EditorContent editor={editor} className="*:mx-4" />
      {/* ...other UI elements, dialogs, etc... */}
    </div>
  );
});

export { TiptapEditor };
