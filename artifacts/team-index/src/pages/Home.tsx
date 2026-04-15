import React, { useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";

import { DepositModal } from "@/features/pools/DepositModal";
import { Navbar } from "@/components/layout/Navbar";
import { type PoolData } from "@/types/pool";
import { type LiveIndexPool } from "@/types/pool";
import { usePools } from "@/hooks/use-pools";
import { toLiveIndexPool } from "@/utils/pool";
import { scrollToId } from "@/utils/scroll";

// ─── Section components ───────────────────────────────────────────────────────
import { HeroSection } from "@/components/sections/hero/HeroSection";
import { HeroTextBlock } from "@/components/sections/hero/HeroTextBlock";
import { IndexCard } from "@/components/sections/hero/IndexCard";
import { NewWaySection } from "@/components/sections/new-way/NewWaySection";
import { HowItWorksSection } from "@/components/sections/how-it-works/HowItWorksSection";
import { LiveIndexesSection } from "@/components/sections/live-indexes/LiveIndexesSection";
import { WhyDifferentSection } from "@/components/sections/why-different/WhyDifferentSection";
import { ExoticIndexesSection } from "@/components/sections/exotic-indexes/ExoticIndexesSection";
import { MarketplaceSection } from "@/components/sections/marketplace/MarketplaceSection";
import { WhyPolymarketSection } from "@/components/sections/why-polymarket/WhyPolymarketSection";
import { VaultArchitectureSection } from "@/components/sections/vault-architecture/VaultArchitectureSection";
import { SimpleSmartSection } from "@/components/sections/simple-smart/SimpleSmartSection";
import { FaqSection } from "@/components/sections/faq/FaqSection";
import { CtaSection } from "@/components/layout/CtaSection";
import { Footer } from "@/components/layout/Footer";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const { data: backendPools } = usePools();

  const walletAddress = wallets[0]?.address;

  const handleEnterPool = (livePool: LiveIndexPool) => {
    if (!authenticated) {
      login();
      return;
    }
    const match = backendPools?.find((p) => p.id === livePool.id);
    if (match) setSelectedPool(match);
  };

  const livePools = backendPools?.map(toLiveIndexPool);

  return (
    <div className="min-h-screen bg-[#0D0A06] selection:bg-[#FEB413]/30 selection:text-white">
      <div className="fixed top-0 inset-x-0 z-[60] bg-[#FEB413] text-[#0D0A06] text-center py-1 font-jura font-bold text-[10px] sm:text-xs uppercase tracking-widest">
        ⚠️ Mainnet Test — This is a live test environment
      </div>
      <Navbar topOffset />

      {/* 1. HERO */}
      <HeroSection>
        <HeroTextBlock />
        <div className="hidden md:block">
          <IndexCard pool={backendPools?.[0] ?? null} />
        </div>
      </HeroSection>

      {/* 2. A NEW WAY TO BACK YOUR TEAM */}
      <NewWaySection />

      {/* 3. HOW TEAM INDEX WORKS */}
      <section id="how-it-works">
        <HowItWorksSection />
      </section>

      {/* 3b. VAULT ARCHITECTURE — Two deposit paths */}
      <VaultArchitectureSection />

      {/* 4. LIVE TEAM INDEXES */}
      <section id="live-indexes">
        <LiveIndexesSection pools={livePools} onEnterPool={handleEnterPool} />
      </section>

      {/* 5. EXOTIC INDEXES (Coming Soon) */}
      <ExoticIndexesSection />

      {/* 6. MARKETPLACE (Coming Soon) */}
      <MarketplaceSection />

      {/* 7. WHY IT FEELS DIFFERENT */}
      <section id="why-different">
        <WhyDifferentSection />
      </section>

      {/* 7. WHY POLYMARKET */}
      <WhyPolymarketSection />

      {/* 8. SIMPLE ON THE SURFACE. SMART UNDERNEATH. */}
      <SimpleSmartSection />

      {/* 9. FAQ */}
      <FaqSection />

      {/* 10. CTA */}
      <CtaSection onExplore={() => scrollToId("live-indexes")} />

      {/* FOOTER */}
      <Footer />

      {/* Deposit Modal */}
      {selectedPool && (
        <DepositModal
          pool={selectedPool}
          onClose={() => setSelectedPool(null)}
          walletAddress={walletAddress}
          onConnectWallet={login}
        />
      )}
    </div>
  );
}
