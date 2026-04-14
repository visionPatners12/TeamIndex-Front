import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useLocation } from "wouter";
import { ArrowLeft, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { GoldButton } from "@/components/ui/GoldButton";
import { NAV_LINKS } from "@/constants/nav";
import { truncateAddr } from "@/utils/address";
import { scrollToId } from "@/utils/scroll";

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [, navigate] = useLocation();

  // Scroll-based background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scrollspy — track which section is currently in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    NAV_LINKS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveId(id);
        },
        { rootMargin: "-40% 0px -55% 0px" }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (id: string) => {
    scrollToId(id);
    closeMenu();
  };

  const walletAddress = wallets[0]?.address || user?.wallet?.address;
  const displayIdentity = walletAddress
    ? truncateAddr(walletAddress)
    : user?.email?.address ?? (user as any)?.google?.email ?? null;

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-[#0D0A06]/90 backdrop-blur-xl border-white/10 py-3 shadow-lg"
            : "bg-transparent border-transparent py-5"
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-30 flex items-center justify-between">
          {/* Logo */}
          <button
            className="flex items-center gap-2.5 shrink-0"
            onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); closeMenu(); }}
          >
            <img
              src={import.meta.env.BASE_URL + "images/logo_img.svg"}
              alt="Team Index"
              className="h-8 w-auto"
            />
          </button>

          {/* Desktop nav links — visible ≥1200px */}
          <div className="hidden min-[1200px]:flex items-center gap-7">
            {NAV_LINKS.map(({ label, id }) => {
              const isActive = activeId === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollToId(id)}
                  className={`relative font-jura text-[18px] font-medium transition-colors pb-0.5 ${
                    isActive ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                  {isActive && (
                    <img
                      src={import.meta.env.BASE_URL + "icons/nav_item.svg"}
                      alt=""
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full pointer-events-none select-none"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Auth — desktop only (≥1200px): identity + logout */}
            {ready && authenticated && (
              <div className="hidden min-[1200px]:flex items-center gap-3">
                <span className="font-mono text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  {displayIdentity}
                </span>
                <button
                  onClick={logout}
                  className="font-jura text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  Log Out
                </button>
              </div>
            )}

            {/* Login CTA — always visible when not authenticated */}
            {ready && !authenticated && (
              <GoldButton
                onClick={login}
                className="min-h-9 min-[1200px]:min-h-12 px-5 text-sm font-semibold"
              >
                Login
              </GoldButton>
            )}

            <button
              onClick={() => window.history.back()}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all"
              title="Back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
            </button>

            {/* Hamburger — visible below 1200px */}
            <button
              onClick={() => setMenuOpen(true)}
              className="min-[1200px]:hidden w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMenu}
            />

            {/* Drawer panel */}
            <motion.div
              key="drawer"
              className="fixed top-0 right-0 z-70 h-full w-[min(320px,85vw)] bg-[#0D0A06] border-l border-white/10 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <button
                  className="flex items-center gap-2"
                  onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); closeMenu(); }}
                >
                  <img
                    src={import.meta.env.BASE_URL + "images/logo_img.svg"}
                    alt="Team Index"
                    className="h-7 w-auto"
                  />
                </button>
                <button
                  onClick={closeMenu}
                  className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>

              {/* Nav links */}
              <div className="flex flex-col px-4 py-6 gap-1 flex-1 overflow-y-auto">
                {NAV_LINKS.map(({ label, id }, i) => {
                  const isActive = activeId === id;
                  return (
                    <motion.button
                      key={id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 + 0.1, duration: 0.22 }}
                      onClick={() => handleNavClick(id)}
                      className={`flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-xl font-jura text-sm font-medium transition-all ${
                        isActive
                          ? "bg-white/8 text-white"
                          : "text-white/60 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FEB413] shrink-0" />
                      )}
                      <span className={isActive ? "" : "ml-4"}>{label}</span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Auth footer */}
              <div className="flex flex-col gap-3 px-6 py-6 border-t border-white/10">
                {ready && (
                  <>
                    {authenticated ? (
                      <>
                        <span className="font-mono text-xs text-white/40 bg-white/5 px-3 py-2 rounded-lg border border-white/10 truncate">
                          {displayIdentity}
                        </span>
                        <button
                          onClick={() => { logout(); closeMenu(); }}
                          className="w-full py-2.5 rounded-xl border border-white/10 font-jura text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                        >
                          Log Out
                        </button>
                      </>
                    ) : (
                      <GoldButton
                        onClick={() => { login(); closeMenu(); }}
                        className="w-full min-h-12 text-sm font-semibold"
                      >
                        Login
                      </GoldButton>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
