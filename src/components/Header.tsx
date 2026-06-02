import { ShoppingCart, Heart, User, Key, Globe, DollarSign } from 'lucide-react';
import { Language, Currency, CartItem } from '../types';

interface HeaderProps {
  lang: Language;
  onSetLang: (lang: Language) => void;
  currency: Currency;
  onSetCurrency: (curr: Currency) => void;
  cart: CartItem[];
  wishlistCount: number;
  onOpenCart: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  onGoShop: () => void;
  currentUser: any;
  isAdmin: boolean;
  websiteName: string;
}

export default function Header(props: HeaderProps) {
  const isAr = props.lang === 'ar';

  return (
    <header id="global-header" className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Upper Navigation Meta Strip */}
      <div className="bg-amber-950 text-white py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <p className="opacity-90">
            {isAr 
              ? 'أهلاً بك في زعفنيرا للبهارات الفاخرة KSA' 
              : 'Welcome to ZafNira Premium Spice House, Riyadh'}
          </p>
          
          <div className="flex items-center gap-4">
            {/* Bilingual Switcher */}
            <button
              id="header-lang-switcher"
              onClick={() => props.onSetLang(props.lang === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 hover:text-amber-400 font-extrabold uppercase transition cursor-pointer"
            >
              <Globe className="w-3 h-3" />
              <span>{props.lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Currency Switcher */}
            <div className="flex items-center bg-amber-900 px-2 py-0.5 rounded gap-1">
              <button
                id="header-currency-sar"
                onClick={() => props.onSetCurrency('SAR')}
                className={`px-1.5 py-0.2 rounded font-black text-[10px] ${props.currency === 'SAR' ? 'bg-amber-500 text-white' : 'text-amber-200'}`}
              >
                SAR
              </button>
              <button
                id="header-currency-usd"
                onClick={() => props.onSetCurrency('USD')}
                className={`px-1.5 py-0.2 rounded font-black text-[10px] ${props.currency === 'USD' ? 'bg-amber-500 text-white' : 'text-amber-200'}`}
              >
                USD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
        {/* Brand Logo & Name */}
        <div 
          onClick={props.onGoHome}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 bg-amber-700 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-amber-700/20 group-hover:scale-105 transition duration-300">
            Z
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-amber-950 leading-none">
              {props.websiteName}
            </h1>
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-widest block mt-0.5">
              {isAr ? 'بهارات ومخاليط فاخرة' : 'Premium Spices & Blends'}
            </span>
          </div>
        </div>

        {/* Mid navigation links */}
        <nav id="header-nav-links" className="hidden md:flex gap-8 text-sm font-semibold text-gray-700">
          <button 
            onClick={props.onGoHome} 
            className="hover:text-amber-700 transition cursor-pointer py-2"
          >
            {isAr ? 'الرئيسية' : 'Home'}
          </button>
          <button 
            onClick={props.onGoShop} 
            className="hover:text-amber-700 transition cursor-pointer py-2"
          >
            {isAr ? 'تسوق البهارات' : 'Explore Spices'}
          </button>
        </nav>

        {/* Utility icons */}
        <div className="flex items-center gap-4">
          {/* Admin Backstage trigger */}
          {props.isAdmin && (
            <button
              id="header-admin-gateway"
              onClick={props.onOpenAdmin}
              className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100/80 rounded-full border border-amber-200/50 transition relative group cursor-pointer"
              title="Admin Panel"
            >
              <Key className="w-5 h-5" />
              <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-gray-950 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                Admin Panel
              </span>
            </button>
          )}

          {/* Account Profile Access */}
          <button
            id="header-account-trigger"
            onClick={props.onOpenAccount}
            className="p-2 text-gray-700 hover:text-amber-700 transition hover:bg-gray-50 rounded-full relative cursor-pointer"
            title="Customer Account"
          >
            {props.currentUser ? (
              <div className="w-6 h-6 rounded-full bg-amber-700 text-white font-black text-[10px] flex items-center justify-center uppercase">
                {props.currentUser.email.substring(0, 2)}
              </div>
            ) : (
              <User className="w-5 h-5" />
            )}
          </button>

          {/* Wishlist Indicator */}
          <button
            id="header-wishlist-trigger"
            onClick={props.onOpenAccount}
            className="p-2 text-gray-700 hover:text-amber-700 transition hover:bg-gray-50 rounded-full relative cursor-pointer"
            title="Wishlist Log"
          >
            <Heart className="w-5 h-5" />
            {props.wishlistCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                {props.wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            id="header-cart-trigger"
            onClick={props.onOpenCart}
            className="p-2 bg-amber-550 bg-amber-800 hover:bg-amber-900 text-white transition rounded-xl relative flex items-center gap-2 px-3 shadow-md shadow-amber-900/10 cursor-pointer"
            title="Shopping Cart"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="text-xs font-black hidden sm:inline">
              {props.cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
            {props.cart.length > 0 && (
              <span className="sm:hidden absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white">
                {props.cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
