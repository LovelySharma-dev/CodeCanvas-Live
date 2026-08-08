import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Code2, 
  Zap, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight,
  Monitor
} from 'lucide-react';
import Navbar from '../components/common/Navbar';

export default function LandingPage() {
  const [demoTab, setDemoTab] = useState('html');
  const [codeSample, setCodeSample] = useState({
    html: `<div class="hero-card">
  <h1>CodeCanvas Live</h1>
  <p>Sub-50ms Collaborative Studio</p>
  <button id="btn">Try Interactive Code</button>
</div>`,
    css: `.hero-card {
  background: linear-gradient(135deg, #0B101D, #0F172A);
  border: 1px solid #06B6D4;
  padding: 24px;
  border-radius: 16px;
  color: white;
  text-align: center;
}`,
    js: `document.getElementById('btn').onclick = () => {
  alert('🚀 Welcome to CodeCanvas Live!');
};`
  });

  return (
    <div className="min-h-screen bg-canvas-bg text-slate-100 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-600/15 via-sky-600/15 to-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-brand-primary" />
            <span>Next-Gen Collaborative IDE Powered by InsForge</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Build & Edit Code Together in <span className="gradient-text">Real Time</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-normal">
            A high-velocity, browser-based collaborative studio. Edit HTML, CSS, & JS with instant hot-reloading preview, Yjs CRDT real-time sync, and PostgreSQL cloud storage.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-sky-500 hover:from-cyan-400 hover:to-sky-400 text-canvas-bg font-extrabold text-base shadow-glow-cyan transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Start Coding Now — Free</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-card text-slate-200 hover:text-white hover:bg-canvas-card font-semibold text-base transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>Explore Workspace Studio</span>
            </Link>
          </div>

          {/* Interactive Code Studio Preview Widget */}
          <div className="mt-16 max-w-5xl mx-auto glass-panel rounded-2xl border border-canvas-border overflow-hidden shadow-glass text-left">
            <div className="flex items-center justify-between px-4 py-3 bg-canvas-bg border-b border-canvas-border">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-xs font-mono text-slate-400">codecanvas-live-jellyfish-demo</span>
              </div>

              {/* Code Language Tabs */}
              <div className="flex items-center space-x-1">
                {['html', 'css', 'js'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setDemoTab(lang)}
                    className={`px-3 py-1 rounded-md text-xs font-mono uppercase transition-colors ${
                      demoTab === lang ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px]">
              {/* Code Editor Side */}
              <div className="p-4 bg-canvas-panel font-mono text-xs text-slate-200 border-b md:border-b-0 md:border-r border-canvas-border">
                <textarea
                  value={codeSample[demoTab]}
                  onChange={(e) => setCodeSample({ ...codeSample, [demoTab]: e.target.value })}
                  className="w-full h-full bg-transparent outline-none resize-none font-mono text-xs text-cyan-200"
                  spellCheck="false"
                />
              </div>

              {/* Sandboxed Live Output Side */}
              <div className="p-4 bg-canvas-bg flex flex-col items-center justify-center relative">
                <div className="w-full h-full rounded-xl bg-gradient-to-tr from-canvas-panel to-canvas-card border border-cyan-500/20 p-6 flex flex-col items-center justify-center text-center shadow-inner">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4">
                    <Sparkles className="w-8 h-8 text-brand-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Jellyfish Theme Live Studio</h3>
                  <p className="text-xs text-slate-400 mb-4">Changes reflect hot-reloaded in sub-50ms sync</p>
                  <button className="px-4 py-2 rounded-lg bg-brand-primary text-canvas-bg font-extrabold text-xs shadow-glow-cyan">
                    Sample Action Triggered
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="py-20 bg-canvas-panel/60 border-t border-canvas-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Developers & Remote Engineering Teams
            </h2>
            <p className="mt-4 text-slate-400 text-base">
              Everything you need for real-time pair programming, multi-file code execution, and workspace member RBAC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-panel p-6 rounded-2xl border border-canvas-border hover:border-cyan-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-brand-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sub-50ms Yjs CRDT Sync</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Conflict-free text editing synchronized across all global active peers via WebSockets.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-canvas-border hover:border-sky-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Monitor className="w-6 h-6 text-brand-sky" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Hot-Reloading Sandboxed Preview</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Render combined HTML, CSS, and JavaScript with embedded console output in a secure sandbox.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-canvas-border hover:border-emerald-500/40 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6 text-brand-emerald" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Granular PostgreSQL RBAC</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Manage roles (Owner, Editor, Viewer) with secure token invitations and workspace permissions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-canvas-border bg-canvas-bg text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-brand-primary" />
            <span className="font-bold text-slate-300">CodeCanvas Live</span>
            <span>— Powered by InsForge Backend</span>
          </div>
          <p>© {new Date().getFullYear()} CodeCanvas Live. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
