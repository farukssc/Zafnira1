import { 
  CMSGlobalSettings, 
  CMSPagesContent, 
  HomeSection, 
  HeroSlide, 
  Category, 
  Product,
  Coupon,
  PopupConfig,
  PopupType,
  CouponDiscountType
} from '../types';

export const defaultGlobalSettings: CMSGlobalSettings = {
  websiteName: 'ZafNira Spices',
  logoUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=100', // Mini logo
  faviconUrl: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=32',
  contactEmail: 'info@zafnira.com',
  contactPhone: '+966 50 123 4567',
  whatsappNumber: '+966501234567',
  facebookUrl: 'https://facebook.com/zafnira',
  instagramUrl: 'https://instagram.com/zafnira',
  twitterUrl: 'https://twitter.com/zafnira',
  shippingFee: 15, // SAR
  freeShippingThreshold: 150, // SAR
  paymentCodActive: true,
  paymentCardActive: true,
  paymentBankActive: true,
  paymentBankDetailsEn: 'Al Rajhi Bank - IBAN: SA82 8000 0000 1234 5678 9012. Please send transaction screenshot to our WhatsApp after placing the order.',
  paymentBankDetailsAr: 'مصرف الراجحي - الأيبان: SA82 8000 0000 1234 5678 9012. يرجى إرسال لقطة شاشة للتحويل المالي عبر الواتساب لتأكيد الطلب.',
  taxRatePercent: 15, // 15% VAT Saudi
  usdExchangeRate: 0.27, // 1 SAR = 0.27 USD
  seoTitleEn: 'ZafNira | Premium Arabic & International Spices Online',
  seoTitleAr: 'زعفنيرا | بهارات عربية وعالمية فاخرة أونلاين',
  seoDescEn: 'Shop authentic, freshly grounded premium spices including Turmeric, Persian Saffron, Garam Masala, Red Chili, and cumin at best prices in KSA.',
  seoDescAr: 'تسوق التوابل والبهارات الطازجة والفاخرة بما في ذلك الكركم، الزعفران، غارام ماسالا، الفلفل الأحمر والكمون بأفضل الأسعار في المملكة.'
};

export const defaultHomeSections: HomeSection[] = [
  { id: 'hero', titleEn: 'Main Slider Banner', titleAr: 'البانر الرئيسي المنزلق', enabled: true, order: 1 },
  { id: 'features', titleEn: 'Why Choose Us', titleAr: 'لماذا تختارنا', enabled: true, order: 2 },
  { id: 'new-arrivals', titleEn: 'New Arrivals', titleAr: 'وصل حديثاً', enabled: true, order: 3 },
  { id: 'categories', titleEn: 'Spice Categories', titleAr: 'أقسام البهارات', enabled: true, order: 4 },
  { id: 'bestsellers', titleEn: 'Best Sellers', titleAr: 'الأكثر مبيعاً', enabled: true, order: 5 },
  { id: 'about-preview', titleEn: 'About Us Sneak-Peep', titleAr: 'نبذة عنا', enabled: true, order: 6 },
  { id: 'reviews', titleEn: 'Customer Reviews', titleAr: 'آراء العملاء', enabled: true, order: 7 }
];

export const defaultHeroSlides: HeroSlide[] = [
  {
    id: 's1',
    titleEn: 'Sacred Flavors of Heritage',
    titleAr: 'النكهات الكلاسيكية الأصيلة',
    descEn: '100% Pure, freshly grounded traditional spices from farm to your kitchen.',
    descAr: 'نقية 100٪، بهارات تقليدية مطحونة طازجة من المزارع مباشرة إلى مطبخك.',
    buttonTextEn: 'Explore Spices',
    buttonTextAr: 'استكشف البهارات',
    imageUrl: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=1200'
  },
  {
    id: 's2',
    titleEn: 'Signature Garam Masala Blend',
    titleAr: 'خلطتنا الخاصة غارام ماسالا',
    descEn: 'Enrich your dishes with authentic premium blends curated by world-class chefs.',
    descAr: 'أثري أطباقك بخلطات فاخرة أصيلة أعدها نخبة من خبراء الطهي والبهارات.',
    buttonTextEn: 'Buy Blend Now',
    buttonTextAr: 'اشتر الخلطة الآن',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1200'
  }
];

