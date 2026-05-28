import React from "react";
import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ANIMATION, staggerDelay } from "@/utils/animation";

const UsdcIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
    <path fill="#0B53BF" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" />
    <path fill="#fff" d="M13.62 5.45v1.159a5.64 5.64 0 0 1 4.005 5.394 5.64 5.64 0 0 1-4.005 5.394v1.16a6.74 6.74 0 0 0 5.13-6.554 6.74 6.74 0 0 0-5.13-6.553m-7.245 6.553a5.64 5.64 0 0 1 4.005-5.394V5.45a6.74 6.74 0 0 0-5.13 6.553 6.74 6.74 0 0 0 5.13 6.553v-1.159a5.63 5.63 0 0 1-4.005-5.394" />
    <path fill="#fff" d="M14.419 13.258c0-2.301-3.606-1.356-3.606-2.627 0-.456.366-.748 1.063-.748.833 0 1.12.405 1.21.95h1.147c-.102-1.024-.69-1.67-1.67-1.863v-.904h-1.125v.872c-1.075.137-1.75.762-1.75 1.693 0 2.312 3.611 1.445 3.611 2.694 0 .472-.455.787-1.226.787-1.007 0-1.339-.444-1.462-1.057H9.49c.073 1.122.764 1.823 1.947 1.999v.886h1.125v-.875c1.153-.149 1.856-.82 1.856-1.807" />
  </svg>
);

const PolygonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
    <path fill="url(#vaultPolygonGrad)" d="M7.415 8.912a1.13 1.13 0 0 1 1.133 0l2.589 1.546 1.758 1.005 2.594 1.546c.328.201.762.201 1.127 0l2.06-1.207c.333-.2.736-.572.736-.974V8.446c0-.402-.371-.773-.741-.974l-2.023-1.176a1.13 1.13 0 0 0-1.127 0l-2.028 1.176c-.328.2-.434.572-.434.974v1.54L11.47 8.95V7.398c0-.403-.106-.773.264-.974L15.49 4.21a1.13 1.13 0 0 1 1.127 0l3.817 2.213a1.09 1.09 0 0 1 .567.979v4.468a1.1 1.1 0 0 1-.567.974l-3.817 2.213a1.13 1.13 0 0 1-1.127 0l-2.594-1.509-1.758-1.042-2.594-1.51a1.13 1.13 0 0 0-1.128 0l-2.022 1.176c-.334.201-.805.572-.805.974v2.382c0 .403.44.773.805.974l2.022 1.207c.334.202.768.202 1.133 0l2.022-1.175c.334-.201.9-.572.9-.974v-1.54l1.589 1.037v1.546c0 .402-.36.773-.725.974l-3.828 2.208c-.328.206-.763.206-1.128 0l-3.817-2.213A1.17 1.17 0 0 1 3 16.604v-4.468c0-.403.201-.773.566-.974z" />
    <defs>
      <linearGradient id="vaultPolygonGrad" x1="3" x2="18.757" y1="4.06" y2="21.919" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8F34C2" />
        <stop offset="1" stopColor="#7442DB" />
      </linearGradient>
    </defs>
  </svg>
);

const BaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
    <path fill="#00F" d="M3 4.706c0-.585 0-.877.11-1.101.106-.215.28-.39.496-.495C3.83 3 4.122 3 4.706 3h14.588c.585 0 .876 0 1.101.11.215.105.389.28.494.495.111.225.111.517.111 1.101v14.588c0 .585 0 .876-.11 1.101-.106.215-.28.389-.495.494-.225.111-.517.111-1.101.111H4.706c-.585 0-.876 0-1.101-.11a1.08 1.08 0 0 1-.494-.495C3 20.17 3 19.878 3 19.294z" />
  </svg>
);

const DownArrow = ({ color }: { color: string }) => (
  <div className="flex justify-center py-2">
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <line x1="12" y1="0" x2="12" y2="24" stroke={color} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M6 22L12 30L18 22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

export const VaultArchitectureSection: React.FC = () => (
  <section id="deposit-paths" className="w-full py-16 sm:py-20 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div className="w-full flex flex-col items-center gap-8 text-center">
      <motion.span
        initial={{ y: ANIMATION.y, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: ANIMATION.duration, delay: 0 }}
        viewport={{ once: ANIMATION.once, amount: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3f392b] bg-[#161104]/60 text-xs font-jura font-bold uppercase tracking-widest text-[#FEB413]"
      >
        USDC Entry
      </motion.span>

      <GradientHeading className="text-[28px] sm:text-4xl lg:text-5xl max-w-3xl">
        DEPOSIT PATHS
      </GradientHeading>

      <motion.p
        {...staggerDelay(0)}
        className="font-golos text-sm sm:text-base text-white/40 max-w-2xl leading-relaxed -mt-2"
      >
        Enter with USDC on Polygon directly, or with USDC on Base through the
        receiver path. In both cases, the token you receive represents your
        share of the team pool.
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
            <h3 className="font-jura font-bold text-lg text-white">Enter with USDC</h3>
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
              Direct path — your USDC enters the vault and you receive the
              PTeam Index token for that pool.
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
              <UsdcIcon />
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
              <UsdcIcon />
              <p className="font-jura font-bold text-[10px] text-[#FEB413] uppercase tracking-wider">PTeam Index Vault</p>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-[#FEB413]/40 via-[#FEB413]/20 to-transparent" />
          </div>
        </motion.div>

        {/* ── PATH 2: BASE / USDC ── */}
        <motion.div
          {...staggerDelay(2, 0.15)}
          className="flex flex-col items-center gap-0 rounded-2xl border backdrop-blur-sm overflow-hidden"
          style={{
            borderColor: "rgba(0, 82, 255, 0.35)",
            background: "radial-gradient(ellipse at 50% 0%, rgba(0, 82, 255, 0.10) 0%, transparent 70%), rgba(22, 17, 4, 0.6)",
          }}
        >
          <div className="w-full px-6 pt-7 pb-4 flex flex-col items-center gap-3">
            <span className="text-[10px] font-jura font-bold uppercase tracking-widest px-3 py-1 rounded-full border text-[#3D76FF]" style={{ borderColor: "rgba(0,82,255,0.35)", background: "rgba(0,82,255,0.14)" }}>
              Path 2 — Base
            </span>
            <h3 className="font-jura font-bold text-lg text-white">Enter with Base USDC</h3>
          </div>

          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: "rgba(11,83,191,0.12)", borderColor: "rgba(11,83,191,0.3)" }}>
              <UsdcIcon />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">USDC</p>
              <p className="font-golos text-xs text-white/40">Stablecoin on Base</p>
            </div>
          </div>

          <DownArrow color="#0052FF" />

          <div className="flex items-center gap-3 px-6 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border" style={{ background: "rgba(0,82,255,0.12)", borderColor: "rgba(0,82,255,0.35)" }}>
              <BaseIcon />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">Wrapped PTeam Index</p>
              <p className="font-golos text-xs text-white/40">ERC20 shares on Base</p>
            </div>
          </div>

          <div className="w-full px-6 py-4 mt-2 border-t border-white/5">
            <p className="font-golos text-xs text-white/30 leading-relaxed">
              Base path — your USDC enters the Base receiver, then wrapped
              index shares are minted on Base after relayer completion.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);
