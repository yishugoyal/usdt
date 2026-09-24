'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  CreditCard,
  History,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  Landmark,
  RefreshCw,
  FileText,
  Lock,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SELL' | 'ORDERS' | 'BANKS' | 'RECEIPTS' | 'SECURITY'>('SELL');
  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(true);

  // Quote State
  const [usdtAmount, setUsdtAmount] = useState<string>('250');
  const [networkName, setNetworkName] = useState<string>('TRC20 (Tron)');
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [quote, setQuote] = useState<any>(null);
  const [loadingQuote, setLoadingQuote] = useState<boolean>(false);
  const [creatingOrder, setCreatingOrder] = useState<boolean>(false);

  // Data State
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrderModal, setActiveOrderModal] = useState<any>(null);
  const [receiptModal, setReceiptModal] = useState<any>(null);

  // Add Bank Modal State
  const [showAddBankModal, setShowAddBankModal] = useState<boolean>(false);
  const [newBank, setNewBank] = useState({
    bankName: 'HDFC Bank',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
  });

  // Processing Deposit Simulation state
  const [processingDeposit, setProcessingDeposit] = useState<boolean>(false);
  const [depositMsg, setDepositMsg] = useState<string>('');

  // Fetch session & initial data
  const loadData = async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      if (meData.type !== 'USER') {
        router.push('/login');
        return;
      }
      setSession(meData.user);

      // Fetch Bank Accounts
      const banksRes = await fetch('/api/bank-accounts');
      const banksData = await banksRes.json();
      if (banksData.success) {
        setBankAccounts(banksData.bankAccounts);
        if (banksData.bankAccounts.length > 0) {
          setSelectedBankId(banksData.bankAccounts[0].id);
        }
      }

      // Fetch Orders
      const ordersRes = await fetch('/api/orders');
      const ordersData = await ordersRes.json();
      if (ordersData.success) {
        setOrders(ordersData.orders);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch Quote when parameters change
  const handleFetchQuote = async () => {
    if (!usdtAmount || parseFloat(usdtAmount) < 50) return;
    setLoadingQuote(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usdtAmount, networkName }),
      });
      const data = await res.json();
      if (data.success) {
        setQuote(data.quote);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingQuote(false);
    }
  };

  useEffect(() => {
    handleFetchQuote();
  }, [usdtAmount, networkName]);

  // Create Order
  const handleCreateOrder = async () => {
    if (!quote || !selectedBankId) {
      alert('Please select a verified bank account and generate a quote first.');
      return;
    }

    setCreatingOrder(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.quoteId,
          bankAccountId: selectedBankId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveOrderModal(data.order);
        loadData();
        setActiveTab('ORDERS');
      } else {
        alert(data.error || 'Failed to create order');
      }
    } catch (e: any) {
      alert(e.message || 'Error creating order');
    } finally {
      setCreatingOrder(false);
    }
  };

  // Simulate Deposit Completion
  const handleSimulateDeposit = async (orderId: string) => {
    setProcessingDeposit(true);
    setDepositMsg('Verifying blockchain deposit on node network...');

    try {
      setTimeout(() => setDepositMsg('Evaluating transaction risk & compliance rules...'), 1200);
      setTimeout(() => setDepositMsg('Recording double-entry ledger entries...'), 2400);
      setTimeout(() => setDepositMsg('Disbursing INR via IMPS Bank Gateway...'), 3600);

      const res = await fetch(`/api/orders/${orderId}/confirm-deposit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success) {
        setDepositMsg('Transaction Complete! INR Disbursed.');
        setTimeout(() => {
          setProcessingDeposit(false);
          setActiveOrderModal(null);
          loadData();
        }, 1500);
      } else {
        alert(data.error || 'Deposit processing failed');
        setProcessingDeposit(false);
      }
    } catch (e: any) {
      alert(e.message);
      setProcessingDeposit(false);
    }
  };

  // Add Bank Account
  const handleAddBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBank),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddBankModal(false);
        loadData();
      } else {
        alert(data.error);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // View Receipt
  const handleViewReceipt = async (orderId: string) => {
    try {
      const res = await fetch(`/api/receipts/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setReceiptModal(data.receipt);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-text-secondary text-sm">Authenticating RupeeBridge User Session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      {/* TOP USER BANNER */}
      <div className="card p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-text">Welcome, {session?.profile?.fullName || 'Verified Seller'}</h1>
            <span className="text-xs bg-green-100 text-success border border-green-200 px-2.5 py-0.5 rounded-full font-bold">
              VERIFIED ACCOUNT
            </span>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            Account Email: <span className="text-text font-mono">{session?.email}</span> • Mobile: <span className="text-text font-mono">{session?.mobile}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('SELL')}
            className="btn-primary px-5 py-2.5 text-xs flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> New USDT Sell Order
          </button>
        </div>
      </div>

      {/* DASHBOARD TABS */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-1">
        {[
          { id: 'SELL', label: 'Sell USDT', icon: TrendingUp },
          { id: 'ORDERS', label: `My Orders (${orders.length})`, icon: History },
          { id: 'BANKS', label: `Bank Accounts (${bankAccounts.length})`, icon: CreditCard },
          { id: 'RECEIPTS', label: 'Financial Receipts', icon: FileText },
          { id: 'SECURITY', label: 'Security & Verification', icon: Lock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary-soft text-primary-deep border border-primary/30'
                  : 'text-text-secondary hover:text-text hover:bg-gray-100'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: SELL USDT */}
      {activeTab === 'SELL' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 card p-6 sm:p-8 rounded-2xl space-y-6">
            <div className="border-b border-border pb-4">
              <h3 className="text-lg font-bold text-text flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Create Live USDT Sell Order
              </h3>
              <p className="text-xs text-text-secondary mt-1">Rates are locked for 5 minutes once calculated</p>
            </div>

            {/* Step 1: Amount */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">1. USDT Sell Amount</label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max="100000"
                  value={usdtAmount}
                  onChange={(e) => setUsdtAmount(e.target.value)}
                  className="input-field w-full px-4 py-3 text-lg font-bold text-text"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-primary bg-primary-soft px-2.5 py-1 rounded border border-primary/20">
                  USDT
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">Min: 50 USDT • Max: 100,000 USDT per order</p>
            </div>

            {/* Step 2: Network */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-2">2. Blockchain Network</label>
              <select
                value={networkName}
                onChange={(e) => setNetworkName(e.target.value)}
                className="input-field w-full px-4 py-3 text-sm font-semibold text-text"
              >
                <option value="TRC20 (Tron)">TRC20 (Tron)</option>
                <option value="ERC20 (Ethereum)">ERC20 (Ethereum)</option>
                <option value="BEP20 (BNB Smart Chain)">BEP20 (BNB Smart Chain)</option>
                <option value="Polygon">Polygon (MATIC)</option>
                <option value="Solana">Solana (SOL)</option>
              </select>
            </div>

            {/* Step 3: Select Bank Account */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-text-secondary uppercase">3. Destination Bank Account</label>
                <button
                  onClick={() => setShowAddBankModal(true)}
                  className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Bank
                </button>
              </div>

              {bankAccounts.length > 0 ? (
                <div className="space-y-2">
                  {bankAccounts.map((b) => (
                    <label
                      key={b.id}
                      onClick={() => setSelectedBankId(b.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedBankId === b.id
                          ? 'bg-primary-soft border-primary/40 text-text'
                          : 'bg-gray-50 border-border text-text-secondary hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="bank"
                          checked={selectedBankId === b.id}
                          onChange={() => setSelectedBankId(b.id)}
                          className="accent-primary"
                        />
                        <div>
                          <div className="font-bold text-sm text-text">{b.bankName}</div>
                          <div className="text-xs font-mono text-text-secondary">
                            {b.accountNumberMasked} • IFSC: {b.ifscCode}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-green-100 text-success border border-green-200 px-2 py-0.5 rounded font-bold">
                        VERIFIED
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl text-center space-y-2">
                  <p className="text-xs text-warning">No verified bank account found. Please add a bank account before creating a sell order.</p>
                  <button
                    onClick={() => setShowAddBankModal(true)}
                    className="btn-primary px-4 py-2 text-xs"
                  >
                    Add Bank Account
                  </button>
                </div>
              )}
            </div>

            {/* Create Order Button */}
            <button
              disabled={creatingOrder || !quote || !selectedBankId}
              onClick={handleCreateOrder}
              className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creatingOrder ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" /> Generating Deposit Address...
                </>
              ) : (
                <>
                  Lock Quote & Create Order <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          {/* Right Column: Quote Summary Card */}
          <div className="lg:col-span-5">
            <div className="card p-6 sm:p-8 rounded-2xl sticky top-24 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <h4 className="font-bold text-text text-base">Locked Financial Settlement Summary</h4>
                <Clock className="w-4 h-4 text-primary" />
              </div>

              {quote ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-xl border border-border space-y-3 text-sm">
                    <div className="flex justify-between text-text-secondary text-xs">
                      <span>USDT Amount:</span>
                      <span className="font-mono text-text font-bold">{quote.usdtAmount} USDT</span>
                    </div>
                    <div className="flex justify-between text-text-secondary text-xs">
                      <span>Selected Network:</span>
                      <span className="font-semibold text-text">{quote.networkName}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary text-xs">
                      <span>Live Rate Source:</span>
                      <span className="text-[11px] text-text-secondary font-mono">{quote.rateSource}</span>
                    </div>
                    <div className="flex justify-between text-text-secondary text-xs">
                      <span>Lock Conversion Rate:</span>
                      <span className="font-mono text-primary font-bold">₹{quote.netInrRate} / USDT</span>
                    </div>
                    <div className="flex justify-between text-text-secondary text-xs">
                      <span>Platform Fee (0.25%):</span>
                      <span className="font-mono text-text">₹{quote.companyFee}</span>
                    </div>

                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="font-bold text-text text-sm">Net INR Payout:</span>
                      <span className="text-2xl font-extrabold text-primary font-mono">
                        ₹{parseFloat(quote.netInrAmount).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-3.5 rounded-xl text-xs text-success flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>Payout will be disbursed automatically to your selected bank account upon blockchain confirmation.</span>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-text-secondary text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                  Calculating live financial quote...
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY ORDERS & DEPOSIT MODAL */}
      {activeTab === 'ORDERS' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-text mb-4">Your Transaction Orders</h3>

            {orders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-secondary">
                  <thead className="bg-gray-50 text-text-secondary uppercase font-semibold border-b border-border">
                    <tr>
                      <th className="p-3.5">Order No</th>
                      <th className="p-3.5">USDT</th>
                      <th className="p-3.5">Rate</th>
                      <th className="p-3.5">Net INR</th>
                      <th className="p-3.5">Network</th>
                      <th className="p-3.5">State</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50">
                        <td className="p-3.5 font-mono text-text font-bold">{o.orderNumber}</td>
                        <td className="p-3.5 font-mono">{o.usdtAmount} USDT</td>
                        <td className="p-3.5 font-mono">₹{o.inrRate}</td>
                        <td className="p-3.5 font-mono text-primary font-bold">₹{parseFloat(o.netInrAmount).toLocaleString('en-IN')}</td>
                        <td className="p-3.5">{o.network?.name}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                              o.state === 'COMPLETED'
                                ? 'bg-green-100 text-success border border-green-200'
                                : o.state === 'AWAITING_DEPOSIT'
                                ? 'bg-yellow-100 text-warning border border-yellow-200 animate-pulse'
                                : 'bg-gray-100 text-text-secondary'
                            }`}
                          >
                            {o.state}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => setActiveOrderModal(o)}
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-text text-xs font-semibold rounded-lg flex items-center gap-1"
                          >
                            View / Deposit <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-text-secondary text-sm">
                No orders created yet. Switch to the "Sell USDT" tab to create your first transaction.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: BANK ACCOUNTS */}
      {activeTab === 'BANKS' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text">Verified Bank Accounts</h3>
            <button
              onClick={() => setShowAddBankModal(true)}
              className="btn-primary px-4 py-2 text-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add Bank Account
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="card p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-primary" />
                    <span className="font-bold text-text text-base">{b.bankName}</span>
                  </div>
                  <span className="text-[10px] bg-green-100 text-success border border-green-200 px-2 py-0.5 rounded font-bold">
                    ACTIVE & VERIFIED
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-border space-y-1.5 text-xs text-text-secondary font-mono">
                  <div>Account Holder: <span className="text-text font-sans font-semibold">{b.accountHolderName}</span></div>
                  <div>Account Number: <span className="text-primary font-bold">{b.accountNumberMasked}</span></div>
                  <div>IFSC Code: <span className="text-text">{b.ifscCode}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RECEIPTS */}
      {activeTab === 'RECEIPTS' && (
        <div className="space-y-6">
          <div className="card p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-text mb-4">Financial Transaction Receipts</h3>

            <div className="space-y-3">
              {orders.filter(o => o.state === 'COMPLETED').map((o) => (
                <div key={o.id} className="bg-gray-50 p-4 rounded-xl border border-border flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-text text-sm">{o.orderNumber}</div>
                    <div className="text-text-secondary mt-0.5">
                      {o.usdtAmount} USDT @ ₹{o.inrRate} → <span className="text-primary font-bold">₹{parseFloat(o.netInrAmount).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewReceipt(o.id)}
                    className="px-3.5 py-2 bg-primary-soft hover:bg-primary/20 text-primary border border-primary/30 rounded-lg font-bold flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" /> View Audit Receipt
                  </button>
                </div>
              ))}
              {orders.filter(o => o.state === 'COMPLETED').length === 0 && (
                <div className="py-8 text-center text-text-secondary text-xs">
                  No completed transaction receipts available yet. Complete a sell order to generate an audit receipt.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="card p-6 rounded-2xl space-y-6 max-w-2xl">
          <h3 className="text-lg font-bold text-text">Security & MFA Settings</h3>
          <div className="space-y-4 text-xs text-text-secondary">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
              <div>
                <div className="font-bold text-text text-sm">Two-Factor Authentication (MFA)</div>
                <div className="text-text-secondary">Step-up authentication for high-value sell orders & bank changes</div>
              </div>
              <span className="px-2.5 py-1 bg-green-100 text-success border border-green-200 rounded font-bold">ENABLED</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-border">
              <div>
                <div className="font-bold text-text text-sm">Email Verification</div>
                <div className="text-text-secondary">{session?.email}</div>
              </div>
              <span className="px-2.5 py-1 bg-green-100 text-success border border-green-200 rounded font-bold">VERIFIED</span>
            </div>
          </div>
        </div>
      )}

      {/* DEPOSIT MODAL */}
      {activeOrderModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card w-full max-w-lg p-6 sm:p-8 rounded-2xl space-y-6 relative">
            <button
              onClick={() => setActiveOrderModal(null)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text text-lg font-bold"
            >
              ✕
            </button>

            <div className="border-b border-border pb-4">
              <span className="text-[10px] font-mono font-bold bg-yellow-100 text-warning border border-yellow-200 px-2 py-0.5 rounded">
                ORDER STATE: {activeOrderModal.state}
              </span>
              <h3 className="text-xl font-bold text-text mt-2">Deposit Instructions</h3>
              <p className="text-xs text-text-secondary">Order #{activeOrderModal.orderNumber}</p>
            </div>

            {/* Deposit Box */}
            <div className="bg-gray-50 p-4 rounded-xl border border-border space-y-3">
              <div className="text-xs text-text-secondary">Network: <span className="text-text font-bold">{activeOrderModal.network?.name}</span></div>
              <div className="text-xs text-text-secondary">Exact Amount to Send: <span className="text-primary font-mono font-bold text-sm">{activeOrderModal.usdtAmount} USDT</span></div>

              <div className="pt-2">
                <label className="block text-[11px] font-bold text-text-secondary uppercase mb-1">Unique Deposit Address</label>
                <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-border font-mono text-xs text-text break-all select-all">
                  {activeOrderModal.depositAddress || 'Generating...'}
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-3.5 rounded-xl text-xs text-warning">
              ⚠️ Send only <strong>USDT ({activeOrderModal.network?.name})</strong> to this deposit address. Do not send unsupported tokens.
            </div>

            {/* Simulation Action */}
            {activeOrderModal.state === 'AWAITING_DEPOSIT' && (
              <div className="pt-2">
                <button
                  disabled={processingDeposit}
                  onClick={() => handleSimulateDeposit(activeOrderModal.id)}
                  className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2"
                >
                  {processingDeposit ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> {depositMsg}
                    </>
                  ) : (
                    <>
                      Simulate USDT Deposit & Confirm <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD BANK MODAL */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleAddBank} className="card w-full max-w-md p-6 rounded-2xl space-y-4">
            <h3 className="text-lg font-bold text-text">Add Verified Bank Account</h3>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Bank Name</label>
              <input
                type="text"
                required
                value={newBank.bankName}
                onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                className="input-field w-full p-2.5 text-xs text-text"
                placeholder="HDFC Bank"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Account Holder Full Name</label>
              <input
                type="text"
                required
                value={newBank.accountHolderName}
                onChange={(e) => setNewBank({ ...newBank, accountHolderName: e.target.value })}
                className="input-field w-full p-2.5 text-xs text-text"
                placeholder="RAJESH SHARMA"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Account Number</label>
              <input
                type="text"
                required
                value={newBank.accountNumber}
                onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                className="input-field w-full p-2.5 text-xs text-text"
                placeholder="50100293049281"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">IFSC Code</label>
              <input
                type="text"
                required
                value={newBank.ifscCode}
                onChange={(e) => setNewBank({ ...newBank, ifscCode: e.target.value })}
                className="input-field w-full p-2.5 text-xs text-text uppercase"
                placeholder="HDFC0000240"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddBankModal(false)}
                className="w-1/2 py-2.5 bg-gray-100 text-text-secondary text-xs font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary w-1/2 py-2.5 text-xs"
              >
                Save & Verify Bank
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="card w-full max-w-xl p-6 sm:p-8 rounded-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReceiptModal(null)}
              className="absolute top-4 right-4 text-text-secondary hover:text-text font-bold"
            >
              ✕
            </button>

            <div className="text-center border-b border-border pb-4">
              <h2 className="text-base font-extrabold text-text tracking-wide">{receiptModal.title}</h2>
              <div className="text-xs font-mono text-primary mt-1">{receiptModal.receiptNumber}</div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-border space-y-1 font-mono">
                <div>Settlement Status: <span className="text-success font-bold">{receiptModal.auditSeal.status}</span></div>
                <div>Tx Hash: <span className="text-text break-all">{receiptModal.blockchain.txHash}</span></div>
                <div>UTR Reference: <span className="text-primary font-bold">{receiptModal.payoutDetails.utrReference}</span></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-border space-y-1">
                  <div className="font-bold text-text-secondary uppercase text-[10px]">USDT Asset</div>
                  <div className="font-mono text-text text-sm font-bold">{receiptModal.settlement.usdtAmount} USDT</div>
                  <div className="text-text-secondary">{receiptModal.settlement.network}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-border space-y-1">
                  <div className="font-bold text-text-secondary uppercase text-[10px]">Net INR Disbursed</div>
                  <div className="font-mono text-primary text-sm font-bold">₹{parseFloat(receiptModal.settlement.netInrDisbursed).toLocaleString('en-IN')}</div>
                  <div className="text-text-secondary">Rate: {receiptModal.settlement.conversionRate}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-text font-bold text-xs rounded-xl flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Print / Save PDF Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
