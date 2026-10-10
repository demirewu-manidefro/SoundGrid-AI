import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Eye, EyeOff, Check, AlertCircle, Loader2 } from 'lucide-react';
import { Logo } from '../common/Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login, register, forceDemoLogin } = useAuth();

  // Password Security Rules
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const isPasswordValid = hasMinLen && hasUpper && hasNumber && hasSpecial;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && !isPasswordValid) {
      setError('Please meet all password security requirements.');
      return;
    }

    setIsLoading(true);
    
    try {
      if (mode === 'login') {
        try {
          await login(email, password);
          onClose();
        } catch (err: any) {
          setError(err.message || 'Invalid email or password.');
        }
      } else {
        try {
          await register({
            email,
            password,
            fullName: fullName || 'Demo User',
            organizationName: 'Demo Org',
            role: 'ENTERPRISE_ADMIN'
          });
          onClose();
        } catch (err: any) {
          setError(err.message || 'Registration failed. Email might already be in use.');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      // Simulate secure OAuth delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      forceDemoLogin();
      onClose();
    } catch (err) {
      console.error(err);
      setError('Google Authentication Failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setError(null);
    setPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-[420px] rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] shadow-2xl overflow-hidden pt-6">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-[#666] hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header with Logo */}
        <div className="flex flex-col items-center justify-center px-6 pb-2 pt-2">
          <Logo className="h-12 mb-4" showText={false} />
          <h2 className="text-xl font-bold text-white tracking-wide">
            {mode === 'login' ? 'Sign in to SoundGrid' : 'Join SoundGrid'}
          </h2>
          {mode === 'register' && (
            <p className="text-[#888] text-xs mt-2 text-center">
              Secure enterprise acoustic intelligence.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="p-6 pt-4 space-y-5">
          {/* Custom Google Button */}
          <button
            type="button"
            onClick={handleCustomGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#333] bg-[#222222] px-4 py-3.5 text-[14px] font-bold text-white transition-all hover:bg-[#2a2a2a] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z" fill="#EA4335" />
                <path d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L20.03 21.15C22.35 19.01 23.49 15.92 23.49 12.275Z" fill="#4285F4" />
                <path d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z" fill="#FBBC05" />
                <path d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z" fill="#34A853" />
              </svg>
            )}
            {isGoogleLoading ? 'Authenticating...' : mode === 'login' ? 'Sign in with Google' : 'Sign up with Google'}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center pt-2 pb-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#2a2a2a] border-dashed opacity-50"></div>
            </div>
            <span className="relative bg-[#1a1a1a] px-4 text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">
              Or continue with email
            </span>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-[12px] font-medium text-red-400 border border-red-500/20">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-[0.1em] text-[#888] uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-[14px] text-gray-200 placeholder-[#444] focus:border-[#30966a] focus:outline-none focus:ring-1 focus:ring-[#30966a] transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-[0.1em] text-[#888] uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 text-[14px] text-gray-200 placeholder-[#444] focus:border-[#30966a] focus:outline-none focus:ring-1 focus:ring-[#30966a] transition-colors"
                placeholder="admin@soundgrid.ai"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold tracking-[0.1em] text-[#888] uppercase">
                  Password
                </label>
                {mode === 'login' && (
                  <button type="button" className="text-[11px] font-bold tracking-wide text-[#30966a] hover:text-[#42cf91] transition-colors">
                    Forgot?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#2a2a2a] bg-[#141414] px-4 py-3 pr-10 text-[14px] text-gray-200 placeholder-[#444] focus:border-[#30966a] focus:outline-none focus:ring-1 focus:ring-[#30966a] transition-colors tracking-widest"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#999] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Security Rules for Register Mode */}
              {mode === 'register' && password.length > 0 && (
                <div className="pt-2 grid grid-cols-2 gap-2 text-[10px] font-medium">
                  <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-[#34a877]' : 'text-[#666]'}`}>
                    <Check size={12} className={hasMinLen ? 'opacity-100' : 'opacity-30'} /> 8+ Characters
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-[#34a877]' : 'text-[#666]'}`}>
                    <Check size={12} className={hasUpper ? 'opacity-100' : 'opacity-30'} /> Uppercase Letter
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-[#34a877]' : 'text-[#666]'}`}>
                    <Check size={12} className={hasNumber ? 'opacity-100' : 'opacity-30'} /> Number (0-9)
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-[#34a877]' : 'text-[#666]'}`}>
                    <Check size={12} className={hasSpecial ? 'opacity-100' : 'opacity-30'} /> Special Char (!@#)
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || (mode === 'register' && !isPasswordValid)}
              className="mt-6 flex w-full justify-center items-center gap-2 rounded-xl bg-[#34a877] px-4 py-3.5 text-[14px] font-bold tracking-wide text-[#002b17] transition-all hover:bg-[#3ec48c] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(52,168,119,0.15)]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {mode === 'login' ? 'Authenticating...' : 'Creating Account...'}
                </>
              ) : (
                mode === 'login' ? 'Log In' : 'Create Secure Account'
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="text-[12px] font-semibold text-[#888] hover:text-white transition-colors"
            >
              {mode === 'login' ? (
                <>Don't have an account? <span className="text-[#34a877] ml-1">Register now</span></>
              ) : (
                <>Already have an account? <span className="text-[#34a877] ml-1">Log in</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
