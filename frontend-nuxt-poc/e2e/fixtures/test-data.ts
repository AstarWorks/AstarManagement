// Test data factories for E2E tests

export const matterFactory = {
  create: (overrides = {}) => ({
    title: `Test Matter ${Date.now()}`,
    caseNumber: `CASE-${Date.now()}`,
    description: 'Test matter description',
    priority: 'normal',
    status: 'intake',
    clientName: 'Test Client',
    opponentName: 'Test Opponent',
    assignedLawyerId: 'lawyer-1',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    tags: ['test', 'e2e'],
    ...overrides
  }),
  
  createBatch: (count: number, overrides = {}) => {
    return Array.from({ length: count }, (_, i) => 
      matterFactory.create({
        title: `Test Matter ${i + 1}`,
        caseNumber: `CASE-${Date.now()}-${i + 1}`,
        ...overrides
      })
    )
  }
}

export const userFactory = {
  create: (overrides = {}) => ({
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    name: 'Test User',
    role: 'lawyer',
    ...overrides
  })
}

export const mockResponses = {
  matters: {
    success: (matters = matterFactory.createBatch(10)) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(matters)
    }),
    
    empty: () => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    }),
    
    error: (message = 'Server error') => ({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: message })
    })
  },
  
  auth: {
    success: (user = userFactory.create()) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'mock-jwt-token',
        refreshToken: 'mock-refresh-token',
        user: {
          id: 'user-123',
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    }),
    
    unauthorized: () => ({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Invalid credentials' })
    })
  }
}

export const statusTransitions = {
  valid: [
    { from: 'intake', to: 'initial_review' },
    { from: 'initial_review', to: 'investigation' },
    { from: 'investigation', to: 'draft_pleadings' },
    { from: 'draft_pleadings', to: 'filed' },
    { from: 'filed', to: 'discovery' },
    { from: 'discovery', to: 'trial_prep' },
    { from: 'trial_prep', to: 'trial' },
    { from: 'trial', to: 'settlement' },
    { from: 'settlement', to: 'closed' }
  ],
  
  invalid: [
    { from: 'intake', to: 'filed' },
    { from: 'closed', to: 'intake' },
    { from: 'trial', to: 'initial_review' }
  ]
}