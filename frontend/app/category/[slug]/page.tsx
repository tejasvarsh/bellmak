'use client'
import { useEffect, useState, use, useRef, useMemo, useCallback } from 'react'
import api from '@/lib/api'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'
import { SlidersHorizontal, RefreshCw } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// CATEGORY META
// ─────────────────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
  name: string; emoji: string; desc: string; aliases: string[]
}> = {
  'mobiles':      { name: 'Mobiles & Smartphones', emoji: '📱', desc: 'Latest smartphones from top brands', aliases: ['mobiles','mobile','smartphones','mobile phones','phone'] },
  'fashion':      { name: 'Fashion & Clothing',    emoji: '👗', desc: 'Trending styles for men, women & kids', aliases: ['fashion','clothing','clothes','apparel','wear'] },
  'electronics':  { name: 'Electronics',           emoji: '💻', desc: 'Laptops, TVs, Audio & more', aliases: ['electronics','electronic','gadgets','tech'] },
  'home-kitchen': { name: 'Home & Kitchen',        emoji: '🏠', desc: 'Everything for your home starting ₹199', aliases: ['home-kitchen','home & kitchen','home and kitchen','home','kitchen'] },
  'beauty':       { name: 'Beauty & Personal Care',emoji: '💄', desc: 'Skincare, haircare, makeup & more', aliases: ['beauty','personal care','skincare','cosmetics','makeup'] },
  'sports':       { name: 'Sports & Fitness',      emoji: '⚽', desc: 'Gear up for your active lifestyle', aliases: ['sports','fitness','sports & fitness','gym'] },
  'books':        { name: 'Books & Stationery',    emoji: '📚', desc: 'Bestsellers, textbooks & more', aliases: ['books','book','stationery','education'] },
  'toys':         { name: 'Toys & Games',          emoji: '🧸', desc: 'Fun for kids of all ages', aliases: ['toys','games','toy','kids'] },
  'grocery':      { name: 'Grocery & Essentials',  emoji: '🛒', desc: 'Daily essentials delivered fast', aliases: ['grocery','groceries','food','essentials'] },
  'appliances':   { name: 'Appliances',            emoji: '🔌', desc: 'Home & kitchen appliances from top brands', aliases: ['appliances','appliance','home appliances'] },
  'furniture':    { name: 'Furniture',             emoji: '🪑', desc: 'Modern furniture for every room', aliases: ['furniture','sofa','chairs','tables'] },
  'automotive':   { name: 'Automotive',            emoji: '🚗', desc: 'Car & bike accessories', aliases: ['automotive','auto','car','bike'] },
}

