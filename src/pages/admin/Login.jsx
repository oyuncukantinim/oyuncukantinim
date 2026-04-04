import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield } from 'lucide-react';
import { adminLogin } from '../../lib/adminApi';
import useSiteBrand from '../../hooks/useSiteBrand';
import SiteBrand from '../../components/SiteBrand';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { siteName, siteLogo } = useSiteBrand();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await adminLogin(email, password);
      localStorage.setItem('admin_token', response.data.token);
      localStorage.setItem('admin_user', JSON.stringify(response.data.user));
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <SiteBrand
              siteName={siteName}
              siteLogo={siteLogo}
              fallback="shield"
              containerClassName="justify-center"
              imageClassName="h-16 w-auto max-w-[260px] object-contain"
              iconWrapperClassName="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30"
              titleClassName="text-2xl font-extrabold text-white"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Girişi</h1>
          <p className="mt-1 text-sm text-gray-400">{siteName} yönetim paneli</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-gray-800 p-6 shadow-2xl">
          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-300">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-white/10 bg-gray-700 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-colors focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-bold text-gray-300">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-gray-700 px-4 py-2.5 pr-10 text-sm text-white placeholder-gray-500 transition-colors focus:border-violet-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 py-2.5 font-bold text-white transition-all hover:from-violet-500 hover:to-cyan-500 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <Shield size={16} /> Giriş Yap
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
