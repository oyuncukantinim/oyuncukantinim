import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound, Lock, Mail, User } from 'lucide-react';
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  verifyRegistrationCode,
} from '../lib/api';
import { useAuth } from '../context/useAuth';
import { useCart } from '../context/useCart';
import useSiteBrand from '../hooks/useSiteBrand';
import SiteBrand from '../components/SiteBrand';

const RESET_TOKEN_STORAGE_KEY = 'ok_pending_reset_token';

export default function LoginPage() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchParams] = useSearchParams();
  const queryResetToken = searchParams.get('reset') || '';
  const [resetToken, setResetToken] = useState(() => {
    if (typeof window === 'undefined') return queryResetToken;
    return queryResetToken || sessionStorage.getItem(RESET_TOKEN_STORAGE_KEY) || '';
  });
  const navigate = useNavigate();

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

  useEffect(() => {
    if (queryResetToken) {
      setResetToken(queryResetToken);
      try {
        sessionStorage.setItem(RESET_TOKEN_STORAGE_KEY, queryResetToken);
      } catch {
        // Ignore storage access failures.
      }
      setMode('reset');
      setError('');
      setAwaitingVerification(false);
      navigate('/login', { replace: true });
      return;
    }

    if (resetToken) {
      setMode('reset');
      setError('');
      setAwaitingVerification(false);
    }
  }, [navigate, queryResetToken, resetToken]);

  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';

  const clearResetToken = () => {
    setResetToken('');
    try {
      sessionStorage.removeItem(RESET_TOKEN_STORAGE_KEY);
    } catch {
      // Ignore storage access failures.
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setAwaitingVerification(false);
    setVerificationCode('');
    setResetRequested(false);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    if (resetToken && nextMode !== 'reset') {
      clearResetToken();
      navigate('/login', { replace: true });
    }
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
      if (isForgot) {
        await requestPasswordReset({ email });
        setResetRequested(true);
        showToast('Şifre sıfırlama bağlantısı e-posta adresine gönderildi.');
        return;
      }

      if (isReset) {
        if (!resetToken) throw new Error('Şifre sıfırlama bağlantısı geçersiz.');
        if (newPassword !== confirmPassword) throw new Error('Yeni şifreler eşleşmiyor.');
        await resetPassword({ token: resetToken, password: newPassword });
        clearResetToken();
        showToast('Şifren güncellendi. Yeni şifrenle giriş yapabilirsin.');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        switchMode('login');
        navigate('/login', { replace: true });
        return;
      }

      if (isRegister && !registrationEnabled) {
        throw new Error('Yeni üyelik şu an kapalı.');
      }

      if (isRegister && awaitingVerification) {
        const response = await verifyRegistrationCode({ email, code: verificationCode });
        login(response.data.user);
        showToast('E-posta doğrulandı. Hoş geldin!');
        navigate('/profile');
        return;
      }

      const response = isLogin
        ? await loginUser({ email, password })
        : await registerUser({ username, email, password });

      if (isRegister && response.data?.verification_required) {
        setAwaitingVerification(true);
        setVerificationCode('');
        showToast('Doğrulama kodu e-posta adresine gönderildi.');
        return;
      }

      login(response.data.user);
      showToast(isLogin ? 'Hoş geldin!' : 'Kayıt başarılı! Hoş geldin!');
      navigate('/profile');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = isReset
    ? 'Yeni Şifre Belirle'
    : isForgot
      ? 'Şifreni Sıfırla'
      : isLogin
        ? 'Giriş Yap'
        : awaitingVerification
          ? 'E-posta Kodunu Doğrula'
          : 'Kayıt Ol';

  const description = isReset
    ? 'Hesabın için güçlü ve yeni bir şifre oluştur.'
    : isForgot
      ? 'Kayıtlı e-posta adresini yaz, sana güvenli bir sıfırlama bağlantısı gönderelim.'
      : isLogin
        ? 'Kaldığın yerden devam et.'
        : awaitingVerification
          ? `${email} adresine gelen kodu gir.`
          : `${siteName} topluluğuna katıl.`;

  const submitLabel = loading
    ? ''
    : isForgot
      ? 'Sıfırlama Bağlantısı Gönder'
      : isReset
        ? 'Şifremi Güncelle'
        : isLogin
          ? 'Giriş Yap'
          : awaitingVerification
            ? 'Kodu Doğrula ve Hesap Aç'
            : registrationEmailVerificationEnabled
              ? 'Kodu Gönder'
              : 'Hesap Oluştur';

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
            <div className="mb-3 flex justify-center">
              {(isForgot || isReset) && (
                <div className="rounded-2xl border border-neon-purple/20 bg-neon-purple/10 p-3 text-neon-purple">
                  <KeyRound size={24} />
                </div>
              )}
            </div>
            <h1 className="mb-2 text-3xl font-extrabold text-slate-900">{title}</h1>
            <p className="font-medium text-gray-500">{description}</p>
          </div>

          {!isForgot && !isReset ? (
            <div className="mb-8 flex rounded-xl bg-surface-100 p-1">
              <button
                type="button"
                onClick={() => switchMode('login')}
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
                  switchMode('register');
                }}
                disabled={!registrationEnabled}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  !registrationEnabled
                    ? 'cursor-not-allowed text-gray-600 opacity-50'
                    : isRegister
                      ? 'bg-neon-purple text-white shadow-neon-purple'
                      : 'text-gray-500 hover:text-white'
                }`}
              >
                Kayıt Ol
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition-colors hover:text-neon-purple"
            >
              <ArrowLeft size={16} />
              Giriş ekranına dön
            </button>
          )}

          {error ? (
            <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400">
              {error}
            </div>
          ) : null}

          {resetRequested ? (
            <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500">
              Eğer bu e-posta sistemde kayıtlıysa şifre sıfırlama bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et.
            </div>
          ) : null}

          {isRegister && !registrationEnabled ? (
            <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm font-medium text-amber-300">
              Yeni üyelik şu an yönetici tarafından kapatıldı.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && !awaitingVerification ? (
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

            {!isReset ? (
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
            ) : null}

            {(isLogin || isRegister) && (
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
                {isLogin ? (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="mt-3 text-sm font-bold text-neon-purple transition-colors hover:text-neon-cyan"
                  >
                    Şifremi unuttum
                  </button>
                ) : null}
              </div>
            )}

            {isReset ? (
              <>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-400">Yeni Şifre</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input
                      required
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      minLength={passwordMinLength}
                      placeholder="Yeni şifren..."
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-bold text-gray-400">Yeni Şifre Tekrar</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                    <input
                      required
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={passwordMinLength}
                      placeholder="Yeni şifreni tekrar yaz..."
                      className="input-field pl-12"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {isRegister && awaitingVerification ? (
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
              disabled={loading || (isRegister && !registrationEnabled)}
              className="btn-primary mt-4 flex w-full items-center justify-center gap-2 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                submitLabel
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
