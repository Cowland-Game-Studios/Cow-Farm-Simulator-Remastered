import React from 'react';
import PropTypes from 'prop-types';
import styles from './ErrorBoundary.module.css';

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in child component tree,
 * logs those errors, and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render shows the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to console (could be sent to error reporting service)
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
        
        // Call optional onError callback
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className={styles.errorContainer}>
                    <div className={styles.errorContent}>
                        <h2 className={styles.errorTitle}>🐄 Oops! Something went wrong</h2>
                        <p className={styles.errorMessage}>
                            The farm had a little accident. Don't worry, your cows are safe!
                        </p>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className={styles.errorDetails}>
                                <summary>Error Details</summary>
                                <pre>{this.state.error.toString()}</pre>
                                {this.state.errorInfo && (
                                    <pre>{this.state.errorInfo.componentStack}</pre>
                                )}
                            </details>
                        )}
                        <button 
                            className={styles.retryButton}
                            onClick={this.handleRetry}
                        >
                            Try Again
                        </button>
                        <button 
                            className={styles.reloadButton}
                            onClick={() => window.location.reload()}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.node,
    onError: PropTypes.func,
};

ErrorBoundary.defaultProps = {
    fallback: null,
    onError: null,
};

export default ErrorBoundary;
