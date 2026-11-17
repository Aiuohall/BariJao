import React from 'react';
import { ShieldCheck, Repeat, Zap, Headphones, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../TranslationContext';

export const WhyBariJaoSection: React.FC = () => {
  const { lang } = useTranslation();

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-emerald-600" />,
      title: lang === 'en' ? 'Direct Official E-Tickets' : 'সরাসরি অফিসিয়াল ই-টিকিট',
      desc: lang === 'en'
        ? 'Book official seats on top Bus, Train, Launch and Flight operators across Bangladesh at counter rates.'
        : 'বাংলাদেশের শীর্ষ বাস, ট্রেন, লঞ্চ ও ফ্লাইট অপারেটরদের অফিসিয়াল সিট সরাসরি কাউন্টার রেটে বুক করুন।'
    },
    {
      icon: <Repeat className="w-6 h-6 text-purple-600" />,
      title: lang === 'en' ? 'Safe P2P Resale & Eid Swaps' : 'নিরাপদ পি২পি রিসেল ও ঈদ টিকিট বিনিময়',
      desc: lang === 'en'
        ? 'Can’t travel? Resell your spare tickets safely without Facebook scams. Verified buyers & sellers.'
        : 'ভ্রমণ বাতিল হলে অতিরিক্ত টিকিট ফেসবুকের দালাল ও প্রতারক ছাড়াই ন্যায্য মূল্যে সহযাত্রীর কাছে হস্তান্তর করুন।'
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-teal-600" />,
      title: lang === 'en' ? 'Privacy-First Architecture' : 'নিরাপদ প্রাইভেসি সুরক্ষা',
      desc: lang === 'en'
        ? 'Seat numbers and ticket copy are protected until purchase is confirmed to prevent duplicate fraud.'
        : 'টিকিট জালিয়াতি ও ডুপ্লিকেট রোধে কেনার আগে সিট নম্বর ও টিকিটের সংবেদনশীল অংশ সুরক্ষিত থাকে।'
    },
    {
      icon: <Headphones className="w-6 h-6 text-blue-600" />,
      title: lang === 'en' ? 'Instant bKash & 24/7 Helpline' : 'বিকাশ পেমেন্ট ও সার্বক্ষণিক সাপোর্ট',
      desc: lang === 'en'
        ? 'Seamless bKash, Nagad, Rocket checkout with instant SMS voucher and dedicated hotline support.'
        : 'বিকাশ, নগদ, রকেটে সহজ পেমেন্ট, তাত্ক্ষণিক এসএমএস ভাউচার ও সার্বক্ষণিক কাস্টমার কেয়ার।'
    }
  ];

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs font-black text-emerald-600 uppercase tracking-wider block mb-1">
          {lang === 'en' ? 'WHY BARIJAO' : 'কেন বাড়িযাও'}
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
          {lang === 'en' ? 'The Smarter Way to Travel in Bangladesh' : 'বাংলাদেশে ভ্রমণের আধুনিক ও নিরাপদ মাধ্যম'}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mt-2">
          {lang === 'en'
            ? 'We combined direct e-ticketing with safe community ticket exchange to solve Eid and rush travel challenges once and for all.'
            : 'অফিসিয়াল ই-টিকিট বুকিং এবং কমিউনিটি টিকিট এক্সচেঞ্জের সমন্বয়ে দেশের ঈদ ও উৎসবের ভ্রমণ সংকট নিরসনে আমরা অঙ্গীকারবদ্ধ।'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs hover:border-emerald-300 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
              {f.icon}
            </div>
            <h3 className="text-sm font-extrabold text-gray-900 mb-2">{f.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
export default WhyBariJaoSection;
