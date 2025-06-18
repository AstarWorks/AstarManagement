export interface TestUser {
  email: string;
  password: string;
  twoFactorCode?: string;
  name: string;
  role: 'LAWYER' | 'CLERK' | 'CLIENT';
}

export const TestUsers = {
  lawyer: {
    email: 'test-lawyer@astermanagement.com',
    password: 'LawyerPass123!',
    twoFactorCode: '123456',
    name: 'Test Lawyer',
    role: 'LAWYER'
  } as TestUser,
  
  clerk: {
    email: 'test-clerk@astermanagement.com',
    password: 'ClerkPass123!',
    twoFactorCode: '234567',
    name: 'Test Clerk',
    role: 'CLERK'
  } as TestUser,
  
  client: {
    email: 'test-client@example.com',
    password: 'ClientPass123!',
    twoFactorCode: '345678',
    name: 'Test Client',
    role: 'CLIENT'
  } as TestUser
} as const;

// Test user without 2FA for simpler tests
export const SimpleTestUsers = {
  lawyer: {
    email: 'simple-lawyer@astermanagement.com',
    password: 'SimpleLawyer123!',
    name: 'Simple Test Lawyer',
    role: 'LAWYER'
  } as TestUser,
  
  clerk: {
    email: 'simple-clerk@astermanagement.com',
    password: 'SimpleClerk123!',
    name: 'Simple Test Clerk',
    role: 'CLERK'
  } as TestUser
} as const;