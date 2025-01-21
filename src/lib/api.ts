interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

async function api(endpoint: string, options: ApiOptions = {}) {
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token); // Debug log
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('Request headers:', headers); // Debug log
  console.log('Request URL:', `/api${endpoint}`); // Debug log

  const response = await fetch(`/api${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    // If unauthorized and not trying to login/register, redirect to login
    if (response.status === 401 && 
        !endpoint.includes('/auth/login') && 
        !endpoint.includes('/auth/register')) {
      console.log('Unauthorized response, current token:', token); // Debug log
      localStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Please login to continue');
    }
    throw new Error(await response.text());
  }

  return response.json();
}

export default api; 