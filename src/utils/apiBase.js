import Axios from 'axios';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

// Create axios instance with default configuration
const axiosInstance = Axios.create({
  baseURL: process.env.REACT_APP_API_URL || '',
  timeout: 30000, // 30 seconds timeout
});

// Function to generate headers for requests
function generateHeaders(contentType = 'application/json') {
  const headers = {
    'Content-Type': contentType,
  };

  const token = Cookies.get('samwad_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return { headers };
}

function logoutAndRedirect() {
  // Remove token immediately
  Cookies.remove('samwad_token');

  // Only redirect if not already on a login page
  const currentPath = window.location.pathname;
  if (!['/login', '/'].includes(currentPath)) {
    window.location.href = '/login';
  }
}

// Setup request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Add token to every request if available
    const token = Cookies.get('samwad_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Setup response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const errorMessage = error?.response?.data?.message || 'Request failed';

    // Handle specific error cases
    if (status === 401 || status === 403) {
      // Unauthorized or Forbidden - clear session
      toast.error('Your session has expired. Please log in again.');
      logoutAndRedirect();
    } else if (status === 502) {
      toast.error('Server is currently unavailable. Please try again later.');
    } else {
      // Show error message for other cases
      toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

// Helper functions for API requests
async function makeRequest(method, url, params, contentType = 'application/json') {
  try {
    const config = {
      headers: { 'Content-Type': contentType },
    };

    let response;

    switch (method.toUpperCase()) {
      case 'GET':
        response = await axiosInstance.get(url, { ...config, params });
        break;
      case 'POST':
        response = await axiosInstance.post(url, params, config);
        break;
      case 'PUT':
        response = await axiosInstance.put(url, params, config);
        break;
      case 'DELETE':
        response = await axiosInstance.delete(url, { ...config, data: params });
        break;
      default:
        return errorResponse({ message: `Unsupported request method: ${method}` });
    }

    return handleResponse(response.data);
  } catch (error) {
    // Return standardized error response
    return errorResponse({
      message: error?.response?.data?.message || 'Request failed',
    });
    // Note: We don't need to handle error.response.status here as it's already handled by the axios interceptor
  }
}

// Standard fetcher for JSON requests
async function fetcher(method, url, params) {
  return makeRequest(method, url, params);
}

// Specialized fetcher for file uploads
async function filesFetch(method, url, params) {
  const formData = new FormData();
  Object.keys(params).forEach((key) => formData.append(key, params[key]));

  return makeRequest(method, url, formData, 'multipart/form-data');
}

// Helper functions for standardizing responses
function handleResponse(response) {
  if (response) {
    return successResponse(response);
  } else {
    return errorResponse(response);
  }
}

function successResponse(response) {
  return {
    status: true,
    data: response,
    message: response?.message || 'Operation successful',
  };
}

function errorResponse(response) {
  return {
    status: false,
    data: null,
    message: response?.message || 'An error occurred',
  };
}

export { fetcher, filesFetch };
