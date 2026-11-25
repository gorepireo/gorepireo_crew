import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import {
  CreditCard,
  CheckCircle2,
  X,
  ShieldCheck,
  Loader2,
  FileText,
  Wallet,
  Hourglass,
  Calendar,
  Download,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const ClientInvoices: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState({
    totalContractAmount: 0,
    totalPaid: 0,
    outstandingAmount: 0,
    paymentStatus: 'UP_TO_DATE',
  });

  // Pay Now Modal State (Predefined Razorpay.me/@gorepireo flow)
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [razorpayRef, setRazorpayRef] = useState('');
  const [razorpayOpened, setRazorpayOpened] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getClientInvoices();
      setInvoices(res.invoices || []);
      setSummary(res.summary);
    } catch (err: any) {
      console.error('[CLIENT INVOICES] Error:', err);
      setError(err?.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayModal = (inv: Invoice) => {
    const remaining = Math.max(0, Number(inv.amount) - Number(inv.amountPaid || 0));
    setPayModalInvoice(inv);
    setPayAmount(remaining);
    setRazorpayRef('');
    setRazorpayOpened(false);
    setPaySuccess(null);
    setPayError(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInvoice) return;
    const expectedBalance = Math.max(0, Number(payModalInvoice.amount) - Number(payModalInvoice.amountPaid || 0));
    if (expectedBalance <= 0 || payAmount !== expectedBalance) {
      setPayError(`Payable amount must match the verified balance of ₹${expectedBalance.toLocaleString('en-IN')}`);
      return;
    }
    if (razorpayRef.trim().length < 6) {
      setPayError('Please enter your Razorpay Payment ID or UTR reference (minimum 6 characters)');
      return;
    }

    try {
      setPaying(true);
      setPayError(null);
      const res = await api.payClientInvoice(payModalInvoice.invoiceId, {
        amount: expectedBalance,
        paymentMethod: 'RAZORPAY',
        transactionId: razorpayRef.trim(),
      });

      setPaySuccess(
        `Payment of ₹${expectedBalance.toLocaleString('en-IN')} verified! Reference: ${res.transactionId || razorpayRef.trim()}`
      );
      setTimeout(() => {
        fetchInvoices();
      }, 1000);
    } catch (err: any) {
      console.error('[PAYMENT PROCESS] Error:', err);
      setPayError(err?.message || 'Payment verification failed. Please check your Razorpay reference.');
    } finally {
      setPaying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PARTIALLY_PAID':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'OVERDUE':
        return 'bg-red-50 text-red-700 border-red-200 font-extrabold';
      case 'PENDING':
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* FULL-BLEED HERO HEADER */}
      <div className="relative bg-gradient-to-b from-[#06122c] via-[#133274] to-[#1e4aa8] px-4 pt-16 pb-8 overflow-hidden">
        <div
          className="absolute top-0 right-0 w-52 h-full opacity-35 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&auto=format&fit=crop&q=80')",
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 15%, rgba(0,0,0,0) 100%)',
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#eef3f9] to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-[85%]">
          <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
            Payments & Invoices
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed border-l-2 border-blue-400 pl-2.5">
            Track contract billing, settle pending invoices, and download instant payment receipts
          </p>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="px-3.5 -mt-4 relative z-10 space-y-4">
        {/* 4 Financial KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* 1. Total Contract Amount */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-blue-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 leading-tight">
                  Total Contract Amount
                </span>
              </div>
              <div className="text-xl font-black text-slate-900 mt-2.5">
                ₹{summary.totalContractAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-3xs text-slate-500 mt-0.5">All issued invoices</p>
            </div>
          </div>

          {/* 2. Total Paid */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-emerald-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 leading-tight">Total Paid</span>
              </div>
              <div className="text-xl font-black text-emerald-600 mt-2.5">
                ₹{summary.totalPaid.toLocaleString('en-IN')}
              </div>
              <p className="text-3xs text-slate-500 mt-0.5">Cleared settlements</p>
            </div>
          </div>

          {/* 3. Outstanding Amount */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-orange-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl shrink-0">
                  <Hourglass className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 leading-tight">
                  Outstanding Amount
                </span>
              </div>
              <div className="text-xl font-black text-[#ea580c] mt-2.5">
                ₹{summary.outstandingAmount.toLocaleString('en-IN')}
              </div>
              <p className="text-3xs text-slate-500 mt-0.5">Balance due</p>
            </div>
          </div>

          {/* 4. Account Status */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-emerald-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-700 leading-tight">
                  Account Status
                </span>
              </div>
              <div className="mt-2.5">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-3xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>{summary.outstandingAmount === 0 ? 'Fully Paid' : 'Active Contract'}</span>
                </div>
              </div>
              <p className="text-3xs text-slate-500 mt-1">Verified partner</p>
            </div>
          </div>
        </div>

        {/* Contract Invoices List */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 space-y-3.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">Contract Invoices</h2>
                <p className="text-3xs text-slate-500 leading-snug">
                  Directly associated with verified cleaning operations
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/client/receipts')}
              className="text-3xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 shrink-0 pt-1"
            >
              <span>Receipts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading invoices...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600 text-xs">{error}</div>
          ) : invoices.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-slate-200/70 rounded-2xl bg-[#f8fafc]">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700">No invoices generated yet</h3>
              <p className="text-3xs text-slate-400">
                Invoices will appear here once your cleaning service events are scheduled and billed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {invoices.map((inv) => {
                const remaining = Math.max(0, Number(inv.amount) - Number(inv.amountPaid || 0));
                const isUnpaid = inv.status !== 'PAID' && remaining > 0;

                return (
                  <div
                    key={inv.invoiceId}
                    className="p-3.5 bg-[#f8fafc] rounded-2xl border border-slate-200/80 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                            isUnpaid
                              ? 'bg-amber-50 text-amber-600 border border-amber-200/60'
                              : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-slate-900">
                              {inv.invoiceNumber}
                            </span>
                            <span
                              className={`inline-block text-4xs font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(
                                inv.status
                              )}`}
                            >
                              {inv.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
                            {inv.eventName || 'Scheduled Service'}
                          </p>
                          <p className="text-3xs text-slate-500 line-clamp-1">
                            {inv.description || 'Facility Maintenance'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-sm font-black text-slate-900">
                          ₹{Number(inv.amount).toLocaleString('en-IN')}
                        </div>
                        {inv.amountPaid && Number(inv.amountPaid) > 0 && inv.status !== 'PAID' ? (
                          <div className="text-4xs text-emerald-600 font-semibold">
                            Paid: ₹{Number(inv.amountPaid).toLocaleString('en-IN')}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-3xs gap-2">
                      <div className="text-slate-500 flex items-center gap-1 min-w-0 truncate">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Issued: {inv.issueDate || inv.invoiceDate} | Due: {inv.dueDate}
                        </span>
                      </div>

                      {isUnpaid ? (
                        <button
                          onClick={() => handleOpenPayModal(inv)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white text-3xs font-bold rounded-full transition shadow-sm flex items-center gap-1.5 shrink-0 active:scale-95"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay Now</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('/client/receipts')}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-3xs font-bold rounded-full transition inline-flex items-center gap-1 shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECURE PAY NOW MODAL */}
      {payModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Secure Payment Checkout</h3>
                  <p className="text-3xs text-slate-500">Invoice: {payModalInvoice.invoiceNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setPayModalInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {paySuccess ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900">Payment Successful!</h4>
                <p className="text-3xs text-emerald-700">{paySuccess}</p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setPayModalInvoice(null);
                      navigate('/client/receipts');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition"
                  >
                    View Receipt
                  </button>
                  <button
                    onClick={() => setPayModalInvoice(null)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                {payError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-3xs text-red-700">
                    {payError}
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Service Event:</span>
                    <span className="font-bold text-slate-800">{payModalInvoice.eventName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Total Billed:</span>
                    <span className="font-bold text-slate-800">
                      ₹{Number(payModalInvoice.amount).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Already Paid:</span>
                    <span className="font-bold text-emerald-600">
                      ₹{Number(payModalInvoice.amountPaid || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs font-black text-slate-900">
                    <span>Predefined Payable Amount:</span>
                    <span className="text-blue-600 text-sm">
                      ₹{payAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Step 1: Pay via razorpay.me/@gorepireo */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-3xs font-extrabold uppercase tracking-wider text-blue-800">
                      Step 1 · Pay via Razorpay
                    </span>
                    <span className="text-4xs font-mono font-semibold text-blue-600">
                      razorpay.me/@gorepireo
                    </span>
                  </div>
                  <a
                    href={`https://razorpay.me/@gorepireo/${payAmount}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setRazorpayOpened(true)}
                    className="w-full py-2.5 px-4 bg-[#106ee8] hover:bg-[#0d5ec9] text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>Pay ₹{payAmount.toLocaleString('en-IN')} on Razorpay</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <p className="text-4xs text-slate-500 text-center">
                    Opens Razorpay with the predefined amount of ₹{payAmount.toLocaleString('en-IN')}.
                  </p>
                </div>

                {/* Step 2: Enter Razorpay Payment ID / UTR to Verify */}
                <div className="space-y-1.5">
                  <label className="text-3xs font-bold uppercase tracking-wider text-slate-600">
                    Step 2 · Razorpay Payment ID / UTR Reference
                  </label>
                  <input
                    type="text"
                    value={razorpayRef}
                    onChange={(e) => setRazorpayRef(e.target.value)}
                    placeholder="e.g. pay_Q1abc23XYZ or UTR number"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    required
                  />
                  {razorpayOpened && (
                    <p className="text-4xs text-emerald-600 font-medium">
                      After completing payment on Razorpay, paste the Payment ID or UTR above to generate your receipt.
                    </p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={paying || payAmount <= 0 || razorpayRef.trim().length < 6}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying Payment...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify &amp; Confirm ₹{payAmount.toLocaleString('en-IN')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
