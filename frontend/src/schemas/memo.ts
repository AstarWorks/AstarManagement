/**
 * Zod schemas for memo validation
 */

import { z } from 'zod'
import DOMPurify from 'dompurify'

// Basic memo schema for rich text editor
export const memoContentSchema = z.object({
  content: z
    .string()
    .min(1, 'Memo content is required')
    .max(50000, 'Memo content must be less than 50,000 characters')
    .refine(
      (content) => {
        // Check if content is not just empty HTML tags
        const plainText = content
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
          .trim()
        return plainText.length > 0
      },
      'Memo content cannot be empty'
    ),
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
})

// Extended memo schema with metadata
export const memoSchema = memoContentSchema.extend({
  id: z.string().optional(),
  caseId: z.string().min(1, 'Case ID is required'),
  type: z.enum(['internal', 'client'], {
    required_error: 'Memo type is required',
  }),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).optional().default([]),
  attachments: z.array(z.string()).optional().default([]),
  isConfidential: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  createdBy: z.string().optional(),
})

// Schema for memo form (creation/editing)
export const memoFormSchema = z.object({
  subject: z
    .string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters'),
  content: z
    .string()
    .min(1, 'Memo content is required')
    .max(50000, 'Memo content must be less than 50,000 characters')
    .refine(
      (content) => {
        // Validate HTML content is not empty
        const plainText = content
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .trim()
        return plainText.length > 0
      },
      'Memo content cannot be empty'
    ),
  type: z.enum(['internal', 'client']),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  caseId: z.string().min(1, 'Please select a case'),
  tags: z.array(z.string()).optional().default([]),
  isConfidential: z.boolean().default(false),
})

// Schema for memo search and filtering
export const memoSearchSchema = z.object({
  query: z.string().optional(),
  type: z.enum(['all', 'internal', 'client']).default('all'),
  priority: z.enum(['all', 'low', 'medium', 'high']).default('all'),
  caseId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isConfidential: z.boolean().optional(),
})

// Schema for memo list response
export const memoListResponseSchema = z.object({
  memos: z.array(memoSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
})

// Type exports
export type MemoContent = z.infer<typeof memoContentSchema>
export type Memo = z.infer<typeof memoSchema>
export type MemoForm = z.infer<typeof memoFormSchema>
export type MemoSearch = z.infer<typeof memoSearchSchema>
export type MemoListResponse = z.infer<typeof memoListResponseSchema>

// Validation helper functions
export function validateMemoContent(content: string): boolean {
  try {
    memoContentSchema.shape.content.parse(content)
    return true
  } catch {
    return false
  }
}

export function sanitizeHtmlContent(html: string): string {
  // Use DOMPurify for production-grade HTML sanitization
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

// Helper to extract plain text from HTML for search indexing
export function extractPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

// Helper to get word count from HTML content
export function getWordCount(html: string): number {
  const plainText = extractPlainText(html)
  return plainText ? plainText.split(/\s+/).length : 0
}

// Helper to get character count from HTML content
export function getCharacterCount(html: string): number {
  return extractPlainText(html).length
}