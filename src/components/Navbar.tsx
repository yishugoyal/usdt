'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, User, LogOut, Lock, Landmark, RefreshCw } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const [session, setSession] = useState<{ type?: string; user?: any } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.type) setSession(data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setSession(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border px-4 lg:px-8 py-3.5 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary p-0.5 shadow-md group-hover:shadow-lg transition-all">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Landmark className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-text">Rupee<span className="text-primary">Bridge</span></span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary-soft text-primary-deep border border-primary/20">Institutional</span>
            </div>
            <p className="text-[10px] text-text-secondary font-medium">USDT → INR Sell-to-Company Platform</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
          <Link href="/" className="hover:text-primary transition-colors">Platform</Link>
          <Link href="/#how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
          <Link href="/#security" className="hover:text-primary transition-colors">Security & Gate</Link>
          {session?.type === 'USER' && (
            <Link href="/dashboard" className="text-primary hover:text-primary-dark transition-colors font-semibold flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> User Dashboard
            </Link>
          )}
          {session?.type === 'STAFF' && (
            <Link href="/admin" className="text-warning hover:text-warning/80 transition-colors font-semibold flex items-center gap-1.5">
              <Lock className="w-4 h-4" /> Admin Console ({session.user.role})
            </Link>
          )}
        </nav>

        {/* User / Auth CTA */}
        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-secondary bg-gray-100 px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                {session.user.email}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 text-text-secondary hover:text-error hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text hover:bg-gray-50 rounded-lg transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-md transition-all flex items-center gap-1.5"
              >
                Register Account <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
