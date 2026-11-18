import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  Phone, 
  Mail, 
  User as UserIcon,
  Ticket as TicketIcon
} from 'lucide-react';
import { OfficialTrip, OfficialBooking } from '../types';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../TranslationContext';
import { apiService } from '../services/apiService';

interface CheckoutModalProps {
  trip: OfficialTrip;
  selectedSeats: string[];
  boardingPoint: string;
  droppingPoint: string;
  journeyDate: string;
  onClose: () => void;
  onSuccess: (booking: OfficialBooking) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  trip,
  selectedSeats,
  boardingPoint,
  droppingPoint,
  journeyDate,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { lang, t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');

  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'card'>('bkash');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState('');

  // bKash / Payment simulation state
  const [paymentStep, setPaymentStep] = useState<'details' | 'gateway_sim' | 'processing'>('details');
  const [bkashNumber, setBkashNumber] = useState(user?.phone || '');
  const [bkashOtp, setBkashOtp] = useState('');
  const [bkashPin, setBkashPin] = useState('');
  const [gatewaySubStep, setGatewaySubStep] = useState<'number' | 'otp' | 'pin'>('number');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seatCount = selectedSeats.length;
  const baseFare = seatCount * trip.fare;
  const serviceCharge = 50;
  const netPayable = Math.max(baseFare + serviceCharge - discount, 0);

  const handleApplyPromo = () => {
    setPromoError('');
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    if (code === 'EID2026') {
      const disc = Math.min(Math.round(baseFare * 0.15), 300);
      setDiscount(disc);
      setAppliedPromo('EID2026 (15% OFF)');
    } else if (code === 'BARIJAO50') {
      setDiscount(50);
      setAppliedPromo('BARIJAO50 (৳50 OFF)');
    } else if (code === 'SHOHOZ10') {
      const disc = Math.min(Math.round(baseFare * 0.10), 200);
      setDiscount(disc);
      setAppliedPromo('SHOHOZ10 (10% OFF)');
    } else {
      setPromoError(lang === 'en' ? 'Invalid coupon code. Try EID2026 or BARIJAO50' : 'ভুল কুপন কোড। EID2026 অথবা BARIJAO50 চেষ্টা করুন');
    }
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'en' ? 'Please enter passenger name.' : 'অনুগ্রহ করে যাত্রীর নাম লিখুন।');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setError(lang === 'en' ? 'Please enter a valid 11-digit Bangladesh phone number.' : 'অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন।');
      return;
    }

