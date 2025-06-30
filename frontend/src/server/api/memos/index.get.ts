// GET /api/memos - Memo list API endpoint for T04_S13

import type { PaginatedMemoResponse, Memo, MemoFilters } from '~/types/memo'

export default defineEventHandler(async (event: any) => {
  const query = getQuery(event)
  
  // Parse query parameters
  const page = parseInt(query.page as string) || 1
  const pageSize = parseInt(query.pageSize as string) || 20
  const search = query.search as string
  const status = Array.isArray(query.status) ? query.status : query.status ? [query.status] : undefined
  const priority = Array.isArray(query.priority) ? query.priority : query.priority ? [query.priority] : undefined
  const recipientType = Array.isArray(query.recipientType) ? query.recipientType : query.recipientType ? [query.recipientType] : undefined
  const tags = Array.isArray(query.tag) ? query.tag : query.tag ? [query.tag] : undefined
  const caseId = query.caseId as string
  const createdBy = query.createdBy as string
  const hasAttachments = query.hasAttachments === 'true' ? true : query.hasAttachments === 'false' ? false : undefined
  const sort = query.sort as string || 'createdAt'
  const order = query.order as string || 'desc'
  const dateFrom = query.dateFrom ? new Date(query.dateFrom as string) : undefined
  const dateTo = query.dateTo ? new Date(query.dateTo as string) : undefined

  // Mock data - in real implementation, this would query the database
  const mockMemos: Memo[] = [
    {
      id: '1',
      caseId: 'case-001',
      caseNumber: 'CASE-2024-001',
      recipient: {
        id: 'client-001',
        name: 'Acme Corporation',
        type: 'client'
      },
      subject: 'Contract Review - Q1 2024',
      content: 'Please review the attached contract terms for the Q1 2024 engagement. We have identified several key areas that require your attention...',
      status: 'sent',
      priority: 'high',
      sentAt: '2024-01-15T10:30:00Z',
      createdBy: {
        id: 'lawyer-001',
        name: 'John Smith'
      },
      tags: ['contract', 'review', 'urgent'],
      attachments: [
        {
          id: 'att-001',
          filename: 'contract-q1-2024.pdf',
          size: 245760,
          mimeType: 'application/pdf',
          url: '/uploads/contract-q1-2024.pdf',
          uploadedAt: '2024-01-15T09:20:00Z'
        }
      ]
    },
    {
      id: '2',
      caseId: 'case-002',
      caseNumber: 'CASE-2024-002',
      recipient: {
        id: 'client-002',
        name: 'Tech Startup Inc.',
        type: 'client'
      },
      subject: 'Legal Opinion Request',
      content: 'Following our discussion yesterday, I am preparing a legal opinion on the IP licensing terms...',
      status: 'draft',
      priority: 'medium',
      createdBy: {
        id: 'lawyer-001',
        name: 'John Smith'
      },
      tags: ['opinion', 'IP', 'licensing'],
      attachments: []
    },
    {
      id: '3',
      caseId: 'case-003',
      caseNumber: 'CASE-2024-003',
      recipient: {
        id: 'court-001',
        name: 'District Court',
        type: 'court'
      },
      subject: 'Motion to Dismiss Filing',
      content: 'Enclosed please find our Motion to Dismiss with supporting documentation...',
      status: 'sent',
      priority: 'high',
      sentAt: '2024-01-13T11:15:00Z',
      readAt: '2024-01-13T14:30:00Z',
      createdBy: {
        id: 'lawyer-002',
        name: 'Jane Doe'
      },
      tags: ['motion', 'court', 'filing'],
      attachments: [
        {
          id: 'att-002',
          filename: 'motion-to-dismiss.pdf',
          size: 156800,
          mimeType: 'application/pdf',
          url: '/uploads/motion-to-dismiss.pdf',
          uploadedAt: '2024-01-13T10:30:00Z'
        },
        {
          id: 'att-003',
          filename: 'supporting-evidence.pdf',
          size: 892400,
          mimeType: 'application/pdf',
          url: '/uploads/supporting-evidence.pdf',
          uploadedAt: '2024-01-13T10:45:00Z'
        }
      ]
    },
    {
      id: '4',
      caseId: 'case-001',
      caseNumber: 'CASE-2024-001',
      recipient: {
        id: 'opposing-001',
        name: 'Smith & Associates',
        type: 'opposing_counsel'
      },
      subject: 'Settlement Proposal',
      content: 'We have reviewed the settlement terms and have the following comments...',
      status: 'read',
      priority: 'medium',
      sentAt: '2024-01-12T16:45:00Z',
      readAt: '2024-01-12T17:20:00Z',
      createdBy: {
        id: 'lawyer-001',
        name: 'John Smith'
      },
      tags: ['settlement', 'negotiation'],
      attachments: []
    },
    {
      id: '5',
      caseId: 'case-004',
      caseNumber: 'CASE-2024-004',
      recipient: {
        id: 'internal-001',
        name: 'Paralegal Team',
        type: 'internal'
      },
      subject: 'Document Review Assignment',
      content: 'Please review the attached documents for privilege and relevance...',
      status: 'sent',
      priority: 'low',
      sentAt: '2024-01-11T09:00:00Z',
      createdBy: {
        id: 'lawyer-002',
        name: 'Jane Doe'
      },
      tags: ['review', 'internal', 'discovery'],
      attachments: []
    }
  ]

  // Apply filters
  let filteredMemos = [...mockMemos]

  if (search) {
    const searchLower = search.toLowerCase()
    filteredMemos = filteredMemos.filter(memo =>
      memo.subject.toLowerCase().includes(searchLower) ||
      memo.content.toLowerCase().includes(searchLower) ||
      memo.recipient.name.toLowerCase().includes(searchLower) ||
      memo.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  if (status && status.length > 0) {
    filteredMemos = filteredMemos.filter(memo => status.includes(memo.status))
  }

  if (priority && priority.length > 0) {
    filteredMemos = filteredMemos.filter(memo => priority.includes(memo.priority))
  }

  if (recipientType && recipientType.length > 0) {
    filteredMemos = filteredMemos.filter(memo => recipientType.includes(memo.recipient.type))
  }

  if (tags && tags.length > 0) {
    filteredMemos = filteredMemos.filter(memo =>
      tags.some((tag: string) => memo.tags.includes(tag))
    )
  }

  if (caseId) {
    filteredMemos = filteredMemos.filter(memo => memo.caseId === caseId)
  }

  if (createdBy) {
    filteredMemos = filteredMemos.filter(memo => memo.createdBy.id === createdBy)
  }

  if (hasAttachments !== undefined) {
    filteredMemos = filteredMemos.filter(memo => (memo.attachments.length > 0) === hasAttachments)
  }

  if (dateFrom) {
    filteredMemos = filteredMemos.filter(memo => {
      const memoDate = new Date(memo.sentAt || '2024-01-01')
      return memoDate >= dateFrom
    })
  }

  if (dateTo) {
    filteredMemos = filteredMemos.filter(memo => {
      const memoDate = new Date(memo.sentAt || '2024-01-01')
      return memoDate <= dateTo
    })
  }

  // Apply sorting
  filteredMemos.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sort) {
      case 'subject':
        aValue = a.subject
        bValue = b.subject
        break
      case 'sentAt':
        aValue = new Date(a.sentAt || '2024-01-01')
        bValue = new Date(b.sentAt || '2024-01-01')
        break
      case 'priority':
        const priorityOrder = { low: 0, medium: 1, high: 2, urgent: 3 }
        aValue = priorityOrder[a.priority]
        bValue = priorityOrder[b.priority]
        break
      default: // createdAt - use sentAt as default since createdAt was removed
        aValue = new Date(a.sentAt || '2024-01-01')
        bValue = new Date(b.sentAt || '2024-01-01')
    }

    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })

  // Apply pagination
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMemos = filteredMemos.slice(startIndex, endIndex)

  const response: PaginatedMemoResponse = {
    data: paginatedMemos,
    total: filteredMemos.length,
    page,
    pageSize,
    hasMore: endIndex < filteredMemos.length
  }

  return response
})