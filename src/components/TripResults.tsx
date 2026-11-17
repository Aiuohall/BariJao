import React, { useState } from 'react';
import { 
  Bus, 
  Train, 
  Ship, 
  Plane, 
  Clock, 
  MapPin, 
  Wifi, 
  Droplet, 
  BatteryCharging, 
  ShieldCheck, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { OfficialTrip, OfficialBooking } from '../types';
import { useTranslation } from '../TranslationContext';
import { SeatMap } from './SeatMap';
import { CheckoutModal } from './CheckoutModal';
import { TicketVoucherModal } from './TicketVoucherModal';

interface TripResultsProps {
  trips: OfficialTrip[];
  loading: boolean;
  journeyDate: string;
  from: string;
  to: string;
  transportType: string;
}

export const TripResults: React.FC<TripResultsProps> = ({
  trips,
  loading,
  journeyDate,
  from,
  to,
  transportType,
}) => {
  const { lang, t } = useTranslation();

  // Active seat selector per trip card
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  // Active checkout flow
  const [checkoutTrip, setCheckoutTrip] = useState<OfficialTrip | null>(null);
  const [checkoutSeats, setCheckoutSeats] = useState<string[]>([]);
  const [checkoutBoarding, setCheckoutBoarding] = useState<string>('');
  const [checkoutDropping, setCheckoutDropping] = useState<string>('');

  // Confirmed ticket voucher
  const [confirmedBooking, setConfirmedBooking] = useState<OfficialBooking | null>(null);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState<'fare_asc' | 'time_asc' | 'rating_desc'>('fare_asc');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  // Extract unique operators and classes
  const operators = Array.from(new Set(trips.map(t => t.operator_name)));

  // Filter & sort logic
  const filteredTrips = trips.filter((t) => {
    if (selectedOperator !== 'all' && t.operator_name !== selectedOperator) return false;
    if (selectedClass === 'ac' && !t.service_type.toLowerCase().includes('ac') && !t.service_type.toLowerCase().includes('snigdha')) return false;
    if (selectedClass === 'sleeper' && !t.service_type.toLowerCase().includes('sleeper') && !t.service_type.toLowerCase().includes('cabin')) return false;
    if (t.fare > maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'fare_asc') return a.fare - b.fare;
    if (sortBy === 'rating_desc') return b.rating - a.rating;
    return a.departure_time.localeCompare(b.departure_time);
  });

  const toggleExpand = (tripId: string) => {
    setExpandedTripId(expandedTripId === tripId ? null : tripId);
  };

  const handleStartCheckout = (
    trip: OfficialTrip,
    seats: string[],
    boarding: string,
    dropping: string
  ) => {
    setCheckoutTrip(trip);
    setCheckoutSeats(seats);
    setCheckoutBoarding(boarding);
    setCheckoutDropping(dropping);
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="w-5 h-5 text-emerald-600" />;
      case 'train': return <Train className="w-5 h-5 text-orange-600" />;
      case 'launch': return <Ship className="w-5 h-5 text-blue-600" />;
      case 'flight': return <Plane className="w-5 h-5 text-sky-600" />;
      default: return <Bus className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6">
      {/* Checkout Modal */}
      {checkoutTrip && (
        <CheckoutModal
          trip={checkoutTrip}
          selectedSeats={checkoutSeats}
          boardingPoint={checkoutBoarding}
          droppingPoint={checkoutDropping}
          journeyDate={journeyDate}
          onClose={() => setCheckoutTrip(null)}
          onSuccess={(booking) => {
            setCheckoutTrip(null);
            setExpandedTripId(null);
            setConfirmedBooking(booking);
          }}
        />
      )}

      {/* Confirmed Ticket Voucher Modal */}
      {confirmedBooking && (
        <TicketVoucherModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
        />
      )}

      {/* Results Header: Route overview & sorting toolbar */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>{from || 'All Bangladesh'}</span>
            <span className="text-gray-300">→</span>
            <span>{to || 'Destination'}</span>
            <span className="text-gray-300">•</span>
            <span className="text-emerald-700">{journeyDate}</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 mt-0.5">
            {filteredTrips.length} {lang === 'en' ? 'Available Services Found' : 'টি সার্ভিস পাওয়া গেছে'}
          </h2>
        </div>

        {/* Sorting Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
            {lang === 'en' ? 'Sort By:' : 'বাছাই:'}
          </span>
          <button
            type="button"
            onClick={() => setSortBy('fare_asc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              sortBy === 'fare_asc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'en' ? 'Cheapest Fare' : 'কম ভাড়া'}
          </button>
          <button
            type="button"
            onClick={() => setSortBy('time_asc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              sortBy === 'time_asc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'en' ? 'Earliest Departure' : 'আগে ছাড়বে'}
          </button>
          <button
            type="button"
            onClick={() => setSortBy('rating_desc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              sortBy === 'rating_desc'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {lang === 'en' ? 'Top Rated' : 'সেরা রেটিং'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-3 space-y-6 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
              {lang === 'en' ? 'Filters' : 'ফিল্টার'}
            </h3>
            {(selectedOperator !== 'all' || selectedClass !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedOperator('all');
                  setSelectedClass('all');
                }}
                className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                {lang === 'en' ? 'Reset' : 'রিসেট'}
              </button>
            )}
          </div>

          {/* Coach Class Filter */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-gray-700">
              {lang === 'en' ? 'Coach Class / Service' : 'কোচ টাইপ'}
            </label>
            <div className="space-y-1.5">
              {[
                { id: 'all', label: lang === 'en' ? 'All Classes' : 'সকল ক্লাস' },
                { id: 'ac', label: lang === 'en' ? 'AC Only (Snigdha / Deluxe)' : 'শুধুমাত্র এসি' },
                { id: 'sleeper', label: lang === 'en' ? 'Sleeper Coach / Cabin' : 'স্লিপার কোচ / কেবিন' }
              ].map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer font-medium"
                >
                  <input
                    type="radio"
                    name="coach_class"
                    checked={selectedClass === c.id}
                    onChange={() => setSelectedClass(c.id)}
                    className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Operator Filter */}
          {operators.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700">
                {lang === 'en' ? 'Select Operator' : 'অপারেটর'}
              </label>
              <select
                value={selectedOperator}
                onChange={(e) => setSelectedOperator(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">{lang === 'en' ? 'All Operators' : 'সকল অপারেটর'}</option>
                {operators.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          )}

          {/* Price Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-gray-700">{lang === 'en' ? 'Max Fare' : 'সর্বোচ্চ ভাড়া'}:</span>
              <span className="font-extrabold text-emerald-700">৳{maxPrice}</span>
            </div>
            <input
              type="range"
              min={300}
              max={6000}
              step={100}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          {/* Trust Highlights */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-[11px] text-gray-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% Guaranteed Seat Allocation</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Instant bKash Refund in case of cancellation</span>
            </div>
          </div>
        </div>

        {/* Right Cards List */}
        <div className="lg:col-span-9 space-y-4">
          {loading && (
            <div className="bg-white rounded-3xl p-16 text-center border border-gray-100 shadow-xs space-y-3">
              <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-gray-600">
                {lang === 'en' ? 'Searching live schedules from transport operators...' : 'অপারেটরদের শিডিউল ও সিট খোঁজা হচ্ছে...'}
              </p>
            </div>
          )}

          {!loading && filteredTrips.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
                🚌
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {lang === 'en' ? 'No Trips Found with Applied Filters' : 'ফিল্টারে কোনো ট্রিপ পাওয়া যায়নি'}
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {lang === 'en' 
                  ? 'Try relaxing your operator or price filters to see more results.' 
                  : 'আরও রেজাল্ট দেখতে অপারেটর বা ভাড়ার ফিল্টার পরিবর্তন করুন।'}
              </p>
            </div>
          )}

          {!loading && filteredTrips.map((trip) => {
            const isExpanded = expandedTripId === trip.id;
            const availableCount = trip.available_seats;

            return (
              <div
                key={trip.id}
                className="bg-white rounded-3xl border border-gray-200/80 shadow-xs hover:border-emerald-300 transition-all overflow-hidden"
              >
                {/* Trip Card Content */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Operator & Service Type */}
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 shadow-2xs">
                        {getTransportIcon(trip.transport_type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-900">{trip.operator_name}</h4>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                            <Star className="w-3 h-3 fill-current" />
                            {trip.rating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 mt-0.5">
                          {trip.service_type}
                        </p>
                        <p className="text-[11px] text-gray-400 font-medium mt-0.5">
                          {trip.coach_number ? `Fleet: ${trip.coach_number} • ` : ''}
                          {trip.seat_layout.replace(/_/g, ' ').toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {/* Schedule (Departure - Duration - Arrival) */}
                    <div className="flex items-center gap-6 sm:gap-8 text-center">
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">DEPARTURE</span>
                        <span className="text-base font-black text-gray-900">{trip.departure_time}</span>
                        <span className="text-[11px] text-gray-500 font-medium block truncate max-w-[100px]">
                          {trip.from_location}
                        </span>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-gray-400 font-bold">{trip.duration}</span>
                        <div className="w-16 sm:w-20 h-0.5 bg-emerald-500 relative my-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-600 absolute -top-0.5 right-0"></div>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Direct</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">ARRIVAL</span>
                        <span className="text-base font-black text-gray-900">{trip.arrival_time}</span>
                        <span className="text-[11px] text-gray-500 font-medium block truncate max-w-[100px]">
                          {trip.to_location}
                        </span>
                      </div>
                    </div>

                    {/* Fare & View Seats Toggle */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100 gap-2 shrink-0">
                      <div className="text-left sm:text-right">
                        <span className="text-2xl font-black text-emerald-800 tracking-tight">৳{trip.fare}</span>
                        <span className="text-[10px] text-gray-400 block font-medium">per seat</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(trip.id)}
                        className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                          isExpanded
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-600/20 hover:scale-[1.02]'
                        }`}
                      >
                        <span>{isExpanded ? (t.hideSeats || 'Hide Seats') : (t.viewSeats || 'View Seats')}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Amenities Badges & Available Seats */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
                    <div className="flex flex-wrap items-center gap-2">
                      {trip.amenities.slice(0, 4).map((am) => (
                        <span
                          key={am}
                          className="px-2.5 py-0.5 rounded-md bg-gray-50 border border-gray-200/60 text-[11px] font-medium text-gray-600"
                        >
                          {am}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-emerald-800">{availableCount} seats left</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Interactive Seat Map */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 sm:px-6 pb-6">
                    <SeatMap
                      trip={trip}
                      onProceedToCheckout={(seats, bp, dp) => handleStartCheckout(trip, seats, bp, dp)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default TripResults;
