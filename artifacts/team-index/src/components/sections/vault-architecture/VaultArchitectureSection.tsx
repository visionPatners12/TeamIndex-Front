import React from "react";
import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ANIMATION, staggerDelay } from "@/utils/animation";
import chzLogo from "@assets/CHZ_1776150749884.png";
import afcLogo from "@assets/AFC_1776150749882.png";
import barLogo from "@assets/BAR_1776150749883.png";
import acmLogo from "@assets/ACM_1776150749863.png";
import cityLogo from "@assets/CITY_1776150749884.png";

const UsdcIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
    <path fill="#0B53BF" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" />
    <path fill="#fff" d="M13.62 5.45v1.159a5.64 5.64 0 0 1 4.005 5.394 5.64 5.64 0 0 1-4.005 5.394v1.16a6.74 6.74 0 0 0 5.13-6.554 6.74 6.74 0 0 0-5.13-6.553m-7.245 6.553a5.64 5.64 0 0 1 4.005-5.394V5.45a6.74 6.74 0 0 0-5.13 6.553 6.74 6.74 0 0 0 5.13 6.553v-1.159a5.63 5.63 0 0 1-4.005-5.394" />
    <path fill="#fff" d="M14.419 13.258c0-2.301-3.606-1.356-3.606-2.627 0-.456.366-.748 1.063-.748.833 0 1.12.405 1.21.95h1.147c-.102-1.024-.69-1.67-1.67-1.863v-.904h-1.125v.872c-1.075.137-1.75.762-1.75 1.693 0 2.312 3.611 1.445 3.611 2.694 0 .472-.455.787-1.226.787-1.007 0-1.339-.444-1.462-1.057H9.49c.073 1.122.764 1.823 1.947 1.999v.886h1.125v-.875c1.153-.149 1.856-.82 1.856-1.807" />
  </svg>
);

const PolygonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
    <path fill="url(#vault_polygon_grad)" d="m16.364 15.217 4.27-2.435a.73.73 0 0 0 .366-.627V7.284a.72.72 0 0 0-.366-.627l-4.27-2.435a.74.74 0 0 0-.732 0l-4.27 2.435a.72.72 0 0 0-.366.627v8.704l-2.994 1.707-2.994-1.707v-3.415l2.994-1.707 1.974 1.127V9.702l-1.608-.918a.75.75 0 0 0-.732 0l-4.27 2.435a.72.72 0 0 0-.366.627v4.87c0 .258.14.498.366.627l4.27 2.436a.75.75 0 0 0 .732 0l4.27-2.436a.72.72 0 0 0 .366-.626V8.012l.053-.03 2.94-1.677 2.994 1.707v3.415l-2.994 1.707-1.972-1.124v2.291l1.606.916a.75.75 0 0 0 .732 0z" />
    <defs>
      <linearGradient id="vault_polygon_grad" x1="2.942" x2="20.119" y1="17.194" y2="7.101" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A726C1" />
        <stop offset=".88" stopColor="#803BDF" />
        <stop offset="1" stopColor="#7B3FE4" />
      </linearGradient>
    </defs>
  </svg>
);

const FAN_TOKENS = [
  { src: afcLogo, alt: "$AFC" },
  { src: barLogo, alt: "$BAR" },
  { src: acmLogo, alt: "$ACM" },
  { src: cityLogo, alt: "$CITY" },
];

