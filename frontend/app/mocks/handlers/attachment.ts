import { http, HttpResponse } from 'msw'
import type { IAttachment } from '~/types/expense'
import { AttachmentStatus } from '~/types/expense'

export const attachmentHandlers = [
  // Upload attachment
  http.post('/api/v1/attachments', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return HttpResponse.json(
        { error: 'No file provided' }, 
        { status: 400 }
      )
    }
    
    const attachment: IAttachment = {
      id: `att-${Date.now()}`,
      tenantId: 'tenant-1',
      fileName: file.name,
      originalName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      storagePath: `/storage/attachments/${Date.now()}_${file.name}`,
      status: AttachmentStatus.UPLOADED,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'user-1'
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 300))
    
    return HttpResponse.json(attachment, { 
      status: 201
    })
  }),

  // Get attachment metadata
  http.get('/api/v1/attachments/:id', async ({ params }) => {
    const attachment: IAttachment = {
      id: params.id as string,
      tenantId: 'tenant-1',
      fileName: 'document.pdf',
      originalName: 'document.pdf',
      fileSize: 1024 * 1024,
      mimeType: 'application/pdf',
      storagePath: '/storage/attachments/document.pdf',
      status: AttachmentStatus.UPLOADED,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'user-1'
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50))
    
    return HttpResponse.json(attachment, { 
      status: 200
    })
  }),

  // Download attachment
  http.get('/api/v1/attachments/:id/download', async () => {
    // Mock file content
    const mockContent = new TextEncoder().encode('Mock file content')
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    return new HttpResponse(mockContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="document.pdf"'
      }
    })
  }),

  // Delete attachment
  http.delete('/api/v1/attachments/:id', async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
    
    return new HttpResponse(null, { 
      status: 204
    })
  }),

  // Get attachments for an expense
  http.get('/api/v1/expenses/:expenseId/attachments', async () => {
    const attachments: IAttachment[] = []
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
    
    return HttpResponse.json(attachments, { 
      status: 200
    })
  })
]