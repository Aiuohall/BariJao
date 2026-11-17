import React, { useState } from 'react';
import { 
  Bus, 
  Train, 
  Ship, 
  Plane, 
  Repeat, 
  ArrowRightLeft, 
  Calendar, 
  MapPin, 
  Search, 
  ShieldCheck, 
  Sparkles,
  Zap,
  TrendingDown
} from 'lucide-react';
import { BANGLADESH_DISTRICTS } from '../constants';
import { useTranslation } from '../TranslationContext';

interface HeroSearchProps {
  activeTransport: 'bus' | 'train' | 'launch' | 'flight' | 'resale';
  onTransportChange: (type: 'bus' | 'train' | 'launch' | 'flight' | 'resale') => void;
  from: string;
  to: string;
  date: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onDateChange: (val: string) => void;
  onSearch: () => void;
}

export const HeroSearch: React.FC<HeroSearchProps> = ({
  activeTransport,
  onTransportChange,
  from,
  to,
  date,
  onFromChange,
  onToChange,
  onDateChange,
  onSearch,
}) => {
  const { lang, t } = useTranslation();
  const [fromSuggestions, setFromSuggestions] = useState<string[]>([]);
  const [toSuggestions, setToSuggestions] = useState<string[]>([]);

  // Fast dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  const dayAfterStr = dayAfter.toISOString().split('T')[0];

  const handleDistrictFilter = (val: string, setFn: (list: string[]) => void) => {
    if (!val.trim()) {
      setFn([]);
      return;
    }
    const q = val.toLowerCase();
    const matches = BANGLADESH_DISTRICTS.filter(d => d.toLowerCase().includes(q)).slice(0, 5);
    setFn(matches);
  };

  const handleSwap = () => {
    const temp = from;
    onFromChange(to);
    onToChange(temp);
  };

  const setQuickRoute = (f: string, tDest: string) => {
    onFromChange(f);
    onToChange(tDest);
  };

  return (
    <div className="relative bg-gradient-to-b from-emerald-900 via-teal-900 to-slate-900 text-white pt-10 pb-16 px-4 sm:px-6 overflow-hidden">
      {/* Decorative ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Hero Title & Subtitle */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Bangladesh’s Complete E-Ticket & Resale Hub' : 'বাংলাদেশের পূর্ণাঙ্গ ই-টিকিট ও রিসেল প্ল্যাটফর্ম'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white mb-3">
            {lang === 'en' ? (
              <>Book Official Tickets <span className="text-emerald-400">&</span> Safe Resale</>
            ) : (
              <>অফিসিয়াল ই-টিকিট বুকিং ও <span className="text-emerald-400">নিরাপদ রিসেল</span></>
            )}
          </h1>

          <p className="text-emerald-100/80 text-sm sm:text-base font-normal max-w-2xl mx-auto">
            {lang === 'en' 
              ? 'Buy direct bus, train, launch & flight e-tickets from verified operators — or safely exchange sold-out tickets peer-to-peer.'
              : 'শীর্ষ অপারেটরদের সরাসরি বাস, ট্রেন, লঞ্চ ও ফ্লাইট টিকিট কাটুন — অথবা ঈদ ও জরুরি যাত্রার অতিরিক্ত টিকিট নিরাপদে ক্রয়-বিক্রয় করুন।'}
          </p>
        </div>

        {/* Main Search Card */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-2xl text-gray-900 border border-gray-100 max-w-5xl mx-auto">
          {/* Transport Category Tab Bar (Shohoz / BDtickets style) */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5 overflow-x-auto gap-2 no-scrollbar">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => onTransportChange('bus')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTransport === 'bus'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
                    : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50/60'
                }`}
              >
                <Bus className="w-4 h-4" />
                <span>{t.bus || 'Bus'}</span>
              </button>

              <button
                type="button"
                onClick={() => onTransportChange('train')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTransport === 'train'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30 scale-[1.02]'
                    : 'text-gray-600 hover:text-orange-700 hover:bg-orange-50/60'
                }`}
              >
                <Train className="w-4 h-4" />
                <span>{t.train || 'Train'}</span>
              </button>

              <button
                type="button"
                onClick={() => onTransportChange('launch')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTransport === 'launch'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
                    : 'text-gray-600 hover:text-blue-700 hover:bg-blue-50/60'
                }`}
              >
                <Ship className="w-4 h-4" />
                <span>{t.launch || 'Launch'}</span>
              </button>

              <button
                type="button"
                onClick={() => onTransportChange('flight')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTransport === 'flight'
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 scale-[1.02]'
                    : 'text-gray-600 hover:text-sky-700 hover:bg-sky-50/60'
                }`}
              >
                <Plane className="w-4 h-4" />
                <span>{t.flight || 'Flight'}</span>
              </button>
            </div>

            {/* BariJao Resale Market Tab */}
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => onTransportChange('resale')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTransport === 'resale'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30 scale-[1.02]'
                    : 'text-purple-700 bg-purple-50/80 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Repeat className="w-4 h-4 animate-spin-slow" />
                <span>{lang === 'en' ? 'P2P Resale Market' : 'পি২পি রিসেল মার্কেট'}</span>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-1.5 py-0.2 rounded-full">
                  HOT
                </span>
              </button>
            </div>
          </div>

          {/* Form Search Grid */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSearch();
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-center"
          >
            {/* Origin (From) */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {t.from || 'From'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? 'e.g. Dhaka, Gabtoli' : 'যেমন: ঢাকা, গাবতলী'}
                  value={from}
                  onChange={(e) => {
                    onFromChange(e.target.value);
                    handleDistrictFilter(e.target.value, setFromSuggestions);
                  }}
                  onFocus={() => handleDistrictFilter(from, setFromSuggestions)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Suggestions */}
              {fromSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden">
                  {fromSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        onFromChange(item);
                        setFromSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <span className="text-[10px] text-gray-400">Bangladesh</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Swap Button (between From & To) */}
            <div className="md:col-span-1 flex justify-center -my-2 md:my-0">
              <button
                type="button"
                onClick={handleSwap}
                title="Swap From and To"
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-emerald-100 hover:text-emerald-700 text-gray-500 flex items-center justify-center transition-all cursor-pointer border border-gray-200/80 shadow-2xs hover:rotate-180 duration-200"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination (To) */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {t.to || 'To'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={lang === 'en' ? "e.g. Cox's Bazar, Chattogram" : "যেমন: কক্সবাজার, চট্টগ্রাম"}
                  value={to}
                  onChange={(e) => {
                    onToChange(e.target.value);
                    handleDistrictFilter(e.target.value, setToSuggestions);
                  }}
                  onFocus={() => handleDistrictFilter(to, setToSuggestions)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Suggestions */}
              {toSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-100 rounded-2xl shadow-xl z-30 py-1.5 overflow-hidden">
                  {toSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        onToChange(item);
                        setToSuggestions([]);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                    >
                      <span>{item}</span>
                      <span className="text-[10px] text-gray-400">Bangladesh</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Journey Date */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                {t.date || 'Journey Date'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Quick date shortcuts & Search CTA */}
            <div className="md:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <span className="text-[11px] uppercase tracking-wider font-bold text-gray-400">
                  {lang === 'en' ? 'Quick Dates:' : 'দ্রুত তারিখ:'}
                </span>
                <button
                  type="button"
                  onClick={() => onDateChange(todayStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    date === todayStr ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {lang === 'en' ? 'Today' : 'আজ'}
                </button>
                <button
                  type="button"
                  onClick={() => onDateChange(tomorrowStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    date === tomorrowStr ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {lang === 'en' ? 'Tomorrow' : 'কাল'}
                </button>
                <button
                  type="button"
                  onClick={() => onDateChange(dayAfterStr)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                    date === dayAfterStr ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {lang === 'en' ? 'Day After' : 'পরশু'}
                </button>
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Search className="w-4 h-4" />
                <span>{t.searchBtn || 'Search Available Tickets'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Popular Route Fast Tags */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-emerald-200/90 font-medium">
            {lang === 'en' ? 'Popular Routes:' : 'জনপ্রিয় রুটসমূহ:'}
          </span>
          {[
            { f: 'Dhaka', t: "Cox's Bazar" },
            { f: 'Dhaka', t: 'Chattogram' },
            { f: 'Dhaka', t: 'Sylhet' },
            { f: 'Dhaka', t: 'Barishal' },
            { f: 'Dhaka', t: 'Rajshahi' },
            { f: 'Dhaka', t: 'Khulna' }
          ].map((r) => (
            <button
              key={`${r.f}-${r.t}`}
              type="button"
              onClick={() => setQuickRoute(r.f, r.t)}
              className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-emerald-100 border border-white/10 transition-colors cursor-pointer"
            >
              {r.f} ⇄ {r.t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default HeroSearch;
