import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Copy,
  Check,
  Printer,
  Send,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { formatINR } from '../utils/formatters';

export default function PaymentReminderModal({ isOpen, onClose, debtorInfo }) {
  const [letterData, setLetterData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const customerName = debtorInfo?.customerName || "Sri Venkateshwara Electricals";
  const amountDue = debtorInfo?.amountDue || 92000;
  const daysOverdue = debtorInfo?.daysOverdue || 75;
  const invoiceRef = debtorInfo?.invoiceRef || "INV-1022";

  useEffect(() => {
    if (isOpen) {
      fetchLetter();
    }
  }, [isOpen, customerName]);

  const fetchLetter = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/payment-reminder?customer_name=${encodeURIComponent(customerName)}&amount_due=${amountDue}&days_overdue=${daysOverdue}&invoice_ref=${invoiceRef}`);
      if (res.ok) setLetterData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!letterData?.letter_body) return;
    navigator.clipboard.writeText(letterData.letter_body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0C1220] border border-emerald-500/40 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Automated Payment Reminder</h3>
              <p className="text-xs text-slate-400">1-Click Polite Overdue Settlement Notice</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400 animate-spin" />
            <div className="text-xs text-slate-400">Drafting professional settlement notice...</div>
          </div>
        ) : letterData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Recipient: <strong className="text-white">{letterData.customer_name}</strong></span>
              <span className="text-rose-400 font-bold">{letterData.days_overdue} Days Overdue</span>
            </div>

            {/* Letter Body Preview */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
              {letterData.letter_body}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all active:scale-95 shadow-md"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy Notice'}</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        ) : null}

      </div>
    </div>
  );
}