// ─────────────────────────────────────────────────────────────
// DUMMY DATA — static, no network needed
// ─────────────────────────────────────────────────────────────
const DUMMY: Record<string, any[]> = {
  mobiles: [
    { id:'m1',  title:'Samsung Galaxy S23 Ultra 5G 256GB',  price:89999,  mrp:124999, discount:28, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=S23'],     avgRating:4.5, totalReviews:2341, slug:'samsung-s23',   stock:10 },
    { id:'m2',  title:'Apple iPhone 15 Pro Max 256GB',      price:134900, mrp:159900, discount:16, images:['https://placehold.co/280x280/f9fafb/374151?text=iPhone'],  avgRating:4.8, totalReviews:4567, slug:'iphone-15',     stock:5  },
    { id:'m3',  title:'OnePlus 12 5G 12GB+256GB',           price:64999,  mrp:74999,  discount:13, images:['https://placehold.co/280x280/f0f9ff/0ea5e9?text=OnePlus'], avgRating:4.4, totalReviews:1230, slug:'oneplus-12',    stock:15 },
    { id:'m4',  title:'Poco X6 Pro 5G 8GB+256GB',           price:22999,  mrp:29999,  discount:23, images:['https://placehold.co/280x280/fff7ed/f97316?text=Poco'],    avgRating:4.2, totalReviews:890,  slug:'poco-x6',      stock:30 },
    { id:'m5',  title:'Redmi Note 13 Pro 5G 8GB+256GB',     price:24999,  mrp:31999,  discount:22, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=Redmi'],   avgRating:4.3, totalReviews:1540, slug:'redmi-note-13', stock:25 },
    { id:'m6',  title:'Realme 12 Pro+ 5G 8GB+256GB',        price:26999,  mrp:36999,  discount:27, images:['https://placehold.co/280x280/fdf4ff/a855f7?text=Realme'],  avgRating:4.1, totalReviews:670,  slug:'realme-12',    stock:20 },
    { id:'m7',  title:'Vivo V30 5G 8GB+256GB',              price:29999,  mrp:37999,  discount:21, images:['https://placehold.co/280x280/ecfdf5/059669?text=Vivo'],    avgRating:4.0, totalReviews:450,  slug:'vivo-v30',     stock:18 },
    { id:'m8',  title:'OPPO Reno 11 Pro 5G 12GB+256GB',     price:34999,  mrp:44999,  discount:22, images:['https://placehold.co/280x280/fefce8/ca8a04?text=OPPO'],    avgRating:4.1, totalReviews:380,  slug:'oppo-reno11',  stock:12 },
    { id:'m9',  title:'Nothing Phone 2 12GB+256GB',          price:44999,  mrp:54999,  discount:18, images:['https://placehold.co/280x280/f1f5f9/475569?text=Nothing'], avgRating:4.4, totalReviews:760,  slug:'nothing-2',    stock:8  },
    { id:'m10', title:'iQOO 12 5G 12GB+256GB',              price:52999,  mrp:64999,  discount:18, images:['https://placehold.co/280x280/eff6ff/1d4ed8?text=iQOO'],    avgRating:4.5, totalReviews:540,  slug:'iqoo-12',      stock:14 },
  ],
  fashion: [
    { id:'f1', title:'Allen Solly Men Slim Fit Shirt',  price:899,  mrp:1799, discount:50, images:['https://placehold.co/280x280/fdf4ff/9333ea?text=AllenSolly'], avgRating:4.3, totalReviews:1230, slug:'allen-solly',  stock:50 },
    { id:'f2', title:"Levi's 511 Slim Fit Jeans Men",  price:2399, mrp:3999, discount:40, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=Levis'],      avgRating:4.5, totalReviews:2340, slug:'levis-511',    stock:40 },
    { id:'f3', title:'W for Woman Printed Kurta Set',   price:1199, mrp:2499, discount:52, images:['https://placehold.co/280x280/fdf2f8/ec4899?text=W+Kurta'],   avgRating:4.4, totalReviews:890,  slug:'w-kurta',      stock:35 },
    { id:'f4', title:'H&M Oversized Hoodie Unisex',     price:1799, mrp:2999, discount:40, images:['https://placehold.co/280x280/fefce8/ca8a04?text=HM'],        avgRating:4.4, totalReviews:1120, slug:'hm-hoodie',    stock:45 },
    { id:'f5', title:'Biba Women Anarkali Dress',       price:1499, mrp:2999, discount:50, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=Biba'],      avgRating:4.3, totalReviews:780,  slug:'biba-dress',   stock:30 },
    { id:'f6', title:'US Polo Assn T-Shirt Pack of 2', price:1299, mrp:2199, discount:41, images:['https://placehold.co/280x280/f9fafb/374151?text=USPolo'],     avgRating:4.2, totalReviews:670,  slug:'uspolo-tee',   stock:60 },
    { id:'f7', title:'Roadster Men Casual Sneakers',   price:1599, mrp:2999, discount:47, images:['https://placehold.co/280x280/ecfdf5/059669?text=Roadster'],   avgRating:4.1, totalReviews:560,  slug:'roadster',     stock:25 },
    { id:'f8', title:'Aurelia Women Ethnic Wear Set',  price:1799, mrp:3499, discount:49, images:['https://placehold.co/280x280/fdf2f8/db2777?text=Aurelia'],    avgRating:4.4, totalReviews:920,  slug:'aurelia-set',  stock:40 },
  ],
  electronics: [
    { id:'e1', title:'Sony WH-1000XM5 Noise Cancelling', price:24990, mrp:34990, discount:29, images:['https://placehold.co/280x280/fdf4ff/a855f7?text=Sony'],   avgRating:4.6, totalReviews:1230, slug:'sony-xm5',     stock:20 },
    { id:'e2', title:'LG 55" 4K OLED Smart WebOS TV',    price:49990, mrp:79990, discount:38, images:['https://placehold.co/280x280/f0fdf4/22c55e?text=LG+TV'],  avgRating:4.4, totalReviews:1670, slug:'lg-tv',         stock:8  },
    { id:'e3', title:'Dell Inspiron 15 Laptop i5 16GB',  price:52990, mrp:72990, discount:27, images:['https://placehold.co/280x280/eff6ff/1d4ed8?text=Dell'],   avgRating:4.3, totalReviews:1340, slug:'dell-laptop',   stock:7  },
    { id:'e4', title:'boAt Rockerz 450 BT Headphone',    price:1299,  mrp:2990,  discount:57, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=boAt'],   avgRating:4.1, totalReviews:3200, slug:'boat-rockerz',  stock:50 },
    { id:'e5', title:'Apple iPad 10th Gen 64GB WiFi',    price:44900, mrp:54900, discount:18, images:['https://placehold.co/280x280/f1f5f9/475569?text=iPad'],    avgRating:4.7, totalReviews:2100, slug:'ipad-10',       stock:12 },
    { id:'e6', title:'JBL Charge 5 Portable Speaker',   price:14999, mrp:19999, discount:25, images:['https://placehold.co/280x280/fefce8/ca8a04?text=JBL'],     avgRating:4.5, totalReviews:1560, slug:'jbl-charge5',   stock:18 },
    { id:'e7', title:'Logitech MX Master 3 Mouse',       price:8995,  mrp:12995, discount:31, images:['https://placehold.co/280x280/ecfdf5/059669?text=Logitech'],avgRating:4.7, totalReviews:980,  slug:'logitech-mx',   stock:22 },
    { id:'e8', title:'Canon EOS 1500D DSLR Camera Kit',  price:36990, mrp:47990, discount:23, images:['https://placehold.co/280x280/fff7ed/f97316?text=Canon'],   avgRating:4.5, totalReviews:890,  slug:'canon-1500d',   stock:6  },
  ],
  'home-kitchen': [
    { id:'h1', title:'Prestige Iris 750W Mixer Grinder',  price:2499,  mrp:4500,  discount:44, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=Prestige'], avgRating:4.2, totalReviews:780,  slug:'prestige-mixer',  stock:30  },
    { id:'h2', title:'Philips Air Fryer HD9200 4.1L',     price:5999,  mrp:8995,  discount:33, images:['https://placehold.co/280x280/f0fdf4/16a34a?text=Philips'],  avgRating:4.4, totalReviews:1100, slug:'philips-airfryer', stock:12  },
    { id:'h3', title:'Milton Thermosteel Flask 1L',        price:699,   mrp:1299,  discount:46, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=Milton'],   avgRating:4.3, totalReviews:2340, slug:'milton-flask',     stock:100 },
    { id:'h4', title:'TTK Prestige Pressure Cooker 5L',   price:1299,  mrp:2299,  discount:43, images:['https://placehold.co/280x280/fefce8/ca8a04?text=Cooker'],    avgRating:4.5, totalReviews:1890, slug:'prestige-cooker',  stock:45  },
    { id:'h5', title:'Pigeon Non-Stick Cookware 5pc',     price:1999,  mrp:3999,  discount:50, images:['https://placehold.co/280x280/fff7ed/f97316?text=Pigeon'],    avgRating:4.3, totalReviews:890,  slug:'pigeon-cookware',  stock:35  },
    { id:'h6', title:'Solimo Cotton Bed Sheet King',      price:799,   mrp:1499,  discount:47, images:['https://placehold.co/280x280/f9fafb/374151?text=Bedsheet'],  avgRating:4.1, totalReviews:560,  slug:'solimo-bedsheet',  stock:80  },
    { id:'h7', title:'IKEA Kallax Shelf Unit 4 Cube',     price:3999,  mrp:6999,  discount:43, images:['https://placehold.co/280x280/ecfdf5/059669?text=IKEA'],      avgRating:4.3, totalReviews:450,  slug:'ikea-kallax',      stock:15  },
    { id:'h8', title:'Godrej Interio Slimline Wardrobe',  price:12999, mrp:19999, discount:35, images:['https://placehold.co/280x280/fdf4ff/9333ea?text=Godrej'],    avgRating:4.0, totalReviews:340,  slug:'godrej-wardrobe',  stock:8   },
  ],
  beauty: [
    { id:'b1', title:'Mamaearth Vitamin C Face Wash 100ml',    price:299, mrp:499,  discount:40, images:['https://placehold.co/280x280/fdf4ff/9333ea?text=Mamaearth'],  avgRating:4.4, totalReviews:4230, slug:'mamaearth-fw',   stock:200 },
    { id:'b2', title:'Lakme 9To5 Mousse Foundation',           price:699, mrp:950,  discount:26, images:['https://placehold.co/280x280/fdf2f8/ec4899?text=Lakme'],       avgRating:4.1, totalReviews:2340, slug:'lakme-mf',       stock:100 },
    { id:'b3', title:'Biotique Bio Kelp Shampoo 800ml',        price:449, mrp:799,  discount:44, images:['https://placehold.co/280x280/ecfdf5/059669?text=Biotique'],    avgRating:4.2, totalReviews:1120, slug:'biotique-shamp',  stock:80  },
    { id:'b4', title:"L'Oreal Paris Revitalift Serum 30ml",    price:899, mrp:1499, discount:40, images:['https://placehold.co/280x280/fff7ed/f97316?text=LOreal'],      avgRating:4.5, totalReviews:890,  slug:'loreal-serum',    stock:60  },
    { id:'b5', title:'WOW Skin Science Combo Kit',             price:799, mrp:1499, discount:47, images:['https://placehold.co/280x280/f0fdf4/16a34a?text=WOW'],         avgRating:4.4, totalReviews:2100, slug:'wow-combo',       stock:75  },
    { id:'b6', title:'Minimalist 10% Niacinamide Serum 30ml',  price:349, mrp:599,  discount:42, images:['https://placehold.co/280x280/f9fafb/374151?text=Minimalist'],  avgRating:4.6, totalReviews:2560, slug:'minimalist-ser',  stock:85  },
    { id:'b7', title:'The Derma Co 1% Hyaluronic Serum 30ml', price:449, mrp:799,  discount:44, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=DermaCo'],     avgRating:4.5, totalReviews:1340, slug:'derma-co-ser',    stock:70  },
    { id:'b8', title:'Plum Grape Seed Face Toner 200ml',      price:349, mrp:549,  discount:36, images:['https://placehold.co/280x280/fdf2f8/db2777?text=Plum'],         avgRating:4.3, totalReviews:670,  slug:'plum-toner',      stock:90  },
  ],
  sports: [
    { id:'s1', title:'Nike Air Max 270 Running Shoes',  price:8995, mrp:12995, discount:31, images:['https://placehold.co/280x280/fefce8/eab308?text=Nike'],    avgRating:4.3, totalReviews:890,  slug:'nike-airmax',      stock:15 },
    { id:'s2', title:'Adidas Ultraboost 22 Shoes',      price:9995, mrp:16995, discount:41, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=Adidas'],  avgRating:4.5, totalReviews:780,  slug:'adidas-ultraboost', stock:22 },
    { id:'s3', title:'Puma RS-X Bold Running Unisex',   price:6999, mrp:9999,  discount:30, images:['https://placehold.co/280x280/fff0f3/be123c?text=Puma'],    avgRating:4.3, totalReviews:560,  slug:'puma-rsx',          stock:18 },
    { id:'s4', title:'Cosco Fit Pro Yoga Mat 6mm',      price:699,  mrp:1299,  discount:46, images:['https://placehold.co/280x280/ecfdf5/059669?text=YogaMat'], avgRating:4.2, totalReviews:1230, slug:'cosco-yogamat',     stock:60 },
    { id:'s5', title:'Nivia Pro Football Size 5',       price:599,  mrp:999,   discount:40, images:['https://placehold.co/280x280/f0f9ff/0ea5e9?text=Football'],avgRating:4.1, totalReviews:450,  slug:'nivia-football',    stock:40 },
    { id:'s6', title:'Boldfit Pro Gym Gloves Pair',     price:399,  mrp:799,   discount:50, images:['https://placehold.co/280x280/fff7ed/f97316?text=Gloves'],   avgRating:4.4, totalReviews:2100, slug:'boldfit-gloves',    stock:80 },
    { id:'s7', title:'Strauss Adjustable Dumbbell 10kg',price:1999, mrp:3499,  discount:43, images:['https://placehold.co/280x280/f1f5f9/475569?text=Dumbbell'],avgRating:4.3, totalReviews:780,  slug:'strauss-db',        stock:30 },
    { id:'s8', title:'Vector X Cricket Bat Kashmir',    price:1299, mrp:2299,  discount:43, images:['https://placehold.co/280x280/fefce8/ca8a04?text=Cricket'], avgRating:4.2, totalReviews:540,  slug:'vectorx-bat',       stock:25 },
  ],
  books: [
    { id:'bk1', title:'Harry Potter Complete 7 Book Box Set', price:2499, mrp:3999, discount:38, images:['https://placehold.co/280x280/fff7ed/f97316?text=HP'],      avgRating:4.9, totalReviews:5670, slug:'hp-books',        stock:25  },
    { id:'bk2', title:'Atomic Habits by James Clear',         price:399,  mrp:799,  discount:50, images:['https://placehold.co/280x280/ecfdf5/059669?text=Atomic'],  avgRating:4.8, totalReviews:4230, slug:'atomic-habits',   stock:80  },
    { id:'bk3', title:'Rich Dad Poor Dad by Kiyosaki',        price:249,  mrp:449,  discount:44, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=RichDad'], avgRating:4.7, totalReviews:3120, slug:'rich-dad',        stock:100 },
    { id:'bk4', title:'The Psychology of Money',              price:349,  mrp:599,  discount:42, images:['https://placehold.co/280x280/fdf4ff/9333ea?text=PsychMon'],avgRating:4.8, totalReviews:2340, slug:'psych-money',     stock:70  },
    { id:'bk5', title:'Ikigai by Hector Garcia',              price:299,  mrp:499,  discount:40, images:['https://placehold.co/280x280/fdf2f8/ec4899?text=Ikigai'],  avgRating:4.7, totalReviews:1560, slug:'ikigai',          stock:65  },
    { id:'bk6', title:'The Alchemist by Paulo Coelho',        price:199,  mrp:349,  discount:43, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=Alchemist'],avgRating:4.8, totalReviews:2780, slug:'alchemist',       stock:90  },
    { id:'bk7', title:'Zero to One by Peter Thiel',           price:449,  mrp:699,  discount:36, images:['https://placehold.co/280x280/f0f9ff/0ea5e9?text=ZeroOne'], avgRating:4.7, totalReviews:1240, slug:'zero-to-one',     stock:55  },
    { id:'bk8', title:'Think and Grow Rich Napoleon Hill',    price:199,  mrp:399,  discount:50, images:['https://placehold.co/280x280/fefce8/ca8a04?text=ThinkGrow'],avgRating:4.6, totalReviews:1890, slug:'think-grow',      stock:120 },
  ],
  toys: [
    { id:'t1', title:'LEGO Classic Creative Bricks 484pcs', price:2499, mrp:3999, discount:38, images:['https://placehold.co/280x280/fefce8/ca8a04?text=LEGO'],     avgRating:4.8, totalReviews:1230, slug:'lego-classic', stock:30 },
    { id:'t2', title:'Hot Wheels 20 Car Gift Pack',         price:799,  mrp:1299, discount:38, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=HotWheels'], avgRating:4.7, totalReviews:2340, slug:'hot-wheels',   stock:50 },
    { id:'t3', title:'Barbie Dreamhouse Playset',           price:4499, mrp:6999, discount:36, images:['https://placehold.co/280x280/fdf2f8/ec4899?text=Barbie'],    avgRating:4.6, totalReviews:780,  slug:'barbie-house', stock:15 },
    { id:'t4', title:'Funskool Pictionary Family Game',     price:699,  mrp:1199, discount:42, images:['https://placehold.co/280x280/f0fdf4/22c55e?text=Pictionary'],avgRating:4.5, totalReviews:450,  slug:'pictionary',   stock:40 },
    { id:'t5', title:'Remote Control Monster Truck',        price:1299, mrp:2499, discount:48, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=RCTruck'],   avgRating:4.2, totalReviews:890,  slug:'rc-truck',     stock:25 },
    { id:'t6', title:'Play-Doh Super Color Pack 20 Cans',  price:999,  mrp:1799, discount:44, images:['https://placehold.co/280x280/fff7ed/f97316?text=PlayDoh'],   avgRating:4.6, totalReviews:1120, slug:'playdoh-20',   stock:60 },
  ],
  grocery: [
    { id:'g1', title:'Aashirvaad Multigrain Atta 10kg', price:499, mrp:699, discount:29, images:['https://placehold.co/280x280/fff7ed/f97316?text=Aashirvaad'],  avgRating:4.4, totalReviews:2100, slug:'aashirvaad',  stock:200 },
    { id:'g2', title:'Amul Pure Cow Ghee 500ml',        price:299, mrp:349, discount:14, images:['https://placehold.co/280x280/fefce8/ca8a04?text=AmulGhee'],    avgRating:4.7, totalReviews:1890, slug:'amul-ghee',   stock:150 },
    { id:'g3', title:'Fortune Sunflower Oil 5L Can',    price:699, mrp:849, discount:18, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=Fortune'],     avgRating:4.3, totalReviews:1230, slug:'fortune-oil', stock:180 },
    { id:'g4', title:'Tata Tea Premium 500g',           price:259, mrp:320, discount:19, images:['https://placehold.co/280x280/fff1f2/f43f5e?text=TataTea'],     avgRating:4.5, totalReviews:2340, slug:'tata-tea',    stock:300 },
    { id:'g5', title:'Maggi 2-Minute Noodles 12 Pack',  price:199, mrp:240, discount:17, images:['https://placehold.co/280x280/fefce8/ca8a04?text=Maggi'],       avgRating:4.6, totalReviews:4560, slug:'maggi-12',    stock:500 },
    { id:'g6', title:"Lay's Classic Chips 26g x12",    price:249, mrp:312, discount:20, images:['https://placehold.co/280x280/ecfdf5/059669?text=Lays'],         avgRating:4.3, totalReviews:1670, slug:'lays-chips',  stock:400 },
  ],
  appliances: [
    { id:'a1', title:'Whirlpool 265L Double Door Fridge',       price:24990, mrp:35000, discount:29, images:['https://placehold.co/280x280/ecfdf5/047857?text=Whirlpool'], avgRating:4.2, totalReviews:890,  slug:'whirlpool-fridge', stock:4  },
    { id:'a2', title:'Samsung 7kg Fully Auto Washing Machine',  price:22990, mrp:32990, discount:30, images:['https://placehold.co/280x280/eff6ff/3b82f6?text=SamsungWM'],  avgRating:4.3, totalReviews:1120, slug:'samsung-wm',        stock:6  },
    { id:'a3', title:'Voltas 1.5 Ton 3 Star Inverter AC',      price:34990, mrp:47990, discount:27, images:['https://placehold.co/280x280/f0f9ff/0ea5e9?text=VoltasAC'],   avgRating:4.1, totalReviews:780,  slug:'voltas-ac',         stock:5  },
    { id:'a4', title:'LG 28L Convection Microwave Oven',       price:12990, mrp:18990, discount:32, images:['https://placehold.co/280x280/f0fdf4/22c55e?text=LGMicro'],    avgRating:4.4, totalReviews:670,  slug:'lg-microwave',      stock:10 },
    { id:'a5', title:'Philips 1200W Dry Iron Non-Stick',       price:999,   mrp:1799,  discount:44, images:['https://placehold.co/280x280/ecfdf5/059669?text=Philips'],    avgRating:4.3, totalReviews:980,  slug:'philips-iron',      stock:40 },
    { id:'a6', title:'Usha Lexus 400mm Pedestal Fan',          price:2499,  mrp:3999,  discount:38, images:['https://placehold.co/280x280/fdf4ff/9333ea?text=UshaFan'],    avgRating:4.0, totalReviews:560,  slug:'usha-fan',          stock:20 },
    { id:'a7', title:'Bajaj Room Heater 1000W Halogen',        price:1299,  mrp:2299,  discount:43, images:['https://placehold.co/280x280/fff7ed/f97316?text=BajajHeat'],  avgRating:4.2, totalReviews:1340, slug:'bajaj-heater',      stock:30 },
    { id:'a8', title:'Eureka Forbes Aquaguard RO+UV Purifier', price:8999,  mrp:13999, discount:36, images:['https://placehold.co/280x280/eff6ff/1d4ed8?text=Aquaguard'],  avgRating:4.4, totalReviews:1230, slug:'aquaguard-ro',      stock:15 },
  ],
}

const SORT_OPTIONS = [
  { label: 'Popularity',         value: 'popular'    },
  { label: 'Price: Low to High', value: 'price_asc'  },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First',       value: 'newest'     },
  { label: 'Top Rated',          value: 'rating'     },
]
const PRICE_FILTERS = [
  { label: 'All',         val: ''      },
  { label: 'Under ₹500',  val: '500'   },
  { label: 'Under ₹1000', val: '1000'  },
  { label: 'Under ₹5000', val: '5000'  },
  { label: 'Under ₹10K',  val: '10000' },
]

// Sort+filter purely on frontend — zero network
function localFilter(items: any[], maxPrice: string, sort: string) {
  let out = [...items]
  if (maxPrice) out = out.filter(p => p.price <= Number(maxPrice))
  if      (sort === 'price_asc')  out.sort((a, b) => a.price - b.price)
  else if (sort === 'price_desc') out.sort((a, b) => b.price - a.price)
  else if (sort === 'rating')     out.sort((a, b) => (b.avgRating  ?? 0) - (a.avgRating  ?? 0))
  else                            out.sort((a, b) => (b.discount   ?? 0) - (a.discount   ?? 0))
  return out
}

// ─────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────
export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const meta = CATEGORY_META[slug] ?? {
    name: slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    emoji: '🛍️', desc: 'Browse all products', aliases: [slug],
  }

  // ── State ─────────────────────────────────────────────────
  const [sort,      setSort]     = useState('popular')
  const [maxPrice,  setMaxPrice] = useState('')
  const [page,      setPage]     = useState(1)

  // API data (real products from backend)
  const [apiProducts, setApiProducts] = useState<any[] | null>(null) // null = not fetched yet
  const [apiTotal,    setApiTotal]    = useState(0)
  const [apiLoading,  setApiLoading]  = useState(true)

  const abortRef = useRef<AbortController | null>(null)

  // ── Dummy source for this category ────────────────────────
  const dummySource = useMemo(() => DUMMY[slug] ?? [], [slug])

  // ── STEP 1: Instantly show dummy (no delay, no flicker) ──
  // Apply sort+filter locally — ZERO network
  const displayProducts = useMemo(() => {
    const source = apiProducts ?? dummySource   // use real data if available, else dummy
    return localFilter(source, maxPrice, sort)
  }, [apiProducts, dummySource, maxPrice, sort])

  // ── STEP 2: Fetch real data in background ─────────────────
  // Only re-fetches when slug changes (not on filter/sort change!)
  // Filters on real data are applied locally above — no extra API calls
  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setApiLoading(true)
    setApiProducts(null) // reset so dummy shows instantly on slug change

    const aliases = meta.aliases ?? [slug]

    // Fire all alias requests in parallel
    const requests = aliases.map(alias =>
      api.get('/products', {
        params: { category: alias, limit: 100 }, // fetch all at once — filter locally
        signal: ctrl.signal,
      })
      .then(r => (r.data.data?.length > 0 ? r.data.data : null))
      .catch(() => null)
    )

    Promise.all(requests).then(results => {
      if (ctrl.signal.aborted) return
      const winner = results.find(r => r !== null)
      if (winner) {
        setApiProducts(winner)
        setApiTotal(winner.length)
      }
      setApiLoading(false)
    })

    return () => ctrl.abort()
  }, [slug]) // ← ONLY slug — NOT sort/maxPrice/page

  // ── Reset page when source changes ────────────────────────
  useEffect(() => { setPage(1) }, [slug, sort, maxPrice])

  const ITEMS_PER_PAGE = 20
  const totalItems  = apiProducts ? displayProducts.length : dummySource.length
  const totalPages  = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const visibleProds = displayProducts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const usingReal   = apiProducts !== null

  return (
    <div className="min-h-screen bg-[#f0f2f5]">

      {/* ── Header ── */}
      <div className="bg-[#1a1a2e]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
            <Link href="/" className="hover:text-[#F97316] transition-colors">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/products" className="hover:text-[#F97316] transition-colors">All Products</Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-300">{meta.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl border border-white/10 flex-shrink-0">
              {meta.emoji}
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white">{meta.name}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{meta.desc}</p>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[#F97316] text-xs font-bold">
                  {displayProducts.length} products
                </span>
                {/* Subtle background sync indicator */}
                {apiLoading && (
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <RefreshCw size={9} className="animate-spin" /> syncing...
                  </span>
                )}
                {!apiLoading && usingReal && (
                  <span className="text-[10px] text-green-400 opacity-70">✓ live data</span>
                )}
                {!apiLoading && !usingReal && (
                  <span className="text-[10px] text-yellow-400 opacity-70">· demo — add products from seller dashboard</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-5">

        {/* ── Filter bar — instant local filter ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3 mb-4 flex items-center justify-between flex-wrap gap-3 shadow-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget:</span>
            {PRICE_FILTERS.map(f => (
              <button
                key={f.val}
                onClick={() => setMaxPrice(f.val)} // ← instant: no API call, just re-filter memo
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  maxPrice === f.val
                    ? 'bg-[#F97316] text-white shadow-sm shadow-orange-100'
                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-[#F97316]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={13} className="text-gray-400" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)} // ← instant: no API call
              className="border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 outline-none focus:border-[#F97316] bg-white cursor-pointer"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* ── Products — always show, never blank ── */}
        {visibleProds.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visibleProds.map(p => <ProductCard key={p.id} product={p} />)}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-40 transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const n = page <= 4 ? i + 1 : page - 3 + i
                  if (n < 1 || n > totalPages) return null
                  return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-9 h-9 text-xs font-bold rounded-xl border transition-all ${
                        n === page
                          ? 'bg-[#F97316] text-white border-[#F97316]'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-[#F97316] hover:text-[#F97316]'
                      }`}
                    >
                      {n}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-4 py-2 text-xs font-bold bg-white border border-gray-200 rounded-xl hover:border-[#F97316] hover:text-[#F97316] disabled:opacity-40 transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">{meta.emoji}</div>
            <h2 className="text-lg font-black text-gray-900 mb-2">No products match this filter</h2>
            <button
              onClick={() => { setMaxPrice(''); setSort('popular'); setPage(1) }}
              className="mt-2 bg-[#F97316] text-white font-black text-sm px-6 py-3 rounded-xl hover:bg-[#EA580C] transition-all"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}