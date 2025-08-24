/**
 * Server availability check module
 * Handles server connection checks and API URL management
 */

// Define the API URL based on the current hostname
window.API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://blathers.app';

// Function to check if the server is available
async function checkServerAvailability() {
  try {
    console.log('Checking server availability...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    // Use the correct health endpoint path
    const response = await fetch(`${window.API_URL}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Server is available!');
      // Clear any standalone mode flags since server is available
      resetStandaloneFlags();
      window.apiUnavailable = false;
      return true;
    } else {
      console.log('Server returned error:', response.status);
      window.apiUnavailable = true;
      return false;
    }
  } catch (error) {
    console.error('Server availability check failed:', error);
    window.apiUnavailable = true;
    return false;
  }
}

// Function to reset standalone mode flags
function resetStandaloneFlags() {
  if (window.location.protocol !== 'file:') {
    localStorage.removeItem('force_standalone');
    localStorage.removeItem('standalone_confirmed_this_session');
    console.log('Standalone mode flags cleared');
  }
}

// Function to determine if we're in standalone mode
function isStandaloneMode() {
  // Check if running via file:// protocol
  const isFileProtocol = window.location.protocol === 'file:';
  
  // Check if API has been marked as unavailable
  const apiUnavailable = window.apiUnavailable === true;
  
  // Check if force_standalone is set in localStorage
  const forceStandalone = localStorage.getItem('force_standalone') === 'true';
  
  // Guest users are NOT standalone mode users if the server is available
  return isFileProtocol || apiUnavailable || forceStandalone;
}

// Export the functions to the global scope
window.checkServerAvailability = checkServerAvailability;
window.resetStandaloneFlags = resetStandaloneFlags;
window.isStandaloneMode = isStandaloneMode;

// Run the check when the document is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Reset standalone flags first
  resetStandaloneFlags();
  
  // Then check server availability
  await checkServerAvailability();
});
