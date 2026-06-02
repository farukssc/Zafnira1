import React, { useState, useEffect } from 'react';
import { X, Gift, Mail, Bell, CheckCircle } from 'lucide-react';
import { PopupConfig, Language } from '../types';

interface SpecialOfferPopupProps {
  popup: PopupConfig | null;
  lang: Language;
}

export default function SpecialOfferPopup(props: SpecialOfferPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const isAr = props.lang === 'ar';

  useEffect(() => {
    if (!props.popup || !props.popup.isActive) {
      setIsOpen(false);
      return;
    }

    // Check localStorage to avoid showing the same popup repeatedly on every single click
    const dismissedTime = localStorage.getItem(`dismissed-popup-${props.popup.id}`);
    if (dismissedTime) {
      // Show again if it's been more than 24 hours
      const diff = Date.now() - parseInt(dismissedTime);
      if (diff < 24 * 60 * 60 * 1000) {
        setIsOpen(false);
        return;
      }
    }

    // Trigger delay of 2.5 seconds on load
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 2500);

    // Exit intent trigger
    const exitIntentHandler = (e: MouseEvent) => {
      if (e.clientY < 30) {
        setIsOpen(true);
      }
    };
    document.addEventListener('mouseleave', exitIntentHandler);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', exitIntentHandler);
    };
  }, [props.popup]);

  if (!props.popup || !isOpen) return null;

  const handleClose = () => {
    setIsOpen(false);
    if (props.popup) {
      localStorage.setItem(`dismissed-popup-${props.popup.id}`, Date.now().toString());
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setEmailSubscribed(true);
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="promotional-popup-container" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div 
        id="promotional-popup-window"
        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-lg w-full flex flex-col border-4 border-amber-600 animate-in fade-in zoom-in duration-300"
      >
        {/* Close Button */}
        <button
          id="promotional-popup-close"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full transition-all duration-200 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top visual image */}
        {props.popup.imageUrl && (
          <div className="h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${props.popup.imageUrl})` }}>
            <div className="w-full h-full bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
              <span className="text-white text-xs font-bold uppercase tracking-wider bg-red-600 px-2.5 py-1 rounded">
                {isAr ? 'عرض حصري طازج' : 'Fresh Exclusive Pack'}
              </span>
            </div>
          </div>
        )}

        {/* Content detail */}
        <div className="p-6 md:p-8 flex-1 text-center">
          <div className="flex justify-center mb-3">
            {props.popup.type === 'coupon' && (
              <div className="p-3 bg-red-50 text-red-600 rounded-full border border-red-100 animate-bounce">
                <Gift className="w-8 h-8" />
              </div>
            )}
            {props.popup.type === 'newsletter' && (
              <div className="p-3 bg-green-50 text-green-600 rounded-full border border-green-100">
                <Mail className="w-8 h-8" />
              </div>
            )}
            {props.popup.type === 'announcement' && (
              <div className="p-3 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                <Bell className="w-8 h-8" />
              </div>
            )}
          </div>

          <h3 className="text-2xl font-black text-amber-950 tracking-tight leading-snug">
            {isAr ? props.popup.titleAr : props.popup.titleEn}
          </h3>

          <p className="text-gray-600 text-sm mt-3 leading-relaxed">
            {isAr ? props.popup.contentAr : props.popup.contentEn}
          </p>

          {/* Conditional Sub-features based on type */}
          {props.popup.type === 'coupon' && props.popup.couponId && (
            <div className="mt-6 bg-red-50 border border-red-200 p-4 rounded-xl flex flex-col items-center">
              <p className="text-xs uppercase font-extrabold text-red-700 tracking-wider">
                {isAr ? 'كود الخصم الحصري' : 'Exclusive Promo Code'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-xl font-black text-amber-950 bg-white border border-dashed border-amber-600 px-4 py-2 rounded-lg tracking-widest shadow-inner">
                  {props.popup.couponId}
                </span>
                <button
                  id="pomotional-popup-copy-code"
                  onClick={() => handleCopyCode(props.popup?.couponId || '')}
                  className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
                >
                  {copied ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ الكود' : 'Copy Code')}
                </button>
              </div>
            </div>
          )}

          {props.popup.type === 'newsletter' && (
            <div className="mt-6">
              {emailSubscribed ? (
                <div id="promotional-popup-success" className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-xl flex items-center justify-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">
                    {isAr ? 'شكراً لاشتراكك في نشرتنا العربية!' : 'Success! Thank you for subscribing.'}
                  </span>
                </div>
              ) : (
                <form id="promotional-popup-form" onSubmit={handleNewsletterSubmit} className="flex gap-2 max-w-sm mx-auto">
                  <input
                    type="email"
                    required
                    placeholder={isAr ? 'بريدك الإلكتروني الطازج' : 'Your fresh email address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
                  />
                  <button
                    id="promotional-popup-submit"
                    type="submit"
                    className="bg-green-700 hover:bg-green-800 text-white font-bold text-sm px-5 py-2 rounded-lg cursor-pointer transition-colors whitespace-nowrap"
                  >
                    {isAr ? 'اشترك' : 'Subscribe'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Bottom Call to Action */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-3">
            <button
              id="promotional-popup-dismiss-action"
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-800 text-xs font-semibold cursor-pointer py-1.5 px-3 rounded hover:bg-gray-100"
            >
              {isAr ? 'تخطي هذا العرض' : 'Dismiss Offer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
