// Utility functions for worker admin

// Get cookie by name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Make an authenticated API request
async function apiRequest(url, method = 'GET', data = null) {
  try {
    const apiKey = getCookie('apiKey');
    
    if (!apiKey) {
      alert('Authentication error: API key not found. Please log in again.');
      window.location.href = '/login';
      throw new Error('API key not found');
    }
    
    const options = {
      method,
      headers: {
        'X-API-Key': apiKey
      }
    };
    
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
} 