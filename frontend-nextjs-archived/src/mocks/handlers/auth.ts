import { http, HttpResponse, delay } from 'msw'
import { faker } from '@faker-js/faker'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

interface LoginRequest {
  username: string
  password: string
}

interface LoginResponse {
  token: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    username: string
    email: string
    roles: string[]
    permissions: string[]
  }
}

const generateToken = () => faker.string.alphanumeric(64)

export const authHandlers = [
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    await delay(500)
    
    const body = await request.json() as LoginRequest
    
    if (!body.username || !body.password) {
      return HttpResponse.json(
        {
          type: 'https://api.astermanagement.com/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: 'Username and password are required',
          instance: `/auth/login`,
          timestamp: new Date().toISOString(),
          correlationId: faker.string.uuid()
        },
        { status: 400 }
      )
    }
    
    if (body.password === 'wrongpassword') {
      return HttpResponse.json(
        {
          type: 'https://api.astermanagement.com/errors/authentication',
          title: 'Authentication Failed',
          status: 401,
          detail: 'Invalid username or password',
          instance: `/auth/login`,
          timestamp: new Date().toISOString(),
          correlationId: faker.string.uuid()
        },
        { status: 401 }
      )
    }
    
    const mockUser = {
      id: faker.string.uuid(),
      username: body.username,
      email: `${body.username}@astermanagement.com`,
      roles: body.username === 'admin' ? ['LAWYER', 'ADMIN'] : ['LAWYER'],
      permissions: [
        'matter:read',
        'matter:write',
        'matter:delete',
        'document:read',
        'document:write',
        'memo:read',
        'memo:write',
        'expense:read',
        'expense:write'
      ]
    }
    
    const response: LoginResponse = {
      token: generateToken(),
      refreshToken: generateToken(),
      expiresIn: 3600,
      user: mockUser
    }
    
    return HttpResponse.json(response, {
      headers: {
        'X-Correlation-ID': faker.string.uuid()
      }
    })
  }),
  
  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    await delay(300)
    
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          type: 'https://api.astermanagement.com/errors/authentication',
          title: 'Authentication Required',
          status: 401,
          detail: 'No valid refresh token provided',
          instance: `/auth/refresh`,
          timestamp: new Date().toISOString(),
          correlationId: faker.string.uuid()
        },
        { status: 401 }
      )
    }
    
    const response = {
      token: generateToken(),
      refreshToken: generateToken(),
      expiresIn: 3600
    }
    
    return HttpResponse.json(response, {
      headers: {
        'X-Correlation-ID': faker.string.uuid()
      }
    })
  }),
  
  http.post(`${API_URL}/auth/logout`, async () => {
    await delay(200)
    
    return HttpResponse.json(
      { message: 'Logged out successfully' },
      {
        headers: {
          'X-Correlation-ID': faker.string.uuid()
        }
      }
    )
  })
]