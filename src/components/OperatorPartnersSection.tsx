import React from 'react';
import { ShieldCheck, Award } from 'lucide-react';
import { useTranslation } from '../TranslationContext';

export const OperatorPartnersSection: React.FC = () => {
  const { lang } = useTranslation();

  const partners = [
    { name: 'Green Line Paribahan', type: 'Bus', desc: 'Scania Multi-Axle Luxury AC' },
    { name: 'Hanif Enterprise', type: 'Bus', desc: 'Largest Fleet Across Bangladesh' },
    { name: 'Shohagh Paribahan', type: 'Bus', desc: 'Pioneer Luxury Coach Operator' },
    { name: 'Shyamoli NR Travels', type: 'Bus', desc: 'Volvo B9R Express Routes' },
    { name: 'Desh Travels', type: 'Bus', desc: 'Hyundai Universe Executive' },
    { name: 'Saintmartin Paribahan', type: 'Bus', desc: 'Royal Sleeper Coaches' },
    { name: 'Bangladesh Railway', type: 'Train', desc: 'Intercity Express & Subarna' },
    { name: 'MV Manami', type: 'Launch', desc: 'Luxury Sadarghat - Barishal' },
    { name: 'MV Sundarban', type: 'Launch', desc: 'State-of-the-Art River Vessels' },
    { name: 'Biman Bangladesh', type: 'Flight', desc: 'National Flag Carrier' },
    { name: 'US-Bangla Airlines', type: 'Flight', desc: 'Leading Domestic Aviation' },
    { name: 'London Express', type: 'Bus', desc: 'Executive MAN Sleeper Coach' }
  ];

  return (
    <div className="bg-slate-50 py-16 border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-3">
            <Award className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'en' ? 'Verified Transport Network' : 'যাচাইকৃত পরিবহন নেটওয়ার্ক'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {lang === 'en' ? 'Authorized Operator Partners' : 'অনুমোদিত অপারেটর পার্টনারসমূহ'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            {lang === 'en'
              ? 'Tickets issued directly from the official reservation systems of Bangladesh’s premier transport services.'
              : 'বাংলাদেশের শীর্ষ পরিবহন সংস্থাগুলোর অফিসিয়াল রিজার্ভেশন সিস্টেম থেকে সরাসরি নিশ্চিত ই-টিকিট।'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {partners.map((p, idx) => (
            <div
              key={idx}
              className="bg-white p-4 rounded-2xl border border-gray-200/80 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all text-center flex flex-col items-center justify-center group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-50 to-teal-50 text-emerald-800 flex items-center justify-center font-black text-sm mb-2 group-hover:scale-110 transition-transform">
                {p.name.charAt(0)}
              </div>
              <h4 className="text-xs font-black text-gray-900 leading-tight group-hover:text-emerald-700 transition-colors">
                {p.name}
              </h4>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1">
                {p.type}
              </span>
              <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default OperatorPartnersSection;