export const defaultPagesContent: CMSPagesContent = {
  aboutEn: 'At ZafNira, we believe that seasoning is the soul of every meal. For generations, KSA kitchens have flourished with richness of genuine oriental aroma. ZafNira brings you curated, hygienically packaged, premium quality spice powders from handpicked single-origin fields in Sri Lanka, India, and Iran. From the vibrant color of our Turmeric to the exquisite warmth of our flagship Garam Masala, each grain is processed to retain standard volatile oils.',
  aboutAr: 'في زعفنيرا، نؤمن بأن البهارات والتتبيل هي روح كل وجبة. لأجيال، ازدهرت المطابخ السعودية بغنى الروائح الشرقية الأصيلة. تقدم لك زعفنيرا حبوب بهارات منتقاة بعناية ومعبأة صحياً من مزارع فردية المنشأ في سريلانكا والهند وإيران. من اللون النابض بالحياة للكركم إلى الدفء الرائع لخلطتنا الخاصة غارام ماسالا، يتم معالجة كل حبة للحفاظ على الزيوت العطرية الطبيعية.',
  aboutImageUrl: 'https://images.unsplash.com/photo-1532336414038-cf1905047b2c?auto=format&fit=crop&q=80&w=800',
  contactEn: 'Our support desk is active Saturday to Thursday: 9:00 AM to 9:00 PM. Fill out the contact form below or connect via fast reply WhatsApp chat directly.',
  contactAr: 'مكتب الدعم الفني متاح من السبت إلى الخميس: من 9:00 صباحاً حتى 9:00 مساءً. املأ نموذج الاتصال أو تواصل مباشرة عبر المحادثة السريعة واتساب.',
  termsEn: 'All products sold on ZafNira are certified and subject to food safety standards of KSA. Prices are listed in SAR and include 15% VAT where applicable. Shipping is processed within 24-48 hours inside major cities.',
  termsAr: 'جميع المنتجات المباعة في زعفنيرا معتمدة وتخضع لمعايير وسلامة الغذاء في المملكة العربية السعودية. الأسعار مدرجة بالريال السعودي وتشمل ضريبة القيمة المضافة 15٪. يتم شحن الطلبات خلال 24-48 ساعة داخل المدن الرئيسية.',
  privacyEn: 'ZafNira respects your absolute digital privacy. We protect customer contact credentials and store transactional data securely under modern Firestore authentication schemas. We never share your shipping address or phone logs with third-party aggregators.',
  privacyAr: 'تحترم زعفنيرا خصوصيتك الرقمية المطلقة. نقوم بحماية بيانات اتصال العملاء وتخزين معلومات المعاملات بشكل آمن بموجب بروتوكولات حماية متطورة. لا نشارك أبداً بيانات عنوان الشحن أو سجلات هاتفك مع أي أطراف خارجية.',
  returnPolicyEn: 'Due to hygienic and food-safety regulations, spices and food items are non-returnable unless the external safety seal was broken during transit, or a wrong SKU was delivered. Contact support with snapshot within 3 days of delivery.',
  returnPolicyAr: 'نظراً لأنظة سلامة الأغذية والصحة العامة، فإن البهارات والمواد الغذائية غير قابلة للإرجاع إلا في حال تلف الختم الخارجي للأمان أثناء الشحن أو توصيل صنف غير صحيح. يرجى الاتصال بالدعم مع إرفاق صورة خلال 3 أيام من الاستلام.',
  shippingPolicyEn: 'We provide express door delivery across Riyadh within 24 hours, and standard KSA shipping to Jeddah, Dammam, Mecca, and other provinces in 2-4 working days. Delivery is free for orders exceeding 150 SAR.',
  shippingPolicyAr: 'نوفر خدمة التوصيل السريع لباب البيت داخل الرياض في غضون 24 ساعة، وشحن قياسي لجميع مدن المملكة (جدة، الدمام، مكة، وبقية المناطق) خلال 2-4 أيام عمل. التوصيل مجاني للطلبات فوق 150 ريال.',
  faqs: [
    {
      id: 'faq1',
      questionEn: 'Are ZafNira spices organic or preservative-free?',
      questionAr: 'هل بهارات زعفنيرا عضوية وخالية من المواد الحافظة؟',
      answerEn: 'Yes, 100% of our single spices and custom blends are raw, organic, with no MSG, colors or industrial preservatives added.',
      answerAr: 'نعم، بهاراتنا الفردية والمخاليط الخاصة طبيعية 100٪، وخالية تماماً من الغلوتامات أحادية الصوديوم والمواد الملونة والمحافظ الصناعية.'
    },
    {
      id: 'faq2',
      questionEn: 'Do you offer bulk spice bags for hotels or restaurants?',
      questionAr: 'هل توفرون بهارات بكميات تجارية للفنادق والمطاعم؟',
      answerEn: 'Yes! Please contact our corporate wing via WhatsApp or email for custom packaging (5kg/10kg bags) at wholesale dynamic pricing.',
      answerAr: 'نعم بالتأكيد! يرجى التواصل مع قسم الشركات والمطاعم عبر الواتساب أو البريد للحصول على تغليف خاص (حقائب بوزن 5 كجم / 10 كجم) بأسعار خاصة.'
    }
  ],
  announcementTextEn: '🔥 Limited Offer: Use coupon SPICE10 for 10% Discount on all blends! Free shipping over 150 SAR.',
  announcementTextAr: '🔥 عرض محدود: استخدم كوبون SPICE10 للحصول على خصم 10٪ لجميع البهارات! شحن مجاني فوق 150 ريال.',
  announcementActive: true,
  flashSaleActive: true,
  flashSaleEnd: '2026-06-30T23:59:59Z',
  flashSaleDiscountPercent: 15
};

