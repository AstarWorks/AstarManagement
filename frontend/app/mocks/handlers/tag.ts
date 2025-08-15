import { http, HttpResponse } from 'msw'
import type { ITag, ICreateTagRequest, IUpdateTagRequest } from '@expense/types/expense'
import { TagScope } from '@expense/types/expense'

export const tagHandlers = [
  // Get tags
  http.get('/api/v1/tags', async () => {
    const tags: ITag[] = [
      {
        id: 'tag-1',
        tenantId: 'tenant-1',
        name: '交通費',
        color: '#FF5733',
        scope: TagScope.TENANT,
        usageCount: 10,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user-1'
      },
      {
        id: 'tag-2',
        tenantId: 'tenant-1',
        name: '会議費',
        color: '#33FF57',
        scope: TagScope.TENANT,
        usageCount: 5,
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'user-1'
      }
    ]
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
    
    return HttpResponse.json(tags, { 
      status: 200
    })
  }),

  // Get single tag
  http.get('/api/v1/tags/:id', async ({ params }) => {
    const tag: ITag = {
      id: params.id as string,
      tenantId: 'tenant-1',
      name: 'サンプルタグ',
      color: '#FF5733',
      scope: TagScope.TENANT,
      usageCount: 10,
      lastUsedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150 + 50))
    
    return HttpResponse.json(tag, { 
      status: 200
    })
  }),

  // Create tag
  http.post('/api/v1/tags', async ({ request }) => {
    const body = await request.json() as ICreateTagRequest
    
    const tag: ITag = {
      id: `tag-${Date.now()}`,
      tenantId: 'tenant-1',
      name: body.name,
      color: body.color,
      scope: body.scope || TagScope.TENANT,
      usageCount: 0,
      lastUsedAt: null,
      createdAt: new Date().toISOString(),
      createdBy: 'user-1'
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100))
    
    return HttpResponse.json(tag, { 
      status: 201
    })
  }),

  // Update tag
  http.put('/api/v1/tags/:id', async ({ params, request }) => {
    const body = await request.json() as IUpdateTagRequest
    
    const tag: ITag = {
      id: params.id as string,
      tenantId: 'tenant-1',
      name: body.name || 'Updated Tag',
      color: body.color || '#FF5733',
      scope: body.scope || TagScope.TENANT,
      usageCount: 10,
      lastUsedAt: new Date().toISOString(),
      createdAt: '2025-08-04T00:00:00Z',
      createdBy: 'user-1'
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 250 + 100))
    
    return HttpResponse.json(tag, { 
      status: 200
    })
  }),

  // Delete tag
  http.delete('/api/v1/tags/:id', async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 100))
    
    return new HttpResponse(null, { 
      status: 204
    })
  })
]