/**
 * Client-side configuration
 * IMPORTANT: This file should NOT contain any secrets or sensitive information
 */

// API URL - automatically detect environment
export const getApiUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Production environment (blathers.app)
  if (hostname === 'blathers.app' || hostname.includes('blathers')) {
    return 'https://blathers.app';
  }
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Production backend on Railway
  return 'https://capstone-project-production-3cce.up.railway.app';
};

// App configuration
export const appConfig = {
  apiUrl: getApiUrl(),
  authTokenName: 'acnh_token',
  userInfoName: 'acnh_user',
  guestModeName: 'acnh_guest',
  standaloneModeName: 'force_standalone',
  standaloneConfirmedName: 'standalone_confirmed_this_session',
  maxUsernameLength: 10
};

export default appConfig;
