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
  BarChart2,
  ShieldCheck,
  Megaphone,
  Users,
  Download,
  Brain,
  TrendingUp,
  AlertTriangle,
  Filter,
  ChevronUp,
  Loader2,
  FileText,
  Zap,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────────

type ViewState =
  | "landing"
  | "signup"
  | "signin"
  | "onboarding"
  | "business onboarding"
  | "privacy policy"
  | "verification"
  | "scanning"
  | "review"
  | "consumer dashboard"
  | "business dashboard"
  | "business kpi"
  | "budget"
  | "wardrobe"
  | "profile"
  | "business profile";

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

// Business analytics types
interface ConsumerRow {
  consumer_id: string;
  total_spending_cents: number;
  total_purchases: number;
  average_purchase_cents: number;
  frequent_merchant: string | null;
  most_spent_merchant: string | null;
  frequent_category: string | null;
  most_spent_category: string | null;
  merchant_freq: Record<string, number>;
  category_spend: Record<string, number>;
  last_purchase_at: string | null;
}

interface KPIData {
  consumer_count: number;
  executive: {
    total_spending_cents: number;
    avg_spending_per_consumer_cents: number;
    merchant_concentration_pct: number;
    category_concentration_pct: number;
    top_merchant_by_spend: string | null;
    top_category_by_spend: string | null;
  };
  behavioral: {
    multi_brand_shopper_pct: number;
    top_merchants_by_frequency: { merchant: string; count: number }[];
    top_categories_by_spend: { category: string; spend_cents: number }[];
  };
  predictive: {
    churn_risk_pct: number;
    avg_purchase_velocity_per_30_days: number;
    velocity_distribution: { label: string; count: number }[];
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Theme (unchanged from original)
// ─────────────────────────────────────────────────────────────────────────────

const theme = {
  light: {
    pageBg: "bg-white",
    surfaceBg: "bg-slate-50",
    cardBg: "bg-white",
    mutedBg: "bg-slate-100",
    headingText: "text-slate-900",
    bodyText: "text-slate-700",
    subtleText: "text-slate-500",
    mutedText: "text-slate-400",
    border: "border-slate-200",
    subtleBorder: "border-slate-100",
    headerBg: "bg-white/85",
    accentBg: "bg-indigo-600",
    accentHover: "hover:bg-indigo-700",
    accentText: "text-indigo-600",
    accentSubtle: "bg-indigo-50",
    accentSubtleText: "text-indigo-700",
    skyBg: "bg-indigo-600",
    skyHover: "hover:bg-indigo-700",
    skyText: "text-indigo-600",
    skySubtle: "bg-indigo-50",
    skySubtleText: "text-indigo-700",
    inputBg: "bg-slate-50",
    inputBorder: "border-slate-200",
    inputFocus: "focus:border-indigo-500 focus:ring-indigo-500/20",
    inputText: "text-slate-900",
    navBtn: "bg-slate-100 text-slate-600 hover:bg-slate-200",
    filterBg: "bg-white",
    filterItemHover: "hover:bg-indigo-50 hover:text-indigo-700",
    filterActiveItem: "bg-indigo-50 text-indigo-700 font-semibold",
    filterPillBg:
      "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700",
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

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const API = "http://localhost:8000";

function fmt$(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components (unchanged FilterSection)
// ─────────────────────────────────────────────────────────────────────────────

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
  children?: React.ReactNode;
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
          className={`${tk.mutedText} transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
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

// ─────────────────────────────────────────────────────────────────────────────
// Business-specific sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Mini horizontal bar chart used in KPI dashboard */
function MiniBarChart({
  data,
  labelKey,
  valueKey,
  colorClass,
  tk,
  formatValue,
}: {
  data: Record<string, any>[];
  labelKey: string;
  valueKey: string;
  colorClass: string;
  tk: typeof theme.light;
  formatValue?: (v: number) => string;
}) {
  if (!data || data.length === 0) {
    return (
      <p className={`text-sm ${tk.mutedText} py-4 text-center`}>No data yet</p>
    );
  }
  const max = Math.max(...data.map((d) => d[valueKey]));
  return (
    <div className="space-y-3">
      {data.map((d, i) => {
        const pct = max > 0 ? (d[valueKey] / max) * 100 : 0;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className={`text-xs font-semibold ${tk.bodyText} truncate max-w-[55%]`}
              >
                {d[labelKey]}
              </span>
              <span className={`text-xs font-bold ${tk.accentText}`}>
                {formatValue ? formatValue(d[valueKey]) : d[valueKey]}
              </span>
            </div>
            <div className={`h-2 ${tk.mutedBg} rounded-full overflow-hidden`}>
              <motion.div
                className={`h-full ${colorClass} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/** KPI stat card */
function KPICard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  tk,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  accent?: boolean;
  tk: typeof theme.light;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 sm:p-5 rounded-2xl border ${
        accent
          ? `${tk.accentBg} border-transparent text-white`
          : `${tk.cardBg} ${tk.border}`
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className={`text-xs font-bold uppercase tracking-widest ${
            accent ? "text-white/70" : tk.mutedText
          }`}
        >
          {label}
        </span>
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
            accent ? "bg-white/20" : tk.accentSubtle
          }`}
        >
          <Icon size={14} className={accent ? "text-white" : tk.accentText} />
        </div>
      </div>
      <div
        className={`text-2xl font-bold mb-1 ${
          accent ? "text-white" : tk.headingText
        }`}
      >
        {value}
      </div>
      {sub && (
        <p className={`text-xs ${accent ? "text-white/60" : tk.mutedText}`}>
          {sub}
        </p>
      )}
    </motion.div>
  );
}

/** Insights modal */
function InsightsModal({
  report,
  onClose,
  tk,
  isDark,
}: {
  report: string;
  onClose: () => void;
  tk: typeof theme.light;
  isDark: boolean;
}) {
  // Simple markdown-to-HTML renderer (headings, bold, bullets, hr)
  const rendered = report
    .replace(
      /^# (.+)$/gm,
      `<h1 class="text-xl font-bold mt-6 mb-3 ${tk.headingText}">$1</h1>`
    )
    .replace(
      /^## (.+)$/gm,
      `<h2 class="text-base font-bold mt-5 mb-2 ${tk.accentText} uppercase tracking-wide">$1</h2>`
    )
    .replace(
      /^### (.+)$/gm,
      `<h3 class="text-sm font-bold mt-4 mb-1 ${tk.headingText}">$1</h3>`
    )
    .replace(
      /\*\*(.+?)\*\*/g,
      `<strong class="font-bold ${tk.headingText}">$1</strong>`
    )
    .replace(
      /^(\d+)\. (.+)$/gm,
      `<div class="flex gap-2 mb-1.5"><span class="font-bold ${tk.accentText} flex-none">$1.</span><span>$2</span></div>`
    )
    .replace(
      /^- (.+)$/gm,
      `<div class="flex gap-2 mb-1.5"><span class="${tk.mutedText} flex-none">•</span><span>$1</span></div>`
    )
    .replace(/^---$/gm, `<hr class="my-4 ${tk.border}" />`)
    .replace(/\n\n/g, `<div class="mb-3"></div>`)
    .replace(/\n/g, " ");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        className={`relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col ${tk.cardBg} rounded-3xl shadow-2xl border ${tk.border} overflow-hidden mt-20`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${tk.border} flex-none`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 ${tk.accentBg} rounded-xl flex items-center justify-center`}
            >
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${tk.headingText}`}>
                Smart Insights Report
              </h2>
              <p className={`text-xs ${tk.mutedText}`}>
                Generated by Claude AI
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const blob = new Blob([report], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `wardrobe-insights-${Date.now()}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${tk.mutedBg} ${tk.bodyText} hover:opacity-80 transition-all`}
            >
              <Download size={12} /> Export .md
            </button>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${tk.mutedBg} ${tk.mutedText} hover:opacity-80 transition-all`}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div
            className={`text-sm ${tk.bodyText} leading-relaxed`}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = React.useState<ViewState>("landing");
  const [isDark, setIsDark] = React.useState(false);
  const tk = isDark ? theme.dark : theme.light;

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [carouselIndex, setCarouselIndex] = React.useState(0);
  const [bizCarouselIndex, setBizCarouselIndex] = React.useState(0);
  const [privacyChecked, setPrivacyChecked] = React.useState(false);

  const [user, setUser] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    userId: "",
    role: "consumer" as "consumer" | "business",
  });
  const [accountType, setAccountType] = React.useState<"consumer" | "business">(
    "consumer"
  );
  const [authError, setAuthError] = React.useState("");
  const [isAuthLoading, setIsAuthLoading] = React.useState(false);

  const [isVerified, setIsVerified] = React.useState(false);
  const [scannedCount, setScannedCount] = React.useState(0);
  const [isScanning, setIsScanning] = React.useState(false);
  const [budget, setBudget] = React.useState<number | null>(null);
  const [historicalSpend, setHistoricalSpend] = React.useState(1240.5);

  // ── Business dashboard state ───────────────────────────────────────────────
  const [bizTableData, setBizTableData] = React.useState<ConsumerRow[]>([]);
  const [bizTableTotal, setBizTableTotal] = React.useState(0);
  const [bizTableLoading, setBizTableLoading] = React.useState(false);
  const [bizFilterMerchant, setBizFilterMerchant] = React.useState("");
  const [bizFilterCategory, setBizFilterCategory] = React.useState("");
  const [bizFilterMinSpend, setBizFilterMinSpend] = React.useState("");
  const [bizFilterMinPurchases, setBizFilterMinPurchases] = React.useState("");
  const [bizFilterOptions, setBizFilterOptions] = React.useState<{
    merchants: string[];
    categories: string[];
  }>({ merchants: [], categories: [] });
  const [bizPage, setBizPage] = React.useState(1);
  const [bizInsightsLoading, setBizInsightsLoading] = React.useState(false);
  const [bizInsightsReport, setBizInsightsReport] = React.useState<
    string | null
  >(null);
  const [bizError, setBizError] = React.useState("");

  // KPI state
  const [kpiData, setKpiData] = React.useState<KPIData | null>(null);
  const [kpiLoading, setKpiLoading] = React.useState(false);

  // ── Wardrobe & review state (unchanged) ────────────────────────────────────
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
  ]);
  const [activeCategory, setActiveCategory] =
    React.useState<ClothingCategory>("All");
  const [wardrobeSearch, setWardrobeSearch] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [openSection, setOpenSection] = React.useState<string | null>(null);
  const [outfits, setOutfits] = React.useState<Outfit[]>([
    { id: 1, name: "Smart Casual Monday", items: [] },
  ]);
  const [activeOutfitId, setActiveOutfitId] = React.useState<number | null>(
    null
  );
  const [isCreatingOutfit, setIsCreatingOutfit] = React.useState(false);
  const [newOutfitName, setNewOutfitName] = React.useState("");
  const [outfitBuilderOpen, setOutfitBuilderOpen] = React.useState(false);

  // itemsToReview: starts with placeholder cards shown during scanning.
  // Replaced with real backend data after POST /scan/initial completes.
  const [itemsToReview, setItemsToReview] = React.useState<
    Array<{
      id: any;
      name: string;
      price: number;
      image: string;
      isClothing: boolean;
      category: ClothingCategory;
      price_missing?: boolean;
      image_url?: string;
    }>
  >([
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
      id: 5,
      name: "Graphic Cotton Tee",
      price: 32,
      image:
        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800",
      isClothing: true,
      category: "Tops" as ClothingCategory,
    },
  ]);
  // manualPrice: typed by user for items where price_missing=true (e.g. SHEIN)
  const [manualPrice, setManualPrice] = React.useState<string>("");
  const [reviewIndex, setReviewIndex] = React.useState(0);
  const [swipeDirection, setSwipeDirection] = React.useState<
    "left" | "right" | null
  >(null);
  const [showSwipeTip, setShowSwipeTip] = React.useState(true);
  const [recommendationIndex, setRecommendationIndex] = React.useState(0);

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
      image: "Images/Scan.png",
      description:
        "WardrobeSuite securely connects to your Gmail account, scanning for purchase receipts to automatically build your digital wardrobe and track your spending habits.",
    },
    {
      title: "Set a Budget",
      image: "Images/Budget.png",
      description:
        "Customize your experience by setting a monthly clothing budget. WardrobeSuite learns from your choices to provide personalized recommendations to fit your financial need.",
    },
    {
      title: "Create Outfits in Your Wardrobe",
      image: "Images/Outfits.png",
      description:
        "Create and save custom outfit combinations from your wardrobe items. Easily build and manage your personal style collections.",
    },
    {
      title: "Filter Your Style",
      image: "Images/Filter.png",
      description:
        "Filter between tops, bottoms, color, fit and more in your wardrobe to quickly find the perfect piece for any occasion. Spend less time searching and more time styling.",
    },
  ];

  const businessOnboardingData = [
    {
      icon: BarChart2,
      title: "Real-Time Sales Analytics",
      image:
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
      description:
        "Get a live view of purchases attributed to your brand across the WardrobeSuite network. Track revenue, order volume, and customer trends in a single dashboard.",
    },
    {
      icon: Users,
      title: "Customer Behavior Insights",
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
      description:
        "Understand how real shoppers interact with your products. See repeat-purchase rates, wardrobe penetration, and which items are most frequently paired together.",
    },
    {
      icon: Megaphone,
      title: "Targeted Recommendations Engine",
      image:
        "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800",
      description:
        "Your products surface directly inside shoppers' personalized recommendation feeds based on their style profile, budget, and wardrobe gaps.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-Grade Data Security",
      image:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800",
      description:
        "All business and customer data is protected with end-to-end encryption, role-based access controls, and SOC 2-aligned infrastructure.",
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

  // ── Business API calls ─────────────────────────────────────────────────────

  const buildBizParams = () => {
    const p = new URLSearchParams();
    if (bizFilterMerchant) p.set("merchant", bizFilterMerchant);
    if (bizFilterCategory) p.set("category", bizFilterCategory);
    if (bizFilterMinSpend)
      p.set(
        "min_spending_cents",
        String(Math.round(parseFloat(bizFilterMinSpend) * 100))
      );
    if (bizFilterMinPurchases) p.set("min_purchases", bizFilterMinPurchases);
    return p;
  };

  const fetchBizTable = React.useCallback(
    async (page = 1) => {
      if (!user.userId) return;
      setBizTableLoading(true);
      setBizError("");
      try {
        const p = buildBizParams();
        p.set("page", String(page));
        p.set("page_size", "50");
        const res = await fetch(`${API}/business/analytics/table?${p}`, {
          headers: { "X-User-Id": user.userId },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setBizTableData(data.rows);
        setBizTableTotal(data.total);
        setBizPage(page);
      } catch (e: any) {
        setBizError(
          "Failed to load analytics data. Make sure the backend is running."
        );
      } finally {
        setBizTableLoading(false);
      }
    },
    [
      user.userId,
      bizFilterMerchant,
      bizFilterCategory,
      bizFilterMinSpend,
      bizFilterMinPurchases,
    ]
  );

  const fetchFilterOptions = React.useCallback(async () => {
    if (!user.userId) return;
    try {
      const res = await fetch(`${API}/business/analytics/filter-options`, {
        headers: { "X-User-Id": user.userId },
      });
      if (res.ok) {
        const data = await res.json();
        setBizFilterOptions(data);
      }
    } catch {}
  }, [user.userId]);

  const fetchKPI = React.useCallback(async () => {
    if (!user.userId) return;
    setKpiLoading(true);
    try {
      const res = await fetch(`${API}/business/analytics/kpi`, {
        headers: { "X-User-Id": user.userId },
      });
      if (res.ok) {
        const data = await res.json();
        setKpiData(data);
      }
    } catch {
    } finally {
      setKpiLoading(false);
    }
  }, [user.userId]);

  // Load business data when entering business views
  React.useEffect(() => {
    if (view === "business dashboard" && user.role === "business") {
      fetchBizTable(1);
      fetchFilterOptions();
    }
    if (view === "business kpi" && user.role === "business") {
      fetchKPI();
    }
  }, [view]);

  const handleDownloadJSON = async () => {
    if (!user.userId) return;
    const p = buildBizParams();
    const res = await fetch(`${API}/business/analytics/export?${p}`, {
      headers: { "X-User-Id": user.userId },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wardrobe-analytics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleGenerateInsights = async () => {
    if (!user.userId) return;
    setBizInsightsLoading(true);
    setBizInsightsReport(null);
    setBizError("");
    try {
      const p = buildBizParams();
      const res = await fetch(`${API}/business/analytics/insights?${p}`, {
        method: "POST",
        headers: { "X-User-Id": user.userId },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to generate insights");
      }
      const data = await res.json();
      setBizInsightsReport(data.report);
    } catch (e: any) {
      setBizError(e.message || "Failed to generate insights.");
    } finally {
      setBizInsightsLoading(false);
    }
  };

  // ── Auth handlers (wired to backend) ──────────────────────────────────────

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthLoading(true);
    const fd = new FormData(e.currentTarget);

    try {
      if (view === "signup") {
        if (accountType === "business") {
          const body = {
            business_name: (fd.get("businessName") as string) || "",
            email: fd.get("email") as string,
            password: fd.get("password") as string,
          };
          const res = await fetch(`${API}/auth/business/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
          }
          const data = await res.json();
          setUser({
            firstName: data.business_name,
            lastName: "",
            email: body.email,
            userId: data.user_id,
            role: "business",
          });
          setView("business onboarding");
        } else {
          const body = {
            first_name: (fd.get("firstName") as string) || "",
            last_name: (fd.get("lastName") as string) || "",
            email: fd.get("email") as string,
            password: fd.get("password") as string,
          };
          const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed");
          }
          const data = await res.json();
          const consumerUser = {
            firstName: data.first_name,
            lastName: data.last_name,
            email: body.email,
            userId: data.user_id,
            role: "consumer" as const,
          };
          setUser(consumerUser);
          // Persist name/email so OAuth return handler can restore them after the round-trip
          localStorage.setItem(
            "wardrobeUser",
            JSON.stringify({
              firstName: data.first_name,
              lastName: data.last_name,
              email: body.email,
            })
          );
          setView("onboarding");
        }
      } else {
        // signin
        const body = {
          email: fd.get("email") as string,
          password: fd.get("password") as string,
        };
        const endpoint =
          accountType === "business"
            ? `${API}/auth/business/login`
            : `${API}/auth/login`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Login failed");
        }
        const data = await res.json();
        const role = (data.role as "consumer" | "business") || "consumer";
        setUser({
          firstName: data.first_name || data.business_name || "",
          lastName: data.last_name || "",
          email: body.email,
          userId: data.user_id,
          role,
        });
        if (role === "business") {
          setView("business dashboard");
        } else if (data.gmail_connected) {
          // Already has Gmail token — go straight to dashboard
          setView("consumer dashboard");
        } else {
          // No Gmail token yet — show the Gmail OAuth connect screen
          setView("verification");
        }
      }
    } catch (err: any) {
      setAuthError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  // ── Consumer helpers (unchanged) ───────────────────────────────────────────

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
    setCarouselIndex((p) => (p + 1) % onboardingData.length);
  const prevSlide = () =>
    setCarouselIndex(
      (p) => (p - 1 + onboardingData.length) % onboardingData.length
    );
  const nextBizSlide = () =>
    setBizCarouselIndex((p) => (p + 1) % businessOnboardingData.length);
  const prevBizSlide = () =>
    setBizCarouselIndex(
      (p) =>
        (p - 1 + businessOnboardingData.length) % businessOnboardingData.length
    );

  // ── OAuth return handler ─────────────────────────────────────────────────
  // When Google redirects back to the frontend it appends ?oauth=success&user_id=
  // Read these params once on mount, restore user state, then kick off the scan.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthStatus = params.get("oauth");
    const oauthUserId = params.get("user_id");
    if (oauthStatus === "success" && oauthUserId) {
      // Clean the URL so refreshing does not re-trigger
      window.history.replaceState({}, document.title, window.location.pathname);
      // Restore persisted user state from localStorage
      const stored = localStorage.getItem("wardrobeUser");
      const storedUser = stored ? JSON.parse(stored) : null;
      setUser({
        firstName: storedUser?.firstName || "",
        lastName: storedUser?.lastName || "",
        email: storedUser?.email || "",
        userId: oauthUserId,
        role: "consumer",
      });
      startRealScan(oauthUserId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load real wardrobe items from backend when dashboard opens ────────────
  React.useEffect(() => {
    if (view !== "consumer dashboard" || !user.userId) return;
    fetch(`${API}/items`, {
      headers: { "Content-Type": "application/json", "X-User-Id": user.userId },
    })
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped = data.map((item: any) => ({
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
      .catch(() => {
        /* keep placeholder items if backend unreachable */
      });
  }, [view, user.userId]);

  // startRealScan: called after Gmail OAuth completes (uid arg) or "Scan New Items" click
  const startRealScan = async (uid?: string) => {
    const effectiveId = uid || user.userId;
    setView("scanning");
    setIsScanning(true);
    setScannedCount(0);
    try {
      const res = await fetch(`${API}/scan/initial`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": effectiveId,
        },
        body: JSON.stringify({ initial_scan_days: 90 }),
      });
      const data = await res.json();
      setScannedCount(data.queued_count ?? 0);
    } catch {
      setScannedCount(0);
    } finally {
      setIsScanning(false);
    }
    // Pre-load real review queue
    try {
      const res = await fetch(`${API}/review-items`, {
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": effectiveId,
        },
      });
      const items = await res.json();
      if (Array.isArray(items) && items.length > 0) {
        setItemsToReview(
          items.map((item: any) => ({
            id: item.id,
            name: item.item_name,
            price: (item.price_cents ?? 0) / 100,
            image:
              item.image_url ||
              "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=800",
            isClothing: item.category !== null,
            category: (item.category as ClothingCategory) || "Accessories",
            price_missing: item.price_missing ?? false,
            image_url: item.image_url,
          }))
        );
        setReviewIndex(0);
      }
    } catch {
      /* keep placeholder items */
    }
  };

  // handleSwipe: sends approve/reject to backend then advances the card
  const handleSwipe = async (direction: "left" | "right") => {
    setSwipeDirection(direction);
    const currentItem = itemsToReview[reviewIndex];
    if (!currentItem) return;

    if (direction === "right") {
      const body: Record<string, any> = {};
      if ((currentItem as any).price_missing && manualPrice) {
        body.edited_price_cents = Math.round(parseFloat(manualPrice) * 100);
      }
      try {
        const res = await fetch(
          `${API}/review-items/${currentItem.id}/approve`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Id": user.userId,
            },
            body: JSON.stringify(body),
          }
        );
        if (res.ok) {
          const approved = await res.json();
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
        /* still advance */
      }
    } else {
      try {
        await fetch(`${API}/review-items/${currentItem.id}/reject`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Id": user.userId,
          },
          body: JSON.stringify({}),
        });
      } catch {
        /* still advance */
      }
    }

    setManualPrice("");
    setTimeout(() => {
      if (reviewIndex < itemsToReview.length - 1) {
        setReviewIndex((p) => p + 1);
        setSwipeDirection(null);
      } else {
        setView("consumer dashboard");
      }
    }, 200);
  };

  const nextRec = () =>
    setRecommendationIndex((p) => (p + 1) % recommendations.length);
  const prevRec = () =>
    setRecommendationIndex(
      (p) => (p - 1 + recommendations.length) % recommendations.length
    );

  const inputCls = `w-full px-4 py-3 text-base ${tk.inputBg} border ${tk.inputBorder} rounded-xl ${tk.inputFocus} ${tk.inputText} placeholder:${tk.mutedText} focus:outline-none focus:ring-2 transition-all`;
  const labelCls = `block text-xs font-bold uppercase tracking-wider ${tk.mutedText} mb-1.5`;

  const DarkToggle = () => (
    <button
      onClick={() => setIsDark((d) => !d)}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`w-9 h-9 rounded-full flex items-center justify-center ${tk.navBtn} transition-colors flex-none`}
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );

  const isBizView = [
    "business dashboard",
    "business kpi",
    "business profile",
  ].includes(view);
  const isConsumerView = [
    "consumer dashboard",
    "budget",
    "wardrobe",
    "profile",
  ].includes(view);

  return (
    <div
      className={`min-h-screen font-sans ${tk.pageBg} ${tk.bodyText} flex flex-col transition-colors duration-300`}
    >
      {/* ── Insights Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {bizInsightsReport && (
          <InsightsModal
            report={bizInsightsReport}
            onClose={() => setBizInsightsReport(null)}
            tk={tk}
            isDark={isDark}
          />
        )}
      </AnimatePresence>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 ${tk.headerBg} backdrop-blur-md border-b ${tk.border} transition-colors duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 md:h-20 flex items-center justify-between">
          <motion.button
            layout
            onClick={() => {
              if (isBizView) setView("business dashboard");
              else if (isConsumerView) setView("consumer dashboard");
              else setView("landing");
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            aria-label="Go to home"
            className="flex items-center gap-2 flex-none"
          >
            <img
              src="Images/Logo.png"
              alt="WardrobeSuite logo"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl object-cover flex-none"
            />
            <span
              className={`font-bold text-base sm:text-lg tracking-tight ${tk.headingText}`}
            >
              WardrobeSuite
            </span>
          </motion.button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7 p-8">
            {view === "landing" && (
              <>
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
                  className="px-5 py-2.5 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: isDark ? "white" : "black",
                    color: isDark ? "black" : "white",
                  }}
                >
                  Get Started
                </button>
              </>
            )}
            {isConsumerView && (
              <>
                <button
                  onClick={() => setView("wardrobe")}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    view === "wardrobe"
                      ? `${tk.accentBg} text-white`
                      : tk.navBtn
                  }`}
                >
                  <Shirt size={14} /> Wardrobe
                </button>
                <button
                  onClick={() => setView("consumer dashboard")}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                    view === "consumer dashboard"
                      ? isDark
                        ? "bg-slate-100 text-slate-900"
                        : "bg-slate-900 text-white"
                      : tk.navBtn
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setView("profile")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    view === "profile" ? `${tk.accentBg} text-white` : tk.navBtn
                  }`}
                  aria-label="Profile"
                >
                  <User size={15} />
                </button>
              </>
            )}
            {isBizView && (
              <>
                <button
                  onClick={() => setView("business dashboard")}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    view === "business dashboard"
                      ? isDark
                        ? "bg-slate-100 text-slate-900"
                        : "bg-slate-900 text-white"
                      : tk.navBtn
                  }`}
                >
                  <BarChart2 size={14} /> Analytics
                </button>
                <button
                  onClick={() => setView("business kpi")}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                    view === "business kpi"
                      ? `${tk.accentBg} text-white`
                      : tk.navBtn
                  }`}
                >
                  <Zap size={14} /> Intelligence
                </button>
                <button
                  onClick={() => setView("business profile")}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    view === "business profile"
                      ? `${tk.accentBg} text-white`
                      : tk.navBtn
                  }`}
                  aria-label="Business Profile"
                >
                  <Building2 size={15} />
                </button>
              </>
            )}
            <DarkToggle />
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <DarkToggle />
            {![
              "onboarding",
              "business onboarding",
              "verification",
              "scanning",
              "review",
            ].includes(view) && (
              <button
                className={`w-9 h-9 flex items-center justify-center rounded-full ${tk.navBtn}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle navigation"
              >
                {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`md:hidden ${tk.cardBg} border-b ${tk.border} px-5 py-4 flex flex-col gap-2 overflow-hidden`}
            >
              {view === "landing" && (
                <>
                  <a
                    href="#MeetTheTeam"
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-base font-semibold ${tk.headingText} py-2.5 border-b ${tk.border}`}
                  >
                    Meet The Team
                  </a>
                  <button
                    onClick={() => {
                      setView("signin");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-base font-semibold ${tk.headingText} border ${tk.border} rounded-2xl mt-1`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setView("signup");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-base font-semibold text-white ${tk.accentBg} ${tk.accentHover} rounded-2xl transition-all`}
                  >
                    Get Started
                  </button>
                </>
              )}
              {(view === "signin" || view === "signup") && (
                <>
                  <button
                    onClick={() => {
                      setView("signup");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-base font-semibold rounded-2xl ${
                      view === "signup"
                        ? `${tk.accentBg} text-white`
                        : `border ${tk.border} ${tk.headingText}`
                    }`}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => {
                      setView("signin");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-base font-semibold rounded-2xl ${
                      view === "signin"
                        ? `${tk.accentBg} text-white`
                        : `border ${tk.border} ${tk.headingText}`
                    }`}
                  >
                    Sign In
                  </button>
                </>
              )}
              {isConsumerView && (
                <>
                  <button
                    onClick={() => {
                      setView("consumer dashboard");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-left text-base font-semibold ${tk.headingText} flex items-center gap-3 border-b ${tk.border}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        view === "consumer dashboard"
                          ? `${tk.accentBg} text-white`
                          : tk.mutedBg
                      }`}
                    >
                      <User size={15} />
                    </span>
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setView("wardrobe");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-left text-base font-semibold ${tk.headingText} flex items-center gap-3 border-b ${tk.border}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        view === "wardrobe"
                          ? `${tk.accentBg} text-white`
                          : tk.mutedBg
                      }`}
                    >
                      <Shirt size={15} />
                    </span>
                    Wardrobe
                  </button>
                  <button
                    onClick={() => {
                      setView("profile");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-left text-base font-semibold ${tk.headingText} flex items-center gap-3`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        view === "profile"
                          ? `${tk.accentBg} text-white`
                          : tk.mutedBg
                      }`}
                    >
                      <User size={15} />
                    </span>
                    Profile
                  </button>
                </>
              )}
              {isBizView && (
                <>
                  <button
                    onClick={() => {
                      setView("business dashboard");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-left text-base font-semibold ${tk.headingText} flex items-center gap-3 border-b ${tk.border}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        view === "business dashboard"
                          ? `${tk.accentBg} text-white`
                          : tk.mutedBg
                      }`}
                    >
                      <BarChart2 size={15} />
                    </span>
                    Analytics
                  </button>
                  <button
                    onClick={() => {
                      setView("business kpi");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-left text-base font-semibold ${tk.headingText} flex items-center gap-3 border-b ${tk.border}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        view === "business kpi"
                          ? `${tk.accentBg} text-white`
                          : tk.mutedBg
                      }`}
                    >
                      <Zap size={15} />
                    </span>
                    Intelligence
                  </button>
                  <button
                    onClick={() => {
                      setView("business profile");
                      setIsMenuOpen(false);
                    }}
                    className={`w-full py-3 text-left text-base font-semibold ${tk.headingText} flex items-center gap-3`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                        view === "business profile"
                          ? `${tk.accentBg} text-white`
                          : tk.mutedBg
                      }`}
                    >
                      <Building2 size={15} />
                    </span>
                    Business Profile
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {/* ── LANDING (unchanged) ────────────────────────────────────────── */}
          {view === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <section className="pt-20 sm:pt-28 pb-16 px-4 sm:px-6">
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
                    className="relative hidden md:block"
                  >
                    <div className="aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
                      <img
                        src="https://images.unsplash.com/photo-1624222244232-5f1ae13bbd53?q=80&w=1170&auto=format&fit=crop"
                        alt="WardrobeSuite dashboard preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -z-10 opacity-60" />
                    <div className="absolute -top-6 -right-6 w-48 h-48 bg-sky-100 rounded-full blur-3xl -z-10 opacity-60" />
                  </motion.div>
                </div>
              </section>
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
                  />
                </motion.div>
              </section>
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
              <section className="pt-4 pb-24 px-4 sm:px-6">
                <div className="max-w-7xl mx-auto grid sm:grid-cols-2 md:grid-cols-3 gap-10">
                  {[
                    {
                      name: "Darlyn Gomez",
                      role: "Project Lead & AI Engineer",
                      img: "Images/DarlynGomez.jpg",
                      desc: "Third year computer science student at Rochester Institute of Technology. Built the Gmail OAuth integration and AI-powered email extraction pipeline using Gemini, turning raw purchase receipts into structured wardrobe data.",
                    },
                    {
                      name: "Dylan Chan",
                      role: "Fintech Logic & Backend Engineer",
                      img: "Images/DylanChan.png",
                      desc: "First year cybersecurity student at Rochester Institute of Technology. Built a backend processing component that parsed purchase related JSON data, extracted spending patterns, and updated a SQLite database with aggregated user insights.",
                    },
                    {
                      name: "Luther Barreiro Roxo",
                      role: "UI/UX & Frontend Engineer",
                      img: "Images/LutherBRoxo.jpg",
                      desc: "Second year game design and development student at Rochester Institute of Technology. Crafted the full user-facing experience from onboarding and Gmail scan flow to the swipe-based review queue and wardrobe inventory view.",
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
                        className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full overflow-hidden mb-6 mx-auto ${tk.mutedBg}`}
                      >
                        <img
                          src={student.img}
                          alt={student.name}
                          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          style={{
                            objectFit: "cover",
                            objectPosition: "center top",
                          }}
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

          {/* ── SIGN UP / SIGN IN ──────────────────────────────────────────── */}
          {(view === "signup" || view === "signin") && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-32 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center min-h-screen"
            >
              <div
                className={`max-w-md w-full ${tk.cardBg} p-5 sm:p-8 rounded-3xl shadow-xl border ${tk.border} my-4`}
              >
                <div className="text-center mb-5">
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${tk.headingText} mb-1`}
                  >
                    {view === "signup" ? "Create your account" : "Welcome back"}
                  </h2>
                  <p className={`text-sm sm:text-base ${tk.subtleText}`}>
                    {view === "signup"
                      ? "Start building your smart wardrobe today!"
                      : "Sign in to your account."}
                  </p>
                </div>

                {/* Consumer / Business toggle */}
                <div
                  className={`flex ${tk.surfaceBg} rounded-2xl p-1 mb-5 border ${tk.border}`}
                >
                  <button
                    onClick={() => {
                      setAccountType("consumer");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      accountType === "consumer"
                        ? `${tk.cardBg} ${tk.headingText} shadow-sm border ${tk.border}`
                        : tk.mutedText
                    }`}
                  >
                    <User size={15} /> Consumer
                  </button>
                  <button
                    onClick={() => {
                      setAccountType("business");
                      setAuthError("");
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                      accountType === "business"
                        ? `${tk.cardBg} ${tk.headingText} shadow-sm border ${tk.border}`
                        : tk.mutedText
                    }`}
                  >
                    <Building2 size={15} /> Business
                  </button>
                </div>

                {authError && (
                  <div
                    className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2`}
                  >
                    <AlertTriangle
                      size={14}
                      className="text-red-500 flex-none mt-0.5"
                    />
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                )}

                <form className="space-y-4" onSubmit={handleAuth}>
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
                      name="password"
                      type="password"
                      required
                      className={inputCls}
                      placeholder="••••••••"
                      autoComplete={
                        view === "signup" ? "new-password" : "current-password"
                      }
                    />
                  </div>

                  {view === "signup" && (
                    <div className="flex items-start gap-3 pt-1">
                      <div className="relative flex-none mt-0.5">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={privacyChecked}
                          onClick={() => setPrivacyChecked((v) => !v)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            privacyChecked
                              ? `${tk.accentBg} border-transparent`
                              : `${tk.inputBg} ${tk.inputBorder} hover:border-indigo-400`
                          }`}
                        >
                          {privacyChecked && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              width="10"
                              height="8"
                              viewBox="0 0 10 8"
                              fill="none"
                            >
                              <path
                                d="M1 4L3.5 6.5L9 1"
                                stroke="white"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </motion.svg>
                          )}
                        </button>
                      </div>
                      <label
                        className={`text-sm ${tk.subtleText} leading-snug cursor-pointer select-none`}
                        onClick={() => setPrivacyChecked((v) => !v)}
                      >
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setView("privacy policy");
                          }}
                          className={`${tk.accentText} font-semibold hover:underline`}
                        >
                          Privacy Policy
                        </button>
                        . By creating an account, I consent to WardrobeSuite
                        accessing my purchase/business data.
                      </label>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={
                      (view === "signup" && !privacyChecked) || isAuthLoading
                    }
                    className={`w-full py-4 text-white rounded-2xl font-bold transition-all shadow-lg mt-2 flex items-center justify-center gap-2 group text-base ${
                      view === "signup" && !privacyChecked
                        ? "bg-slate-300 cursor-not-allowed shadow-none"
                        : isAuthLoading
                        ? `${tk.accentBg} opacity-70 cursor-wait`
                        : `${tk.accentBg} ${tk.accentHover}`
                    }`}
                  >
                    {isAuthLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {view === "signup"
                          ? accountType === "business"
                            ? "Create Business Account"
                            : "Create Account"
                          : "Sign In"}
                        <ArrowRight
                          size={18}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
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

          {/* ── PRIVACY POLICY (unchanged) ─────────────────────────────────── */}
          {view === "privacy policy" && (
            <motion.div
              key="privacy policy"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-16 pb-16 px-4 sm:px-6 flex-1 flex items-start justify-center"
            >
              <div
                className={`max-w-2xl w-full my-8 ${tk.cardBg} p-6 sm:p-10 rounded-3xl shadow-xl border ${tk.border}`}
              >
                <button
                  onClick={() => setView("signup")}
                  className={`text-sm font-bold ${tk.mutedText} hover:${tk.accentText} transition-colors flex items-center gap-1.5 mb-8`}
                >
                  <ChevronLeft size={16} /> Back to Sign Up
                </button>
                <div
                  className={`w-12 h-12 ${tk.accentSubtle} ${tk.accentText} rounded-2xl flex items-center justify-center mb-5`}
                >
                  <ShieldCheck size={24} />
                </div>
                <h1 className={`text-3xl font-bold ${tk.headingText} mb-2`}>
                  Privacy Policy
                </h1>
                <p className={`text-sm ${tk.mutedText} mb-8`}>
                  Last updated: January 1, 2026
                </p>
                <div
                  className={`${tk.surfaceBg} rounded-2xl border-2 border-dashed ${tk.border} flex flex-col items-center justify-center text-center py-16 px-8`}
                >
                  <p className={`text-sm ${tk.mutedText} max-w-xs`}>
                    Privacy policy content will be published here before launch.
                  </p>
                </div>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      setPrivacyChecked(true);
                      setView("signup");
                    }}
                    className={`w-full py-4 ${tk.accentBg} text-white rounded-2xl font-bold ${tk.accentHover} transition-all shadow-lg flex items-center justify-center gap-2`}
                  >
                    <CheckCircle size={18} /> I Agree — Go Back to Sign Up
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── CONSUMER ONBOARDING (unchanged) ───────────────────────────── */}
          {view === "onboarding" && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex flex-col items-center justify-center"
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
                      className="flex flex-col md:grid md:grid-cols-2 md:items-center"
                    >
                      <div className="w-full aspect-[16/9] md:aspect-auto md:h-[240px] overflow-hidden flex-none">
                        <img
                          src={onboardingData[carouselIndex].image}
                          alt={onboardingData[carouselIndex].title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 sm:p-6 text-left">
                        <h3
                          className={`text-base sm:text-lg font-bold ${tk.headingText} mb-2`}
                        >
                          {onboardingData[carouselIndex].title}
                        </h3>
                        <p
                          className={`text-sm ${tk.subtleText} leading-relaxed mb-4`}
                        >
                          {onboardingData[carouselIndex].description}
                        </p>
                        <div className="flex gap-1.5">
                          {onboardingData.map((_, i) => (
                            <div
                              key={i}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === carouselIndex
                                  ? `w-6 ${tk.accentBg}`
                                  : `w-1.5 ${tk.mutedBg}`
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
                className={`mt-8 px-7 py-3.5 ${
                  isDark
                    ? "bg-slate-200 text-slate-900 hover:bg-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                } rounded-2xl font-bold transition-all flex items-center gap-2 text-sm`}
              >
                Get Started with WardrobeSuite <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ── BUSINESS ONBOARDING (unchanged) ───────────────────────────── */}
          {view === "business onboarding" && (
            <motion.div
              key="business onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex flex-col items-center justify-center"
            >
              <div className="max-w-4xl w-full text-center mb-5">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`inline-block px-3 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-bold uppercase tracking-widest mb-3`}
                >
                  Welcome, {user.firstName || "your business"}!
                </motion.span>
                <h2
                  className={`text-xl sm:text-2xl font-bold ${tk.headingText} mb-1`}
                >
                  Here's what WardrobeSuite can do{" "}
                  <span className={tk.accentText}>for your business…</span>
                </h2>
              </div>
              <div className="max-w-3xl w-full relative px-8 sm:px-12">
                <div
                  className={`overflow-hidden rounded-3xl ${tk.surfaceBg} border ${tk.border} shadow-lg`}
                >
                  <AnimatePresence mode="wait">
                    {(() => {
                      const slide = businessOnboardingData[bizCarouselIndex];
                      const Icon = slide.icon;
                      return (
                        <motion.div
                          key={bizCarouselIndex}
                          initial={{ opacity: 0, x: 50 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -50 }}
                          transition={{ duration: 0.4 }}
                          className="flex flex-col md:grid md:grid-cols-2 md:items-center"
                        >
                          <div className="w-full aspect-[16/9] md:aspect-auto md:h-[240px] overflow-hidden flex-none relative">
                            <img
                              src={slide.image}
                              alt={slide.title}
                              className="w-full h-full object-cover"
                            />
                            <div
                              className={`absolute top-3 left-3 w-10 h-10 ${tk.accentBg} rounded-xl flex items-center justify-center shadow-lg`}
                            >
                              <Icon size={18} className="text-white" />
                            </div>
                          </div>
                          <div className="p-5 sm:p-6 text-left">
                            <div
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-bold uppercase tracking-wider mb-3`}
                            >
                              <Icon size={11} />
                              Feature {bizCarouselIndex + 1} of{" "}
                              {businessOnboardingData.length}
                            </div>
                            <h3
                              className={`text-base sm:text-lg font-bold ${tk.headingText} mb-2`}
                            >
                              {slide.title}
                            </h3>
                            <p
                              className={`text-sm ${tk.subtleText} leading-relaxed mb-4`}
                            >
                              {slide.description}
                            </p>
                            <div className="flex gap-1.5">
                              {businessOnboardingData.map((_, i) => (
                                <button
                                  key={i}
                                  onClick={() => setBizCarouselIndex(i)}
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    i === bizCarouselIndex
                                      ? `w-6 ${tk.accentBg}`
                                      : `w-1.5 ${tk.mutedBg} hover:opacity-70`
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                </div>
                <button
                  onClick={prevBizSlide}
                  aria-label="Previous slide"
                  className={`absolute -left-2 sm:-left-4 top-1/2 -translate-y-1/2 w-10 h-10 ${tk.cardBg} rounded-full shadow-md border ${tk.border} flex items-center justify-center ${tk.subtleText} hover:${tk.accentText} transition-all z-10`}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextBizSlide}
                  aria-label="Next slide"
                  className={`absolute -right-2 sm:-right-4 top-1/2 -translate-y-1/2 w-10 h-10 ${tk.cardBg} rounded-full shadow-md border ${tk.border} flex items-center justify-center ${tk.subtleText} hover:${tk.accentText} transition-all z-10`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              <div className="max-w-3xl w-full mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {businessOnboardingData.map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      onClick={() => setBizCarouselIndex(i)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        bizCarouselIndex === i
                          ? `${tk.accentBg} border-transparent text-white`
                          : `${tk.cardBg} ${tk.border} ${tk.bodyText} hover:border-indigo-400`
                      }`}
                    >
                      <Icon
                        size={16}
                        className={`mb-1.5 ${
                          bizCarouselIndex === i ? "text-white" : tk.accentText
                        }`}
                      />
                      <p
                        className={`text-xs font-bold leading-snug ${
                          bizCarouselIndex === i ? "text-white" : tk.headingText
                        }`}
                      >
                        {feat.title}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                onClick={() => setView("business dashboard")}
                className={`mt-8 px-7 py-3.5 ${
                  isDark
                    ? "bg-slate-200 text-slate-900 hover:bg-white"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                } rounded-2xl font-bold transition-all flex items-center gap-2 text-sm`}
              >
                Launch My Business Dashboard <ArrowRight size={16} />
              </motion.button>
            </motion.div>
          )}

          {/* ── VERIFICATION (unchanged) ───────────────────────────────────── */}
          {view === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
            >
              <div
                className={`max-w-md w-full ${tk.cardBg} p-8 rounded-3xl shadow-xl border ${tk.border} text-center`}
              >
                <div
                  className={`w-16 h-16 ${tk.accentSubtle} rounded-2xl flex items-center justify-center ${tk.accentText} mx-auto mb-6`}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 6C22 4.9 21.1 4 20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6ZM20 6L12 11L4 6H20ZM20 18H4V8L12 13L20 8V18Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <h2 className={`text-2xl font-bold ${tk.headingText} mb-3`}>
                  Connect Your Gmail
                </h2>
                <p
                  className={`text-base ${tk.subtleText} mb-8 leading-relaxed`}
                >
                  To scan your purchase receipts, WardrobeSuite needs read-only
                  access to{" "}
                  <span className={`font-semibold ${tk.headingText}`}>
                    {user.email || "your Gmail"}
                  </span>
                  . Click below and approve access on Google's permission
                  screen.
                </p>
                {/* Connect Gmail button — calls /auth/google/start, then redirects to Google consent screen */}
                <button
                  onClick={async () => {
                    // Persist user info so we can restore it after the OAuth round-trip
                    localStorage.setItem(
                      "wardrobeUser",
                      JSON.stringify({
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                      })
                    );
                    try {
                      const res = await fetch(
                        `${API}/auth/google/start?user_id=${user.userId}`
                      );
                      const data = await res.json();
                      // Redirect browser to Google consent screen
                      window.location.href = data.auth_url;
                    } catch {
                      // Backend unreachable — fall back to showing an error inline
                      alert(
                        "Could not connect to the backend. Make sure it is running on port 8000."
                      );
                    }
                  }}
                  className={`w-full py-4 ${tk.accentBg} text-white rounded-2xl font-bold ${tk.accentHover} transition-all flex items-center justify-center gap-2 text-base`}
                >
                  <Mail size={20} /> Connect Gmail & Start Scanning
                </button>
                <p className={`mt-4 text-xs ${tk.mutedText} leading-relaxed`}>
                  You'll be taken to Google's permission screen. WardrobeSuite
                  only requests <strong>read-only</strong> access to find
                  purchase receipts.
                </p>
              </div>
            </motion.div>
          )}

          {/* ── SCANNING (unchanged) ───────────────────────────────────────── */}
          {view === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
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
                        className={`absolute inset-0 border-4 ${
                          isDark
                            ? "border-indigo-900 border-t-indigo-400"
                            : "border-indigo-100 border-t-indigo-600"
                        } rounded-full`}
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

          {/* ── ITEM REVIEW (unchanged) ────────────────────────────────────── */}
          {view === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex flex-col items-center justify-center"
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
                      You've reviewed all scanned items.
                    </p>
                    <button
                      onClick={() => setView("consumer dashboard")}
                      className={`px-6 py-3 ${
                        isDark
                          ? "bg-slate-200 text-slate-900 hover:bg-white"
                          : "bg-slate-900 text-white hover:bg-slate-800"
                      } rounded-2xl font-bold transition-all text-sm`}
                    >
                      Go to Dashboard
                    </button>
                  </div>
                )}
              </div>
              {reviewIndex < itemsToReview.length && (
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => handleSwipe("left")}
                    className={`px-7 py-3 ${tk.mutedBg} ${tk.bodyText} rounded-2xl font-bold text-sm hover:opacity-80 transition-all border ${tk.border}`}
                  >
                    ✕ Skip
                  </button>
                  <button
                    onClick={() => handleSwipe("right")}
                    className={`px-7 py-3 ${tk.accentBg} text-white rounded-2xl font-bold text-sm ${tk.accentHover} transition-all`}
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
                    className={`fixed bottom-8 left-1/2 -translate-x-1/2 max-w-[400px] w-[calc(100%-2rem)] ${
                      isDark ? "bg-slate-700" : "bg-slate-900"
                    } text-white p-4 rounded-2xl shadow-xl z-50`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span
                        className={`text-sm font-bold uppercase tracking-widest ${tk.accentText}`}
                      >
                        Information
                      </span>
                      <button
                        onClick={() => setShowSwipeTip(false)}
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

          {/* ── CONSUMER DASHBOARD (unchanged) ────────────────────────────── */}
          {view === "consumer dashboard" && (
            <motion.div
              key="consumer dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 sm:pt-20 pb-10 px-4 sm:px-6 max-w-screen-xl mx-auto flex-1 overflow-hidden flex flex-col w-full"
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => startRealScan()}
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
                  <div className="relative overflow-hidden">
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
                      className="flex gap-4"
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
                                className={`px-3 py-1.5 ${
                                  isDark
                                    ? "bg-slate-200 text-slate-900 hover:bg-white"
                                    : "bg-slate-900 text-white hover:bg-slate-700"
                                } rounded-lg transition-all text-xs font-bold flex items-center gap-1`}
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

          {/* ────────────────────────────────────────────────────────────────────
              BUSINESS DASHBOARD — Analytics Table
          ──────────────────────────────────────────────────────────────────── */}
          {view === "business dashboard" && (
            <motion.div
              key="business dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-36 mt-10 sm:pt-20 pb-10 px-4 sm:px-6 max-w-screen-xl mx-auto flex-1 w-full"
            >
              {/* Page header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                  <span
                    className={`inline-block px-3 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-bold uppercase tracking-widest mb-2`}
                  >
                    Business Account
                  </span>
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${tk.headingText}`}
                  >
                    Consumer Analytics
                  </h2>
                  <p className={`text-base ${tk.subtleText} mt-0.5`}>
                    Aggregated, anonymized consumer purchase behavior
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handleDownloadJSON}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${tk.border} ${tk.cardBg} ${tk.bodyText} hover:opacity-80 transition-all`}
                  >
                    <Download size={13} /> Download JSON
                  </button>
                  <button
                    onClick={handleGenerateInsights}
                    disabled={bizInsightsLoading}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${tk.accentBg} text-white ${tk.accentHover} transition-all disabled:opacity-60 disabled:cursor-wait`}
                  >
                    {bizInsightsLoading ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />{" "}
                        Generating…
                      </>
                    ) : (
                      <>
                        <Brain size={13} /> Generate Insights
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {bizError && (
                <div
                  className={`mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2`}
                >
                  <AlertTriangle
                    size={14}
                    className="text-red-500 flex-none mt-0.5"
                  />
                  <p className="text-sm text-red-700">{bizError}</p>
                </div>
              )}

              {/* Filters */}
              <div
                className={`${tk.surfaceBg} rounded-2xl border ${tk.border} p-4 mb-5`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Filter size={14} className={tk.mutedText} />
                  <span
                    className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText}`}
                  >
                    Filters
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className={labelCls}>Merchant</label>
                    <select
                      value={bizFilterMerchant}
                      onChange={(e) => setBizFilterMerchant(e.target.value)}
                      className={`w-full px-3 py-2 text-sm ${tk.inputBg} border ${tk.inputBorder} rounded-xl ${tk.inputFocus} ${tk.inputText} focus:outline-none focus:ring-2 transition-all`}
                    >
                      <option value="">All merchants</option>
                      {bizFilterOptions.merchants.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Category</label>
                    <select
                      value={bizFilterCategory}
                      onChange={(e) => setBizFilterCategory(e.target.value)}
                      className={`w-full px-3 py-2 text-sm ${tk.inputBg} border ${tk.inputBorder} rounded-xl ${tk.inputFocus} ${tk.inputText} focus:outline-none focus:ring-2 transition-all`}
                    >
                      <option value="">All categories</option>
                      {bizFilterOptions.categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Min Spend ($)</label>
                    <input
                      type="number"
                      value={bizFilterMinSpend}
                      onChange={(e) => setBizFilterMinSpend(e.target.value)}
                      placeholder="0.00"
                      className={`w-full px-3 py-2 text-sm ${tk.inputBg} border ${tk.inputBorder} rounded-xl ${tk.inputFocus} ${tk.inputText} focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Min Purchases</label>
                    <input
                      type="number"
                      value={bizFilterMinPurchases}
                      onChange={(e) => setBizFilterMinPurchases(e.target.value)}
                      placeholder="0"
                      className={`w-full px-3 py-2 text-sm ${tk.inputBg} border ${tk.inputBorder} rounded-xl ${tk.inputFocus} ${tk.inputText} focus:outline-none focus:ring-2 transition-all`}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => fetchBizTable(1)}
                    className={`px-4 py-2 ${tk.accentBg} text-white rounded-xl text-xs font-bold ${tk.accentHover} transition-all`}
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      setBizFilterMerchant("");
                      setBizFilterCategory("");
                      setBizFilterMinSpend("");
                      setBizFilterMinPurchases("");
                    }}
                    className={`px-4 py-2 ${tk.mutedBg} ${tk.bodyText} rounded-xl text-xs font-bold hover:opacity-80 transition-all`}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Table */}
              <div
                className={`${tk.cardBg} rounded-2xl border ${tk.border} overflow-hidden`}
              >
                {bizTableLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2
                      size={28}
                      className={`${tk.accentText} animate-spin`}
                    />
                  </div>
                ) : bizTableData.length === 0 ? (
                  <div
                    className={`flex flex-col items-center justify-center py-16 ${tk.mutedText}`}
                  >
                    <Users size={36} className="mb-3 opacity-30" />
                    <p className="text-sm font-medium">No consumer data yet.</p>
                    <p className={`text-xs ${tk.mutedText} mt-1`}>
                      Data appears here after consumers complete Gmail scans.
                    </p>
                    <button
                      onClick={() => fetchBizTable(1)}
                      className={`mt-4 px-4 py-2 ${tk.accentBg} text-white rounded-xl text-xs font-bold`}
                    >
                      Refresh
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr
                            className={`${tk.surfaceBg} border-b ${tk.border}`}
                          >
                            {[
                              "Consumer ID",
                              "Total Spend",
                              "Purchases",
                              "Avg Purchase",
                              "Top Merchant",
                              "Top Spend Merchant",
                              "Top Category",
                              "Top Spend Category",
                            ].map((h) => (
                              <th
                                key={h}
                                className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider ${tk.mutedText} whitespace-nowrap`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {bizTableData.map((row, i) => (
                            <motion.tr
                              key={row.consumer_id}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.02 }}
                              className={`border-b ${tk.border} hover:${tk.surfaceBg} transition-colors`}
                            >
                              <td
                                className={`px-4 py-3 font-mono text-xs ${tk.mutedText}`}
                              >
                                {row.consumer_id}
                              </td>
                              <td
                                className={`px-4 py-3 font-bold ${tk.accentText} whitespace-nowrap`}
                              >
                                {fmt$(row.total_spending_cents)}
                              </td>
                              <td className={`px-4 py-3 ${tk.bodyText}`}>
                                {row.total_purchases}
                              </td>
                              <td
                                className={`px-4 py-3 ${tk.bodyText} whitespace-nowrap`}
                              >
                                {fmt$(row.average_purchase_cents)}
                              </td>
                              <td className={`px-4 py-3 ${tk.bodyText}`}>
                                {row.frequent_merchant || "—"}
                              </td>
                              <td className={`px-4 py-3 ${tk.bodyText}`}>
                                {row.most_spent_merchant || "—"}
                              </td>
                              <td className={`px-4 py-3`}>
                                {row.frequent_category ? (
                                  <span
                                    className={`px-2 py-0.5 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-semibold`}
                                  >
                                    {row.frequent_category}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className={`px-4 py-3`}>
                                {row.most_spent_category ? (
                                  <span
                                    className={`px-2 py-0.5 ${tk.mutedBg} ${tk.bodyText} rounded-full text-xs font-semibold`}
                                  >
                                    {row.most_spent_category}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div
                      className={`flex items-center justify-between px-4 py-3 border-t ${tk.border}`}
                    >
                      <span className={`text-xs ${tk.mutedText}`}>
                        {bizTableTotal} consumers total
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fetchBizTable(bizPage - 1)}
                          disabled={bizPage === 1}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${tk.border} ${tk.cardBg} ${tk.bodyText} disabled:opacity-40 hover:opacity-80 transition-all flex items-center gap-1`}
                        >
                          <ChevronLeft size={12} /> Prev
                        </button>
                        <span
                          className={`px-3 py-1.5 text-xs font-bold ${tk.mutedText}`}
                        >
                          Page {bizPage}
                        </span>
                        <button
                          onClick={() => fetchBizTable(bizPage + 1)}
                          disabled={bizPage * 50 >= bizTableTotal}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border ${tk.border} ${tk.cardBg} ${tk.bodyText} disabled:opacity-40 hover:opacity-80 transition-all flex items-center gap-1`}
                        >
                          Next <ChevronRight size={12} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* ────────────────────────────────────────────────────────────────────
              BUSINESS KPI — Strategic Intelligence Dashboard
          ──────────────────────────────────────────────────────────────────── */}
          {view === "business kpi" && (
            <motion.div
              key="business kpi"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 sm:pt-20 pb-10 px-4 sm:px-6 max-w-screen-xl mx-auto flex-1 w-full"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-3">
                <div>
                  <span
                    className={`inline-block px-3 py-1 ${tk.accentSubtle} ${tk.accentSubtleText} rounded-full text-xs font-bold uppercase tracking-widest mb-2`}
                  >
                    Strategic Intelligence
                  </span>
                  <h2
                    className={`text-2xl sm:text-3xl font-bold ${tk.headingText}`}
                  >
                    KPI Dashboard
                  </h2>
                  <p className={`text-base ${tk.subtleText} mt-0.5`}>
                    All metrics computed server-side from the UserAnalytics
                    table
                  </p>
                </div>
                <button
                  onClick={fetchKPI}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border ${tk.border} ${tk.cardBg} ${tk.bodyText} hover:opacity-80 transition-all`}
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {kpiLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2
                    size={32}
                    className={`${tk.accentText} animate-spin`}
                  />
                </div>
              ) : !kpiData || kpiData.consumer_count === 0 ? (
                <div
                  className={`flex flex-col items-center justify-center py-24 ${tk.surfaceBg} rounded-3xl border-2 border-dashed ${tk.border}`}
                >
                  <BarChart2
                    size={40}
                    className={`${tk.mutedText} mb-4 opacity-30`}
                  />
                  <p
                    className={`text-sm font-bold uppercase tracking-widest ${tk.mutedText} mb-1`}
                  >
                    No Data Yet
                  </p>
                  <p className={`text-sm ${tk.mutedText} max-w-xs text-center`}>
                    KPIs appear here once consumers complete Gmail scans and
                    analytics are computed.
                  </p>
                  <button
                    onClick={fetchKPI}
                    className={`mt-6 px-5 py-2.5 ${tk.accentBg} text-white rounded-xl text-sm font-bold`}
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Section: Executive Metrics */}
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} mb-3 flex items-center gap-2`}
                    >
                      <TrendingUp size={13} /> Executive Metrics
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      <KPICard
                        tk={tk}
                        accent
                        label="Total Aggregated Spend"
                        value={fmt$(kpiData.executive.total_spending_cents)}
                        sub={`Across ${kpiData.consumer_count} consumers`}
                        icon={TrendingUp}
                      />
                      <KPICard
                        tk={tk}
                        label="Avg Spend / Consumer"
                        value={fmt$(
                          kpiData.executive.avg_spending_per_consumer_cents
                        )}
                        icon={Users}
                      />
                      <KPICard
                        tk={tk}
                        label="Merchant Concentration"
                        value={`${kpiData.executive.merchant_concentration_pct}%`}
                        sub={`Top: ${
                          kpiData.executive.top_merchant_by_spend || "—"
                        }`}
                        icon={BarChart2}
                      />
                      <KPICard
                        tk={tk}
                        label="Category Concentration"
                        value={`${kpiData.executive.category_concentration_pct}%`}
                        sub={`Top: ${
                          kpiData.executive.top_category_by_spend || "—"
                        }`}
                        icon={Tag}
                      />
                    </div>
                  </div>

                  {/* Section: Behavioral */}
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} mb-3 flex items-center gap-2`}
                    >
                      <Users size={13} /> Behavioral Metrics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Repeat purchase */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 ${tk.cardBg} rounded-2xl border ${tk.border}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText}`}
                          >
                            Multi-Brand Shoppers
                          </span>
                          <Sparkles size={14} className={tk.accentText} />
                        </div>
                        <div
                          className={`text-3xl font-bold ${tk.headingText} mb-1`}
                        >
                          {kpiData.behavioral.multi_brand_shopper_pct}%
                        </div>
                        <p className={`text-xs ${tk.mutedText}`}>
                          Consumers shopping at 2+ merchants
                        </p>
                        <div
                          className={`mt-3 h-2 ${tk.mutedBg} rounded-full overflow-hidden`}
                        >
                          <motion.div
                            className="h-full bg-emerald-500 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                              width: `${kpiData.behavioral.multi_brand_shopper_pct}%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>

                      {/* Top 5 merchants by frequency */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.07 }}
                        className={`p-5 ${tk.cardBg} rounded-2xl border ${tk.border}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText}`}
                          >
                            Top 5 Merchants
                          </span>
                          <span className={`text-xs ${tk.mutedText}`}>
                            by frequency
                          </span>
                        </div>
                        <MiniBarChart
                          tk={tk}
                          data={kpiData.behavioral.top_merchants_by_frequency}
                          labelKey="merchant"
                          valueKey="count"
                          colorClass="bg-indigo-500"
                          formatValue={(v) => `${v}x`}
                        />
                      </motion.div>

                      {/* Top 5 categories by spend */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.14 }}
                        className={`p-5 ${tk.cardBg} rounded-2xl border ${tk.border}`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText}`}
                          >
                            Top 5 Categories
                          </span>
                          <span className={`text-xs ${tk.mutedText}`}>
                            by spend
                          </span>
                        </div>
                        <MiniBarChart
                          tk={tk}
                          data={kpiData.behavioral.top_categories_by_spend}
                          labelKey="category"
                          valueKey="spend_cents"
                          colorClass="bg-violet-500"
                          formatValue={(v) => fmt$(v)}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Section: Predictive */}
                  <div>
                    <h3
                      className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText} mb-3 flex items-center gap-2`}
                    >
                      <AlertTriangle size={13} /> Predictive Metrics
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Churn risk */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-5 ${tk.cardBg} rounded-2xl border ${tk.border}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText}`}
                          >
                            Churn Risk
                          </span>
                          <AlertTriangle
                            size={14}
                            className={
                              kpiData.predictive.churn_risk_pct > 40
                                ? "text-red-500"
                                : kpiData.predictive.churn_risk_pct > 20
                                ? "text-amber-500"
                                : "text-emerald-500"
                            }
                          />
                        </div>
                        <div
                          className={`text-3xl font-bold mb-1 ${
                            kpiData.predictive.churn_risk_pct > 40
                              ? "text-red-500"
                              : kpiData.predictive.churn_risk_pct > 20
                              ? "text-amber-500"
                              : "text-emerald-500"
                          }`}
                        >
                          {kpiData.predictive.churn_risk_pct}%
                        </div>
                        <p className={`text-xs ${tk.mutedText} mb-3`}>
                          Consumers inactive for 60+ days
                        </p>
                        <div
                          className={`h-2 ${tk.mutedBg} rounded-full overflow-hidden`}
                        >
                          <motion.div
                            className={`h-full rounded-full ${
                              kpiData.predictive.churn_risk_pct > 40
                                ? "bg-red-500"
                                : kpiData.predictive.churn_risk_pct > 20
                                ? "bg-amber-500"
                                : "bg-emerald-500"
                            }`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${kpiData.predictive.churn_risk_pct}%`,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        </div>
                      </motion.div>

                      {/* Velocity distribution */}
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.07 }}
                        className={`p-5 ${tk.cardBg} rounded-2xl border ${tk.border}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold uppercase tracking-widest ${tk.mutedText}`}
                          >
                            Purchase Velocity
                          </span>
                          <span
                            className={`text-xs font-bold ${tk.accentText}`}
                          >
                            {
                              kpiData.predictive
                                .avg_purchase_velocity_per_30_days
                            }
                            x / 30d avg
                          </span>
                        </div>
                        <p className={`text-xs ${tk.mutedText} mb-4`}>
                          Distribution of consumer purchase rates
                        </p>
                        <MiniBarChart
                          tk={tk}
                          data={kpiData.predictive.velocity_distribution}
                          labelKey="label"
                          valueKey="count"
                          colorClass="bg-sky-500"
                          formatValue={(v) => `${v} consumers`}
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ── WARDROBE (unchanged) ──────────────────────────────────────── */}
          {view === "wardrobe" && (
            <motion.div
              key="wardrobe"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pt-16 sm:pt-20 pb-10 px-4 sm:px-6 max-w-screen-xl mx-auto flex-1 w-full"
            >
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
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                    outfitBuilderOpen
                      ? `${tk.skyBg} text-white ${tk.skyHover}`
                      : isDark
                      ? "bg-slate-200 text-slate-900 hover:bg-white"
                      : "bg-slate-900 text-white hover:bg-slate-800"
                  }`}
                >
                  <Sparkles size={17} />
                  {outfitBuilderOpen
                    ? "Hide Outfit Builder"
                    : "Build an Outfit"}
                </button>
              </div>
              <div
                className={`flex gap-6 ${
                  outfitBuilderOpen ? "flex-col lg:flex-row" : "flex-col"
                }`}
              >
                <div
                  className={outfitBuilderOpen ? "lg:flex-1 min-w-0" : "w-full"}
                >
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
                        className={`w-full pl-10 pr-4 py-2.5 ${tk.inputBg} border ${tk.inputBorder} rounded-xl text-base ${tk.inputFocus} ${tk.inputText} placeholder:${tk.mutedText} focus:outline-none focus:ring-2 transition-all`}
                      />
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setFilterOpen((o) => !o)}
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
                          className={`transition-transform ${
                            filterOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {filterOpen && (
                          <>
                            <div
                              className="fixed inset-0 bg-black/30 z-30 md:hidden"
                              onClick={() => setFilterOpen(false)}
                              aria-hidden="true"
                            />
                            <motion.div
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 8 }}
                              transition={{ duration: 0.2 }}
                              className={`fixed inset-x-0 bottom-0 z-40 ${tk.filterBg} rounded-t-3xl shadow-2xl p-5 max-h-[85vh] overflow-y-auto md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:w-72 md:rounded-2xl md:shadow-xl md:max-h-none md:overflow-visible border ${tk.border}`}
                            >
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
                                      s === "category" ? null : "category"
                                    )
                                  }
                                  tk={tk}
                                >
                                  <div className="space-y-0.5 pt-1">
                                    {categories.map((cat) => (
                                      <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                          activeCategory === cat
                                            ? tk.filterActiveItem
                                            : `${tk.bodyText} ${tk.filterItemHover}`
                                        }`}
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
                                      s === "season" ? null : "season"
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
                                      )
                                    )}
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
                                  className={`px-5 py-2.5 ${
                                    isDark
                                      ? "bg-slate-200 text-slate-900 hover:bg-white"
                                      : "bg-slate-900 text-white hover:bg-slate-800"
                                  } rounded-xl text-sm font-bold transition-all`}
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
                              />
                              {outfitBuilderOpen && activeOutfitId && (
                                <button
                                  onClick={() => addItemToOutfit(item)}
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
                              className={`px-3 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                                activeOutfitId === outfit.id
                                  ? `${tk.skyBg} text-white`
                                  : `${tk.cardBg} border ${tk.border} ${tk.bodyText} hover:border-indigo-400`
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
                                    ? "text-white/70 hover:text-white"
                                    : `${tk.mutedText} hover:text-red-500`
                                }`}
                              >
                                <X size={10} />
                              </button>
                            </button>
                          ))}
                        </div>
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
                                          item.id
                                        )
                                      }
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
                                      0
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

          {/* ── CONSUMER PROFILE (unchanged) ──────────────────────────────── */}
          {view === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
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
                    onClick={() => {
                      setUser({
                        firstName: "",
                        lastName: "",
                        email: "",
                        userId: "",
                        role: "consumer",
                      });
                      setView("landing");
                    }}
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

          {/* ── BUSINESS PROFILE (unchanged) ──────────────────────────────── */}
          {view === "business profile" && (
            <motion.div
              key="business profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="pt-16 pb-10 px-4 sm:px-6 flex-1 flex items-center justify-center"
            >
              <div
                className={`max-w-2xl w-full ${tk.cardBg} p-6 sm:p-8 rounded-3xl shadow-xl border ${tk.border}`}
              >
                <div className="flex justify-between items-center mb-8">
                  <button
                    onClick={() => setView("business dashboard")}
                    className={`text-sm font-bold ${tk.mutedText} hover:${tk.accentText} transition-colors flex items-center gap-1.5`}
                  >
                    <ChevronLeft size={16} /> Back to Dashboard
                  </button>
                  <button
                    onClick={() => {
                      setUser({
                        firstName: "",
                        lastName: "",
                        email: "",
                        userId: "",
                        role: "consumer",
                      });
                      setView("landing");
                    }}
                    className="text-sm font-bold text-red-500 hover:text-red-600 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
                <div className="flex items-center gap-4 mb-8">
                  <div
                    className={`w-14 h-14 ${tk.accentSubtle} rounded-2xl flex items-center justify-center ${tk.accentText} flex-none`}
                  >
                    <Building2 size={26} />
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${tk.headingText}`}>
                      Business Profile
                    </h2>
                    <p className={`text-sm ${tk.subtleText}`}>
                      Manage your business account settings
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Business Name", value: user.firstName || "—" },
                    { label: "Email Address", value: user.email || "—" },
                    { label: "Account Type", value: "Business" },
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
                  <div className="pt-2">
                    <button
                      className={`w-full py-4 ${tk.accentBg} text-white rounded-2xl font-bold text-base ${tk.accentHover} transition-all shadow-lg`}
                    >
                      Save Profile
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
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