export const defaultCategories: Category[] = [
  {
    id: 'cat-single',
    nameEn: 'Pure Raw Spices',
    nameAr: 'البهارات الفردية الصافية',
    slug: 'pure-raw-spices',
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=500',
    productCount: 4
  },
  {
    id: 'cat-blends',
    nameEn: 'Traditional Arabian Blends',
    nameAr: 'خلطات البهارات العربية والشرقية',
    slug: 'arabian-blends',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500',
    productCount: 2
  }
];

export const defaultProducts: Product[] = [
  {
    id: 'p-turmeric',
    nameEn: 'Organic Turmeric Powder (Alleppey)',
    nameAr: 'مسحوق الكركم العضوي (أليبي الفاخر)',
    descriptionEn: 'High-curcumin ground turmeric from Alleppey, known for its warm, woody aroma and deep golden-yellow color. Perfect health companion and dietary enhancer.',
    descriptionAr: 'كركم مطحون غني بمادة الكركمين من منطقة أليبي الهندية، يتميز برائحته الخشبية الدافئة ولونه الذهبي العميق المشرق. رفيق رائع للصحة وتتبيل الطعام اليومي.',
    sku: 'SP-TUR-101',
    category: 'cat-single',
    images: [
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=500',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500'
    ],
    priceSAR: 18,
    stock: 120,
    variants: [
      { weight: '150g Bag', priceSAR: 18, stock: 90 },
      { weight: '400g Premium Jar', priceSAR: 38, stock: 30 }
    ],
    rating: 4.8,
    reviewsCount: 45,
    reviews: [
      { userName: 'Ahmed Al-Sudairy', rating: 5, comment: 'Very pure, the scent is strong and absolutely authentic KSA taste!', createdAt: '2026-05-20' },
      { userName: 'Leila Farhat', rating: 4, comment: 'Beautiful golden color. Jar design is robust.', createdAt: '2026-05-23' }
    ],
    isBestSeller: true,
    isNewArrival: false
  },
  {
    id: 'p-redchili',
    nameEn: 'Kashmiri Red Chili Powder',
    nameAr: 'مسحوق الفلفل الأحمر الكشميري',
    descriptionEn: 'Gives the famous vibrant red color with mild, pleasant heat. Perfectly sun-dried and finely crushed under cold milling processes.',
    descriptionAr: 'يعطي اللون الأحمر النابض بالحياة مع حرارة معتدلة ومستساغة. مجفف بالشمس ومطحون بشكل ناعم في درجات حرارة منخفضة للحفاظ على النكهة.',
    sku: 'SP-RCH-102',
    category: 'cat-single',
    images: [
      'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&q=80&w=500',
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500'
    ],
    priceSAR: 15,
    stock: 85,
    variants: [
      { weight: '150g Bag', priceSAR: 15, stock: 60 },
      { weight: '350g Premium Jar', priceSAR: 32, stock: 25 }
    ],
    rating: 4.9,
    reviewsCount: 38,
    reviews: [
      { userName: 'Majed Otaibi', rating: 5, comment: 'The best Kashmiri chili in Saudi! Great color but not overly spicy.', createdAt: '2026-05-18' }
    ],
    isBestSeller: true,
    isNewArrival: true
  },
  {
    id: 'p-coriander',
    nameEn: 'Fresh Crushed Coriander Powder',
    nameAr: 'مسحوق الكزبرة المطحونة طازجاً',
    descriptionEn: 'Earthy with citrus nodes. Handpicked Coriander seeds carefully extracted to render the ideal texture for meat, stews, and traditional Arabic Kabsa dishes.',
    descriptionAr: 'نكهة ترضية غنية مع نوتة حمضيات خفيفة. حبوب كزبرة منتقاة يدوياً ومطحونة لتناسب تتبيل اللحوم، الإيدامات والكبسة السعودية التقليدية.',
    sku: 'SP-COR-103',
    category: 'cat-single',
    images: [
      'https://images.unsplash.com/photo-1608797178974-15b35a61d121?auto=format&fit=crop&q=80&w=500'
    ],
    priceSAR: 14,
    stock: 140,
    variants: [
      { weight: '100g Bag', priceSAR: 14, stock: 100 },
      { weight: '300g Premium Jar', priceSAR: 29, stock: 40 }
    ],
    rating: 4.7,
    reviewsCount: 22,
    reviews: [],
    isBestSeller: false,
    isNewArrival: false
  },
  {
    id: 'p-cumin',
    nameEn: 'Elite Cumin Powder',
    nameAr: 'مسحوق الكمون الفاخر',
    descriptionEn: 'Roasted seeds processed directly into fine aromatic dust. Essential for Arabian soups, hummuses, and grilled fish seasonings.',
    descriptionAr: 'حبوب كمون محمصة مطحونة بعناية لرائحة وافرة. ركن أساسي في الشوربات العربية، الحمص، وتتبيل الأسماك والمشويات.',
    sku: 'SP-CUM-104',
    category: 'cat-single',
    images: [
      'https://images.unsplash.com/photo-1593001874130-4e970bfde769?auto=format&fit=crop&q=80&w=500'
    ],
    priceSAR: 16,
    stock: 95,
    variants: [
      { weight: '150g Bag', priceSAR: 16, stock: 70 },
      { weight: '350g Premium Jar', priceSAR: 33, stock: 25 }
    ],
    rating: 4.6,
    reviewsCount: 19,
    reviews: [],
    isBestSeller: false,
    isNewArrival: true
  },
  {
    id: 'p-garam',
    nameEn: 'Royal Indian Garam Masala Blend',
    nameAr: 'بهارات غارام ماسالا الهندية الملكية',
    descriptionEn: 'A balanced blend of cardamom, cloves, cinnamon, pepper, and mace. Delivers deep warmth, exquisite aroma, and spicy nodes to gourmet gravies.',
    descriptionAr: 'مزيج متوازن ومحمص من الهيل، القرنفل، القرفة، الفلفل ومسحوق جوزة الطيب. يضفي دفئاً عميقاً ورائحة زكية غنية للمرق والأرز الفاخر.',
    sku: 'SP-GAR-201',
    category: 'cat-blends',
    images: [
      'https://images.unsplash.com/photo-1532336414038-cf1905047b2c?auto=format&fit=crop&q=80&w=500',
      'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&q=80&w=500'
    ],
    priceSAR: 22,
    stock: 150,
    variants: [
      { weight: '150g Bag', priceSAR: 22, stock: 100 },
      { weight: '400g Premium Jar', priceSAR: 45, stock: 50 }
    ],
    rating: 4.9,
    reviewsCount: 56,
    reviews: [
      { userName: 'Nouf Al-Harbi', rating: 5, comment: 'Phenomenal spice! The aroma is amazing. Will purchase monthly!', createdAt: '2026-05-15' }
    ],
    isBestSeller: true,
    isNewArrival: false
  },
  {
    id: 'p-kabsa',
    nameEn: 'Signature Najdi Kabsa Spice Mix',
    nameAr: 'بهارات الكبسة الكبسة النجدية الفاخرة',
    descriptionEn: 'Crafted with premium black dried limes (Loomi), green cardamom, clove, and bay leaves. Perfect for achieving authentic Saudi restaurant style Biryani & Kabsa.',
    descriptionAr: 'خلطتنا الخاصة والمبتكرة محبكة بالليمون الأسود المجفف (لومي)، الهيل الأخضر، القرنفل وأوراق الغار. مثالية لإعداد كبسة سعودية وسليق على أصوله كالمطاعم الفاخرة.',
    sku: 'SP-KAB-202',
    category: 'cat-blends',
    images: [
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500'
    ],
    priceSAR: 24,
    stock: 130,
    variants: [
      { weight: '180g Bag', priceSAR: 24, stock: 80 },
      { weight: '400g Premium Jar', priceSAR: 48, stock: 50 }
    ],
    rating: 4.9,
    reviewsCount: 74,
    reviews: [
      { userName: 'Bandar Al-Dossary', rating: 5, comment: 'An amazing secret ingredient for rice. Highly recommended!', createdAt: '2026-05-24' }
    ],
    isBestSeller: true,
    isNewArrival: true
  }
];

