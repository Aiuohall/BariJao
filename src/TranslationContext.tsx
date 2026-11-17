import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'bn';

interface TranslationContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: any;
}

const translations = {
  en: {
    home: 'Home',
    buyTickets: 'Buy Tickets',
    officialTickets: 'Official E-Tickets',
    resaleMarket: 'Resale Marketplace',
    sell: 'Sell Ticket',
    dashboard: 'Dashboard',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    appName: 'BariJao',
    searchTitle: 'Book Official Tickets & Safe Resale Across Bangladesh',
    searchSub: 'Direct tickets from top operators plus Bangladesh\'s only verified peer-to-peer ticket exchange.',
    from: 'From',
    to: 'To',
    date: 'Date of Journey',
    searchBtn: 'Search Tickets',
    viewDetails: 'View Details',
    noTickets: 'No tickets found matching your criteria.',
    sellTitle: 'List Your Ticket for Resale',
    sellSub: 'Fill in the details to safely resell your spare travel ticket.',
    transportType: 'Transport Type',
    bus: 'Bus',
    train: 'Train',
    launch: 'Launch',
    flight: 'Flight',
    operator: 'Operator Name',
    journeyDate: 'Journey Date',
    seat: 'Seat Number',
    originalPrice: 'Original Price',
    askingPrice: 'Asking Price',
    purchaseDate: 'Purchase Date',
    uploadImage: 'Upload Ticket Image',
    submitListing: 'Post Listing',
    chat: 'Chat with Seller',
    requestTicket: 'Request Ticket',
    negotiating: 'Negotiating',
    paymentSent: 'Payment Sent',
    ticketDelivered: 'Ticket Delivered',
    completed: 'Completed',
    report: 'Report User',
    messages: 'Messages',
    checkPnr: 'Check Ticket / PNR',
    viewSeats: 'View Seats',
    hideSeats: 'Hide Seats',
    availableSeats: 'Seats Available',
    fare: 'Fare',
    duration: 'Duration',
    departure: 'Departure',
    arrival: 'Arrival',
    boardingPoint: 'Boarding Point',
    droppingPoint: 'Dropping Point',
    selectedSeats: 'Selected Seats',
    continueBooking: 'Proceed to Passenger Info',
    passengerDetails: 'Passenger Information',
    fullName: 'Full Name',
    phoneNumber: 'Mobile Number',
    emailAddress: 'Email Address',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    confirmAndPay: 'Pay & Confirm E-Ticket',
    paymentMethod: 'Select Payment Method',
    discountCode: 'Promo / Coupon Code',
    apply: 'Apply',
    totalPayable: 'Total Payable',
    pnrLabel: 'PNR / Booking ID',
    downloadTicket: 'Download Ticket Voucher',
    printTicket: 'Print E-Ticket',
    secondHandBadge: 'Verified P2P Resale'
  },
  bn: {
    home: 'হোম',
    buyTickets: 'টিকিট কিনুন',
    officialTickets: 'অফিসিয়াল ই-টিকিট',
    resaleMarket: 'রিসেল মার্কেটপ্লেস',
    sell: 'টিকিট বিক্রি',
    dashboard: 'ড্যাশবোর্ড',
    admin: 'অ্যাডমিন',
    login: 'লগইন',
    logout: 'লগআউট',
    appName: 'বাড়িযাও',
    searchTitle: 'অনলাইনে কাটুন অফিসিয়াল ই-টিকিট অথবা নিরাপদ রিসেল টিকিট',
    searchSub: 'বাংলাদেশের শীর্ষ অপারেটরদের সরাসরি টিকিট এবং দেশের একমাত্র বিশ্বস্ত পিয়ার-টু-পিয়ার টিকিট বিনিময়।',
    from: 'কোথা থেকে',
    to: 'কোথায়',
    date: 'যাত্রার তারিখ',
    searchBtn: 'টিকিট খুঁজুন',
    viewDetails: 'বিস্তারিত দেখুন',
    noTickets: 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো টিকিট পাওয়া যায়নি।',
    sellTitle: 'টিকিট রিসেল করুন',
    sellSub: 'আপনার অতিরিক্ত বা অব্যবহৃত ভ্রমণ টিকিটটি নিরাপদে বিক্রি করতে বিবরণ দিন।',
    transportType: 'পরিবহনের ধরন',
    bus: 'বাস',
    train: 'ট্রেন',
    launch: 'লঞ্চ',
    flight: 'ফ্লাইট',
    operator: 'অপারেটরের নাম',
    journeyDate: 'ভ্রমণের তারিখ',
    seat: 'সিট নম্বর',
    originalPrice: 'আসল দাম',
    askingPrice: 'বিক্রয় মূল্য',
    purchaseDate: 'কেনার তারিখ',
    uploadImage: 'টিকিটের ছবি আপলোড করুন',
    submitListing: 'লিস্টিং পোস্ট করুন',
    chat: 'বিক্রেতার সাথে চ্যাট করুন',
    requestTicket: 'টিকিট অনুরোধ করুন',
    negotiating: 'আলোচনা চলছে',
    paymentSent: 'পেমেন্ট পাঠানো হয়েছে',
    ticketDelivered: 'টিকিট ডেলিভারি হয়েছে',
    completed: 'সম্পন্ন',
    report: 'রিপোর্ট করুন',
    messages: 'মেসেজ',
    checkPnr: 'টিকিট / পিএনআর যাচাই',
    viewSeats: 'সিট দেখুন',
    hideSeats: 'সিট লুকান',
    availableSeats: 'সিট খালি আছে',
    fare: 'ভাড়া',
    duration: 'সময়',
    departure: 'রওয়ানা',
    arrival: 'পৌঁছাবে',
    boardingPoint: 'বোর্ডিং পয়েন্ট',
    droppingPoint: 'ড্রপিং পয়েন্ট',
    selectedSeats: 'নির্বাচিত সিট',
    continueBooking: 'যাত্রীর তথ্যে এগিয়ে যান',
    passengerDetails: 'যাত্রীর তথ্যাবলী',
    fullName: 'পুরো নাম',
    phoneNumber: 'মোবাইল নম্বর',
    emailAddress: 'ইমেইল ঠিকানা',
    gender: 'লিঙ্গ',
    male: 'পুরুষ',
    female: 'মহিলা',
    other: 'অন্যান্য',
    confirmAndPay: 'পেমেন্ট করুন ও নিশ্চিত হন',
    paymentMethod: 'পেমেন্ট মাধ্যম বেছে নিন',
    discountCode: 'ডিসকাউন্ট কুপন কোড',
    apply: 'প্রয়োগ করুন',
    totalPayable: 'মোট প্রদেয়',
    pnrLabel: 'পিএনআর / বুকিং আইডি',
    downloadTicket: 'টিকিট ভাউচার ডাউনলোড',
    printTicket: 'ই-টিকিট প্রিন্ট করুন',
    secondHandBadge: 'ভেরিফায়েড পি২পি রিসেল'
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const t = translations[lang];

  return (
    <TranslationContext.Provider value={{ lang, setLang, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}
