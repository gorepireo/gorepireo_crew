import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Invoice } from '../../types';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Receipt,
  X,
  ShieldCheck,
  Building2,
  DollarSign,
  Loader2,
  Sparkles,
  Check,
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

  // Pay Now Modal State
  const [payModalInvoice, setPayModalInvoice] = useState<Invoice | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<'ONLINE' | 'UPI' | 'NETBANKING'>('ONLINE');
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
    setPaySuccess(null);
    setPayError(null);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalInvoice) return;
    if (payAmount <= 0) {
      setPayError('Please enter a valid payment amount');
      return;
    }

    try {
      setPaying(true);
      setPayError(null);
      const res = await api.payClientInvoice(payModalInvoice.invoiceId, {
        amount: Number(payAmount),
        paymentMethod: payMethod,
      });

      setPaySuccess(`Payment of ₹${Number(payAmount).toLocaleString('en-IN')} confirmed! Transaction ID: ${res.transactionId}`);
      setTimeout(() => {
        fetchInvoices();
      }, 1000);
    } catch (err: any) {
      console.error('[PAYMENT PROCESS] Error:', err);
      setPayError(err?.message || 'Payment processing failed. Please try again.');
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
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Payments & Invoices
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track contract billing, settle pending invoices, and download instant payment receipts
        </p>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
            Total Contract Amount
          </span>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              ₹{summary.totalContractAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-3xs text-slate-400 mt-0.5">All issued invoices</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
            Total Paid
          </span>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-emerald-600">
              ₹{summary.totalPaid.toLocaleString('en-IN')}
            </div>
            <p className="text-3xs text-slate-400 mt-0.5">Cleared settlements</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
            Outstanding Amount
          </span>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              ₹{summary.outstandingAmount.toLocaleString('en-IN')}
            </div>
            <p className="text-3xs text-slate-400 mt-0.5">Balance due</p>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <span className="text-3xs sm:text-2xs font-bold uppercase tracking-wider text-slate-500">
            Account Status
          </span>
          <div className="mt-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {summary.outstandingAmount === 0 ? 'Fully Paid' : 'Active Contract'}
            </div>
            <p className="text-3xs text-slate-400 mt-1">Verified partner</p>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Contract Invoices</h2>
            <p className="text-3xs text-slate-500">Directly associated with verified cleaning operations</p>
          </div>
          <button
            onClick={() => navigate('/client/receipts')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>View All Receipts</span>
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading invoices...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-xs">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-700">No invoices generated yet</h3>
            <p className="text-3xs text-slate-400">
              Invoices will appear here once your cleaning service events are scheduled and billed.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map((inv) => {
              const remaining = Math.max(0, Number(inv.amount) - Number(inv.amountPaid || 0));
              const isUnpaid = inv.status !== 'PAID' && remaining > 0;

              return (
                <div key={inv.invoiceId} className="p-4 space-y-2.5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{inv.invoiceNumber}</span>
                        <span
                          className={`inline-block text-4xs font-extrabold px-2 py-0.5 rounded-full border ${getStatusBadge(
                            inv.status
                          )}`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1 line-clamp-1">
                        {inv.eventName || 'Scheduled Service'}
                      </p>
                      <p className="text-3xs text-slate-400 line-clamp-1">
                        {inv.description || 'Facility Maintenance'}
                      </p>
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

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-3xs">
                    <div className="text-slate-500">
                      <span>Issued: {inv.issueDate || inv.invoiceDate}</span>
                      <span className="mx-1.5">•</span>
                      <span>Due: {inv.dueDate}</span>
                    </div>

                    {isUnpaid ? (
                      <button
                        onClick={() => handleOpenPayModal(inv)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-3xs font-bold rounded-xl transition shadow-xs active:scale-95"
                      >
                        Pay Now
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/client/receipts')}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-3xs font-bold rounded-xl transition inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        Receipt
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-black text-slate-900">
                    <span>Balance Due:</span>
                    <span className="text-blue-600">
                      ₹
                      {Math.max(
                        0,
                        Number(payModalInvoice.amount) - Number(payModalInvoice.amountPaid || 0)
                      ).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Amount to Pay */}
                <div className="space-y-1">
                  <label className="text-3xs font-bold uppercase tracking-wider text-slate-600">
                    Amount to Settle (INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      max={Number(payModalInvoice.amount) - Number(payModalInvoice.amountPaid || 0)}
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white"
                      required
                    />
                  </div>
                  <p className="text-4xs text-slate-400">
                    Partial payment is supported for contract milestones.
                  </p>
                </div>

                {/* Payment Gateway Method */}
                <div className="space-y-1.5">
                  <label className="text-3xs font-bold uppercase tracking-wider text-slate-600">
                    Payment Gateway
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'ONLINE', label: 'Card / Netbanking' },
                      { id: 'UPI', label: 'Instant UPI' },
                      { id: 'NETBANKING', label: 'Corporate RTGS' },
                    ].map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPayMethod(m.id as any)}
                        className={`p-2.5 rounded-xl border text-3xs font-bold text-center transition ${
                          payMethod === m.id
                            ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={paying || payAmount <= 0}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                  >
                    {paying ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Verifying with Gateway...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Confirm & Authorize ₹{Number(payAmount).toLocaleString('en-IN')}</span>
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
