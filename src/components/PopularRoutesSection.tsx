import React from 'react';
import { ArrowRight, Bus, Ship, Train, Plane, Clock, Tag } from 'lucide-react';
import { useTranslation } from '../TranslationContext';

interface PopularRoutesSectionProps {
  onSelectRoute: (from: string, to: string, transport: 'bus' | 'train' | 'launch' | 'flight') => void;
}

export const PopularRoutesSection: React.FC<PopularRoutesSectionProps> = ({ onSelectRoute }) => {
  const { lang } = useTranslation();

  const routes = [
    {
      from: 'Dhaka',
      to: "Cox's Bazar",
      transport: 'bus' as const,
      transportName: 'Bus Service',
      minFare: 1600,
      duration: '8h 30m',
      departures: '40+ daily trips',
      image: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=600&auto=format&fit=crop&q=80',
      badge: 'Most Popular'
    },
    {
      from: 'Dhaka',
      to: 'Chattogram',
      transport: 'train' as const,
      transportName: 'Express Train',
      minFare: 405,
      duration: '5h 15m',
      departures: '8 intercity trains',
      image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=600&auto=format&fit=crop&q=80',
      badge: 'Subarna / Sonar Bangla'
    },
    {
      from: 'Dhaka',
      to: 'Sylhet',
      transport: 'bus' as const,
      transportName: 'Luxury Sleeper Bus',
      minFare: 1000,
      duration: '5h 30m',
      departures: '25+ daily trips',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80',
      badge: 'Tea Capital'
    },
    {
      from: 'Dhaka',
      to: 'Barishal',
      transport: 'launch' as const,
      transportName: 'Deluxe AC Launch',
      minFare: 1100,
      duration: '8h 00m',
      departures: '12 luxury vessels',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      badge: 'River Cruise'
    },
    {
      from: 'Dhaka',
      to: 'Rajshahi',
      transport: 'bus' as const,
      transportName: 'Executive AC Coach',
      minFare: 1200,
      duration: '5h 30m',
      departures: '18 daily trips',
      image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      badge: 'Fast Highway'
    },
    {
      from: 'Dhaka',
      to: "Cox's Bazar",
      transport: 'flight' as const,
      transportName: 'Domestic Flight',
      minFare: 4200,
      duration: '1h 05m',
      departures: '14 daily flights',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=80',
      badge: 'Non-stop Flight'
    }
  ];

  const getIcon = (tp: string) => {
    switch (tp) {
      case 'bus': return <Bus className="w-4 h-4 text-emerald-600" />;
      case 'train': return <Train className="w-4 h-4 text-orange-600" />;
      case 'launch': return <Ship className="w-4 h-4 text-blue-600" />;
      case 'flight': return <Plane className="w-4 h-4 text-sky-600" />;
      default: return <Bus className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block mb-1">
            {lang === 'en' ? 'TOP DESTINATIONS' : 'জনপ্রিয় গন্তব্যসমূহ'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {lang === 'en' ? 'Popular Travel Routes Across Bangladesh' : 'বাংলাদেশের সর্বাধিক জনপ্রিয় ভ্রমণ রুট'}
          </h2>
        </div>
        <p className="text-xs text-gray-500 max-w-sm">
          {lang === 'en' 
            ? 'Compare bus, train, launch and air fares on the busiest domestic routes with instant booking.' 
            : 'ব্যস্ততম রুটগুলোতে বাস, ট্রেন, লঞ্চ ও এয়ারলাইন্সের ভাড়া তুলনা করে টিকিট বুক করুন।'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {routes.map((route, idx) => (
          <div
            key={idx}
            onClick={() => onSelectRoute(route.from, route.to, route.transport)}
            className="group relative bg-white rounded-3xl overflow-hidden border border-gray-200/80 hover:border-emerald-500 shadow-xs hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
          >
            {/* Card Visual Header with Overlay */}
            <div className="relative h-44 overflow-hidden">
              <img
                src={route.image}
                alt={`${route.from} to ${route.to}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>

              {/* Badges */}
              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-black text-gray-900 uppercase tracking-wider shadow-xs">
                  {route.badge}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <span className="p-2 rounded-full bg-black/40 backdrop-blur-xs text-white">
                  {getIcon(route.transport)}
                </span>
              </div>

              {/* Route Titles on Image */}
              <div className="absolute bottom-3 left-3 right-3 text-white">
                <div className="flex items-center gap-2 text-base sm:text-lg font-black">
                  <span>{route.from}</span>
                  <span className="text-emerald-400">→</span>
                  <span>{route.to}</span>
                </div>
                <p className="text-xs text-gray-200 font-medium">{route.transportName}</p>
              </div>
            </div>

            {/* Card Content & Fare */}
            <div className="p-4 sm:p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400 block">
                  {lang === 'en' ? 'FARES FROM' : 'ভাড়া শুরু'}
                </span>
                <span className="text-xl font-black text-emerald-800">৳{route.minFare}</span>
                <span className="text-[11px] text-gray-400 ml-1">/ person</span>
              </div>

              <div className="text-right flex items-center gap-2 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition-transform">
                <span>{lang === 'en' ? 'View Trips' : 'ট্রিপ দেখুন'}</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PopularRoutesSection;
