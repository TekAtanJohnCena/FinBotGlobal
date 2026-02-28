// src/components/ErrorBoundary.jsx
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });

        // Production: send to error tracking service (Sentry, LogRocket, etc.)
        if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate with error tracking service
            // e.g., Sentry.captureException(error, { extra: errorInfo });
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0b0c0f] flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-[#1E1F20] border border-zinc-800 rounded-2xl p-8 text-center shadow-2xl">
                        {/* Error Icon */}
                        <div className="w-16 h-16 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">
                            Bir Şeyler Ters Gitti
                        </h2>
                        <p className="text-zinc-400 text-sm mb-6">
                            Beklenmeyen bir hata oluştu. Lütfen sayfayı yeniden yükleyin veya tekrar deneyin.
                        </p>

                        {/* Error Details (only in development) */}
                        {process.env.NODE_ENV !== 'production' && this.state.error && (
                            <div className="mb-6 p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-left">
                                <p className="text-red-400 text-xs font-mono break-all">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Tekrar Dene
                            </button>
                            <button
                                onClick={this.handleReload}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-semibold transition-colors"
                            >
                                Sayfayı Yenile
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
