import React, { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useLocation } from "wouter";
import { ArrowLeft, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import { GoldButton } from "@/components/ui/GoldButton";
import { NAV_LINKS } from "@/constants/nav";
import { truncateAddr } from "@/utils/address";
import { scrollToId } from "@/utils/scroll";

export const Navbar: React.FC<{ topOffset?: boolean }> = ({ topOffset = false }) => {
  const { t, i18n } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [, navigate] = useLocation();

  const toggleLang = () => {
    i18n.changeLanguage(i18n.language?.startsWith('fr') ? 'en' : 'fr');
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const isFr = i18n.language?.startsWith('fr');

  return (
    <>
      <nav
        className={`fixed inset-x-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-[#0D0A06]/90 backdrop-blur-xl border-white/10 py-2.5 shadow-lg"
            : "bg-transparent border-transparent py-4"
        }`}
        style={{ top: topOffset ? '28px' : '0' }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-30 flex items-center justify-between">
          <div className="flex items-center gap-2.5 shrink-0">
            <a
              href="https://pryzen.io"
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all"
              title={t('nav.backToPryzen')}
              aria-label={t('nav.backToPryzen')}
            >
              <ArrowLeft className="w-4 h-4 text-white/50 hover:text-white transition-colors" />
            </a>
            <button
              className="flex items-center gap-2"
              onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); closeMenu(); }}
            >
              <img
                src={import.meta.env.BASE_URL + "images/pryzen_logo.png"}
                alt="Pryzen"
                className="h-7 w-7 shrink-0"
              />
              <div className="flex flex-col items-start leading-none">
                <span className="font-jura font-bold text-white text-sm tracking-wide">Pryzen</span>
                <div className="flex items-center gap-1">
                  <span className="font-jura text-[10px] text-white/40 tracking-wide">Team Index</span>
                  <span className="px-1 py-[1px] rounded text-[7px] font-jura font-bold uppercase tracking-wider bg-[#FEB413]/20 text-[#FEB413] border border-[#FEB413]/30 leading-none">Beta</span>
                </div>
              </div>
            </button>
          </div>

          <div className="hidden min-[1200px]:flex items-center gap-7">
            {NAV_LINKS.map(({ labelKey, id }) => {
              const isActive = activeId === id;
              return (
                <button
                  key={id}
                  onClick={() => scrollToId(id)}
                  className={`relative font-jura text-[18px] font-medium transition-colors pb-0.5 ${
                    isActive ? "text-white" : "text-white/60 hover:text-white"
                  }`}
                >
                  {t(labelKey)}
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

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-jura font-bold text-white/60 hover:text-white transition-all uppercase tracking-wider"
            >
              {isFr ? 'EN' : 'FR'}
            </button>

            {ready && authenticated && (
              <div className="hidden min-[1200px]:flex items-center gap-3">
                <span className="font-mono text-sm text-white/50 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  {displayIdentity}
                </span>
                <button
                  onClick={logout}
                  className="font-jura text-sm font-medium text-white/70 hover:text-white transition-colors"
                >
                  {t('nav.logOut')}
                </button>
              </div>
            )}

            {ready && !authenticated && (
              <GoldButton
                onClick={login}
                className="min-h-9 min-[1200px]:min-h-12 px-5 text-sm font-semibold"
              >
                {t('nav.login')}
              </GoldButton>
            )}

            <button
              onClick={() => setMenuOpen(true)}
              className="min-[1200px]:hidden w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all"
              aria-label={t('nav.openMenu')}
            >
              <Menu className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={closeMenu}
            />

            <motion.div
              key="drawer"
              className="fixed top-0 right-0 z-70 h-full w-[min(320px,85vw)] bg-[#0D0A06] border-l border-white/10 flex flex-col"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleLang}
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-jura font-bold text-white/60 hover:text-white transition-all uppercase tracking-wider"
                  >
                    {isFr ? 'EN' : 'FR'}
                  </button>
                  <button
                    onClick={closeMenu}
                    className="w-9 h-9 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-all"
                    aria-label={t('nav.closeMenu')}
                  >
                    <X className="w-5 h-5 text-white/70" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col px-4 py-6 gap-1 flex-1 overflow-y-auto">
                {NAV_LINKS.map(({ labelKey, id }, i) => {
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
                      <span className={isActive ? "" : "ml-4"}>{t(labelKey)}</span>
                    </motion.button>
                  );
                })}
              </div>

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
                          {t('nav.logOut')}
                        </button>
                      </>
                    ) : (
                      <GoldButton
                        onClick={() => { login(); closeMenu(); }}
                        className="w-full min-h-12 text-sm font-semibold"
                      >
                        {t('nav.login')}
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
