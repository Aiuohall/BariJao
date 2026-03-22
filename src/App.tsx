// BariJao v1.0.3 - Ticket Marketplace
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { TranslationProvider, useTranslation } from './TranslationContext';
import { BANGLADESH_DISTRICTS } from './constants';
import { apiService } from './services/apiService';
import React, { useState, useEffect, useRef } from 'react';
import { Search, User, LogOut, Menu, X, Ticket as TicketIcon, MessageSquare, Shield, PlusCircle, Star, Mail, Phone, Lock, Edit2, Save, RefreshCw, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
  const [retryCount, setRetryCount] = useState(0);

  const check = async () => {
    setStatus('checking');
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok') {
          setStatus('online');
          return;
        }
      }
    } catch (e) {}
    setStatus('offline');
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

const Navbar = () => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-emerald-600 flex items-center gap-2">
              <TicketIcon className="w-8 h-8" />
              <span className="hidden sm:inline">{t.appName}</span>
            </Link>
            <div className="hidden lg:block ml-2">
              <ServerStatus />
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <button 
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-emerald-600">{t.home}</Link>
            <Link to="/" className="text-sm font-medium text-emerald-600 font-bold hover:text-emerald-700">Buy Tickets</Link>
            {user ? (
              <>
                <Link to="/sell" className="text-sm font-medium text-gray-600 hover:text-emerald-600">{t.sell}</Link>
                <Link to="/dashboard" className="text-sm font-medium text-gray-600 hover:text-emerald-600">{t.dashboard}</Link>
                <Link to="/messages" className="text-sm font-medium text-gray-600 hover:text-emerald-600">{t.messages}</Link>
                <Link to="/profile" className="text-sm font-medium text-gray-600 hover:text-emerald-600 flex items-center gap-1">
                  <User className="w-4 h-4" /> Profile
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="text-sm font-medium text-gray-600 hover:text-emerald-600 flex items-center gap-1">
                    <Shield className="w-4 h-4" /> {t.admin}
                  </Link>
                )}
                <button onClick={logout} className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1">
                  <LogOut className="w-4 h-4" /> {t.logout}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-emerald-600">
                  {t.login}
                </Link>
                <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className="text-sm font-medium text-gray-500">
              {lang === 'en' ? 'বাংলা' : 'English'}
            </button>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600">
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>{t.home}</Link>
              <Link to="/" className="block px-3 py-2 rounded-md text-base font-bold text-emerald-600 hover:bg-emerald-50" onClick={() => setIsMenuOpen(false)}>Buy Tickets</Link>
              {user ? (
                <>
                  <Link to="/sell" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>{t.sell}</Link>
                  <Link to="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>{t.dashboard}</Link>
                  <Link to="/messages" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>{t.messages}</Link>
              <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50" onClick={() => setIsMenuOpen(false)}>{t.admin}</Link>
                  )}
                  <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-gray-50">{t.logout}</button>
                </>
              ) : (
                <Link to="/login" className="block px-3 py-2 rounded-md text-base font-medium text-emerald-600" onClick={() => setIsMenuOpen(false)}>{t.login}</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
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
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState({ from: '', to: '', date: '', type: '' });
  const [suggestions, setSuggestions] = useState({ from: [], to: [] });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const data = await apiService.getTickets(search);
      setTickets(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDistrictSearch = (field: 'from' | 'to', val: string) => {
    setSearch({ ...search, [field]: val });
    if (val.length > 0) {
      const query = val.toLowerCase();
      const filtered = BANGLADESH_DISTRICTS.filter(d => d.toLowerCase().includes(query));
      setSuggestions({ ...suggestions, [field]: filtered.slice(0, 5) });
    } else {
      setSuggestions({ ...suggestions, [field]: [] });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          {t.appName}: <span className="text-emerald-600">Eid Ticket Exchange</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12">
          {t.searchSub}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
          <Link 
            to="/sell" 
            className="w-full sm:w-64 bg-emerald-600 text-white py-6 rounded-2xl text-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex flex-col items-center gap-2"
          >
            <PlusCircle className="w-8 h-8" />
            {t.sell}
          </Link>
          <button 
            onClick={() => document.getElementById('search-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-64 bg-gray-900 text-white py-6 rounded-2xl text-xl font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/20 flex flex-col items-center gap-2"
          >
            <Search className="w-8 h-8" />
            Buy Ticket
          </button>
        </div>

        {/* Search Form */}
        <div id="search-form" className="bg-white rounded-3xl p-8 shadow-2xl border border-gray-100 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="relative text-left">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.from}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search.from}
                  onChange={(e) => handleDistrictSearch('from', e.target.value)}
                  placeholder="Starting Point"
                  className="w-full bg-gray-50 px-4 py-4 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-500 transition-all"
                />
                {suggestions.from.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-2 z-30 overflow-hidden">
                    {suggestions.from.map(d => (
                      <button 
                        key={d} 
                        onClick={() => { setSearch({...search, from: d}); setSuggestions({...suggestions, from: []}); }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-gray-700 text-sm font-medium transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="relative text-left">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.to}</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search.to}
                  onChange={(e) => handleDistrictSearch('to', e.target.value)}
                  placeholder="Destination"
                  className="w-full bg-gray-50 px-4 py-4 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-500 transition-all"
                />
                {suggestions.to.length > 0 && (
                  <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-2 z-30 overflow-hidden">
                    {suggestions.to.map(d => (
                      <button 
                        key={d} 
                        onClick={() => { setSearch({...search, to: d}); setSuggestions({...suggestions, to: []}); }}
                        className="w-full text-left px-4 py-3 hover:bg-emerald-50 text-gray-700 text-sm font-medium transition-colors"
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="text-left">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">{t.date}</label>
              <input 
                type="date" 
                value={search.date}
                onChange={(e) => setSearch({...search, date: e.target.value})}
                className="w-full bg-gray-50 px-4 py-4 rounded-xl text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 border border-transparent focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
          <button 
            onClick={fetchTickets}
            className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
          >
            <Search className="w-6 h-6" /> {t.searchBtn}
          </button>
        </div>
      </div>

      {/* Ticket Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-3xl p-6 h-80 animate-pulse">
              <div className="w-20 h-6 bg-gray-100 rounded-md mb-4"></div>
              <div className="w-full h-8 bg-gray-100 rounded-md mb-4"></div>
              <div className="w-3/4 h-4 bg-gray-100 rounded-md mb-8"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-16 bg-gray-100 rounded-xl"></div>
                <div className="h-16 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          ))
        ) : tickets.length > 0 ? (
          tickets.map((ticket: any) => (
            <motion.div 
              key={ticket.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-2xl transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col gap-2">
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider w-fit">
                    {ticket.transport_type}
                  </span>
                  {/* No verified column in tickets schema */}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-gray-900">৳{ticket.asking_price}</p>
                  <p className="text-xs text-gray-400 line-through">৳{ticket.original_price}</p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{ticket.operator_name}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <span className="font-semibold text-gray-700">{ticket.from_location}</span>
                <span className="text-emerald-400">→</span>
                <span className="font-semibold text-gray-700">{ticket.to_location}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t.date}</p>
                  <p className="text-sm font-bold text-gray-700">{new Date(ticket.journey_date).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{t.seat}</p>
                  <p className="text-sm font-bold text-gray-700">{ticket.seat_number}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-black text-sm">
                    {ticket.seller?.name?.[0] || 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{ticket.seller?.name || 'User'}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <p className="text-[10px] text-gray-400 font-medium">Rating: {ticket.seller?.rating || '5.0'} ({ticket.seller?.rating_count || 0})</p>
                    </div>
                  </div>
                </div>
                <Link 
                  to={`/ticket/${ticket.id}`}
                  className="bg-gray-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/10"
                >
                  {t.viewDetails}
                </Link>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-32">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-200" />
            </div>
            <p className="text-gray-500 font-bold text-xl mb-2">{t.noTickets}</p>
            <p className="text-gray-400">Try adjusting your search filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const TicketDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (user && ticket) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [user, ticket]);

  const fetchTicket = async () => {
    try {
      const data = await apiService.getTickets({ from: '', to: '', date: '' }); // This is a hack, I should have getTicketById in apiService
      // Actually I'll add getTicketById to apiService now.
      const ticketData = await apiService.getTickets({ from: '', to: '', date: '' });
      const found = ticketData.find((t: any) => t.id === id);
      setTicket(found);
    } catch (e) {
      console.error(e);
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
      const data = await apiService.getMessages(id!);
      setMessages(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await apiService.sendMessage({
        ticket_id: id,
        receiver_id: ticket.seller_id,
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

  const isSeller = user?.id === ticket.user_id;

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
              <p className="font-bold text-gray-900">{ticket.seat_number}</p>
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
            <h3 className="font-bold text-gray-900">Ticket Image Verification</h3>
            <div className="relative rounded-2xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
              {ticket.ticket_image ? (
                <>
                  <img 
                    src={ticket.ticket_image} 
                    alt="Ticket" 
                    className="w-full h-full object-contain blur-xl opacity-50"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                    <Shield className="w-12 h-12 text-emerald-600 mb-4" />
                    <p className="text-gray-900 font-bold mb-2">Sensitive Information Hidden</p>
                    <p className="text-sm text-gray-500 max-w-xs">Full ticket image and QR codes are only visible to the buyer after purchase confirmation or to administrators for verification.</p>
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No image provided</p>
              )}
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-2xl">
              {ticket.user?.name[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{ticket.user?.name}</h3>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-sm text-gray-400">Seller Rating: {ticket.user?.rating}/5</span>
              </div>
            </div>
          </div>
          <button className="text-red-500 text-sm font-bold hover:underline flex items-center gap-1">
            <Shield className="w-4 h-4" /> Report Seller
          </button>
        </div>
      </div>

      {/* Chat Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[600px] lg:h-auto">
        <div className="p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" /> 
            {isSeller ? 'Chat with Buyer' : 'Negotiate with Seller'}
          </h3>
        </div>

        {!user ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-gray-500 mb-4">You must be logged in to chat with the seller.</p>
            <Link to="/login" className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">Login to Chat</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-10">No messages yet. Start the negotiation!</p>
              )}
              {messages.map((msg: any) => (
                <div key={msg.id} className={cn(
                  "flex flex-col max-w-[80%]",
                  msg.sender_id === user.id ? "ml-auto items-end" : "mr-auto items-start"
                )}>
                  <div className={cn(
                    "px-4 py-2 rounded-2xl text-sm",
                    msg.sender_id === user.id ? "bg-emerald-600 text-white rounded-tr-none" : "bg-gray-100 text-gray-800 rounded-tl-none"
                  )}>
                    {msg.message}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2">
              <input 
                type="text" 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                maxLength={500}
                className="flex-1 bg-gray-50 px-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
              <button className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 transition-colors">
                <PlusCircle className="w-5 h-5 rotate-45" />
              </button>
            </form>
          </>
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 h-32 relative">
          <div className="absolute -bottom-12 left-8">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-lg flex items-center justify-center border-4 border-white">
              <User className="w-12 h-12 text-emerald-600" />
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
              <input 
                type="password"
                disabled={!isEditing}
                placeholder={isEditing ? "Enter new password" : "••••••••"}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none disabled:bg-gray-50 disabled:text-gray-500 transition-all"
              />
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

const Login = () => {
  const { user, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiService.login(email, password);
      if (data.requiresOTP) {
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiService.verifyOTP(email, otp);
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 mb-6">{error}</div>
        )}
        
        {!showOTP ? (
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">One-Time Password (OTP)</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-center text-2xl tracking-widest font-bold"
                placeholder="000000"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button 
              type="button"
              onClick={() => setShowOTP(false)}
              className="w-full text-gray-500 text-sm font-bold hover:underline"
            >
              Back to Login
            </button>
          </form>
        )}
        
        {!showOTP && (
          <p className="text-center mt-8 text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-emerald-600 font-bold">Register here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

const Register = () => {
  const { user, login } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showOTP, setShowOTP] = useState(false);
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiService.verifyOTP(formData.email, otp, 'registration');
      login(data.token, data.user);
      navigate(data.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 outline-none"
                placeholder="••••••••"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Sending OTP...' : 'Register Now'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">One-Time Password (OTP)</label>
              <input 
                type="text" 
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-center text-2xl tracking-widest font-bold"
                placeholder="000000"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Complete Registration'}
            </button>
            <button 
              type="button"
              onClick={() => setShowOTP(false)}
              className="w-full text-gray-500 text-sm font-bold hover:underline"
            >
              Back to Registration
            </button>
          </form>
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
  const { t } = useTranslation();
  const [data, setData] = useState<any>({ listings: [], purchases: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchDashboard = async () => {
        try {
          const d = await apiService.getUserDashboard();
          setData(d);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      fetchDashboard();
    }
  }, [user]);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">{t.dashboard}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Listings */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-emerald-600" /> My Listings
          </h2>
          <div className="space-y-4">
            {data.listings.length === 0 ? (
              <p className="text-gray-400 text-sm">No active listings.</p>
            ) : (
              data.listings.map((ticket: any) => (
                <div key={ticket.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{ticket.operator_name}</p>
                    <p className="text-xs text-gray-400">{ticket.from_location} → {ticket.to_location}</p>
                    <div className="mt-1">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        ticket.status === 'pending' ? "bg-amber-100 text-amber-600" :
                        ticket.status === 'available' ? "bg-emerald-100 text-emerald-600" :
                        "bg-gray-100 text-gray-600"
                      )}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">৳{ticket.asking_price}</p>
                    <Link to={`/ticket/${ticket.id}`} className="text-xs text-gray-400 hover:underline">View</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Purchases */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-emerald-600" /> My Purchases
          </h2>
          <div className="space-y-4">
            {data.purchases.length === 0 ? (
              <p className="text-gray-400 text-sm">No purchases yet.</p>
            ) : (
              data.purchases.map((tx: any) => (
                <div key={tx.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-900">{tx.ticket?.operator_name}</p>
                    <p className="text-xs text-gray-400">Status: <span className="text-emerald-600 font-bold uppercase">{tx.status}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">৳{tx.ticket?.asking_price}</p>
                    <Link to={`/ticket/${tx.ticket_id}`} className="text-xs text-gray-400 hover:underline">View</Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
  const { t } = useTranslation();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await apiService.getConversations();
        setConversations(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, []);

  if (loading) return <div className="p-20 text-center">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
        <MessageSquare className="w-8 h-8 text-emerald-600" /> {t.messages}
      </h1>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {conversations.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No messages yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {conversations.map((conv: any) => (
              <button
                key={conv.ticket_id}
                onClick={() => navigate(`/ticket/${conv.ticket_id}`)}
                className="w-full p-6 flex items-center gap-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                  <TicketIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-900">{conv.ticket?.operator_name || 'Ticket Chat'}</h3>
                    <span className="text-xs text-gray-400">{new Date(conv.last_message_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conv.last_message}</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-wider">
                    {conv.ticket?.from_location} → {conv.ticket?.to_location}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </button>
            ))}
          </div>
        )}
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
  return (
    <AuthProvider>
      <TranslationProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <Navbar />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
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
            
            <footer className="bg-white border-t border-gray-100 py-12 mt-20">
              <div className="max-w-7xl mx-auto px-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-xl mb-4">
                  <TicketIcon className="w-6 h-6" /> BariJao
                </div>
                <p className="text-gray-400 text-sm mb-8">© 2026 BariJao – Eid Ticket Exchange. All rights reserved.</p>
                <div className="flex justify-center gap-6 text-sm font-medium text-gray-500">
                  <Link to="/terms" className="hover:text-gray-900">Terms</Link>
                  <Link to="/privacy" className="hover:text-gray-900">Privacy</Link>
                  <Link to="/contact" className="hover:text-gray-900">Contact</Link>
                </div>
              </div>
            </footer>
          </div>
        </Router>
      </TranslationProvider>
    </AuthProvider>
  );
}
