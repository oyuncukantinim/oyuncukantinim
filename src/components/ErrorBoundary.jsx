import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
                <AlertTriangle size={32} className="text-red-500" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Bir şeyler ters gitti</h1>
            <p className="text-gray-500 mb-6 text-sm">
              Beklenmedik bir hata oluştu. Sayfayı yenileyerek tekrar deneyebilirsiniz.
            </p>
            {this.state.error?.message ? (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-xs text-red-600 text-left font-mono break-all">
                {this.state.error.message}
              </div>
            ) : null}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-violet-500 transition-colors"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
