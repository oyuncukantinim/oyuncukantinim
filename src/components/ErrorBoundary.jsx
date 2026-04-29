import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

function isChunkLoadError(error) {
  const text = `${error?.name || ''} ${error?.message || ''}`.toLowerCase();
  return text.includes('chunkloaderror')
    || text.includes('failed to fetch dynamically imported module')
    || text.includes('error loading dynamically imported module')
    || text.includes('importing a module script failed')
    || text.includes('loading chunk')
    || text.includes('unable to preload css')
    || text.includes('sayfa modulu zaman asimina ugradi');
}

function getCurrentScriptSignature() {
  if (typeof document === 'undefined') return 'server';
  const scripts = Array.from(document.querySelectorAll('script[type="module"][src]'));
  return scripts.map((script) => script.getAttribute('src')).join('|') || 'unknown';
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, reloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, reloading: false });
    }
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);

    if (this.props.reloadOnChunkError !== false && isChunkLoadError(error) && typeof window !== 'undefined') {
      const reloadKey = `ok_chunk_reload:${window.location.pathname}:${getCurrentScriptSignature()}`;
      const hasReloaded = sessionStorage.getItem(reloadKey) === '1';

      if (!hasReloaded) {
        sessionStorage.setItem(reloadKey, '1');
        this.setState({ reloading: true });
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.state.reloading) {
        return (
          <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
            <div className="text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
              <p className="mt-4 text-sm font-bold text-slate-600 dark:text-slate-300">Sayfa güncelleniyor...</p>
            </div>
          </div>
        );
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-slate-950">
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
