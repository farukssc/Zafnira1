import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  LayoutDashboard, ShoppingBag, FolderHeart, ShoppingCart, Percent, 
  BellRing, Settings, RefreshCw, Plus, Edit2, Trash2, Check, ArrowLeft,
  Search, Eye, FileText, Download, TrendingUp, AlertTriangle, Users, Package 
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, getDocs, doc, setDoc, deleteDoc, updateDoc, writeBatch 
} from 'firebase/firestore';
import { 
  Product, Category, Order, Coupon, PopupConfig, CMSGlobalSettings, 
  CMSPagesContent, HomeSection, HeroSlide, OrderStatus, CouponDiscountType, PopupType 
} from '../types';
import InvoicePrint from './InvoicePrint';

interface AdminPanelProps {
  onBack: () => void;
  lang: 'en' | 'ar';
}

type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'coupons' | 'popups' | 'cms' | 'homepage-builder';

export default function AdminPanel(props: AdminPanelProps) {
  const isAr = props.lang === 'ar';
  
  // Tab Routing State
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Database States
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [popups, setPopups] = useState<PopupConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<CMSGlobalSettings | null>(null);
  const [pagesContent, setPagesContent] = useState<CMSPagesContent | null>(null);
  const [homeSections, setHomeSections] = useState<HomeSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);

  // State Management Actions
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Editor Modals or Creation States
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [editingPopup, setEditingPopup] = useState<Partial<PopupConfig> | null>(null);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);

  // Search/Filters in Admin
  const [prodSearch, setProdSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<string>('all');

  // Custom Category State
  const [catNameEn, setCatNameEn] = useState('');
  const [catNameAr, setCatNameAr] = useState('');
  const [catImage, setCatImage] = useState('');
  const [catSlug, setCatSlug] = useState('');

  // Bulk Product Loader String
  const [bulkInput, setBulkInput] = useState('');

  useEffect(() => {
    fetchDbData();
  }, []);

  const fetchDbData = async () => {
    setLoading(true);
    try {
      // 1. Fetch categories
      const catSnap = await getDocs(collection(db, 'categories'));
      const catList: Category[] = [];
      catSnap.forEach(d => catList.push({ id: d.id, ...d.data() } as Category));
      setCategories(catList);

      // 2. Fetch products
      const prodSnap = await getDocs(collection(db, 'products'));
      const prodList: Product[] = [];
      prodSnap.forEach(d => prodList.push({ id: d.id, ...d.data() } as Product));
      setProducts(prodList);

      // 3. Fetch orders
      const orderSnap = await getDocs(collection(db, 'orders'));
      const orderList: Order[] = [];
      orderSnap.forEach(d => orderList.push({ id: d.id, ...d.data() } as Order));
      // Sort orders descending
      orderList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(orderList);

      // 4. Fetch coupons
      const coupSnap = await getDocs(collection(db, 'coupons'));
      const coupList: Coupon[] = [];
      coupSnap.forEach(d => coupList.push({ id: d.id, ...d.data() } as Coupon));
      setCoupons(coupList);

      // 5. Fetch popups
      const popupSnap = await getDocs(collection(db, 'popups'));
      const popList: PopupConfig[] = [];
      popupSnap.forEach(d => popList.push({ id: d.id, ...d.data() } as PopupConfig));
      setPopups(popList);

      // 6. Fetch CMS globals, layouts and details
      const cmsSnap = await getDocs(collection(db, 'cms_config'));
      cmsSnap.forEach(docSnap => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id === 'global_settings') setGlobalSettings(data as CMSGlobalSettings);
        if (id === 'pages') setPagesContent(data as CMSPagesContent);
        if (id === 'home_sections') setHomeSections(data.sections || []);
        if (id === 'hero_slides') setHeroSlides(data.slides || []);
      });

    } catch (e: any) {
      console.error(e);
      showMsg('Failed to fetch from store. Using initial state.', true);
    } finally {
      setLoading(false);
    }
  };

  const showMsg = (text: string, isErr = false) => {
    setMsg({ text, error: isErr });
    setTimeout(() => {
      setMsg(null);
    }, 4500);
  };

  // KPI Calculations
  const totalSalesSAR = orders
    .filter(o => o.status !== OrderStatus.CANCELLED)
    .reduce((sum, o) => sum + o.totalSAR, 0);

  const lowStockAlerts = products.filter(p => p.stock < 10);
  const pendingOrders = orders.filter(o => o.status === OrderStatus.PENDING);

  // Charts data calculation
  // Group orders by date (last 7 days or simple dates representation)
  const getSalesChartData = () => {
    const datesMap: { [date: string]: number } = {};
    const countMap: { [date: string]: number } = {};

    // Take last 10 completed/confirmed orders for simple visual plotting
    orders.forEach(o => {
      if (o.status !== OrderStatus.CANCELLED) {
        const dateStr = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        datesMap[dateStr] = (datesMap[dateStr] || 0) + o.totalSAR;
        countMap[dateStr] = (countMap[dateStr] || 0) + 1;
      }
    });

    const dates = Object.keys(datesMap).reverse().slice(-7);
    return dates.map(d => ({
      date: d,
      Sales: datesMap[d],
      Orders: countMap[d] * 10 // scale order line visually
    }));
  };

  const chartData = getSalesChartData();

  // Create/Update Product Action
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.id) {
      showMsg('Invalid product id provided.', true);
      return;
    }
    try {
      setLoading(true);
      await setDoc(doc(db, 'products', editingProduct.id), editingProduct);
      showMsg('Product SKU updated successfully!');
      setEditingProduct(null);
      fetchDbData();
    } catch (err: any) {
      showMsg('Could not write to products database: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewProductDraft = () => {
    const randomId = 'p-' + Math.random().toString(36).substring(2, 6);
    setEditingProduct({
      id: randomId,
      nameEn: 'Elite Turmeric Masala Powder',
      nameAr: 'مسحوق الكركم الفاخر للطبخ',
      descriptionEn: 'Carefully ground organic roots of high grade quality.',
      descriptionAr: 'جذور كركم طبيعية مطحونة بعناية وعالية الجودة.',
      sku: 'SP-TUR-' + Math.floor(Math.random() * 900 + 100),
      category: categories[0]?.id || 'cat-single',
      images: ['https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=500'],
      priceSAR: 19,
      stock: 100,
      variants: [
        { weight: '150g', priceSAR: 19, stock: 70 },
        { weight: '450g', priceSAR: 45, stock: 30 }
      ],
      rating: 5,
      reviewsCount: 1,
      isBestSeller: false,
      isNewArrival: true
    });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm('Are you absolute sure you want to delete this spice code?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', id));
      showMsg('Spice SKU successfully removed.');
      fetchDbData();
    } catch (err: any) {
      showMsg('Error deleting SKU: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Bulk Product Loader
  const handleBulkUpload = async () => {
    if (!bulkInput) return;
    try {
      setLoading(true);
      const rows = bulkInput.trim().split('\n');
      const batch = writeBatch(db);
      let count = 0;
      for (const row of rows) {
        const parts = row.split(',');
        if (parts.length < 5) continue;
        const [id, nameEn, nameAr, price, stock, cat] = parts.map(p => p.trim());
        const docRef = doc(db, 'products', id || 'p-bulk-' + Math.random().toString(36).substring(2, 5));
        batch.set(docRef, {
          id: id,
          nameEn,
          nameAr,
          priceSAR: parseFloat(price) || 20,
          stock: parseInt(stock) || 50,
          category: cat || 'cat-single',
          descriptionEn: 'Pure and premium spice mix for standard kitchen use.',
          descriptionAr: 'خلطة بهارات نقية وممتازة صالحة للاستعمال اليومي بالمطبخ العربي.',
          sku: 'SP-BULK-' + Math.floor(Math.random() * 1000),
          images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500'],
          variants: [],
          rating: 4.8,
          reviewsCount: 1,
          isBestSeller: false,
          isNewArrival: true
        });
        count++;
      }
      await batch.commit();
      showMsg(`Successfully processed ${count} items in bulk!`);
      setBulkInput('');
      fetchDbData();
    } catch (e: any) {
      showMsg('Bulk load crash: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Category Save / Add
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNameEn || !catSlug) {
      showMsg('Category English name and Web-slug are strictly required.', true);
      return;
    }
    try {
      setLoading(true);
      const newId = editingCategory?.id || 'cat-' + catSlug;
      await setDoc(doc(db, 'categories', newId), {
        id: newId,
        nameEn: catNameEn,
        nameAr: catNameAr || catNameEn,
        slug: catSlug,
        image: catImage || 'https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&q=80&w=500',
        productCount: editingCategory?.productCount || 0
      });
      showMsg('Category catalog updated.');
      setCatNameEn('');
      setCatNameAr('');
      setCatImage('');
      setCatSlug('');
      setEditingCategory(null);
      fetchDbData();
    } catch (e: any) {
      showMsg('Error writing category: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      showMsg('Category deleted.');
      fetchDbData();
    } catch (e: any) {
      showMsg(e.message, true);
    }
  };

  // Orders State transition Handler
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: new Date().toISOString()
      });
      showMsg(`Order status set to ${status}.`);
      fetchDbData();
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Order List Exporter
  const exportOrdersData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(orders, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `zafnira_orders_${Date.now()}.json`);
    dlAnchorElem.click();
    showMsg('Orders database exported as JSON record!');
  };

  // Coupon CRUD Setup
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon?.code || !editingCoupon.value) {
      showMsg('Code and rate are required fields.', true);
      return;
    }
    try {
      setLoading(true);
      const coupId = editingCoupon.id || 'c-' + editingCoupon.code.toLowerCase();
      await setDoc(doc(db, 'coupons', coupId), {
        id: coupId,
        code: editingCoupon.code.toUpperCase(),
        type: editingCoupon.type || CouponDiscountType.PERCENTAGE,
        value: Number(editingCoupon.value),
        minOrderSAR: Number(editingCoupon.minOrderSAR || 0),
        maxDiscountSAR: Number(editingCoupon.maxDiscountSAR || 999),
        usageLimit: Number(editingCoupon.usageLimit || 100),
        usedCount: editingCoupon.usedCount || 0,
        expiryDate: editingCoupon.expiryDate || '2026-12-31',
        createdAt: editingCoupon.createdAt || new Date().toISOString()
      });
      showMsg('Campaign Coupon registered!');
      setEditingCoupon(null);
      fetchDbData();
    } catch (e: any) {
      showMsg('Could not register Coupon: ' + e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('Discard coupon?')) return;
    await deleteDoc(doc(db, 'coupons', id));
    showMsg('Coupon removed.');
    fetchDbData();
  };

  // Popup CRUD Actions
  const handleSavePopup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPopup?.titleEn || !editingPopup.type) return;
    try {
      setLoading(true);
      const pId = editingPopup.id || 'pop-' + Date.now();
      await setDoc(doc(db, 'popups', pId), {
        id: pId,
        type: editingPopup.type,
        titleEn: editingPopup.titleEn,
        titleAr: editingPopup.titleAr || editingPopup.titleEn,
        contentEn: editingPopup.contentEn || '',
        contentAr: editingPopup.contentAr || '',
        imageUrl: editingPopup.imageUrl || '',
        couponId: editingPopup.couponId || '',
        isActive: editingPopup.isActive ?? true,
        createdAt: editingPopup.createdAt || new Date().toISOString()
      });
      showMsg('Popup campaign updated.');
      setEditingPopup(null);
      fetchDbData();
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePopup = async (id: string) => {
    if (!window.confirm('Delete popup?')) return;
    await deleteDoc(doc(db, 'popups', id));
    showMsg('Popup removed.');
    fetchDbData();
  };

  // CMS Content Update
  const handleUpdateCMSGlobals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalSettings) return;
    try {
      setLoading(true);
      await setDoc(doc(db, 'cms_config', 'global_settings'), globalSettings);
      showMsg('Global website settings saved with success!');
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCMSPages = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagesContent) return;
    try {
      setLoading(true);
      await setDoc(doc(db, 'cms_config', 'pages'), pagesContent);
      showMsg('Static content and policies are fully synchronized!');
    } catch (e: any) {
      showMsg(e.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Homepage builder sorting and settings re-sync
  const toggleHomeSection = async (sectionId: string) => {
    const updated = homeSections.map(col => {
      if (col.id === sectionId) return { ...col, enabled: !col.enabled };
      return col;
    });
    setHomeSections(updated);
    try {
      await setDoc(doc(db, 'cms_config', 'home_sections'), { sections: updated });
      showMsg('Section status switched!');
    } catch (err) {
      console.error(err);
    }
  };

  const moveHomeSection = async (index: number, direction: 'up' | 'down') => {
    const newIdx = direction === 'up' ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= homeSections.length) return;
    
    const raw = [...homeSections];
    const temp = raw[index];
    raw[index] = raw[newIdx];
    raw[newIdx] = temp;
    
    // Reset order index
    const finishedPr = raw.map((s, idx) => ({ ...s, order: idx + 1 }));
    setHomeSections(finishedPr);
    try {
      await setDoc(doc(db, 'cms_config', 'home_sections'), { sections: finishedPr });
      showMsg('Homepage section order updated and persisted.');
    } catch (err: any) {
      showMsg(err.message, true);
    }
  };

  const handleSaveHeroSlides = async (updatedSlides: HeroSlide[]) => {
    setHeroSlides(updatedSlides);
    try {
      setLoading(true);
      await setDoc(doc(db, 'cms_config', 'hero_slides'), { slides: updatedSlides });
      showMsg('Homepage hero slide banners updated in database!');
    } catch (err: any) {
      showMsg('Error saving slides: ' + err.message, true);
    } finally {
      setLoading(false);
    }
  };

  // Filtered lists
  const filteredProducts = products.filter(p => 
    p.nameEn.toLowerCase().includes(prodSearch.toLowerCase()) || 
    p.nameAr.includes(prodSearch) || 
    p.id.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    orderFilter === 'all' ? true : o.status === orderFilter
  );

  return (
    <div id="admin-workspace" className="min-h-screen bg-gray-100 flex flex-col md:flex-row font-sans" dir="ltr">
      {/* Sidebar for Admin Tabs */}
      <aside id="admin-sidebar" className="w-full md:w-64 bg-slate-900 text-slate-100 flex flex-col justify-between py-6 border-r border-slate-800">
        <div>
          {/* Back to Client Web Store */}
          <div className="px-6 pb-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">ZafNira Corp</h2>
              <span className="text-[10px] uppercase font-black tracking-widest text-amber-500">
                {isAr ? 'لوحة المشرف' : 'ADMIN CONTROL'}
              </span>
            </div>
            <button
              id="admin-to-shop-trigger"
              onClick={props.onBack}
              className="p-1 px-3 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md text-xs font-bold transition-all border border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {isAr ? 'المتجر' : 'Shop'}
            </button>
          </div>

          <nav id="admin-tabs" className="mt-8 px-4 space-y-1">
            <button
              id="admin-tab-btn-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{isAr ? 'لوحة التحكم' : 'Dashboard KPI'}</span>
            </button>
            <button
              id="admin-tab-btn-products"
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'products' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAr ? 'إدارة المنتجات' : 'Products CRUD'}</span>
            </button>
            <button
              id="admin-tab-btn-categories"
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'categories' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <FolderHeart className="w-4 h-4" />
              <span>{isAr ? 'إدارة الأقسام' : 'Categories'}</span>
            </button>
            <button
              id="admin-tab-btn-orders"
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'orders' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{isAr ? 'جميع الطلبات' : 'Orders Flow'}</span>
              {pendingOrders.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {pendingOrders.length}
                </span>
              )}
            </button>
            <button
              id="admin-tab-btn-coupons"
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'coupons' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <Percent className="w-4 h-4" />
              <span>{isAr ? 'الكوبونات والعروض' : 'Coupons & Discounts'}</span>
            </button>
            <button
              id="admin-tab-btn-popups"
              onClick={() => setActiveTab('popups')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'popups' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <BellRing className="w-4 h-4" />
              <span>{isAr ? 'النوافذ الإعلانية' : 'Promo Popups'}</span>
            </button>
            <button
              id="admin-tab-btn-cms"
              onClick={() => setActiveTab('cms')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'cms' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <Settings className="w-4 h-4" />
              <span>{isAr ? 'محتوى الصفحات' : 'CMS Content Page'}</span>
            </button>
            <button
              id="admin-tab-btn-homepage-builder"
              onClick={() => setActiveTab('homepage-builder')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${activeTab === 'homepage-builder' ? 'bg-amber-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}
            >
              <Package className="w-4 h-4" />
              <span>{isAr ? 'مخطط الصفحة الرئيسية' : 'Homepage Builder'}</span>
            </button>
          </nav>
        </div>

        {/* Sync Trigger */}
        <div className="px-6 border-t border-slate-800 pt-4 flex flex-col gap-2">
          {msg && (
            <div className={`p-2 rounded text-xs text-center font-bold ${msg.error ? 'bg-red-950 text-red-300 border border-red-800' : 'bg-green-950 text-green-300 border border-green-800'}`}>
              {msg.text}
            </div>
          )}
          <button
            id="admin-refresh-db-button"
            onClick={fetchDbData}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 px-3 rounded text-xs transition duration-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {isAr ? 'تحديث البيانات' : 'Sync Real-time DB'}
          </button>
        </div>
      </aside>

      {/* Main Panel Frame */}
      <main id="admin-main-view" className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* TAB 1: DASHBOARD KPI */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-950 tracking-tight">
                  {isAr ? 'مرحباً، لوحة القيادة المالية والتشغيلية' : 'Financial & Operational Command'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isAr ? 'راقب مؤشرات المبيعات والمخزون الحالية لزعفنيرا KSA' : 'Monitor sales indexes, stock quotas, and client orders logs for ZafNira KSA.'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  id="admin-export-orders-data-button"
                  onClick={exportOrdersData}
                  className="bg-slate-800 hover:bg-slate-900 border text-white font-bold text-xs py-2 px-4 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isAr ? 'تصدير البيانات' : 'Export Orders (.JSON)'}
                </button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="bg-white border rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {isAr ? 'صبي المبيعات والحرارة' : 'Total Revenue'}
                </div>
                <div className="text-2xl md:text-3xl font-black text-amber-800 mt-2">
                  {totalSalesSAR.toFixed(2)} <span className="text-xs text-gray-400">SAR</span>
                </div>
                <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {isAr ? 'الطلبات الكلية' : 'Total Orders'}
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">
                  {orders.length}
                </div>
                <div className="absolute top-4 right-4 text-amber-500 bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <ShoppingCart className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {isAr ? 'قائمة المنتجات الكلية' : 'Total Spices Catalog'}
                </div>
                <div className="text-2xl md:text-3xl font-black text-slate-800 mt-2">
                  {products.length}
                </div>
                <div className="absolute top-4 right-4 text-blue-500 bg-blue-50 p-2 rounded-lg border border-blue-100">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white border rounded-2xl p-4 md:p-6 shadow-sm relative overflow-hidden">
                <div className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  {isAr ? 'تنبيهات انخفاض المخزون' : 'Stock Alerts'}
                </div>
                <div className="text-2xl md:text-3xl font-black text-red-600 mt-2">
                  {lowStockAlerts.length}
                </div>
                <div className="absolute top-4 right-4 text-red-500 bg-red-50 p-2 rounded-lg border border-red-100">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Recharts Graphical Panel */}
            <div className="bg-white p-6 border rounded-2xl shadow-sm">
              <h3 className="text-lg font-black text-slate-900 mb-6">
                {isAr ? 'مؤشرات الرسم البياني للمبيعات (ريال سعودي)' : 'Sales Revenue & Orders Analytics'}
              </h3>
              <div className="h-72 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="Sales" name="Sales Revenue (SAR)" fill="#b45309" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    {isAr ? 'طلب أول لتوليد مؤشرات الأداء الحبيبية' : 'No sales logs data available yet for plot charts.'}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Low Stock & Recent Orders summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Low stock alerts */}
              <div className="bg-white p-6 border rounded-2xl shadow-sm">
                <h3 className="text-md font-black text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>{isAr ? 'إنذار بنقص كميات البهارات' : 'Low Stock Alert list (< 10 units)'}</span>
                </h3>
                {lowStockAlerts.length > 0 ? (
                  <div className="divide-y max-h-60 overflow-y-auto">
                    {lowStockAlerts.map(p => (
                      <div key={p.id} className="py-2.5 flex justify-between items-center text-sm">
                        <div>
                          <p className="font-bold text-gray-900">{isAr ? p.nameAr : p.nameEn}</p>
                          <p className="text-xs text-slate-500 font-mono">SKU: {p.sku}</p>
                        </div>
                        <span className="bg-red-50 text-red-700 font-black px-2.5 py-1 rounded text-xs border border-red-100">
                          {p.stock} units left
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-4">{isAr ? 'جميع البهارات متوفرة بنسب كافية بالمخازن' : 'Ideal levels! All spice catalogs are sufficiently stocked.'}</p>
                )}
              </div>

              {/* Pending Orders summary List */}
              <div className="bg-white p-6 border rounded-2xl shadow-sm">
                <h3 className="text-md font-black text-slate-900 mb-4 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-500" />
                  <span>{isAr ? 'الطلبات المعلقة الأكثر حداثة' : 'Recent Pending Orders'}</span>
                </h3>
                {pendingOrders.length > 0 ? (
                  <div className="divide-y max-h-60 overflow-y-auto text-sm">
                    {pendingOrders.slice(0, 5).map(o => (
                      <div key={o.id} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-900">{o.customerInfo.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{o.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-800">{o.totalSAR.toFixed(2)} SAR</p>
                          <span className="text-[10px] uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-extrabold">
                            {o.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm py-4">{isAr ? 'لا توجد طلبات معلقة بانتظار الشحن والتفويج' : 'Splendid! No pending orders waiting to process.'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCTS CRUD */}
        {activeTab === 'products' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-950 tracking-tight">Spice Products Catalog</h1>
                <p className="text-sm text-gray-500">{isAr ? 'إضافة وتعديل وحذف أصناف البهارات المطروحة' : 'Manage SKUs, variants weights, stock counts and prices.'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  id="admin-add-product-draft-trigger"
                  onClick={handleAddNewProductDraft}
                  className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm py-2.5 px-5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-900/10"
                >
                  <Plus className="w-4 h-4" />
                  {isAr ? 'إضافة بهار جديد' : 'Add New Spice SKU'}
                </button>
              </div>
            </div>

            {/* Bulk Loader Textarea Block */}
            <div className="bg-slate-50 border p-4 rounded-xl">
              <h3 className="text-xs uppercase font-extrabold text-slate-700 tracking-wider mb-2">
                {isAr ? 'رفع المنتجات بكميات كبيرة (CSV للسرعة)' : 'Bulk Upload Products (ID, NameEN, NameAR, BasePrice, Stock, Category)'}
              </h3>
              <textarea
                placeholder="p-ginger, Organic Ground Ginger, مسحوق الزنجبيل العضوي, 16, 90, cat-single&#10;p-onion, Dehydrated Onion Flakes, رقائق البصل المجففة, 14, 110, cat-single"
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                className="w-full h-16 p-2 text-xs font-mono border rounded bg-white"
              />
              <button
                id="admin-bulk-upload-submit"
                onClick={handleBulkUpload}
                disabled={!bulkInput}
                className="mt-2 bg-slate-800 hover:bg-slate-900 text-white font-mono font-bold text-[10px] py-1.5 px-3 rounded cursor-pointer disabled:opacity-50"
              >
                {isAr ? 'تشغيل الرفع الجماعي' : 'Run Bulk Insertion'}
              </button>
            </div>

            {/* Search filter input */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isAr ? 'البحث عن منتج عبر الاسم أو الرمز' : 'Search by title, category, id or SKU code...'}
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-amber-600 text-sm"
              />
            </div>

            {/* Edit modal or edit form drawer */}
            {editingProduct && (
              <form id="admin-product-entry-form" onSubmit={handleSaveProduct} className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-black text-amber-950 flex items-center gap-1">
                  <Edit2 className="w-4 h-4" />
                  <span>{editingProduct.id?.startsWith('p-bulk') ? 'Add Product SKU info' : 'Edit Product detail'}</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Doc ID (Unique match alphanumeric only)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono"
                      value={editingProduct.id || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, id: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">SKU Unique Code</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editingProduct.sku || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Category match ID</label>
                    <select
                      className="w-full p-2 border rounded bg-white text-xs"
                      value={editingProduct.category || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.nameEn}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Name (English)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded"
                      value={editingProduct.nameEn || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, nameEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Name (Arabic - الاسم بالعربية)</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full p-2 border rounded"
                      value={editingProduct.nameAr || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, nameAr: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Image URL (Unsplash or Hosted)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono"
                      value={editingProduct.images?.[0] || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, images: [e.target.value] })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-1">Description (English)</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      value={editingProduct.descriptionEn || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, descriptionEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Description (Arabic)</label>
                    <textarea
                      dir="rtl"
                      className="w-full p-2 border rounded"
                      value={editingProduct.descriptionAr || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, descriptionAr: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Base Price KSA (SAR)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editingProduct.priceSAR || 20}
                      onChange={(e) => setEditingProduct({ ...editingProduct, priceSAR: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Total Available Stock</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editingProduct.stock || 50}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex gap-4 items-center pt-5">
                    <label className="flex items-center gap-1 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={editingProduct.isBestSeller || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                      />
                      <span>Best Seller</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={editingProduct.isNewArrival || false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isNewArrival: e.target.checked })}
                      />
                      <span>New Arrival</span>
                    </label>
                  </div>
                </div>

                {/* Variants Editor Section */}
                <div className="bg-white p-3 border rounded-xl space-y-2 text-xs">
                  <h4 className="font-extrabold text-amber-900">Spice Packing & Weight Variants (Optional)</h4>
                  <p className="text-[10px] text-gray-500">Provide Weight, Price in SAR, and stock matching that size. Leave empty to fallback on base price.</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="font-semibold block mb-0.5">Variant 1: Size e.g '150g Bag'</span>
                      <input
                        type="text"
                        placeholder="Size/Weight"
                        className="w-full p-1.5 border rounded"
                        value={editingProduct.variants?.[0]?.weight || ''}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          if (!vars[0]) vars[0] = { weight: '', priceSAR: 0, stock: 0 };
                          vars[0].weight = e.target.value;
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold block mb-0.5">Price SAR</span>
                      <input
                        type="number"
                        placeholder="Price SAR"
                        className="w-full p-1.5 border rounded"
                        value={editingProduct.variants?.[0]?.priceSAR || 0}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          if (!vars[0]) vars[0] = { weight: '', priceSAR: 0, stock: 0 };
                          vars[0].priceSAR = Number(e.target.value);
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold block mb-0.5">Stock</span>
                      <input
                        type="number"
                        placeholder="Stock"
                        className="w-full p-1.5 border rounded"
                        value={editingProduct.variants?.[0]?.stock || 0}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          if (!vars[0]) vars[0] = { weight: '', priceSAR: 0, stock: 0 };
                          vars[0].stock = Math.round(Number(e.target.value));
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div>
                      <span className="font-semibold block mb-0.5">Variant 2: Size e.g '400g glass jar'</span>
                      <input
                        type="text"
                        placeholder="Size/Weight"
                        className="w-full p-1.5 border rounded"
                        value={editingProduct.variants?.[1]?.weight || ''}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          if (!vars[1]) vars[1] = { weight: '', priceSAR: 0, stock: 0 };
                          vars[1].weight = e.target.value;
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold block mb-0.5">Price SAR</span>
                      <input
                        type="number"
                        placeholder="Price"
                        className="w-full p-1.5 border rounded"
                        value={editingProduct.variants?.[1]?.priceSAR || 0}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          if (!vars[1]) vars[1] = { weight: '', priceSAR: 0, stock: 0 };
                          vars[1].priceSAR = Number(e.target.value);
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                      />
                    </div>
                    <div>
                      <span className="font-semibold block mb-0.5">Stock</span>
                      <input
                        type="number"
                        placeholder="Stock"
                        className="w-full p-1.5 border rounded"
                        value={editingProduct.variants?.[1]?.stock || 0}
                        onChange={(e) => {
                          const vars = [...(editingProduct.variants || [])];
                          if (!vars[1]) vars[1] = { weight: '', priceSAR: 0, stock: 0 };
                          vars[1].stock = Math.round(Number(e.target.value));
                          setEditingProduct({ ...editingProduct, variants: vars });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    id="admin-product-cancel"
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="p-2 px-4 border rounded text-xs font-semibold hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="admin-product-save"
                    type="submit"
                    className="p-2 px-6 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    Save SKU
                  </button>
                </div>
              </form>
            )}

            {/* List Table of Spice Products */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase tracking-wider font-extrabold border-b">
                      <th className="p-4">{isAr ? 'الصورة والمعلومات' : 'Spice Product details'}</th>
                      <th className="p-4">SKU / ID</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Base Price</th>
                      <th className="p-4 text-center">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/70">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=100'}
                            className="w-10 h-10 object-cover rounded shadow-inner"
                            alt="product thumbnail"
                          />
                          <div>
                            <p className="font-black text-gray-900">{isAr ? p.nameAr : p.nameEn}</p>
                            <p className="text-[10px] text-gray-500 max-w-xs truncate">{isAr ? p.descriptionAr : p.descriptionEn}</p>
                            <div className="flex gap-2 mt-1">
                              {p.isBestSeller && <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-black font-mono">BestSeller</span>}
                              {p.isNewArrival && <span className="text-[9px] bg-red-100 text-red-800 px-1 py-0.2 rounded font-black font-mono">New</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-700 lowercase">
                          <p className="font-bold">{p.sku}</p>
                          <p className="text-[9px] text-slate-400">{p.id}</p>
                        </td>
                        <td className="p-4 text-slate-600 font-semibold">{p.category}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded font-black ${p.stock < 10 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700'}`}>
                            {p.stock} units
                          </span>
                        </td>
                        <td className="p-4 font-bold text-slate-900">{p.priceSAR} SAR</td>
                        <td className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              id={`admin-prod-edit-${p.id}`}
                              onClick={() => setEditingProduct(p)}
                              className="p-1 px-2.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-200 border rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3 h-3" />
                              Edit
                            </button>
                            <button
                              id={`admin-prod-delete-${p.id}`}
                              onClick={() => handleDeleteProduct(p.id)}
                              className="p-1 px-2.5 bg-red-105 bg-red-50 hover:bg-red-100 text-red-700 border-red-100 border rounded font-semibold flex items-center gap-1 cursor-pointer transition-colors animate-pulse"
                            >
                              <Trash2 className="w-3 h-3" />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === 'categories' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h1 className="text-3xl font-black text-gray-950 tracking-tight border-b pb-4">Spice Collections Categories</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Form creator or editing */}
              <div className="bg-white p-6 border rounded-2xl shadow-sm h-fit space-y-4">
                <h3 className="text-sm uppercase font-extrabold text-amber-950 tracking-wider">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form id="admin-category-form" onSubmit={handleSaveCategory} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold mb-1">Collection NameEn</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Traditional Arabian Blends"
                      className="w-full p-2 border rounded"
                      value={catNameEn}
                      onChange={(e) => setCatNameEn(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Collection NameAr (الاسم بالعربية)</label>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      placeholder="e.g. خلطات البهارات العربية"
                      className="w-full p-2 border rounded"
                      value={catNameAr}
                      onChange={(e) => setCatNameAr(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Web-slug identifier (alphanumeric, no spaces)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. arabian-blends"
                      className="w-full p-2 border rounded font-mono"
                      value={catSlug}
                      onChange={(e) => setCatSlug(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Category Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2 border rounded font-mono"
                      value={catImage}
                      onChange={(e) => setCatImage(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    {editingCategory && (
                      <button
                        id="admin-category-cancel-edit"
                        type="button"
                        onClick={() => {
                          setCatNameEn('');
                          setCatNameAr('');
                          setCatSlug('');
                          setCatImage('');
                          setEditingCategory(null);
                        }}
                        className="flex-1 p-2 border rounded font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      id="admin-category-submit"
                      type="submit"
                      className="flex-1 p-2 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded cursor-pointer"
                    >
                      {editingCategory ? 'Persist Category' : 'Register Category'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Table View */}
              <div className="lg:col-span-2 bg-white border rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase border-b">
                      <th className="p-4">Img & Name</th>
                      <th className="p-4">Web Slug</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {categories.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50/60">
                        <td className="p-4 flex items-center gap-3">
                          <img
                            src={c.image || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100'}
                            className="w-10 h-10 object-cover rounded-md border"
                            alt="category logo"
                          />
                          <div>
                            <p className="font-bold text-gray-900">{c.nameEn}</p>
                            <p className="text-xs text-amber-800">{c.nameAr}</p>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-600">{c.slug}</td>
                        <td className="p-4 text-center">
                          <div className="flex gap-2 justify-center">
                            <button
                              id={`admin-cat-edit-${c.id}`}
                              onClick={() => {
                                setEditingCategory(c);
                                setCatNameEn(c.nameEn);
                                setCatNameAr(c.nameAr);
                                setCatSlug(c.slug);
                                setCatImage(c.image);
                              }}
                              className="p-1 px-3 bg-slate-100 hover:bg-slate-200 rounded font-semibold border cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              id={`admin-cat-delete-${c.id}`}
                              onClick={() => handleDeleteCategory(c.id)}
                              className="p-1 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 rounded font-semibold cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: ORDERS CONTROL */}
        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b pb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-950 tracking-tight">Active Orders Flow</h1>
                <p className="text-sm text-gray-500">Track shipping, update status and generate tax invoices.</p>
              </div>
              <div className="flex gap-2 bg-white p-1 border rounded-lg max-w-xs text-xs">
                <button
                  id="admin-order-filter-all"
                  onClick={() => setOrderFilter('all')}
                  className={`px-3 py-1.5 rounded transition ${orderFilter === 'all' ? 'bg-amber-800 text-white font-bold' : 'text-gray-500'}`}
                >
                  All
                </button>
                <button
                  id="admin-order-filter-pending"
                  onClick={() => setOrderFilter(OrderStatus.PENDING)}
                  className={`px-3 py-1.5 rounded transition ${orderFilter === OrderStatus.PENDING ? 'bg-amber-800 text-white font-bold' : 'text-gray-500'}`}
                >
                  Pending
                </button>
                <button
                  id="admin-order-filter-shipped"
                  onClick={() => setOrderFilter(OrderStatus.SHIPPED)}
                  className={`px-3 py-1.5 rounded transition ${orderFilter === OrderStatus.SHIPPED ? 'bg-amber-800 text-white font-bold' : 'text-gray-500'}`}
                >
                  Shipped
                </button>
              </div>
            </div>

            {/* Print preview overlay if active */}
            {activeInvoiceOrder && (
              <div id="admin-invoice-print-overlay" className="bg-slate-50 border-4 border-amber-600 rounded-2xl p-6 relative">
                <button
                  id="admin-close-invoice"
                  onClick={() => setActiveInvoiceOrder(null)}
                  className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 p-1 px-3.5 rounded font-black text-xs cursor-pointer"
                >
                  Close Receipt
                </button>
                <InvoicePrint
                  order={activeInvoiceOrder}
                  lang={props.lang}
                  currency="SAR"
                  usdRate={globalSettings?.usdExchangeRate || 0.27}
                />
              </div>
            )}

            {/* Orders logs table list */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 uppercase border-b">
                      <th className="p-4">Ref / Customer</th>
                      <th className="p-4">Purchased Spice Items</th>
                      <th className="p-4">Paid Amount</th>
                      <th className="p-4 text-center">Fulfillment Status</th>
                      <th className="p-4 text-center">Fulfillment Controls</th>
                      <th className="p-4 text-center">Print</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-gray-700">
                    {filteredOrders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/50">
                        <td className="p-4">
                          <p className="font-mono font-black text-gray-900 tracking-wider">
                            #{o.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="font-bold text-slate-700 mt-1">{o.customerInfo.name}</p>
                          <p className="text-[10px] text-slate-400">{o.customerInfo.phone}</p>
                          <span className="text-[9px] text-slate-400 block">{new Date(o.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="p-4 max-w-xs">
                          <p className="font-mono text-[10px] uppercase text-amber-900 border-b pb-1 mb-1 font-bold">
                            {o.paymentMethod.toUpperCase()} (COD/Card)
                          </p>
                          <div className="space-y-1">
                            {o.items.map((i, idx) => (
                              <p key={idx} className="text-slate-600">
                               - {i.productNameEn} ({i.weight}) x {i.quantity}
                              </p>
                            ))}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-slate-900">
                          <p className="text-sm font-black text-amber-800">{o.totalSAR.toFixed(2)} SAR</p>
                          <p className="text-[9px] text-gray-400">Tax inclusive (15%)</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-block px-3 py-1 rounded text-[10px] font-black uppercase text-white tracking-widest ${
                            o.status === 'delivered' ? 'bg-green-600' :
                            o.status === 'cancelled' ? 'bg-red-650 bg-red-600' :
                            o.status === 'shipped' ? 'bg-blue-600' :
                            'bg-amber-600'
                          }`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED ? (
                            <div className="flex flex-wrap justify-center gap-1">
                              <button
                                id={`admin-order-confirm-${o.id}`}
                                onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.CONFIRMED)}
                                className="bg-slate-100 hover:bg-slate-200 border text-slate-800 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                {isAr ? 'تأكيد' : 'Confirm'}
                              </button>
                              <button
                                id={`admin-order-proc-${o.id}`}
                                onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.PROCESSING)}
                                className="bg-slate-100 hover:bg-slate-200 border text-slate-800 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                {isAr ? 'تجهيز' : 'Process'}
                              </button>
                              <button
                                id={`admin-order-ship-${o.id}`}
                                onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.SHIPPED)}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                {isAr ? 'شحن' : 'Ship'}
                              </button>
                              <button
                                id={`admin-order-deliver-${o.id}`}
                                onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.DELIVERED)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                              >
                                {isAr ? 'توصيل' : 'Deliver'}
                              </button>
                              <button
                                id={`admin-order-cancel-${o.id}`}
                                onClick={() => handleUpdateOrderStatus(o.id, OrderStatus.CANCELLED)}
                                className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded text-[10px] font-semibold cursor-pointer"
                              >
                                {isAr ? 'إلغاء' : 'Cancel'}
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-400">Locked Process</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            id={`admin-order-print-invoice-btn-${o.id}`}
                            onClick={() => setActiveInvoiceOrder(o)}
                            className="bg-slate-800 hover:bg-slate-950 text-white font-bold p-1.5 px-3 rounded text-[10px] flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COUPONS */}
        {activeTab === 'coupons' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-950 tracking-tight">Active Coupons Manager</h1>
                <p className="text-sm text-gray-500">Provide fixed deductions or percentage discounts for the cart.</p>
              </div>
              <button
                id="admin-add-coupon-draft-trigger"
                onClick={() => setEditingCoupon({ code: 'SPICE15', type: CouponCouponTypePlaceholder, value: 15, minOrderSAR: 50, usageLimit: 200, usedCount: 0, expiryDate: '2026-12-31' })}
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm py-2 px-4 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isAr ? 'إنشاء كود عرض جديد' : 'New Promo Code'}
              </button>
            </div>

            {editingCoupon && (
              <form id="admin-coupon-form" onSubmit={handleSaveCoupon} className="bg-amber-50 p-6 border border-amber-200 rounded-2xl space-y-4 text-xs">
                <h3 className="font-extrabold text-amber-950 text-base">Register Coupon Code Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Coupon Promo Code (Uppercase)</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded font-mono uppercase"
                      value={editingCoupon.code || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Discount Type</label>
                    <select
                      className="w-full p-2 border rounded bg-white"
                      value={editingCoupon.type || 'percentage'}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, type: e.target.value as CouponDiscountType })}
                    >
                      <option value="percentage">Percentage ( % off )</option>
                      <option value="fixed">Fixed Amount ( SAR off )</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Discount Rate / Flat Value</label>
                    <input
                      type="number"
                      required
                      className="w-full p-2 border rounded"
                      value={editingCoupon.value || ''}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Minimum Order Amount (SAR)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editingCoupon.minOrderSAR || 0}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderSAR: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Max Cap Discount Amount (SAR)</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editingCoupon.maxDiscountSAR || 999}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, maxDiscountSAR: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Total Usage Limit Quota</label>
                    <input
                      type="number"
                      className="w-full p-2 border rounded"
                      value={editingCoupon.usageLimit || 100}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, usageLimit: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Campaign Expiry Date (YYYY-MM-DD)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono"
                      value={editingCoupon.expiryDate || '2026-12-31'}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, expiryDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    id="admin-coupon-cancel"
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="p-2 px-4 border rounded font-semibold hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="admin-coupon-save"
                    type="submit"
                    className="p-2 px-6 bg-amber-700 hover:bg-amber-800 text-white rounded font-bold cursor-pointer"
                  >
                    Save Coupon
                  </button>
                </div>
              </form>
            )}

            {/* List Table of Coupons */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 border-b uppercase">
                    <th className="p-4">Promo Code</th>
                    <th className="p-4">Deduction Details</th>
                    <th className="p-4">Minimum Cart</th>
                    <th className="p-4">Usage Records</th>
                    <th className="p-4">Expiry Date</th>
                    <th className="p-4 text-center">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700 font-mono">
                  {coupons.map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="p-4">
                        <span className="font-extrabold text-slate-900 bg-amber-50 border border-dashed border-amber-500 px-3 py-1.5 rounded-lg text-sm tracking-wider">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-4 font-sans font-bold text-gray-800">
                        {c.type === 'percentage' ? `${c.value}% discount` : `${c.value} SAR off`}
                      </td>
                      <td className="p-4 font-sans font-bold text-gray-900">
                        {c.minOrderSAR} SAR
                      </td>
                      <td className="p-4 font-sans font-semibold">
                        {c.usedCount} / <span className="text-gray-400">{c.usageLimit}</span> claims
                      </td>
                      <td className="p-4 text-red-650 text-red-600 font-bold">{c.expiryDate}</td>
                      <td className="p-4 text-center font-sans">
                        <div className="flex gap-2 justify-center">
                          <button
                            id={`admin-coupon-edit-btn-${c.id}`}
                            onClick={() => setEditingCoupon(c)}
                            className="p-1 px-3 bg-slate-100 hover:bg-slate-200 border rounded font-semibold cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            id={`admin-coupon-delete-btn-${c.id}`}
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-1 px-3 bg-red-50 text-red-700 hover:bg-red-100 border border-red-100 rounded font-semibold cursor-pointer animate-pulse"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: POPUPS PROMO CAMPAIGNS */}
        {activeTab === 'popups' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center border-b pb-4">
              <div>
                <h1 className="text-3xl font-black text-gray-950 tracking-tight">Promotional Popups Engine</h1>
                <p className="text-sm text-gray-500">Design dynamic notifications such as seasonal greetings or voucher code alerts.</p>
              </div>
              <button
                id="admin-add-popup-draft"
                onClick={() => setEditingPopup({ type: PopupType.WELCOME, titleEn: 'Ramadan Karim Season Special Offers', titleAr: 'عروض شهر رمضان الكريم الفاخرة', contentEn: 'Get 20% discount on entire mix powders.', contentAr: 'احصل على خصم 20٪ لجميع تشكيلات البهارات والخلطات الخاصة.', isActive: true })}
                className="bg-amber-700 hover:bg-amber-800 text-white font-bold text-sm py-2 px-4 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                {isAr ? 'إنشاء نافذة جديدة' : 'New Popup Campaign'}
              </button>
            </div>

            {editingPopup && (
              <form id="admin-popup-entry-form" onSubmit={handleSavePopup} className="bg-amber-50 p-6 border border-amber-200 rounded-2xl space-y-4 text-xs">
                <h3 className="font-extrabold text-amber-950 text-base">Setup Popup Banner Properties</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold mb-1">Trigger Type</label>
                    <select
                      className="w-full p-2 border rounded bg-white"
                      value={editingPopup.type || 'welcome'}
                      onChange={(e) => setEditingPopup({ ...editingPopup, type: e.target.value as PopupType })}
                    >
                      <option value="welcome">Welcome On Entry</option>
                      <option value="coupon">Voucher Claim Popup</option>
                      <option value="newsletter">Email Newsletter Subscribe</option>
                      <option value="announcement">Announcement Broadcast</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Coupon ID Match (If type is Coupon)</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono uppercase"
                      value={editingPopup.couponId || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, couponId: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Image Banner URL</label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded font-mono"
                      value={editingPopup.imageUrl || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, imageUrl: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Display Title (English)</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={editingPopup.titleEn || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, titleEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Display Title (Arabic - العنوان بالعربي)</label>
                    <input
                      type="text"
                      required
                      dir="rtl"
                      className="w-full p-2 border rounded"
                      value={editingPopup.titleAr || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, titleAr: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Active Status</label>
                    <select
                      className="w-full p-2 border rounded bg-white font-bold"
                      value={editingPopup.isActive === false ? 'inactive' : 'active'}
                      onChange={(e) => setEditingPopup({ ...editingPopup, isActive: e.target.value === 'active' })}
                    >
                      <option value="active">Active (Display ON)</option>
                      <option value="inactive">Paused (Display OFF)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold mb-1">Notification Summary Paragraph (English)</label>
                    <textarea
                      className="w-full p-2 border rounded"
                      value={editingPopup.contentEn || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, contentEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Notification Summary Paragraph (Arabic)</label>
                    <textarea
                      dir="rtl"
                      className="w-full p-2 border rounded"
                      value={editingPopup.contentAr || ''}
                      onChange={(e) => setEditingPopup({ ...editingPopup, contentAr: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    id="admin-popup-cancel"
                    type="button"
                    onClick={() => setEditingPopup(null)}
                    className="p-2 px-4 border rounded font-semibold hover:bg-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="admin-popup-save"
                    type="submit"
                    className="p-2 px-6 bg-amber-700 hover:bg-amber-800 text-white rounded font-bold cursor-pointer"
                  >
                    Persist Campaign
                  </button>
                </div>
              </form>
            )}

            {/* List Table of popups */}
            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 uppercase border-b">
                    <th className="p-4">Type</th>
                    <th className="p-4">Title English</th>
                    <th className="p-4">العنوان بالعربية</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-slate-700">
                  {popups.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold font-mono text-amber-800">{p.type.toUpperCase()}</td>
                      <td className="p-4 font-bold text-gray-900">{p.titleEn}</td>
                      <td className="p-4 text-amber-950 font-bold" dir="rtl">{p.titleAr}</td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${p.isActive ? 'bg-green-105 bg-green-50 text-green-700 border' : 'bg-gray-100 text-gray-400'}`}>
                          {p.isActive ? 'active' : 'paused'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            id={`admin-pop-edit-btn-${p.id}`}
                            onClick={() => setEditingPopup(p)}
                            className="p-1 px-3 bg-slate-50 hover:bg-slate-100 border rounded cursor-pointer font-semibold animate-pulse"
                          >
                            Edit
                          </button>
                          <button
                            id={`admin-pop-delete-btn-${p.id}`}
                            onClick={() => handleDeletePopup(p.id)}
                            className="p-1 px-3 bg-red-50 text-red-750 text-red-700 border border-red-100 rounded cursor-pointer font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: CMS GENERAL PAGE SETTINGS */}
        {activeTab === 'cms' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h1 className="text-3xl font-black text-gray-950 tracking-tight border-b pb-4">Content Management Studio</h1>

            {/* Sub-tab 1: Global Identity */}
            {globalSettings && (
              <form id="admin-cms-global-form" onSubmit={handleUpdateCMSGlobals} className="bg-white p-6 border rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-amber-950">1. Website Identity & Contacts Parameters</h3>
                  <p className="text-xs text-gray-500 mt-1">Manage global site headers, phone numbers, tax values and USD rates.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  <div>
                    <label className="block font-bold mb-1">E-Commerce Brand Title</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.websiteName}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, websiteName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Company Contact Email</label>
                    <input
                      type="email"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.contactEmail}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, contactEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">WhatsApp Response Number (Include country prefix e.g. +966)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded font-mono"
                      value={globalSettings.whatsappNumber}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, whatsappNumber: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Store Front Phone</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.contactPhone}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, contactPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Delivery Charge (SAR - Saudi Riyal)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.shippingFee}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, shippingFee: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Free Shipping Threshold (SAR)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.freeShippingThreshold ?? 150}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, freeShippingThreshold: Number(e.target.value) })}
                    />
                  </div>

                  <div className="md:col-span-3 border-t pt-4">
                    <p className="font-bold text-amber-900 mb-2">Configure Allowed Payment Options</p>
                    <p className="text-slate-500 text-[11px] mb-3">Turn payment choices on or off at the customer checkout screen.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 p-2.5 border rounded bg-slate-50">
                        <input
                          type="checkbox"
                          id="admin-pymt-cod"
                          checked={globalSettings.paymentCodActive ?? true}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, paymentCodActive: e.target.checked })}
                        />
                        <label htmlFor="admin-pymt-cod" className="font-bold cursor-pointer">Cash on Delivery (COD)</label>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 border rounded bg-slate-50">
                        <input
                          type="checkbox"
                          id="admin-pymt-card"
                          checked={globalSettings.paymentCardActive ?? true}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, paymentCardActive: e.target.checked })}
                        />
                        <label htmlFor="admin-pymt-card" className="font-bold cursor-pointer">Credit / Mada Cards</label>
                      </div>
                      <div className="flex items-center gap-2 p-2.5 border rounded bg-slate-50">
                        <input
                          type="checkbox"
                          id="admin-pymt-bank"
                          checked={globalSettings.paymentBankActive ?? true}
                          onChange={(e) => setGlobalSettings({ ...globalSettings, paymentBankActive: e.target.checked })}
                        />
                        <label htmlFor="admin-pymt-bank" className="font-bold cursor-pointer">Bank Transfer Option</label>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold mb-1">Bank Transfer Instruction Details (English)</label>
                    <textarea
                      rows={2}
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.paymentBankDetailsEn ?? ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, paymentBankDetailsEn: e.target.value })}
                      placeholder="Enter Bank Info and step-by-step instructions for clients..."
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block font-bold mb-1">تعليمات التحويل البنكي بالتفصيل (Arabic)</label>
                    <textarea
                      rows={2}
                      dir="rtl"
                      className="w-full p-2.5 border rounded text-right"
                      value={globalSettings.paymentBankDetailsAr ?? ''}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, paymentBankDetailsAr: e.target.value })}
                      placeholder="أدخل معلومات الحساب البنكي والتعليمات للمشتري عند الاختيار..."
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">USD Exchange conversion rate (1 SAR = x USD)</label>
                    <input
                      type="number"
                      step="0.001"
                      className="w-full p-2.5 border rounded font-mono"
                      value={globalSettings.usdExchangeRate}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, usdExchangeRate: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Instagram Link</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded font-mono"
                      value={globalSettings.instagramUrl}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, instagramUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Facebook Fan-page</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded font-mono"
                      value={globalSettings.facebookUrl}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, facebookUrl: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Twitter Account</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded font-mono"
                      value={globalSettings.twitterUrl}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, twitterUrl: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-3 border-t pt-4">
                    <p className="font-bold text-amber-900 mb-2">Social & SEO Metadata Headers</p>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Search Engine Meta Title (English)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.seoTitleEn}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, seoTitleEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Search Engine Meta Title (Arabic)</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.seoTitleAr}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, seoTitleAr: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Saudi VAT VAT Percentage Rate (%)</label>
                    <input
                      type="number"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.taxRatePercent}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, taxRatePercent: Number(e.target.value) })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold mb-1">Meta Description (English)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.seoDescEn}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, seoDescEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Meta Description (Arabic)</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full p-2.5 border rounded"
                      value={globalSettings.seoDescAr}
                      onChange={(e) => setGlobalSettings({ ...globalSettings, seoDescAr: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    id="admin-cms-global-save-btn"
                    type="submit"
                    className="p-3 px-8 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg cursor-pointer text-xs transition duration-200"
                  >
                    Save Global settings
                  </button>
                </div>
              </form>
            )}

            {/* Sub-tab 2: Static content and policies */}
            {pagesContent && (
              <form id="admin-cms-pages-form" onSubmit={handleUpdateCMSPages} className="bg-white p-6 border rounded-2xl shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-amber-950">2. Static Content, Policies & FAQs Block</h3>
                  <p className="text-xs text-gray-500 mt-1">Customize website documents content, terms and refunds policy.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                  <div>
                    <label className="block font-bold mb-1">About Us Essay En</label>
                    <textarea
                      rows={5}
                      className="w-full p-2.5 border rounded leading-relaxed"
                      value={pagesContent.aboutEn}
                      onChange={(e) => setPagesContent({ ...pagesContent, aboutEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">About Us Essay Ar</label>
                    <textarea
                      rows={5}
                      dir="rtl"
                      className="w-full p-2.5 border rounded leading-relaxed text-right"
                      value={pagesContent.aboutAr}
                      onChange={(e) => setPagesContent({ ...pagesContent, aboutAr: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Terms & Conditions (English)</label>
                    <textarea
                      rows={4}
                      className="w-full p-2.5 border rounded leading-relaxed"
                      value={pagesContent.termsEn}
                      onChange={(e) => setPagesContent({ ...pagesContent, termsEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">الشروط والأحكام (Arabic)</label>
                    <textarea
                      rows={4}
                      dir="rtl"
                      className="w-full p-2.5 border rounded leading-relaxed text-right"
                      value={pagesContent.termsAr}
                      onChange={(e) => setPagesContent({ ...pagesContent, termsAr: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Shipping & Door Delivery Policies (English)</label>
                    <textarea
                      rows={4}
                      className="w-full p-2.5 border rounded leading-relaxed"
                      value={pagesContent.shippingPolicyEn}
                      onChange={(e) => setPagesContent({ ...pagesContent, shippingPolicyEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">سياسات الشحن والخدمات (Arabic)</label>
                    <textarea
                      rows={4}
                      dir="rtl"
                      className="w-full p-2.5 border rounded leading-relaxed text-right"
                      value={pagesContent.shippingPolicyAr}
                      onChange={(e) => setPagesContent({ ...pagesContent, shippingPolicyAr: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Return & Food Safety Regulations (English)</label>
                    <textarea
                      rows={4}
                      className="w-full p-2.5 border rounded leading-relaxed"
                      value={pagesContent.returnPolicyEn}
                      onChange={(e) => setPagesContent({ ...pagesContent, returnPolicyEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">سياسات استرجاع السلع التالفة (Arabic)</label>
                    <textarea
                      rows={4}
                      dir="rtl"
                      className="w-full p-2.5 border rounded leading-relaxed text-right"
                      value={pagesContent.returnPolicyAr}
                      onChange={(e) => setPagesContent({ ...pagesContent, returnPolicyAr: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 border-t pt-4">
                    <p className="font-bold text-amber-900 mb-2">Top Banner Announcement Bar Alert</p>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Announcement Text (English)</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border rounded"
                      value={pagesContent.announcementTextEn}
                      onChange={(e) => setPagesContent({ ...pagesContent, announcementTextEn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Announcement Text (Arabic)</label>
                    <input
                      type="text"
                      dir="rtl"
                      className="w-full p-2.5 border rounded text-right"
                      value={pagesContent.announcementTextAr}
                      onChange={(e) => setPagesContent({ ...pagesContent, announcementTextAr: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    id="admin-cms-pages-save-btn"
                    type="submit"
                    className="p-3 px-8 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg cursor-pointer text-xs"
                  >
                    Persist Pages & FAQs settings
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 8: HOMEPAGE BUILDER SECTION LAYOUT */}
        {activeTab === 'homepage-builder' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h1 className="text-3xl font-black text-gray-950 tracking-tight">Real-Time Homepage Layout Builder</h1>
              <p className="text-sm text-gray-400 mt-1">Re-order blocks, disable/enable sliders, and customize visual hierarchy cleanly without touching code.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div className="bg-white p-6 border rounded-2xl shadow-sm h-fit space-y-4">
                <h3 className="text-md font-extrabold text-amber-950 uppercase tracking-wide border-b pb-2">
                  Layout Structural Sections Order
                </h3>
                
                <div className="space-y-2.5 text-xs">
                  {homeSections.map((sect, idx) => (
                    <div key={sect.id} className="p-3 border rounded-xl flex items-center justify-between bg-slate-50 transition border-amber-900/10 hover:border-amber-900/40">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-amber-600 font-mono w-4">#{idx+1}</span>
                        <div>
                          <p className="font-bold text-slate-800">{sect.titleEn}</p>
                          <p className="text-[10px] text-amber-800 font-semibold">{sect.titleAr}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Status Switcher */}
                        <button
                          id={`admin-cms-toggle-sect-${sect.id}`}
                          onClick={() => toggleHomeSection(sect.id)}
                          className={`p-1 px-2 rounded text-[10px] font-bold ${sect.enabled ? 'bg-green-105 bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border'}`}
                        >
                          {sect.enabled ? 'Active' : 'Disabled'}
                        </button>
                        {/* Position controls */}
                        <button
                          id={`admin-cms-moveup-sect-${sect.id}`}
                          onClick={() => moveHomeSection(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 px-1.5 bg-white border rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold"
                          title="Move up"
                        >
                          ▲
                        </button>
                        <button
                          id={`admin-cms-movedown-sect-${sect.id}`}
                          onClick={() => moveHomeSection(idx, 'down')}
                          disabled={idx === homeSections.length - 1}
                          className="p-1 px-1.5 bg-white border rounded hover:bg-slate-100 disabled:opacity-30 cursor-pointer font-bold"
                          title="Move down"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Real-time preview indicator simulator */}
              <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl border-4 border-slate-800 space-y-4 max-w-sm">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-amber-500 font-mono">LIVE LAYOUT PREVIEW</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
                </div>
                <p className="text-xs text-slate-400">Simulation of what mobile clients experience based on order configurations above:</p>
                <div className="space-y-1.5 font-mono text-[10px]">
                  <div className="p-1 bg-slate-800 text-center border text-slate-400 border-slate-700">{isAr ? '--- أسفل الصفحة: الفوتر ومعلومات الاتصال ---' : '=== BOTTOM FOOTER LINKS ==='}</div>
                </div>
              </div>
            </div>

            {/* Carousel Hero Slides Editor */}
            <div className="bg-white p-6 border rounded-2xl shadow-sm space-y-6 mt-8">
              <div className="flex flex-col sm:flex-row border-b pb-4 gap-4 justify-between items-start sm:items-center">
                <div>
                  <h3 className="text-lg font-black text-amber-950 uppercase tracking-tight">
                    Homepage Carousel Banner Slides
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">Configure background images, marketing slogans, and action buttons for sliding layouts.</p>
                </div>
                <button
                  id="admin-add-slide-trigger"
                  type="button"
                  onClick={() => {
                    const newSlide: HeroSlide = {
                      id: 'slide-' + Math.random().toString(36).substring(2, 6),
                      titleEn: 'Sacred Spices Blend Collection',
                      titleAr: 'مجموعة توابل الشرق الفاخرة',
                      descEn: 'Authentic 100% natural spices freshly ground for delicious cuisine.',
                      descAr: 'بهارات طبيعية أصيلة 100٪ مطحونة طازجة لأشهى المأكولات الشعبية.',
                      buttonTextEn: 'Explore Blends',
                      buttonTextAr: 'استكشف البهارات',
                      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
                    };
                    setHeroSlides([...heroSlides, newSlide]);
                  }}
                  className="p-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto sm:ml-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Slide Banner
                </button>
              </div>

              {heroSlides.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs border border-dashed rounded-xl">
                  No slide banners registered. Click Add Slide above to configure one.
                </div>
              ) : (
                <div className="space-y-8 divide-y divide-slate-100">
                  {heroSlides.map((slide, sIdx) => (
                    <div key={slide.id} className="pt-6 first:pt-0 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="bg-amber-100 text-amber-900 font-bold px-3 py-1 text-xs rounded-full">
                          Slide #{sIdx + 1}
                        </span>
                        <button
                          id={`admin-delete-slide-${slide.id}`}
                          type="button"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this slide?')) {
                              const updated = heroSlides.filter(s => s.id !== slide.id);
                              setHeroSlides(updated);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete Slide
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block font-bold mb-1">Banner Image URL</label>
                          <input
                            type="text"
                            className="w-full p-2.5 border rounded font-mono"
                            value={slide.imageUrl}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].imageUrl = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Button Redirect Text (English)</label>
                          <input
                            type="text"
                            className="w-full p-2.5 border rounded"
                            value={slide.buttonTextEn}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].buttonTextEn = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Title (English)</label>
                          <input
                            type="text"
                            className="w-full p-2.5 border rounded"
                            value={slide.titleEn}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].titleEn = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">العنوان (Arabic)</label>
                          <input
                            type="text"
                            dir="rtl"
                            className="w-full p-2.5 border rounded text-right"
                            value={slide.titleAr}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].titleAr = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Description Subtitle (English)</label>
                          <textarea
                            rows={2}
                            className="w-full p-2.5 border rounded"
                            value={slide.descEn}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].descEn = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">الوصف الفرعي (Arabic)</label>
                          <textarea
                            rows={2}
                            dir="rtl"
                            className="w-full p-2.5 border rounded text-right"
                            value={slide.descAr}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].descAr = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                        <div>
                          <label className="block font-bold mb-1">Button Redirect Text (Arabic)</label>
                          <input
                            type="text"
                            dir="rtl"
                            className="w-full p-2.5 border rounded text-right"
                            value={slide.buttonTextAr}
                            onChange={(e) => {
                              const updated = [...heroSlides];
                              updated[sIdx].buttonTextAr = e.target.value;
                              setHeroSlides(updated);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end pt-5">
                    <button
                      id="admin-save-slides-trigger"
                      type="button"
                      onClick={() => handleSaveHeroSlides(heroSlides)}
                      className="p-3 px-8 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-xl text-xs cursor-pointer flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Save Banner Slides Changes
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Simple constants or helpers to bypass rules
const CouponCouponTypePlaceholder = CouponDiscountType.PERCENTAGE;
