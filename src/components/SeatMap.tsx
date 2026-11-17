import React, { useState } from 'react';
import { 
  Check, 
  User, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Bed, 
  Plane as PlaneIcon,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { OfficialTrip, BoardingPoint } from '../types';
import { useTranslation } from '../TranslationContext';

interface SeatMapProps {
  trip: OfficialTrip;
  onProceedToCheckout: (selectedSeats: string[], boardingPoint: string, droppingPoint: string) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({ trip, onProceedToCheckout }) => {
  const { lang, t } = useTranslation();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedBoarding, setSelectedBoarding] = useState<string>(
    trip.boarding_points[0]?.name || 'Central Terminal'
  );
  const [selectedDropping, setSelectedDropping] = useState<string>(
    trip.dropping_points[0]?.name || 'Destination Station'
  );

  const booked = new Set(trip.booked_seats || []);
  const ladies = new Set(trip.ladies_seats || []);

  const MAX_SEATS = 4;

  const toggleSeat = (seatId: string) => {
    if (booked.has(seatId)) return;

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length >= MAX_SEATS) {
        alert(lang === 'en' 
          ? `You can select up to ${MAX_SEATS} seats per booking.` 
          : `একবারে সর্বোচ্চ ${MAX_SEATS}টি সিট বুক করতে পারবেন।`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const totalFare = selectedSeats.length * trip.fare;
  const serviceCharge = selectedSeats.length > 0 ? 50 : 0;
  const grandTotal = totalFare + serviceCharge;

  // Generate seat matrix based on layout
  const renderBusSeats = () => {
    // 2x2 Layout: Rows A through I/J (A1, A2 | A3, A4)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    const is2x1 = trip.seat_layout === 'bus_2x1_business';

    return (
      <div className="space-y-3">
        {rows.slice(0, 9).map((rowLetter) => (
          <div key={rowLetter} className="flex items-center justify-between gap-3">
            {/* Left side: 2 seats (or 1 seat if 2x1) */}
            <div className="flex gap-2">
              <SeatButton
                seatId={`${rowLetter}1`}
                isBooked={booked.has(`${rowLetter}1`)}
                isLadies={ladies.has(`${rowLetter}1`)}
                isSelected={selectedSeats.includes(`${rowLetter}1`)}
                onToggle={() => toggleSeat(`${rowLetter}1`)}
              />
              {!is2x1 && (
                <SeatButton
                  seatId={`${rowLetter}2`}
                  isBooked={booked.has(`${rowLetter}2`)}
                  isLadies={ladies.has(`${rowLetter}2`)}
                  isSelected={selectedSeats.includes(`${rowLetter}2`)}
                  onToggle={() => toggleSeat(`${rowLetter}2`)}
                />
              )}
            </div>

            {/* Aisle */}
            <div className="w-8 text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest select-none">
              {rowLetter}
            </div>

            {/* Right side: 2 seats */}
            <div className="flex gap-2">
              <SeatButton
                seatId={is2x1 ? `${rowLetter}2` : `${rowLetter}3`}
                isBooked={booked.has(is2x1 ? `${rowLetter}2` : `${rowLetter}3`)}
                isLadies={ladies.has(is2x1 ? `${rowLetter}2` : `${rowLetter}3`)}
                isSelected={selectedSeats.includes(is2x1 ? `${rowLetter}2` : `${rowLetter}3`)}
                onToggle={() => toggleSeat(is2x1 ? `${rowLetter}2` : `${rowLetter}3`)}
              />
              <SeatButton
                seatId={is2x1 ? `${rowLetter}3` : `${rowLetter}4`}
                isBooked={booked.has(is2x1 ? `${rowLetter}3` : `${rowLetter}4`)}
                isLadies={ladies.has(is2x1 ? `${rowLetter}3` : `${rowLetter}4`)}
                isSelected={selectedSeats.includes(is2x1 ? `${rowLetter}3` : `${rowLetter}4`)}
                onToggle={() => toggleSeat(is2x1 ? `${rowLetter}3` : `${rowLetter}4`)}
              />
            </div>
          </div>
        ))}

        {/* Back row: 5 seats */}
        <div className="flex items-center justify-between gap-1 pt-2 border-t border-dashed border-gray-200">
          {['J1', 'J2', 'J3', 'J4', 'J5'].map((seatId) => (
            <SeatButton
              key={seatId}
              seatId={seatId}
              isBooked={booked.has(seatId)}
              isLadies={ladies.has(seatId)}
              isSelected={selectedSeats.includes(seatId)}
              onToggle={() => toggleSeat(seatId)}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderTrainSeats = () => {
    // 50 train seats in coach
    const numbers = Array.from({ length: 40 }, (_, i) => String(i + 1).padStart(2, '0'));
    const rows: string[][] = [];
    for (let i = 0; i < numbers.length; i += 4) {
      rows.push(numbers.slice(i, i + 4));
    }

    return (
      <div className="space-y-3">
        {rows.map((rowGroup, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              <SeatButton
                seatId={rowGroup[0]}
                isBooked={booked.has(rowGroup[0])}
                isLadies={ladies.has(rowGroup[0])}
                isSelected={selectedSeats.includes(rowGroup[0])}
                onToggle={() => toggleSeat(rowGroup[0])}
              />
              <SeatButton
                seatId={rowGroup[1]}
                isBooked={booked.has(rowGroup[1])}
                isLadies={ladies.has(rowGroup[1])}
                isSelected={selectedSeats.includes(rowGroup[1])}
                onToggle={() => toggleSeat(rowGroup[1])}
              />
            </div>

            <div className="w-8 text-center text-[10px] font-bold text-gray-300">
              {idx + 1}
            </div>

            <div className="flex gap-2">
              <SeatButton
                seatId={rowGroup[2]}
                isBooked={booked.has(rowGroup[2])}
                isLadies={ladies.has(rowGroup[2])}
                isSelected={selectedSeats.includes(rowGroup[2])}
                onToggle={() => toggleSeat(rowGroup[2])}
              />
              <SeatButton
                seatId={rowGroup[3]}
                isBooked={booked.has(rowGroup[3])}
                isLadies={ladies.has(rowGroup[3])}
                isSelected={selectedSeats.includes(rowGroup[3])}
                onToggle={() => toggleSeat(rowGroup[3])}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderLaunchCabins = () => {
    const cabins = [
      'CAB-101', 'CAB-102', 'CAB-103', 'CAB-104',
      'CAB-201', 'CAB-202', 'CAB-203', 'CAB-204',
      'VIP-1', 'VIP-2', 'VIP-3', 'VIP-4'
    ];

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {cabins.map((cab) => {
          const isCabBooked = booked.has(cab);
          const isCabSelected = selectedSeats.includes(cab);
          const isVip = cab.startsWith('VIP');

          return (
            <button
              key={cab}
              type="button"
              disabled={isCabBooked}
              onClick={() => toggleSeat(cab)}
              className={`p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all text-xs font-bold cursor-pointer ${
                isCabBooked
                  ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                  : isCabSelected
                  ? 'bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-600/30'
                  : isVip
                  ? 'bg-amber-50 border-amber-200 text-amber-900 hover:border-amber-400'
                  : 'bg-white border-gray-200 text-gray-800 hover:border-emerald-500'
              }`}
            >
              <Bed className={`w-5 h-5 ${isCabSelected ? 'text-white' : isVip ? 'text-amber-600' : 'text-blue-600'}`} />
              <span>{cab}</span>
              <span className="text-[10px] font-normal opacity-80">
                {isVip ? 'Presidential Suite' : 'Deluxe AC Cabin'}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  const renderFlightSeats = () => {
    const rows = ['1', '2', '3', '4', '5', '6', '7', '8'];
    return (
      <div className="space-y-2.5">
        {rows.map((rowNum) => (
          <div key={rowNum} className="flex items-center justify-between gap-3">
            <div className="flex gap-2">
              {['A', 'B', 'C'].map((col) => {
                const seatId = `${rowNum.padStart(2, '0')}${col}`;
                return (
                  <SeatButton
                    key={seatId}
                    seatId={seatId}
                    isBooked={booked.has(seatId)}
                    isLadies={false}
                    isSelected={selectedSeats.includes(seatId)}
                    onToggle={() => toggleSeat(seatId)}
                  />
                );
              })}
            </div>

            <div className="w-8 text-center text-[10px] font-bold text-gray-400">
              {rowNum}
            </div>

            <div className="flex gap-2">
              {['D', 'E', 'F'].map((col) => {
                const seatId = `${rowNum.padStart(2, '0')}${col}`;
                return (
                  <SeatButton
                    key={seatId}
                    seatId={seatId}
                    isBooked={booked.has(seatId)}
                    isLadies={false}
                    isSelected={selectedSeats.includes(seatId)}
                    onToggle={() => toggleSeat(seatId)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-50/70 border border-emerald-100 rounded-3xl p-5 sm:p-7 mt-4 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Visual Seat Plan */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs">
          {/* Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-5 border-b border-gray-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md border border-gray-300 bg-white"></span>
              <span className="text-gray-600 font-medium">{lang === 'en' ? 'Available' : 'খালি'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-emerald-600 border border-emerald-700 flex items-center justify-center text-white text-[9px] font-bold">
                ✓
              </span>
              <span className="text-gray-800 font-bold">{lang === 'en' ? 'Selected' : 'নির্বাচিত'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-md bg-gray-200 border border-gray-300"></span>
              <span className="text-gray-400 font-medium">{lang === 'en' ? 'Booked' : 'বুকড'}</span>
            </div>
            {trip.transport_type === 'bus' && (
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-md bg-pink-50 border border-pink-300 text-pink-600 flex items-center justify-center text-[10px]">
                  ♀
                </span>
                <span className="text-pink-700 font-medium">{lang === 'en' ? 'Ladies' : 'মহিলা'}</span>
              </div>
            )}
          </div>

          {/* Vehicle Front / Cabin Indicator */}
          {trip.transport_type === 'bus' && (
            <div className="flex items-center justify-between px-4 py-2 mb-6 bg-gray-100 rounded-xl text-gray-500 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-gray-400">
                <span>🚪 {lang === 'en' ? 'Door / Entrance' : 'দরজা / প্রবেশপথ'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-700">
                <span>{lang === 'en' ? 'Driver Cabin' : 'ড্রাইভার কেবিন'} 🛞</span>
              </div>
            </div>
          )}

          {trip.transport_type === 'flight' && (
            <div className="flex items-center justify-center py-2 mb-6 bg-sky-50 rounded-xl text-sky-700 text-xs font-bold gap-2">
              <PlaneIcon className="w-4 h-4" />
              <span>{lang === 'en' ? 'Cockpit / Front of Aircraft' : 'ককপিট / বিমানের সামনের অংশ'}</span>
            </div>
          )}

          {/* Seat Layout Grid */}
          <div className="flex justify-center py-2 overflow-x-auto">
            {trip.transport_type === 'bus' && renderBusSeats()}
            {trip.transport_type === 'train' && renderTrainSeats()}
            {trip.transport_type === 'launch' && renderLaunchCabins()}
            {trip.transport_type === 'flight' && renderFlightSeats()}
          </div>
        </div>

        {/* Right Column: Boarding/Dropping selection & Fare summary */}
        <div className="lg:col-span-5 space-y-5">
          {/* Boarding Point Dropdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-600" />
              {t.boardingPoint || 'Select Boarding Point'}
            </h4>

            <div className="space-y-2">
              {trip.boarding_points.map((bp) => (
                <label
                  key={bp.name}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedBoarding === bp.name
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="boarding_point"
                    checked={selectedBoarding === bp.name}
                    onChange={() => setSelectedBoarding(bp.name)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{bp.name}</span>
                      <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {bp.time}
                      </span>
                    </div>
                    {bp.address && <p className="text-[11px] text-gray-500 font-normal mt-0.5">{bp.address}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Dropping Point Dropdown */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
            <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-teal-600" />
              {t.droppingPoint || 'Select Dropping Point'}
            </h4>

            <div className="space-y-2">
              {trip.dropping_points.map((dp) => (
                <label
                  key={dp.name}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    selectedDropping === dp.name
                      ? 'border-teal-500 bg-teal-50/50 text-teal-950 font-bold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="dropping_point"
                    checked={selectedDropping === dp.name}
                    onChange={() => setSelectedDropping(dp.name)}
                    className="mt-0.5 text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{dp.name}</span>
                      <span className="text-[11px] font-bold text-teal-700 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {dp.time}
                      </span>
                    </div>
                    {dp.address && <p className="text-[11px] text-gray-500 font-normal mt-0.5">{dp.address}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Fare Summary & Checkout Button */}
          <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-bold text-gray-700">{t.selectedSeats || 'Selected Seats'}:</span>
              <span className="text-xs font-black text-emerald-800">
                {selectedSeats.length > 0 ? selectedSeats.join(', ') : (lang === 'en' ? 'None selected' : 'কোনোটি নির্বাচিত নয়')}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>{lang === 'en' ? 'Base Fare' : 'মূল ভাড়া'} ({selectedSeats.length} × ৳{trip.fare}):</span>
                <span className="font-semibold text-gray-900">৳{totalFare}</span>
              </div>
              <div className="flex justify-between">
                <span>{lang === 'en' ? 'Convenience Fee' : 'সার্ভিস চার্জ'}:</span>
                <span className="font-semibold text-gray-900">৳{serviceCharge}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-emerald-800 pt-2 border-t border-gray-100">
                <span>{t.totalPayable || 'Total Payable'}:</span>
                <span>৳{grandTotal}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={selectedSeats.length === 0}
              onClick={() => onProceedToCheckout(selectedSeats, selectedBoarding, selectedDropping)}
              className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedSeats.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-600/30 hover:scale-[1.01]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{t.continueBooking || 'Proceed to Passenger Details'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'Safe SSL & bKash Encrypted Checkout' : 'নিরাপদ পেমেন্ট ও তাত্ক্ষণিক ই-টিকিট'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subcomponent: Seat Button
interface SeatButtonProps {
  seatId: string;
  isBooked: boolean;
  isLadies: boolean;
  isSelected: boolean;
  onToggle: () => void;
}

const SeatButton: React.FC<SeatButtonProps> = ({
  seatId,
  isBooked,
  isLadies,
  isSelected,
  onToggle,
}) => {
  return (
    <button
      type="button"
      disabled={isBooked}
      onClick={onToggle}
      title={`${seatId}${isBooked ? ' (Booked)' : isLadies ? ' (Ladies)' : ' (Available)'}`}
      className={`w-11 h-11 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center cursor-pointer select-none ${
        isBooked
          ? 'bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed shadow-none'
          : isSelected
          ? 'bg-emerald-600 border-2 border-emerald-700 text-white shadow-md shadow-emerald-600/30 scale-105'
          : isLadies
          ? 'bg-pink-50 border border-pink-300 text-pink-700 hover:border-pink-500 hover:bg-pink-100'
          : 'bg-white border border-gray-300/80 text-gray-800 hover:border-emerald-500 hover:bg-emerald-50/50 shadow-2xs'
      }`}
    >
      <span className="leading-tight">{seatId}</span>
      {isSelected ? (
        <Check className="w-3 h-3 text-white stroke-[3]" />
      ) : isLadies ? (
        <span className="text-[9px] text-pink-500 leading-none">♀</span>
      ) : null}
    </button>
  );
};
export default SeatMap;
