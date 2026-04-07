import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from "firebase/firestore";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const luxuryProducts = [
  {
    id: "prod_m_jacket_01",
    name: "Obsidian Tech-Trench",
    brand: "LYRA Atelier",
    price: 34500,
    category: "Men",
    subCategory: "Outerwear",
    description: "A water-repellent, cyberpunk-inspired trench coat engineered from advanced synthetic polymers. Features magnetic snap closures and hidden compartmentalized pockets. Draped elegantly for brutalist minimalism.",
    material: "Poly-Nylon Blend / GORE-TEX",
    careInstructions: "Dry clean only. Do not tumble dry.",
    ecoLabels: ["Cruelty-Free", "Low-Water Production"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=736",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=736"
    ],
    variants: [
      { color: "Obsidian Black", colorHex: "#0D0D0D", sizes: ["S", "M", "L", "XL"], stock: 15 }
    ]
  },
  {
    id: "prod_w_dress_02",
    name: "Cashmere Silhouette Midi",
    brand: "LYRA Essentials",
    price: 42000,
    category: "Women",
    subCategory: "Dresses",
    description: "Ethically sourced Mongolian cashmere midi dress. Features a sophisticated deep V-neck and a flowing, body-conscious architecture that wraps gracefully around the form.",
    material: "100% Mongolian Cashmere",
    careInstructions: "Hand wash cold, lay flat to dry.",
    ecoLabels: ["Ethically Sourced", "Biodegradable"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=736",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?q=80&w=736"
    ],
    variants: [
      { color: "Ivory", colorHex: "#FFFFF0", sizes: ["XS", "S", "M"], stock: 8 },
      { color: "Charcoal", colorHex: "#36454F", sizes: ["XS", "S", "M", "L"], stock: 12 }
    ]
  },
  {
    id: "prod_a_watch_03",
    name: "Monolith Titanium Chronograph",
    brand: "LYRA Timepieces",
    price: 125000,
    category: "Accessories",
    subCategory: "Watches",
    description: "Aerospace-grade titanium chassis housing a 45-jewel automatic movement. Scratch-resistant sapphire crystal and an integrated obsidian silicone strap. A true testament to precision luxury.",
    material: "Grade 5 Titanium / Sapphire Crystal",
    careInstructions: "Wipe with microfiber cloth. Water resistant 10 ATM.",
    ecoLabels: ["Carbon Neutral Shipping"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=736",
      "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?q=80&w=736"
    ],
    variants: [
      { color: "Gunmetal", colorHex: "#2A3439", sizes: ["One Size"], stock: 3 }
    ]
  },
  {
    id: "prod_w_knit_04",
    name: "Cloud-Knit Turtleneck",
    brand: "LYRA",
    price: 8500,
    category: "Women",
    subCategory: "Knitwear",
    description: "An exceptionally soft, oversized turtleneck spun from a proprietary alpaca and silk blend. Lightweight yet tremendously insulating, perfect for chic layering in urban winters.",
    material: "70% Baby Alpaca, 30% Silk",
    careInstructions: "Dry clean.",
    ecoLabels: ["Fair Trade", "Natural Fibers"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=736",
      "https://images.unsplash.com/photo-1610427321200-a6e300ac1612?q=80&w=736"
    ],
    variants: [
      { color: "Mist Grey", colorHex: "#B0BEC5", sizes: ["XS", "S", "M", "L", "XL"], stock: 25 }
    ]
  },
  {
    id: "prod_m_pant_05",
    name: "Utility Cargo Trousers",
    brand: "LYRA Street",
    price: 12000,
    category: "Men",
    subCategory: "Trousers",
    description: "Tailored cargo pants crafted from Japanese ripstop cotton. Features articulated knees and concealed zip pockets for a sleek, highly functional silhouette.",
    material: "100% Japanese Ripstop Cotton",
    careInstructions: "Machine wash cold, air dry.",
    ecoLabels: ["Organic Cotton"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=736",
      "https://images.unsplash.com/photo-1554568218-0f1715e72254?q=80&w=736"
    ],
    variants: [
      { color: "Olive Drab", colorHex: "#4B5320", sizes: ["28", "30", "32", "34", "36"], stock: 40 },
      { color: "Slate", colorHex: "#708090", sizes: ["30", "32", "34"], stock: 15 }
    ]
  },
  {
    id: "prod_a_bag_06",
    name: "Architectural Leather Tote",
    brand: "LYRA Leather",
    price: 55000,
    category: "Accessories",
    subCategory: "Bags",
    description: "Structured minimalism at its finest. Handcrafted from vegetable-tanned Italian leather with matte black hardware. Spacious enough for a 16-inch laptop.",
    material: "Full-Grain Italian Leather",
    careInstructions: "Condition leather bi-annually.",
    ecoLabels: ["Vegetable Tanned", "Zero Plastic"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=736",
      "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?q=80&w=736"
    ],
    variants: [
      { color: "Saddle", colorHex: "#8B4513", sizes: ["One Size"], stock: 8 },
      { color: "Onyx", colorHex: "#000000", sizes: ["One Size"], stock: 5 }
    ]
  },
  {
    id: "prod_m_shirt_07",
    name: "Mercerized Cotton Button-Down",
    brand: "LYRA Essentials",
    price: 4500,
    category: "Men",
    subCategory: "Shirts",
    description: "The ultimate white shirt. Mercerized for a subtle sheen and wrinkle resistance, featuring mother-of-pearl buttons and a sharp contemporary collar.",
    material: "100% Pima Cotton",
    careInstructions: "Machine wash warm, iron medium.",
    ecoLabels: ["Sustainable Farming"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?q=80&w=736",
      "https://images.unsplash.com/photo-1593998066526-65fcab3021a2?q=80&w=736"
    ],
    variants: [
      { color: "Optic White", colorHex: "#FFFFFF", sizes: ["S", "M", "L", "XL", "XXL"], stock: 60 }
    ]
  },
  {
    id: "prod_w_jacket_08",
    name: "Sculpted Wool Blazer",
    brand: "LYRA Atelier",
    price: 28000,
    category: "Women",
    subCategory: "Outerwear",
    description: "Power dressing redefined. An expertly tailored blazer featuring strong shoulders, a cinched waist, and woven from worsted wool for a phenomenal drape.",
    material: "100% Worsted Wool",
    careInstructions: "Professional dry clean.",
    ecoLabels: ["Cruelty-Free Wool"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?q=80&w=736",
      "https://images.unsplash.com/photo-1584273143981-41c073dfe8f8?q=80&w=736"
    ],
    variants: [
      { color: "Camel", colorHex: "#C19A6B", sizes: ["XS", "S", "M", "L"], stock: 12 },
      { color: "Navy", colorHex: "#000080", sizes: ["S", "M", "L"], stock: 8 }
    ]
  },
  {
    id: "prod_a_glasses_09",
    name: "Aeroline Aviator Sunglasses",
    brand: "LYRA Optics",
    price: 18500,
    category: "Accessories",
    subCategory: "Eyewear",
    description: "Ultralight titanium aviators featuring 100% UV protection polarized lenses. The frame bends and snaps back to hold its shape perfectly. Hand-assembled in Italy.",
    material: "Titanium / Polycarbonate Lenses",
    careInstructions: "Store in provided hard case.",
    ecoLabels: [],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=736",
      "https://images.unsplash.com/photo-1577803645773-f96470509666?q=80&w=736"
    ],
    variants: [
      { color: "Gold / Green", colorHex: "#FFD700", sizes: ["Standard"], stock: 22 }
    ]
  },
  {
    id: "prod_k_jacket_10",
    name: "Mini Explorer Puffer",
    brand: "LYRA Kids",
    price: 6500,
    category: "Kids",
    subCategory: "Outerwear",
    description: "A cruelty-free, highly insulated down alternative puffer for children. Features reinforced elbow patches and a detachable hood.",
    material: "Recycled Polyester / Primaloft",
    careInstructions: "Machine wash cold on gentle.",
    ecoLabels: ["100% Recycled", "Vegan"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1519238398453-cf2d87e0b53c?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1519238398453-cf2d87e0b53c?q=80&w=736"
    ],
    variants: [
      { color: "Mustard", colorHex: "#FFDB58", sizes: ["4Y", "6Y", "8Y", "10Y"], stock: 45 }
    ]
  },
  {
    id: "prod_m_sneaker_11",
    name: "VFX Urban High-Tops",
    brand: "LYRA Footwear",
    price: 24000,
    category: "Men",
    subCategory: "Shoes",
    description: "Next-generation streetwear sneakers constructed from synthetic flyknit. Features a shock-absorbing translucent midsole and an unbranded matte finish.",
    material: "Vegan Leather / Flyknit",
    careInstructions: "Wipe with damp cloth.",
    ecoLabels: ["Vegan"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1552346154-21d32810baa3?q=80&w=736",
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=736"
    ],
    variants: [
      { color: "Phantom", colorHex: "#E5E4E2", sizes: ["us8", "us9", "us10", "us11", "us12"], stock: 30 }
    ]
  },
  {
    id: "prod_w_pant_12",
    name: "Silk Wide-Leg Trousers",
    brand: "LYRA Essentials",
    price: 18000,
    category: "Women",
    subCategory: "Trousers",
    description: "Effortlessly elegant trousers featuring a dramatically wide leg and a high paper-bag waist. Woven from rich Mulberry silk that cascades beautifully down the leg.",
    material: "100% Mulberry Silk",
    careInstructions: "Dry clean only.",
    ecoLabels: ["Natural Fibers"],
    inStock: false,
    isNew: false,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=736"
    ],
    variants: [
      { color: "Midnight", colorHex: "#191970", sizes: ["XS", "S", "M", "L"], stock: 0 }
    ]
  },
  {
    id: "prod_a_wallet_13",
    name: "Carbon Fiber Cardholder",
    brand: "LYRA Leather",
    price: 4500,
    category: "Accessories",
    subCategory: "Wallets",
    description: "An incredibly slim and durable card box capable of carrying up to 6 cards. Shields against RFID scanning data theft.",
    material: "Matte Carbon Fiber",
    careInstructions: "No maintenance required.",
    ecoLabels: ["Upcycled Materials"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=736"
    ],
    variants: [
      { color: "Carbon Matte", colorHex: "#111111", sizes: ["One Size"], stock: 80 }
    ]
  },
  {
    id: "prod_k_dress_14",
    name: "Floral Cotton Smock",
    brand: "LYRA Kids",
    price: 4200,
    category: "Kids",
    subCategory: "Dresses",
    description: "A breezy, hand-embroidered smock dress perfect for summer days. Features delicate scalloped hems and comfortable, stretchy shoulder ruffles.",
    material: "100% Organic Cotton",
    careInstructions: "Machine wash delicate.",
    ecoLabels: ["Organic Cotton", "Fair Trade"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?q=80&w=736"
    ],
    variants: [
      { color: "Blush", colorHex: "#DE5D83", sizes: ["2Y", "4Y", "6Y", "8Y"], stock: 18 }
    ]
  },
  {
    id: "prod_m_hoodie_15",
    name: "Heavyweight Box-Fit Hoodie",
    brand: "LYRA Street",
    price: 8900,
    category: "Men",
    subCategory: "Knitwear",
    description: "Cut from ultra-dense 500gsm french terry cotton. This hoodie features a dropped shoulder and an oversized silhouette designed to maintain its rigid structure.",
    material: "100% Cotton [500 GSM]",
    careInstructions: "Machine wash cold inside out.",
    ecoLabels: ["Durable Construction"],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1556821840-0a63f95609a7?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1556821840-0a63f95609a7?q=80&w=736"
    ],
    variants: [
      { color: "Washed Black", colorHex: "#222222", sizes: ["S", "M", "L", "XL", "XXL"], stock: 55 },
      { color: "Bone", colorHex: "#E3DAC9", sizes: ["M", "L", "XL"], stock: 20 }
    ]
  },
  {
    id: "prod_w_swim_16",
    name: "Asymmetrical One-Piece",
    brand: "LYRA",
    price: 9500,
    category: "Women",
    subCategory: "Swimwear",
    description: "A striking, sculptural swimsuit designed with a daring off-the-shoulder cut and flattering ruching on the torso.",
    material: "78% Recycled Polyamide, 22% Elastane",
    careInstructions: "Hand wash cold immediately after use.",
    ecoLabels: ["Recycled Ocean Plastics"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1563852089408-db28b9c8ce3c?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1563852089408-db28b9c8ce3c?q=80&w=736"
    ],
    variants: [
      { color: "Onyx", colorHex: "#000000", sizes: ["XS", "S", "M", "L"], stock: 12 }
    ]
  },
  {
    id: "prod_m_suit_17",
    name: "The 3-Piece Executive Silhouette",
    brand: "LYRA Atelier",
    price: 85000,
    category: "Men",
    subCategory: "Suits",
    description: "Immaculate tailoring and a modern slim cut. Tailored from a super 120s Italian wool twill. Fully canvassed jacket with horn buttons.",
    material: "100% Italian Virgin Wool",
    careInstructions: "Professional dry clean only.",
    ecoLabels: [],
    inStock: true,
    isNew: true,
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?q=80&w=736",
      "https://images.unsplash.com/photo-1592878904946-b3ce8ceec498?q=80&w=736"
    ],
    variants: [
      { color: "Midnight Blue", colorHex: "#003366", sizes: ["38R", "40R", "42R", "44R"], stock: 10 }
    ]
  },
  {
    id: "prod_a_belt_18",
    name: "Minimalist Reversible Belt",
    brand: "LYRA Accessories",
    price: 8000,
    category: "Accessories",
    subCategory: "Belts",
    description: "A seamless transition from business to casual. This reversible belt features a sleek, frictionless locking mechanism and fine pebble-grain texture.",
    material: "Full-Grain Cowhide",
    careInstructions: "Wipe clean with a damp cloth.",
    ecoLabels: ["Zero Plastic"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1624222247344-550fb60583dc?q=80&w=736"
    ],
    variants: [
      { color: "Black / Brown", colorHex: "#3b2f2f", sizes: ["S", "M", "L"], stock: 35 }
    ]
  },
  {
    id: "prod_w_shoes_19",
    name: "Architectural Stiletto",
    brand: "LYRA Footwear",
    price: 28000,
    category: "Women",
    subCategory: "Shoes",
    description: "A masterclass in geometry. These stilettos feature a transparent lucite heel and sleek patent leather strapping designed to elongate the leg.",
    material: "Patent Leather / Lucite",
    careInstructions: "Store in dust bags provided.",
    ecoLabels: [],
    inStock: false,
    isNew: true,
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=736",
      "https://images.unsplash.com/photo-1562183241-11d7fc188d3e?q=80&w=736"
    ],
    variants: [
      { color: "Crimson", colorHex: "#DC143C", sizes: ["us5", "us6", "us7", "us8", "us9"], stock: 0 }
    ]
  },
  {
    id: "prod_m_short_20",
    name: "French-Terry Lounge Shorts",
    brand: "LYRA Essentials",
    price: 4500,
    category: "Men",
    subCategory: "Shorts",
    description: "Peak relaxation. Cut above the knee from premium mid-weight loopback cotton. Equipped with deep pockets and a silicone-dipped drawstring.",
    material: "100% French Terry Cotton",
    careInstructions: "Machine wash cold, tumble dry low.",
    ecoLabels: ["Sustainable Farming"],
    inStock: true,
    isNew: false,
    image: "https://images.unsplash.com/photo-1591195853828-11db59a42168?q=80&w=736",
    images: [
      "https://images.unsplash.com/photo-1591195853828-11db59a42168?q=80&w=736"
    ],
    variants: [
      { color: "Heather Grey", colorHex: "#A9A9A9", sizes: ["S", "M", "L", "XL"], stock: 50 },
      { color: "Navy", colorHex: "#000080", sizes: ["M", "L"], stock: 15 }
    ]
  }
];

async function seedDatabase() {
  try {
    console.log("🔥 Starting LYRA Database Wipe & Seed Process...");
    
    // 1. Wipe Existing Products
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    
    console.log(`Found ${snapshot.docs.length} existing products. Clearing them...`);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    console.log("✅ Cleared existing products from Firestore.");

    // 2. Inject New 20 Products
    console.log(`Injecting ${luxuryProducts.length} new luxury products...`);
    const uploadPromises = luxuryProducts.map(prod => {
      // Create specific ID-based document so URLs match gracefully
      const docRef = doc(db, "products", prod.id);
      return setDoc(docRef, {
        ...prod,
        images: prod.images || [prod.image],
        reviewCount: Math.floor(Math.random() * 120),
        rating: 4.5 + Math.random() * 0.5,
      });
    });

    await Promise.all(uploadPromises);
    console.log("✅ Successfully seeded 20 ultra-detailed products into Firestore.");
    console.log("You can safely exit this script.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedDatabase();
