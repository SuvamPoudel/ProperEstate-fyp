import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import "./DesignSystem.css";
import "./HeroSection.css";
import "./Navigation.css";
import "./Sidebar.css";
import "./PropertyCards.css";
import "./SearchEnhanced.css";
import "./PageTransitions.css";
import "./ThemeSwitcher.css";
import "./ScrollAnimations.css";
import "./FilterPanel.css";
import "./ProfilePage.css";
import "./ChatbotPage.css";
import "./AestheticDesign.css";
import "./Animations.css";
import "./RentalPartnerPage.css";
import "./BuyersSectionPage.css";
import "./BuyersForumPage.css";
import "./LandForm.css";
import "./HelpCenter.css";
import "./DashboardPages.css";
import "./BuildPropertyPage.css";
import "./BiddingPage.css";
import initAnimations from "./animations";

// Core components
import ChatApp, { NotificationsPanel } from "./components/chatting";
import CinematicEffects from "./components/CinematicEffects";
import EsewaPayment from "./components/EsewaPayment";
import Toast from "./components/Toast";
import SearchBar from "./components/SearchBar";
import FilterBar from "./components/FilterBar";
import LandCard from "./components/LandCard";
import LandForm from "./components/LandForm";
import SmartSuggestor from "./components/SmartSuggestor";
import HelpCenter from "./components/HelpCenter";
import HeroVideoBackground from "./components/HeroVideoBackground";

// Pages
import LandDetailsPage from "./pages/LandDetailsPage";
import EditLandPage from "./pages/EditLandPage";
import AdminDashboard from "./pages/AdminDashboard";
import ProperAgentPage from "./pages/ProperAgentPage";
import BuyersSectionPage from "./pages/BuyersSectionPage";
import BuyersForumPage from "./pages/BuyersForumPage";
import RentalPartnerPage from "./pages/RentalPartnerPage";
import { ListedAssetsPage, SavedWishlistPage, RentalRequestsPage } from "./pages/DashboardPages";
import BuildPropertyPage from "./pages/BuildPropertyPage";
import ChatDMPage from "./pages/ChatDMPage";
import BiddingPage from "./pages/BiddingPage";

// Auth pages (kept in pages folder)
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import ProfilePage from "./pages/Profile";

import { API_URL } from "./constants";

const getUserFromStorage = () => {
  const saved = localStorage.getItem("properEstateUser");
  return saved ? JSON.parse(saved) : null;
};