export const defaultCoupons: Coupon[] = [
  {
    id: 'c-spice10',
    code: 'SPICE10',
    type: CouponDiscountType.PERCENTAGE,
    value: 10,
    minOrderSAR: 40,
    maxDiscountSAR: 50,
    usageLimit: 100,
    usedCount: 14,
    expiryDate: '2026-12-31',
    createdAt: '2026-05-26'
  },
  {
    id: 'c-saudi15',
    code: 'ZAFNIRA15',
    type: CouponDiscountType.FIXED,
    value: 15, // 15 SAR off
    minOrderSAR: 90,
    maxDiscountSAR: 15,
    usageLimit: 500,
    usedCount: 65,
    expiryDate: '2026-08-31',
    createdAt: '2026-05-26'
  }
];

export const defaultPopups: PopupConfig[] = [
  {
    id: 'pop-welcome',
    type: PopupType.WELCOME,
    titleEn: 'Welcome to ZafNira Premium Spice House',
    titleAr: 'مرحباً بكم في بيت بهارات زعفنيرا الفاخرة',
    contentEn: 'Register today to receive a free single-origin spices handbook & explore freshly grounded Arabic, Persian, and Indian spices directly deliverable inside KSA.',
    contentAr: 'سجل معنا اليوم للحصول على كتيب مجاني عن أسرار البهارات الطازجة والتوابل الهندية والعربية الفاخرة المتاحة للتوصيل الفوري لمدن المملكة.',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=500',
    isActive: true,
    createdAt: '2026-05-26'
  }
];
