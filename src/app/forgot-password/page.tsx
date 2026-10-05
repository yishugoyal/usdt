'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setMessage(data.message || 'If an account exists for that email address, we have sent a password reset link.');
    } catch (err: any) {
      setError(err.message || 'Unable to send the password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="card w-full max-w-md p-8 rounded-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-text">Forgot your password?</h1>
          <p className="text-xs text-text-secondary">
            Enter the email address associated with your RupeeBridge account.
          </p>
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
            <label className="block text-xs font-semibold text-text-secondary mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field w-full p-3 text-sm text-text font-mono"
              placeholder="name@company.com"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm">
            {loading ? 'Sending...' : 'Send Reset Link'}
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
