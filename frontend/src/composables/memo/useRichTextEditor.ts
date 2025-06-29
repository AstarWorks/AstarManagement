/**
 * Rich Text Editor Composable using Tiptap v2
 * Provides comprehensive rich text editing capabilities for legal memos
 */

import { computed, onBeforeUnmount } from 'vue'
import { useEditor } from '@tiptap/vue-3'
import DOMPurify from 'dompurify'
import StarterKit from '@tiptap/starter-kit'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import CharacterCount from '@tiptap/extension-character-count'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'

export interface EditorOptions {
  initialContent?: string
  placeholder?: string
  extensions?: any[]
  onChange?: (content: string) => void
  onFocus?: () => void
  onBlur?: () => void
  maxCharacters?: number
}

export function useRichTextEditor(options: EditorOptions = {}) {
  const {
    initialContent = '',
    placeholder = 'Start typing your memo...',
    extensions = [],
    onChange,
    onFocus,
    onBlur,
    maxCharacters = 50000
  } = options

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'memo-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'memo-link',
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TaskList.configure({
        HTMLAttributes: {
          class: 'memo-task-list',
        },
      }),
      TaskItem.configure({
        nested: true,
        HTMLAttributes: {
          class: 'memo-task-item',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxCharacters,
      }),
      // Add any additional extensions passed in options
      ...extensions,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'memo-editor prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
        spellcheck: 'true',
      },
      handleKeyDown: (view, event) => {
        // Handle keyboard shortcuts
        if (event.metaKey || event.ctrlKey) {
          switch (event.key) {
            case 'b':
              event.preventDefault()
              toggleBold()
              return true
            case 'i':
              event.preventDefault()
              toggleItalic()
              return true
            case 'u':
              event.preventDefault()
              toggleUnderline()
              return true
            case 'k':
              event.preventDefault()
              // Could trigger link dialog
              return true
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    onFocus: () => {
      onFocus?.()
    },
    onBlur: () => {
      onBlur?.()
    },
  })

  // Content manipulation
  const getContent = () => editor.value?.getHTML() || ''
  const getPlainText = () => editor.value?.getText() || ''
  const getCharacterCount = () => editor.value?.storage.characterCount.characters() || 0
  const getWordCount = () => editor.value?.storage.characterCount.words() || 0
  
  const setContent = (content: string) => {
    editor.value?.commands.setContent(content)
  }

  const insertTable = (rows: number = 3, cols: number = 3) => {
    if (editor.value) {
      editor.value.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run()
    }
  }

  // Basic formatting
  const toggleBold = () => {
    editor.value?.chain().focus().toggleBold().run()
  }
  
  const toggleItalic = () => {
    editor.value?.chain().focus().toggleItalic().run()
  }
  
  const toggleUnderline = () => {
    editor.value?.chain().focus().toggleUnderline().run()
  }
  
  const toggleStrike = () => {
    editor.value?.chain().focus().toggleStrike().run()
  }
  
  const toggleCode = () => {
    editor.value?.chain().focus().toggleCode().run()
  }
  
  const toggleCodeBlock = () => {
    editor.value?.chain().focus().toggleCodeBlock().run()
  }
  
  const toggleBlockquote = () => {
    editor.value?.chain().focus().toggleBlockquote().run()
  }
  
  const insertHorizontalRule = () => {
    editor.value?.chain().focus().setHorizontalRule().run()
  }

  // Headings
  const setHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    editor.value?.chain().focus().toggleHeading({ level }).run()
  }

  const setParagraph = () => {
    editor.value?.chain().focus().setParagraph().run()
  }

  // Lists
  const toggleBulletList = () => {
    editor.value?.chain().focus().toggleBulletList().run()
  }
  
  const toggleOrderedList = () => {
    editor.value?.chain().focus().toggleOrderedList().run()
  }

  const toggleTaskList = () => {
    editor.value?.chain().focus().toggleTaskList().run()
  }

  // Text alignment
  const setTextAlign = (alignment: 'left' | 'center' | 'right' | 'justify') => {
    editor.value?.chain().focus().setTextAlign(alignment).run()
  }

  // Links
  const insertLink = (url: string, text?: string) => {
    if (!url) return
    
    if (text) {
      editor.value?.chain().focus().insertContent(`<a href="${url}">${text}</a>`).run()
    } else {
      editor.value?.chain().focus().setLink({ href: url }).run()
    }
  }

  const removeLink = () => {
    editor.value?.chain().focus().unsetLink().run()
  }

  const getSelectedText = () => {
    const { from, to } = editor.value?.state.selection || { from: 0, to: 0 }
    return editor.value?.state.doc.textBetween(from, to) || ''
  }

  // State checks
  const isActive = (name: string, attributes?: Record<string, any>) => {
    return editor.value?.isActive(name, attributes) || false
  }

  const canUndo = computed(() => {
    return editor.value?.can().chain().focus().undo().run() || false
  })

  const canRedo = computed(() => {
    return editor.value?.can().chain().focus().redo().run() || false
  })

  const undo = () => {
    editor.value?.chain().focus().undo().run()
  }

  const redo = () => {
    editor.value?.chain().focus().redo().run()
  }

  // Focus management
  const focus = () => {
    editor.value?.commands.focus()
  }

  const blur = () => {
    editor.value?.commands.blur()
  }

  // Cleanup
  onBeforeUnmount(() => {
    editor.value?.destroy()
  })

  return {
    editor,
    
    // Content methods
    getContent,
    getPlainText,
    setContent,
    getCharacterCount,
    getWordCount,
    getSelectedText,
    
    // Table operations
    insertTable,
    
    // Basic formatting
    toggleBold,
    toggleItalic,
    toggleUnderline,
    toggleStrike,
    toggleCode,
    toggleCodeBlock,
    toggleBlockquote,
    insertHorizontalRule,
    
    // Headings
    setHeading,
    setParagraph,
    
    // Lists
    toggleBulletList,
    toggleOrderedList,
    toggleTaskList,
    
    // Alignment
    setTextAlign,
    
    // Links
    insertLink,
    removeLink,
    
    // State checks
    isActive,
    
    // History
    undo,
    redo,
    canUndo,
    canRedo,
    
    // Focus
    focus,
    blur,
  }
}

// Helper function to sanitize HTML content
export function sanitizeMemoContent(html: string): string {
  // Configure DOMPurify for legal memo content
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'hr',
      'table', 'tbody', 'thead', 'tr', 'td', 'th',
      'a', 'span', 'div'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'rel', 'class', 'style',
      'data-type', 'data-task-id', 'checked'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_TRUSTED_TYPE: false
  })
}