import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-screen flex items-center justify-center bg-background" 
          style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        >
          <div className="text-center max-w-md" style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div className="mb-4" style={{ marginBottom: '16px' }}>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
                Something went wrong
              </h1>
              <p className="text-muted-foreground" style={{ color: '#6b7280', marginBottom: '16px' }}>
                The application encountered an error. Please try refreshing the page.
              </p>
            </div>
            <div className="space-y-2" style={{ marginBottom: '16px' }}>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer',
                  marginBottom: '8px'
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/mobile/login'}
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                style={{ 
                  width: '100%', 
                  padding: '8px 16px', 
                  backgroundColor: '#f3f4f6', 
                  color: '#374151', 
                  borderRadius: '6px', 
                  border: 'none', 
                  cursor: 'pointer'
                }}
              >
                Go to Login
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left text-xs text-muted-foreground" style={{ textAlign: 'left', fontSize: '12px', color: '#6b7280' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Error Details</summary>
                <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;