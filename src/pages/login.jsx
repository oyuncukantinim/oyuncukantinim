import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User } from 'lucide-react';
import { loginUser, registerUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let res;
      if (isLogin) {
        res = await loginUser({ email, password });
      } else {
        res = await registerUser({ username, email, password });
      }

      login(res.data.token, res.data.user);
      showToast(isLogin ? 'Hos geldin!' : 'Kayit basarili! Hos geldin!');
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="card p-8 relative overflow-hidden">
        {/* Glow effects */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-neon-purple/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-neon-cyan/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-neon-purple to-neon-cyan rounded-2xl flex items-center justify-center mx-auto mb-4 rotate-12 shadow-neon-purple">
              <Gamepad2 className="text-white" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2">
              {isLogin ? 'Giris Yap' : 'Kayit Ol'}
            </h1>
            <p className="text-gray-500 font-medium">
              {isLogin ? 'Maceraya kaldigin yerden devam et!' : 'Oyuncu Kantinim ailesine katil!'}
            </p>
          </div>

          {/* Toggle */}
          <div className="flex bg-surface-100 p-1 rounded-xl mb-8">
            <button
              onClick={() => { setIsLogin(true); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${isLogin ? 'bg-neon-purple text-white shadow-neon-purple' : 'text-gray-500 hover:text-white'}`}
            >
              Giris Yap
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${!isLogin ? 'bg-neon-purple text-white shadow-neon-purple' : 'text-gray-500 hover:text-white'}`}
            >
              Kayit Ol
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium mb-4">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-1">Kullanici Adi</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Gamer adin..."
                    className="input-field pl-12"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="E-posta adresin..."
                  className="input-field pl-12"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 mb-1">Sifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Sifren..."
                  className="input-field pl-12"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-4 text-lg mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                isLogin ? 'Giris Yap' : 'Hesap Olustur'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
