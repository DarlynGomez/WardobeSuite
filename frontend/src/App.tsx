import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Menu,
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  User,
  Mail,
  CheckCircle,
  Search,
  ExternalLink,
  RefreshCw,
  Shirt,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  Sun,
  Moon,
  Building2,
} from "lucide-react";

// Types & Interfaces
type ViewState =
  | "landing"
  | "signup"
  | "signin"
  | "onboarding"
  | "verification"
  | "scanning"
  | "review"
  | " consumer dashboard"
  | "budget"
  | "wardrobe"
  | "profile";

type ClothingCategory =
  | "All"
  | "Tops"
  | "Bottoms"
  | "Dresses"
  | "Outerwear"
  | "Footwear"
  | "Swimwear"
  | "Undergarments"
  | "Accessories";

interface WardrobeItem {
  id: number;
  name: string;
  price: number;
  image: string;
  category: ClothingCategory;
}

interface Outfit {
  id: number;
  name: string;
  items: WardrobeItem[];
}

// Theme definitions for light and dark modes, used for consistent styling across components
const theme = {
  light: {
    // Backgrounds
    pageBg: "bg-white",
    surfaceBg: "bg-slate-50",
    cardBg: "bg-white",
    mutedBg: "bg-slate-100",
    // Text
    headingText: "text-slate-900",
    bodyText: "text-slate-700",
    subtleText: "text-slate-500",
    mutedText: "text-slate-400",
    // Borders
    border: "border-slate-200",
    subtleBorder: "border-slate-100",
    // Header
    headerBg: "bg-white/85",
    // Accent — black (primary actions, links, highlights)
    accentBg: "bg-indigo-600",
    accentHover: "hover:bg-indigo-700",
    accentText: "text-indigo-600",
    accentSubtle: "bg-indigo-50",
    accentSubtleText: "text-indigo-700",
    // Secondary accent — sky (wardrobe / outfit builder)
    skyBg: "bg-indigo-600",
    skyHover: "hover:bg-indigo-700",
    skyText: "text-indigo-600",
    skySubtle: "bg-indigo-50",
    skySubtleText: "text-indigo-700",
    // Inputs
    inputBg: "bg-slate-50",
    inputBorder: "border-slate-200",
    inputFocus: "focus:border-indigo-500 focus:ring-indigo-500/20",
    inputText: "text-slate-900",
    // Nav buttons
    navBtn: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    // Filter panel
    filterBg: "bg-white",
    filterItemHover: "hover:bg-indigo-50 hover:text-indigo-700",
    filterActiveItem: "bg-indigo-50 text-indigo-700 font-semibold",
    filterPillBg:
      "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700",
    // Swipe card
    swipeCard: "bg-white border-slate-200",
  },
  dark: {
    pageBg: "bg-slate-900",
    surfaceBg: "bg-slate-800",
    cardBg: "bg-slate-800",
    mutedBg: "bg-slate-700",
    headingText: "text-slate-100",
    bodyText: "text-slate-300",
    subtleText: "text-slate-400",
    mutedText: "text-slate-500",
    border: "border-slate-700",
    subtleBorder: "border-slate-700",
    headerBg: "bg-slate-900/90",
    accentBg: "bg-indigo-500",
    accentHover: "hover:bg-indigo-600",
    accentText: "text-indigo-400",
    accentSubtle: "bg-indigo-900/50",
    accentSubtleText: "text-indigo-300",
    skyBg: "bg-indigo-500",
    skyHover: "hover:bg-indigo-600",
    skyText: "text-indigo-400",
    skySubtle: "bg-indigo-900/50",
    skySubtleText: "text-indigo-300",
    inputBg: "bg-slate-700",
    inputBorder: "border-slate-600",
    inputFocus: "focus:border-indigo-400 focus:ring-indigo-400/20",
    inputText: "text-slate-100",
    navBtn: "bg-slate-700 text-slate-300 hover:bg-slate-600",
    filterBg: "bg-slate-800",
    filterItemHover: "hover:bg-indigo-900/40 hover:text-indigo-300",
    filterActiveItem: "bg-indigo-900/50 text-indigo-300 font-semibold",
    filterPillBg:
      "bg-slate-700 text-slate-300 hover:bg-indigo-900/40 hover:text-indigo-300",
    swipeCard: "bg-slate-800 border-slate-700",
  },
};

