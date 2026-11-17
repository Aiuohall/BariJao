import React, { useState } from 'react';
import { X, Search, FileText, AlertCircle, Ticket as TicketIcon } from 'lucide-react';
import { OfficialBooking } from '../types';
import { apiService } from '../services/apiService';
import { useTranslation } from '../TranslationContext';
import { TicketVoucherModal } from './TicketVoucherModal';

interface PnrLookupModalProps {
  onClose: () => void;
}

export const PnrLookupModal: React.FC<PnrLookupModalProps> = ({ onClose }) => {
  const { lang, t } = useTranslation();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundBooking, setFoundBooking] = useState<OfficialBooking | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const data = await apiService.getBookingByPnr(query.trim());
      setFoundBooking(data);
    } catch (err: any) {
      setError(
        lang === 'en'
          ? 'No active booking found with this PNR or Mobile number. Please double check and try again.'
          : 'এই পিএনআর বা মোবাইল নম্বরে কোনো সক্রিয় বুকিং পাওয়া যায়নি। অনুগ্রহ করে পুনরায় যাচাই করুন।'
      );
    } finally {
      setLoading(false);
    }
  };

  if (foundBooking) {
    return (
      <TicketVoucherModal
        booking={foundBooking}
        onClose={() => {
          setFoundBooking(null);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 p-6 sm:p-7">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">
                {t.checkPnr || 'Check Ticket / PNR Status'}
              </h3>
              <p className="text-[11px] text-gray-500">
                {lang === 'en' ? 'Search & print your confirmed e-ticket' : 'আপনার নিশ্চিত টিকিট খুঁজুন ও প্রিন্ট করুন'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSearch} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              {lang === 'en' ? 'Booking PNR or Passenger Mobile Number' : 'বুকিং পিএনআর অথবা যাত্রীর মোবাইল নম্বর'}
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BJ-BUS-829140 or 017XXXXXXXX"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 uppercase"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-emerald-600/20"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>{lang === 'en' ? 'Find My E-Ticket' : 'ই-টিকিট খুঁজুন'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
export default PnrLookupModal;
