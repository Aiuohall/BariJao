import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  Star, 
  ShieldCheck, 
  Clock, 
  Bus, 
  Train, 
  Ship, 
  Plane, 
  Repeat, 
  X, 
  Check, 
  Sparkles,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useTranslation } from '../TranslationContext';
import { apiService } from '../services/apiService';
import { Message } from '../types';

interface ChatBoxProps {
  recipientUser: {
    id: string;
    name: string;
    avatar_url?: string | null;
    rating?: number;
    rating_count?: number;
    role?: string;
    phone?: string;
  };
  ticketContext?: {
    id: string;
    operator_name?: string;
    transport_type?: string;
    from_location?: string;
    to_location?: string;
    asking_price?: number;
  } | null;
  onClose?: () => void;
  className?: string;
  isEmbedded?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  recipientUser,
  ticketContext,
  onClose,
  className = '',
  isEmbedded = false
}) => {
  const { user } = useAuth();
  const { lang, t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  const fetchThread = async () => {
    if (!user || !recipientUser?.id) return;
    try {
      const data = await apiService.getUserThread(recipientUser.id);
      setMessages(data || []);
      setError('');
    } catch (err: any) {
      console.error('Failed to load user thread:', err);
      // Fallback: if user thread endpoint had an issue, try fetching via ticket if available
      if (ticketContext?.id) {
        try {
          const ticketMsgs = await apiService.getMessages(ticketContext.id, recipientUser.id);
          setMessages(ticketMsgs || []);
        } catch (e2) {
          console.error(e2);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchThread();
    const interval = setInterval(fetchThread, 2500);
    return () => clearInterval(interval);
  }, [recipientUser.id, user?.id]);

  useEffect(() => {
    scrollToBottom(false);
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== undefined ? customText : newMessage).trim();
    if (!textToSend || sending || !user || !recipientUser?.id) return;

    setSending(true);
    setError('');

    // Optimistic UI update
    const tempId = 'temp-' + Date.now();
    const optimisticMsg: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: recipientUser.id,
      ticket_id: ticketContext?.id || null,
      message: textToSend,
      created_at: new Date().toISOString(),
      sender: { name: user.name, avatar_url: user.avatar_url }
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessage('');
    scrollToBottom();

    try {
      await apiService.sendMessage({
        receiver_id: recipientUser.id,
        message: textToSend,
        ticket_id: ticketContext?.id || null,
      });
      fetchThread();
    } catch (err: any) {
      console.error('Send error:', err);
      setError(err.message || 'Could not send message. Please try again.');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(textToSend);
    } finally {
      setSending(false);
    }
  };

  const getTransportIcon = (type?: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('bus')) return <Bus className="w-3.5 h-3.5 text-emerald-600" />;
    if (t.includes('train')) return <Train className="w-3.5 h-3.5 text-orange-600" />;
    if (t.includes('launch') || t.includes('ship')) return <Ship className="w-3.5 h-3.5 text-blue-600" />;
    if (t.includes('air') || t.includes('flight')) return <Plane className="w-3.5 h-3.5 text-sky-600" />;
    return <Repeat className="w-3.5 h-3.5 text-purple-600" />;
  };

  const icebreakers = [
    lang === 'en' ? '👋 Hi! Is your ticket still available?' : '👋 আসসালামু আলাইকুম! টিকিটটি কি এখনও এভেইলেবল আছে?',
    lang === 'en' ? 'Is the price negotiable?' : 'দাম কি কিছুটা কমানো সম্ভব?',
    lang === 'en' ? 'Which counter is the boarding point?' : 'বোর্ডিং পয়েন্ট কোন কাউন্টারে হবে?',
    lang === 'en' ? 'I want to purchase this ticket.' : 'আমি টিকিটটি কিনতে আগ্রহী।'
  ];

  return (
    <div className={`flex flex-col h-full bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/50 via-white to-teal-50/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            {recipientUser.avatar_url ? (
              <img 
                src={recipientUser.avatar_url} 
                alt={recipientUser.name} 
                className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-xs"
              />
            ) : (
              <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                {recipientUser.name ? recipientUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white"></span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base truncate">
                {recipientUser.name}
              </h3>
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Verified
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span>{recipientUser.rating ? Number(recipientUser.rating).toFixed(1) : '5.0'}</span>
              </div>
              <span>•</span>
              <span className="text-[11px] text-emerald-700 font-semibold">Active now</span>
            </div>
          </div>
        </div>

        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Ticket Context Banner (if conversation is related to a ticket) */}
      {ticketContext && (
        <div className="bg-purple-50/80 border-b border-purple-100 px-4 py-2.5 flex items-center justify-between text-xs text-purple-900">
          <div className="flex items-center gap-2 truncate">
            {getTransportIcon(ticketContext.transport_type)}
            <span className="font-bold truncate">{ticketContext.operator_name || 'Travel Ticket'}</span>
            <span className="text-purple-400">·</span>
            <span className="text-purple-700 font-medium truncate">
              {ticketContext.from_location} → {ticketContext.to_location}
            </span>
          </div>
          {ticketContext.asking_price && (
            <span className="font-black text-purple-900 bg-white/80 px-2 py-0.5 rounded-md border border-purple-200 shrink-0 ml-2">
              ৳{ticketContext.asking_price}
            </span>
          )}
        </div>
      )}

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60">
        {loading && messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2 py-12">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">{lang === 'en' ? 'Loading chat history...' : 'চ্যাট লোড হচ্ছে...'}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 my-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <p className="font-extrabold text-gray-800 text-sm">
                {lang === 'en' ? `Direct chat with ${recipientUser.name}` : `${recipientUser.name}-এর সাথে সরাসরি চ্যাট`}
              </p>
              <p className="text-xs text-gray-500 mt-1 max-w-xs">
                {lang === 'en'
                  ? 'Send a message to coordinate ticket transfer, discuss travel times, or negotiate pricing.'
                  : 'টিকিট সংগ্রহ, যাত্রার সময় বা দাম আলোচনা করতে সরাসরি মেসেজ পাঠান।'}
              </p>
            </div>

            {/* Quick icebreakers */}
            <div className="w-full max-w-sm space-y-2 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {lang === 'en' ? 'Quick Starters' : 'দ্রুত শুরু করুন'}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {icebreakers.map((prompt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(undefined, prompt)}
                    className="text-left text-xs bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-gray-700 py-2 px-3 rounded-xl border border-gray-200/80 transition-all shadow-2xs"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div 
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in duration-150`}
              >
                <div className="flex items-end gap-2 max-w-[85%] sm:max-w-[75%]">
                  {!isMe && (
                    <div className="shrink-0 mb-1">
                      {recipientUser.avatar_url ? (
                        <img 
                          src={recipientUser.avatar_url} 
                          alt={recipientUser.name} 
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-300 text-gray-700 text-[10px] font-bold flex items-center justify-center">
                          {recipientUser.name ? recipientUser.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <div
                      className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-2xs break-words ${
                        isMe
                          ? 'bg-emerald-600 text-white rounded-br-xs font-medium'
                          : 'bg-white text-gray-800 border border-gray-100 rounded-bl-xs'
                      }`}
                    >
                      {msg.message}
                    </div>

                    <div className={`flex items-center gap-1 mt-1 text-[10px] text-gray-400 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <span>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && <Check className="w-3 h-3 text-emerald-500" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-xs border-t border-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="font-bold hover:underline">Dismiss</button>
        </div>
      )}

      {/* Input Bar */}
      <form onSubmit={(e) => handleSendMessage(e)} className="p-3 sm:p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={lang === 'en' ? `Type a message to ${recipientUser.name}...` : `${recipientUser.name}-কে মেসেজ লিখুন...`}
            maxLength={500}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className={`p-3 rounded-2xl text-white font-bold flex items-center justify-center transition-all ${
              !newMessage.trim() || sending
                ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 cursor-pointer'
            }`}
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex justify-between items-center mt-1 px-2 text-[10px] text-gray-400">
          <span>{lang === 'en' ? 'Press Enter to send' : 'মেসেজ পাঠাতে Enter চাপুন'}</span>
          <span>{newMessage.length}/500</span>
        </div>
      </form>
    </div>
  );
};
export default ChatBox;