// Filter section: accordian style
function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
  tk,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  tk: typeof theme.light;
}) {
  return (
    <div className={`border ${tk.border} rounded-xl overflow-hidden`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-semibold ${tk.bodyText} ${tk.surfaceBg} hover:opacity-80 transition-opacity`}
      >
        {title}
        <ChevronDown
          size={15}
          className={`${tk.mutedText} transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className={`px-4 pb-3 ${tk.cardBg}`}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = React.useState<ViewState>("landing");
  const [isDark, setIsDark] = React.useState(false);
  const tk = isDark ? theme.dark : theme.light;

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  // User & App State
  const [user, setUser] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [accountType, setAccountType] = React.useState<"consumer" | "business">(
    "consumer",
  );
  const [isVerified, setIsVerified] = React.useState(false);
  const [scannedCount, setScannedCount] = React.useState(0);
  const [isScanning, setIsScanning] = React.useState(false);
  const [budget, setBudget] = React.useState<number | null>(null);
  const [historicalSpend, setHistoricalSpend] = React.useState(1240.5);

  // Wardrobe State
  const [wardrobeItems, setWardrobeItems] = React.useState<WardrobeItem[]>([
    {
      id: 10,
      name: "White Oxford Shirt",
      price: 75,
      image:
        "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800",
      category: "Tops",
    },
    {
      id: 11,
      name: "Slim Chinos",
      price: 65,
      image:
        "https://images.unsplash.com/photo-1473963456416-d17a72e078c8?auto=format&fit=crop&q=80&w=800",
      category: "Bottoms",
    },
    {
      id: 12,
      name: "Leather Chelsea Boots",
      price: 150,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
      category: "Footwear",
    },
    {
      id: 13,
      name: "Wool Overcoat",
      price: 220,
      image:
        "https://images.unsplash.com/photo-1539533397308-a61e4e7c9a44?auto=format&fit=crop&q=80&w=800",
      category: "Outerwear",
    },
    {
      id: 14,
      name: "Knit Sweater",
      price: 95,
      image:
        "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=800",
      category: "Tops",
    },
    {
      id: 15,
      name: "Cotton Beanie",
      price: 25,
      image:
        "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=800",
      category: "Accessories",
    },
    {
      id: 16,
      name: "Linen Shirt",
      price: 55,
      image:
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
      category: "Tops",
    },
    {
      id: 17,
      name: "Canvas Sneakers",
      price: 45,
      image:
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800",
      category: "Footwear",
    },
    {
      id: 18,
      name: "Leather Belt",
      price: 40,
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
      category: "Accessories",
    },
  ]);
  const [activeCategory, setActiveCategory] =
    React.useState<ClothingCategory>("All");
  const [wardrobeSearch, setWardrobeSearch] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  // Outfit Builder State
  const [outfits, setOutfits] = React.useState<Outfit[]>([
    { id: 1, name: "Smart Casual Monday", items: [] },
  ]);
  const [activeOutfitId, setActiveOutfitId] = React.useState<number | null>(
    null,
  );
  const [isCreatingOutfit, setIsCreatingOutfit] = React.useState(false);
  const [newOutfitName, setNewOutfitName] = React.useState("");
  const [outfitBuilderOpen, setOutfitBuilderOpen] = React.useState(false);

  // Tinder Swipe State
  const [itemsToReview] = React.useState([
    {
      id: 1,
      name: "Vintage Denim Jacket",
      price: 85,
      image:
        "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800",
      isClothing: true,
      category: "Outerwear" as ClothingCategory,
    },
    {
      id: 2,
      name: "Organic Coffee Beans",
      price: 18,
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&q=80&w=800",
      isClothing: false,
      category: "Accessories" as ClothingCategory,
    },
    {
      id: 3,
      name: "Minimalist Leather Boots",
      price: 160,
      image:
        "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=800",
      isClothing: true,
      category: "Footwear" as ClothingCategory,
    },
    {
      id: 4,
      name: "Smart LED Bulb",
      price: 25,
      image:
        "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=800",
      isClothing: false,
      category: "Accessories" as ClothingCategory,
    },
    {
      id: 5,
      name: "Graphic Cotton Tee",
      price: 32,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
      isClothing: true,
      category: "Tops" as ClothingCategory,
    },
  ]);
  const [reviewIndex, setReviewIndex] = React.useState(0);
  const [swipeDirection, setSwipeDirection] = React.useState<
    "left" | "right" | null
  >(null);
  const [showSwipeTip, setShowSwipeTip] = React.useState(true);

  // Recommendations
  const recommendations = [
    {
      id: 101,
      name: "Slim Fit Chinos",
      price: 65,
      image:
        "https://images.unsplash.com/photo-1473963456416-d17a72e078c8?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Uniqlo",
    },
    {
      id: 102,
      name: "Linen Button Down",
      price: 55,
      image:
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Everlane",
    },
    {
      id: 103,
      name: "Canvas Sneakers",
      price: 45,
      image:
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Converse",
    },
    {
      id: 104,
      name: "Wool Overcoat",
      price: 220,
      image:
        "https://images.unsplash.com/photo-1539533397308-a61e4e7c9a44?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Nordstrom",
    },
    {
      id: 105,
      name: "Denim Jacket",
      price: 89,
      image:
        "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Levi's",
    },
    {
      id: 106,
      name: "Leather Belt",
      price: 40,
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Fossil",
    },
    {
      id: 107,
      name: "Cotton Beanie",
      price: 25,
      image:
        "https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Carhartt",
    },
    {
      id: 108,
      name: "Oxford Shirt",
      price: 75,
      image:
        "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "J.Crew",
    },
    {
      id: 109,
      name: "Chelsea Boots",
      price: 150,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Dr. Martens",
    },
    {
      id: 110,
      name: "Knit Sweater",
      price: 95,
      image:
        "https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=800",
      link: "#",
      source: "Patagonia",
    },
  ];

  const onboardingData = [
    {
      title: "Scan Your Digital Purchases",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
      description:
        "WardrobeSuite securely connects to your Gmail account, scanning for purchase receipts to automatically build your digital wardrobe and track your spending habits.",
    },
    {
      title: "Set a Budget and Style Preferences",
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
      description:
        "Customize your experience by setting a monthly clothing budget and selecting your style preferences. WardrobeSuite learns from your choices to provide personalized recommendations.",
    },
    {
      title: "Advanced Security",
      image:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
      description:
        "Rest easy knowing your data is protected by enterprise-grade encryption and protocols.",
    },
    {
      title: "Scalable Infrastructure",
      image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
      description:
        "Our platform grows with you, handling everything from your first user to your first million.",
    },
  ];

  const categories: ClothingCategory[] = [
    "All",
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Footwear",
    "Swimwear",
    "Undergarments",
    "Accessories",
  ];

  const filteredWardrobe = wardrobeItems.filter((item) => {
    const matchesCategory =
      activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.name
      .toLowerCase()
      .includes(wardrobeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeOutfit = outfits.find((o) => o.id === activeOutfitId) || null;

  const addItemToOutfit = (item: WardrobeItem) => {
    if (!activeOutfitId) return;
    setOutfits((prev) =>
      prev.map((outfit) => {
        if (outfit.id !== activeOutfitId) return outfit;
        if (outfit.items.find((i) => i.id === item.id)) return outfit;
        return { ...outfit, items: [...outfit.items, item] };
      }),
    );
  };

  const removeItemFromOutfit = (outfitId: number, itemId: number) => {
    setOutfits((prev) =>
      prev.map((outfit) => {
        if (outfit.id !== outfitId) return outfit;
        return {
          ...outfit,
          items: outfit.items.filter((i) => i.id !== itemId),
        };
      }),
    );
  };

  const createOutfit = () => {
    if (!newOutfitName.trim()) return;
    const newOutfit: Outfit = {
      id: Date.now(),
      name: newOutfitName.trim(),
      items: [],
    };
    setOutfits((prev) => [...prev, newOutfit]);
    setActiveOutfitId(newOutfit.id);
    setNewOutfitName("");
    setIsCreatingOutfit(false);
    setOutfitBuilderOpen(true);
  };

  const deleteOutfit = (id: number) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
    if (activeOutfitId === id) setActiveOutfitId(null);
  };

  const nextSlide = () =>
    setCarouselIndex((p) => (p + 1) % onboardingData.length);
  const prevSlide = () =>
    setCarouselIndex(
      (p) => (p - 1 + onboardingData.length) % onboardingData.length,
    );

  const startScanning = () => {
    setView("scanning");
    setIsScanning(true);
    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 3) + 1;
      setScannedCount(count);
      if (count >= 42) {
        clearInterval(interval);
        setIsScanning(false);
      }
    }, 200);
  };

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction);
    const currentItem = itemsToReview[reviewIndex];
    if (direction === "right" && currentItem.isClothing) {
      setWardrobeItems((prev) => {
        if (prev.find((i) => i.id === currentItem.id)) return prev;
        return [
          ...prev,
          {
            id: currentItem.id,
            name: currentItem.name,
            price: currentItem.price,
            image: currentItem.image,
            category: currentItem.category,
          },
        ];
      });
    }
    setTimeout(() => {
      if (reviewIndex < itemsToReview.length - 1) {
        setReviewIndex((p) => p + 1);
        setSwipeDirection(null);
      } else {
        setView("consumer dashboard");
      }
    }, 200);
  };

  const [recommendationIndex, setRecommendationIndex] = React.useState(0);
  const nextRec = () =>
    setRecommendationIndex((p) => (p + 1) % (recommendations.length - 4));
  const prevRec = () =>
    setRecommendationIndex(
      (p) =>
        (p - 1 + (recommendations.length - 4)) % (recommendations.length - 4),
    );

  // Reusable class strings
  const inputCls = `w-full px-4 py-3 text-base ${tk.inputBg} border ${tk.inputBorder} rounded-xl ${tk.inputFocus} ${tk.inputText} placeholder:${tk.mutedText} focus:outline-none focus:ring-2 transition-all`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider ${tk.mutedText} mb-1.5`;

  // Shared dark-mode toggle button
  const DarkToggle = () => (
    <button
      onClick={() => setIsDark((d) => !d)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-10 h-10 rounded-full flex items-center justify-center ${tk.navBtn} transition-colors`}
    >
      {isDark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );

  // Render
  return (
    <div
      className={`min-h-screen font-sans ${tk.pageBg} ${tk.bodyText} flex flex-col transition-colors duration-300`}
    >
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${tk.headerBg} backdrop-blur-md border-b ${tk.border} transition-colors duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center relative">
          {/* Clickable logo */}
          <motion.button
            layout
            onClick={() => setView("landing")}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            aria-label="Go to home"
            className={`flex items-center gap-2 absolute ${
              [
                "landing",
                "consumer dashboard",
                "budget",
                "wardrobe",
                "profile",
              ].includes(view)
                ? "left-4 sm:left-6"
                : "left-1/2 -translate-x-1/2"
            }`}
          >
            <img
              src="Images/Logo.png"
              alt="WardrobeSuite logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover"
            />
            <span
              className={`font-bold text-lg sm:text-xl tracking-tight ${tk.headingText}`}
            >
              WardrobeSuite
            </span>
          </motion.button>

          {/* Landing desktop nav */}
          <AnimatePresence>
            {view === "landing" && (
              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="hidden md:flex items-center gap-6 ml-auto"
              >
                <a
                  href="#MeetTheTeam"
                  className={`text-sm font-medium ${tk.subtleText} hover:${tk.accentText} transition-colors`}
                >
                  Meet The Team
                </a>
                <button
                  onClick={() => setView("signin")}
                  className={`text-sm font-medium ${tk.subtleText} hover:${tk.accentText} transition-colors`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setView("signup")}
                  className={`px-5 py-2.5 ${tk.accentBg} text-white rounded-full text-sm font-semibold ${tk.accentHover} transition-all`}
                  style={{
                    backgroundColor: isDark ? "white" : "black",
                    color: isDark ? "black" : "white",
                  }}
                >
                  Get Started
                </button>
                <DarkToggle />
              </motion.nav>
            )}
          </AnimatePresence>

          {/* App nav (dashboard / wardrobe / profile) */}
          <AnimatePresence>
            {["consumer dashboard", "budget", "wardrobe", "profile"].includes(
              view,
            ) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-2 sm:gap-3"
              >
                <button
                  onClick={() => setView("wardrobe")}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${view === "wardrobe" ? `${tk.accentBg} text-white` : tk.navBtn}`}
                  aria-label="Wardrobe"
                >
                  <Shirt size={14} />
                  <span className="hidden sm:inline">Wardrobe</span>
                </button>
                <button
                  onClick={() => setView("consumer dashboard")}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${view === "consumer dashboard" ? (isDark ? "bg-slate-100 text-slate-900" : "bg-slate-900 text-white") : tk.navBtn}`}
                  aria-label="Dashboard"
                >
                  <span className="hidden sm:inline">Dashboard</span>
                  <span className="sm:hidden">Home</span>
                </button>
                <button
                  onClick={() => setView("profile")}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${view === "profile" ? `${tk.accentBg} text-white` : tk.navBtn}`}
                  aria-label="Profile"
                >
                  <User size={17} />
                </button>
                <DarkToggle />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auth / intermediate pages: just show dark toggle */}
          {[
            "signup",
            "signin",
            "onboarding",
            "verification",
            "scanning",
            "review",
          ].includes(view) && (
            <div className="ml-auto">
              <DarkToggle />
            </div>
          )}

          {/* ── Mobile hamburger (landing only) */}
          {view === "landing" && (
            <div className="md:hidden flex items-center gap-2 ml-auto">
              <DarkToggle />
              <button
                className={`p-2 ${tk.subtleText}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle navigation"
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && view === "landing" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${tk.cardBg} border-b ${tk.border} px-5 py-5 flex flex-col gap-3 overflow-hidden`}
            >
              <a
                href="#MeetTheTeam"
                onClick={() => setIsMenuOpen(false)}
                className={`text-base font-semibold ${tk.headingText} py-2`}
              >
                Meet The Team
              </a>
              <button
                onClick={() => {
                  setView("signin");
                  setIsMenuOpen(false);
                }}
                className={`w-full py-3.5 text-base font-semibold ${tk.headingText} border ${tk.border} rounded-2xl`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setView("signup");
                  setIsMenuOpen(false);
                }}
                className={`w-full py-3.5 text-base font-semibold text-white ${tk.accentBg} ${tk.accentHover} rounded-2xl transition-all`}
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/*  MAIN */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* LANDING */}
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Hero */}
              <section className="pt-28 sm:pt-36 pb-16 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <span
                      className={`inline-block px-3 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-bold uppercase tracking-widest mb-5`}
                    >
                      Smart Wardrobe Management
                    </span>
                    <h1
                      className={`text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight ${tk.headingText} mb-6 leading-[1.1]`}
                    >
                      Sync your style,
                      <br />
                      <span className={tk.accentText}>budget your closet.</span>
                    </h1>
                    <p
                      className={`text-lg sm:text-xl ${tk.subtleText} mb-10 max-w-lg leading-relaxed`}
                    >
                      Manage your digital wardrobe and budget in a single
                      application. WardrobeSuite analyzes your purchase history,
                      monitors spending, and recommends items aligned with your
                      style and financial goals.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => setView("signup")}
                        className={`px-8 py-4 ${tk.accentBg} text-white rounded-2xl font-semibold ${tk.accentHover} transition-all shadow-lg text-base`}
                      >
                        Get Started
                      </button>
                      <button
                        onClick={() => setView("signin")}
                        className={`px-8 py-4 ${tk.mutedBg} ${tk.bodyText} rounded-2xl font-semibold hover:opacity-80 transition-all text-base border ${tk.border}`}
                      >
                        Sign In
                      </button>
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="relative"
                  >
                    <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
                      <img
                        src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=2426"
                        alt="WardrobeSuite dashboard preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -z-10 opacity-60" />
                    <div className="absolute -top-6 -right-6 w-48 h-48 bg-sky-100 rounded-full blur-3xl -z-10 opacity-60" />
                  </motion.div>
                </div>
              </section>

              {/* Scroll indicator */}
              <div className="flex justify-center pb-8">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className={`flex flex-col items-center gap-2 ${tk.mutedText}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Scroll for more
                  </span>
                  <ChevronDown size={20} />
                </motion.div>
              </div>

              {/* Meet the team header */}
              <section
                id="MeetTheTeam"
                className={`pt-16 pb-10 ${tk.surfaceBg} px-4 sm:px-6`}
              >
                <div className="max-w-7xl mx-auto text-center mb-10">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className={`text-3xl sm:text-5xl md:text-6xl font-bold ${tk.headingText} mb-5`}
                  >
                    Meet Our Student Engineers
                  </motion.h2>
                  <p className={`text-lg ${tk.subtleText} max-w-2xl mx-auto`}>
                    One idea, whiteboard sketches, and a long weekend hackathon
                    later, WardrobeSuite was born.
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className={`max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl border ${tk.border}`}
                >
                  <img
                    src="Images/Team&Richie.jpg"
                    alt="The WardrobeSuite team"
                    className="w-full h-auto"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </section>

              {/* Pull-quote */}
              <section className="py-10 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto text-center">
                  <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className={`text-xl sm:text-3xl md:text-4xl font-bold ${tk.headingText} leading-tight`}
                  >
                    From the Bronx, Queens and Manhattan, learn more about this
                    trio and their roles in this project.
                  </motion.h2>
                </div>
              </section>

              {/* Team grid */}
              <section className="pt-4 pb-24 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                  {[
                    {
                      name: "Darlyn Gomez",
                      role: "Project Lead & AI Developer",
                      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
                      desc: "Track every interaction as it happens. Our low-latency data pipeline ensures you're always looking at the most current information.",
                    },
                    {
                      name: "Dylan Chan",
                      role: "Fintech Logic & Backend Developer",
                      img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
                      desc: "Your data is protected by industry-leading encryption and compliance standards. We take security as seriously as you do.",
                    },
                    {
                      name: "Luther Barreiro Roxo",
                      role: "UI/UX & Frontend Developer",
                      img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
                      desc: "Built for teams of all sizes. Share projects, leave comments, and collaborate in real-time without missing a beat.",
                    },
                  ].map((student, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group"
                    >
                      <div
                        className={`aspect-video rounded-2xl overflow-hidden mb-6 ${tk.mutedBg}`}
                      >
                        <img
                          src={student.img}
                          alt={student.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h3
                        className={`text-xl sm:text-2xl font-bold ${tk.headingText} mb-1`}
                      >
                        {student.name}
                      </h3>
                      <h4 className={`text-base ${tk.mutedText} mb-3`}>
                        {student.role}
                      </h4>
                      <p className={`${tk.subtleText} leading-relaxed`}>
                        {student.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* Sign up/sign in */}
          {(view === "signup" || view === "signin") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
            >
              <div
                className={`max-w-md w-full ${tk.cardBg} p-6 sm:p-8 rounded-3xl shadow-xl border ${tk.border}`}
              >
                <div className="text-center mb-6">
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${tk.headingText} mb-1`}
                  >
                    {view === "signup" ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className={`text-base ${tk.subtleText}`}>
                    {view === "signup"
                      ? "Start building your smart wardrobe today!"
                      : "Sign in to your account."}
                  </p>
                </div>

                {/* Consumer / Business toggle (signup only) */}
                {view === "signup" && (
                  <div
                    className={`flex ${tk.surfaceBg} rounded-2xl p-1 mb-6 border ${tk.border}`}
                  >
                    <button
                      onClick={() => setAccountType("consumer")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${accountType === "consumer" ? `${tk.cardBg} ${tk.headingText} shadow-sm border ${tk.border}` : tk.mutedText}`}
                    >
                      <User size={15} /> Consumer
                    </button>
                    <button
                      onClick={() => setAccountType("business")}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${accountType === "business" ? `${tk.cardBg} ${tk.headingText} shadow-sm border ${tk.border}` : tk.mutedText}`}
                    >
                      <Building2 size={15} /> Business
                    </button>
                  </div>
                )}

                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (view === "signup") {
                      const fd = new FormData(e.currentTarget);
                      setUser({
                        firstName:
                          (fd.get("firstName") as string) ||
                          (fd.get("businessName") as string) ||
                          "",
                        lastName: (fd.get("lastName") as string) || "",
                        email: fd.get("email") as string,
                      });
                      setView("onboarding");
                    } else {
                      setView("consumer dashboard");
                    }
                  }}
                >
                  {/* Consumer fields */}
                  {view === "signup" && accountType === "consumer" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="firstName" className={labelCls}>
                          First Name
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          className={inputCls}
                          placeholder="Jane"
                          autoComplete="given-name"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className={labelCls}>
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          className={inputCls}
                          placeholder="Doe"
                          autoComplete="family-name"
                        />
                      </div>
                    </div>
                  )}

                  {/* Business fields */}
                  {view === "signup" && accountType === "business" && (
                    <>
                      <div>
                        <label htmlFor="businessName" className={labelCls}>
                          Business Name
                        </label>
                        <input
                          id="businessName"
                          name="businessName"
                          type="text"
                          required
                          className={inputCls}
                          placeholder="Acme Fashion Co."
                          autoComplete="organization"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label htmlFor="industry" className={labelCls}>
                            Industry
                          </label>
                          <select
                            id="industry"
                            name="industry"
                            required
                            className={inputCls}
                          >
                            <option value="">Select…</option>
                            <option>Retail</option>
                            <option>Wholesale</option>
                            <option>Fashion Design</option>
                            <option>E-commerce</option>
                            <option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="companySize" className={labelCls}>
                            Company Size
                          </label>
                          <select
                            id="companySize"
                            name="companySize"
                            required
                            className={inputCls}
                          >
                            <option value="">Select…</option>
                            <option>1–10</option>
                            <option>11–50</option>
                            <option>51–200</option>
                            <option>200+</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  <div>
                    <label htmlFor="email" className={labelCls}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className={inputCls}
                      placeholder="jane@example.com"
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="password" className={labelCls}>
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      className={inputCls}
                      placeholder="••••••••"
                      autoComplete={
                        view === "signup" ? "new-password" : "current-password"
                      }
                    />
                  </div>

                  <button
                    type="submit"
                    className={`w-full py-4 ${tk.accentBg} text-white rounded-2xl font-bold ${tk.accentHover} transition-all shadow-lg mt-2 flex items-center justify-center gap-2 group text-base`}
                  >
                    {view === "signup"
                      ? accountType === "business"
                        ? "Create Business Account"
                        : "Create Account"
                      : "Sign In"}
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </form>

                <p className={`text-center text-sm ${tk.mutedText} mt-6`}>
                  {view === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => setView("signin")}
                        className={`${tk.accentText} font-semibold hover:underline`}
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => setView("signup")}
                        className={`${tk.accentText} font-semibold hover:underline`}
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/*ONBOARDING*/}
          {view === "onboarding" && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 pb-10 px-4 sm:px-6 flex-1 flex flex-col items-center justify-center"
            >
              <div className="max-w-4xl w-full text-center mb-5">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`inline-block px-3 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-bold uppercase tracking-widest mb-3`}
                >
                  Welcome to WardrobeSuite!
                </motion.span>
                <h2
                  className={`text-xl sm:text-2xl font-bold ${tk.headingText} mb-1`}
                >
                  Before we continue,{" "}
                  <span className={tk.accentText}>here's what to expect…</span>
                </h2>
              </div>
              <div className="max-w-3xl w-full relative px-8 sm:px-12">
                <div
                  className={`overflow-hidden rounded-3xl ${tk.surfaceBg} border ${tk.border} shadow-lg`}
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={carouselIndex}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -50 }}
                      transition={{ duration: 0.4 }}
                      className="grid md:grid-cols-2 items-center"
                    >
                      <div className="aspect-video md:aspect-auto md:h-[240px]">
                        <img
                          src={onboardingData[carouselIndex].image}
                          alt={onboardingData[carouselIndex].title}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="p-6 text-left">
                        <h3
                          className={`text-lg font-bold ${tk.headingText} mb-2`}
                        >
                          {onboardingData[carouselIndex].title}
                        </h3>
                        <p
                          className={`text-sm sm:text-base ${tk.subtleText} leading-relaxed mb-5`}
                        >
                          {onboardingData[carouselIndex].description}
                        </p>
                        <div className="flex gap-1.5">
                          {onboardingData.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${i === carouselIndex ? `w-6 ${tk.accentBg}` : `w-1.5 ${tk.mutedBg}`}`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <button
                  onClick={prevSlide}
                  aria-label="Previous slide"
                  className={`absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 ${tk.cardBg} rounded-full shadow-md border ${tk.border} flex items-center justify-center ${tk.subtleText} hover:${tk.accentText} transition-all z-10`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  aria-label="Next slide"
                  className={`absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 ${tk.cardBg} rounded-full shadow-md border ${tk.border} flex items-center justify-center ${tk.subtleText} hover:${tk.accentText} transition-all z-10`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setView("verification")}
                className={`mt-8 px-7 py-3.5 ${isDark ? "bg-slate-200 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-800"} rounded-2xl font-bold transition-all flex items-center gap-2 text-sm`}
              >
                Get Started with WardrobeSuite <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/*VERIFICATION*/}
          {view === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pt-20 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
            >
              <div
                className={`max-w-md w-full ${tk.cardBg} p-8 rounded-3xl shadow-xl border ${tk.border} text-center`}
              >
                <div
                  className={`w-16 h-16 ${tk.accentSubtle} rounded-2xl flex items-center justify-center ${tk.accentText} mx-auto mb-6`}
                >
                  <Mail size={32} />
                </div>
                <h2 className={`text-2xl font-bold ${tk.headingText} mb-3`}>
                  Verify your Email
                </h2>
                <p
                  className={`text-base ${tk.subtleText} mb-8 leading-relaxed`}
                >
                  We've sent a verification link to{" "}
                  <span className={`font-semibold ${tk.headingText}`}>
                    {user.email}
                  </span>
                  . Click the link to connect your account and start scanning.
                </p>
                <button
                  onClick={() => {
                    setIsVerified(true);
                    startScanning();
                  }}
                  className={`w-full py-4 ${tk.accentBg} text-white rounded-2xl font-bold ${tk.accentHover} transition-all flex items-center justify-center gap-2 text-base`}
                >
                  <CheckCircle size={20} /> I've Verified My Email
                </button>
                <button
                  className={`mt-4 text-sm font-medium ${tk.mutedText} hover:${tk.accentText} transition-colors`}
                >
                  Resend verification link
                </button>
              </div>
            </motion.div>
          )}

          {/*SCANNING*/}
          {view === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
            >
              <div className="max-w-md w-full text-center">
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1, rotate: 360 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{
                          rotate: {
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          },
                          opacity: { duration: 0.3 },
                        }}
                        className={`absolute inset-0 border-4 ${isDark ? "border-indigo-900 border-t-indigo-400" : "border-indigo-100 border-t-indigo-600"} rounded-full`}
                      />
                    )}
                  </AnimatePresence>
                  <div
                    className={`absolute inset-0 flex items-center justify-center ${tk.accentText}`}
                  >
                    <AnimatePresence mode="wait">
                      {isScanning ? (
                        <motion.div
                          key="mail"
                          initial={{ opacity: 0, y: 16, scale: 0.7 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.7 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 18,
                          }}
                        >
                          <Mail size={32} />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 12,
                          }}
                        >
                          <CheckCircle size={40} className="text-emerald-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <p className={`text-lg sm:text-xl ${tk.subtleText} mb-8`}>
                  WardrobeSuite has scanned{" "}
                  <span className={`font-bold ${tk.accentText} tabular-nums`}>
                    {scannedCount}
                  </span>{" "}
                  items to be reviewed
                </p>
                <button
                  disabled={isScanning}
                  onClick={() => setView("review")}
                  className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 text-base ${
                    isScanning
                      ? `${tk.mutedBg} ${tk.mutedText} cursor-not-allowed`
                      : `${tk.accentBg} text-white ${tk.accentHover} shadow-lg`
                  }`}
                >
                  Begin Reviewing <ArrowRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {/*Item review swiping*/}
          {view === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 pb-10 px-4 sm:px-6 flex-1 flex flex-col items-center justify-center"
            >
              <div className="max-w-md w-full text-center mb-6">
                <h2
                  className={`text-3xl sm:text-4xl font-bold ${tk.headingText} mb-2`}
                >
                  Review Scanned Items
                </h2>
                <p className={`text-lg ${tk.subtleText}`}>
                  Swipe right for clothing, left for everything else.
                </p>
              </div>
              <div className="relative w-full max-w-[300px] sm:max-w-[320px] aspect-[3/4]">
                <AnimatePresence mode="popLayout">
                  {itemsToReview
                    .slice(reviewIndex, reviewIndex + 1)
                    .map((item) => (
                      <motion.div
                        key={item.id}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        onDragEnd={(_, info) => {
                          if (info.offset.x > 80) handleSwipe("right");
                          else if (info.offset.x < -80) handleSwipe("left");
                        }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{
                          x: swipeDirection === "right" ? 400 : -400,
                          opacity: 0,
                          rotate: swipeDirection === "right" ? 15 : -15,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        className={`absolute inset-0 ${tk.swipeCard} rounded-3xl shadow-xl border overflow-hidden cursor-grab active:cursor-grabbing`}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-3/5 object-cover pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-5">
                          <h3
                            className={`text-xl font-bold ${tk.headingText} mb-1`}
                          >
                            {item.name}
                          </h3>
                          <p className={`font-bold text-xl ${tk.accentText}`}>
                            ${item.price}
                          </p>
                          {item.isClothing && (
                            <span
                              className={`inline-block mt-2 px-3 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} text-xs font-bold rounded-full uppercase tracking-wider`}
                            >
                              {item.category}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                {reviewIndex >= itemsToReview.length && (
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center text-center p-6 ${tk.surfaceBg} rounded-3xl border-2 border-dashed ${tk.border}`}
                  >
                    <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={26} />
                    </div>
                    <h3 className={`text-xl font-bold ${tk.headingText} mb-1`}>
                      All Done!
                    </h3>
                    <p className={`text-sm ${tk.subtleText} mb-6`}>
                      You've reviewed all scanned items. Let's head to your
                      dashboard!
                    </p>
                    <button
                      onClick={() => setView("consumer dashboard")}
                      className={`px-6 py-3 ${isDark ? "bg-slate-200 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-800"} rounded-2xl font-bold transition-all text-sm`}
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>

              {/* Tap buttons accessibility */}
              {reviewIndex < itemsToReview.length && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSwipe("left")}
                    className={`px-7 py-3 ${tk.mutedBg} ${tk.bodyText} rounded-2xl font-bold text-sm hover:opacity-80 transition-all border ${tk.border}`}
                    aria-label="Skip — not clothing"
                  >
                    ✕ Skip
                  </button>
                  <button
                    onClick={() => handleSwipe("right")}
                    className={`px-7 py-3 ${tk.accentBg} text-white rounded-2xl font-bold text-sm ${tk.accentHover} transition-all`}
                    aria-label="Add to wardrobe"
                  >
                    ✓ Add
                  </button>
                </div>
              )}

              <AnimatePresence>
                {showSwipeTip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`fixed center left-1/2 -translate-x-1/2 max-w-[400px] w-[calc(100%-2rem)] ${isDark ? "bg-slate-700" : "bg-slate-900"} text-white p-4 rounded-2xl shadow-xl z-50`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm font-bold uppercase tracking-widest ${tk.accentText}`}
                      >
                        Information
                      </span>
                      <button
                        onClick={() => setShowSwipeTip(false)}
                        aria-label="Dismiss tip"
                        className="text-slate-400 hover:text-white"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Swipe or add{" "}
                      <span className="text-emerald-400 font-bold">RIGHT</span>{" "}
                      on clothing. Swipe or skip{" "}
                      <span className="text-red-400 font-bold">LEFT</span> on
                      others.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* DASHBOARD */}
          {view === "consumer dashboard" && (
            <motion.div
              key="consumer dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 sm:pt-24 pb-10 px-4 sm:px-6 max-w-screen-xl mx-auto flex-1 overflow-hidden flex flex-col w-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${tk.headingText}`}
                  >
                    Hi, {user.firstName || "there"}!
                  </h2>
                  <p className={`text-base ${tk.subtleText} mt-0.5`}>
                    Your smart wardrobe is ready to go!
                  </p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-5 min-h-0">
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setReviewIndex(0);
                      startScanning();
                    }}
                    className={`p-4 sm:p-5 ${tk.accentBg} rounded-2xl text-white shadow-lg flex flex-col justify-between group cursor-pointer col-span-1`}
                  >
                    <div>
                      <h3 className="text-sm sm:text-base font-bold mb-1">
                        Scan New Items
                      </h3>
                      <p className="text-xs text-white/70 hidden sm:block">
                        Check your Gmail for new receipts.
                      </p>
                    </div>
                    <div className="flex justify-end mt-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <RefreshCw size={16} />
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    onClick={() => setView("wardrobe")}
                    className={`p-4 sm:p-5 ${tk.skySubtle} border ${tk.border} rounded-2xl flex flex-col justify-between group cursor-pointer hover:opacity-90 transition-all col-span-1`}
                  >
                    <div>
                      <h3
                        className={`text-sm sm:text-base font-bold ${tk.headingText} mb-1`}
                      >
                        My Wardrobe
                      </h3>
                      <p className={`text-xs ${tk.mutedText} hidden sm:block`}>
                        Browse saved items & build outfits.
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-xl font-bold ${tk.skyText}`}>
                        {wardrobeItems.length} items
                      </span>
                      <div
                        className={`w-8 h-8 ${tk.mutedBg} rounded-lg flex items-center justify-center`}
                      >
                        <Shirt size={16} className={tk.skyText} />
                      </div>
                    </div>
                  </motion.div>

                  <div
                    className={`p-4 sm:p-5 ${tk.cardBg} rounded-2xl border ${tk.border} shadow-sm flex flex-col justify-center`}
                  >
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} mb-1 block`}
                    >
                      Style Match
                    </span>
                    <div
                      className={`text-xl sm:text-2xl font-bold ${tk.headingText} mb-1`}
                    >
                      92%
                    </div>
                    <p className={`text-xs ${tk.mutedText}`}>
                      Based on recent reviews
                    </p>
                  </div>

                  <div
                    className={`p-4 sm:p-5 ${tk.cardBg} rounded-2xl border ${tk.border} shadow-sm flex flex-col justify-center`}
                  >
                    <span
                      className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} mb-1 block`}
                    >
                      Total Savings
                    </span>
                    <div className="text-xl sm:text-2xl font-bold text-emerald-500 mb-1">
                      $240
                    </div>
                    <p className={`text-xs ${tk.mutedText}`}>
                      From budget optimization
                    </p>
                  </div>
                </div>

                {/* Recommendations carousel */}
                <div
                  className={`flex-1 ${tk.surfaceBg} rounded-3xl p-4 sm:p-6 flex flex-col min-h-0 border ${tk.border}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3
                      className={`text-base sm:text-lg font-bold ${tk.headingText}`}
                    >
                      Recommended for You
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={prevRec}
                        aria-label="Previous"
                        className={`p-2 rounded-full border ${tk.border} ${tk.subtleText} hover:${tk.accentText} transition-all`}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextRec}
                        aria-label="Next"
                        className={`p-2 rounded-full border ${tk.border} ${tk.subtleText} hover:${tk.accentText} transition-all`}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <motion.div
                      animate={{
                        x: `calc(-${recommendationIndex * 20}% - ${recommendationIndex * 3.2}px)`,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                      className="flex gap-4 h-full"
                    >
                      {recommendations.map((item) => (
                        <div
                          key={item.id}
                          className={`w-[calc(20%-12.8px)] flex-none ${tk.cardBg} rounded-2xl p-3 sm:p-4 border ${tk.border} shadow-sm flex flex-col group`}
                        >
                          <div
                            className={`aspect-[16/10] rounded-xl overflow-hidden mb-3 ${tk.mutedBg} flex-none`}
                          >
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 flex flex-col min-h-0">
                            <h4
                              className={`text-sm font-bold ${tk.headingText} mb-1 line-clamp-1`}
                            >
                              {item.name}
                            </h4>
                            <p className={`text-xs ${tk.mutedText} mb-3`}>
                              at{" "}
                              <span
                                className={`font-semibold ${tk.subtleText}`}
                              >
                                {item.source}
                              </span>
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                              <span
                                className={`text-sm font-bold ${tk.accentText}`}
                              >
                                ${item.price}
                              </span>
                              <a
                                href={item.link}
                                className={`px-3 py-1.5 ${isDark ? "bg-slate-200 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-700"} rounded-lg transition-all text-xs font-bold flex items-center gap-1`}
                              >
                                Shop <ExternalLink size={10} />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* WARDROBE*/}
          {view === "wardrobe" && (
            <motion.div
              key="wardrobe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 sm:pt-24 pb-10 px-4 sm:px-6 max-w-screen-xl mx-auto flex-1 w-full"
            >
              {/* Page header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                <div>
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${tk.headingText}`}
                  >
                    My Wardrobe
                  </h2>
                  <p className={`text-sm sm:text-base ${tk.subtleText} mt-1`}>
                    {wardrobeItems.length} saved items · {outfits.length}{" "}
                    outfits created
                  </p>
                </div>
                <button
                  onClick={() => setOutfitBuilderOpen((o) => !o)}
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${outfitBuilderOpen ? `${tk.skyBg} text-white ${tk.skyHover}` : isDark ? "bg-slate-200 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                >
                  <Sparkles size={17} />
                  {outfitBuilderOpen
                    ? "Hide Outfit Builder"
                    : "Build an Outfit"}
                </button>
              </div>

              <div
                className={`flex gap-6 ${outfitBuilderOpen ? "flex-col lg:flex-row" : "flex-col"}`}
              >
                {/* Items side */}
                <div
                  className={outfitBuilderOpen ? "lg:flex-1 min-w-0" : "w-full"}
                >
                  {/* Search + Filter bar */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search
                        size={15}
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${tk.mutedText}`}
                      />
                      <input
                        type="text"
                        placeholder="Search wardrobe…"
                        value={wardrobeSearch}
                        onChange={(e) => setWardrobeSearch(e.target.value)}
                        aria-label="Search wardrobe"
                        className={`w-full pl-10 pr-4 py-2.5 ${tk.inputBg} border ${tk.inputBorder} rounded-xl text-base ${tk.inputFocus} ${tk.inputText} placeholder:${tk.mutedText} focus:outline-none focus:ring-2 transition-all`}
                      />
                    </div>

                    {/* Filter button + panel */}
                    <div className="relative">
                      <button
                        onClick={() => setFilterOpen((o) => !o)}
                        aria-expanded={filterOpen}
                        aria-haspopup="dialog"
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          activeCategory !== "All"
                            ? `${tk.accentBg} text-white border-transparent`
                            : `${tk.inputBg} ${tk.bodyText} ${tk.inputBorder} hover:border-indigo-400`
                        }`}
                      >
                        <Tag size={14} />
                        <span className="hidden sm:inline">
                          {activeCategory === "All" ? "Filter" : activeCategory}
                        </span>
                        <ChevronDown
                          size={13}
                          className={`transition-transform ${filterOpen ? "rotate-180" : ""}`}
                        />
                      </button>

                      <AnimatePresence>
                        {filterOpen && (
                          <>
                            {/* Mobile backdrop */}
                            <div
                              className="fixed inset-0 bg-black/30 z-30 md:hidden"
                              onClick={() => setFilterOpen(false)}
                              aria-hidden="true"
                            />

                            <motion.div
                              role="dialog"
                              aria-label="Filter wardrobe"
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.2 }}
                              className={`
                                fixed inset-x-0 bottom-0 z-40 ${tk.filterBg} rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto
                                md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2
                                md:w-72 md:rounded-2xl md:shadow-xl md:max-h-none md:overflow-visible border ${tk.border}
                              `}
                            >
                              {/* Mobile drag handle */}
                              <div
                                className={`w-10 h-1 ${tk.mutedBg} rounded-full mx-auto mb-5 md:hidden`}
                              />

                              <div className="flex justify-between items-center mb-4">
                                <h3
                                  className={`text-base font-bold ${tk.headingText}`}
                                >
                                  Filter Wardrobe
                                </h3>
                                <button
                                  onClick={() => setFilterOpen(false)}
                                  aria-label="Close filter"
                                  className={`${tk.mutedText} hover:${tk.bodyText} p-1`}
                                >
                                  <X size={18} />
                                </button>
                              </div>

                              <div className="space-y-2">
                                <FilterSection
                                  title="Category"
                                  isOpen={openSection === "category"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "category" ? null : "category",
                                    )
                                  }
                                  tk={tk}
                                >
                                  <div className="space-y-0.5 pt-1">
                                    {categories.map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${activeCategory === cat ? tk.filterActiveItem : `${tk.bodyText} ${tk.filterItemHover}`}`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                </FilterSection>

                                <FilterSection
                                  title="Season"
                                  isOpen={openSection === "season"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "season" ? null : "season",
                                    )
                                  }
                                  tk={tk}
                                >
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {["Spring", "Summer", "Fall", "Winter"].map(
                                      (s) => (
                                        <button
                                          key={s}
                                          className={`px-3 py-2 rounded-xl text-sm font-medium border ${tk.border} ${tk.filterPillBg} transition-colors`}
                                        >
                                          {s}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </FilterSection>

                                <FilterSection
                                  title="Sleeve Length"
                                  isOpen={openSection === "sleeve"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "sleeve" ? null : "sleeve",
                                    )
                                  }
                                  tk={tk}
                                >
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {["Sleeveless", "Short", "3/4", "Long"].map(
                                      (s) => (
                                        <button
                                          key={s}
                                          className={`px-3 py-2 rounded-xl text-sm font-medium border ${tk.border} ${tk.filterPillBg} transition-colors`}
                                        >
                                          {s}
                                        </button>
                                      ),
                                    )}
                                  </div>
                                </FilterSection>

                                <FilterSection
                                  title="Color"
                                  isOpen={openSection === "color"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "color" ? null : "color",
                                    )
                                  }
                                  tk={tk}
                                >
                                  <div className="flex flex-wrap gap-3 pt-2">
                                    {[
                                      { name: "Black", hex: "#18181b" },
                                      { name: "White", hex: "#f8fafc" },
                                      { name: "Navy", hex: "#1e3a5f" },
                                      { name: "Gray", hex: "#71717a" },
                                      { name: "Brown", hex: "#92400e" },
                                      { name: "Green", hex: "#16a34a" },
                                      { name: "Red", hex: "#dc2626" },
                                      { name: "Blue", hex: "#2563eb" },
                                      { name: "Pink", hex: "#ec4899" },
                                      { name: "Yellow", hex: "#eab308" },
                                    ].map((c) => (
                                      <button
                                        key={c.name}
                                        title={c.name}
                                        aria-label={c.name}
                                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ring-1 ring-slate-300"
                                        style={{ backgroundColor: c.hex }}
                                      />
                                    ))}
                                  </div>
                                </FilterSection>

                                <FilterSection
                                  title="Fit"
                                  isOpen={openSection === "fit"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "fit" ? null : "fit",
                                    )
                                  }
                                  tk={tk}
                                >
                                  <div className="flex flex-wrap gap-2 pt-2">
                                    {[
                                      "Slim",
                                      "Regular",
                                      "Relaxed",
                                      "Oversized",
                                    ].map((f) => (
                                      <button
                                        key={f}
                                        className={`px-3 py-2 rounded-xl text-sm font-medium border ${tk.border} ${tk.filterPillBg} transition-colors`}
                                      >
                                        {f}
                                      </button>
                                    ))}
                                  </div>
                                </FilterSection>
                              </div>

                              <div
                                className={`mt-5 pt-4 border-t ${tk.border} flex justify-between items-center`}
                              >
                                <button
                                  onClick={() => {
                                    setActiveCategory("All");
                                    setFilterOpen(false);
                                  }}
                                  className={`text-sm font-bold ${tk.mutedText} hover:text-red-500 transition-colors`}
                                >
                                  Clear all
                                </button>
                                <button
                                  onClick={() => setFilterOpen(false)}
                                  className={`px-5 py-2.5 ${isDark ? "bg-slate-200 text-slate-900 hover:bg-white" : "bg-slate-900 text-white hover:bg-slate-800"} rounded-xl text-sm font-bold transition-all`}
                                >
                                  Apply
                                </button>
                              </div>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Items grid */}
                  {filteredWardrobe.length === 0 ? (
                    <div className={`py-20 text-center ${tk.mutedText}`}>
                      <Shirt size={44} className="mx-auto mb-3 opacity-30" />
                      <p className="text-base font-medium">
                        No items in this category yet.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
                    >
                      <AnimatePresence>
                        {filteredWardrobe.map((item, i) => (
                          <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ delay: i * 0.03 }}
                            className={`group ${tk.cardBg} rounded-2xl border ${tk.border} shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all`}
                          >
                            <div
                              className={`aspect-square overflow-hidden ${tk.mutedBg} relative`}
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              {outfitBuilderOpen && activeOutfitId && (
                                <button
                                  onClick={() => addItemToOutfit(item)}
                                  aria-label={`Add ${item.name} to outfit`}
                                  className={`absolute inset-0 ${tk.skyBg}/85 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity`}
                                >
                                  <Plus size={24} />
                                  <span className="text-xs font-bold uppercase tracking-wider">
                                    Add to Outfit
                                  </span>
                                </button>
                              )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                              <span
                                className={`text-xs font-bold uppercase tracking-wider ${tk.mutedText} mb-1`}
                              >
                                {item.category}
                              </span>
                              <h4
                                className={`text-sm font-bold ${tk.headingText} line-clamp-2 flex-1`}
                              >
                                {item.name}
                              </h4>
                              <p
                                className={`text-sm font-bold ${tk.accentText} mt-1`}
                              >
                                ${item.price}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                {/* Outfit Builder panel */}
                <AnimatePresence>
                  {outfitBuilderOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="lg:w-80 xl:w-96 flex-none"
                    >
                      <div
                        className={`${tk.surfaceBg} rounded-3xl border ${tk.border} p-5 sticky top-24`}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div
                            className={`w-8 h-8 ${tk.skyBg} rounded-lg flex items-center justify-center`}
                          >
                            <Sparkles size={15} className="text-white" />
                          </div>
                          <h3
                            className={`text-base font-bold ${tk.headingText}`}
                          >
                            Outfit Builder
                          </h3>
                        </div>

                        {/* Outfit chips */}
                        <div className="flex gap-2 flex-wrap mb-4">
                          {outfits.map((outfit) => (
                            <button
                              key={outfit.id}
                              onClick={() =>
                                setActiveOutfitId(
                                  outfit.id === activeOutfitId
                                    ? null
                                    : outfit.id,
                                )
                              }
                              className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${activeOutfitId === outfit.id ? `${tk.skyBg} text-white` : `${tk.cardBg} border ${tk.border} ${tk.bodyText} hover:border-indigo-400`}`}
                            >
                              {outfit.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteOutfit(outfit.id);
                                }}
                                aria-label={`Delete ${outfit.name}`}
                                className={`opacity-60 hover:opacity-100 transition-opacity ${activeOutfitId === outfit.id ? "text-white/70 hover:text-white" : `${tk.mutedText} hover:text-red-500`}`}
                              >
                                <X size={10} />
                              </button>
                            </button>
                          ))}
                        </div>

                        {/* New outfit input or button */}
                        {isCreatingOutfit ? (
                          <div className="flex gap-2 mb-4">
                            <input
                              autoFocus
                              value={newOutfitName}
                              onChange={(e) => setNewOutfitName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") createOutfit();
                                if (e.key === "Escape")
                                  setIsCreatingOutfit(false);
                              }}
                              placeholder="Outfit name…"
                              aria-label="New outfit name"
                              className={`flex-1 px-3 py-2 ${tk.inputBg} border ${tk.inputBorder} rounded-xl text-sm ${tk.inputFocus} ${tk.inputText} focus:outline-none focus:ring-2 transition-all`}
                            />
                            <button
                              onClick={createOutfit}
                              className={`px-3 py-2 ${tk.skyBg} text-white rounded-xl text-xs font-bold ${tk.skyHover} transition-all`}
                            >
                              Create
                            </button>
                            <button
                              onClick={() => setIsCreatingOutfit(false)}
                              className={`px-3 py-2 ${tk.mutedBg} ${tk.bodyText} rounded-xl text-xs font-bold hover:opacity-80 transition-all`}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsCreatingOutfit(true)}
                            className={`w-full mb-4 py-2.5 border-2 border-dashed ${tk.border} rounded-xl text-sm font-bold ${tk.mutedText} hover:border-sky-400 hover:text-sky-500 transition-all flex items-center justify-center gap-1.5`}
                          >
                            <Plus size={15} /> New Outfit
                          </button>
                        )}

                        {/* Active outfit items */}
                        {activeOutfit ? (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p
                                className={`text-xs font-bold ${tk.mutedText} uppercase tracking-wider`}
                              >
                                {activeOutfit.name}
                              </p>
                              <span className={`text-xs ${tk.mutedText}`}>
                                {activeOutfit.items.length} items
                              </span>
                            </div>
                            {activeOutfit.items.length === 0 ? (
                              <div
                                className={`py-8 text-center ${tk.mutedText} border-2 border-dashed ${tk.border} rounded-2xl`}
                              >
                                <Shirt
                                  size={30}
                                  className="mx-auto mb-2 opacity-40"
                                />
                                <p className="text-sm font-medium">
                                  Hover an item and tap
                                  <br />
                                  "Add to Outfit" to start building
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {activeOutfit.items.map((item) => (
                                  <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    className={`flex items-center gap-3 ${tk.cardBg} rounded-xl p-2.5 border ${tk.border} group`}
                                  >
                                    <div
                                      className={`w-10 h-10 rounded-lg overflow-hidden flex-none ${tk.mutedBg}`}
                                    >
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p
                                        className={`text-xs font-bold ${tk.headingText} truncate`}
                                      >
                                        {item.name}
                                      </p>
                                      <p className={`text-xs ${tk.mutedText}`}>
                                        {item.category} ·{" "}
                                        <span
                                          className={`${tk.accentText} font-bold`}
                                        >
                                          ${item.price}
                                        </span>
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeItemFromOutfit(
                                          activeOutfit.id,
                                          item.id,
                                        )
                                      }
                                      aria-label={`Remove ${item.name}`}
                                      className={`opacity-0 group-hover:opacity-100 focus:opacity-100 ${tk.mutedText} hover:text-red-500 transition-all`}
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </motion.div>
                                ))}
                                <div
                                  className={`pt-2 mt-2 border-t ${tk.border} flex justify-between items-center`}
                                >
                                  <span
                                    className={`text-xs font-bold uppercase tracking-wider ${tk.mutedText}`}
                                  >
                                    Total Value
                                  </span>
                                  <span
                                    className={`text-sm font-bold ${tk.accentText}`}
                                  >
                                    $
                                    {activeOutfit.items.reduce(
                                      (sum, i) => sum + i.price,
                                      0,
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className={`py-6 text-center ${tk.mutedText}`}>
                            <Tag
                              size={26}
                              className="mx-auto mb-2 opacity-30"
                            />
                            <p className="text-sm">
                              Select an outfit above to edit, or create a new
                              one.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* User profile */}
          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
            >
              <div
                className={`max-w-2xl w-full ${tk.cardBg} p-6 sm:p-8 rounded-3xl shadow-xl border ${tk.border}`}
              >
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => setView("consumer dashboard")}
                    className={`text-sm font-bold ${tk.mutedText} hover:${tk.accentText} transition-colors flex items-center gap-1.5`}
                  >
                    <ChevronLeft size={16} /> Back to Dashboard
                  </button>
                  <button
                    onClick={() => setView("landing")}
                    className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-10">
                  <div>
                    <h2 className={`text-2xl font-bold ${tk.headingText} mb-5`}>
                      User Profile
                    </h2>
                    <div className="space-y-3">
                      {[
                        {
                          label: "Full Name",
                          value:
                            `${user.firstName} ${user.lastName}`.trim() || "—",
                        },
                        { label: "Email Address", value: user.email || "—" },
                      ].map(({ label, value }) => (
                        <div
                          key={label}
                          className={`p-4 ${tk.surfaceBg} rounded-xl border ${tk.border}`}
                        >
                          <label
                            className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} block mb-1`}
                          >
                            {label}
                          </label>
                          <p
                            className={`text-base font-semibold ${tk.headingText}`}
                          >
                            {value}
                          </p>
                        </div>
                      ))}
                      <div
                        className={`p-4 ${tk.surfaceBg} rounded-xl border ${tk.border}`}
                      >
                        <label
                          className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} block mb-1`}
                        >
                          Account Status
                        </label>
                        <div className="flex items-center gap-2 text-emerald-500">
                          <CheckCircle size={16} />
                          <span className="text-base font-semibold">
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${tk.headingText} mb-5`}>
                      Budget Settings
                    </h2>
                    <p
                      className={`text-sm ${tk.subtleText} mb-5 leading-relaxed`}
                    >
                      Based on your scanned receipts, you've spent an average of{" "}
                      <span className={`font-bold ${tk.headingText}`}>
                        ${historicalSpend.toFixed(0)}
                      </span>{" "}
                      per month on clothing.
                    </p>
                    <div className="space-y-5">
                      <div>
                        <label htmlFor="monthlyBudget" className={labelCls}>
                          Monthly Clothing Budget ($)
                        </label>
                        <div className="relative">
                          <span
                            className={`absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold ${tk.mutedText}`}
                          >
                            $
                          </span>
                          <input
                            id="monthlyBudget"
                            type="number"
                            defaultValue={budget || 500}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            aria-label="Monthly clothing budget in dollars"
                            className={`w-full pl-10 pr-4 py-3 ${tk.inputBg} border ${tk.inputBorder} rounded-xl text-xl font-bold ${tk.inputFocus} ${tk.inputText} focus:outline-none focus:ring-2 transition-all`}
                            placeholder="500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setView("consumer dashboard")}
                        className={`w-full py-4 ${tk.accentBg} text-white rounded-2xl font-bold text-base ${tk.accentHover} transition-all shadow-lg`}
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer*/}
      <footer
        className={`py-6 border-t ${tk.border} px-4 sm:px-6 ${tk.pageBg} transition-colors duration-300`}
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img
              src="Images/Logo.png"
              alt="WardrobeSuite logo"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover"
            />
            <span
              className={`font-bold text-lg tracking-tight ${tk.headingText}`}
            >
              WardrobeSuite
            </span>
          </div>
          <p className={`${tk.mutedText} text-sm text-center`}>
            © 2026 WardrobeSuite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
