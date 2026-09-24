'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [roleTab, setRoleTab] = useState<'CUSTOMER' | 'STAFF'>('CUSTOMER');
  const [email, setEmail] = useState('demo@rupeebridge.com');
  const [password, setPassword] = useState('UserPassword123!');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchTab = (tab: 'CUSTOMER' | 'STAFF') => {
    setRoleTab(tab);
    setError('');
    if (tab === 'CUSTOMER') {
      setEmail('demo@rupeebridge.com');
      setPassword('UserPassword123!');
    } else {
      setEmail('admin@rupeebridge.com');
      setPassword('AdminPassword123!');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = roleTab === 'CUSTOMER' ? '/api/auth/login' : '/api/auth/staff-login';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (roleTab === 'CUSTOMER') {
          router.push('/dashboard');
        } else {
          router.push('/admin');
        }
        router.refresh();
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch (e: any) {
      setError(e.message || 'Server connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 rounded-2xl space-y-6 relative shadow-lg">
        <div className="text-center space-y-2">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto transition-colors ${
            roleTab === 'CUSTOMER'
              ? 'bg-primary-soft border border-primary/30 text-primary'
              : 'bg-yellow-100 border border-yellow-200 text-warning'
          }`}>
            {roleTab === 'CUSTOMER' ? <Landmark className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-extrabold text-text">Sign In to RupeeBridge</h1>
          <p className="text-xs text-text-secondary">Institutional USDT to INR Direct Counterparty Platform</p>
        </div>

        {/* Role Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => switchTab('CUSTOMER')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              roleTab === 'CUSTOMER'
                ? 'bg-white text-primary shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <Landmark className="w-3.5 h-3.5" /> Customer Account
          </button>
          <button
            type="button"
            onClick={() => switchTab('STAFF')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              roleTab === 'STAFF'
                ? 'bg-white text-warning shadow-sm'
                : 'text-text-secondary hover:text-text'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Staff / Admin
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {roleTab === 'CUSTOMER' ? 'Registered User Email' : 'Authorized Staff Email'}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full p-3 text-sm text-text font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full p-3 text-sm text-text font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 ${
              roleTab === 'STAFF' ? '!bg-warning hover:!bg-warning/90' : ''
            }`}
          >
            {loading ? 'Authenticating...' : <>Sign In as {roleTab === 'CUSTOMER' ? 'Customer' : 'Staff'} <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="p-3 bg-gray-50 rounded-xl border border-border text-[11px] text-text-secondary space-y-1">
          <div className="font-bold text-text">
            {roleTab === 'CUSTOMER' ? 'Demo Customer Credentials:' : 'Pre-configured Staff Credentials:'}
          </div>
          <div>Email: <code className={`font-mono ${roleTab === 'CUSTOMER' ? 'text-primary' : 'text-warning'}`}>{email}</code></div>
          <div>Password: <code className={`font-mono ${roleTab === 'CUSTOMER' ? 'text-primary' : 'text-warning'}`}>{password}</code></div>
        </div>

        {roleTab === 'CUSTOMER' && (
          <div className="text-center pt-2 border-t border-border text-xs text-text-secondary">
            Don't have an account?{' '}
            <Link href="/register" className="text-primary font-bold hover:underline">
              Register Account
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
