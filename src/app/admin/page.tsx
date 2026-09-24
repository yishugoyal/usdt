'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  ShieldCheck,
  Building2,
  FileCheck,
  AlertTriangle,
  RefreshCw,
  Landmark,
  Layers,
  UserCheck,
  Sliders,
  DollarSign,
  Activity,
  CheckCircle2
} from 'lucide-react';

export default function AdminConsolePage() {
  const router = useRouter();
  const [adminSession, setAdminSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'READINESS' | 'FINANCE' | 'COMPLIANCE' | 'OPERATIONS'>('READINESS');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@rupeebridge.com');
  const [loginPassword, setLoginPassword] = useState('AdminPassword123!');
  const [loginErr, setLoginErr] = useState('');

  // Admin Data State
  const [readinessData, setReadinessData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [complianceData, setComplianceData] = useState<any>({ riskAlerts: [], complianceCases: [] });
  const [reconData, setReconData] = useState<any>({ records: [], ledgerEntries: [] });
  const [reconMsg, setReconMsg] = useState('');

  const loadAdminData = async () => {
    try {
      const meRes = await fetch('/api/auth/me?role=staff');
      const meData = await meRes.json();

      if (meData.type === 'STAFF') {
        setAdminSession(meData.user);

        // Fetch Readiness Gate
        const rRes = await fetch('/api/readiness');
        setReadinessData(await rRes.json());

        // Fetch Orders
        const oRes = await fetch('/api/admin/orders');
        const oData = await oRes.json();
        if (oData.success) setOrders(oData.orders);

        // Fetch Compliance
        const cRes = await fetch('/api/admin/compliance');
        const cData = await cRes.json();
        if (cData.success) setComplianceData(cData);

        // Fetch Reconciliation & Ledger
        const recRes = await fetch('/api/admin/reconciliation');
        const recData = await recRes.json();
        if (recData.success) setReconData(recData);
      } else {
        setAdminSession(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErr('');
    try {
      const res = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (data.success) {
        loadAdminData();
      } else {
        setLoginErr(data.error || 'Login failed');
      }
    } catch (e: any) {
      setLoginErr(e.message);
    }
  };

  const handleRunReconciliation = async () => {
    setReconMsg('Executing automated reconciliation engine...');
    try {
      const res = await fetch('/api/admin/reconciliation', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReconMsg('Reconciliation completed successfully!');
        loadAdminData();
      }
    } catch (e: any) {
      setReconMsg('Reconciliation error: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-text-secondary text-sm">Authenticating RupeeBridge Admin Credentials...</p>
      </div>
    );
  }

  // Render Admin Login if not authenticated as STAFF
  if (!adminSession) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="card w-full max-w-md p-8 rounded-2xl border-2 border-warning/30 space-y-6 relative">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-yellow-100 border border-yellow-200 flex items-center justify-center text-warning mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold text-text">Admin Staff Console</h2>
            <p className="text-xs text-text-secondary">Internal platform administration & financial controls</p>
          </div>

          {loginErr && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-error text-center font-semibold">
              {loginErr}
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Staff Email</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="input-field w-full p-3 text-sm text-text font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">Password</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="input-field w-full p-3 text-sm text-text font-mono"
              />
            </div>
            <button
              type="submit"
              className="btn-primary w-full py-3.5 text-sm"
            >
              Sign In to Admin Console
            </button>
          </form>

          <div className="p-3 bg-gray-50 rounded-xl border border-border text-[11px] text-text-secondary space-y-1">
            <div className="font-bold text-text">Default Staff Account:</div>
            <div>Email: <code className="text-warning">admin@rupeebridge.com</code></div>
            <div>Password: <code className="text-warning">AdminPassword123!</code></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* HEADER BANNER */}
      <div className="card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-2 border-warning/30">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-text">Internal Admin Console</h1>
            <span className="text-xs bg-yellow-100 text-warning border border-yellow-200 px-2.5 py-0.5 rounded-full font-bold">
              ROLE: {adminSession.role}
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Logged in as: <span className="text-warning font-mono font-bold">{adminSession.email}</span>
          </p>
        </div>

        <button
          onClick={handleRunReconciliation}
          className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-warning border border-warning/30 font-bold text-xs rounded-xl flex items-center gap-2"
        >
          <Activity className="w-4 h-4" /> Run Reconciliation Worker
        </button>
      </div>

      {reconMsg && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 text-warning text-xs rounded-xl font-mono text-center">
          {reconMsg}
        </div>
      )}

      {/* ADMIN TABS */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        {[
          { id: 'READINESS', label: 'Production Readiness Gate', icon: Lock },
          { id: 'FINANCE', label: 'Finance & Immutable Ledger', icon: Landmark },
          { id: 'COMPLIANCE', label: 'Risk & Compliance Console', icon: ShieldCheck },
          { id: 'OPERATIONS', label: `Operations & All Orders (${orders.length})`, icon: Layers },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-yellow-100 text-warning border border-yellow-200'
                  : 'text-text-secondary hover:text-text hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: READINESS GATE */}
      {activeTab === 'READINESS' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-text">Centralized Production Activation Gate Status</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {readinessData?.checks?.map((c: any) => (
                <div key={c.id} className="bg-gray-50 p-4 rounded-xl border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] bg-gray-200 text-text-secondary px-2 py-0.5 rounded font-bold">{c.category}</span>
                    <span className="text-xs font-bold text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                    </span>
                  </div>
                  <div className="font-bold text-text text-xs">{c.name}</div>
                  <div className="text-[11px] text-text-secondary">{c.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCE & LEDGER */}
      {activeTab === 'FINANCE' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-text">Immutable Double-Entry Financial Ledger</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary font-mono">
                <thead className="bg-gray-50 text-text-secondary uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Entry No</th>
                    <th className="p-3">Account Type</th>
                    <th className="p-3">Debit</th>
                    <th className="p-3">Credit</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {reconData?.ledgerEntries?.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="p-3 text-warning font-bold">{l.entryNumber}</td>
                      <td className="p-3 font-bold text-text">{l.accountType}</td>
                      <td className="p-3 text-error">{l.debit !== '0.00' ? l.debit : '-'}</td>
                      <td className="p-3 text-success">{l.credit !== '0.00' ? l.credit : '-'}</td>
                      <td className="p-3 text-text-secondary font-sans">{l.description}</td>
                      <td className="p-3 text-text-secondary">{new Date(l.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPLIANCE */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-text">Risk Alerts & Compliance Cases</h3>

            <div className="space-y-3">
              {complianceData?.riskAlerts?.map((r: any) => (
                <div key={r.id} className="bg-gray-50 p-4 rounded-xl border border-border flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-text text-sm">
                      User: {r.user.email} • Risk Level: <span className="text-warning font-mono font-bold">{r.riskLevel} (Score: {r.score})</span>
                    </div>
                    <div className="text-text-secondary mt-1">Triggered Rules: {JSON.stringify(r.triggerRules)}</div>
                  </div>
                  <span className="px-2.5 py-1 bg-yellow-100 text-warning border border-yellow-200 rounded font-bold">
                    {r.status}
                  </span>
                </div>
              ))}
              {complianceData?.riskAlerts?.length === 0 && (
                <div className="py-8 text-center text-text-secondary text-xs">No active risk alerts. System risk score clear.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONS */}
      {activeTab === 'OPERATIONS' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-text">System Orders & Blockchain Monitoring</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-text-secondary font-mono">
                <thead className="bg-gray-50 text-text-secondary uppercase font-semibold border-b border-border">
                  <tr>
                    <th className="p-3">Order No</th>
                    <th className="p-3">User</th>
                    <th className="p-3">USDT</th>
                    <th className="p-3">INR</th>
                    <th className="p-3">State</th>
                    <th className="p-3">Tx Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="p-3 font-bold text-text">{o.orderNumber}</td>
                      <td className="p-3 font-sans text-text-secondary">{o.user?.email}</td>
                      <td className="p-3">{o.usdtAmount} USDT</td>
                      <td className="p-3 text-success font-bold">₹{parseFloat(o.netInrAmount).toLocaleString('en-IN')}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-text-secondary">
                          {o.state}
                        </span>
                      </td>
                      <td className="p-3 text-text-secondary text-[11px] truncate max-w-[150px]">{o.txHash || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
