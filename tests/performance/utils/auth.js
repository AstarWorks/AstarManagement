import http from 'k6/http';
import { check } from 'k6';
import { currentEnv, testConfig } from '../config/environments.js';

/**
 * Authenticate user and return access token
 * @param {string} userType - Type of user (lawyer, clerk, client)
 * @returns {string} JWT access token
 */
export function authenticate(userType = 'lawyer') {
  const user = testConfig.testUsers[userType];
  if (!user) {
    throw new Error(`Unknown user type: ${userType}`);
  }

  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password
  });

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = http.post(
    `${currentEnv.baseUrl}/v1/auth/login`,
    loginPayload,
    params
  );

  const loginSuccess = check(response, {
    'login successful': (r) => r.status === 200,
    'token received': (r) => r.json('access_token') !== undefined
  });

  if (!loginSuccess) {
    throw new Error(`Authentication failed for ${userType}: ${response.status} ${response.body}`);
  }

  return response.json('access_token');
}

/**
 * Get authorization headers with JWT token
 * @param {string} token - JWT access token
 * @returns {object} Headers object with Authorization
 */
export function getAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Setup function to authenticate all user types
 * @returns {object} Object containing tokens for all user types
 */
export function setupAuthentication() {
  console.log('Setting up authentication for all user types...');
  
  const tokens = {};
  
  try {
    tokens.lawyer = authenticate('lawyer');
    tokens.clerk = authenticate('clerk');
    tokens.client = authenticate('client');
    
    console.log('Authentication setup completed successfully');
    return tokens;
  } catch (error) {
    console.error('Authentication setup failed:', error.message);
    throw error;
  }
}