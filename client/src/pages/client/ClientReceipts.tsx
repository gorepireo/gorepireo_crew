import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Payment } from '../../types';
import {
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Clock,
  X,
  ShieldCheck,
  Loader2,
  FileText,
} from 'lucide-react';

export const ClientReceipts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Selected receipt modal state
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const [payRes, invRes] = await Promise.all([
        api.getClientPayments(),
        api.getClientInvoices().catch(() => ({ invoices: [] })),
      ]);
      setPayments(payRes.payments || []);
      const unpaid = (invRes.invoices || []).filter((i: any) => i.status !== 'PAID').length;
      setPendingCount(unpaid);
    } catch (err: any) {
      console.error('[CLIENT RECEIPTS] Error:', err);
      setError(err?.message || 'Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReceipt = async (paymentId: string) => {
    try {
      setReceiptLoading(true);
      const res = await api.getClientReceipt(paymentId);
      setSelectedReceipt(res.receipt);
    } catch (err: any) {
      console.error('[RECEIPT DETAIL] Error:', err);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const totalPaymentsAmount = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-4">
      {/* FULL-BLEED HERO HEADER */}
      <div className="relative bg-gradient-to-b from-[#06122c] via-[#133274] to-[#1e4aa8] px-4 pt-16 pb-8 overflow-hidden">
        {/* Stylized Receipt Graphic on Right */}
        <div className="absolute right-4 top-16 opacity-90 pointer-events-none">
          <div className="w-16 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-white shadow-lg p-2.5 flex flex-col justify-between relative rotate-3 border border-white/60">
            <div className="space-y-1.5">
              <div className="h-1.5 w-8 bg-blue-500 rounded-full" />
              <div className="h-1.5 w-10 bg-blue-200 rounded-full" />
              <div className="h-1.5 w-6 bg-blue-200 rounded-full" />
            </div>
            <div className="text-right font-bold text-xs text-blue-600">₹</div>
            <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md ring-2 ring-white">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#eef3f9] to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-2 max-w-[75%]">
          <h1 className="text-xl font-black text-white leading-tight tracking-tight">
            Payment History & Receipts
          </h1>
          <p className="text-xs text-blue-100/90 leading-relaxed border-l-2 border-blue-400 pl-2.5">
            Official tax receipts and transaction ledger for all settled contract invoices
          </p>
        </div>
      </div>

      {/* BODY CONTENT */}
      <div className="px-3.5 -mt-4 relative z-10 space-y-4">
        {/* 3-Column KPI Summary */}
        <div className="grid grid-cols-3 gap-2.5">
          {/* Total Payments */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-blue-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <p className="text-4xs font-semibold text-slate-500 leading-tight">Total Payments</p>
              <div className="text-sm font-black text-slate-900 mt-0.5 truncate">
                ₹{totalPaymentsAmount.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Settled Invoices */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-emerald-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <p className="text-4xs font-semibold text-slate-500 leading-tight">Settled Invoices</p>
              <div className="text-sm font-black text-slate-900 mt-0.5">{payments.length}</div>
            </div>
          </div>

          {/* Pending Invoices */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/70 shadow-sm relative overflow-hidden">
            <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full bg-indigo-50/90 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <p className="text-4xs font-semibold text-slate-500 leading-tight">Pending Invoices</p>
              <div className="text-sm font-black text-slate-900 mt-0.5">{pendingCount}</div>
            </div>
          </div>
        </div>

        {/* Settled Transactions Card */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-4 space-y-3.5">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900">Settled Transactions</h2>
              <p className="text-3xs text-slate-500 leading-snug">
                Click on any transaction to view and print the official receipt
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Loading receipts...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600 text-xs">{error}</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-center space-y-2 border border-slate-200/70 rounded-2xl bg-[#f8fafc]">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-xs font-bold text-slate-700">No payment receipts available</h3>
              <p className="text-3xs text-slate-400">
                Receipts will appear here once an invoice payment has been confirmed.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {payments.map((p) => (
                <div
                  key={p.paymentId}
                  onClick={() => handleOpenReceipt(p.paymentId)}
                  className="p-3.5 bg-[#f8fafc] hover:bg-white rounded-2xl border border-slate-200/80 space-y-2.5 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-200/60 rounded-xl shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-blue-600">{p.invoiceNumber}</span>
                          <span className="inline-flex items-center gap-0.5 text-4xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            SUCCESS
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-1 line-clamp-1">
                          {p.eventName || 'Scheduled Service'}
                        </p>
                        <p className="font-mono text-4xs text-slate-400 mt-0.5 truncate">
                          Txn: {p.transactionId}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-slate-900">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </div>
                      <span className="inline-block text-4xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
                        {p.paymentMethod}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 text-3xs">
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {p.paymentDate?.slice(0, 10)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceipt(p.paymentId);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-3xs font-bold rounded-full transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        <span>View Receipt</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceipt(p.paymentId);
                        }}
                        title="Download / Print"
                        className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-full transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRINTABLE OFFICIAL RECEIPT MODAL (Perforated Ticket Style) */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
          {/* Top Action Pill Row (Hidden when printing) */}
          <div className="w-full max-w-sm flex items-center justify-between mb-3 print:hidden">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-full shadow-lg inline-flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={() => setSelectedReceipt(null)}
              className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-700 flex items-center justify-center shadow-lg transition"
              aria-label="Close receipt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* TICKET RECEIPT CARD */}
          <div
            id="printable-receipt"
            className="w-full max-w-sm drop-shadow-2xl overflow-visible relative animate-in zoom-in-95"
          >
            {/* 1. Top Celebration / Confirmation Header */}
            <div className="bg-white rounded-t-3xl px-6 pt-7 pb-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-50 to-emerald-50 border border-blue-100 flex items-center justify-center mx-auto shadow-2xs text-2xl">
                🎉
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Thank you!</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[230px] mx-auto">
                Your payment receipt has been issued successfully
              </p>
            </div>

            {/* True Transparent Perforated Divider 1 */}
            <div className="relative flex items-center h-6 w-full">
              <div
                className="w-1/2 h-full"
                style={{
                  background: 'radial-gradient(circle at 0% 50%, transparent 10px, #ffffff 10.5px)',
                }}
              />
              <div
                className="w-1/2 h-full"
                style={{
                  background: 'radial-gradient(circle at 100% 50%, transparent 10px, #ffffff 10.5px)',
                }}
              />
              <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-200" />
            </div>

            {/* 2. Receipt Metadata */}
            <div className="bg-white px-6 py-4 space-y-4">
              {/* Receipt ID & Amount */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-4xs font-bold uppercase tracking-wider text-slate-400 block">
                    RECEIPT ID
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block">
                    {selectedReceipt.receiptNumber || selectedReceipt.receiptId}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-4xs font-bold uppercase tracking-wider text-slate-400 block">
                    Amount
                  </span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Date & Time + UTR / Reference Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-4xs font-bold uppercase tracking-wider text-slate-400 block">
                    DATE & TIME
                  </span>
                  <span className="text-xs font-bold text-slate-900 mt-0.5 block">
                    {(() => {
                      const raw = selectedReceipt.paymentDate || selectedReceipt.createdAt;
                      if (!raw) return 'N/A';
                      const d = new Date(raw);
                      if (isNaN(d.getTime())) return raw;
                      const datePart = d.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });
                      const timePart = d.toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      });
                      return `${datePart} • ${timePart}`;
                    })()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-4xs font-bold uppercase tracking-wider text-slate-400 block">
                    UTR / REF NO.
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono mt-0.5 block break-all">
                    {selectedReceipt.transactionId || selectedReceipt.utr || 'N/A'}
                  </span>
                </div>
              </div>

              {/* Invoice & Event */}
              <div>
                <span className="text-4xs font-bold uppercase tracking-wider text-slate-400 block">
                  INVOICE & SERVICE
                </span>
                <span className="text-xs font-bold text-blue-600 mt-0.5 block">
                  {selectedReceipt.invoiceNumber}
                </span>
                <span className="text-3xs text-slate-600 line-clamp-1">
                  {selectedReceipt.eventName || 'Contract Maintenance Settlement'}
                </span>
              </div>

              {/* Payer & Method Pill Card */}
              <div className="bg-[#f4f6fa] rounded-2xl p-3 flex items-center gap-3 border border-slate-200/50">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {selectedReceipt.organizationName ||
                      selectedReceipt.organization?.name ||
                      'Apex Corporate Towers'}
                  </p>
                  <p className="text-3xs text-slate-500 font-mono truncate">
                    Paid via {selectedReceipt.paymentMethod} • Verified
                  </p>
                </div>
              </div>
            </div>

            {/* True Transparent Perforated Divider 2 */}
            <div className="relative flex items-center h-5 w-full">
              <div
                className="w-1/2 h-full"
                style={{
                  background: 'radial-gradient(circle at 0% 50%, transparent 8px, #ffffff 8.5px)',
                }}
              />
              <div
                className="w-1/2 h-full"
                style={{
                  background: 'radial-gradient(circle at 100% 50%, transparent 8px, #ffffff 8.5px)',
                }}
              />
              <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t border-dashed border-slate-200" />
            </div>

            {/* 3. Barcode & Verification Footer */}
            <div className="bg-white px-6 pt-4 pb-5 text-center space-y-2">
              <svg
                viewBox="0 0 220 46"
                className="w-52 h-11 mx-auto text-slate-900"
                aria-label="Receipt verification barcode"
              >
                {Array.from({ length: 44 }).map((_, i) => {
                  const seed =
                    (selectedReceipt.transactionId || 'GR2026').charCodeAt(
                      i % (selectedReceipt.transactionId?.length || 6)
                    ) + i * 7;
                  const width = (seed % 3) + 1;
                  const x = i * 5;
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={0}
                      width={width}
                      height={44}
                      fill="currentColor"
                    />
                  );
                })}
              </svg>
              <p className="text-4xs font-mono tracking-[0.25em] text-slate-500 uppercase">
                {(selectedReceipt.transactionId || 'GR2026981240').slice(0, 14)}
              </p>
              <p className="text-4xs text-slate-400 pt-1">
                Go_Repireo Crew • Verified Digital Seal
              </p>
            </div>

            {/* Scalloped Bottom Edge */}
            <div
              className="h-3 w-full"
              style={{
                background:
                  'radial-gradient(circle at 10px 12px, transparent 6px, #ffffff 6.5px)',
                backgroundSize: '20px 12px',
                backgroundRepeat: 'repeat-x',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
