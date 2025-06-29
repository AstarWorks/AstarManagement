import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'
import { db } from '../db'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

export const matterHandlers = [
  http.get(`${API_URL}/api/v1/matters`, async ({ request }) => {
    await delay(300)
    
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '20')
    const sort = url.searchParams.get('sort') || 'createdAt,desc'
    
    const matters = db.matter.findMany({
      take: size,
      skip: page * size,
      orderBy: { createdAt: 'desc' }
    })
    
    const totalElements = db.matter.count()
    const totalPages = Math.ceil(totalElements / size)
    
    return HttpResponse.json(
      {
        content: matters,
        pageable: {
          sort: {
            sorted: true,
            unsorted: false,
            empty: false
          },
          pageNumber: page,
          pageSize: size,
          offset: page * size,
          paged: true,
          unpaged: false
        },
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
        first: page === 0,
        numberOfElements: matters.length,
        empty: matters.length === 0
      },
      {
        headers: {
          'X-Correlation-ID': faker.string.uuid()
        }
      }
    )
  }),
  
  http.get(`${API_URL}/api/v1/matters/:id`, async ({ params }) => {
    await delay(200)
    
    const { id } = params
    const matter = db.matter.findFirst({
      where: { id: { equals: id as string } }
    })
    
    if (!matter) {
      return HttpResponse.json(
        {
          type: 'https://api.astermanagement.com/errors/not-found',
          title: 'Resource Not Found',
          status: 404,
          detail: `Matter with ID ${id} not found`,
          instance: `/api/v1/matters/${id}`,
          timestamp: new Date().toISOString(),
          correlationId: faker.string.uuid()
        },
        { status: 404 }
      )
    }
    
    return HttpResponse.json(matter, {
      headers: {
        'X-Correlation-ID': faker.string.uuid()
      }
    })
  }),
  
  http.post(`${API_URL}/api/v1/matters`, async ({ request }) => {
    await delay(400)
    
    const body = await request.json() as any
    
    const newMatter = db.matter.create({
      id: faker.string.uuid(),
      ...body,
      status: body.status || 'NEW',
      priority: body.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'mock-user',
      lastModifiedBy: 'mock-user',
      tags: body.tags || [],
      documents: [],
      memos: [],
      activities: []
    })
    
    return HttpResponse.json(newMatter, {
      status: 201,
      headers: {
        'X-Correlation-ID': faker.string.uuid(),
        'Location': `${API_URL}/api/v1/matters/${newMatter.id}`
      }
    })
  }),
  
  http.put(`${API_URL}/api/v1/matters/:id`, async ({ params, request }) => {
    await delay(300)
    
    const { id } = params
    const body = await request.json() as any
    
    const existingMatter = db.matter.findFirst({
      where: { id: { equals: id as string } }
    })
    
    if (!existingMatter) {
      return HttpResponse.json(
        {
          type: 'https://api.astermanagement.com/errors/not-found',
          title: 'Resource Not Found',
          status: 404,
          detail: `Matter with ID ${id} not found`,
          instance: `/api/v1/matters/${id}`,
          timestamp: new Date().toISOString(),
          correlationId: faker.string.uuid()
        },
        { status: 404 }
      )
    }
    
    const updatedMatter = db.matter.update({
      where: { id: { equals: id as string } },
      data: {
        ...body,
        updatedAt: new Date().toISOString(),
        lastModifiedBy: 'mock-user'
      }
    })
    
    return HttpResponse.json(updatedMatter, {
      headers: {
        'X-Correlation-ID': faker.string.uuid()
      }
    })
  }),
  
  http.delete(`${API_URL}/api/v1/matters/:id`, async ({ params }) => {
    await delay(300)
    
    const { id } = params
    
    const existingMatter = db.matter.findFirst({
      where: { id: { equals: id as string } }
    })
    
    if (!existingMatter) {
      return HttpResponse.json(
        {
          type: 'https://api.astermanagement.com/errors/not-found',
          title: 'Resource Not Found',
          status: 404,
          detail: `Matter with ID ${id} not found`,
          instance: `/api/v1/matters/${id}`,
          timestamp: new Date().toISOString(),
          correlationId: faker.string.uuid()
        },
        { status: 404 }
      )
    }
    
    db.matter.delete({
      where: { id: { equals: id as string } }
    })
    
    return new HttpResponse(null, {
      status: 204,
      headers: {
        'X-Correlation-ID': faker.string.uuid()
      }
    })
  }),
  
  http.get(`${API_URL}/api/v1/matters/search`, async ({ request }) => {
    await delay(400)
    
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    const page = parseInt(url.searchParams.get('page') || '0')
    const size = parseInt(url.searchParams.get('size') || '20')
    
    const allMatters = db.matter.findMany()
    const filteredMatters = allMatters.filter(matter => 
      matter.title.toLowerCase().includes(query.toLowerCase()) ||
      matter.caseNumber.toLowerCase().includes(query.toLowerCase()) ||
      matter.clientName.toLowerCase().includes(query.toLowerCase())
    )
    
    const paginatedMatters = filteredMatters.slice(page * size, (page + 1) * size)
    const totalElements = filteredMatters.length
    const totalPages = Math.ceil(totalElements / size)
    
    return HttpResponse.json(
      {
        content: paginatedMatters,
        pageable: {
          sort: {
            sorted: true,
            unsorted: false,
            empty: false
          },
          pageNumber: page,
          pageSize: size,
          offset: page * size,
          paged: true,
          unpaged: false
        },
        totalElements,
        totalPages,
        last: page >= totalPages - 1,
        first: page === 0,
        numberOfElements: paginatedMatters.length,
        empty: paginatedMatters.length === 0
      },
      {
        headers: {
          'X-Correlation-ID': faker.string.uuid()
        }
      }
    )
  }),
  
  http.get(`${API_URL}/api/v1/matters/search/suggestions`, async ({ request }) => {
    await delay(200)
    
    const url = new URL(request.url)
    const query = url.searchParams.get('q') || ''
    
    const matters = db.matter.findMany({
      take: 10
    })
    
    const suggestions = matters
      .filter(matter => 
        matter.title.toLowerCase().includes(query.toLowerCase()) ||
        matter.caseNumber.toLowerCase().includes(query.toLowerCase()) ||
        matter.clientName.toLowerCase().includes(query.toLowerCase())
      )
      .map(matter => ({
        id: matter.id,
        value: matter.title,
        label: `${matter.caseNumber} - ${matter.title}`,
        category: 'matters'
      }))
    
    return HttpResponse.json(suggestions, {
      headers: {
        'X-Correlation-ID': faker.string.uuid()
      }
    })
  })
]