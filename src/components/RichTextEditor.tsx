'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import Highlight from '@tiptap/extension-highlight'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { useCallback, useEffect, useState, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  Type,
  Palette,
  Heading1,
  Heading2,
  Heading3,
  Check,
} from 'lucide-react'

const PRESET_COLORS = [
  '#ffffff', '#f1f5f9', '#94a3b8', '#64748b', '#334155', '#1e293b', '#0f172a', '#000000',
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
]

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  label?: string
}

const TOOLBAR_BTN =
  'p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed'
const TOOLBAR_BTN_ACTIVE = 'bg-slate-700 text-white'

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${TOOLBAR_BTN} ${isActive ? TOOLBAR_BTN_ACTIVE : ''}`}
    >
      {children}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-slate-700 mx-1" />
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight,
  label,
}: RichTextEditorProps) {
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const editor = useEditor({
    // Rendered client-only (dynamic ssr:false everywhere) — no SSR pass to match
    immediatelyRender: false,
    extensions: [
      // StarterKit v3 already bundles Underline and Link — configure them here
      // instead of adding standalone extensions (duplicates break commands)
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' },
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image,
      Placeholder.configure({
        placeholder,
      }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose-editor',
      },
    },
  })

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false })
    }
  }, [value, editor])

  // Close popups on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false)
      }
    }
    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  // Close link/image inputs when editor focus is lost
  useEffect(() => {
    if (!editor) return
    const handler = () => {
      setTimeout(() => {
        setShowLinkInput(false)
        setShowImageInput(false)
      }, 200)
    }
    editor.on('blur', handler)
    return () => {
      editor.off('blur', handler)
    }
  }, [editor])

  const setLink = useCallback(() => {
    if (!editor) return
    if (linkUrl === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run()
    }
    setShowLinkInput(false)
    setLinkUrl('')
  }, [editor, linkUrl])

  const openLinkInput = useCallback(() => {
    if (!editor) return
    const prev = editor.getAttributes('link').href || ''
    setLinkUrl(prev)
    setShowLinkInput(true)
    setShowImageInput(false)
    setShowColorPicker(false)
  }, [editor])

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return
    editor.chain().focus().setImage({ src: imageUrl }).run()
    setShowImageInput(false)
    setImageUrl('')
  }, [editor, imageUrl])

  const openImageInput = useCallback(() => {
    setImageUrl('')
    setShowImageInput(true)
    setShowLinkInput(false)
    setShowColorPicker(false)
  }, [])

  const setColor = useCallback(
    (color: string) => {
      if (!editor) return
      editor.chain().focus().setColor(color).run()
      setShowColorPicker(false)
    },
    [editor],
  )

  const toggleHighlight = useCallback(() => {
    if (!editor) return
    const current = editor.getAttributes('highlight').color
    if (current) {
      editor.chain().focus().unsetHighlight().run()
    } else {
      editor.chain().focus().toggleHighlight({ color: '#facc15' }).run()
    }
  }, [editor])

  if (!editor) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-sm p-4 animate-pulse">
        Loading editor...
      </div>
    )
  }

  const dynamicMinHeight = minHeight || '200px'

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-300">{label}</label>
      )}
      <div
        className="rounded-lg overflow-hidden border border-slate-700 bg-slate-900"
        style={{ minHeight: undefined }}
      >
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-slate-700 bg-slate-800/50 rounded-t-lg relative">
          {/* Undo / Redo */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo"
          >
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo"
          >
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            isActive={editor.isActive('bold')}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            isActive={editor.isActive('italic')}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            isActive={editor.isActive('underline')}
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            isActive={editor.isActive('strike')}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Headings */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setParagraph().run()}
            isActive={editor.isActive('paragraph')}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            isActive={editor.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            isActive={editor.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            isActive={editor.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            isActive={editor.isActive('bulletList')}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            isActive={editor.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            isActive={editor.isActive({ textAlign: 'left' })}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            isActive={editor.isActive({ textAlign: 'center' })}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            isActive={editor.isActive({ textAlign: 'right' })}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            isActive={editor.isActive({ textAlign: 'justify' })}
            title="Justify"
          >
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Link */}
          <ToolbarButton
            onClick={openLinkInput}
            isActive={editor.isActive('link')}
            title="Add/Edit Link"
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>

          {/* Image */}
          <ToolbarButton onClick={openImageInput} title="Add Image">
            <ImageIcon className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Color */}
          <div className="relative" ref={colorPickerRef}>
            <ToolbarButton
              onClick={() => {
                setShowColorPicker((prev) => !prev)
                setShowLinkInput(false)
                setShowImageInput(false)
              }}
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </ToolbarButton>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-xl">
                <div className="grid grid-cols-8 gap-1">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColor(color)}
                      title={color}
                      className="w-6 h-6 rounded border border-slate-600 hover:scale-125 transition-transform"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetColor().run()
                    setShowColorPicker(false)
                  }}
                  className="mt-2 w-full text-xs text-slate-400 hover:text-white text-center py-1 rounded hover:bg-slate-700 transition-colors"
                >
                  Reset Color
                </button>
              </div>
            )}
          </div>

          {/* Highlight */}
          <ToolbarButton
            onClick={toggleHighlight}
            isActive={editor.isActive('highlight')}
            title="Highlight"
          >
            <span className="bg-yellow-400 text-black rounded px-0.5 text-xs font-bold">H</span>
          </ToolbarButton>

          <ToolbarDivider />

          {/* Quote / Code / HR */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            isActive={editor.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            isActive={editor.isActive('codeBlock')}
            title="Code Block"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Rule"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Clear Formatting */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().clearNodes().unsetAllMarks().run()
            }
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </ToolbarButton>

          {/* Link Input Popup */}
          {showLinkInput && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-xl flex items-center gap-2 min-w-[280px]">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    setLink()
                  }
                  if (e.key === 'Escape') {
                    setShowLinkInput(false)
                    setLinkUrl('')
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-400"
                autoFocus
              />
              <button
                type="button"
                onClick={setLink}
                className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                title="Apply"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Image Input Popup */}
          {showImageInput && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-slate-800 border border-slate-600 rounded-lg p-2 shadow-xl flex items-center gap-2 min-w-[280px]">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addImage()
                  }
                  if (e.key === 'Escape') {
                    setShowImageInput(false)
                    setImageUrl('')
                  }
                }}
                className="flex-1 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-slate-400"
                autoFocus
              />
              <button
                type="button"
                onClick={addImage}
                className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                title="Insert"
              >
                <Check className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Editor Content */}
        <div
          style={{ minHeight: dynamicMinHeight }}
          className="bg-slate-900 text-slate-200 text-sm rounded-b-lg"
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          padding: 12px 16px;
          min-height: inherit;
          outline: none;
          font-size: 0.875rem;
          line-height: 1.6;
          color: #e2e8f0;
        }

        .ProseMirror > * + * {
          margin-top: 0.75em;
        }

        .ProseMirror h1 {
          font-size: 1.5em;
          font-weight: 700;
          margin: 0.5em 0;
          color: #f1f5f9;
          line-height: 1.3;
        }

        .ProseMirror h2 {
          font-size: 1.25em;
          font-weight: 600;
          margin: 0.5em 0;
          color: #f1f5f9;
          line-height: 1.35;
        }

        .ProseMirror h3 {
          font-size: 1.1em;
          font-weight: 600;
          margin: 0.5em 0;
          color: #e2e8f0;
          line-height: 1.4;
        }

        .ProseMirror p {
          margin: 0.25em 0;
        }

        .ProseMirror a {
          color: #34d399;
          text-decoration: underline;
          cursor: pointer;
        }

        .ProseMirror a:hover {
          color: #6ee7b7;
        }

        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }

        .ProseMirror li {
          margin: 0.2em 0;
        }

        .ProseMirror li > p {
          margin: 0;
        }

        .ProseMirror blockquote {
          border-left: 3px solid #34d399;
          padding-left: 12px;
          color: #94a3b8;
          margin: 0.75em 0;
          font-style: italic;
        }

        .ProseMirror code {
          background: #1e293b;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono',
            monospace;
          font-size: 0.9em;
          color: #e2e8f0;
        }

        .ProseMirror pre {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 12px 16px;
          margin: 0.75em 0;
          overflow-x: auto;
        }

        .ProseMirror pre code {
          background: none;
          padding: 0;
          border-radius: 0;
          font-size: 0.875rem;
          color: #e2e8f0;
        }

        .ProseMirror hr {
          border: none;
          border-top: 1px solid #334155;
          margin: 1em 0;
        }

        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 0.5em 0;
        }

        .ProseMirror mark {
          background-color: #facc15;
          color: #000;
          border-radius: 2px;
          padding: 0 2px;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          color: #475569;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }

        .ProseMirror:focus {
          outline: none;
        }

        /* Placeholder for empty list items etc. */
        .ProseMirror .is-empty::before {
          color: #475569;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
      `}</style>
    </div>
  )
}