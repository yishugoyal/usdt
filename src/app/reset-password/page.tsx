'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get('token') || '');
  }, []);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Your password could not be updated. Please request a new reset link.');
        return;
      }

      setMessage(data.message || 'Password updated successfully. You can now sign in with your new password.');
    } catch (err: any) {
      setError(err.message || 'Your password could not be updated. Please request a new reset link.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md p-8 rounded-2xl text-center">
          <h1 className="text-2xl font-extrabold text-text">Reset link expired</h1>
          <p className="mt-3 text-sm text-text-secondary">
            The password reset link is invalid or has expired.
          </p>
          <Link href="/forgot-password" className="btn-primary mt-6 inline-flex py-3 px-5 text-sm">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 rounded-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-text">Reset your password</h1>
          <p className="text-xs text-text-secondary">Choose a strong new password for your RupeeBridge account.</p>
        </div>

        {message && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 text-center font-semibold">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">New password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full p-3 text-sm text-text font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">Confirm new password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full p-3 text-sm text-text font-mono"
            />
          </div>

          <div className="text-[11px] text-text-secondary rounded-lg bg-gray-50 p-3 border border-border">
            Password requirements: minimum 8 characters, uppercase, lowercase, number, and special character.
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
            {loading ? 'Updating password...' : 'Update Password'}
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary">
          <Link href="/login" className="text-primary font-bold hover:underline">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
