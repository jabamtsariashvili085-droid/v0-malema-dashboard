import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { AppContext } from "./context/AppContext";
import { Icon } from "./components/Icons";
import { DARK, LIGHT } from "./utils/themes";
import { Toast, SearchInput, Logo } from "./components/UI";
import { ThemeToggle } from "./components/ThemeToggle";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ProductsPage } from "./pages/ProductsPage";
import { StockPage } from "./pages/StockPage";
import { SalesPage } from "./pages/SalesPage";
import { CustomersPage } from "./pages/CustomersPage";
import { ReportPage } from "./pages/ReportPage";
import { AccountingPage } from "./pages/AccountingPage";
import { InstallPrompt } from "./components/InstallPrompt";
import { NotificationBell } from "./components/Notifications";

const PAGES = [
  { id: "dashboard", label: "მიმოხილვა", icon: Icon.dashboard },
  { id: "products", label: "პროდუქტები", icon: Icon.products },
  { id: "stock", label: "საწყობი", icon: Icon.stock },
  { id: "sales", label: "გაყიდვები", icon: Icon.sales },
  { id: "customers", label: "კლიენტები", icon: Icon.customers },
  { id: "report", label: "ანგარიში", icon: Icon.report },
  { id: "accounting", label: "ბუღალტერია", icon: Icon.sales },
];

function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const [searchQuery, setSearchQuery] = useState("");

  const t = dark ? DARK : LIGHT;
  const toast = (msg, type = "success") => setToastMsg({ msg, type });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => { if (supabase) await supabase.auth.signOut(); };

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bg }}>
      <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: `${t.accent}30`, borderTopColor: t.accent }} />
    </div>
  );

  if (!supabase) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: t.bg }}>
      <div className="text-center max-w-md p-8 rounded-2xl border" style={{ background: t.card, borderColor: t.border }}>
        <p className="text-4xl mb-4">&#9888;</p>
        <h2 className="text-xl font-bold mb-2" style={{ color: t.text }}>Supabase კონფიგურაციის შეცდომა</h2>
        <p className="text-sm mb-4" style={{ color: t.textMuted }}>VITE_SUPABASE_URL და VITE_SUPABASE_ANON_KEY გარემოს ცვლადები არ არის კონფიგურირებული.</p>
        <p className="text-xs" style={{ color: t.textFaint }}>შეამოწმეთ .env ფაილი პროექტის root-ში.</p>
      </div>
    </div>
  );

  if (!session) return (
    <AppContext.Provider value={{ toast, t }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Noto Sans Georgian', sans-serif; }
        .font-display { font-family: 'Playfair Display', serif; }
      `}</style>
      <LoginPage />
    </AppContext.Provider>
  );

  const navigate = (p) => { setPage(p); setSidebarOpen(false); };
  const PageComponent = {
    dashboard: DashboardPage,
    products: ProductsPage,
    stock: StockPage,
    sales: SalesPage,
    customers: CustomersPage,
    report: ReportPage,
    accounting: AccountingPage
  }[page];

  return (
    <AppContext.Provider value={{ toast, t, searchQuery, setSearchQuery }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Georgian:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Noto Sans Georgian', sans-serif; background: ${t.bg}; transition: background 0.3s; }
        .font-display { font-family: 'Playfair Display', serif; }
        @keyframes slide-up { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slide-up 0.3s ease; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${t.scrollbar}; border-radius: 4px; }
      `}</style>

      <div className="min-h-screen flex" style={{ background: t.bg }}>
        {sidebarOpen && <div className="fixed inset-0 z-30 lg:hidden" style={{ background: t.overlay }} onClick={() => setSidebarOpen(false)} />}

        <aside className={`fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-all duration-300 border-r ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
          style={{ background: t.sidebar, borderColor: t.border }}>
          <div className="p-6 border-b" style={{ borderColor: t.border }}>
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <div>
                <p className="font-bold text-sm font-display tracking-wider" style={{ color: t.text }}>MALEMA LTD</p>
                <p className="text-xs" style={{ color: t.textFaint }}>საწყობის მართვა</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {PAGES.map(p => (
              <button key={p.id} onClick={() => navigate(p.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 border"
                style={page === p.id
                  ? { background: t.navActive, color: t.navActiveText, borderColor: t.navActiveBorder }
                  : { background: "transparent", color: t.navText, borderColor: "transparent" }
                }>
                {p.icon}{p.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t space-y-1" style={{ borderColor: t.border }}>
            <ThemeToggle dark={dark} onToggle={toggleTheme} />
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all"
              style={{ color: "#ef4444" }}>
              {Icon.logout} გამოსვლა
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 backdrop-blur border-b px-4 py-4 flex items-center gap-4 lg:px-8"
            style={{ background: t.headerBg, borderColor: t.border }}>
            <button className="lg:hidden transition-colors" style={{ color: t.textMuted }} onClick={() => setSidebarOpen(true)}>{Icon.menu}</button>
            <p className="text-sm whitespace-nowrap" style={{ color: t.textMuted }}>{PAGES.find(p => p.id === page)?.label}</p>
            <SearchInput value={searchQuery} onChange={setSearchQuery} placeholder="ძებნა..." />
            <NotificationBell />
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg transition-colors print:hidden"
              style={{ color: t.textMuted, background: t.accentBg }}
              title="დაბეჭდვა"
            >
              {Icon.print}
            </button>
            <InstallPrompt />
          </header>
          <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">
            <PageComponent />
          </div>
        </main>
      </div>

      {toastMsg && <Toast msg={toastMsg.msg} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
    </AppContext.Provider>
  );
}

export default App;
