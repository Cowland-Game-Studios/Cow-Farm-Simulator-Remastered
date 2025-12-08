import React, { Component, ReactNode, ErrorInfo } from 'react';
import styles from './ErrorBoundary.module.css';

const BROKEN_FENCE = `
    |     |     |          |     |
    |     |     |    ____  |     |
    |     |     |   /    \\ |     |
====|=====|=====|===|    |=|=====|====
    |     |     |    \\__/  |     |
    |     |         /      |     |
    |     |        /            
         /       /        |     |
        /   ____/         |     |
       /                  |     |
`;

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors and displays a simple fallback UI.
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { 
            hasError: false, 
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
        
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }
    }

    render(): ReactNode {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const isDev = process.env.NODE_ENV === 'development';
            const errorText = this.state.error 
                ? `${this.state.error.toString()}\n\n${this.state.errorInfo?.componentStack || ''}`
                : 'Unknown error';

            return (
                <div className={styles.container}>
                    <h1 className={styles.title}>Oops!</h1>
                    <pre className={styles.fence}>{BROKEN_FENCE}</pre>
                    {isDev && (
                        <textarea 
                            className={styles.errorBox}
                            readOnly
                            value={errorText}
                        />
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