    setBkashNumber(phone);
    setPaymentStep('gateway_sim');
    setGatewaySubStep('number');
  };

  const handleExecutePayment = async () => {
    setLoading(true);
    setError('');
    setPaymentStep('processing');

    try {
      const booking = await apiService.createOfficialBooking({
        trip_id: trip.id,
        seats: selectedSeats,
        passenger_name: name.trim(),
        passenger_phone: phone.trim(),
        passenger_email: email.trim(),
        passenger_gender: gender,
        boarding_point: boardingPoint,
        dropping_point: droppingPoint,
        payment_method: paymentMethod,
        promo_code: appliedPromo ? promoCode : undefined,
        journey_date: journeyDate
      });

      // Small delay for smooth realistic payment animation
      setTimeout(() => {
        setLoading(false);
        onSuccess(booking);
      }, 1000);
    } catch (err: any) {
      setLoading(false);
      setPaymentStep('details');
      setError(err.message || 'Payment processing failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
              <TicketIcon className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-extrabold">
                {lang === 'en' ? 'Confirm Booking & Instant E-Ticket' : 'বুকিং নিশ্চিতকরণ ও তাত্ক্ষণিক ই-টিকিট'}
              </h3>
              <p className="text-xs text-emerald-200">
                {trip.operator_name} • {trip.from_location} → {trip.to_location}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 flex items-center gap-2">
              <X className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Details & Payment Method Selection */}
          {paymentStep === 'details' && (
            <form onSubmit={handleSubmitDetails} className="space-y-6">
              {/* Trip Summary Chip */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-gray-500 font-medium">{lang === 'en' ? 'Journey Date:' : 'যাত্রার তারিখ:'} </span>
                  <span className="font-bold text-gray-900">{journeyDate}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">{lang === 'en' ? 'Seats:' : 'সিট:'} </span>
                  <span className="font-extrabold text-emerald-800">{selectedSeats.join(', ')}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">{lang === 'en' ? 'Departure:' : 'রওয়ানা:'} </span>
                  <span className="font-bold text-gray-900">{trip.departure_time}</span>
                </div>
              </div>

              {/* Passenger Details Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-emerald-600" />
                  {t.passengerDetails || 'Primary Passenger Details'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.fullName || 'Full Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'en' ? 'e.g. Tanvir Ahmed' : 'যেমন: তানভীর আহমেদ'}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.phoneNumber || 'Mobile Phone (BD)'} *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="017XXXXXXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.emailAddress || 'Email Address'} (Optional)
                    </label>
                    <input
                      type="email"
                      placeholder="tanvir@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {t.gender || 'Gender'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['male', 'female', 'other'] as const).map((g) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setGender(g)}
                          className={`py-2 text-xs font-bold rounded-xl border capitalize cursor-pointer transition-colors ${
                            gender === g
                              ? 'bg-emerald-600 border-emerald-700 text-white'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {g === 'male' ? (t.male || 'Male') : g === 'female' ? (t.female || 'Female') : (t.other || 'Other')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Code Input */}
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200/80">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Promo Code (e.g. EID2026, BARIJAO50)' : 'কুপন কোড (যেমন: EID2026, BARIJAO50)'}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold uppercase tracking-wider text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    {t.apply || 'Apply'}
                  </button>
                </div>
                {appliedPromo && (
                  <p className="text-[11px] font-bold text-emerald-700 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {lang === 'en' ? `Applied: ${appliedPromo} - Saved ৳${discount}!` : `প্রযোজ্য হয়েছে: ${appliedPromo} - ৳${discount} সাশ্রয়!`}
                  </p>
                )}
                {promoError && (
                  <p className="text-[11px] font-semibold text-red-600 mt-1">{promoError}</p>
                )}
              </div>

              {/* Payment Methods (bKash, Nagad, Rocket, Cards) */}
              <div className="space-y-3">
                <label className="block text-xs font-extrabold text-gray-900 uppercase tracking-wider">
                  {t.paymentMethod || 'Select Payment Method'}
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentMethod === 'bkash'
                        ? 'border-pink-500 bg-pink-50/70 ring-2 ring-pink-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-pink-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                      bK
                    </span>
                    <span className="text-xs font-bold text-gray-900">bKash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentMethod === 'nagad'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-orange-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                      ন
                    </span>
                    <span className="text-xs font-bold text-gray-900">Nagad</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('rocket')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentMethod === 'rocket'
                        ? 'border-purple-500 bg-purple-50/70 ring-2 ring-purple-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-extrabold text-[10px] flex items-center justify-center">
                      R
                    </span>
                    <span className="text-xs font-bold text-gray-900">Rocket</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      paymentMethod === 'card'
                        ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <CreditCard className="w-6 h-6 text-blue-600" />
                    <span className="text-xs font-bold text-gray-900">Cards / Bank</span>
                  </button>
                </div>
              </div>

              {/* Price Breakdown & Proceed */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Seats ({seatCount} × ৳{trip.fare}):</span>
                  <span className="font-semibold text-gray-900">৳{baseFare}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Service & Issuance Charge:</span>
                  <span className="font-semibold text-gray-900">৳{serviceCharge}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>Discount Voucher:</span>
                    <span>-৳{discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-emerald-800 pt-2 border-t border-gray-100">
                  <span>{t.totalPayable || 'Total Payable'}:</span>
                  <span>৳{netPayable}</span>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
                >
                  <span>{lang === 'en' ? `Proceed to Pay ৳${netPayable}` : `৳${netPayable} প্রদান করুন`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Interactive Gateway Simulation (bKash / Nagad / Cards) */}
          {paymentStep === 'gateway_sim' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center py-2">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-pink-100 text-pink-600 mb-2 font-black text-xl">
                  {paymentMethod === 'bkash' ? 'bKash' : paymentMethod === 'nagad' ? 'Nagad' : 'Pay'}
                </div>
                <h4 className="text-base font-extrabold text-gray-900">
                  {paymentMethod === 'bkash' ? 'bKash Merchant Payment' : 'Online Payment Gateway'}
                </h4>
                <p className="text-xs text-gray-500">
                  BariJao Merchant Account • Total: <strong className="text-emerald-700">৳{netPayable}</strong>
                </p>
              </div>

              {gatewaySubStep === 'number' && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700">
                        {lang === 'en' ? `Enter your ${paymentMethod.toUpperCase()} Account Number:` : `আপনার ${paymentMethod.toUpperCase()} অ্যাকাউন্ট নম্বর দিন:`}
                      </label>
                      <button
                        type="button"
                        onClick={() => setBkashNumber('01711000001')}
                        className="text-[10px] font-bold text-pink-600 hover:text-pink-800 transition-colors cursor-pointer"
                      >
                        ⚡ Demo: 01711000001
                      </button>
                    </div>
                    <input
                      type="tel"
                      value={bkashNumber}
                      onChange={(e) => setBkashNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-sm font-extrabold tracking-widest text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySubStep('otp')}
                    className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-xs"
                  >
                    {lang === 'en' ? 'Send Verification OTP' : 'ওটিপি কোড পাঠান'}
                  </button>
                </div>
              )}

              {gatewaySubStep === 'otp' && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'en' ? 'Enter 6-digit verification code sent to your phone:' : 'ফোনে পাঠানো ৬ ডিজিটের ওটিপি দিন:'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      value={bkashOtp}
                      onChange={(e) => setBkashOtp(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-base font-extrabold tracking-widest text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />

                    {/* Demo Transaction OTP Box */}
                    <div className="mt-3 p-3 bg-pink-50/80 border border-pink-200 rounded-xl text-left shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-pink-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
                          Demo Transaction OTP Generator
                        </span>
                        <span className="font-mono text-xs font-black text-pink-900 bg-pink-200/80 px-2 py-0.5 rounded shadow-xs">
                          123456
                        </span>
                      </div>
                      <p className="text-[11px] text-pink-800/80 mb-2">
                        Developer mode active: Click below to auto-fill the transaction code:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBkashOtp('123456');
                          setGatewaySubStep('pin');
                        }}
                        className="w-full py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
                      >
                        <span>⚡ Auto-Fill Demo OTP & Continue</span>
                        <span className="bg-pink-700/80 px-1.5 py-0.5 rounded font-mono text-[10px]">(123456)</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGatewaySubStep('pin')}
                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                  >
                    {lang === 'en' ? 'Verify Code Manually' : 'ম্যানুয়ালি যাচাই করুন'}
                  </button>
                </div>
              )}

              {gatewaySubStep === 'pin' && (
                <div className="space-y-4 max-w-sm mx-auto">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'en' ? 'Enter 5-digit PIN to confirm payment:' : 'পেমেন্ট নিশ্চিত করতে ৫ ডিজিটের পিন দিন:'}
                    </label>
                    <input
                      type="password"
                      maxLength={5}
                      placeholder="•••••"
                      value={bkashPin}
                      onChange={(e) => setBkashPin(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-extrabold tracking-widest text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-pink-500"
                    />

                    {/* Demo PIN Generator */}
                    <div className="mt-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-left shadow-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Demo Security PIN Generator
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-900 bg-emerald-200/80 px-2 py-0.5 rounded shadow-xs">
                          12345
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800/80 mb-2">
                        Simulated bKash/Nagad security PIN for client demonstration:
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setBkashPin('12345');
                          handleExecutePayment();
                        }}
                        className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-[1.01]"
                      >
                        <span>⚡ Auto-Fill PIN (12345) & Confirm Payment</span>
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleExecutePayment}
                    className="w-full py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{lang === 'en' ? `Confirm & Pay ৳${netPayable}` : `নিশ্চিত করুন ও ৳${netPayable} পরিশোধ করুন`}</span>
                  </button>
                </div>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentStep('details')}
                  className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
                >
                  {lang === 'en' ? 'Cancel & Return to Details' : 'বাতিল করে ব্যাকে যান'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Processing Animation */}
          {paymentStep === 'processing' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
              <h4 className="text-base font-extrabold text-gray-900">
                {lang === 'en' ? 'Processing Payment & Generating E-Ticket...' : 'পেমেন্ট প্রসেস হচ্ছে ও ই-টিকিট তৈরি হচ্ছে...'}
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                {lang === 'en' ? 'Please do not refresh or close this window.' : 'দয়া করে এই উইন্ডোটি রিফ্রেশ বা বন্ধ করবেন না।'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default CheckoutModal;
