import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket as TicketIcon,
  PhoneCall,
  Copy,
  Check
} from 'lucide-react';
import { OfficialBooking } from '../types';
import { useTranslation } from '../TranslationContext';

interface TicketVoucherModalProps {
  booking: OfficialBooking;
  onClose: () => void;
}

export const TicketVoucherModal: React.FC<TicketVoucherModalProps> = ({ booking, onClose }) => {
  const { lang, t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  const handleCopyPnr = () => {
    navigator.clipboard.writeText(booking.pnr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Action Bar (hidden in print) */}
        <div className="print:hidden bg-emerald-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            <span className="font-extrabold text-sm tracking-wide">
              {lang === 'en' ? 'E-Ticket Confirmed & Issued!' : 'ই-টিকিট নিশ্চিত ও ইস্যু হয়েছে!'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printTicket || 'Print Voucher'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Body */}
        <div className="p-6 sm:p-8 space-y-6 printable-voucher">
          {/* Ticket Header & PNR Banner */}
          <div className="border-b-2 border-dashed border-gray-200 pb-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-800 tracking-tight">BariJao</span>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Official E-Ticket
                  </span>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                  {lang === 'en' ? 'Authorized Electronic Passenger Travel Document' : 'অনুমোদিত ইলেকট্রনিক যাত্রী ভ্রমণ দলিল'}
                </p>
              </div>

              {/* PNR Box */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-right">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-emerald-700 block">
                  PNR / BOOKING ID
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base sm:text-lg font-black text-emerald-950 tracking-wider">
                    {booking.pnr}
                  </span>
                  <button
                    onClick={handleCopyPnr}
                    title="Copy PNR"
                    className="print:hidden text-emerald-600 hover:text-emerald-800 p-1 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Route & Operator Highlights */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200/60 pb-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">OPERATOR</span>
                <h4 className="text-lg font-black text-gray-900">{booking.operator_name}</h4>
                <p className="text-xs font-semibold text-emerald-700">{booking.service_type}</p>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">VEHICLE / FLEET NO</span>
                <p className="text-sm font-extrabold text-gray-800">{booking.coach_number || 'Standard Express'}</p>
                <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md uppercase tracking-wider mt-1">
                  Confirmed
                </span>
              </div>
            </div>

            {/* Travel Route & Times */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold block uppercase text-[10px]">FROM (ORIGIN)</span>
                <p className="text-sm font-extrabold text-gray-900">{booking.from_location}</p>
                <p className="text-gray-600 font-medium mt-0.5">{booking.boarding_point}</p>
              </div>

              <div className="sm:text-center flex flex-col justify-center">
                <span className="text-gray-400 font-bold block uppercase text-[10px]">DEPARTURE TIME</span>
                <p className="text-sm font-black text-emerald-700">{booking.departure_time}</p>
                <p className="text-[10px] text-gray-400 font-medium">Reporting: 30 min before</p>
              </div>

              <div className="sm:text-right">
                <span className="text-gray-400 font-bold block uppercase text-[10px]">TO (DESTINATION)</span>
                <p className="text-sm font-extrabold text-gray-900">{booking.to_location}</p>
                <p className="text-gray-600 font-medium mt-0.5">{booking.dropping_point}</p>
              </div>
            </div>
          </div>

          {/* Passenger & Seats Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-1 text-xs">
            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px] block">JOURNEY DATE</span>
              <p className="font-extrabold text-gray-900">{booking.journey_date}</p>
            </div>

            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px] block">SEAT NUMBER(S)</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {booking.seats.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-extrabold text-xs shadow-2xs"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px] block">PASSENGER NAME</span>
              <p className="font-extrabold text-gray-900 truncate">{booking.passenger_name}</p>
              <p className="text-[10px] text-gray-500 capitalize">{booking.passenger_gender}</p>
            </div>

            <div>
              <span className="text-gray-400 font-bold uppercase text-[10px] block">CONTACT MOBILE</span>
              <p className="font-extrabold text-gray-900">{booking.passenger_phone}</p>
            </div>
          </div>

          {/* Payment Details & Security Barcode */}
          <div className="border-t border-gray-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Barcode & Verification Visual */}
            <div className="space-y-1.5 text-center sm:text-left">
              {/* Simulated barcode */}
              <div className="font-mono text-xs tracking-widest text-gray-400">
                ||| | ||||| || |||| ||| ||||| ||| ||
              </div>
              <p className="text-[10px] text-gray-400">
                TXN ID: <strong className="text-gray-600">{booking.transaction_id || 'TXN-BKASH-8941'}</strong>
              </p>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified by BariJao Security Gate</span>
              </div>
            </div>

            {/* Total Paid Summary */}
            <div className="bg-emerald-50 rounded-2xl p-3 sm:px-5 sm:py-3 text-right">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 block">TOTAL FARE PAID</span>
              <span className="text-xl font-black text-emerald-800">৳{booking.net_payable}</span>
              <span className="text-[10px] text-gray-500 block capitalize">Via {booking.payment_method}</span>
            </div>
          </div>

          {/* Terms & Helpline Notice */}
          <div className="bg-gray-50 rounded-2xl p-4 text-[11px] text-gray-500 space-y-1">
            <p className="font-semibold text-gray-700">Important Instructions for Passenger:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              <li>Please reach the boarding counter at least 30 minutes before scheduled departure time.</li>
              <li>Show this digital e-ticket SMS or printout along with a valid photo ID card at the counter.</li>
              <li>In case of delays or schedule inquiries, contact operator helpline or BariJao Support: 16XXX.</li>
            </ul>
          </div>
        </div>

        {/* Footer Buttons (print:hidden) */}
        <div className="print:hidden bg-gray-50 px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            {lang === 'en' ? 'An SMS and Email voucher has also been dispatched.' : 'একটি নিশ্চিতকরণ এসএমএস আপনার মোবাইলে পাঠানো হয়েছে।'}
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-emerald-600/20"
            >
              <Printer className="w-4 h-4" />
              <span>{t.printTicket || 'Print / Save PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold text-xs hover:bg-gray-100 cursor-pointer transition-colors"
            >
              {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TicketVoucherModal;
