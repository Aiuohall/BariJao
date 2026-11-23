import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Bus, 
  Train, 
  Ship, 
  Plane, 
  Repeat, 
  Search, 
  PlusCircle, 
  User, 
  LogOut, 
  Menu, 
  X, 
  ShieldCheck, 
  Globe, 
  Ticket as TicketIcon,
  MessageSquare,
  FileText
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../TranslationContext';

interface NavbarProps {
  onOpenPnrLookup?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenPnrLookup }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      {/* Top Banner: Emergency helpline & trust indicator */}
      <div className="bg-emerald-800 text-emerald-50 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" /> 
              {lang === 'en' ? 'Official E-Tickets & 100% Safe Eid Ticket Exchange' : 'অফিসিয়াল ই-টিকিট ও ১০০% নিরাপদ ঈদ টিকিট বিনিময়'}
            </span>
            <span className="hidden md:inline text-emerald-300">|</span>
            <span className="hidden md:inline text-emerald-200">
              {lang === 'en' ? 'Helpline: 16XXX / +880 9612-BARIJAO' : 'সহায়তা: ১৬XXX / +৮৮০ ৯৬১২-বাড়িযাও'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => onOpenPnrLookup ? onOpenPnrLookup() : navigate('/check-ticket')}
              className="text-xs font-semibold text-emerald-100 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Search className="w-3 h-3" />
              {t.checkPnr || 'Check Ticket / PNR'}
            </button>

            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1 font-medium text-emerald-100 hover:text-white cursor-pointer px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-900 transition-colors"
            >
              <Globe className="w-3 h-3" />
              <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-18">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <TicketIcon className="w-6 h-6 transform -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-900 bg-clip-text text-transparent">
                  BariJao
                </span>
                <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full">
                  BD
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium -mt-1 hidden sm:block">
                {lang === 'en' ? 'E-Tickets & Safe Resale' : 'ই-টিকিট ও নিরাপদ রিসেল'}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links (Shohoz style) */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              to="/?transport=bus"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.search.includes('transport=bus') || (!location.search.includes('transport=') && isCurrent('/'))
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <Bus className="w-4 h-4 text-emerald-600" />
              {t.bus || 'Bus'}
            </Link>

            <Link
              to="/?transport=train"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.search.includes('transport=train')
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <Train className="w-4 h-4 text-orange-600" />
              {t.train || 'Train'}
            </Link>

            <Link
              to="/?transport=launch"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.search.includes('transport=launch')
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <Ship className="w-4 h-4 text-blue-600" />
              {t.launch || 'Launch'}
            </Link>

            <Link
              to="/?transport=flight"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                location.search.includes('transport=flight')
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-gray-600 hover:text-emerald-700 hover:bg-gray-50'
              }`}
            >
              <Plane className="w-4 h-4 text-sky-600" />
              {t.flight || 'Flight'}
            </Link>

            {/* Signature BariJao Resale Market Tab */}
            <Link
              to="/resale"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all relative ${
                isCurrent('/resale')
                  ? 'text-purple-700 bg-purple-50 border border-purple-200'
                  : 'text-gray-700 hover:text-purple-700 hover:bg-purple-50/60'
              }`}
            >
              <Repeat className="w-4 h-4 text-purple-600 animate-pulse" />
              <span>{t.resaleMarket || 'Resale Market'}</span>
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white px-1.5 py-0.2 rounded-full shadow-xs">
                P2P
              </span>
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Quick Sell Spare Ticket CTA */}
            <Link
              to="/sell"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300 transition-all shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>{lang === 'en' ? 'Sell Spare Ticket' : 'অতিরিক্ত টিকিট বিক্রি'}</span>
            </Link>

            {/* Check PNR Quick button */}
            <button
              onClick={() => onOpenPnrLookup ? onOpenPnrLookup() : navigate('/check-ticket')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              <span>{lang === 'en' ? 'My E-Ticket' : 'আমার টিকিট'}</span>
            </button>

            {/* Direct Messages Shortcut Button */}
            {user && (
              <Link
                to="/messages"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isCurrent('/messages')
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'text-gray-700 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 shadow-2xs'
                }`}
                title={lang === 'en' ? 'Messages & Chat' : 'মেসেজ ও চ্যাট'}
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">{lang === 'en' ? 'Messages' : 'চ্যাট'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </Link>
            )}

            {/* User Dropdown / Login */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-full border border-gray-200 hover:border-emerald-500 bg-white shadow-2xs transition-all cursor-pointer"
                >
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-gray-800 max-w-[100px] truncate hidden md:inline">
                    {user.name}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email || user.phone}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <TicketIcon className="w-4 h-4 text-emerald-600" />
                      {t.dashboard || 'My Bookings & Dashboard'}
                    </Link>

                    <Link
                      to="/messages"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      {t.messages || 'Messages'}
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-600" />
                      {lang === 'en' ? 'My Profile' : 'প্রোফাইল'}
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        {t.admin || 'Admin Panel'}
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1"></div>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-red-500" />
                      {t.logout || 'Log Out'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-emerald-700 hover:bg-gray-100 transition-colors"
                >
                  {t.login || 'Sign In'}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02]"
                >
                  {lang === 'en' ? 'Register' : 'নিবন্ধন'}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100 space-y-2 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-gray-100">
              <Link
                to="/?transport=bus"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-xs font-semibold text-gray-800"
              >
                <Bus className="w-4 h-4 text-emerald-600" />
                {t.bus || 'Bus Tickets'}
              </Link>
              <Link
                to="/?transport=train"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-xs font-semibold text-gray-800"
              >
                <Train className="w-4 h-4 text-orange-600" />
                {t.train || 'Train Tickets'}
              </Link>
              <Link
                to="/?transport=launch"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-xs font-semibold text-gray-800"
              >
                <Ship className="w-4 h-4 text-blue-600" />
                {t.launch || 'Launch Tickets'}
              </Link>
              <Link
                to="/?transport=flight"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50 text-xs font-semibold text-gray-800"
              >
                <Plane className="w-4 h-4 text-sky-600" />
                {t.flight || 'Flight Tickets'}
              </Link>
            </div>

            <Link
              to="/resale"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-purple-50 text-purple-900 font-bold text-xs"
            >
              <span className="flex items-center gap-2">
                <Repeat className="w-4 h-4 text-purple-600" />
                {t.resaleMarket || 'P2P Resale Market'}
              </span>
              <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">Safe Exchange</span>
            </Link>

            <Link
              to="/sell"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs"
            >
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              {lang === 'en' ? 'Sell Your Extra Ticket' : 'আপনার অতিরিক্ত টিকিট বিক্রি করুন'}
            </Link>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenPnrLookup) onOpenPnrLookup();
                else navigate('/check-ticket');
              }}
              className="w-full flex items-center gap-2 p-3 rounded-xl bg-gray-50 text-gray-800 font-semibold text-xs text-left"
            >
              <Search className="w-4 h-4 text-gray-600" />
              {t.checkPnr || 'Check Ticket / PNR'}
            </button>

            {user && (
              <Link
                to="/messages"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 font-bold text-xs"
              >
                <span className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  {t.messages || 'Messages & Chats'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
export default Navbar;
