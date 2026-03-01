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
  CreditCard,
  ExternalLink,
  RefreshCw,
  Shirt,
  ShoppingBag,
  Plus,
  Trash2,
  Sparkles,
  Tag,
} from "lucide-react";

// ── Backend URL ───────────────────────────────────────────────────────────────
// Change this one string if your backend moves (e.g. to a Render deployment URL)
const API = "http://localhost:8000";

type ViewState =
  | "landing"
  | "signup"
  | "signin"
  | "onboarding"
  | "verification"
  | "scanning"
  | "review"
  | "dashboard"
  | "budget"
  | "wardrobe";

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

// ── FilterSection accordion component ────────────────────────────────────────
function FilterSection({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-100 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex justify-between items-center px-3 py-2.5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
      >
        {title}
        <ChevronDown
          size={14}
          className={`transition-transform text-zinc-400 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export default function App() {
  const [view, setView] = React.useState<ViewState>("landing");
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [carouselIndex, setCarouselIndex] = React.useState(0);

  // User & App State
  const [user, setUser] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [isVerified, setIsVerified] = React.useState(false);
  const [scannedCount, setScannedCount] = React.useState(0);
  const [isScanning, setIsScanning] = React.useState(false);
  const [budget, setBudget] = React.useState<number | null>(null);
  const [historicalSpend, setHistoricalSpend] = React.useState(1240.5);

  // ── Backend connection state ──────────────────────────────────────────────
  // userId: UUID assigned by backend after Gmail OAuth. Persisted in localStorage.
  // Sent as X-User-Id header on every fetch() call.
  const [userId, setUserId] = React.useState<string>(
    () => localStorage.getItem("wardrobeUserId") || ""
  );
  // manualPrice: typed by user for items where price_missing=true (e.g. SHEIN)
  const [manualPrice, setManualPrice] = React.useState<string>("");
  const apiHeaders = () => ({
    "Content-Type": "application/json",
    "X-User-Id": userId,
  });

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
    null
  );
  const [isCreatingOutfit, setIsCreatingOutfit] = React.useState(false);
  const [newOutfitName, setNewOutfitName] = React.useState("");
  const [outfitBuilderOpen, setOutfitBuilderOpen] = React.useState(false);

  // Tinder Swipe State
  const [itemsToReview, setItemsToReview] = React.useState([
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

  // Recommendations Mock Data
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

  const categoryIcons: Record<string, string> = {
    All: "👕",
    Tops: "👕",
    Bottoms: "👖",
    Dresses: "👗",
    Outerwear: "🧥",
    Footwear: "👟",
    Swimwear: "🩱",
    Undergarments: "🩲",
    Accessories: "🧢",
  };

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
        if (outfit.items.find((i) => i.id === item.id)) return outfit; // prevent duplicates
        return { ...outfit, items: [...outfit.items, item] };
      })
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
      })
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
    setCarouselIndex((prev) => (prev + 1) % onboardingData.length);
  const prevSlide = () =>
    setCarouselIndex(
      (prev) => (prev - 1 + onboardingData.length) % onboardingData.length
    );

  const startScanning = async (uid?: string) => {
    // uid only needed on very first login — React state for userId hasn't
    // updated yet when this is called right after setUserId()
    const effectiveId = uid || userId;
    setView("scanning");
    setIsScanning(true);
    setScannedCount(0);

    try {
      // POST /scan/initial → backend fetches Gmail, runs Gemini, queues items
      const res = await fetch(`${API}/scan/initial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": effectiveId,
        },
        body: JSON.stringify({ initial_scan_days: 90 }),
      });
      const data = await res.json();
      // Show the real count Gemini actually found — not a fake random number
      setScannedCount(data.queued_count ?? 0);
    } catch {
      setScannedCount(0); // backend unreachable — show 0, user can still proceed
    } finally {
      setIsScanning(false);
    }

    // Pre-load review queue so cards are ready when user clicks "Begin Reviewing"
    try {
      const res = await fetch(`${API}/review-items`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": effectiveId,
        },
      });
      const items = await res.json();
      setItemsToReview(items); // replaces the 5 hardcoded fake items
      setReviewIndex(0);
    } catch {
      /* keep existing state */
    }
  };

  const handleSwipe = async (direction: "left" | "right") => {
    setSwipeDirection(direction);
    const currentItem = itemsToReview[reviewIndex];
    if (!currentItem) return;

    if (direction === "right") {
      // POST /review-items/{id}/approve
      // Only send edited_price_cents if user typed a manual price
      const body: Record<string, any> = {};
      if ((currentItem as any).price_missing && manualPrice) {
        body.edited_price_cents = Math.round(parseFloat(manualPrice) * 100);
      }
      try {
        const res = await fetch(
          `${API}/review-items/${currentItem.id}/approve`,
          {
            method: "POST",
            headers: apiHeaders(),
            body: JSON.stringify(body),
          }
        );
        if (res.ok) {
          const approved = await res.json();
          // Add to local wardrobe immediately so dashboard count updates
          setWardrobeItems((prev) => {
            if (prev.find((i) => i.id === approved.wardrobe_item_id))
              return prev;
            return [
              ...prev,
              {
                id: approved.wardrobe_item_id,
                name: approved.item_name,
                price: (approved.price_cents ?? 0) / 100,
                image:
                  (currentItem as any).image_url ||
                  currentItem.image ||
                  "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800",
                category:
                  (approved.category as ClothingCategory) || "Accessories",
              },
            ];
          });
        }
      } catch {
        /* skip on error, still advance */
      }
    } else {
      // POST /review-items/{id}/reject — marks item as rejected in DB
      try {
        await fetch(`${API}/review-items/${currentItem.id}/reject`, {
          method: "POST",
          headers: apiHeaders(),
          body: JSON.stringify({}),
        });
      } catch {
        /* still advance even if this fails */
      }
    }

    setManualPrice("");
    setTimeout(() => {
      if (reviewIndex < itemsToReview.length - 1) {
        setReviewIndex((prev) => prev + 1);
        setSwipeDirection(null);
      } else {
        setView("dashboard");
      }
    }, 200);
  };

  // ── Load real wardrobe items from backend when dashboard view opens ──────
  // Runs whenever view changes. Only fetches when on dashboard and userId exists.
  // Replaces the 9 hardcoded placeholder items with real approved wardrobe items.
  React.useEffect(() => {
    if (view !== "dashboard" || !userId) return;
    fetch(`${API}/items`, { headers: apiHeaders() })
      .then((r) => r.json())
      .then((data: any[]) => {
        const mapped = data.map((item) => ({
          id: item.id,
          name: item.item_name,
          price: (item.price_cents ?? 0) / 100,
          image:
            item.image_url ||
            "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800",
          category: (item.category as ClothingCategory) || "Accessories",
        }));
        setWardrobeItems(mapped);
      })
      .catch(() => {});
  }, [view, userId]);

  const [recommendationIndex, setRecommendationIndex] = React.useState(0);
  const nextRec = () =>
    setRecommendationIndex((prev) => (prev + 1) % (recommendations.length - 4));
  const prevRec = () =>
    setRecommendationIndex(
      (prev) =>
        (prev - 1 + (recommendations.length - 4)) % (recommendations.length - 4)
    );

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center relative">
          <motion.div
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`flex items-center gap-2 absolute ${
              ["landing", "dashboard", "budget", "wardrobe"].includes(view)
                ? "left-6"
                : "left-1/2 -translate-x-1/2"
            }`}
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl font-display">
              W
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              WardrobeSuite
            </span>
          </motion.div>

          <AnimatePresence>
            {view === "landing" && (
              <motion.nav
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="hidden md:flex items-center gap-8 ml-auto"
              >
                <a
                  href="#MeetTheTeam"
                  className="text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors"
                >
                  Meet The Team
                </a>
                <button
                  onClick={() => setView("signin")}
                  className="text-sm font-medium text-zinc-600 hover:text-indigo-600 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setView("signup")}
                  className="px-5 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-all"
                >
                  Get Started
                </button>
              </motion.nav>
            )}
          </AnimatePresence>

          {/* Dashboard/Wardrobe Nav */}
          <AnimatePresence>
            {["dashboard", "budget", "wardrobe", "profile"].includes(view) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-auto flex items-center gap-3"
              >
                <button
                  onClick={() => setView("wardrobe")}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    view === "wardrobe"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  <Shirt size={14} />
                  Wardrobe
                </button>
                <button
                  onClick={() => setView("dashboard")}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    view === "dashboard"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView("profile")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    view === "profile"
                      ? "bg-indigo-600 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  <User size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {view === "landing" && (
            <button
              className="md:hidden p-2 text-zinc-600 ml-auto"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isMenuOpen && view === "landing" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-b border-zinc-100 px-6 py-6 flex flex-col gap-4 overflow-hidden"
            >
              <a
                href="#MeetTheTeam"
                onClick={() => setIsMenuOpen(false)}
                className="text-lg font-medium text-zinc-900"
              >
                Meet The Team
              </a>
              <button
                onClick={() => {
                  setView("signin");
                  setIsMenuOpen(false);
                }}
                className="w-full py-3 text-zinc-900 font-medium border border-zinc-200 rounded-xl"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setView("signup");
                  setIsMenuOpen(false);
                }}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* ==================== LANDING ==================== */}
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section className="pt-32 pb-12 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-left"
                  >
                    <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight text-zinc-900 mb-6 leading-[1.1]">
                      Sync your style; <br />
                      <span className="text-indigo-600">
                        budget your closet.
                      </span>
                    </h1>
                    <p className="text-lg md:text-xl text-zinc-600 mb-10 max-w-lg leading-relaxed">
                      Manage your digital wardrobe and budget in a single
                      application. By analyzing your digital purchase history,
                      WardrobeSuite monitors spending and recommends new items
                      that align with your established style and financial
                      goals.
                    </p>
                    <button
                      onClick={() => setView("signup")}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                      Get Started
                    </button>
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
                        alt="Hero Dashboard"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -z-10 opacity-60" />
                    <div className="absolute -top-6 -right-6 w-48 h-48 bg-purple-100 rounded-full blur-3xl -z-10 opacity-60" />
                  </motion.div>
                </div>
              </section>
              <div className="flex justify-center pb-8">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex flex-col items-center gap-2 text-zinc-400"
                >
                  <span className="text-xs font-semibold uppercase tracking-widest">
                    Scroll for more
                  </span>
                  <ChevronDown size={20} />
                </motion.div>
              </div>
              <section id="MeetTheTeam" className="pt-16 pb-8 bg-zinc-50 px-6">
                <div className="max-w-7xl mx-auto text-center mb-8">
                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-4xl md:text-6xl font-display font-bold text-zinc-900 mb-6"
                  >
                    Meet Our Student Engineers
                  </motion.h2>
                  <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                    Initial whiteboard sketches to a functional app, meet the
                    student team that brought WardrobeSuite to life over one
                    intense weekend.
                  </p>
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-zinc-200"
                >
                  <img
                    src="Images/Team&Richie.jpg"
                    alt="Main Feature Visual"
                    className="w-full h-auto"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              </section>
              <section className="py-8 px-6">
                <div className="max-w-4xl mx-auto text-center">
                  <motion.h2
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-xl md:text-4xl font-display font-bold text-zinc-900 leading-tight"
                  >
                    From the Bronx, Queens and Manhattan, learn more about this
                    trio and their roles in this project.
                  </motion.h2>
                </div>
              </section>
              <section className="pt-8 pb-24 px-6">
                <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-12">
                  {[
                    {
                      name: "Darlyn Gomez",
                      role: "Computer Science BS",
                      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
                      desc: "Track every interaction as it happens. Our low-latency data pipeline ensures you're always looking at the most current information.",
                    },
                    {
                      name: "Dylan Chan",
                      role: "Cybersecurity BS",
                      img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
                      desc: "Your data is protected by industry-leading encryption and compliance standards. We take security as seriously as you do.",
                    },
                    {
                      name: "Luther Barreiro Roxo",
                      role: "Game Design and Development BS",
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
                      <div className="aspect-video rounded-2xl overflow-hidden mb-8 bg-zinc-100">
                        <img
                          src={student.img}
                          alt={student.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <h3 className="text-2xl font-display font-bold text-zinc-900 mb-2">
                        {student.name}
                      </h3>
                      <h4 className="text-lg font-display font-normal text-zinc-500 mb-4">
                        {student.role}
                      </h4>
                      <p className="text-zinc-600 leading-relaxed">
                        {student.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* ==================== SIGN UP / SIGN IN ==================== */}
          {(view === "signup" || view === "signin") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20 pb-10 px-6 flex-1 flex items-center justify-center"
            >
              <div className="max-w-md w-full bg-white p-6 rounded-[2.5rem] shadow-xl border border-zinc-100">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-display font-bold text-zinc-900 mb-1">
                    {view === "signup" ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className="text-sm text-zinc-500">
                    {view === "signup"
                      ? "Start building your smart wardrobe today!"
                      : "Sign in to your account."}
                  </p>
                </div>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (view === "signup") {
                      const formData = new FormData(e.currentTarget);
                      setUser({
                        firstName: formData.get("firstName") as string,
                        lastName: formData.get("lastName") as string,
                        email: formData.get("email") as string,
                      });
                      setView("onboarding");
                    } else {
                      setView("dashboard");
                    }
                  }}
                >
                  {view === "signup" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                          First Name
                        </label>
                        <input
                          name="firstName"
                          type="text"
                          required
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                          placeholder="Jane"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                          Last Name
                        </label>
                        <input
                          name="lastName"
                          type="text"
                          required
                          className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                          placeholder="Doe"
                        />
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                      Email Address
                    </label>
                    <input
                      name="email"
                      type="email"
                      required
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="jane.doe@gmail.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mt-2 flex items-center justify-center gap-2 group text-sm"
                  >
                    {view === "signup" ? "Create Account" : "Sign In"}
                    <ArrowRight
                      size={16}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </button>
                </form>
                <p className="text-center text-xs text-zinc-400 mt-6">
                  {view === "signup" ? (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => setView("signin")}
                        className="text-indigo-600 font-semibold"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Don't have an account?{" "}
                      <button
                        onClick={() => setView("signup")}
                        className="text-indigo-600 font-semibold"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* ==================== ONBOARDING ==================== */}
          {view === "onboarding" && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 pb-10 px-6 flex-1 flex flex-col items-center justify-center"
            >
              <div className="max-w-4xl w-full text-center mb-4">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-widest mb-2"
                >
                  Welcome to WardrobeSuite!
                </motion.span>
                <h2 className="text-xl md:text-2xl font-display font-bold text-zinc-900 mb-1">
                  Before we continue, <br />
                  <span className="text-indigo-600 text-lg">
                    here's what to expect...
                  </span>
                </h2>
              </div>
              <div className="max-w-3xl w-full relative px-8">
                <div className="overflow-hidden rounded-[2rem] bg-zinc-50 border border-zinc-100 shadow-lg">
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
                        <h3 className="text-lg font-display font-bold text-zinc-900 mb-2">
                          {onboardingData[carouselIndex].title}
                        </h3>
                        <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                          {onboardingData[carouselIndex].description}
                        </p>
                        <div className="flex gap-1.5">
                          {onboardingData.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 rounded-full transition-all duration-300 ${
                                i === carouselIndex
                                  ? "w-5 bg-indigo-600"
                                  : "w-1 bg-zinc-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <button
                  onClick={prevSlide}
                  className="absolute -left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-zinc-100 flex items-center justify-center text-zinc-600 hover:text-indigo-600 transition-all z-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextSlide}
                  className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-md border border-zinc-100 flex items-center justify-center text-zinc-600 hover:text-indigo-600 transition-all z-10"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setView("verification")}
                className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 text-xs"
              >
                Get Started with WardrobeSuite <ArrowRight size={14} />
              </motion.button>
            </motion.div>
          )}

          {/* ==================== VERIFICATION ==================== */}
          {view === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pt-20 pb-10 px-6 flex-1 flex items-center justify-center"
            >
              <div className="max-w-md w-full bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100 text-center">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-6">
                  <Mail size={32} />
                </div>
                <h2 className="text-2xl font-display font-bold text-zinc-900 mb-3">
                  Verify your Email
                </h2>
                <p className="text-sm text-zinc-600 mb-8 leading-relaxed">
                  We've sent a verification link to{" "}
                  <span className="font-semibold text-zinc-900">
                    {user.email}
                  </span>
                  . Please click the link to connect your account and start
                  scanning.
                </p>
                <button
                  onClick={() => {
                    setIsVerified(true);
                    startScanning();
                  }}
                  className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <CheckCircle size={18} /> I've Verified My Email
                </button>
                <button className="mt-4 text-xs font-medium text-zinc-400 hover:text-indigo-600 transition-colors">
                  Resend verification link
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== SCANNING ==================== */}
          {view === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 pb-10 px-6 flex-1 flex items-center justify-center"
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
                        className="absolute inset-0 border-4 border-indigo-100 border-t-indigo-600 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                  <div className="absolute inset-0 flex items-center justify-center text-indigo-600">
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
                <p className="text-lg text-zinc-600 mb-8">
                  WardrobeSuite has scanned{" "}
                  <span className="font-bold text-indigo-600 tabular-nums">
                    {scannedCount}
                  </span>{" "}
                  items to be reviewed
                </p>
                <button
                  disabled={isScanning}
                  onClick={() => setView("review")}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm ${
                    isScanning
                      ? "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                  }`}
                >
                  Begin Reviewing <ArrowRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== REVIEW (SWIPE) ==================== */}
          {view === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-20 pb-10 px-6 flex-1 flex flex-col items-center justify-center"
            >
              <div className="max-w-md w-full text-center mb-6">
                <h2 className="text-4xl font-display font-bold text-zinc-900 mb-1">
                  Review Scanned Items
                </h2>
                <p className="text-lg text-zinc-500">
                  Swipe right for clothing, left for everything else.
                </p>
              </div>
              <div className="relative w-full max-w-[280px] aspect-[3/4]">
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
                        className="absolute inset-0 bg-white rounded-[2rem] shadow-xl border border-zinc-100 overflow-hidden cursor-grab active:cursor-grabbing"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-3/5 object-cover pointer-events-none"
                          referrerPolicy="no-referrer"
                        />
                        <div className="p-5">
                          <h3 className="text-lg font-display font-bold text-zinc-900 mb-1">
                            {item.name}
                          </h3>
                          <p className="text-indigo-600 font-bold text-lg">
                            ${item.price}
                          </p>
                          {item.isClothing && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-wider">
                              {item.category}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </AnimatePresence>
                {reviewIndex >= itemsToReview.length && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-zinc-50 rounded-[2rem] border-2 border-dashed border-zinc-200">
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle size={24} />
                    </div>
                    <h3 className="text-xl font-display font-bold text-zinc-900 mb-1">
                      All Done!
                    </h3>
                    <p className="text-xs text-zinc-500 mb-6">
                      You've reviewed all scanned items. Let's head to your
                      dashboard.
                    </p>
                    <button
                      onClick={() => setView("dashboard")}
                      className="px-6 py-2.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm"
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>
              <AnimatePresence>
                {showSwipeTip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="fixed bottom-10 left-1/2 -translate-x-1/2 max-w-[400px] w-full bg-zinc-900 text-white p-4 rounded-xl shadow-xl z-50"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[15px] font-bold uppercase tracking-widest text-indigo-400">
                        Information
                      </span>
                      <button
                        onClick={() => setShowSwipeTip(false)}
                        className="text-zinc-500 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <p className="text-[12px] text-zinc-300 leading-relaxed">
                      Swipe{" "}
                      <span className="text-emerald-400 font-bold">RIGHT</span>{" "}
                      on clothing. Swipe{" "}
                      <span className="text-red-400 font-bold">LEFT</span> on
                      others.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ==================== DASHBOARD ==================== */}
          {view === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-24 pb-10 px-6 max-w-screen-xl mx-auto flex-1 overflow-hidden flex flex-col w-full"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-display font-bold text-zinc-900">
                    Hi, {user.firstName || "User"}!
                  </h2>
                  <p className="text-sm text-zinc-500">
                    Your smart wardrobe is ready to go!
                  </p>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-6 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100 flex flex-col justify-between group cursor-pointer"
                    onClick={() => {
                      setReviewIndex(0);
                      setView("scanning");
                      startScanning();
                    }}
                  >
                    <div>
                      <h3 className="text-base font-display font-bold mb-1">
                        Scan New Items
                      </h3>
                      <p className="text-[10px] text-indigo-100">
                        Check your Gmail for new receipts.
                      </p>
                    </div>
                    <div className="flex items-center justify-end mt-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <RefreshCw size={16} className="text-white" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Wardrobe shortcut card */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-5 bg-violet-50 border border-violet-100 rounded-2xl flex flex-col justify-between group cursor-pointer hover:bg-violet-100 transition-all"
                    onClick={() => setView("wardrobe")}
                  >
                    <div>
                      <h3 className="text-base font-display font-bold text-violet-900 mb-1">
                        My Wardrobe
                      </h3>
                      <p className="text-[10px] text-violet-500">
                        Browse saved items & build outfits.
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xl font-display font-bold text-violet-700">
                        {wardrobeItems.length} items
                      </span>
                      <div className="w-8 h-8 bg-violet-200 rounded-lg flex items-center justify-center group-hover:bg-violet-300 transition-all">
                        <Shirt size={16} className="text-violet-700" />
                      </div>
                    </div>
                  </motion.div>

                  <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
                      Style Match
                    </span>
                    <div className="text-xl font-display font-bold text-zinc-900 mb-1">
                      92%
                    </div>
                    <p className="text-[9px] text-zinc-500">
                      Based on recent reviews
                    </p>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-1 block">
                      Total Savings
                    </span>
                    <div className="text-xl font-display font-bold text-emerald-600 mb-1">
                      $240
                    </div>
                    <p className="text-[9px] text-zinc-500">
                      From budget optimization
                    </p>
                  </div>
                </div>

                <div className="flex-1 bg-zinc-50 rounded-[2rem] p-6 flex flex-col min-h-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-display font-bold text-zinc-900">
                      Recommended for You
                    </h3>
                    <div className="flex gap-1.5">
                      <button
                        onClick={prevRec}
                        className="p-1.5 rounded-full border border-zinc-200 text-zinc-600 hover:bg-white transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button
                        onClick={nextRec}
                        className="p-1.5 rounded-full border border-zinc-200 text-zinc-600 hover:bg-white transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-hidden">
                    <motion.div
                      animate={{
                        x: `calc(-${recommendationIndex * 20}% - ${
                          recommendationIndex * 3.2
                        }px)`,
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
                          className="w-[calc(20%-12.8px)] flex-none bg-white rounded-2xl p-4 border border-zinc-100 shadow-sm flex flex-col group"
                        >
                          <div className="aspect-[16/10] rounded-xl overflow-hidden mb-4 bg-zinc-50 flex-none">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="flex-1 flex flex-col min-h-0">
                            <h4 className="text-sm font-display font-bold text-zinc-900 mb-1 line-clamp-1">
                              {item.name}
                            </h4>
                            <p className="text-xs text-zinc-500 mb-4">
                              Available at{" "}
                              <span className="font-semibold text-zinc-700">
                                {item.source}
                              </span>
                            </p>
                            <div className="mt-auto flex items-center justify-between">
                              <span className="text-sm font-bold text-indigo-600">
                                ${item.price}
                              </span>
                              <a
                                href={item.link}
                                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                              >
                                Shop Now <ExternalLink size={10} />
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

          {/* ==================== WARDROBE ==================== */}
          {view === "wardrobe" && (
            <motion.div
              key="wardrobe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-24 pb-10 px-6 max-w-screen-xl mx-auto flex-1 w-full"
            >
              {/* Page Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className="text-3xl font-display font-bold text-zinc-900">
                    My Wardrobe
                  </h2>
                  <p className="text-sm text-zinc-500 mt-1">
                    {wardrobeItems.length} saved items · {outfits.length}{" "}
                    outfits created
                  </p>
                </div>
                <button
                  onClick={() => setOutfitBuilderOpen((o) => !o)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                    outfitBuilderOpen
                      ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                      : "bg-zinc-900 text-white hover:bg-zinc-800"
                  }`}
                >
                  <Sparkles size={16} />
                  {outfitBuilderOpen
                    ? "Hide Outfit Builder"
                    : "Build an Outfit"}
                </button>
              </div>

              {/* Two-column layout when outfit builder is open */}
              <div
                className={`flex gap-6 ${
                  outfitBuilderOpen ? "flex-col lg:flex-row" : "flex-col"
                }`}
              >
                {/* LEFT: Wardrobe Items */}
                <div
                  className={outfitBuilderOpen ? "lg:flex-1 min-w-0" : "w-full"}
                >
                  {/* Search + Filter */}
                  <div className="mb-5 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                      <Search
                        size={15}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
                      />
                      <input
                        type="text"
                        placeholder="Search wardrobe..."
                        value={wardrobeSearch}
                        onChange={(e) => setWardrobeSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      />
                    </div>

                    <div className="relative">
                      <button
                        onClick={() => setFilterOpen((o) => !o)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                          activeCategory !== "All"
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-zinc-50 text-zinc-600 border-zinc-100 hover:border-zinc-300"
                        }`}
                      >
                        <Tag size={14} />
                        {activeCategory === "All" ? "Filter" : activeCategory}
                        <ChevronDown
                          size={13}
                          className={`transition-transform ${
                            filterOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {filterOpen && (
                          <>
                            {/* Mobile backdrop */}
                            <div
                              className="fixed inset-0 bg-black/20 z-30 md:hidden"
                              onClick={() => setFilterOpen(false)}
                            />

                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.2 }}
                              className="
            fixed inset-x-0 bottom-0 z-40 bg-white rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto
            md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2
            md:w-72 md:rounded-2xl md:shadow-xl md:max-h-none md:overflow-visible
          "
                            >
                              {/* Mobile drag handle */}
                              <div className="w-10 h-1 bg-zinc-200 rounded-full mx-auto mb-5 md:hidden" />

                              <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-zinc-900">
                                  Filter Wardrobe
                                </h3>
                                <button
                                  onClick={() => setFilterOpen(false)}
                                  className="text-zinc-400 hover:text-zinc-600"
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              <div className="space-y-2">
                                {/* Category accordion */}
                                <FilterSection
                                  title="Category"
                                  isOpen={openSection === "category"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "category" ? null : "category"
                                    )
                                  }
                                >
                                  <div className="space-y-0.5 pt-1">
                                    {[
                                      "All",
                                      "Tops",
                                      "Bottoms",
                                      "Dresses",
                                      "Outerwear",
                                      "Footwear",
                                      "Swimwear",
                                      "Undergarments",
                                      "Accessories",
                                    ].map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={() =>
                                          setActiveCategory(
                                            cat as ClothingCategory
                                          )
                                        }
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                                          activeCategory === cat
                                            ? "bg-indigo-50 text-indigo-600 font-bold"
                                            : "text-zinc-600 hover:bg-zinc-50 font-medium"
                                        }`}
                                      >
                                        {cat}
                                      </button>
                                    ))}
                                  </div>
                                </FilterSection>

                                {/* Season accordion */}
                                <FilterSection
                                  title="Season"
                                  isOpen={openSection === "season"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "season" ? null : "season"
                                    )
                                  }
                                >
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {["Spring", "Summer", "Fall", "Winter"].map(
                                      (s) => (
                                        <button
                                          key={s}
                                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600 border border-zinc-100 transition-colors"
                                        >
                                          {s}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </FilterSection>

                                {/* Sleeve Length accordion */}
                                <FilterSection
                                  title="Sleeve Length"
                                  isOpen={openSection === "sleeve"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "sleeve" ? null : "sleeve"
                                    )
                                  }
                                >
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {["Sleeveless", "Short", "3/4", "Long"].map(
                                      (s) => (
                                        <button
                                          key={s}
                                          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600 border border-zinc-100 transition-colors"
                                        >
                                          {s}
                                        </button>
                                      )
                                    )}
                                  </div>
                                </FilterSection>

                                {/* Color accordion */}
                                <FilterSection
                                  title="Color"
                                  isOpen={openSection === "color"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "color" ? null : "color"
                                    )
                                  }
                                >
                                  <div className="flex flex-wrap gap-2.5 pt-2">
                                    {[
                                      { name: "Black", hex: "#18181b" },
                                      { name: "White", hex: "#fafafa" },
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
                                        className="w-7 h-7 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform ring-1 ring-zinc-200"
                                        style={{ backgroundColor: c.hex }}
                                      />
                                    ))}
                                  </div>
                                </FilterSection>

                                {/* Fit accordion */}
                                <FilterSection
                                  title="Fit"
                                  isOpen={openSection === "fit"}
                                  onToggle={() =>
                                    setOpenSection((s) =>
                                      s === "fit" ? null : "fit"
                                    )
                                  }
                                >
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {[
                                      "Slim",
                                      "Regular",
                                      "Relaxed",
                                      "Oversized",
                                    ].map((f) => (
                                      <button
                                        key={f}
                                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-50 text-zinc-600 hover:bg-indigo-50 hover:text-indigo-600 border border-zinc-100 transition-colors"
                                      >
                                        {f}
                                      </button>
                                    ))}
                                  </div>
                                </FilterSection>
                              </div>

                              <div className="mt-5 pt-4 border-t border-zinc-100 flex justify-between items-center">
                                <button
                                  onClick={() => {
                                    setActiveCategory("All");
                                    setFilterOpen(false);
                                  }}
                                  className="text-xs font-bold text-zinc-400 hover:text-red-500 transition-colors"
                                >
                                  Clear all
                                </button>
                                <button
                                  onClick={() => setFilterOpen(false)}
                                  className="px-5 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all"
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

                  {/* Items Grid */}
                  {filteredWardrobe.length === 0 ? (
                    <div className="py-20 text-center text-zinc-400">
                      <Shirt size={40} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">
                        No items in this category yet.
                      </p>
                    </div>
                  ) : (
                    <motion.div
                      layout
                      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4"
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
                            className="group bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all"
                          >
                            <div className="aspect-square overflow-hidden bg-zinc-50 relative">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                              />
                              {/* Add to outfit overlay */}
                              {outfitBuilderOpen && activeOutfitId && (
                                <motion.button
                                  initial={{ opacity: 0 }}
                                  whileHover={{ opacity: 1 }}
                                  onClick={() => addItemToOutfit(item)}
                                  className="absolute inset-0 bg-violet-600/80 text-white flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Plus size={22} />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Add to Outfit
                                  </span>
                                </motion.button>
                              )}
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                                {item.category}
                              </span>
                              <h4 className="text-xs font-display font-bold text-zinc-900 line-clamp-2 flex-1">
                                {item.name}
                              </h4>
                              <p className="text-xs font-bold text-indigo-600 mt-1">
                                ${item.price}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </div>

                {/* RIGHT: Outfit Builder Panel */}
                <AnimatePresence>
                  {outfitBuilderOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      className="lg:w-80 xl:w-96 flex-none"
                    >
                      <div className="bg-zinc-50 rounded-[1.75rem] border border-zinc-100 p-5 sticky top-24">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                            <Sparkles size={14} className="text-white" />
                          </div>
                          <h3 className="text-base font-display font-bold text-zinc-900">
                            Outfit Builder
                          </h3>
                        </div>

                        {/* Outfit Tabs */}
                        <div className="flex gap-2 flex-wrap mb-4">
                          {outfits.map((outfit) => (
                            <button
                              key={outfit.id}
                              onClick={() =>
                                setActiveOutfitId(
                                  outfit.id === activeOutfitId
                                    ? null
                                    : outfit.id
                                )
                              }
                              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeOutfitId === outfit.id
                                  ? "bg-violet-600 text-white"
                                  : "bg-white border border-zinc-200 text-zinc-600 hover:border-violet-300"
                              }`}
                            >
                              {outfit.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteOutfit(outfit.id);
                                }}
                                className={`opacity-60 hover:opacity-100 transition-opacity ${
                                  activeOutfitId === outfit.id
                                    ? "text-violet-200 hover:text-white"
                                    : "text-zinc-400 hover:text-red-500"
                                }`}
                              >
                                <X size={10} />
                              </button>
                            </button>
                          ))}
                        </div>

                        {/* Create New Outfit */}
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
                              placeholder="Outfit name..."
                              className="flex-1 px-3 py-2 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                            />
                            <button
                              onClick={createOutfit}
                              className="px-3 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-all"
                            >
                              Create
                            </button>
                            <button
                              onClick={() => setIsCreatingOutfit(false)}
                              className="px-3 py-2 bg-zinc-200 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-300 transition-all"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsCreatingOutfit(true)}
                            className="w-full mb-4 py-2 border-2 border-dashed border-zinc-200 rounded-xl text-xs font-bold text-zinc-400 hover:border-violet-400 hover:text-violet-600 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Plus size={14} /> New Outfit
                          </button>
                        )}

                        {/* Active Outfit Items */}
                        {activeOutfit ? (
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                                {activeOutfit.name}
                              </p>
                              <span className="text-[10px] text-zinc-400">
                                {activeOutfit.items.length} items
                              </span>
                            </div>

                            {activeOutfit.items.length === 0 ? (
                              <div className="py-8 text-center text-zinc-300 border-2 border-dashed border-zinc-200 rounded-2xl">
                                <Shirt
                                  size={28}
                                  className="mx-auto mb-2 opacity-50"
                                />
                                <p className="text-[11px] font-medium text-zinc-400">
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
                                    className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-zinc-100 group"
                                  >
                                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-none bg-zinc-50">
                                      <img
                                        src={item.image}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-bold text-zinc-900 truncate">
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] text-zinc-400">
                                        {item.category} ·{" "}
                                        <span className="text-indigo-600 font-bold">
                                          ${item.price}
                                        </span>
                                      </p>
                                    </div>
                                    <button
                                      onClick={() =>
                                        removeItemFromOutfit(
                                          activeOutfit.id,
                                          item.id
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 text-zinc-300 hover:text-red-500 transition-all"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </motion.div>
                                ))}

                                {/* Outfit total */}
                                <div className="pt-2 mt-2 border-t border-zinc-200 flex justify-between items-center">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                    Total Value
                                  </span>
                                  <span className="text-sm font-bold text-indigo-600">
                                    $
                                    {activeOutfit.items.reduce(
                                      (sum, i) => sum + i.price,
                                      0
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-zinc-400">
                            <Tag
                              size={24}
                              className="mx-auto mb-2 opacity-30"
                            />
                            <p className="text-[11px]">
                              Select an outfit above to start editing, or create
                              a new one.
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

          {/* ==================== PROFILE ==================== */}
          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-20 pb-10 px-6 flex-1 flex items-center justify-center"
            >
              <div className="max-w-2xl w-full bg-white p-8 rounded-[2rem] shadow-xl border border-zinc-100">
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => setView("dashboard")}
                    className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5"
                  >
                    <ChevronLeft size={14} /> Back to Dashboard
                  </button>
                  <button
                    onClick={() => setView("landing")}
                    className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900 mb-6">
                      User Profile
                    </h2>
                    <div className="space-y-4">
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                          Full Name
                        </label>
                        <p className="text-sm font-semibold text-zinc-900">
                          {user.firstName} {user.lastName}
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                          Email Address
                        </label>
                        <p className="text-sm font-semibold text-zinc-900">
                          {user.email}
                        </p>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                          Account Status
                        </label>
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle size={14} />
                          <span className="text-sm font-semibold">
                            Verified
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-display font-bold text-zinc-900 mb-6">
                      Budget Settings
                    </h2>
                    <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                      Based on your scanned receipts, you've spent an average of{" "}
                      <span className="font-bold text-zinc-900">
                        ${historicalSpend.toFixed(0)}
                      </span>{" "}
                      per month on clothing.
                    </p>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-1">
                          Monthly Clothing Budget ($)
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400">
                            $
                          </span>
                          <input
                            type="number"
                            defaultValue={budget || 500}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-100 rounded-xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                            placeholder="500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => setView("dashboard")}
                        className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
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

      {/* FOOTER */}
      <footer className="py-6 border-t border-zinc-100 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              WardrobeSuite
            </span>
          </div>
          <p className="text-zinc-400 text-sm">
            © 2026 WardrobeSuite All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
