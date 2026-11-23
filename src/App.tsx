// BariJao v2.0 - E-Ticketing & P2P Resale Marketplace
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { TranslationProvider, useTranslation } from './TranslationContext';
import { BANGLADESH_DISTRICTS } from './constants';
import { apiService } from './services/apiService';
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogOut, Menu, X, Ticket as TicketIcon, MessageSquare, Shield, PlusCircle, Star, Mail, Phone, Lock, Edit2, Save, RefreshCw, ChevronRight, Eye, EyeOff, Repeat, Bus, Train, Ship, Plane, CheckCircle, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Navbar } from './components/Navbar';
import { HeroSearch } from './components/HeroSearch';
import { TripResults } from './components/TripResults';
import { ResaleMarketSection } from './components/ResaleMarketSection';
import { PopularRoutesSection } from './components/PopularRoutesSection';
import { OperatorPartnersSection } from './components/OperatorPartnersSection';
import { WhyBariJaoSection } from './components/WhyBariJaoSection';
import { PnrLookupModal } from './components/PnrLookupModal';
import { TicketVoucherModal } from './components/TicketVoucherModal';
import { ChatBox } from './components/ChatBox';
import { OfficialTrip, OfficialBooking } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Round profile photo with an initial-letter fallback when no photo is set.
const Avatar = ({ src, name, size = 40, className = '' }: { src?: string | null; name?: string; size?: number; className?: string }) => {
  const initial = (name || 'U').charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        style={{ width: size, height: size }}
        className={cn('rounded-full object-cover bg-gray-100', className)}
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      className={cn('rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center shrink-0', className)}
    >
      {initial}
    </div>
  );
};

// Downscale an image File to a small square data URL (keeps avatars tiny so they
// fit in the database and load fast). Returns a JPEG data URL string.
function fileToAvatarDataUrl(file: File, max = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// --- Components ---

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
};

const ServerStatus = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'unknown'>('unknown');
  const [retryCount, setRetryCount] = useState(0);

  const check = async () => {
    setStatus('checking');
    try {
      const res = await fetch(`/api/health?t=${Date.now()}`);
      if (res.ok) {
        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.status === 'ok') {
            setStatus('online');
            // data.database is now { useSupabase: boolean, isReady: boolean, connected?: boolean }
            const isDbOk = typeof data.database === 'object' ? (data.database.connected || data.database.isReady) : false;
            setDbStatus(isDbOk ? 'connected' : 'error');
            return;
          }
        } else {
          // If it's HTML, it's likely the AI Studio proxy page
          const text = await res.text();
          if (text.includes('Please wait while your application starts')) {
            console.log('Server is still starting up...');
          }
        }
      } else {
        console.error('Health check failed with status:', res.status);
      }
    } catch (e: any) {
      console.error('Health check error:', e.message);
    }
    setStatus('offline');
    setDbStatus('error');
  };

  useEffect(() => {
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [retryCount]);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border shadow-sm transition-all",
        status === 'online' ? "border-emerald-100" : "border-red-200 bg-red-50"
      )}>
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          status === 'checking' ? "bg-amber-400 animate-pulse" :
          status === 'online' ? "bg-emerald-500" : "bg-red-500"
        )} />
        <span className={cn(
          "text-[10px] font-bold uppercase tracking-wider",
          status === 'online' ? "text-emerald-600" : 
          status === 'checking' ? "text-amber-600" : "text-red-600"
        )}>
          {status === 'online' ? 'System Online' :
           status === 'checking' ? 'Checking...' : 'System Offline'}
        </span>
        {status === 'offline' && (
          <button 
            onClick={() => setRetryCount(c => c + 1)}
            className="ml-1 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className={cn("w-3 h-3", status === 'checking' && "animate-spin")} />
          </button>
        )}
      </div>
    </div>
  );
};

// --- Pages ---

