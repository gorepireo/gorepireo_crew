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

      {/* PRINTABLE OFFICIAL RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Official Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-3xs font-bold rounded-xl transition inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="printable-receipt" className="space-y-6 text-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg mb-2">
                    GR
                  </div>
                  <h2 className="text-base font-black text-slate-900">Go_Repireo Crew</h2>
                  <p className="text-3xs text-slate-500">Enterprise Facility Management Services</p>
                  <p className="text-3xs text-slate-400">GSTIN: 27AABCG1234F1Z5</p>
                </div>
                <div className="text-right">
                  <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-3xs font-extrabold uppercase mb-2">
                    Payment Receipt
                  </div>
                  <p className="text-3xs text-slate-500">
                    Receipt Ref: <strong>{selectedReceipt.receiptId}</strong>
                  </p>
                  <p className="text-3xs text-slate-500">Date: {selectedReceipt.paymentDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-3xs font-bold uppercase text-slate-400">Billed To</span>
                  <p className="font-extrabold text-slate-900 mt-0.5">
                    {selectedReceipt.organization?.name || 'Apex Corporate Towers'}
                  </p>
                  <p className="text-3xs text-slate-500">
                    Attn: {selectedReceipt.organization?.contactPerson || 'Authorized Representative'}
                  </p>
                  <p className="text-3xs text-slate-500">
                    {selectedReceipt.organization?.phone} • {selectedReceipt.organization?.email}
                  </p>
                </div>
                <div>
                  <span className="text-3xs font-bold uppercase text-slate-400">
                    Transaction Details
                  </span>
                  <p className="text-3xs font-mono font-bold text-slate-800 mt-0.5 break-all">
                    Txn ID: {selectedReceipt.transactionId}
                  </p>
                  <p className="text-3xs text-slate-600 mt-1">
                    Invoice #: <strong>{selectedReceipt.invoiceNumber}</strong>
                  </p>
                  <p className="text-3xs text-slate-600">
                    Method: <strong>{selectedReceipt.paymentMethod}</strong>
                  </p>
                </div>
              </div>

              <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 text-3xs font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4 text-right">Settled Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">
                          {selectedReceipt.eventName || 'Cleaning Work Order'}
                        </div>
                        <div className="text-3xs text-slate-400">
                          Contract Maintenance Settlement
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-black text-slate-900">
                    <tr>
                      <td className="py-3 px-4 text-right uppercase text-3xs">
                        Total Amount Paid (INR):
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-emerald-600">
                        ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-3xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>
                    This is a computer generated receipt verified by Go_Repireo Crew gateway.
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-2xs font-extrabold text-slate-800">Go_Repireo Accounts</div>
                  <div className="text-4xs text-slate-400">Authorized Digital Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
