import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, error, setError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-bg flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-600/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-sky-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md glass-panel bg-canvas-panel/90 border border-canvas-border rounded-3xl p-8 shadow-glass relative z-10">
        
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2.5 mb-4 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-sky-500 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform">
              <Code2 className="w-6 h-6 text-canvas-bg font-bold" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1">Sign in to your CodeCanvas Live studio</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex items-center space-x-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-brand-coral shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl glass-input text-sm text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl glass-input text-sm text-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-canvas-bg font-extrabold text-sm shadow-glow-cyan transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-primary font-semibold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