const SellTicket = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    transport_type: 'bus',
    operator_name: '',
    from_location: '',
    to_location: '',
    journey_date: '',
    seat_number: '',
    original_price: '',
    asking_price: '',
    ticket_purchase_date: '',
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });

  const handleDistrictSearch = (field: 'from' | 'to', val: string) => {
    setFormData({ ...formData, [field === 'from' ? 'from_location' : 'to_location']: val });
    if (val.length > 0) {
      const query = val.toLowerCase();
      const filtered = BANGLADESH_DISTRICTS.filter(d => d.toLowerCase().includes(query));
      setSuggestions({ ...suggestions, [field]: filtered.slice(0, 5) });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => data.append(key, val as string));
      if (image) data.append('ticket_image', image);

      await apiService.createTicket(data);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">List Your Ticket</h1>
        <p className="text-gray-500 mb-8">Fill in the details to list your ticket for sale.</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Transport Type</label>
              <select 
                value={formData.transport_type}
                onChange={(e) => setFormData({...formData, transport_type: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              >
                <option value="bus">Bus</option>
                <option value="train">Train</option>
                <option value="launch">Launch</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Operator Name</label>
              <input 
                type="text" required
                value={formData.operator_name}
                onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="e.g. Hanif, Green Line"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">From</label>
              <input 
                type="text" required
                value={formData.from_location}
                onChange={(e) => handleDistrictSearch('from', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="Starting Point"
              />
              {suggestions.from.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-2 z-30 overflow-hidden">
                  {suggestions.from.map(d => (
                    <button 
                      key={d} type="button"
                      onClick={() => { setFormData({...formData, from_location: d}); setSuggestions({...suggestions, from: []}); }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-gray-700 text-sm font-medium transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">To</label>
              <input 
                type="text" required
                value={formData.to_location}
                onChange={(e) => handleDistrictSearch('to', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="Destination"
              />
              {suggestions.to.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-2 z-30 overflow-hidden">
                  {suggestions.to.map(d => (
                    <button 
                      key={d} type="button"
                      onClick={() => { setFormData({...formData, to_location: d}); setSuggestions({...suggestions, to: []}); }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-gray-700 text-sm font-medium transition-colors"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Journey Date</label>
              <input 
                type="date" required
                value={formData.journey_date}
                onChange={(e) => setFormData({...formData, journey_date: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Seat Number</label>
              <input 
                type="text" required
                value={formData.seat_number}
                onChange={(e) => setFormData({...formData, seat_number: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="e.g. A1, B2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Original Price (৳)</label>
              <input 
                type="number" required
                value={formData.original_price}
                onChange={(e) => setFormData({...formData, original_price: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Asking Price (৳)</label>
              <input 
                type="number" required
                value={formData.asking_price}
                onChange={(e) => setFormData({...formData, asking_price: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Ticket Purchase Date</label>
            <input 
              type="date" required
              value={formData.ticket_purchase_date}
              onChange={(e) => setFormData({...formData, ticket_purchase_date: e.target.value})}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Ticket Image (Max 2MB, JPG/PNG)</label>
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer relative">
              <input 
                type="file" required
                accept="image/jpeg,image/png"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <PlusCircle className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{image ? image.name : 'Click or drag to upload ticket image'}</p>
            </div>
          </div>

          <button 
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Posting...' : 'Post Listing'}
          </button>
        </form>
      </div>
    </div>
  );
};

const Home = () => {
  const { lang, t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlTransport = (searchParams.get('transport') || 'bus') as 'bus' | 'train' | 'launch' | 'flight' | 'resale';
  const [activeTransport, setActiveTransport] = useState<'bus' | 'train' | 'launch' | 'flight' | 'resale'>(
    ['bus', 'train', 'launch', 'flight', 'resale'].includes(urlTransport) ? urlTransport : 'bus'
  );

  const [from, setFrom] = useState(searchParams.get('from') || 'Dhaka');
  const [to, setTo] = useState(searchParams.get('to') || "Cox's Bazar");

  const todayStr = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(searchParams.get('date') || todayStr);

  const [trips, setTrips] = useState<OfficialTrip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [pnrModalOpen, setPnrModalOpen] = useState(false);

  useEffect(() => {
    const tp = searchParams.get('transport');
    if (tp && ['bus', 'train', 'launch', 'flight', 'resale'].includes(tp)) {
      setActiveTransport(tp as any);
    }
    const f = searchParams.get('from');
    if (f) setFrom(f);
    const destination = searchParams.get('to');
    if (destination) setTo(destination);
    const d = searchParams.get('date');
    if (d) setDate(d);
  }, [searchParams]);

  const fetchTrips = async () => {
    if (activeTransport === 'resale') return;
    setLoadingTrips(true);
    try {
      const data = await apiService.getOfficialTrips({
        transport_type: activeTransport,
        from,
        to,
        date
      });
      setTrips(data);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoadingTrips(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [activeTransport]);

  const handleSearch = () => {
    setSearchParams({
      transport: activeTransport,
      from,
      to,
      date
    });
    fetchTrips();
    const el = document.getElementById('search-results-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSelectPopularRoute = (
    fromDest: string, 
    toDest: string, 
    tp: 'bus' | 'train' | 'launch' | 'flight'
  ) => {
    setFrom(fromDest);
    setTo(toDest);
    setActiveTransport(tp);
    setSearchParams({
      transport: tp,
      from: fromDest,
      to: toDest,
      date
    });
    fetchTrips();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      {/* PNR Modal if opened */}
      {pnrModalOpen && <PnrLookupModal onClose={() => setPnrModalOpen(false)} />}

      {/* Hero Search Section */}
      <HeroSearch
        activeTransport={activeTransport}
        onTransportChange={(tp) => {
          setActiveTransport(tp);
          setSearchParams({ transport: tp, from, to, date });
        }}
        from={from}
        to={to}
        date={date}
        onFromChange={setFrom}
        onToChange={setTo}
        onDateChange={setDate}
        onSearch={handleSearch}
      />

      {/* Results Section */}
      <div id="search-results-section">
        {activeTransport === 'resale' ? (
          <ResaleMarketSection initialFrom={from} initialTo={to} initialDate={date} />
        ) : (
          <>
            {/* Official E-Tickets Trip Results with Interactive Seats & Checkout */}
            <TripResults
              trips={trips}
              loading={loadingTrips}
              journeyDate={date}
              from={from}
              to={to}
              transportType={activeTransport}
            />

            {/* Seamless P2P Resale Banner right under the results */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 my-6">
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-purple-500/20">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0 border border-purple-400/30">
                    <Repeat className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-black text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full inline-block mb-1">
                      {lang === 'en' ? 'BariJao Signature Feature' : 'বাড়িযাও সিগনেচার ফিচার'}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black">
                      {lang === 'en' 
                        ? 'Looking for sold-out Eid tickets or need to sell an unused ticket?' 
                        : 'টিকিট পাননি বা অতিরিক্ত টিকিট বিক্রি করতে চান?'}
                    </h3>
                    <p className="text-xs text-purple-200/80 mt-0.5">
                      {lang === 'en'
                        ? 'Visit our verified peer-to-peer marketplace. Safe transactions, direct buyer-seller chat, zero black-market markups.'
                        : 'আমাদের ভেরিফায়েড পি২পি মার্কেটপ্লেসে ন্যায্য মূল্যে সহযাত্রীদের অব্যবহৃত টিকিট ক্রয়-বিক্রয় করুন।'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTransport('resale');
                      setSearchParams({ transport: 'resale', from, to, date });
                    }}
                    className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 cursor-pointer transition-transform hover:scale-105"
                  >
                    {lang === 'en' ? 'Browse Resale Market' : 'রিসেল মার্কেট দেখুন'}
                  </button>
                  <Link
                    to="/sell"
                    className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider border border-white/20 transition-colors"
                  >
                    {lang === 'en' ? 'Sell Ticket' : 'টিকিট বিক্রি'}
                  </Link>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Popular Routes Section */}
      <PopularRoutesSection onSelectRoute={handleSelectPopularRoute} />

      {/* Why BariJao Section */}
      <WhyBariJaoSection />

      {/* Authorized Operator Partners */}
      <OperatorPartnersSection />
    </div>
  );
};

const ResalePage = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-4">
      <ResaleMarketSection />
      <WhyBariJaoSection />
    </div>
  );
};

const CheckTicketPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md">
        <PnrLookupModal onClose={() => navigate('/')} />
      </div>
    </div>
  );
};

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Who this chat thread is with. A buyer always talks to the seller. A seller
  // opens a specific buyer's thread via ?with=<buyerId> (from the Messages page).
  const isSeller = !!user && !!ticket && user.id === ticket.seller_id;
  const withParam = searchParams.get('with');
  const counterpartyId = isSeller ? withParam : ticket?.seller_id;

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (user && ticket && counterpartyId) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [user, ticket, counterpartyId]);

  const fetchTicket = async () => {
    try {
      const found = await apiService.getTicketById(id!);
      setTicket(found);
    } catch (e) {
      // Safety net: fall back to finding it in the list endpoint.
      try {
        const all = await apiService.getTickets({ from: '', to: '', date: '' });
        setTicket((all || []).find((t: any) => t.id === id) || null);
      } catch (e2) {
        console.error(e2);
        setTicket(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) return navigate('/login');
    const payment_method = prompt('Enter payment method (bkash/nagad/rocket):', 'bkash');
    if (!payment_method) return;
    const transaction_reference = prompt('Enter Transaction Reference/ID:');
    if (!transaction_reference) return;

    try {
      await apiService.buyTicket(id!, { payment_method, transaction_reference });
      alert('Purchase successful!');
      fetchTicket();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await apiService.getMessages(id!, counterpartyId || undefined);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!counterpartyId) return;

    try {
      await apiService.sendMessage({
        ticket_id: id,
        receiver_id: counterpartyId,
        message: newMessage
      });
      setNewMessage('');
      fetchMessages();
    } catch (e: any) {
      console.error(e.message);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!ticket) return <div className="p-20 text-center">Ticket not found</div>;

  const locked = !!ticket.locked; // guest view: sensitive fields hidden

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex flex-col gap-2">
                <span className={cn(
                  "text-[10px] font-bold px-3 py-1 rounded-full uppercase mb-2 inline-block w-fit",
                  ticket.status === 'pending' ? "bg-amber-100 text-amber-600" :
                  ticket.status === 'available' ? "bg-emerald-100 text-emerald-600" :
                  "bg-gray-100 text-gray-600"
                )}>
                  {ticket.status}
                </span>
                {/* No verified column in tickets schema */}
              </div>
              <h1 className="text-3xl font-bold text-gray-900">{ticket.operator_name}</h1>
              <p className="text-gray-500">{ticket.from_location} → {ticket.to_location}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-emerald-600">৳{ticket.asking_price}</p>
              <p className="text-sm text-gray-400 line-through">Original: ৳{ticket.original_price}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Journey Date</p>
              <p className="font-bold text-gray-900">{new Date(ticket.journey_date).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Seat Number</p>
              <p className="font-bold text-gray-900">{locked ? <span className="text-gray-400 inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Hidden</span> : ticket.seat_number}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Created At</p>
              <p className="font-bold text-gray-900">{new Date(ticket.created_at).toLocaleDateString()}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
              <p className={cn(
                "font-bold uppercase text-sm",
                ticket.status === 'sold' ? "text-red-500" : "text-emerald-600"
              )}>{ticket.status}</p>
            </div>
          </div>

          {ticket.status === 'available' && !isSeller && (
            <button 
              onClick={handlePurchase}
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 mb-8"
            >
              Buy This Ticket Now
            </button>
          )}

          <div className="space-y-4">
            <h3 className="font-bold text-gray-900">Ticket Image</h3>
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
              {locked ? (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Lock className="w-12 h-12 text-emerald-600 mb-4" />
                  <p className="text-gray-900 font-bold mb-2">Details Hidden</p>
                  <p className="text-sm text-gray-500 max-w-xs">Log in to view the ticket photo, seat number, and seller contact.</p>
                  <Link to="/login" className="mt-4 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold">Login</Link>
                </div>
              ) : ticket.ticket_image ? (
                <img src={ticket.ticket_image} alt="Ticket" className="w-full h-full object-contain" />
              ) : (
                <p className="text-gray-400">No image provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar src={ticket.seller?.avatar_url} name={ticket.seller?.name} size={64} />
            <div>
              <h3 className="text-xl font-bold text-gray-900">{ticket.seller?.name || 'Seller'}</h3>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm text-gray-400">Rating: {ticket.seller?.rating ?? '5.0'}/5 ({ticket.seller?.rating_count ?? 0})</span>
              </div>
              {ticket.seller?.phone && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {ticket.seller.phone}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && user.id !== ticket.seller_id && (
              <Link
                to={`/messages?user=${ticket.seller_id}&ticket=${ticket.id}`}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send Message</span>
              </Link>
            )}
            <button className="text-red-500 text-sm font-bold hover:underline flex items-center gap-1">
              <Shield className="w-4 h-4" /> Report Seller
            </button>
          </div>
        </div>
      </div>

      {/* Chat Section */}
      <div className="min-h-[550px] lg:h-auto flex flex-col">
        {!user ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mb-3" />
            <h4 className="font-bold text-gray-800 text-base mb-1">Chat with Seller</h4>
            <p className="text-gray-500 mb-4 text-xs font-medium">You must be logged in to chat with the seller.</p>
            <Link to="/login" className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 transition-colors">Login to Chat</Link>
          </div>
        ) : isSeller && !counterpartyId ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex-1 flex flex-col items-center justify-center p-8 text-center">
            <MessageSquare className="w-12 h-12 text-emerald-600/40 mb-3" />
            <h4 className="font-bold text-gray-800 text-base mb-1">Your Listing's Chat Box</h4>
            <p className="text-gray-500 text-xs mb-4 max-w-xs">This is your own listing. Open buyer threads from your Messages page to reply.</p>
            <Link to="/messages" className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors">Open Messages</Link>
          </div>
        ) : (
          <ChatBox
            recipientUser={{
              id: counterpartyId || ticket.seller_id,
              name: isSeller ? 'Buyer' : (ticket.seller?.name || 'Seller'),
              avatar_url: isSeller ? null : ticket.seller?.avatar_url,
              rating: ticket.seller?.rating,
              phone: ticket.seller?.phone
            }}
            ticketContext={{
              id: ticket.id,
              operator_name: ticket.operator_name,
              transport_type: ticket.transport_type,
              from_location: ticket.from_location,
              to_location: ticket.to_location,
              asking_price: ticket.asking_price
            }}
            className="h-[550px]"
            isEmbedded={true}
          />
        )}
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, login } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const updates: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone
      };
      if (formData.password) {
        updates.password = formData.password;
      }

      const updatedUser = await apiService.updateProfile(updates);
      
      // Update local state
      const token = localStorage.getItem('token') || '';
      login(token, updatedUser);
      
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage({ type: '', text: '' });
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      const updatedUser = await apiService.updateProfile({ avatar_url: dataUrl });
      const token = localStorage.getItem('token') || '';
      login(token, updatedUser);
      setMessage({ type: 'success', text: 'Profile photo updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update photo' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative w-24 h-24">
              <Avatar src={user?.avatar_url} name={user?.name} size={96} className="rounded-2xl border-4 border-white shadow-lg" />
              <label className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1.5 cursor-pointer shadow hover:bg-emerald-700" title="Change photo">
                <Edit2 className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="ml-1 font-bold">{user?.rating}</span>
                </div>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-500 text-sm uppercase font-bold tracking-wider">{user?.role} Account</span>
              </div>
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-gray-700"
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {message.text && (
            <div className={`p-4 rounded-2xl mb-6 text-sm font-medium ${
              message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" /> Full Name
              </label>
              <input 
                type="text"
                disabled={!isEditing}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" /> Email Address
              </label>
              <input 
                type="email"
                disabled={!isEditing}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" /> Phone Number
              </label>
              <input 
                type="tel"
                disabled={!isEditing}
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-400" /> New Password (Optional)
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  disabled={!isEditing}
                  placeholder={isEditing ? "Enter new password" : "••••••••"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all pr-12"
                />
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="md:col-span-2 flex justify-end mt-4">
                <button 
                  disabled={loading}
                  className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

// Seconds the user must wait between "resend code" requests.
const RESEND_COOLDOWN_SECONDS = 30;

// devOtp is only ever sent by a local dev server that has no email provider
// configured; production never includes it.
type OtpNotice = { emailSent: boolean; emailError?: string; devOtp?: string } | null;

// The OTP step, shared by Login and Register.
//
// It is a separate component on purpose: rendering a raw <form> here (as the
// sibling branch of a ternary against the credentials <form>) made React reuse
// the same DOM nodes across the switch, which turned the "Back" button into the
// credentials form's submit button mid-click and instantly re-sent an OTP.
const OtpForm = ({
  email,
  loading,
  notice,
  onVerify,
  onBack,
  submitLabel,
  backLabel,
}: {
  email: string;
  loading: boolean;
  notice: OtpNotice;
  onVerify: (code: string) => void;
  onBack: () => void;
  submitLabel: string;
  backLabel: string;
}) => {
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    setResending(true);
    setResendMsg('');
    try {
      const data = await apiService.resendOTP(email);
      setResendMsg(
        data.emailSent === false
          ? data.devOtp
            ? `Email is not configured — your new code is ${data.devOtp}`
            : data.emailError || 'Email delivery failed.'
          : 'A new code has been sent. Check your inbox and spam folder.'
      );
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      setResendMsg(e.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <form
      key="otp-form"
      onSubmit={(e) => {
        e.preventDefault();
        onVerify(otp);
      }}
      className="space-y-4"
    >
      {notice && !notice.emailSent && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-sm border border-amber-200">
          <p className="font-bold mb-1">Email Delivery Notice</p>
          <p>{notice.emailError || 'Email is currently running in local development mode.'}</p>
        </div>
      )}

      {/* Developer Mode Demo OTP Generator Card */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Demo OTP Generator (Client Preview)
          </span>
          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-mono font-black text-xs tracking-widest shadow-xs">
            {notice?.devOtp || '123456'}
          </span>
        </div>
        <p className="text-[11px] text-emerald-800/80 mb-2.5">
          Temporary developer mode active. Click below to auto-fill the demo code:
        </p>
        <button
          type="button"
          onClick={() => {
            const code = notice?.devOtp || '123456';
            setOtp(code);
            onVerify(code);
          }}
          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01]"
        >
          <span>Auto-Fill Demo OTP & Verify</span>
          <span className="bg-emerald-700/80 px-1.5 py-0.5 rounded font-mono text-[10px]">({notice?.devOtp || '123456'})</span>
        </button>
      </div>
      <div>
        <label className="block text-sm font-bold text-gray-700 mb-1">One-Time Password (OTP)</label>
        <input
          type="text"
          required
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-center text-2xl tracking-widest font-bold"
          placeholder="000000"
        />
      </div>
      <button
        type="submit"
        disabled={loading || otp.length !== 6}
        className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : submitLabel}
      </button>

      {resendMsg && <p className="text-sm text-gray-600 text-center">{resendMsg}</p>}

      <button
        type="button"
        onClick={handleResend}
        disabled={resending || secondsLeft > 0}
        className="w-full flex items-center justify-center gap-2 text-emerald-600 text-sm font-bold hover:underline disabled:text-gray-400 disabled:no-underline"
      >
        <RefreshCw className={cn('w-4 h-4', resending && 'animate-spin')} />
        {secondsLeft > 0 ? `Resend code in ${secondsLeft}s` : resending ? 'Sending...' : "Didn't get the code? Resend"}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-gray-500 text-sm font-bold hover:underline"
      >
        {backLabel}
      </button>
    </form>
  );
};

const DEMO_USERS_LIST = [
  { name: 'Tanvir Ahmed', email: 'tanvir.demo@barijao.com', role: 'Frequent Seller (Bus & Train)', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' },
  { name: 'Sadia Islam', email: 'sadia.demo@barijao.com', role: 'Top Seller (Sylhet & Launch)', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' },
  { name: 'Rahim Chowdhury', email: 'rahim.demo@barijao.com', role: 'Corporate (Train & Flight)', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200' },
  { name: 'Nusrat Jahan', email: 'nusrat.demo@barijao.com', role: 'Luxury Coach Reseller', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200' },
  { name: 'Arif Hasan', email: 'arif.demo@barijao.com', role: 'Commuter / Buyer', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200' },
];

const Login = () => {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [notice, setNotice] = useState<OtpNotice>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(true);
  const navigate = useNavigate();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;

  const handleQuickDemoLogin = async (demoEmail: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await apiService.quickDemoLogin(demoEmail);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setEmail(demoEmail);
      setPassword('demopassword123');
      try {
        const data = await apiService.login(demoEmail, 'demopassword123');
        if (data.requiresOTP) {
          setNotice({ emailSent: false, devOtp: data.devOtp || '123456' });
          setShowOTP(true);
        }
      } catch (e: any) {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('demopassword123');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiService.login(email, password);
      if (data.requiresOTP) {
        setNotice({ emailSent: data.emailSent !== false, emailError: data.emailError, devOtp: data.devOtp });
        setShowOTP(true);
        setError('');
      } else {
        login(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await apiService.verifyOTP(email, code);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Leaving the OTP step clears everything it produced, so the credentials form
  // comes back clean instead of half-filled from the previous attempt.
  const handleBack = () => {
    setShowOTP(false);
    setNotice(null);
    setError('');
    setPassword('');
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {showOTP ? 'Verify OTP' : 'Welcome Back'}
        </h2>
        <p className="text-gray-500 mb-8">
          {showOTP ? `Enter the 6-digit code sent to ${email}` : 'Login to your BariJao account'}
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-6">
            {error}
          </div>
        )}
        
        {!showOTP ? (
          <form key="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <OtpForm
            email={email}
            loading={loading}
            notice={notice}
            onVerify={handleVerifyOTP}
            onBack={handleBack}
            submitLabel="Verify & Login"
            backLabel="Back to Login"
          />
        )}
        
        {!showOTP && (
          <>
            {/* Developer Mode Quick Demo Accounts */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                  Developer Mode: Demo Accounts
                </span>
                <button
                  type="button"
                  onClick={() => setShowDemoAccounts(!showDemoAccounts)}
                  className="text-[11px] font-bold text-purple-600 hover:text-purple-800"
                >
                  {showDemoAccounts ? 'Hide' : 'Show Demo (5)'}
                </button>
              </div>

              {showDemoAccounts && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <p className="text-[11px] text-gray-500 mb-2">
                    Client preview mode: Click any account for 1-click instant login or credential autofill.
                  </p>
                  {DEMO_USERS_LIST.map((u) => (
                    <div
                      key={u.email}
                      className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/60 transition-all flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-purple-200"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-gray-900 truncate">{u.name}</div>
                          <div className="text-[10px] text-purple-700 font-medium truncate">{u.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectDemoUser(u.email)}
                          className="px-2 py-1 rounded-lg bg-white border border-gray-200 hover:border-gray-300 text-[10px] font-bold text-gray-700 transition-colors cursor-pointer"
                        >
                          Fill
                        </button>
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleQuickDemoLogin(u.email)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-extrabold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                          ⚡ Login
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <p className="text-center mt-6 text-sm text-gray-500">
              Don't have an account? <Link to="/register" className="text-emerald-600 font-bold">Register here</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

const Register = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [showOTP, setShowOTP] = useState(false);
  const [notice, setNotice] = useState<OtpNotice>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiService.register(formData);
      if (data.requiresOTP) {
        setNotice({ emailSent: data.emailSent !== false, emailError: data.emailError, devOtp: data.devOtp });
        setShowOTP(true);
        setError('');
      } else {
        navigate('/login');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    setError('');
    setLoading(true);
    try {
      const data = await apiService.verifyOTP(formData.email, code, 'registration');
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Same reset as Login: drop the OTP step's state and clear the password so
  // the form is not silently re-submitted with stale values.
  const handleBack = () => {
    setShowOTP(false);
    setNotice(null);
    setError('');
    setFormData((f) => ({ ...f, password: '' }));
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {showOTP ? 'Verify Account' : 'Create Account'}
        </h2>
        <p className="text-gray-500 mb-8">
          {showOTP ? `Enter the 6-digit code sent to ${formData.email}` : 'Join the community and travel safe'}
        </p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-6">{error}</div>
        )}
        
        {!showOTP ? (
          <form key="register-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                required
                maxLength={30}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
              <input 
                type="tel" 
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="017XXXXXXXX"
              />
            </div>
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Register Now'}
            </button>
          </form>
        ) : (
          <OtpForm
            email={formData.email}
            loading={loading}
            notice={notice}
            onVerify={handleVerifyOTP}
            onBack={handleBack}
            submitLabel="Verify & Complete Registration"
            backLabel="Back to Registration"
          />
        )}
        
        {!showOTP && (
          <p className="text-center mt-8 text-sm text-gray-500">
            Already have an account? <Link to="/login" className="text-emerald-600 font-bold">Login here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

const UserDashboard = () => {
  const { user, token } = useAuth();
  const { lang, t } = useTranslation();
  const [data, setData] = useState<any>({ listings: [], purchases: [] });
  const [officialBookings, setOfficialBookings] = useState<OfficialBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'official' | 'listings' | 'purchases'>('official');
  const [selectedVoucher, setSelectedVoucher] = useState<OfficialBooking | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const d = await apiService.getUserDashboard();
      setData({ listings: d?.listings || [], purchases: d?.purchases || [] });

      const official = await apiService.getMyOfficialBookings(user?.phone);
      setOfficialBookings(official || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this listing? This cannot be undone.')) return;
    try {
      await apiService.deleteTicket(id);
      setData((prev: any) => ({ ...prev, listings: prev.listings.filter((l: any) => l.id !== id) }));
    } catch (e: any) {
      alert(e.message || 'Failed to delete');
    }
  };

  const handleEditPrice = async (ticket: any) => {
    const input = window.prompt('New asking price (৳):', String(ticket.asking_price));
    if (input === null) return;
    const price = parseFloat(input);
    if (isNaN(price) || price <= 0) { alert('Please enter a valid price.'); return; }
    try {
      await apiService.updateTicket(ticket.id, { asking_price: price });
      setData((prev: any) => ({
        ...prev,
        listings: prev.listings.map((l: any) => (l.id === ticket.id ? { ...l, asking_price: price } : l)),
      }));
    } catch (e: any) {
      alert(e.message || 'Failed to update');
    }
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {selectedVoucher && (
        <TicketVoucherModal
          booking={selectedVoucher}
          onClose={() => setSelectedVoucher(null)}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t.dashboard || 'My Travel Hub & Dashboard'}</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your official e-tickets, community resale listings, and purchases.</p>
        </div>

        <Link
          to="/sell"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-purple-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{lang === 'en' ? 'Sell Spare Ticket' : 'অতিরিক্ত টিকিট বিক্রি'}</span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('official')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'official'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>{lang === 'en' ? 'Official E-Tickets' : 'অফিসিয়াল ই-টিকিট'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {officialBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Repeat className="w-4 h-4" />
          <span>{lang === 'en' ? 'My Resale Listings' : 'আমার রিসেল লিস্টিং'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {data.listings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'purchases'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/20'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>{lang === 'en' ? 'My Resale Purchases' : 'আমার ক্রয়কৃত টিকিট'}</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">
            {data.purchases.length}
          </span>
        </button>
      </div>

      {/* Official Bookings Tab Content */}
      {activeTab === 'official' && (
        <div className="space-y-4">
          {officialBookings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xs text-center space-y-3">
              <TicketIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">{lang === 'en' ? 'No Official E-Tickets Yet' : 'কোনো অফিসিয়াল টিকিট কাটা হয়নি'}</p>
              <p className="text-xs text-gray-400">Search bus, train, launch and air tickets from the homepage.</p>
              <Link to="/" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold">
                Book Tickets Now
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {officialBookings.map((b) => (
                <div key={b.id} className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md">
                          {b.pnr}
                        </span>
                        <h4 className="text-sm font-black text-gray-900 mt-1">{b.operator_name}</h4>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 capitalize bg-emerald-100/60 px-2 py-0.5 rounded-md">
                        {b.transport_type}
                      </span>
                    </div>

                    <div className="py-3 space-y-1 text-xs">
                      <p className="font-extrabold text-gray-800">{b.from_location} → {b.to_location}</p>
                      <p className="text-gray-500 font-medium">Date: {b.journey_date} • {b.departure_time}</p>
                      <p className="text-gray-600 font-semibold">
                        Seats: <strong className="text-emerald-800">{Array.isArray(b.seats) ? b.seats.join(', ') : b.seats}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 block uppercase">Paid</span>
                      <span className="text-base font-black text-gray-900">৳{b.net_payable}</span>
                    </div>

                    <button
                      onClick={() => setSelectedVoucher(b)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-105"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'View Voucher' : 'ভাউচার দেখুন'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resale Listings Tab Content */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {data.listings.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xs text-center space-y-3">
              <Repeat className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">{lang === 'en' ? 'No Active Resale Listings' : 'কোনো সক্রিয় লিস্টিং নেই'}</p>
              <Link to="/sell" className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold">
                List a Ticket
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.listings.map((ticket: any) => (
                <div key={ticket.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <p className="font-extrabold text-gray-900">{ticket.operator_name}</p>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        ticket.status === 'pending' ? "bg-amber-100 text-amber-600" :
                        ticket.status === 'available' ? "bg-emerald-100 text-emerald-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mt-2">{ticket.from_location} → {ticket.to_location}</p>
                    <p className="text-xs text-gray-400 mt-1">Date: {ticket.journey_date} • Seat: {ticket.seat_number}</p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-4">
                    <p className="font-black text-lg text-emerald-600">৳{ticket.asking_price}</p>
                    <div className="flex items-center gap-2">
                      <Link to={`/ticket/${ticket.id}`} className="text-xs text-gray-600 hover:text-emerald-700 font-bold">View</Link>
                      <button onClick={() => handleEditPrice(ticket)} className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer">Edit Price</button>
                      <button onClick={() => handleDelete(ticket.id)} className="text-xs text-red-500 font-bold hover:underline cursor-pointer">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resale Purchases Tab Content */}
      {activeTab === 'purchases' && (
        <div className="space-y-4">
          {data.purchases.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-xs text-center space-y-3">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-sm font-bold text-gray-700">{lang === 'en' ? 'No Resale Purchases Yet' : 'কোনো রিসেল ক্রয় নেই'}</p>
              <Link to="/resale" className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold">
                Browse Resale Market
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.purchases.map((tx: any) => (
                <div key={tx.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
                  <div>
                    <p className="font-extrabold text-gray-900">{tx.ticket?.operator_name}</p>
                    <p className="text-xs text-gray-500">{tx.ticket?.from_location} → {tx.ticket?.to_location}</p>
                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-2">
                      {tx.status}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-4">
                    <p className="font-black text-gray-900">৳{tx.ticket?.asking_price}</p>
                    <Link to={`/ticket/${tx.ticket_id}`} className="text-xs font-bold text-emerald-700 hover:underline">
                      Chat / View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const fetchAdminData = async () => {
      try {
        const [u, t] = await Promise.all([
          apiService.adminGetUsers(),
          apiService.getTickets({ from: '', to: '', date: '' })
        ]);
        setUsers(u);
        setListings(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, [user]);

  const handleAction = async (id: string, action: 'approve' | 'delete') => {
    try {
      if (action === 'approve') {
        await apiService.adminVerifyTicket(id);
      } else {
        await apiService.deleteTicket(id);
      }
      
      // Refresh
      const t = await apiService.getTickets({ from: '', to: '', date: '' });
      setListings(t);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (user?.role !== 'admin') return <Navigate to="/" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <Shield className="w-8 h-8 text-emerald-600" /> Admin Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-400 uppercase mb-1">Total Users</p>
          <p className="text-4xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-400 uppercase mb-1">Active Tickets</p>
          <p className="text-4xl font-bold text-gray-900">{listings.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-400 uppercase mb-1">Reports</p>
          <p className="text-4xl font-bold text-red-500">0</p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">Ticket Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Route</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((listing: any) => (
                  <tr key={listing.id} className="text-sm">
                    <td className="px-6 py-4 font-bold text-gray-900">{listing.operator_name}</td>
                    <td className="px-6 py-4 text-gray-500">{listing.from_location} → {listing.to_location}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        listing.status === 'pending' ? "bg-amber-100 text-amber-600" :
                        listing.status === 'available' ? "bg-emerald-100 text-emerald-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {listing.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {listing.status === 'pending' && (
                          <button 
                            onClick={() => handleAction(listing.id, 'approve')}
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            Approve
                          </button>
                        )}
                        <button 
                          onClick={() => handleAction(listing.id, 'delete')}
                          className="text-red-500 font-bold hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-bold text-gray-900">User Management</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u: any) => (
                  <tr key={u.id} className="text-sm text-gray-700 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{u.name}</td>
                    <td className="px-6 py-4">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                        u.role === 'admin' ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {/* Ban action hidden as column is missing in SQL schema */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const Contact = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Contact Us</h1>
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Developers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <a 
              href="https://www.facebook.com/share/1bKZaxukfW/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-100 group-hover:border-emerald-200 transition-colors">
                <img 
                  src="https://unavatar.io/facebook/aiuohall.ratul.7?fallback=https://picsum.photos/seed/ratul/100/100" 
                  alt="Aiuohall Ratul" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://picsum.photos/seed/ratul/100/100";
                  }}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-emerald-600">Aiuohall Ratul</p>
                <p className="text-xs text-gray-500">Facebook Profile</p>
              </div>
            </a>
            <a 
              href="https://www.facebook.com/share/1HgKoa8iy4/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-emerald-50 transition-colors group"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-100 group-hover:border-emerald-200 transition-colors">
                <img 
                  src="https://unavatar.io/facebook/redwanrashid.nice.9?fallback=https://picsum.photos/seed/redwan/100/100" 
                  alt="Redwan Nice" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://picsum.photos/seed/redwan/100/100";
                  }}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-emerald-600">Redwan Nice</p>
                <p className="text-xs text-gray-500">Facebook Profile</p>
              </div>
            </a>
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Email Support</h2>
          <p className="text-gray-600">For any inquiries or support, please email us at:</p>
          <a href="mailto:AiuohallRatul2000@gmail.com" className="text-emerald-600 font-bold hover:underline">AiuohallRatul2000@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

const Messages = () => {
  const { user } = useAuth();
  const { lang, t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlUserId = searchParams.get('user') || searchParams.get('with');
  const urlTicketId = searchParams.get('ticket');

  const [activeTab, setActiveTab] = useState<'chats' | 'users'>('chats');
  const [conversations, setConversations] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [ticketContext, setTicketContext] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch conversations and users
  const loadData = async () => {
    if (!user) return;
    try {
      const [convData, usersData] = await Promise.all([
        apiService.getConversations().catch(() => []),
        apiService.getUsers().catch(() => [])
      ]);

      const me = user.id;
      // Group conversations by counterparty
      const map = new Map<string, any>();
      (convData || []).forEach((m: any) => {
        const otherId = m.sender_id === me ? m.receiver_id : m.sender_id;
        const otherUser = m.sender_id === me ? m.receiver : m.sender;
        if (!otherId) return;

        if (!map.has(otherId)) {
          map.set(otherId, {
            otherId,
            otherName: otherUser?.name || 'Member',
            otherAvatar: otherUser?.avatar_url,
            otherRating: otherUser?.rating,
            ticket: m.ticket,
            lastMessage: m.message,
            lastAt: m.created_at,
          });
        }
      });

      const convList = Array.from(map.values());
      setConversations(convList);
      setAllUsers(usersData || []);

      // If URL has user param, select that user
      if (urlUserId) {
        const matched = (usersData || []).find((u: any) => u.id === urlUserId);
        if (matched) {
          setSelectedUser(matched);
        } else {
          try {
            const fetched = await apiService.getUserById(urlUserId);
            setSelectedUser(fetched);
          } catch (e) {
            console.error('Could not load user from url:', e);
          }
        }

        if (urlTicketId) {
          try {
            const ticket = await apiService.getTicketById(urlTicketId);
            setTicketContext(ticket);
          } catch (e) {
            console.error('Could not load ticket from url:', e);
          }
        }
      } else if (convList.length > 0 && !selectedUser) {
        // Auto-select first conversation on wide screens
        const first = convList[0];
        const matchedUser = (usersData || []).find((u: any) => u.id === first.otherId);
        setSelectedUser(matchedUser || {
          id: first.otherId,
          name: first.otherName,
          avatar_url: first.otherAvatar,
          rating: first.otherRating
        });
        if (first.ticket) {
          setTicketContext(first.ticket);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, urlUserId, urlTicketId]);

  const selectUserForChat = (targetUser: any, ticket?: any) => {
    setSelectedUser(targetUser);
    setTicketContext(ticket || null);
    setSearchParams(ticket?.id ? { user: targetUser.id, ticket: ticket.id } : { user: targetUser.id });
  };

  const filteredConversations = conversations.filter(c => 
    !searchQuery.trim() || 
    c.otherName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u =>
    !searchQuery.trim() ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !selectedUser && conversations.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm font-semibold text-gray-500">Loading messages & members...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-100 text-emerald-700">
              <MessageSquare className="w-6 h-6" />
            </div>
            <span>{lang === 'en' ? 'Direct Messages & Chat' : 'সরাসরি মেসেজ ও চ্যাট'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {lang === 'en'
              ? 'Real-time 1-on-1 private messaging with any BariJao member to negotiate or exchange tickets.'
              : 'টিকিট বিনিময় বা আলোচনার জন্য যেকোনো বাড়িযাও সদস্যের সাথে রিয়েল-টাইম প্রাইভেট চ্যাট।'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab(activeTab === 'users' ? 'chats' : 'users')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-fit"
        >
          {activeTab === 'users' ? (
            <>
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'en' ? 'View Active Chats' : 'চলমান চ্যাট দেখুন'}</span>
            </>
          ) : (
            <>
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'en' ? '+ Start New Chat with Member' : '+ নতুন সদস্যের সাথে চ্যাট'}</span>
            </>
          )}
        </button>
      </div>

      {/* Main Two-Pane Chat Container */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] max-h-[760px]">
        {/* Left Sidebar (Conversations / User Directory) */}
        <div className={`lg:col-span-4 border-r border-gray-100 flex flex-col bg-slate-50/50 ${selectedUser ? 'hidden lg:flex' : 'flex'}`}>
          {/* Tabs: Active Chats vs All Members */}
          <div className="p-3 border-b border-gray-100 bg-white">
            <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab('chats')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'chats'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'Chats' : 'চলমান চ্যাট'}</span>
                {conversations.length > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full">
                    {conversations.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'users'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>{lang === 'en' ? 'All Members' : 'সকল সদস্য'}</span>
                {allUsers.length > 0 && (
                  <span className="text-[10px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.2 rounded-full">
                    {allUsers.length}
                  </span>
                )}
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-3 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'chats' 
                  ? (lang === 'en' ? 'Search conversations...' : 'চ্যাট খুঁজুন...')
                  : (lang === 'en' ? 'Search members by name...' : 'নাম দিয়ে সদস্য খুঁজুন...')
                }
                className="w-full bg-gray-50 border border-gray-200 pl-9 pr-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100/70">
            {activeTab === 'chats' ? (
              filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-3">
                  <MessageSquare className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-xs font-medium">
                    {searchQuery ? 'No matching conversations' : 'No active chats yet.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    Browse members to start a chat →
                  </button>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isSelected = selectedUser?.id === conv.otherId;
                  return (
                    <button
                      key={conv.otherId}
                      onClick={() => selectUserForChat({
                        id: conv.otherId,
                        name: conv.otherName,
                        avatar_url: conv.otherAvatar,
                        rating: conv.otherRating
                      }, conv.ticket)}
                      className={`w-full p-4 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Avatar src={conv.otherAvatar} name={conv.otherName} size={42} />
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white"></span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <h4 className="text-xs font-bold text-gray-900 truncate">{conv.otherName}</h4>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(conv.lastAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                        {conv.ticket && (
                          <span className="inline-block text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold truncate mt-1">
                            {conv.ticket.operator_name || 'Ticket'} · {conv.ticket.from_location} → {conv.ticket.to_location}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              // All Users Directory
              filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <User className="w-10 h-10 mx-auto text-gray-300" />
                  <p className="text-xs">No members found.</p>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = selectedUser?.id === u.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                        isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-gray-100/60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar src={u.avatar_url} name={u.name} size={40} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-gray-900 truncate">{u.name}</h4>
                            <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              {u.rating ? Number(u.rating).toFixed(1) : '5.0'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {u.role === 'admin' ? '🛡️ Admin' : (u.badge || u.email || 'Member')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => selectUserForChat(u)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shrink-0 shadow-2xs transition-all cursor-pointer"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                      </button>
                    </div>
                  );
                })
              )
            )}
          </div>
        </div>

        {/* Right Area (Individual Message Box) */}
        <div className={`lg:col-span-8 flex flex-col h-full bg-white ${!selectedUser ? 'hidden lg:flex' : 'flex'}`}>
          {selectedUser ? (
            <div className="flex flex-col h-full">
              {/* Mobile Back Header */}
              <div className="p-2.5 bg-gray-50 border-b border-gray-100 lg:hidden flex items-center gap-2">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>← Back to all chats</span>
                </button>
                <span className="text-xs font-bold text-gray-800 truncate">
                  Chatting with {selectedUser.name}
                </span>
              </div>

              <div className="flex-1 min-h-0">
                <ChatBox
                  recipientUser={selectedUser}
                  ticketContext={ticketContext}
                  className="rounded-none border-none shadow-none h-full"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="max-w-md">
                <h3 className="text-lg font-extrabold text-gray-900 mb-1">
                  {lang === 'en' ? 'BariJao Individual User Messaging' : 'বাড়িযাও ব্যবহারকারী মেসেঞ্জার'}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {lang === 'en'
                    ? 'Select a conversation from the sidebar or click any member below to send an instant private message.'
                    : 'বাম পাশের তালিকা থেকে কথোপকথন বেছে নিন বা যেকোনো সদস্যের সাথে কথা শুরু করতে নিচের কার্ডে ক্লিক করুন।'}
                </p>
              </div>

              {/* Quick member shortcuts */}
              {allUsers.length > 0 && (
                <div className="w-full max-w-lg pt-4 border-t border-gray-100">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    {lang === 'en' ? 'Available Members to Message' : 'যাদের মেসেজ পাঠাতে পারেন'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {allUsers.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => selectUserForChat(u)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-gray-200/70 hover:border-emerald-300 text-left flex items-center gap-3 transition-all cursor-pointer group"
                      >
                        <Avatar src={u.avatar_url} name={u.name} size={36} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-800 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-500 truncate">{u.badge || u.role || 'Verified User'}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Terms = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm prose prose-emerald max-w-none">
        <p>Welcome to BariJao. By using our service, you agree to the following terms:</p>
        <h3>1. Platform Role</h3>
        <p>BariJao is a peer-to-peer ticket exchange platform. We facilitate communication between buyers and sellers but are not responsible for the actual tickets or transactions.</p>
        <h3>2. User Responsibility</h3>
        <p>Users are responsible for verifying the authenticity of tickets. We recommend meeting in person or using secure payment methods.</p>
        <h3>3. Prohibited Activities</h3>
        <p>Selling fake tickets, scamming, or harassing other users will lead to an immediate and permanent ban.</p>
        <h3>4. Limitation of Liability</h3>
        <p>BariJao is not liable for any financial loss or damages resulting from the use of our platform.</p>
      </div>
    </div>
  );
};

const Privacy = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm prose prose-emerald max-w-none">
        <p>Your privacy is important to us. This policy explains how we handle your data:</p>
        <h3>1. Data Collection</h3>
        <p>We collect your name, email, and phone number to facilitate ticket exchanges and account security.</p>
        <h3>2. Data Usage</h3>
        <p>Your contact information is only shared with other users when you explicitly engage in a ticket negotiation or purchase.</p>
        <h3>3. Data Security</h3>
        <p>We use industry-standard encryption and secure databases (Supabase) to protect your information.</p>
        <h3>4. Cookies</h3>
        <p>We use essential cookies to keep you logged in and improve your experience.</p>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [pnrModalOpen, setPnrModalOpen] = useState(false);

  return (
    <AuthProvider>
      <TranslationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col justify-between">
            {pnrModalOpen && <PnrLookupModal onClose={() => setPnrModalOpen(false)} />}
            
            <div>
              <Navbar onOpenPnrLookup={() => setPnrModalOpen(true)} />
              <main>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/resale" element={<ResalePage />} />
                  <Route path="/check-ticket" element={<CheckTicketPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
                  <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/sell" element={<ProtectedRoute><SellTicket /></ProtectedRoute>} />
                  <Route path="/ticket/:id" element={<TicketDetails />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
              </main>
            </div>
            
            {/* Modern Comprehensive Footer (Shohoz / BDtickets style) */}
            <footer className="bg-slate-900 text-gray-400 border-t border-slate-800 pt-16 pb-12 mt-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
                  {/* Brand & Mission */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                        <TicketIcon className="w-5 h-5 transform -rotate-12" />
                      </div>
                      <span className="text-2xl font-black text-white tracking-tight">BariJao</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
                      Bangladesh’s leading smart e-ticketing and verified peer-to-peer travel exchange platform. Direct counter fares from top bus, train, launch, and flight operators, alongside safe second-hand ticket resale.
                    </p>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <Shield className="w-4 h-4" />
                      <span>100% Genuine Tickets & Verified Safe Exchange</span>
                    </div>
                  </div>

                  {/* Transport Services */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">Book E-Tickets</h4>
                    <ul className="space-y-2 text-xs">
                      <li><Link to="/?transport=bus" className="hover:text-emerald-400 transition-colors">Bus Tickets (Green Line, Hanif, Shohagh)</Link></li>
                      <li><Link to="/?transport=train" className="hover:text-emerald-400 transition-colors">Bangladesh Railway (Subarna, Cox's Bazar)</Link></li>
                      <li><Link to="/?transport=launch" className="hover:text-emerald-400 transition-colors">Launch Cabins (MV Manami, Sundarban)</Link></li>
                      <li><Link to="/?transport=flight" className="hover:text-emerald-400 transition-colors">Domestic Flights (Biman, US-Bangla)</Link></li>
                    </ul>
                  </div>

                  {/* Resale & Community */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">P2P Resale Market</h4>
                    <ul className="space-y-2 text-xs">
                      <li><Link to="/resale" className="hover:text-purple-400 transition-colors">Browse Resale Tickets</Link></li>
                      <li><Link to="/sell" className="hover:text-purple-400 transition-colors">Sell My Unused Ticket</Link></li>
                      <li><Link to="/check-ticket" className="hover:text-emerald-400 transition-colors">Check Booking / PNR</Link></li>
                      <li><Link to="/dashboard" className="hover:text-emerald-400 transition-colors">My Bookings & Listings</Link></li>
                    </ul>
                  </div>

                  {/* Helpline & Security */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider">24/7 Helpline</h4>
                    <p className="text-xs text-gray-400">Call our dedicated support center:</p>
                    <p className="text-sm font-black text-emerald-400">16XXX / +880 9612-BARIJAO</p>
                    <p className="text-[11px] text-gray-500">Support Hours: 24 Hours / 7 Days</p>

                    <div className="pt-2">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">Supported Payments</span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-pink-400">bKash</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-orange-400">Nagad</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-400">Rocket</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-blue-400">Visa/Mastercard</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                  <p>© 2026 BariJao – Bangladesh E-Tickets & Safe Travel Exchange. All rights reserved.</p>
                  <div className="flex items-center gap-6 font-medium">
                    <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    <Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </TranslationProvider>
    </AuthProvider>
  );
}
