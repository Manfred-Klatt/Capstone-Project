// Server availability check module
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:3000' 
  : 'https://blathers.app';

// Function to check if the server is available
async function checkServerAvailability() {
  try {
    console.log('Checking server availability...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch(`${API_URL}/api/v1/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log('Server is available!');
      // Clear any standalone mode flags since server is available
      localStorage.removeItem('force_standalone');
      localStorage.removeItem('standalone_confirmed_this_session');
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

// Export the functions
window.checkServerAvailability = checkServerAvailability;
window.resetStandaloneFlags = resetStandaloneFlags;

// Run the check when the script loads
document.addEventListener('DOMContentLoaded', async () => {
  // Reset standalone flags first
  resetStandaloneFlags();
  
  // Then check server availability
  await checkServerAvailability();
});
