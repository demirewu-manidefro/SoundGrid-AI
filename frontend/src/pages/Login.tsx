import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Activity, Shield, LogIn, Lock, Mail, Users, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickDemoLogin, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('admin@apexpower.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
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

  const handleGoogleMock = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle('mock-google-token:demo@apexpower.com');
    } catch (err: any) {
      setError(err.message || 'SSO authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const demoRoles = [
    { role: 'SUPER_ADMIN', title: 'Tier 1: Super Admin', email: 'superadmin@soundgrid.ai', desc: 'Global multi-tenant governance' },
    { role: 'ENTERPRISE_ADMIN', title: 'Tier 2: Plant Admin', email: 'admin@apexpower.com', desc: 'Apex Power facility management' },
    { role: 'SAFETY_MANAGER', title: 'Tier 3: Safety Manager', email: 'safety@apexpower.com', desc: 'Chief Engineer work order approval' },
    { role: 'TECHNICIAN', title: 'Tier 4: Field Tech', email: 'tech@apexpower.com', desc: 'Acoustic recorder & diagnostic tool' },
    { role: 'AUDITOR', title: 'Tier 5: Compliance Auditor', email: 'auditor@apexpower.com', desc: 'Strictly read-only audit trails' },
  ] as const;

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-white">
      {/* Left side: Brand presentation */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between border-r border-industrial-border bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0B0F19] p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/30 border border-indigo-500/50 text-indigo-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-mono text-xl font-bold tracking-wider">SOUNDGRID SENTINEL</h1>
            <p className="font-mono text-xs text-sky-400">Industrial Acoustic AI Platform</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-800/60 bg-sky-950/40 px-3 py-1 font-mono text-xs text-sky-400">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
            TorchScript Runtime v1.0 • Sub-25ms Latency
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Predictive Failure Detection for Critical Heavy Machinery
          </h2>

          <p className="text-sm text-slate-400 leading-relaxed max-w-md">
            Continuous acoustic anomaly telemetry for transformers, pumps, high-torque motors, and ventilation fans. Built with multi-tenant isolation, Argon2id encryption, and sub-second PyTorch ML inference.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-industrial-border">
            <div className="rounded-lg border border-industrial-border bg-industrial-panel p-3">
              <p className="font-mono text-xs text-slate-400">Inference Latency</p>
              <p className="font-mono text-xl font-bold text-sky-400 mt-1">~23.2 ms</p>
            </div>
            <div className="rounded-lg border border-industrial-border bg-industrial-panel p-3">
              <p className="font-mono text-xs text-slate-400">Spectral Resolution</p>
              <p className="font-mono text-xl font-bold text-emerald-400 mt-1">128 Mel Bands</p>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-500">
          SoundGrid Sentinel © 2026 • Enterprise Edition
        </div>
      </div>

      {/* Right side: Login Form & Persona Switcher */}
      <div className="flex w-full lg:w-1/2 flex-col justify-center p-8 sm:p-12 md:p-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white tracking-tight">Access Industrial Console</h2>
            <p className="text-xs text-slate-400 mt-1">Authenticate via Argon2id or Google SSO with organizational isolation</p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-rose-800 bg-rose-950/60 p-3 text-xs text-rose-300 font-mono">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-industrial-border bg-industrial-panel py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="operator@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-industrial-border bg-industrial-panel py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {loading ? 'Authenticating...' : 'Sign In to Console'}
            </button>
          </form>

          {/* Google Single Sign-On (GIS) */}
          <div className="mt-5 space-y-3">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-industrial-border" />
              </div>
              <span className="relative bg-[#0B0F19] px-3 font-mono text-[11px] uppercase tracking-wider text-slate-400">
                Or Single Sign-On
              </span>
            </div>

            <div className="flex w-full justify-center overflow-hidden rounded-lg" id="google-login-container">
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

            <div className="text-center">
              <button
                id="btn-google-sso"
                onClick={handleGoogleMock}
                disabled={loading}
                type="button"
                className="text-[11px] font-mono text-slate-400 hover:text-sky-400 transition-colors underline underline-offset-2"
                title="Simulate Google SSO login with a mock token in development"
              >
                ⚡ Dev Bypass: 1-Click Test Google SSO
              </button>
            </div>
          </div>

          {/* Quick Demo Role Cards */}
          <div className="mt-8 pt-6 border-t border-industrial-border">
            <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" /> Instant Demo Personas (1-Click Test)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {demoRoles.map((dr) => (
                <button
                  key={dr.role}
                  id={`btn-demo-${dr.role.toLowerCase()}`}
                  onClick={() => quickDemoLogin(dr.role)}
                  className="flex items-center justify-between rounded-lg border border-industrial-border bg-industrial-panel p-2.5 text-left hover:border-indigo-500/60 hover:bg-slate-800/60 transition-all group"
                >
                  <div>
                    <span className="font-mono text-xs font-semibold text-slate-200 group-hover:text-white">
                      {dr.title}
                    </span>
                    <p className="text-[10px] font-mono text-slate-400">{dr.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
