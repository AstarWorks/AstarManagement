import { ref, computed, onMounted } from 'vue'
import type { Document, DocumentListOptions, DocumentSearchResult } from '~/types/document'

export function useDocumentListView(matterId?: string, options: DocumentListOptions = {}) {
  // State
  const documents = ref<Document[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(1)
  const totalCount = ref(0)
  
  // Options with defaults
  const pageSize = options.pageSize || 50
  const sortConfig = options.sortConfig || { field: 'modifiedDate', direction: 'desc' }
  const filterConfig = options.filterConfig || { fileTypes: [], dateRange: null, sizeRange: null, tags: [] }

  // Mock data generator
  const generateMockDocuments = (): Document[] => {
    const mockDocs: Document[] = [
      {
        id: '1',
        fileName: 'Contract_Agreement_2024.pdf',
        description: 'Main service agreement for 2024',
        mimeType: 'application/pdf',
        size: 2_450_000,
        createdDate: '2024-01-15T10:30:00Z',
        modifiedDate: '2024-01-20T14:15:00Z',
        createdBy: { id: 'user1', name: 'John Smith', avatar: '/avatars/john.jpg' },
        matterId: matterId || 'matter1',
        tags: ['contract', 'legal', 'important'],
        version: 2,
        isShared: true,
        syncStatus: 'synced'
      },
      {
        id: '2',
        fileName: 'Evidence_Photos.zip',
        description: 'Photo evidence from site inspection',
        mimeType: 'application/zip',
        size: 15_600_000,
        createdDate: '2024-01-10T09:00:00Z',
        modifiedDate: '2024-01-10T09:00:00Z',
        createdBy: { id: 'user2', name: 'Sarah Johnson', avatar: '/avatars/sarah.jpg' },
        matterId: matterId || 'matter1',
        tags: ['evidence', 'photos'],
        syncStatus: 'synced'
      },
      {
        id: '3',
        fileName: 'Financial_Report_Q1.xlsx',
        description: 'Quarterly financial analysis',
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: 890_000,
        createdDate: '2024-02-01T16:45:00Z',
        modifiedDate: '2024-02-05T11:20:00Z',
        createdBy: { id: 'user3', name: 'Mike Davis', avatar: '/avatars/mike.jpg' },
        matterId: matterId || 'matter1',
        tags: ['financial', 'report'],
        isLocked: true,
        syncStatus: 'synced'
      },
      {
        id: '4',
        fileName: 'Meeting_Notes_Draft.docx',
        description: 'Draft notes from client meeting',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 125_000,
        createdDate: '2024-02-10T13:15:00Z',
        modifiedDate: '2024-02-12T08:30:00Z',
        createdBy: { id: 'user1', name: 'John Smith', avatar: '/avatars/john.jpg' },
        matterId: matterId || 'matter1',
        tags: ['meeting', 'draft'],
        syncStatus: 'syncing'
      },
      {
        id: '5',
        fileName: 'Court_Filing_Response.pdf',
        description: 'Response to court filing dated Feb 15',
        mimeType: 'application/pdf',
        size: 3_200_000,
        createdDate: '2024-02-15T17:00:00Z',
        modifiedDate: '2024-02-15T17:00:00Z',
        createdBy: { id: 'user2', name: 'Sarah Johnson', avatar: '/avatars/sarah.jpg' },
        matterId: matterId || 'matter1',
        tags: ['court', 'filing', 'response'],
        version: 1,
        syncStatus: 'pending'
      },
      {
        id: '6',
        fileName: 'Client_Presentation.pptx',
        description: 'Presentation for client review meeting',
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        size: 8_750_000,
        createdDate: '2024-02-18T10:00:00Z',
        modifiedDate: '2024-02-20T15:30:00Z',
        createdBy: { id: 'user3', name: 'Mike Davis', avatar: '/avatars/mike.jpg' },
        matterId: matterId || 'matter1',
        tags: ['presentation', 'client'],
        isShared: true,
        syncStatus: 'synced'
      }
    ]

    // Generate additional mock documents for testing pagination
    for (let i = 7; i <= 100; i++) {
      const fileTypes = [
        { ext: 'pdf', mime: 'application/pdf' },
        { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
        { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
        { ext: 'jpg', mime: 'image/jpeg' },
        { ext: 'png', mime: 'image/png' }
      ]
      
      const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
      const tags = ['document', 'legal', 'important', 'draft', 'final', 'review']
      const selectedTags = tags.slice(0, Math.floor(Math.random() * 3) + 1)
      
      mockDocs.push({
        id: `doc-${i}`,
        fileName: `Document_${i.toString().padStart(3, '0')}.${fileType.ext}`,
        description: `Mock document ${i} for testing`,
        mimeType: fileType.mime,
        size: Math.floor(Math.random() * 10_000_000) + 100_000,
        createdDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        modifiedDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: {
          id: `user-${Math.floor(Math.random() * 5) + 1}`,
          name: ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson'][Math.floor(Math.random() * 5)]
        },
        matterId: matterId || 'matter1',
        tags: selectedTags,
        syncStatus: ['synced', 'syncing', 'pending'][Math.floor(Math.random() * 3)] as any
      })
    }

    return mockDocs
  }

  // API simulation
  const fetchDocuments = async (page = 1, size = pageSize): Promise<DocumentSearchResult> => {
    loading.value = true
    error.value = null

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      const allDocs = generateMockDocuments()
      const startIndex = (page - 1) * size
      const endIndex = startIndex + size
      const pageDocuments = allDocs.slice(startIndex, endIndex)

      return {
        documents: pageDocuments,
        total: allDocs.length,
        hasMore: endIndex < allDocs.length,
        nextCursor: endIndex < allDocs.length ? `cursor-${endIndex}` : undefined
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch documents'
      error.value = errorMessage
      throw err
    } finally {
      loading.value = false
    }
  }

  // Actions
  const loadDocuments = async (page = 1) => {
    try {
      const result = await fetchDocuments(page)
      
      if (page === 1) {
        documents.value = result.documents
      } else {
        documents.value.push(...result.documents)
      }
      
      totalCount.value = result.total
      hasMore.value = result.hasMore
      currentPage.value = page
    } catch (err) {
      console.error('Failed to load documents:', err)
    }
  }

  const loadMoreDocuments = async () => {
    if (!hasMore.value || loading.value) return
    await loadDocuments(currentPage.value + 1)
  }

  const refreshDocuments = async () => {
    currentPage.value = 1
    await loadDocuments(1)
  }

  const addDocument = (document: Document) => {
    documents.value.unshift(document)
    totalCount.value++
  }

  const updateDocument = (documentId: string, updates: Partial<Document>) => {
    const index = documents.value.findIndex(doc => doc.id === documentId)
    if (index !== -1) {
      documents.value[index] = { ...documents.value[index], ...updates }
    }
  }

  const removeDocument = (documentId: string) => {
    const index = documents.value.findIndex(doc => doc.id === documentId)
    if (index !== -1) {
      documents.value.splice(index, 1)
      totalCount.value--
    }
  }

  // Initialize
  onMounted(() => {
    loadDocuments()
  })

  return {
    // State
    documents: readonly(documents),
    loading: readonly(loading),
    error: readonly(error),
    hasMore: readonly(hasMore),
    currentPage: readonly(currentPage),
    totalCount: readonly(totalCount),

    // Actions
    loadDocuments,
    loadMoreDocuments,
    refreshDocuments,
    addDocument,
    updateDocument,
    removeDocument
  }
}

export default useDocumentListView