import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Repeat, 
  ShieldCheck, 
  PlusCircle, 
  Search, 
  MapPin, 
  Calendar, 
  Star, 
  ArrowRight, 
  AlertCircle,
  Tag,
  CheckCircle,
  Bus,
  Train,
  Ship,
  Plane,
  MessageSquare
} from 'lucide-react';
import { Ticket } from '../types';
import { apiService } from '../services/apiService';
import { useTranslation } from '../TranslationContext';
import { useAuth } from '../AuthContext';

interface ResaleMarketSectionProps {
  initialFrom?: string;
  initialTo?: string;
  initialDate?: string;
}

export const ResaleMarketSection: React.FC<ResaleMarketSectionProps> = ({
  initialFrom = '',
  initialTo = '',
  initialDate = '',
}) => {
  const { user } = useAuth();
  const { lang, t } = useTranslation();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fromFilter, setFromFilter] = useState(initialFrom);
  const [toFilter, setToFilter] = useState(initialTo);
  const [dateFilter, setDateFilter] = useState(initialDate);
  const [typeFilter, setTypeFilter] = useState('all');

  const fetchResaleTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiService.getTickets({
        from: fromFilter,
        to: toFilter,
        date: dateFilter,
      });
      setTickets(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load resale listings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResaleTickets();
  }, [fromFilter, toFilter, dateFilter]);

  const filteredTickets = tickets.filter((tk) => {
    if (typeFilter !== 'all' && tk.transport_type.toLowerCase() !== typeFilter) {
      return false;
    }
    return true;
  });

  const getTransportIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('bus')) return <Bus className="w-4 h-4 text-emerald-600" />;
    if (t.includes('train')) return <Train className="w-4 h-4 text-orange-600" />;
    if (t.includes('launch') || t.includes('ferry') || t.includes('ship')) return <Ship className="w-4 h-4 text-blue-600" />;
    if (t.includes('air') || t.includes('flight')) return <Plane className="w-4 h-4 text-sky-600" />;
    return <Repeat className="w-4 h-4 text-purple-600" />;
  };

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Marketplace Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-10 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-300" />
              <span>{lang === 'en' ? 'BariJao Safe P2P Ticket Exchange' : 'বাড়িযাও নিরাপদ পি২পি টিকিট বিনিময়'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight leading-tight mb-2">
              {lang === 'en' ? 'Buy & Resell Spare Travel Tickets' : 'অতিরিক্ত ভ্রমণ টিকিট ক্রয় ও বিক্রয় করুন'}
            </h2>

            <p className="text-purple-100/80 text-xs sm:text-sm leading-relaxed">
              {lang === 'en'
                ? 'Can no longer travel? Don’t waste your ticket! Resell it safely to fellow travelers at fair price, without Facebook black-market scam risks.'
                : 'ভ্রমণ বাতিল হয়েছে? টিকিট নষ্ট করবেন না! ফেসবুকের অনিরাপদ ব্ল্যাকমার্কেটের ঝুঁকি এড়িয়ে সহযাত্রীদের কাছে ন্যায্য মূল্যে নিরাপদে টিকিট হস্তান্তর করুন।'}
            </p>

            {/* Safety guarantees */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-purple-200">
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'en' ? 'Seat number hidden until purchase' : 'কেনার আগে সিট নম্বর গোপন'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'en' ? 'Private 1-on-1 Buyer-Seller Chat' : 'প্রাইভেট ক্রেতা-বিক্রেতা চ্যাট'}
              </span>
              <span className="flex items-center gap-1.5 font-semibold">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                {lang === 'en' ? 'Verified Seller Reviews' : 'যাচাইকৃত বিক্রেতা রিভিউ'}
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <Link
              to="/sell"
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'en' ? 'List My Spare Ticket' : 'আমার টিকিট লিস্টিং করুন'}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Filter and Category Row */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs mb-8 flex flex-wrap items-center justify-between gap-4">
        {/* Mode filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'bus', 'train', 'launch', 'air'].map((tp) => (
            <button
              key={tp}
              type="button"
              onClick={() => setTypeFilter(tp)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors cursor-pointer ${
                typeFilter === tp
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tp === 'all' ? (lang === 'en' ? 'All Types' : 'সব ধরন') : tp}
            </button>
          ))}
        </div>

        {/* Live Counter */}
        <div className="text-xs text-gray-500 font-semibold">
          {filteredTickets.length} {lang === 'en' ? 'spare tickets available for resale' : 'টি রিসেল টিকিট পাওয়া গেছে'}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-gray-500">
            {lang === 'en' ? 'Loading community resale tickets...' : 'কমিউনিটি রিসেল টিকিট লোড হচ্ছে...'}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2 max-w-xl mx-auto my-10">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTickets.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-2xl font-bold">
            🎟️
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {lang === 'en' ? 'No Resale Tickets Found' : 'কোনো রিসেল টিকিট পাওয়া যায়নি'}
          </h3>
          <p className="text-xs text-gray-500">
            {lang === 'en'
              ? 'No one has listed tickets matching your search yet. Have an unused ticket yourself? Be the first to list it!'
              : 'আপনার অনুসন্ধানের সাথে মিলে এমন কোনো রিসেল টিকিট নেই। আপনার কাছে বাড়তি টিকিট থাকলে আপনি নিজেই লিস্টিং করতে পারেন!'}
          </p>
          <Link
            to="/sell"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{lang === 'en' ? 'Post Ticket for Sale' : 'বিক্রির জন্য পোস্ট করুন'}</span>
          </Link>
        </div>
      )}

      {/* Ticket Grid */}
      {!loading && !error && filteredTickets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTickets.map((ticket) => {
            const savings = ticket.original_price - ticket.asking_price;
            return (
              <div
                key={ticket.id}
                className="bg-white rounded-3xl p-5 border border-gray-200/90 hover:border-purple-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top line: Transport Type & Operator */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center">
                        {getTransportIcon(ticket.transport_type)}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-gray-900 group-hover:text-purple-700 transition-colors">
                          {ticket.operator_name}
                        </h4>
                        <span className="text-[10px] text-gray-400 capitalize font-medium">
                          {ticket.transport_type}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider">
                      Resale
                    </span>
                  </div>

                  {/* Route & Date */}
                  <div className="py-4 space-y-2">
                    <div className="flex items-center justify-between text-sm font-extrabold text-gray-900">
                      <span>{ticket.from_location}</span>
                      <span className="text-gray-300">→</span>
                      <span>{ticket.to_location}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {ticket.journey_date}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200/60">
                        Seat: {ticket.seat_number ? (user ? ticket.seat_number : '🔒 Hidden') : 'General'}
                      </span>
                    </div>
                  </div>

                  {/* Seller Info & Trust badge */}
                  <div className="bg-slate-50 rounded-2xl p-3 flex items-center justify-between text-xs mb-4">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">SELLER</span>
                      <span className="font-bold text-gray-800">{ticket.seller?.name || 'Verified Member'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{ticket.seller?.rating ? ticket.seller.rating.toFixed(1) : '5.0'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Pricing & Action Button */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-black text-gray-900">৳{ticket.asking_price}</span>
                      {savings > 0 && (
                        <span className="text-xs text-gray-400 line-through">৳{ticket.original_price}</span>
                      )}
                    </div>
                    {savings > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600">
                        {lang === 'en' ? `Save ৳${savings}` : `৳${savings} সাশ্রয়`}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/ticket/${ticket.id}`}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition-transform hover:scale-105"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{lang === 'en' ? 'Chat & Buy' : 'চ্যাট ও ক্রয়'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ResaleMarketSection;
