import React, { useState, useEffect } from 'react';
import { 
  Plus, Minus, Trash2, Heart, Star, CheckCircle, Search, Filter, 
  ChevronRight, ChevronLeft, Phone, Mail, MapPin, ShieldCheck, ShoppingBag, ArrowRight,
  Info, Sparkles, Smile, MessageSquare, Tag, HelpCircle, Globe
} from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { 
  Language, Currency, Product, Category, CartItem, Order, Coupon, PopupConfig, 
  CMSGlobalSettings, CMSPagesContent, HomeSection, HeroSlide, OrderStatus, 
  CouponDiscountType, PopupType 
} from './types';
import { 
  defaultGlobalSettings, defaultHomeSections, defaultHeroSlides, defaultPagesContent, 
  defaultCategories, defaultProducts, defaultCoupons, defaultPopups 
} from './lib/cmsDefault';
import Header from './components/Header';
import WhatsAppChat from './components/WhatsAppChat';
import SpecialOfferPopup from './components/SpecialOfferPopup';
import AdminPanel from './components/AdminPanel';

export default function App() {
  // Locale & Configs
  const [lang, setLang] = useState<Language>('en');
  const [currency, setCurrency] = useState<Currency>('SAR');

  // Page Navigation State
  const [view, setView] = useState<'home' | 'shop' | 'product-details' | 'cart' | 'checkout' | 'account' | 'admin'>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Core Arrays fetched from DB
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [coupons, setCoupons] = useState<Coupon[]>(defaultCoupons);
  const [popups, setPopups] = useState<PopupConfig[]>(defaultPopups);
  const [orders, setOrders] = useState<Order[]>([]);

  // CMS dynamic objects
  const [globalSettings, setGlobalSettings] = useState<CMSGlobalSettings>(defaultGlobalSettings);
  const [pagesContent, setPagesContent] = useState<CMSPagesContent>(defaultPagesContent);
  const [homeSections, setHomeSections] = useState<HomeSection[]>(defaultHomeSections);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(defaultHeroSlides);

  // States
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Auth States
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Manual auth mock helpers for fallback preview
  const [manualEmail, setManualEmail] = useState('');
  const [manualName, setManualName] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(100);

  // active product detail configurations
  const [detailVariantIndex, setDetailVariantIndex] = useState<number>(0);
  const [detailQuantity, setDetailQuantity] = useState<number>(1);
  const [currentProductImageIdx, setCurrentProductImageIdx] = useState<number>(0);

  // coupon applying in cart
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Checkout address states
  const [shippingStreet, setShippingStreet] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingZip, setShippingZip] = useState('');
  const [shippingName, setShippingName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingPayment, setShippingPayment] = useState<'cod' | 'card' | 'bank'>('cod');
  const [cardNo, setCardNo] = useState('');
  const [cardExp, setCardExp] = useState('');

  // Saffron timer slide
  const [heroIdx, setHeroIdx] = useState(0);

  const isAr = lang === 'ar';

  // Firestore Error Handler Wrapper (as specified by skill guidelines)
  const handleFirestoreError = (err: unknown, op: string, path: string) => {
    const errInfo = {
      error: err instanceof Error ? err.message : String(err),
      operationType: op,
      path,
      authInfo: {
        userId: auth?.currentUser?.uid || 'anonymous',
        email: auth?.currentUser?.email || 'none'
      }
    };
    console.warn('Firestore Operation Warn: ', JSON.stringify(errInfo));
  };

  // 1. Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        const emailLower = u.email?.toLowerCase();
        if (emailLower === 'farukbangla53@gmail.com') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
    });
    return unsub;
  }, []);

  // 2. Load and Auto-seed database once on startup
  useEffect(() => {
    bootstrapConfigAndResources();
  }, []);

  const bootstrapConfigAndResources = async () => {
    setLoading(true);
    try {
      // Check if config documents exist in Firestore, otherwise auto-seed default configs
      const cmsSnap = await getDocs(collection(db, 'cms_config'));
      if (cmsSnap.empty) {
        // Database is empty! Auto seed default configs & seed resources
        await setDoc(doc(db, 'cms_config', 'global_settings'), defaultGlobalSettings);
        await setDoc(doc(db, 'cms_config', 'pages'), defaultPagesContent);
        await setDoc(doc(db, 'cms_config', 'home_sections'), { sections: defaultHomeSections });
        await setDoc(doc(db, 'cms_config', 'hero_slides'), { slides: defaultHeroSlides });

        // Seed products
        for (const p of defaultProducts) {
          await setDoc(doc(db, 'products', p.id), p);
        }
        // Seed categories
        for (const c of defaultCategories) {
          await setDoc(doc(db, 'categories', c.id), c);
        }
        // Seed coupons
        for (const cp of defaultCoupons) {
          await setDoc(doc(db, 'coupons', cp.id), cp);
        }
        // Seed popups
        for (const pop of defaultPopups) {
          await setDoc(doc(db, 'popups', pop.id), pop);
        }
        console.log('Spices Data bootstrapped successfully inside Firestore!');
      }

      // Fetch active resources safely
      const pSnap = await getDocs(collection(db, 'products'));
      const pList: Product[] = [];
      pSnap.forEach(d => pList.push(d.data() as Product));
      if (pList.length > 0) setProducts(pList);

      const cSnap = await getDocs(collection(db, 'categories'));
      const cList: Category[] = [];
      cSnap.forEach(d => cList.push(d.data() as Category));
      if (cList.length > 0) setCategories(cList);

      const coupSnap = await getDocs(collection(db, 'coupons'));
      const coupList: Coupon[] = [];
      coupSnap.forEach(d => coupList.push(d.data() as Coupon));
      if (coupList.length > 0) setCoupons(coupList);

      const popSnap = await getDocs(collection(db, 'popups'));
      const popList: PopupConfig[] = [];
      popSnap.forEach(d => popList.push(d.data() as PopupConfig));
      if (popList.length > 0) setPopups(popList);

      // fetch configs
      const finalCmsSnap = await getDocs(collection(db, 'cms_config'));
      finalCmsSnap.forEach(docSnap => {
        const id = docSnap.id;
        const d = docSnap.data();
        if (id === 'global_settings') setGlobalSettings(d as CMSGlobalSettings);
        if (id === 'pages') setPagesContent(d as CMSPagesContent);
        if (id === 'home_sections') setHomeSections(d.sections || []);
        if (id === 'hero_slides') setHeroSlides(d.slides || []);
      });

    } catch (e) {
      handleFirestoreError(e, 'INITIAL_SEED', 'cms_config');
    } finally {
      setLoading(false);
    }
  };

  // Convert prices helper
  const getConvertedPrice = (sarAmount: number) => {
    if (currency === 'USD') {
      return `$ ${(sarAmount * globalSettings.usdExchangeRate).toFixed(2)}`;
    }
    return `${sarAmount.toFixed(2)} ${isAr ? 'ريال' : 'SAR'}`;
  };

  const showNotification = (text: string, isErr = false) => {
    setMsg({ text, error: isErr });
    setTimeout(() => {
      setMsg(null);
    }, 4000);
  };

  // Auth triggers
  const triggerGoogleLogin = async () => {
    try {
      const p = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, p);
      showNotification(`Welcome back, ${res.user.displayName}!`);
      setShowAuthModal(false);
    } catch (err: any) {
      showNotification('Google Sign-in failed. Please login with mock testing profile below.', true);
    }
  };

  const loginManualMock = (email: string) => {
    if (!email) return;
    const mockU = {
      uid: email === 'farukbangla53@gmail.com' ? 'admin-112233' : 'user-mock-' + Date.now().toString().substring(8),
      email: email,
      displayName: manualName || (email === 'farukbangla53@gmail.com' ? 'ZafNira Admin' : 'Spice Lover')
    };
    setUser(mockU);
    if (email.toLowerCase() === 'farukbangla53@gmail.com') {
      setIsAdmin(true);
      showNotification('Admin panel authorization unlocked!');
    } else {
      setIsAdmin(false);
      showNotification(`Logged in as ${mockU.displayName}!`);
    }
    setShowAuthModal(false);
  };

  const triggerSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    setCart([]);
    setWishlist([]);
    showNotification('Success signed out.');
  };

  // Product Add to Cart Action
  const addToCartAction = (prod: Product, varIdx = -1, qty = 1) => {
    // Check if item already exists in cart with same variant
    const existingIdx = cart.findIndex(c => c.product.id === prod.id && c.variantIndex === varIdx);
    if (existingIdx > -1) {
      const copy = [...cart];
      copy[existingIdx].quantity += qty;
      setCart(copy);
    } else {
      setCart([...cart, { product: prod, variantIndex: varIdx, quantity: qty }]);
    }
    showNotification(isAr ? 'تم إضافة البهارات بنجاح إلى السلة!' : 'Spice added successfully to shopping cart!');
  };

  const updateCartQty = (idx: number, delta: number) => {
    const copy = [...cart];
    copy[idx].quantity += delta;
    if (copy[idx].quantity <= 0) {
      copy.splice(idx, 1);
    }
    setCart(copy);
  };

  const removeFromCart = (idx: number) => {
    const copy = [...cart];
    copy.splice(idx, 1);
    setCart(copy);
  };

  // Wishlist controls
  const toggleWishlist = (id: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter(x => x !== id));
      showNotification(isAr ? 'تمت إزالة المنتج من المفضلة' : 'Removed from wishlist.');
    } else {
      setWishlist([...wishlist, id]);
      showNotification(isAr ? 'تم حفظ المنتج في المفضلة' : 'Saved to wishlist!');
    }
  };

  // Coupon Verification Handler
  const handleApplyCouponCode = () => {
    if (!couponCode) return;
    const found = coupons.find(c => c.code.toUpperCase() === couponCode.toUpperCase());
    if (!found) {
      showNotification(isAr ? 'كود الكوبون غير صحيح أو منتهي الصلاحية' : 'Coupon code is invalid or expired.', true);
      setAppliedCoupon(null);
      return;
    }
    // Calculate total cart value
    const cartSub = cart.reduce((sum, item) => {
      const price = item.variantIndex > -1 ? item.product.variants[item.variantIndex].priceSAR : item.product.priceSAR;
      return sum + (price * item.quantity);
    }, 0);

    if (cartSub < found.minOrderSAR) {
      showNotification(isAr ? `الحد الأدنى لتفعيل الكوبون هو ${found.minOrderSAR} ريال` : `Minimum order value for this code is ${found.minOrderSAR} SAR.`, true);
      setAppliedCoupon(null);
      return;
    }

    setAppliedCoupon(found);
    showNotification(isAr ? 'تم تطبيق كود الخصم بنجاح!' : 'Coupon applied successfully!');
  };

  // Cart financial calculations
  const cartSubtotalSAR = cart.reduce((sum, item) => {
    const price = item.variantIndex > -1 ? item.product.variants[item.variantIndex].priceSAR : item.product.priceSAR;
    return sum + (price * item.quantity);
  }, 0);

  const discountSAR = appliedCoupon 
    ? (appliedCoupon.type === CouponDiscountType.PERCENTAGE 
        ? Math.min((cartSubtotalSAR * appliedCoupon.value) / 100, appliedCoupon.maxDiscountSAR)
        : appliedCoupon.value)
    : 0;

  const currentTaxRate = globalSettings.taxRatePercent / 100;
  const deliverySAR = cartSubtotalSAR >= (globalSettings.freeShippingThreshold ?? 150) ? 0 : globalSettings.shippingFee;
  const basePreTax = Math.max(0, cartSubtotalSAR - discountSAR + deliverySAR);
  const taxSAR = basePreTax * currentTaxRate;
  const grandTotalSAR = basePreTax + taxSAR;

  // Checkout submission
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showNotification(isAr ? 'يرجى تسجيل الدخول بكود العميل أولاً لإتمام الطلب' : 'Please register or login first to process the order.', true);
      setShowAuthModal(true);
      return;
    }
    if (cart.length === 0) return;

    try {
      setLoading(true);
      const newOrderId = 'order-' + Math.random().toString(36).substring(2, 9);
      const finalItems = cart.map(item => ({
        productId: item.product.id,
        productNameEn: item.product.nameEn,
        productNameAr: item.product.nameAr,
        weight: item.variantIndex > -1 ? item.product.variants[item.variantIndex].weight : 'Base Bag',
        priceSAR: item.variantIndex > -1 ? item.product.variants[item.variantIndex].priceSAR : item.product.priceSAR,
        quantity: item.quantity,
        image: item.product.images[0]
      }));

      const newOrder: Order = {
        id: newOrderId,
        userId: user.uid,
        customerInfo: {
          name: shippingName || user.displayName || 'Guest Chef',
          email: user.email || 'noreply@zafnira.com',
          phone: shippingPhone || '+966'
        },
        shippingAddress: {
          street: shippingStreet || 'Riyadh Main Street',
          city: shippingCity || 'Riyadh',
          zipCode: shippingZip || '12351',
          country: 'Saudi Arabia'
        },
        items: finalItems,
        subtotalSAR: cartSubtotalSAR,
        discountSAR: discountSAR,
        deliveryChargeSAR: deliverySAR,
        taxSAR: taxSAR,
        totalSAR: grandTotalSAR,
        totalUSD: grandTotalSAR * globalSettings.usdExchangeRate,
        status: OrderStatus.PENDING,
        paymentMethod: shippingPayment,
        paymentStatus: shippingPayment === 'card' ? 'paid' : 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'orders', newOrderId), newOrder);
      setOrders([newOrder, ...orders]);
      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      showNotification(isAr ? 'تم تسجيل وتفويج طلبك بنجاح! شكراً لاختيارك زعفنيرا' : 'Perfect! Your order is successfully registered! ZafNira team is preparing your spices.');
      setView('account');
    } catch (err) {
      handleFirestoreError(err, 'CREATE_ORDER', 'orders');
      showNotification('Could not place order. Please try again.', true);
    } finally {
      setLoading(false);
    }
  };

  // Filters logic
  const filteredGridProducts = products.filter(p => {
    const matchesSearch = p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.nameAr.includes(searchQuery);
    const matchesCategory = selectedCategory === 'all' ? true : p.category === selectedCategory;
    const matchesPrice = p.priceSAR <= maxPrice;
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="bg-gray-50/60 min-h-screen text-gray-800 antialiased font-sans" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Global Announcement / Promo Banner Bar */}
      {pagesContent.announcementActive && (
        <div id="top-announcement-bar" className="bg-gradient-to-r from-red-700 via-amber-700 to-amber-900 text-white text-xs font-bold py-2.5 px-4 text-center tracking-wide duration-300 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
          <div className="max-w-7xl mx-auto flex justify-center items-center gap-2">
            <span className="bg-amber-500 text-black font-black text-[9px] px-1.5 py-0.5 rounded animate-pulse">
              {isAr ? 'تنبيه' : 'PROMO'}
            </span>
            <span className="font-semibold">{isAr ? pagesContent.announcementTextAr : pagesContent.announcementTextEn}</span>
          </div>
        </div>
      )}

      {/* 2. Brand Multilingual Header */}
      {view !== 'admin' && (
        <Header
          lang={lang}
          onSetLang={setLang}
          currency={currency}
          onSetCurrency={setCurrency}
          cart={cart}
          wishlistCount={wishlist.length}
          onOpenCart={() => setView('cart')}
          onOpenAccount={() => setView('account')}
          onOpenAdmin={() => setView('admin')}
          onGoHome={() => setView('home')}
          onGoShop={() => setView('shop')}
          currentUser={user}
          isAdmin={isAdmin}
          websiteName={globalSettings.websiteName}
        />
      )}

      {/* Status Warning floating logs */}
      {msg && (
        <div id="toast-notification" className={`fixed bottom-6 left-6 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm text-sm border font-bold animate-in fade-in duration-300 ${msg.error ? 'bg-red-950 text-red-200 border-red-800' : 'bg-green-950 text-green-200 border-green-800'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${msg.error ? 'bg-red-400 animate-ping' : 'bg-green-400'}`} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* ADMIN CONTROL PAGE BACKSTAGE */}
      {view === 'admin' && (
        <AdminPanel
          lang={lang}
          onBack={() => setView('home')}
        />
      )}

      {/* MAIN VIEW CONTROLLER RENDER ROUTE */}
      {view === 'home' && (
        <div className="animate-in fade-in duration-500">
          {(homeSections && homeSections.length > 0 ? [...homeSections].sort((a, b) => a.order - b.order) : defaultHomeSections)
            .filter(sect => sect.enabled)
            .map((sect) => {
              if (sect.id === 'hero') {
                return (
                  <section key="hero" id="homepage-hero-carousel" className="relative h-[480px] bg-slate-900 text-white overflow-hidden">
                    <div className="absolute inset-0 saturate-110 opacity-70 transition duration-700">
                      <img 
                        src={heroSlides[heroIdx]?.imageUrl || 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=1200'}
                        className="w-full h-full object-cover transition-all duration-1000 transform scale-105"
                        alt="banner pic"
                      />
                    </div>
                    {/* dark cover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-950/90 via-black/40 to-transparent" />
                    
                    <div className="relative max-w-7xl mx-auto h-full px-6 sm:px-8 flex flex-col justify-center items-start z-10">
                      <span className="text-xs uppercase font-black bg-amber-500 text-slate-950 py-1 px-3 rounded-full tracking-widest shadow">
                        {isAr ? 'بيت البهارات ١٠٠٪ نقية' : '100% PURE SEED BLENDS'}
                      </span>
                      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight max-w-2xl mt-4">
                        {isAr ? heroSlides[heroIdx]?.titleAr : heroSlides[heroIdx]?.titleEn}
                      </h1>
                      <p className="text-base sm:text-lg text-amber-50 max-w-xl mt-4 opacity-90 leading-relaxed font-semibold">
                        {isAr ? heroSlides[heroIdx]?.descAr : heroSlides[heroIdx]?.descEn}
                      </p>
                      
                      <div className="mt-8 flex items-center gap-4">
                        <button
                          id="hero-banner-explore-btn"
                          onClick={() => setView('shop')}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 px-8 rounded-xl shadow-lg shadow-amber-900/30 transition-all transform hover:-translate-y-0.5 cursor-pointer max-w-xs block text-sm border-2 border-amber-600"
                        >
                          {isAr ? heroSlides[heroIdx]?.buttonTextAr : heroSlides[heroIdx]?.buttonTextEn}
                        </button>
                      </div>

                      {/* Slider Toggles */}
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                        {heroSlides.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setHeroIdx(idx)}
                            className={`w-3 h-3 rounded-full cursor-pointer transition ${idx === heroIdx ? 'bg-amber-400 w-8' : 'bg-slate-400/50'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </section>
                );
              }

              if (sect.id === 'features') {
                return (
                  <section key="features" id="homepage-features" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
                      <span className="text-[11px] font-black uppercase text-amber-700 tracking-widest">
                        {isAr ? 'عنايتنا بكل حبة' : 'PREMIUM SPICES INTEGRITY'}
                      </span>
                      <h2 className="text-3xl font-black text-amber-950 tracking-tight">
                        {isAr ? 'لماذا بهارات زعفنيرا هي الخيار المثالي؟' : 'Why ZafNira Organics Stands Out'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="bg-white p-8 rounded-2xl border text-center space-y-3 relative group hover:border-amber-700/30 transition">
                        <div className="w-12 h-12 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
                          ١
                        </div>
                        <h3 className="font-extrabold text-amber-950 text-lg">{isAr ? 'طحن بارد طازج' : 'Cold-Milling Preservation'}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {isAr 
                            ? 'نطحن بأساليب التبريد المتطورة لمنع تبخر الزيوت الطيارة والمغذيات الطبيعية لتظل النكهة برائحتها الأصلية.' 
                            : 'Processed under low temperature to capture standard volatile aromatic oils and natural nodes.'}
                        </p>
                      </div>

                      <div className="bg-white p-8 rounded-2xl border text-center space-y-3 relative group hover:border-amber-700/30 transition">
                        <div className="w-12 h-12 bg-red-50 text-red-700 border border-red-100 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
                          ٢
                        </div>
                        <h3 className="font-extrabold text-amber-950 text-lg">{isAr ? 'بدون إضافات تلوينية' : 'No Colors or Preservatives'}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {isAr 
                            ? 'بهاراتنا نقية 100٪ خالية وبشكل كامل من المساحيق الصناعية، الألوان المضافة أو الغلوتامات أحادية الصوديوم.' 
                            : '100% natural pure ground spices with no artificial colors, fillers, MSG, or chalk preservatives.'}
                        </p>
                      </div>

                      <div className="bg-white p-8 rounded-2xl border text-center space-y-3 relative group hover:border-amber-700/30 transition">
                        <div className="w-12 h-12 bg-green-50 text-green-700 border border-green-100 rounded-xl flex items-center justify-center mx-auto text-xl font-bold">
                          ٣
                        </div>
                        <h3 className="font-extrabold text-amber-950 text-lg">{isAr ? 'مستوردة من مزارع فردية' : 'Single-Origin Sourcing'}</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {isAr 
                            ? 'نستورد حبوب التوابل الخام من مزارع غنية محددة في سريلانكا والهند وإيران لثبات الجودة العالية.' 
                            : 'Sourced directly from certified single-origin farmlands in Sri Lanka, India, and Persia.'}
                        </p>
                      </div>
                    </div>
                  </section>
                );
              }

              if (sect.id === 'categories') {
                return (
                  <section key="categories" id="homepage-categories" className="py-12 bg-amber-50/40">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6">
                      <div className="flex justify-between items-end mb-8">
                        <div>
                          <h2 className="text-2xl font-black text-amber-950 tracking-tight">{isAr ? 'أقسام البهارات المميزة' : 'Explore Spice Categories'}</h2>
                          <p className="text-xs text-slate-500 mt-1">{isAr ? 'اختر مجموعتك المفضلة' : 'Select by spices varieties blends'}</p>
                        </div>
                        <button 
                          onClick={() => { setSelectedCategory('all'); setView('shop'); }}
                          className="text-amber-700 font-bold hover:text-amber-800 flex items-center gap-1 cursor-pointer text-sm"
                        >
                          <span>{isAr ? 'تصفح الكل' : 'View Shop Grid'}</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {categories.map((cat) => (
                          <div 
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setView('shop'); }}
                            className="relative h-64 rounded-2xl border overflow-hidden cursor-pointer group shadow-md"
                          >
                            <img 
                              src={cat.image} 
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                              alt="category image"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute bottom-6 px-6 text-white">
                              <h3 className="text-xl font-black tracking-tight">{isAr ? cat.nameAr : cat.nameEn}</h3>
                              <p className="text-xs text-amber-300 mt-1">
                                {isAr ? 'اضغط لتصفح المجموعة' : 'Click to discover products'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              }

              if (sect.id === 'bestsellers') {
                return (
                  <section key="bestsellers" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
                    <div>
                      <div className="mb-8 border-b pb-4 flex justify-between items-end">
                        <div>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full tracking-widest uppercase font-mono">Best Sellers</span>
                          <h2 className="text-2xl font-black text-amber-950 mt-1">{isAr ? 'البهارات والخلطات الأكثر مبيعاً' : 'Most Gifted & Best Sellers'}</h2>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {products.filter(p => p.isBestSeller).slice(0, 3).map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-md transition">
                            <div>
                              <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-md uppercase z-10">Best Seller</span>
                              
                              <div 
                                onClick={() => { setSelectedProduct(p); setView('product-details'); }}
                                className="h-48 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-4"
                              >
                                <img 
                                  src={p.images[0]} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                                  alt="spice product"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.sku}</span>
                                <h4 
                                  onClick={() => { setSelectedProduct(p); setView('product-details'); }}
                                  className="font-black text-lg text-amber-950 hover:text-amber-800 cursor-pointer line-clamp-1"
                                >
                                  {isAr ? p.nameAr : p.nameEn}
                                </h4>
                                
                                <div className="flex items-center gap-1 text-yellow-500 text-xs">
                                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                  <span className="font-bold">{p.rating}</span>
                                  <span className="text-gray-400">({p.reviewsCount})</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                              <span className="text-lg font-black text-amber-900">{getConvertedPrice(p.priceSAR)}</span>
                              <button
                                id={`home-add-item-btn-${p.id}`}
                                onClick={() => addToCartAction(p, -1, 1)}
                                className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
                              >
                                {isAr ? 'أضف للسلة' : 'Add To Cart'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              }

              if (sect.id === 'new-arrivals') {
                return (
                  <section key="new-arrivals" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
                    <div>
                      <div className="mb-8 border-b pb-4">
                        <span className="text-[10px] bg-red-100 text-red-800 font-black px-2 py-0.5 rounded-full tracking-widest uppercase font-mono">New Arrivals</span>
                        <h2 className="text-2xl font-black text-amber-950 mt-1">{isAr ? 'وصل حديثاً بالمخزن' : 'Freshly Ground Additions'}</h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {products.filter(p => p.isNewArrival).slice(0, 3).map(p => (
                          <div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-md transition">
                            <div>
                              <span className="absolute top-4 right-4 bg-red-650 bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase z-10">New</span>
                              
                              <div 
                                onClick={() => { setSelectedProduct(p); setView('product-details'); }}
                                className="h-48 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center cursor-pointer mb-4"
                              >
                                <img 
                                  src={p.images[0]} 
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                                  alt="spice product"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{p.sku}</span>
                                <h4 
                                  onClick={() => { setSelectedProduct(p); setView('product-details'); }}
                                  className="font-black text-lg text-amber-950 hover:text-amber-800 cursor-pointer line-clamp-1"
                                >
                                  {isAr ? p.nameAr : p.nameEn}
                                </h4>
                                <div className="flex items-center gap-1 text-yellow-500 text-xs">
                                  <Star className="w-3.5 h-3.5 fill-yellow-500" />
                                  <span className="font-bold">{p.rating}</span>
                                  <span className="text-gray-400">({p.reviewsCount})</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-4 border-t flex items-center justify-between">
                              <span className="text-lg font-black text-amber-900">{getConvertedPrice(p.priceSAR)}</span>
                              <button
                                id={`home-add-new-btn-${p.id}`}
                                onClick={() => addToCartAction(p, -1, 1)}
                                className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer transition-colors"
                              >
                                {isAr ? 'أضف للسلة' : 'Add To Cart'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              }

              if (sect.id === 'about-preview') {
                return (
                  <section key="about-preview" id="homepage-about-preview" className="bg-amber-950 py-16 text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent" />
                    <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                      <div className="h-80 rounded-2xl overflow-hidden shadow-2xl border-4 border-amber-800">
                        <img 
                          src={pagesContent.aboutImageUrl} 
                          className="w-full h-full object-cover" 
                          alt="spices background presentation"
                        />
                      </div>

                      <div className="space-y-6">
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-3.5 py-1 rounded">
                          {isAr ? 'عن زعفنيرا' : 'CRAFTING STORY'}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-snug">
                          {isAr ? 'من الحقول الوافرة، مطحونة بعناية وطازجة' : 'Pure Spices directly from verified origins'}
                        </h2>
                        <p className="text-sm sm:text-base text-amber-50 opacity-90 leading-relaxed">
                          {isAr ? pagesContent.aboutAr : pagesContent.aboutEn}
                        </p>
                        <div className="flex gap-4 pt-2">
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-bold text-amber-100">{isAr ? 'معايير جودة وغذاء معتمدة' : '100% Certified Safe'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            <span className="text-xs font-bold text-amber-100">{isAr ? 'مطحونة بتأنٍ وبأسرع وقت' : 'Fresh Cold Milled'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              if (sect.id === 'reviews') {
                return (
                  <section key="reviews" id="homepage-reviews" className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="text-center space-y-2 max-w-2xl mx-auto mb-12">
                      <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">
                        {isAr ? 'آراء شركاء النجاح والتوابل' : 'TESTIMONIAL STORIES'}
                      </span>
                      <h2 className="text-3xl font-black text-amber-950 tracking-tight">
                        {isAr ? 'ماذا يقول الطهاة وهواة الطهي عنا؟' : 'Cherished Customer Stories'}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-2xl border space-y-3 relative">
                        <div className="flex text-yellow-500 gap-0.5">
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-600 italic leading-relaxed">
                          "the Persian black lemon and cardamom in the Kabsa spicemix are incredible. It completely transforms traditional rice cooking inside Riyadh. The aroma filled my entire home."
                        </p>
                        <div className="border-t pt-3 flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs text-amber-950">Fahad Saad (Home Chef)</span>
                          <span className="bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.2 rounded border">Verified Buyer</span>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border space-y-3 relative">
                        <div className="flex text-yellow-500 gap-0.5">
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-600 italic leading-relaxed">
                          "Their Turmeric is outstanding. The golden pigment is deep and natural. It doesn’t have that chemical chalky residue other store brands pass off."
                        </p>
                        <div className="border-t pt-3 flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs text-amber-950">Reem Al-Otaibi</span>
                          <span className="bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.2 rounded border">Verified Buyer</span>
                        </div>
                      </div>

                      <div className="bg-white p-6 rounded-2xl border space-y-3 relative">
                        <div className="flex text-yellow-500 gap-0.5">
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                          <Star className="w-4 h-4 fill-yellow-500" />
                        </div>
                        <p className="text-xs text-gray-600 italic leading-relaxed">
                          "Absolutely amazing and swift customer support. I ordered via Riyadh door express delivery and it came within 18 hours. Spices are properly sealed in double layer zip bags."
                        </p>
                        <div className="border-t pt-3 flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs text-amber-950">Khalid Al-Ghamdi</span>
                          <span className="bg-green-50 text-green-700 text-[9px] font-bold px-1.5 py-0.2 rounded border">Verified Buyer</span>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              }

              return null;
            })}

          {/* Section: Frequently Asked Questions FAQ always displayed at the bottom */}
          <section id="homepage-faq" className="py-16 bg-gray-50 border-t">
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center space-y-2 mb-12">
                <HelpCircle className="w-8 h-8 text-amber-700 mx-auto" />
                <h2 className="text-2xl font-black text-amber-950 tracking-tight">
                  {isAr ? 'الأسئلة الأكثر شيوعاً وعلاقات الاسترجاع' : 'Helpful Answers & Common FAQ'}
                </h2>
              </div>

              <div className="space-y-4">
                {pagesContent.faqs.map((faq, idx) => (
                  <div key={faq.id || idx} className="bg-white p-5 border rounded-xl shadow-sm">
                    <h3 className="font-black text-slate-900 border-b pb-2 mb-2 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                      <span>{isAr ? faq.questionAr : faq.questionEn}</span>
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed pl-3 italic">
                      {isAr ? faq.answerAr : faq.answerEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* VIEW: SHOP GRID & SELECTION FILTERS */}
      {view === 'shop' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b pb-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-amber-950 tracking-tight">{isAr ? 'متجر البهارات والتوابل' : 'The Spice Backstage Vault'}</h1>
              <p className="text-xs text-gray-500 mt-1">{isAr ? 'احصل على البهارات العضوية المطحونة طازجة وبأعلى جودة' : 'Browse our premium cold-milled single spices and chefs blends.'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left Column Sidebar Filters */}
            <aside id="shop-filters-sidebar" className="bg-white p-6 border rounded-2xl shadow-sm h-fit space-y-6">
              <div className="border-b pb-2 mb-2">
                <h3 className="font-extrabold text-amber-950 text-sm flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-amber-700" />
                  <span>{isAr ? 'عوامل تصفية البحث' : 'Filter Selection'}</span>
                </h3>
              </div>

              {/* Title Search */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">{isAr ? 'البحث عن منتج' : 'Live Search Keyword'}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={isAr ? 'ابحث عن كركم، كمون...' : 'ginger, masala, kabsa...'}
                    className="w-full pl-9 pr-3 py-1.5 border rounded-lg"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-bold text-slate-700">{isAr ? 'قسم البهارات' : 'Category Category'}</label>
                <div className="space-y-1">
                  <button
                    id="shop-filter-cat-all"
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left p-1.5 px-3 rounded text-xs font-semibold ${selectedCategory === 'all' ? 'bg-amber-100 text-amber-800' : 'hover:bg-gray-100'}`}
                  >
                    {isAr ? 'عرض كافة الأصناف' : 'All categories'}
                  </button>
                  {categories.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCategory(c.id)}
                      className={`w-full text-left p-1.5 px-3 rounded text-xs font-semibold ${selectedCategory === c.id ? 'bg-amber-100 text-amber-800' : 'hover:bg-gray-100'}`}
                    >
                      {isAr ? c.nameAr : c.nameEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price filter */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-slate-700">
                  <span>{isAr ? 'الحد الداكن والقصى للسعر' : 'Max Price cap'}</span>
                  <span className="text-amber-700 font-mono font-black">{maxPrice} SAR</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-amber-700"
                />
              </div>
            </aside>

            {/* Right Column Grid items */}
            <div id="shop-products-grid" className="lg:col-span-3">
              {filteredGridProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {filteredGridProducts.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-xl border flex flex-col justify-between group relative overflow-hidden shadow-sm hover:shadow-md transition">
                      
                      {/* Favorite switcher */}
                      <button
                        id={`shop-wishlist-toggle-btn-${p.id}`}
                        onClick={() => toggleWishlist(p.id)}
                        className={`absolute top-4 right-4 p-1.5 rounded-full shadow border transition-all duration-200 z-10 cursor-pointer ${wishlist.includes(p.id) ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white text-gray-400'}`}
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>

                      <div>
                        {/* Img frame */}
                        <div 
                          onClick={() => { setSelectedProduct(p); setDetailVariantIndex(0); setDetailQuantity(1); setCurrentProductImageIdx(0); setView('product-details'); }}
                          className="h-44 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center mb-4 cursor-pointer"
                        >
                          <img 
                            src={p.images[0]} 
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
                            alt="product pic"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-mono block">{p.sku}</span>
                          <h4 
                            onClick={() => { setSelectedProduct(p); setDetailVariantIndex(0); setDetailQuantity(1); setCurrentProductImageIdx(0); setView('product-details'); }}
                            className="font-black text-base text-amber-950 hover:text-amber-800 line-clamp-1 cursor-pointer"
                          >
                            {isAr ? p.nameAr : p.nameEn}
                          </h4>
                          <p className="text-[10px] text-gray-400 line-clamp-1 italic">{isAr ? p.descriptionAr : p.descriptionEn}</p>
                          
                          <div className="flex items-center gap-1 text-yellow-500 text-xs mt-1">
                            <Star className="w-3.5 h-3.5 fill-yellow-500" />
                            <span className="font-bold">{p.rating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div>
                          <p className="text-lg font-black text-amber-900">{getConvertedPrice(p.priceSAR)}</p>
                          <p className="text-[9px] text-gray-400">{isAr ? `المخزون: ${p.stock}` : `Stock: ${p.stock} units`}</p>
                        </div>
                        <button
                          id={`shop-add-cart-btn-${p.id}`}
                          onClick={() => addToCartAction(p, -1, 1)}
                          className="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2 px-4 rounded-lg cursor-pointer shadow"
                        >
                          {isAr ? 'أضف للسلة' : 'Add To Cart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white border rounded-2xl p-12 text-center text-gray-400 text-sm">
                  {isAr ? 'لم نجد أي بهارات مطابقة لبحثك' : 'We could not find any spices matching chosen filters.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: PRODUCT DETAILS SCREEN */}
      {view === 'product-details' && selectedProduct && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
          <button
            id="back-to-shop-grid-btn"
            onClick={() => setView('shop')}
            className="mb-6 flex items-center gap-1.5 text-amber-800 hover:text-amber-900 font-bold text-sm cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isAr ? 'العودة لمتجر البهارات' : 'Back to Spice Store'}</span>
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch bg-white border rounded-2xl p-6 sm:p-8 shadow-sm">
            {/* Left Col: Images selection */}
            <div className="space-y-4">
              <div className="h-96 rounded-2xl overflow-hidden bg-slate-50 border">
                <img 
                  src={selectedProduct.images?.[currentProductImageIdx] || selectedProduct.images?.[0]} 
                  className="w-full h-full object-cover" 
                  alt="selected product view"
                />
              </div>
              
              {/* gallery thumbnails slider */}
              {selectedProduct.images && selectedProduct.images.length > 1 && (
                <div className="flex gap-2">
                  {selectedProduct.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentProductImageIdx(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 cursor-pointer ${idx === currentProductImageIdx ? 'border-amber-700' : 'border-gray-100'}`}
                    >
                      <img src={img} className="w-full h-full object-cover" alt="thumbs" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Col: Details information */}
            <div className="flex flex-col justify-between">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-xs uppercase font-extrabold text-amber-700 tracking-widest">{selectedProduct.sku}</span>
                  <h1 className="text-3xl font-black text-amber-950 tracking-tight">{isAr ? selectedProduct.nameAr : selectedProduct.nameEn}</h1>
                  
                  {/* Rating summary */}
                  <div className="flex items-center gap-1 text-yellow-500 text-xs">
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <Star className="w-4 h-4 fill-yellow-500" />
                    <span className="font-bold text-slate-800 text-sm ml-1">{selectedProduct.rating}</span>
                    <span className="text-gray-400">({selectedProduct.reviewsCount} customer reviews)</span>
                  </div>
                </div>

                <div className="border-t border-b py-4">
                  <span className="text-gray-400 text-xs block mb-1">
                    {isAr ? 'يتوفر بوزنين وتعبئتين مغزلية:' : 'Available Weight / Packing Variant Options:'}
                  </span>
                  <p className="text-2xl font-black text-amber-900">
                    {getConvertedPrice(
                      selectedProduct.variants?.[detailVariantIndex]?.priceSAR || selectedProduct.priceSAR
                    )}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Saudi VAT VAT included 15% where applicable KSA.</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wide mb-15">Description & Origin details</h4>
                  <p className="text-sm text-gray-600 leading-relaxed font-medium">
                    {isAr ? selectedProduct.descriptionAr : selectedProduct.descriptionEn}
                  </p>
                </div>

                {/* Variants Selection options */}
                {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                  <div className="space-y-2 text-xs">
                    <span className="block font-bold text-slate-700">{isAr ? 'اختر خيار الوزن وحجم العبوة:' : 'Select Weight/Seal type option:'}</span>
                    <div className="flex gap-2">
                      {selectedProduct.variants.map((v, idx) => (
                        <button
                          key={idx}
                          id={`variant-btn-${idx}`}
                          onClick={() => setDetailVariantIndex(idx)}
                          className={`p-2.5 px-4 rounded-xl border-2 cursor-pointer font-bold text-xs transition ${idx === detailVariantIndex ? 'bg-amber-100 border-amber-700 text-amber-950' : 'bg-white border-gray-100'}`}
                        >
                          {v.weight} - {v.priceSAR} SAR
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity Controls */}
                <div className="flex items-center gap-4 text-xs pt-4">
                  <span className="font-bold text-slate-700">{isAr ? 'الكمية المطلوبة:' : 'Quantity order:'}</span>
                  <div className="flex items-center border rounded-xl bg-gray-550 bg-gray-100 overflow-hidden text-sm">
                    <button
                      id="details-qty-decrease"
                      onClick={() => setDetailQuantity(Math.max(1, detailQuantity - 1))}
                      className="p-2 px-3 hover:bg-gray-200 cursor-pointer text-slate-800 font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-mono font-black text-slate-900 px-4">{detailQuantity}</span>
                    <button
                      id="details-qty-increase"
                      onClick={() => setDetailQuantity(detailQuantity + 1)}
                      className="p-2 px-3 hover:bg-gray-200 cursor-pointer text-slate-800 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action purchase triggers */}
              <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row gap-4">
                <button
                  id="details-add-to-cart-action"
                  onClick={() => addToCartAction(selectedProduct, selectedProduct.variants?.length ? detailVariantIndex : -1, detailQuantity)}
                  className="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-black py-4 px-8 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-sm shadow-lg shadow-amber-950/10"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAr ? 'أضف لحقيبة التسوق' : 'Add Pack to Cart'}</span>
                </button>
                <button
                  id="details-buy-now-action"
                  onClick={() => {
                    setCart([{ product: selectedProduct, variantIndex: selectedProduct.variants?.length ? detailVariantIndex : -1, quantity: detailQuantity }]);
                    setView('checkout');
                  }}
                  className="flex-1 bg-slate-900 hover:bg-slate-950 text-white font-black py-4 px-8 rounded-xl cursor-pointer text-sm shadow-lg shadow-slate-950/20"
                >
                  {isAr ? 'شراء الآن (مباشرة)' : 'Buy Now'}
                </button>
              </div>

            </div>
          </div>

          {/* Related Products Section */}
          <div className="mt-16 border-t pt-10">
            <h3 className="text-xl font-black text-amber-950 mb-6">{isAr ? 'بهارات وتوابل ذات صلة' : 'Other spices you might love'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              {products
                .filter(p => p.id !== selectedProduct.id && p.category === selectedProduct.category)
                .slice(0, 4)
                .map(p => (
                  <div key={p.id} className="bg-white p-4 border rounded-xl hover:shadow transition flex flex-col justify-between">
                    <div 
                      onClick={() => { setSelectedProduct(p); setDetailVariantIndex(0); setDetailQuantity(1); setView('product-details'); }}
                      className="h-32 rounded-lg bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden mb-3"
                    >
                      <img src={p.images[0]} className="w-full h-full object-cover" alt="recs" />
                    </div>
                    <h4 
                      onClick={() => { setSelectedProduct(p); setDetailVariantIndex(0); setDetailQuantity(1); setView('product-details'); }}
                      className="font-bold text-amber-950 hover:text-amber-800 text-sm truncate cursor-pointer"
                    >
                      {isAr ? p.nameAr : p.nameEn}
                    </h4>
                    <div className="mt-2 flex justify-between items-center text-xs">
                      <span className="font-extrabold text-amber-900">{getConvertedPrice(p.priceSAR)}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW: SHOPPING CART GENERAL DETAIL OVERVIEW */}
      {view === 'cart' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
          <div className="border-b pb-4 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-amber-950 tracking-tight">{isAr ? 'حقيبة الكبسة والبهارات' : 'Shopping Cart'}</h1>
              <p className="text-xs text-gray-500 mt-1">{isAr ? 'راجع طلبات الزيوت والتوابل المعبأة' : 'Review your selected spices, select code, adjust units or checkout.'}</p>
            </div>
            <button
              id="cart-continue-shopping-btn"
              onClick={() => setView('shop')}
              className="text-amber-800 hover:text-amber-900 font-bold text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>{isAr ? 'العودة لتسوق البهارات' : 'Continue Shopping'}</span>
            </button>
          </div>

          {cart.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left Grid items column */}
              <div className="md:col-span-2 space-y-4">
                {cart.map((item, index) => {
                  const itemPrice = item.variantIndex > -1 ? item.product.variants[item.variantIndex].priceSAR : item.product.priceSAR;
                  const itemTitle = isAr ? item.product.nameAr : item.product.nameEn;
                  const itemVariantLabel = item.variantIndex > -1 ? item.product.variants[item.variantIndex].weight : 'Base Bag';

                  return (
                    <div key={index} className="bg-white p-4 border rounded-xl shadow-sm flex items-center gap-4 relative">
                      <img 
                        src={item.product.images[0]} 
                        className="w-16 h-16 object-cover rounded shadow-inner" 
                        alt="item visual"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] text-slate-400 font-mono block">SKU: {item.product.sku}</span>
                        <h4 className="font-black text-amber-950 truncate max-w-xs">{itemTitle}</h4>
                        <div className="inline-block px-1.5 py-0.2 mt-1 bg-amber-50 text-amber-800 text-[10px] font-bold border rounded">
                          {itemVariantLabel}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        {/* Unit adjusters */}
                        <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border text-xs font-bold">
                          <button
                            id={`cart-qty-dec-${index}`}
                            onClick={() => updateCartQty(index, -1)}
                            className="p-1 px-2.5 hover:bg-gray-200 text-slate-700"
                          >
                            -
                          </button>
                          <span className="font-mono text-slate-900 px-2.5">{item.quantity}</span>
                          <button
                            id={`cart-qty-inc-${index}`}
                            onClick={() => updateCartQty(index, 1)}
                            className="p-1 px-2.5 hover:bg-gray-200 text-slate-700"
                          >
                            +
                          </button>
                        </div>
                        {/* Remove trigger */}
                        <button
                          id={`cart-remove-item-${index}`}
                          onClick={() => removeFromCart(index)}
                          className="text-red-650 text-red-600 hover:text-red-700 font-bold text-[10px]"
                        >
                          {isAr ? 'حذف الباقة' : 'Remove Pack'}
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-black text-slate-900">{getConvertedPrice(itemPrice * item.quantity)}</p>
                        <p className="text-[10px] text-gray-400">Unit: {itemPrice} SAR</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right summary block */}
              <div className="bg-white p-6 border rounded-2xl shadow-sm h-fit space-y-4">
                <h3 className="font-black text-amber-950 text-md border-b pb-2">
                  {isAr ? 'ملخص الحساب الحالي' : 'Cart Calculations'}
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-800">{getConvertedPrice(cartSubtotalSAR)}</span>
                  </div>

                  {discountSAR > 0 && (
                    <div className="flex justify-between text-red-600 font-bold border-dashed border-b pb-2">
                      <span>Coupon Discount:</span>
                      <span>-{getConvertedPrice(discountSAR)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee:</span>
                    <span className="font-bold text-gray-800">
                      {deliverySAR === 0 ? (isAr ? 'شحن مجاني' : 'FREE') : getConvertedPrice(deliverySAR)}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Saudi VAT (15%):</span>
                    <span className="font-bold text-gray-800">{getConvertedPrice(taxSAR)}</span>
                  </div>

                  <div className="flex justify-between text-base font-black text-amber-950 border-t pt-3">
                    <span>Total Bill:</span>
                    <span>{getConvertedPrice(grandTotalSAR)}</span>
                  </div>
                </div>

                {/* Coupon Code Applying */}
                <div className="pt-4 border-t space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">{isAr ? 'هل تمتلك كوبون خصم؟' : 'Apply Promo Code'}</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder={isAr ? 'أدخل رمز كوبون الخصم' : 'e.g. SPICE10'}
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="flex-1 p-2 border rounded-xl uppercase font-mono"
                    />
                    <button
                      id="cart-apply-coupon-btn"
                      onClick={handleApplyCouponCode}
                      className="bg-amber-800 hover:bg-amber-900 text-white font-bold p-2 px-4 rounded-xl cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </div>

                <button
                  id="cart-proceed-to-checkout-btn"
                  onClick={() => setView('checkout')}
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-black py-3.5 rounded-xl text-center text-xs tracking-wider uppercase cursor-pointer transition-colors block shadow-md"
                >
                  {isAr ? 'الانتقال لإنهاء الدفع والطلب' : 'Proceed To Checkout'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white border rounded-2xl p-16 text-center shadow-inner space-y-4">
              <p className="text-gray-400 text-sm">
                {isAr ? 'سلة التسوق فارغة تماماً!' : 'Your shopping cart is currently blank.'}
              </p>
              <button
                id="cart-empty-go-to-shop-trigger"
                onClick={() => setView('shop')}
                className="bg-amber-850 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2.5 px-6 rounded-lg cursor-pointer transition"
              >
                {isAr ? 'ابدأ التسوق والبهارات' : 'Add Spices Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW: CHECKOUT SCREEN FORM */}
      {view === 'checkout' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
          <div className="border-b pb-4 mb-8">
            <h1 className="text-3xl font-black text-amber-950 tracking-tight">Checkout Billing</h1>
            <p className="text-xs text-gray-500 mt-1">Provide delivery address and complete checkout.</p>
          </div>

          <form id="checkout-billing-form" onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* Left Col form inputs */}
            <div className="md:col-span-3 bg-white p-6 border rounded-2xl shadow-sm space-y-6">
              <h3 className="font-extrabold text-amber-950 text-sm uppercase tracking-wide border-b pb-2">Customer Shipping details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Salim Al-Harbi"
                    className="w-full p-2.5 border rounded-xl"
                    value={shippingName}
                    onChange={(e) => setShippingName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Contact Phone Mobile *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +966 50 123 4567"
                    className="w-full p-2.5 border rounded-xl font-mono"
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold mb-1">Street Address, District, Building *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Olaya Main Street, King Fahad District, Block 4"
                    className="w-full p-2.5 border rounded-xl"
                    value={shippingStreet}
                    onChange={(e) => setShippingStreet(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">City in KSA *</label>
                  <select
                    className="w-full p-2.5 border rounded-xl bg-white text-xs font-semibold"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                  >
                    <option value="Riyadh">Riyadh (الرياض)</option>
                    <option value="Jeddah">Jeddah (جدة)</option>
                    <option value="Dammam">Dammam (الدمام)</option>
                    <option value="Mecca">Mecca (مكة المكرمة)</option>
                    <option value="Medina">Medina (المدينة المنورة)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Postal Zip Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 11564"
                    className="w-full p-2.5 border rounded-xl font-mono"
                    value={shippingZip}
                    onChange={(e) => setShippingZip(e.target.value)}
                  />
                </div>
              </div>

              {/* Payment methods toggle */}
              <div className="pt-4 border-t space-y-3 text-xs">
                <p className="font-extrabold text-amber-950 uppercase text-xs tracking-wider">Payment Method</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(globalSettings.paymentCodActive ?? true) && (
                    <label className={`p-4 border rounded-xl flex items-center gap-2 cursor-pointer transition ${shippingPayment === 'cod' ? 'bg-amber-50 border-amber-500' : 'bg-white hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="payment_opt"
                        checked={shippingPayment === 'cod'}
                        onChange={() => setShippingPayment('cod')}
                        className="accent-amber-700"
                      />
                      <div>
                        <p className="font-bold text-gray-950 text-xs">{isAr ? 'الدفع عند الاستلام' : 'Cash On Delivery (COD)'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? 'ادفع نقداً لمندوبنا' : 'Pay raw cash when doorstep arrives'}</p>
                      </div>
                    </label>
                  )}

                  {(globalSettings.paymentCardActive ?? true) && (
                    <label className={`p-4 border rounded-xl flex items-center gap-2 cursor-pointer transition ${shippingPayment === 'card' ? 'bg-amber-50 border-amber-500' : 'bg-white hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="payment_opt"
                        checked={shippingPayment === 'card'}
                        onChange={() => setShippingPayment('card')}
                        className="accent-amber-700"
                      />
                      <div>
                        <p className="font-bold text-gray-950 text-xs">{isAr ? 'البطاقة الائتمانية / مدى' : 'Credit / Mada Cards'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? 'الدفع الآمن بالبطاقة' : 'Safe online payment portal'}</p>
                      </div>
                    </label>
                  )}

                  {(globalSettings.paymentBankActive ?? true) && (
                    <label className={`p-4 border rounded-xl flex items-center gap-2 cursor-pointer transition ${shippingPayment === 'bank' ? 'bg-amber-50 border-amber-500' : 'bg-white hover:bg-slate-50'}`}>
                      <input
                        type="radio"
                        name="payment_opt"
                        checked={shippingPayment === 'bank'}
                        onChange={() => setShippingPayment('bank')}
                        className="accent-amber-700"
                      />
                      <div>
                        <p className="font-bold text-gray-950 text-xs">{isAr ? 'حوالة بنكية مباشرة' : 'Direct Bank Transfer'}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{isAr ? 'التحويل للأيبان الرسمي' : 'Transfer directly to merchant IBAN'}</p>
                      </div>
                    </label>
                  )}
                </div>

                {shippingPayment === 'card' && (globalSettings.paymentCardActive ?? true) && (
                  <div className="bg-slate-50 border p-4 rounded-xl space-y-3 text-xs animate-in slide-in-from-top duration-300">
                    <div>
                      <label className="block font-bold mb-1">Mada / Visa Card Number</label>
                      <input
                        type="text"
                        placeholder="4242 •••• •••• 4242"
                        className="w-full p-2 border rounded font-mono"
                        value={cardNo}
                        onChange={(e) => setCardNo(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold mb-1">Expiry date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          className="w-full p-2 border font-mono rounded"
                          value={cardExp}
                          onChange={(e) => setCardExp(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block font-bold mb-1">CVV Security</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          className="w-full p-2 border font-mono rounded"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {shippingPayment === 'bank' && (globalSettings.paymentBankActive ?? true) && (
                  <div className="bg-amber-50/50 border border-amber-200 p-4 rounded-xl space-y-2 text-xs animate-in slide-in-from-top duration-300">
                    <p className="font-extrabold text-amber-950 uppercase tracking-wide">
                      {isAr ? 'تفاصيل الحساب البنكي والتحويل المالي' : 'Direct Wire Transfer Account Guidelines'}
                    </p>
                    <p className="text-gray-700 leading-relaxed font-semibold whitespace-pre-wrap">
                      {isAr ? globalSettings.paymentBankDetailsAr : globalSettings.paymentBankDetailsEn}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Summary column */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
                <h3 className="font-black text-amber-950 text-sm border-b pb-2">Checkout Order Summary</h3>
                
                <div className="divide-y text-xs">
                  {cart.map((item, index) => (
                    <div key={index} className="py-2.5 flex justify-between">
                      <div className="max-w-[70%]">
                        <p className="font-bold text-gray-800 truncate">{isAr ? item.product.nameAr : item.product.nameEn}</p>
                        <span className="text-[10px] text-slate-400">Qty: {item.quantity} | {item.variantIndex > -1 ? item.product.variants[item.variantIndex].weight : 'Base Size'}</span>
                      </div>
                      <span className="font-semibold text-slate-800">
                        {getConvertedPrice((item.variantIndex > -1 ? item.product.variants[item.variantIndex].priceSAR : item.product.priceSAR) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-3 border-t text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal:</span>
                    <span className="font-bold text-gray-800">{getConvertedPrice(cartSubtotalSAR)}</span>
                  </div>
                  {discountSAR > 0 && (
                    <div className="flex justify-between text-red-600 font-bold border-dashed border-b pb-2">
                      <span>Coupon Discount:</span>
                      <span>-{getConvertedPrice(discountSAR)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>VAT (15% Saudi):</span>
                    <span className="font-bold text-gray-800">{getConvertedPrice(taxSAR)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Charge:</span>
                    <span className="font-bold text-gray-800">
                      {deliverySAR === 0 ? 'FREE' : getConvertedPrice(deliverySAR)}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-amber-950 text-base border-t pt-3">
                    <span>Grand Total Due:</span>
                    <span>{getConvertedPrice(grandTotalSAR)}</span>
                  </div>
                </div>

                <button
                  id="checkout-trigger-submit"
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-amber-700 hover:bg-amber-800 text-white font-black py-4 rounded-xl text-center text-xs tracking-widest uppercase shadow shadow-amber-900/10 cursor-pointer disabled:opacity-5 w-full"
                >
                  {loading ? 'Processing...' : (isAr ? 'تأكيد وشراء الطلب الآن' : 'Verify & Place Order Now')}
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* VIEW: ACCOUNT/wishlist LOGS */}
      {view === 'account' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-in fade-in duration-300">
          <div className="border-b pb-4 mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-amber-950 tracking-tight">{isAr ? 'حساب الطاهي والعميل' : 'Customer Backstage Profile'}</h1>
              <p className="text-xs text-gray-500 mt-1">{isAr ? 'تتبع فواتيرك وطلبات البهارات النشطة والمفضلة' : 'Track invoices, active spice orders status, and saved favorites.'}</p>
            </div>
            {user && (
              <button
                id="profile-sign-out"
                onClick={triggerSignOut}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2 px-4 rounded-lg cursor-pointer border border-red-100"
              >
                Sign out
              </button>
            )}
          </div>

          {!user ? (
            <div className="max-w-md mx-auto bg-white p-8 border rounded-2xl shadow-xl space-y-6">
              <div className="text-center space-y-2">
                <ShieldCheck className="w-12 h-12 text-amber-600 mx-auto" />
                <h3 className="text-xl font-black text-amber-950">{isAr ? 'تسجيل دخول ملف العميل' : 'Access Your Profile'}</h3>
                <p className="text-xs text-gray-400">Login dynamically for fast order checkout, streak tracking and wishlist persistence.</p>
              </div>

              {/* Login Buttons */}
              <div className="space-y-3 pt-4">
                <button
                  id="account-google-login-trigger"
                  onClick={triggerGoogleLogin}
                  className="w-full bg-slate-900 hover:bg-slate-950 text-white font-bold py-3.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer shadow text-sm"
                >
                  <Globe className="w-4 h-4 text-amber-500" />
                  <span>Sign in with Google Account</span>
                </button>

                <div className="flex items-center my-4">
                  <span className="flex-1 border-t" />
                  <span className="mx-3 text-xs text-slate-400 uppercase font-black tracking-widest">or Testing Account</span>
                  <span className="flex-1 border-t" />
                </div>

                <div className="space-y-2 text-xs">
                  <label className="block font-bold text-slate-700">Test Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. customer@zafnira.com or farukbangla53@gmail.com"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    className="w-full p-2.5 border rounded-xl font-mono"
                  />
                  <p className="text-[10px] text-gray-500">
                    Use <span className="font-mono bg-amber-50 text-amber-800 p-0.5 rounded font-bold">farukbangla53@gmail.com</span> to automatically test Admin backstages!
                  </p>
                </div>

                <button
                  id="account-bypass-login"
                  onClick={() => loginManualMock(manualEmail || 'customer@zafnira.com')}
                  className="w-full mt-2 bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl cursor-pointer text-xs"
                >
                  Test Log In Directly
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Profile Card Header */}
              <div className="bg-amber-50 border border-amber-200/50 p-6 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                <div>
                  <h3 className="text-xl font-black text-amber-950 flex items-center gap-1.5">
                    <Smile className="w-6 h-6 text-amber-600 animate-bounce" />
                    <span>Welcome back, {user.displayName || 'Chef'}!</span>
                  </h3>
                  <p className="text-xs text-amber-800/80 mt-1 font-mono">{user.email}</p>
                </div>
                {isAdmin && (
                  <span className="bg-amber-100 text-amber-900 border font-extrabold uppercase text-[10px] tracking-widest px-3 py-1.5 rounded-full shadow-inner animate-pulse">
                    🏢 Admin Backstage Gate Active
                  </span>
                )}
              </div>

              {/* Grid content log: Wishlist left, order history right */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Wishlist segment */}
                <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-md font-black text-slate-900 flex items-center gap-1.5 border-b pb-2">
                    <Heart className="w-5 h-5 text-red-600 fill-current" />
                    <span>{isAr ? 'قائمة تفضيلات البهارات' : 'My Saved Wishlist'}</span>
                  </h3>

                  {wishlist.length > 0 ? (
                    <div className="divide-y text-xs">
                      {wishlist.map(id => {
                        const sProd = products.find(p => p.id === id);
                        if (!sProd) return null;
                        return (
                          <div key={id} className="py-2.5 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-900">{isAr ? sProd.nameAr : sProd.nameEn}</p>
                              <span className="text-[10px] text-slate-400 font-mono">SKU: {sProd.sku}</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                id={`wishlist-cart-btn-${id}`}
                                onClick={() => addToCartAction(sProd, -1, 1)}
                                className="bg-amber-800 hover:bg-amber-900 text-white text-[10px] py-1 px-3.5 rounded-lg cursor-pointer transition font-bold"
                              >
                                Buy
                              </button>
                              <button
                                id={`wishlist-discard-btn-${id}`}
                                onClick={() => toggleWishlist(id)}
                                className="text-red-650 text-red-600 hover:text-red-700 font-bold"
                              >
                                Discard
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs py-4">No spices saved to favorites yet.</p>
                  )}
                </div>

                {/* Orders historical segment */}
                <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-md font-black text-slate-900 flex items-center gap-1.5 border-b pb-2">
                    <ShoppingBag className="w-5 h-5 text-amber-700" />
                    <span>{isAr ? 'سجلات طلباتي السابقة' : 'My Dynamic Spice Orders'}</span>
                  </h3>

                  {orders.length > 0 ? (
                    <div className="space-y-3.5 text-xs">
                      {orders.map(order => (
                        <div key={order.id} className="p-3 bg-slate-50 border rounded-xl flex justify-between items-center transition border-slate-200">
                          <div>
                            <p className="font-mono font-black text-amber-950">#{order.id.substring(0, 8).toUpperCase()}</p>
                            <span className="text-[9px] text-gray-400 block mt-0.5">{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-[10px] text-slate-500 font-semibold block mt-1">
                              {order.items.length} spices packet • <span className="font-bold">{order.totalSAR.toFixed(2)} SAR</span>
                            </span>
                          </div>
                          
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider text-white ${
                              order.status === 'delivered' ? 'bg-green-600' :
                              order.status === 'cancelled' ? 'bg-red-600' :
                              order.status === 'shipped' ? 'bg-blue-600' :
                              'bg-amber-600'
                            }`}>
                              {order.status}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-gray-400">{order.paymentMethod.toUpperCase()} payment</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-xs py-4">You have not registered any spice orders yet.</p>
                  )}
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Messenger Contacts */}
      <WhatsAppChat number={globalSettings.whatsappNumber} lang={lang} />

      {/* Dynamic Popups System */}
      <SpecialOfferPopup popup={popups[0]} lang={lang} />

      {/* 3. Global Footer Component */}
      {view !== 'admin' && (
        <footer id="global-footer" className="bg-slate-900 text-slate-300 py-16 border-t border-slate-800" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 text-sm leading-relaxed">
            
            {/* Cell 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-amber-700 text-white font-black rounded-lg flex items-center justify-center text-lg shadow-md shadow-amber-700/20">
                  Z
                </div>
                <h3 className="text-white text-xl font-black">{globalSettings.websiteName}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                {isAr 
                  ? 'رائدون في استيراد وطحن البهارات الفردية والمخاليط الفاخرة للطهي التقليدي والعصري في المملكة.' 
                  : 'Sourcing, cold-milling and hygienically packaging elite grade Arabic spices from single-origins.'}
              </p>
              <p className="text-[10px] text-amber-500 font-bold font-mono"> Riyadh, Kingdom of Saudi Arabia</p>
            </div>

            {/* Cell 2: Quick Links */}
            <div className="space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-widest">{isAr ? 'روابط سريعة' : 'Corporate Sections'}</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <button onClick={() => setView('home')} className="hover:text-amber-400 transition cursor-pointer">
                    {isAr ? 'الصفحة الرئيسية' : 'Homepage Main'}
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('shop')} className="hover:text-amber-400 transition cursor-pointer">
                    {isAr ? 'متجر البهارات' : 'Explore Catalog Grid'}
                  </button>
                </li>
                <li>
                  <button onClick={() => setView('account')} className="hover:text-amber-400 transition cursor-pointer">
                    {isAr ? 'قائمة حسابي' : 'Customer Account Lobby'}
                  </button>
                </li>
              </ul>
            </div>

            {/* Cell 3: Policy Links */}
            <div className="space-y-3">
              <h4 className="text-white font-black text-xs uppercase tracking-widest">{isAr ? 'سياسات المتجر الإلكتروني' : 'Policies & Safety documents'}</h4>
              <p className="text-[10px] text-slate-500 mb-2">Approved by SFDA KSA Food Standards</p>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <p className="font-bold text-[10px] text-slate-400 lowercase">{isAr ? 'سياسة الاسترجاع والتبديل' : 'Hygienic Return Regulation'}</p>
                  <span className="text-[10.5px] italic text-slate-500">{isAr ? pagesContent.returnPolicyAr : pagesContent.returnPolicyEn}</span>
                </li>
                <li>
                  <p className="font-bold text-[10px] text-slate-400 lowercase">{isAr ? 'سياسات الشحن والخدمات' : 'Standard Shipping Policy'}</p>
                  <span className="text-[10.5px] italic text-slate-500">{isAr ? pagesContent.shippingPolicyAr : pagesContent.shippingPolicyEn}</span>
                </li>
              </ul>
            </div>

            {/* Cell 4: Subscribe Newsletter Newsletter block */}
            <div className="space-y-4">
              <h4 className="text-white font-black text-xs uppercase tracking-widest">{isAr ? 'النشرة البريدية الحصرية للبهارات' : 'Fresh Ground Alert Newsletter'}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr ? 'اشترك لاستلام هدايا أسرار بهارات الكبسة النجدية مجاناً' : 'Get secret spice blends handbooks and season discounts direct.'}
              </p>
              <div className="flex gap-1">
                <input
                  type="email"
                  placeholder="chef@email.com"
                  className="bg-slate-800 text-white text-xs p-2.5 rounded-lg border border-slate-700 w-full focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
                <button
                  id="footer-subscribe-submit"
                  onClick={() => showNotification(isAr ? 'شكراً لاشتراكك لنشرة بهارات زعفنيرا!' : 'Subscribed successfully. Check your chef inbox!')}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-black text-xs p-2.5 rounded-lg cursor-pointer"
                >
                  Join
                </button>
              </div>
            </div>

          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 text-center text-[10px] text-slate-500 font-mono">
            <p>© 2026 ZafNira Spices Riyadh corp. All rights and recipes reserved. VAT KSA registration 301458269.</p>
          </div>
        </footer>
      )}

    </div>
  );
}