const DownArrow = ({ color }: { color: string }) => (
  <div className="flex justify-center py-2">
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <line x1="12" y1="0" x2="12" y2="24" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M6 22L12 30L18 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const VaultArchitectureSection: React.FC = () => (
  <section className="w-full py-20 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div className="w-full flex flex-col items-center gap-8 text-center">
      <motion.span
        initial={{ y: ANIMATION.y, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: ANIMATION.duration, delay: 0 }}
        viewport={{ once: ANIMATION.once, amount: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3f392b] bg-[#161104]/60 text-xs font-jura font-bold uppercase tracking-widest text-[#FEB413]"
      >
        🔒 Two Ways In
      </motion.span>

      <GradientHeading className="text-[28px] sm:text-4xl lg:text-5xl max-w-3xl">
        CHOOSE YOUR PATH INTO THE INDEX
      </GradientHeading>

      <motion.p
        {...staggerDelay(0)}
        className="font-golos text-sm sm:text-base text-white/40 max-w-2xl leading-relaxed -mt-2"
      >
        Deposit in USDC on Polygon or use CHZ & Fan Tokens on Chiliz — each path gives you exposure to the same team index.
      </motion.p>

      <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-0 mt-4 items-stretch">

        {/* ── PATH 1: POLYGON / USDC ── */}
        <motion.div
          {...staggerDelay(1, 0.15)}
          className="flex flex-col items-center gap-0 rounded-2xl border backdrop-blur-sm overflow-hidden"
          style={{
            borderColor: "rgba(130, 71, 229, 0.3)",
            background: "radial-gradient(ellipse at 50% 0%, rgba(130, 71, 229, 0.08) 0%, transparent 70%), rgba(22, 17, 4, 0.6)",
          }}
        >
          <div className="w-full px-6 pt-7 pb-4 flex flex-col items-center gap-3">
            <span className="text-[10px] font-jura font-bold uppercase tracking-widest px-3 py-1 rounded-full border text-[#8247E5]" style={{ borderColor: "rgba(130,71,229,0.3)", background: "rgba(130,71,229,0.12)" }}>
              Path 1 — Polygon
            </span>
            <h3 className="font-jura font-bold text-lg text-white">Pay in USDC</h3>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: "rgba(11,83,191,0.12)", borderColor: "rgba(11,83,191,0.3)" }}>
              <UsdcIcon />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">USDC</p>
              <p className="font-golos text-xs text-white/40">Stablecoin on Polygon</p>
            </div>
          </div>

          <DownArrow color="#8247E5" />

          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: "rgba(130,71,229,0.12)", borderColor: "rgba(130,71,229,0.3)" }}>
              <PolygonIcon />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">PTeam Index Token</p>
              <p className="font-golos text-xs text-white/40">Core token on Polygon</p>
            </div>
          </div>

          <div className="w-full px-6 py-4 mt-2 border-t border-white/5">
            <p className="font-golos text-xs text-white/30 leading-relaxed">
              Direct deposit — your USDC enters the vault and you receive the native PTeam Index token on Polygon. Fast, cheap, instant.
            </p>
          </div>
        </motion.div>

        {/* ── CENTER: SHARED VAULT NODE ── */}
        <motion.div
          {...staggerDelay(1.5, 0.15)}
          className="hidden lg:flex flex-col items-center justify-center self-center gap-3 px-3"
        >
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-[#FEB413]/30 to-[#FEB413]/50" />
          <div className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl border border-[#FEB413]/30 bg-[#161104]/80 backdrop-blur-sm" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(254,180,19,0.08) 0%, rgba(22,17,4,0.8) 70%)" }}>
            <div className="w-14 h-14 rounded-xl flex items-center justify-center border border-[#FEB413]/30 bg-[#FEB413]/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="7" width="18" height="13" rx="2" stroke="#FEB413" strokeWidth="1.5" />
                <path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="#FEB413" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="14" r="2" fill="#FEB413" />
              </svg>
            </div>
            <p className="font-jura font-bold text-xs text-[#FEB413] uppercase tracking-wider">PTeam Index</p>
            <p className="font-jura font-bold text-[10px] text-white/30 uppercase tracking-wider">Vault</p>
          </div>
          <div className="w-px h-10 bg-gradient-to-b from-[#FEB413]/50 via-[#FEB413]/30 to-transparent" />
        </motion.div>

        <motion.div
          {...staggerDelay(1.5, 0.15)}
          className="flex lg:hidden flex-col items-center gap-2 py-3"
        >
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#FEB413]/20 to-[#FEB413]/40" />
            <div className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-[#FEB413]/30 bg-[#161104]/80">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="7" width="18" height="13" rx="2" stroke="#FEB413" strokeWidth="1.5" />
                <path d="M7 7V5a5 5 0 0 1 10 0v2" stroke="#FEB413" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="14" r="2" fill="#FEB413" />
              </svg>
              <p className="font-jura font-bold text-[10px] text-[#FEB413] uppercase tracking-wider">PTeam Index Vault</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[#FEB413]/40 via-[#FEB413]/20 to-transparent" />
          </div>
        </motion.div>

        {/* ── PATH 2: CHILIZ / FAN TOKENS ── */}
        <motion.div
          {...staggerDelay(2, 0.15)}
          className="flex flex-col items-center gap-0 rounded-2xl border backdrop-blur-sm overflow-hidden"
          style={{
            borderColor: "rgba(205, 1, 36, 0.3)",
            background: "radial-gradient(ellipse at 50% 0%, rgba(205, 1, 36, 0.08) 0%, transparent 70%), rgba(22, 17, 4, 0.6)",
          }}
        >
          <div className="w-full px-6 pt-7 pb-4 flex flex-col items-center gap-3">
            <span className="text-[10px] font-jura font-bold uppercase tracking-widest px-3 py-1 rounded-full border text-[#CD0124]" style={{ borderColor: "rgba(205,1,36,0.3)", background: "rgba(205,1,36,0.12)" }}>
              Path 2 — Chiliz Chain
            </span>
            <h3 className="font-jura font-bold text-lg text-white">Pay in CHZ or Fan Tokens</h3>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: "rgba(205,1,36,0.12)", borderColor: "rgba(205,1,36,0.3)" }}>
              <img src={chzLogo} alt="CHZ" className="w-9 h-9 rounded-full" />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">CHZ + Fan Tokens</p>
              <p className="font-golos text-xs text-white/40">When the index is linked to the team</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 px-6">
            {FAN_TOKENS.map((t) => (
              <img key={t.alt} src={t.src} alt={t.alt} className="w-7 h-7 rounded-full ring-1 ring-white/10" />
            ))}
            <span className="font-golos text-[10px] text-white/30 ml-1">+ more</span>
          </div>

          <DownArrow color="#CD0124" />

          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: "rgba(205,1,36,0.12)", borderColor: "rgba(205,1,36,0.3)" }}>
              <img src={chzLogo} alt="Wrapped" className="w-9 h-9 rounded-full opacity-70" />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">Wrapped PTeam Index</p>
              <p className="font-golos text-xs text-white/40">On Chiliz Chain via bridge</p>
            </div>
          </div>

          <div className="w-full px-6 py-4 mt-2 border-t border-white/5">
            <p className="font-golos text-xs text-white/30 leading-relaxed">
              Cross-chain deposit — your CHZ or Fan Tokens are bridged, and you receive a wrapped PTeam Index token on Chiliz Chain.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);
