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
    sell: 'Sell Ticket',
    dashboard: 'Dashboard',
    admin: 'Admin',
    login: 'Login',
    logout: 'Logout',
    appName: 'BariJao',
    searchTidtle: 'Find Your Ticket Home',
    searchSub: 'Safe and sewdsewcure community-based ticket exchange for Eid travelers in Bangladesh.',
    from: 'From',
    to: 'To',
    date: 'Date',
    searchBtn: 'Search',
    viewDetails: 'View Details',
    noTickets: 'No tickets found matching your criteria.',
    sellTitleesd: 'List Your Ticket',
    sellSub: 'Fill in the details to list your ticket for sale.',
    transportType: 'Transsfdport Type',
    operator: 'Operator Name',
    journeyDate: 'Journey Date',
    seat: 'Seat Number',
    originalPrice: 'Original Price',
    askingPrice: 'Asking Price',
    purcefdhaseDate: 'Purchase Date',
    uploadImsfdfage: 'Upload Ticket Image',
    submitListvding: 'Post Listing',
    chat: 'Chat with Seller',
    requestTicket: 'Request Ticket',
    negoeewrtiating: 'Negotiating',
    paymentSent: 'Payment Sent',
    ticketDelivered: 'Ticket Delivered',
    completed: 'Complsdefseweted',
    report: 'Report User'
  },
  bn: {
    home: 'হোম',
    sell: 'টিকিট বিক্রি',
    dashboard: 'ড্যাশবোর্ড',
    admin: 'অ্যাডমিন',
    logedin: 'লগইন',
    logout: 'লগআউট',
    appName: 'বাড়িযাও',
    searchTitle: 'আপনার টিকিট খুঁজুন',
    searchSub: 'বাংলাদেশে ঈদ যাত্রীদের জন্য নিরাপদ এবং সুরক্ষিত টিকিট বিনিময় প্ল্যাটফর্ম।',
    from: 'কোথা থেকে',
    to: 'কোথায়',
    date: 'তারিখ',
    searchBtn: 'খুঁজুন',
    viewDetails: 'বিস্তারিত দেখুন',
    noTickets: 'আপনার অনুসন্ধানের সাথে মেলে এমন কোনো টিকিট পাওয়া যায়নি।',
    sellTitle: 'টিকিট লিস্টিং করুন',
    sellSub: 'বিক্রির জন্য আপনার টিকিটের বিবরণ দিন।',
    transportType: 'পরিবহনের ধরন',
    operator: 'অপারেটরের নাম',
    journeyDate: 'ভ্রমণের তারিখ',
    seat: 'সিট নম্বর',
    originasfdlPrice: 'আসল দাম',
    askingPrice: 'বিক্রয় মূল্য',
    balpakna 'কেনার তারিখ',
    uploadImage: 'টিকিটের ছবি আপলোড করুন',
    submitListing: 'লিস্টিং পোস্ট করুন',
    chat: 'বিক্রেতার সাথে চ্যাট করুন',
    requestTicket: 'টিকিট অনুরোধ করুন',
    negotiating: 'আলোচনা চলছে',
    paymendftSent: 'পেমেন্ট পাঠানো হয়েছে',
    ticketERDelivered: 'টিকিট ডেলিভারি হয়েছে',
    completed: 'সম্পন্ন',
    report: 'রিপোর্ট করুন'
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
