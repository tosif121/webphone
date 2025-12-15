// Debug utilities for production error tracking

export const logError = (error, context = '') => {
  const errorInfo = {
    message: error?.message || 'Unknown error',
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
  };

  console.error('Application Error:', errorInfo);

  // Store in localStorage for debugging
  if (typeof window !== 'undefined') {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('debugErrors') || '[]');
      existingErrors.push(errorInfo);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.shift();
      }
      
      localStorage.setItem('debugErrors', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to store error in localStorage:', e);
    }
  }

  return errorInfo;
};

export const getStoredErrors = () => {
  if (typeof window === 'undefined') return [];
  
  try {
    return JSON.parse(localStorage.getItem('debugErrors') || '[]');
  } catch (e) {
    console.error('Failed to retrieve stored errors:', e);
    return [];
  }
};

export const clearStoredErrors = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('debugErrors');
      localStorage.removeItem('lastError');
      localStorage.removeItem('lastUnhandledError');
      localStorage.removeItem('lastUnhandledRejection');
    } catch (e) {
      console.error('Failed to clear stored errors:', e);
    }
  }
};

// Expose debug functions globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.debugUtils = {
    getStoredErrors,
    clearStoredErrors,
    logError
  };
}

// Add a function to check for hydration issues
export const checkHydrationIssues = () => {
  if (typeof window === 'undefined') return;

  // Check for common hydration issue indicators
  const issues = [];

  // Check for localStorage access during SSR
  if (typeof localStorage !== 'undefined') {
    try {
      const testKey = '__hydration_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (e) {
      issues.push('localStorage access issue: ' + e.message);
    }
  }

  // Check for window object access
  if (typeof window === 'undefined') {
    issues.push('window object not available');
  }

  // Check for document access
  if (typeof document === 'undefined') {
    issues.push('document object not available');
  }

  if (issues.length > 0) {
    console.warn('Potential hydration issues detected:', issues);
    logError(new Error('Hydration issues: ' + issues.join(', ')), 'hydration-check');
  }

  return issues;
};