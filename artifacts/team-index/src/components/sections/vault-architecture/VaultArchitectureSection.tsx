import React from "react";
import { motion } from "framer-motion";
import { GradientHeading } from "@/components/ui/GradientHeading";
import { ANIMATION, staggerDelay } from "@/utils/animation";

const UsdcIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24">
    <path fill="#0B53BF" d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18" />
    <path fill="#fff" d="M13.62 5.45v1.159a5.64 5.64 0 0 1 4.005 5.394 5.64 5.64 0 0 1-4.005 5.394v1.16a6.74 6.74 0 0 0 5.13-6.554 6.74 6.74 0 0 0-5.13-6.553m-7.245 6.553a5.64 5.64 0 0 1 4.005-5.394V5.45a6.74 6.74 0 0 0-5.13 6.553 6.74 6.74 0 0 0 5.13 6.553v-1.159a5.63 5.63 0 0 1-4.005-5.394" />
    <path fill="#fff" d="M14.419 13.258c0-2.301-3.606-1.356-3.606-2.627 0-.456.366-.748 1.063-.748.833 0 1.12.405 1.21.95h1.147c-.102-1.024-.69-1.67-1.67-1.863v-.904h-1.125v.872c-1.075.137-1.75.762-1.75 1.693 0 2.312 3.611 1.445 3.611 2.694 0 .472-.455.787-1.226.787-1.007 0-1.339-.444-1.462-1.057H9.49c.073 1.122.764 1.823 1.947 1.999v.886h1.125v-.875c1.153-.149 1.856-.82 1.856-1.807" />
  </svg>
);

const PolygonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24">
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

const ChilizIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" fill="#CD0124" />
    <path fill="#fff" d="M14.5 7.5c-.4-.6-1.2-.9-1.8-.5-.3.2-.5.5-.5.9 0 .5.3 1 .7 1.3.8.6 1.5 1.4 1.8 2.4.4 1.2.2 2.5-.5 3.5-.5.7-1.2 1.2-2 1.5-.6.2-1.2.3-1.8.2-.4 0-.7-.2-.9-.5-.2-.3-.1-.7.2-.9.2-.1.4-.1.6 0 .3.1.7.1 1-.1.5-.2.9-.5 1.2-.9.5-.7.6-1.6.3-2.4-.2-.5-.5-1-1-1.4-.6-.5-1-1.2-1-2 0-.9.5-1.7 1.2-2.1 1.1-.7 2.5-.4 3.2.7.1.2.2.4.3.7z" />
  </svg>
);

const ArrowConnector = () => {
  const id = React.useId();
  const gradId = `arrow_grad_${id}`;
  return (
    <div className="hidden lg:flex items-center justify-center">
      <svg width="60" height="24" viewBox="0 0 60 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="12" x2="50" y2="12" stroke={`url(#${gradId})`} strokeWidth="2" strokeDasharray="4 4" />
        <path d="M48 7L56 12L48 17" stroke="#FEB413" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <defs>
          <linearGradient id={gradId} x1="0" y1="12" x2="56" y2="12" gradientUnits="userSpaceOnUse">
            <stop stopColor="rgba(255,255,255,0.15)" />
            <stop offset="1" stopColor="#FEB413" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const CARDS = [
  {
    icon: <UsdcIcon />,
    title: "USDC Stablecoin Vaults",
    description: "Every vault is backed by USDC — a fully regulated, dollar-pegged stablecoin. Your capital stays stable while the index works for you.",
    color: "#0B53BF",
    colorLight: "rgba(11, 83, 191, 0.12)",
    colorBorder: "rgba(11, 83, 191, 0.3)",
    tag: "Vault Collateral",
  },
  {
    icon: <PolygonIcon />,
    title: "PTeam Index on Polygon",
    description: "Your core PTeam Index tokens live on Polygon — fast, cheap transactions with direct access to Polymarket positions.",
    color: "#8247E5",
    colorLight: "rgba(130, 71, 229, 0.12)",
    colorBorder: "rgba(130, 71, 229, 0.3)",
    tag: "Core Token",
  },
  {
    icon: <ChilizIcon />,
    title: "Wrapped on Chiliz",
    description: "A wrapped version of PTeam Index tokens is available on Chiliz Chain — bridging sports DeFi to the fan token ecosystem.",
    color: "#CD0124",
    colorLight: "rgba(205, 1, 36, 0.12)",
    colorBorder: "rgba(205, 1, 36, 0.3)",
    tag: "Wrapped Token",
  },
];

export const VaultArchitectureSection: React.FC = () => (
  <section className="w-full py-24 px-4 sm:px-10 lg:px-30 bg-[#0D0A06]">
    <div className="w-full flex flex-col items-center gap-10 text-center">
      <motion.span
        initial={{ y: ANIMATION.y, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: ANIMATION.duration, delay: 0 }}
        viewport={{ once: ANIMATION.once, amount: 0.2 }}
        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#3f392b] bg-[#161104]/60 text-xs font-jura font-bold uppercase tracking-widest text-[#FEB413]"
      >
        🔒 Multi-Chain Architecture
      </motion.span>

      <GradientHeading className="text-[32px] sm:text-5xl lg:text-6xl max-w-4xl">
        SECURED BY STABLECOINS. POWERED BY POLYGON.
      </GradientHeading>

      <motion.p
        {...staggerDelay(0)}
        className="font-golos text-sm sm:text-base text-white/40 max-w-2xl leading-relaxed -mt-4"
      >
        PTeam Index vaults hold USDC on Polygon for stability. Your tokens exist natively on Polygon, with a wrapped version available on Chiliz Chain.
      </motion.p>

      <div className="w-full flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-0 mt-4">
        {CARDS.map((card, i) => (
          <React.Fragment key={card.title}>
            {i > 0 && <ArrowConnector />}
            <motion.div
              {...staggerDelay(i + 1, 0.15)}
              className="flex-1 flex flex-col items-center gap-4 px-6 py-8 rounded-2xl border backdrop-blur-sm"
              style={{
                borderColor: card.colorBorder,
                background: `radial-gradient(ellipse at 50% 0%, ${card.colorLight} 0%, transparent 70%), rgba(22, 17, 4, 0.6)`,
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center border"
                style={{ background: card.colorLight, borderColor: card.colorBorder }}
              >
                {card.icon}
              </div>

              <span
                className="text-[10px] font-jura font-bold uppercase tracking-widest px-3 py-1 rounded-full border"
                style={{ color: card.color, borderColor: card.colorBorder, background: card.colorLight }}
              >
                {card.tag}
              </span>

              <h3 className="font-jura font-bold text-lg text-white">{card.title}</h3>

              <p className="font-golos text-sm text-white/40 leading-relaxed max-w-xs">
                {card.description}
              </p>
            </motion.div>
          </React.Fragment>
        ))}
      </div>

      <motion.div
        {...staggerDelay(4, 0.15)}
        className="flex flex-col sm:flex-row items-center gap-3 mt-2 px-6 py-4 rounded-xl border border-[#3f392b] bg-[#161104]/60"
      >
        <span className="text-white/20 text-lg">💡</span>
        <p className="font-golos text-xs sm:text-sm text-white/30 leading-relaxed text-center sm:text-left">
          Deposits in USDC on Polygon are direct. Deposits in CHZ on Chiliz go through a cross-chain bridge to mint wrapped PTeam Index tokens.
        </p>
      </motion.div>
    </div>
  </section>
);
