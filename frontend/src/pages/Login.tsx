import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { 
  Activity, Shield, LogIn, Lock, Mail, Users, ArrowRight, Sparkles, 
  Cpu, Radio, CheckCircle2, UserPlus, Building2, Wrench, ShieldAlert 
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register, quickDemoLogin, loginWithGoogle } = useAuth();
  
  // Auth Tab Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('admin@apexpower.com');
  const [password, setPassword] = useState('Password123!');
  
  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regOrgName, setRegOrgName] = useState('Apex Power Generation');
  const [regRole, setRegRole] = useState<'TECHNICIAN' | 'ENTERPRISE_ADMIN'>('TECHNICIAN');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isSuperAdminEmail = 
    regEmail.toLowerCase().trim() === 'demirewumanidefro@gmail.com' || 
    regEmail.toLowerCase().trim() === 'superadmin@soundgrid.ai';

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (regPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        organizationName: regOrgName,
        role: regRole,
      });
      setSuccessMsg('Account registered successfully! Synchronizing industrial console...');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google authentication failed: No credential received from Google.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err: any) {
      setError(err.message || 'Google SSO verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google Sign-In was cancelled or failed to authenticate.');
  };

  const handleGoogleMock = async (mockEmail: string = 'demirewumanidefro@gmail.com') => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(`mock-google-token:${mockEmail}`);
    } catch (err: any) {
      setError(err.message || 'SSO authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    {
      role: 'SUPER_ADMIN',
      tier: 'Tier 1',
      title: 'Platform Super Admin',
      email: 'superadmin@soundgrid.ai',
      desc: 'Cross-tenant oversight, global provisioning & metrics',
      badgeColor: 'border-violet-500/40 text-violet-300 bg-violet-950/40',
    },
    {
      role: 'ENTERPRISE_ADMIN',
      tier: 'Tier 2',
      title: 'Plant Admin (Apex Power)',
      email: 'admin@apexpower.com',
      desc: 'Machinery assets, personnel management & ticket approval',
      badgeColor: 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40',
    },
    {
      role: 'TECHNICIAN',
      tier: 'Tier 3',
      title: 'Field Acoustic Technician',
      email: 'tech@apexpower.com',
      desc: 'Live audio recorder & TorchScript diagnostic execution',
      badgeColor: 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40',
    },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#070A12] text-white selection:bg-cyan-500 selection:text-black">
      {/* Left side: Futuristic Brand Showcase */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-white/[0.08] bg-gradient-to-br from-[#070A12] via-[#0E1526] to-[#070A12] p-12 relative overflow-hidden">
        {/* Ambient Neon Blobs */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600/40 to-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_20px_-3px_rgba(0,242,254,0.35)]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-black tracking-wider text-white">
                SOUNDGRID
              </h1>
              <span className="rounded-full bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 text-[9px] font-mono font-bold tracking-widest text-cyan-400 shadow-[0_0_10px_-2px_rgba(0,242,254,0.5)]">
                SENTINEL
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400">Industrial Acoustic AI Platform</p>
          </div>
        </div>

        {/* Hero Copy & Metrics */}
        <div className="relative z-10 space-y-7 my-auto max-w-lg">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3.5 py-1 font-mono text-xs text-cyan-300 shadow-[0_0_15px_-3px_rgba(0,242,254,0.25)]">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            TorchScript Runtime v1.0 • 5.04ms ML Inference
          </div>

          <h2 className="font-display text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
            Predictive Failure Detection for Heavy Industrial Machinery
          </h2>

          <p className="text-sm font-sans text-slate-300 leading-relaxed">
            Autonomous acoustic anomaly classification monitoring high-voltage transformers, heavy-duty centrifugal pumps, induction motors, and ventilation fans.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/[0.08]">
            <div className="rounded-xl border border-white/[0.08] bg-[#0F1626]/70 p-4 backdrop-blur-md">
              <p className="font-mono text-[11px] text-slate-400 uppercase font-semibold">Inference Latency</p>
              <p className="font-display text-2xl font-black text-cyan-300 mt-1">~5.04 ms</p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">TorchScript CNN Model</p>
            </div>
            <div className="rounded-xl border border-white/[0.08] bg-[#0F1626]/70 p-4 backdrop-blur-md">
              <p className="font-mono text-[11px] text-slate-400 uppercase font-semibold">Acoustic Resolution</p>
              <p className="font-display text-2xl font-black text-emerald-300 mt-1">128 Mel Bands</p>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">16,000 Hz Sub-Nyquist</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>SoundGrid Sentinel © 2026 Enterprise Edition</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" />
            Cluster Operational
          </span>
        </div>
      </div>

      {/* Right side: Login / Register Form & Persona Switcher */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center p-8 sm:p-12 md:p-16 bg-[#070A12] bg-radial-mesh overflow-y-auto">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Header & Tab Selector */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-extrabold text-white tracking-tight">
                {authMode === 'login' ? 'Access Industrial Console' : 'Register New Account'}
              </h2>
            </div>
            <p className="text-xs font-sans text-slate-400 mt-1">
              {authMode === 'login' 
                ? 'Sign in with your registered credentials or select a test persona below' 
                : 'Create an authorized organizational operator or technician profile'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex rounded-xl border border-white/10 bg-slate-900/80 p-1 font-mono text-xs shadow-inner">
            <button
              type="button"
              id="tab-sign-in"
              onClick={() => { setAuthMode('login'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-bold transition-all ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" /> Sign In
            </button>
            <button
              type="button"
              id="tab-register"
              onClick={() => { setAuthMode('register'); setError(null); setSuccessMsg(null); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2 font-bold transition-all ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" /> Create Account
            </button>
          </div>

          {/* Alert Banners */}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs text-rose-300 font-mono shadow-lg flex items-center gap-2">
              <span className="shrink-0">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-xs text-emerald-300 font-mono shadow-lg flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN FORM */}
          {authMode === 'login' && (
            <>
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="input-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                      placeholder="operator@apexpower.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="input-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  id="btn-login-submit"
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-[0_0_20px_-3px_rgba(99,102,241,0.5)] hover:shadow-[0_0_25px_-2px_rgba(0,242,254,0.6)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
                >
                  <LogIn className="h-4 w-4 text-cyan-200" />
                  {loading ? 'Authenticating...' : 'Sign In to Console'}
                </button>
              </form>

              {/* Google Single Sign-On */}
              <div className="space-y-3 pt-2">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.08]" />
                  </div>
                  <span className="relative bg-[#070A12] px-3 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Or Google Single Sign-On
                  </span>
                </div>

                <div className="flex w-full justify-center overflow-hidden rounded-xl" id="google-login-container">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme="filled_black"
                    size="large"
                    shape="rectangular"
                    text="signin_with"
                    width="380"
                  />
                </div>

                <div className="text-center flex flex-col gap-1.5 items-center">
                  <button
                    id="btn-google-sso-demirewu"
                    onClick={() => handleGoogleMock('demirewumanidefro@gmail.com')}
                    disabled={loading}
                    type="button"
                    className="text-[11px] font-mono text-purple-400 hover:text-purple-300 transition-colors underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                    title="Simulate Google SSO login with demirewumanidefro@gmail.com (Super Admin)"
                  >
                    👑 1-Click Google SSO: demirewumanidefro@gmail.com (Super Admin)
                  </button>
                  <button
                    id="btn-google-sso-tech"
                    onClick={() => handleGoogleMock('tech@apexpower.com')}
                    disabled={loading}
                    type="button"
                    className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors underline underline-offset-2 cursor-pointer"
                    title="Simulate Google SSO login with technician"
                  >
                    ⚡ 1-Click Google SSO: tech@apexpower.com (Technician)
                  </button>
                </div>
              </div>

              {/* Quick Demo 1-Click Personas */}
              <div className="pt-4 border-t border-white/[0.08] space-y-3">
                <p className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                  1-Click Demo Personas (Instant Login)
                </p>
                <div className="space-y-2.5">
                  {demoRoles.map((dr) => (
                    <button
                      key={dr.role}
                      id={`btn-demo-${dr.role.toLowerCase()}`}
                      onClick={() => quickDemoLogin(dr.role)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#0F1626]/80 p-3.5 text-left hover:border-cyan-500/50 hover:bg-[#152038] transition-all group shadow-sm hover:shadow-md cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase border ${dr.badgeColor}`}>
                            {dr.tier}
                          </span>
                          <span className="font-display text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {dr.title}
                          </span>
                        </div>
                        <p className="text-[11px] font-sans text-slate-400 leading-tight">{dr.desc}</p>
                        <p className="text-[10px] font-mono text-cyan-400/80 mt-1">{dr.email}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-input-name"
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="e.g. Demirewu Manidefro"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Work / Personal Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-input-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="demirewumanidefro@gmail.com"
                  />
                </div>
                {isSuperAdminEmail && (
                  <div className="mt-2 rounded-lg border border-purple-500/40 bg-purple-950/40 p-2 text-[11px] font-mono text-purple-300 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-purple-400 shrink-0" />
                    <span>👑 Platform Owner recognized! Will be auto-provisioned as <b>SUPER ADMIN (Tier 1 Root)</b>.</span>
                  </div>
                )}
              </div>

              {/* Organization / Facility Name */}
              {!isSuperAdminEmail && (
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Industrial Facility / Organization
                  </label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      id="reg-input-org"
                      type="text"
                      value={regOrgName}
                      onChange={(e) => setRegOrgName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                      placeholder="e.g. Apex Power Generation"
                    />
                  </div>
                </div>
              )}

              {/* Role Selection */}
              {!isSuperAdminEmail && (
                <div>
                  <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                    Operational Role
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegRole('TECHNICIAN')}
                      className={`flex flex-col items-start p-3 rounded-xl border font-mono text-xs transition-all ${
                        regRole === 'TECHNICIAN'
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                          : 'border-white/10 bg-[#0F1626] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Wrench className="h-3.5 w-3.5 text-cyan-400" />
                        Technician (T3)
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">Acoustic Audio Operator</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegRole('ENTERPRISE_ADMIN')}
                      className={`flex flex-col items-start p-3 rounded-xl border font-mono text-xs transition-all ${
                        regRole === 'ENTERPRISE_ADMIN'
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200'
                          : 'border-white/10 bg-[#0F1626] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold mb-1">
                        <Building2 className="h-3.5 w-3.5 text-indigo-400" />
                        Enterprise Admin (T2)
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">Plant & Roster Director</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Password */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Password (min 8 characters)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-input-pass"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    id="reg-input-confirm"
                    type="password"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full rounded-xl border border-white/10 bg-[#0F1626] py-2.5 pl-10 pr-3.5 text-xs font-mono text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-colors"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              {/* Submit Registration */}
              <button
                id="btn-register-submit"
                type="submit"
                disabled={loading || !regFullName || !regEmail || !regPassword}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-indigo-600 to-indigo-500 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-[0_0_20px_-3px_rgba(0,242,254,0.5)] hover:shadow-[0_0_25px_-2px_rgba(99,102,241,0.6)] hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <UserPlus className="h-4 w-4 text-cyan-200" />
                {loading ? 'Registering Account...' : 'Register & Enter Platform'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setError(null); }}
                  className="text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  Already have an industrial account? <span className="text-cyan-400 underline">Sign In here</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
