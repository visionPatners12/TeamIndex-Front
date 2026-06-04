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

const BaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" fill="none" viewBox="0 0 24 24">
    <path fill="#00F" d="M3 4.706c0-.585 0-.877.11-1.101.106-.215.28-.39.496-.495C3.83 3 4.122 3 4.706 3h14.588c.585 0 .876 0 1.101.11.215.105.389.28.494.495.111.225.111.517.111 1.101v14.588c0 .585 0 .876-.11 1.101-.106.215-.28.389-.495.494-.225.111-.517.111-1.101.111H4.706c-.585 0-.876 0-1.101-.11a1.08 1.08 0 0 1-.494-.495C3 20.17 3 19.878 3 19.294z" />
  </svg>
);

const DownArrow = () => (
  <div className="flex justify-center py-2">
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <line x1="12" y1="0" x2="12" y2="24" stroke="#0052FF" strokeWidth="2" strokeDasharray="4 3" />
      <path d="M6 22L12 30L18 22" stroke="#0052FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#0052FF]/35 bg-[#0052FF]/10 text-xs font-jura font-bold uppercase tracking-widest text-[#7EA2FF]"
      >
        Base USDC Entry
      </motion.span>

      <GradientHeading className="text-[28px] sm:text-4xl lg:text-5xl max-w-3xl">
        BASE ARCHITECTURE
      </GradientHeading>

      <motion.p
        {...staggerDelay(0)}
        className="font-golos text-sm sm:text-base text-white/45 max-w-2xl leading-relaxed -mt-2"
      >
        Team Index runs on Base. You enter with Base USDC and receive the
        index token that represents your share of the team pool.
      </motion.p>

      <motion.div
        {...staggerDelay(1, 0.15)}
        className="w-full max-w-3xl rounded-2xl border border-[#0052FF]/35 bg-[#050B1F]/45 backdrop-blur-sm overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(0, 82, 255, 0.14) 0%, transparent 70%), rgba(5, 11, 31, 0.45)",
        }}
      >
        <div className="px-6 pt-7 pb-4 flex flex-col items-center gap-3">
          <span className="text-[10px] font-jura font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#0052FF]/35 bg-[#0052FF]/15 text-[#7EA2FF]">
            Single chain - Base
          </span>
          <h3 className="font-jura font-bold text-lg sm:text-xl text-white">
            Base USDC to Team Index Token
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 sm:gap-6 items-center px-6 py-5">
          <div className="flex items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-5 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#0B53BF]/30 bg-[#0B53BF]/12">
              <UsdcIcon />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">USDC</p>
              <p className="font-golos text-xs text-white/45">Stablecoin on Base</p>
            </div>
          </div>

          <DownArrow />

          <div className="flex items-center justify-center gap-3 rounded-xl border border-[#0052FF]/25 bg-[#0052FF]/10 px-5 py-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-[#0052FF]/35 bg-[#0052FF]/15">
              <BaseIcon />
            </div>
            <div className="text-left">
              <p className="font-jura font-bold text-sm text-white">Team Index Token</p>
              <p className="font-golos text-xs text-white/45">Pool share token on Base</p>
            </div>
          </div>
        </div>

        <div className="w-full px-6 py-5 border-t border-white/8">
          <p className="font-golos text-xs sm:text-sm text-white/40 leading-relaxed max-w-2xl mx-auto">
            There is no extra token layer. The token the user receives is the
            Base index token for that team pool.
          </p>
        </div>
      </motion.div>
    </div>
  </section>
);
