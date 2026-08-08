import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Code2, LayoutDashboard, LogOut, Sparkles, FolderCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ workspaceName }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-canvas-border bg-canvas-bg/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-sky-500 to-teal-500 flex items-center justify-center shadow-glow-cyan group-hover:scale-105 transition-transform duration-200">
              <Code2 className="w-5 h-5 text-canvas-bg font-bold" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                CodeCanvas <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-medium">LIVE</span>
              </span>
            </div>
          </Link>

          {workspaceName && (
            <div className="hidden md:flex items-center space-x-2 pl-4 border-l border-slate-800">
              <FolderCode className="w-4 h-4 text-brand-sky" />
              <span className="text-sm font-semibold text-slate-200 max-w-[220px] truncate">{workspaceName}</span>
            </div>
          )}
        </div>

        {/* Navigation & User Menu */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <Link
                to="/dashboard"
                className="hidden sm:flex items-center space-x-2 text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-canvas-card transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                <span>Dashboard</span>
              </Link>

              <div className="relative group">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-canvas-card transition-colors border border-transparent hover:border-slate-700/60"
                >
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                    alt={user.full_name || 'User'}
                    className="w-8 h-8 rounded-lg object-cover bg-slate-800 ring-2 ring-brand-primary/30"
                  />
                  <span className="hidden md:inline text-sm font-medium text-slate-200">
                    {user.full_name || user.email.split('@')[0]}
                  </span>
                </Link>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-sm text-slate-400 hover:text-brand-coral px-3 py-2 rounded-lg hover:bg-rose-500/10 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-canvas-card transition-colors"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                className="flex items-center space-x-2 text-sm font-semibold text-canvas-bg bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 px-4 py-2 rounded-xl shadow-glow-cyan transition-all duration-200"
              >
                <Sparkles className="w-4 h-4" />
                <span>Get Started</span>
              </Link>
            </>
          )}
        </div>

      </div>
    </header>
  );
}
