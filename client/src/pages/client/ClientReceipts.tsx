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
  Building2,
  X,
  CreditCard,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';

export const ClientReceipts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
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
      const res = await api.getClientPayments();
      setPayments(res.payments || []);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Payment History & Receipts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Official tax receipts and transaction ledger for all settled contract invoices
        </p>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-200/80">
          <h2 className="text-base font-bold text-slate-900">Settled Transactions</h2>
          <p className="text-3xs text-slate-500">Click on any transaction to view and print the official receipt</p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Loading receipts...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-xs">{error}</div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-xs font-bold text-slate-700">No payment receipts available</h3>
            <p className="text-3xs text-slate-400">
              Receipts will appear here once an invoice payment has been confirmed.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/50 text-slate-500 text-3xs font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Transaction ID</th>
                  <th className="py-3.5 px-4">Invoice #</th>
                  <th className="py-3.5 px-4">Service Event</th>
                  <th className="py-3.5 px-4">Payment Date</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4 text-right">Amount Paid</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {payments.map((p) => (
                  <tr
                    key={p.paymentId}
                    onClick={() => handleOpenReceipt(p.paymentId)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-4 sm:px-6 font-mono text-3xs font-bold text-slate-900 whitespace-nowrap">
                      {p.transactionId}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap font-bold text-blue-600">
                      {p.invoiceNumber}
                    </td>
                    <td className="py-4 px-4 max-w-xs truncate text-slate-800">
                      {p.eventName || 'Scheduled Service'}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-3xs text-slate-500">
                      {p.paymentDate}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap text-3xs font-semibold text-slate-600">
                      {p.paymentMethod}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-4xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        SUCCESS
                      </span>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenReceipt(p.paymentId);
                        }}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-3xs font-bold rounded-xl transition inline-flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE OFFICIAL RECEIPT MODAL */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 space-y-6">
            {/* Modal Actions */}
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

            {/* RECEIPT DOCUMENT (Printable Area) */}
            <div id="printable-receipt" className="space-y-6 text-slate-800">
              {/* Receipt Header */}
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
                  <p className="text-3xs text-slate-500">Receipt Ref: <strong>{selectedReceipt.receiptId}</strong></p>
                  <p className="text-3xs text-slate-500">Date: {selectedReceipt.paymentDate}</p>
                </div>
              </div>

              {/* Bill To & Transaction Info */}
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
                  <span className="text-3xs font-bold uppercase text-slate-400">Transaction Details</span>
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

              {/* Service Line Items */}
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
                        <div className="font-bold text-slate-900">{selectedReceipt.eventName || 'Cleaning Work Order'}</div>
                        <div className="text-3xs text-slate-400">Contract Maintenance Settlement</div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-black text-slate-900">
                    <tr>
                      <td className="py-3 px-4 text-right uppercase text-3xs">Total Amount Paid (INR):</td>
                      <td className="py-3 px-4 text-right text-sm text-emerald-600">
                        ₹{Number(selectedReceipt.amount).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Verification & Digital Stamp */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between text-3xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>This is a computer generated receipt verified by Go_Repireo Crew gateway.</span>
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