function App() {
  const [lands, setLands] = useState([]);
  const [filteredLands, setFilteredLands] = useState([]);
  const [user, setUser] = useState(getUserFromStorage());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashData, setDashData] = useState({ uploaded: [], saved: [], bookings: [] });
  const [showDashMenu, setShowDashMenu] = useState(false);
  const dashMenuRef = useRef(null);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const notifRef = useRef(null);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [cachedAddFormData, setCachedAddFormData] = useState(null);
  const [chatTarget, setChatTarget] = useState(null);
  const [bookingCount, setBookingCount] = useState(0);
  const [toast, setToast] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [theme] = useState('dark');
  const chatRef = useRef(null);
  const [chatUnread, setChatUnread] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  // Close dash menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dashMenuRef.current && !dashMenuRef.current.contains(e.target)) {
        setShowDashMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifPanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchLands = async () => {
    try {
      const res = await fetch(`${API_URL}/lands`);
      const data = await res.json();
      setLands(data.lands); setFilteredLands(data.lands);
    } catch (err) { console.error("Failed to fetch lands", err); }
  };

  const fetchDashboardData = async () => {
    if (!user?._id) return;
    fetch(`${API_URL}/user-dashboard/` + user._id)
      .then(r => r.json())
      .then(d => { setDashData(prev => ({ ...prev, uploaded: d.uploaded, saved: d.saved })); })
      .catch(() => {});
    fetch(`${API_URL}/seller/bookings/` + user._id)
      .then(r => r.json())
      .then(d => {
        setDashData(prev => ({ ...prev, bookings: d.bookings }));
        const pending = (d.bookings || []).filter(b => b.status === "pending").length;
        setBookingCount(pending);
      })
      .catch(() => {});
  };

  useEffect(() => { fetchLands(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDashboardData(); }, [user, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  // Initialize animations
  useEffect(() => {
    initAnimations();
  }, [location.pathname]);

  const toggleSave = async (landId) => {
    if (!user) return navigate("/login");
    // Optimistic update — convert to string for consistent comparison
    const landIdStr = landId.toString();
    const currentSaved = (user.savedLands || []).map(id => id.toString());
    const isNowSaved = currentSaved.includes(landIdStr);
    const optimisticSaved = isNowSaved
      ? currentSaved.filter(id => id !== landIdStr)
      : [...currentSaved, landIdStr];
    const optimisticUser = { ...user, savedLands: optimisticSaved };
    setUser(optimisticUser);
    localStorage.setItem("properEstateUser", JSON.stringify(optimisticUser));

    try {
      const res = await fetch(`${API_URL}/toggle-save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user._id, landId: landIdStr })
      });
      const data = await res.json();
      if (data.success) {
        const confirmedUser = { ...user, savedLands: data.savedLands };
        setUser(confirmedUser);
        localStorage.setItem("properEstateUser", JSON.stringify(confirmedUser));
        // Refresh dashboard data so wishlist page updates
        fetchDashboardData();
      }
    } catch (err) {
      // Revert optimistic update on error
      setUser(user);
      localStorage.setItem("properEstateUser", JSON.stringify(user));
    }
  };

  const handleLogout = () => { setUser(null); localStorage.removeItem("properEstateUser"); navigate("/login"); setSidebarOpen(false); };

  const applyFilters = (filters) => {
    let temp = [...lands];
    if (filters.location) temp = temp.filter(l => (l.location || "").toLowerCase().includes(filters.location.toLowerCase()) || (l.city || "").toLowerCase().includes(filters.location.toLowerCase()) || (l.district || "").toLowerCase().includes(filters.location.toLowerCase()));
    if (filters.minPrice) temp = temp.filter(l => l.price >= parseInt(filters.minPrice));
    if (filters.maxPrice) temp = temp.filter(l => l.price <= parseInt(filters.maxPrice));
    if (filters.category) temp = temp.filter(l => l.subCategory === filters.category || l.category === filters.category || l.mainCategory === filters.category);
    setFilteredLands(temp);
  };

  const handleGlobalSearch = (query) => {
    const lowerQ = query.toLowerCase();
    const results = lands.filter(l => (l.title || "").toLowerCase().includes(lowerQ) || (l.location || "").toLowerCase().includes(lowerQ) || (l.city || "").toLowerCase().includes(lowerQ) || (l.district || "").toLowerCase().includes(lowerQ) || (l.province || "").toLowerCase().includes(lowerQ));
    setFilteredLands(results); navigate("/");
  };

  const respondToBooking = async (id, status) => {
    await fetch(`${API_URL}/seller/respond-booking/` + id, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchDashboardData();
  };

  const initiateAddLand = (e) => {
    e.preventDefault();
    if (!user) return navigate("/login");
    if (user.accountType && user.accountType !== "seller" && user.role !== "admin") {
      setToast({ msg: "You need a verified Seller account to list properties. Go to Profile → Become a Seller to apply.", type: "warn" });
      return;
    }
    const fd = new FormData(e.target);
    fd.append("ownerId", user._id);
    setCachedAddFormData(fd); setShowAddPayment(true);
  };

  const completeAddLand = async () => {
    setShowAddPayment(false);
    const res = await fetch(`${API_URL}/add-land`, { method: "POST", body: cachedAddFormData });
    if ((await res.json()).success) { alert("Property Listed! Waiting for Admin Verification."); await fetchLands(); navigate("/"); }
  };

  return (
    <div className="app-root">
      <div className="noise-overlay"></div>
      <CinematicEffects />

      {showAddPayment && (<EsewaPayment amount={500} description={"ProperEstate Platform Commission (Listing Fee)"} onSuccess={completeAddLand} onCancel={() => setShowAddPayment(false)} />)}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      {user && location.pathname !== "/messages" && (
        <ChatApp user={user} initialOther={chatTarget} openRef={chatRef} onUnreadChange={setChatUnread} />
      )}
      {user && showNotifPanel && (
        <NotificationsPanel
          user={user}
          bookingCount={bookingCount}
          dashData={dashData}
          respondToBooking={respondToBooking}
          onClose={() => setShowNotifPanel(false)}
        />
      )}

      <div className={"sidebar-overlay " + (sidebarOpen ? "open" : "")} onClick={() => setSidebarOpen(false)}></div>
      <div className={"sidebar " + (sidebarOpen ? "open" : "")}>
        <div className="sidebar-inner">

          {/* ── Header ── */}
          <div className="sidebar-header">
            {/* Background video */}
            <video
              className="sidebar-header-video"
              autoPlay
              muted
              loop
              playsInline
            >
              <source src={encodeURI("/videos/Kathmandu City From Above 🇳🇵  A Cinematic Drone Journey.mp4")} type="video/mp4" />
            </video>
            <div className="sidebar-header-overlay"></div>

            <h2 className="sidebar-logo">ProperEstate</h2>
            <p className="sidebar-tagline">Web-based real estate rental — direct from seller to buyer. No brokers, no commission.</p>
          </div>

          <div className="sidebar-divider"></div>

          {/* ── Main nav ── */}
          <span className="sidebar-section-label">Navigate</span>
          <nav className="sidebar-nav">

            <div className="sidebar-link" onClick={() => { navigate("/"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              </span>
              <span className="sidebar-link-label">Home Explore</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            {user?.role === "admin" && (
              <div className="sidebar-link admin-link" onClick={() => { navigate("/admin"); setSidebarOpen(false); }}>
                <span className="sidebar-link-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </span>
                <span className="sidebar-link-label">Admin Panel</span>
                <span className="sidebar-link-arrow">›</span>
              </div>
            )}

            <div className="sidebar-link" onClick={() => { navigate("/profile"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </span>
              <span className="sidebar-link-label">My Profile</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/add-land"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </span>
              <span className="sidebar-link-label">List Property</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/rental-partner"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <span className="sidebar-link-label">Rental Partner</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/proper-agent"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/></svg>
              </span>
              <span className="sidebar-link-label">ProperAgent AI</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/buyers-section"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </span>
              <span className="sidebar-link-label">Buyers Section</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/buyers-forum"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              <span className="sidebar-link-label">Buyers Forum</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/build-property"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
              </span>
              <span className="sidebar-link-label">Build Property</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            <div className="sidebar-link" onClick={() => { navigate("/bidding"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              </span>
              <span className="sidebar-link-label">Bidding</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

          </nav>

          <div className="sidebar-spacer"></div>

          {/* ── Footer nav ── */}
          <div className="sidebar-footer-divider"></div>
          <span className="sidebar-section-label" style={{ paddingTop: '14px' }}>Support</span>
          <nav className="sidebar-footer-nav">

            <div className="sidebar-link" onClick={() => { navigate("/help"); setSidebarOpen(false); }}>
              <span className="sidebar-link-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
              <span className="sidebar-link-label">Help Center</span>
              <span className="sidebar-link-arrow">›</span>
            </div>

            {user && (
              <div className="sidebar-link logout" onClick={handleLogout}>
                <span className="sidebar-link-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </span>
                <span className="sidebar-link-label">Logout</span>
                <span className="sidebar-link-arrow">›</span>
              </div>
            )}

          </nav>

          {/* ── Brand strip ── */}
          <div className="sidebar-brand-strip">
            <span className="sidebar-brand-strip-text">© 2025 ProperEstate</span>
            <span className="sidebar-brand-strip-dot"></span>
          </div>

        </div>
      </div>

      <header className="header">
        <div className="nav-bar">
          <div className="nav-left">
            <div onClick={() => setSidebarOpen(v => !v)} className={"menu-icon" + (sidebarOpen ? " sidebar-open" : "")}>
              <div className="hamburger-lines">
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
                <span className="hamburger-line"></span>
              </div>
            </div>
            <div className="logo" onClick={() => navigate("/")}>ProperEstate</div>
          </div>
          <SearchBar onSearch={handleGlobalSearch} />
          <div className="nav-right">
            {user && (
              <>
                <button className="nav-chat-btn" onClick={() => chatRef.current?.toggle()} title="Messages">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  {chatUnread > 0 && <span className="nav-requests-badge" style={{top:2,right:2,background:"#e53935"}}>{chatUnread > 9 ? "9+" : chatUnread}</span>}
                </button>
                <button className="nav-requests-btn" ref={notifRef} onClick={() => setShowNotifPanel(v => !v)} title="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {bookingCount > 0 && <span className="nav-requests-badge">{bookingCount}</span>}
                </button>
              </>
            )}
            {!user ? (
              <button className="btn-primary" onClick={() => navigate("/login")}>Login</button>
            ) : (
              <div className="user-menu" ref={dashMenuRef}>
                <div className="nav-item" onClick={() => setShowDashMenu(v => !v)}>Dashboard</div>
                {showDashMenu && (
                  <div className="dropdown-menu">
                    <div onClick={() => { navigate("/dashboard/listed"); setShowDashMenu(false); }}>My Listed Assets</div>
                    <div onClick={() => { navigate("/dashboard/saved"); setShowDashMenu(false); }}>My Saved Wishlist</div>
                  </div>
                )}
                <img 
                  key={user.avatar || "no-avatar"}
                  onClick={() => navigate("/profile")} 
                  src={user.avatar 
                    ? `${API_URL}/uploads/${user.avatar}` 
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0d1a2e&color=00d4ff&bold=true&size=64`
                  } 
                  className="nav-avatar" 
                  alt="avatar" 
                />
              </div>
            )}
          </div>
        </div>
      </header>

      <main className={location.pathname === "/" ? "home-main" : ""}>
        <Routes>
          <Route path="/" element={
            <>
              <div className="hero-enhanced">
                <HeroVideoBackground />
                <div className="hero-content-enhanced">
                  <h1 className="hero-title-enhanced" style={{ fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
                    <span className="hero-title-word"><span className="hero-title-word-inner">Brokers</span></span>{' '}
                    <span className="hero-title-word"><span className="hero-title-word-inner">make</span></span>{' '}
                    <span className="hero-title-word"><span className="hero-title-word-inner accent-gradient">You</span></span>{' '}
                    <span className="hero-title-word"><span className="hero-title-word-inner">Broke</span></span>
                  </h1>
                  <p className="hero-description-enhanced" style={{ fontFamily: 'var(--font-serif)', fontSize: '1.2rem', letterSpacing: '0.05em' }}>
                    ProperEstate - Deal Direct Seller to Buyer
                  </p>
                  <div className="hero-stats-enhanced">
                    <div className="hero-stat-item"><span className="hero-stat-num">1,200+</span><span className="hero-stat-label">Properties</span></div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat-item"><span className="hero-stat-num">50+</span><span className="hero-stat-label">Cities</span></div>
                    <div className="hero-stat-divider"></div>
                    <div className="hero-stat-item"><span className="hero-stat-num">98%</span><span className="hero-stat-label">Satisfaction</span></div>
                  </div>
                </div>
                <div className="hero-floating-elements">
                  <div className="floating-card card-1">
                    <div className="floating-card-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    </div>
                    <div className="floating-card-text">Premium Apartments</div>
                  </div>
                  <div className="floating-card card-2">
                    <div className="floating-card-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                    </div>
                    <div className="floating-card-text">Agricultural Land</div>
                  </div>
                  <div className="floating-card card-3">
                    <div className="floating-card-icon">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>
                    </div>
                    <div className="floating-card-text">Commercial Space</div>
                  </div>
                </div>
              </div>
              <div className="container">
                <FilterBar onFilter={applyFilters} refreshList={fetchLands} />
                <div className="lands-grid">
                  {filteredLands.map(l => <LandCard key={l._id} land={l} user={user} toggleSave={toggleSave} />)}
                  {filteredLands.length === 0 && <p className="no-res">No properties match your filters.</p>}
                </div>
              </div>
            </>
          } />

          <Route path="/land/:id" element={<LandDetailsPage user={user} toggleSave={toggleSave} onChatWith={(owner) => { setChatTarget(owner); chatRef.current?.openWith(owner); }} />} />
          <Route path="/edit-land/:id" element={<EditLandPage user={user} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/signup" element={<SignupPage setUser={setUser} />} />
          <Route path="/profile" element={<ProfilePage user={user} setUser={setUser} />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/rental-partner" element={user ? <RentalPartnerPage user={user} chatRef={chatRef} /> : <Navigate to="/login" />} />
          <Route path="/proper-agent" element={<ProperAgentPage user={user} />} />
          <Route path="/buyers-section" element={<BuyersSectionPage user={user} chatRef={chatRef} />} />
          <Route path="/buyers-forum" element={<BuyersForumPage user={user} chatRef={chatRef} />} />
          <Route path="/messages" element={user ? <ChatDMPage user={user} chatRef={chatRef} /> : <Navigate to="/login" />} />
          <Route path="/build-property" element={user ? <BuildPropertyPage user={user} chatRef={chatRef} /> : <Navigate to="/login" />} />
          <Route path="/bidding" element={<BiddingPage user={user} />} />
          <Route path="/dashboard/listed" element={<ListedAssetsPage user={user} toggleSave={toggleSave} fetchDashboardData={fetchDashboardData} />} />
          <Route path="/dashboard/saved" element={<SavedWishlistPage user={user} toggleSave={toggleSave} />} />
          <Route path="/dashboard/requests" element={<RentalRequestsPage dashData={dashData} respondToBooking={respondToBooking} />} />
          <Route path="/admin" element={user?.role === "admin" ? <AdminDashboard user={user} chatRef={chatRef} /> : <Navigate to="/" />} />
          <Route path="/add-land" element={
            !user ? <Navigate to="/login" /> :
            <LandForm onSubmit={initiateAddLand} submitLabel="Submit & Pay Rs. 500 Commission" />
          } />
        </Routes>
      </main>

      <SmartSuggestor user={user} />

      <footer className="footer">
        <h2>PROPERESTATE</h2>
        <p>2026 Premium Rental Platform - Nepal - Broker Free</p>
      </footer>
    </div>
  );
}

export default function AppWrapper() { return <BrowserRouter><App /></BrowserRouter>; }
