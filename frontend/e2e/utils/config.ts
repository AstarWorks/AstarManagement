export const testConfig = {
  baseURL: process.env.BASE_URL || 'http://localhost:3000',
  apiURL: process.env.API_URL || 'http://localhost:8080',
  testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  retryCount: parseInt(process.env.RETRY_COUNT || '2'),
  headless: process.env.HEADLESS !== 'false',
  slowMo: parseInt(process.env.SLOW_MO || '0'),
  
  // Test user credentials
  defaultPassword: 'TestPass123!',
  default2FACode: '123456',
  
  // Timeouts for specific operations
  timeouts: {
    navigation: 30000,
    elementVisible: 10000,
    apiCall: 15000,
    fileUpload: 30000
  },
  
  // Test data prefixes
  testDataPrefix: {
    matter: 'TEST-',
    user: 'test-',
    document: 'TEST_DOC_'
  }
};

// Environment-specific configuration
export const getEnvConfig = () => {
  const env = process.env.TEST_ENV || 'local';
  
  switch (env) {
    case 'staging':
      return {
        baseURL: 'https://staging.astermanagement.com',
        apiURL: 'https://api-staging.astermanagement.com'
      };
    case 'production':
      return {
        baseURL: 'https://astermanagement.com',
        apiURL: 'https://api.astermanagement.com'
      };
    default:
      return {
        baseURL: testConfig.baseURL,
        apiURL: testConfig.apiURL
      };
  }
};