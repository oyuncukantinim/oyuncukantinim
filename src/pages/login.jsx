import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User } from 'lucide-react';
import { loginUser, registerUser, verifyRegistrationCode } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import useSiteBrand from '../hooks/useSiteBrand';
import SiteBrand from '../components/SiteBrand';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    siteName,
    siteLogo,
    siteLogoText,
    registrationEnabled,
    registrationEmailVerificationEnabled,
    usernameMinLength,
    usernameMaxLength,
    passwordMinLength,
  } = useSiteBrand();

  const { login } = useAuth();
  const { showToast } = useCart();
  const navigate = useNavigate();

  const switchMode = (nextLogin) => {
    setIsLogin(nextLogin);
    setAwaitingVerification(false);
    setVerificationCode('');
    setError('');
  };

  const resendVerificationCode = async () => {
    setError('');
    setLoading(true);
    try {
      await registerUser({ username, email, password });
      showToast('Yeni doğrulama kodu gönderildi.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin && !registrationEnabled) {
        throw new Error('Yeni üyelik şu an kapalı.');
      }

      if (!isLogin && awaitingVerification) {
        const response = await verifyRegistrationCode({ email, code: verificationCode });
        login(response.data.token, response.data.user);
        showToast('E-posta doğrulandı. Hoş geldin!');
        navigate('/profile');
        return;
      }

      const response = isLogin
        ? await loginUser({ email, password })
        : await registerUser({ username, email, password });

      if (!isLogin && response.data?.verification_required) {
        setAwaitingVerification(true);
        setVerificationCode('');
        showToast('Doğrulama kodu e-posta adresine gönderildi.');
        return;
      }

      login(response.data.token, response.data.user);
      showToast(isLogin ? 'Hoş geldin!' : 'Kayıt başarılı! Hoş geldin!');
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="card relative overflow-hidden p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-neon-purple/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-neon-cyan/20 blur-[80px]" />

        <div className="relative z-10">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <SiteBrand
                siteName={siteName}
                siteLogo={siteLogo}
                siteLogoText={siteLogoText}
                showNameWithLogo
                containerClassName="justify-center"
                imageClassName="h-14 w-auto max-w-[240px] object-contain"
                iconWrapperClassName="rounded-xl bg-gradient-to-tr from-neon-purple to-neon-cyan p-2 shadow-neon-purple"
                titleClassName="text-xl font-extrabold glow-text"
              />
            </div>
            <h1 className="mb-2 text-3xl font-extrabold text-slate-900">
              {isLogin ? 'Giriş Yap' : awaitingVerification ? 'E-posta Kodunu Doğrula' : 'Kayıt Ol'}
            </h1>
            <p className="font-medium text-gray-500">
              {isLogin
                ? 'Kaldığın yerden devam et.'
                : awaitingVerification
                  ? `${email} adresine gelen kodu gir.`
                  : `${siteName} topluluğuna katıl.`}
            </p>
          </div>

          <div className="mb-8 flex rounded-xl bg-surface-100 p-1">
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                isLogin ? 'bg-neon-purple text-white shadow-neon-purple' : 'text-gray-500 hover:text-white'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => {
                if (!registrationEnabled) return;
                switchMode(false);
              }}
              disabled={!registrationEnabled}
              className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                !registrationEnabled
                  ? 'cursor-not-allowed text-gray-600 opacity-50'
                  : !isLogin
                    ? 'bg-neon-purple text-white shadow-neon-purple'
                    : 'text-gray-500 hover:text-white'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </div>
          ) : null}

          {!isLogin && !registrationEnabled ? (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
              Yeni üyelik şu an yönetici tarafından kapatıldı.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && !awaitingVerification ? (
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-400">Kullanıcı Adı</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input
                    required
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    minLength={usernameMinLength}
                    maxLength={usernameMaxLength}
                    placeholder="Kullanıcı adın..."
                    className="input-field pl-12"
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-400">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="E-posta adresin..."
                  className="input-field pl-12"
                  disabled={awaitingVerification}
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-gray-400">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={passwordMinLength}
                  placeholder="Şifren..."
                  className="input-field pl-12"
                  disabled={awaitingVerification}
                />
              </div>
            </div>

            {!isLogin && awaitingVerification ? (
              <div>
                <label className="mb-1 block text-sm font-bold text-gray-400">Mail Doğrulama Kodu</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                  <input
                    required
                    type="text"
                    value={verificationCode}
                    onChange={(event) => setVerificationCode(event.target.value.trim().slice(0, 8))}
                    placeholder="Mail ile gelen kod"
                    className="input-field pl-12"
                  />
                </div>
                <button
                  type="button"
                  onClick={resendVerificationCode}
                  className="mt-3 text-sm font-bold text-cyan-300 transition-colors hover:text-cyan-200"
                >
                  Kodu tekrar gönder
                </button>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || (!isLogin && !registrationEnabled)}
              className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : isLogin ? (
                'Giriş Yap'
              ) : awaitingVerification ? (
                'Kodu Doğrula ve Hesap Aç'
              ) : registrationEmailVerificationEnabled ? (
                'Kodu Gönder'
              ) : (
                'Hesap Oluştur'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
