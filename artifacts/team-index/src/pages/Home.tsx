import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useLocation } from 'wouter';
import { 
  ChevronDown, 
  ArrowRight, 
  Coins, 
  Activity, 
  Trophy, 
  Wallet, 
  LineChart, 
  ShieldCheck, 
  Layers,
  Zap,
  Globe,
  TrendingUp,
  TrendingDown,
  Lock,
  Users,
  BarChart2,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Settings
} from 'lucide-react';
import { PoolCard, type PoolData } from '@/components/PoolCard';
import { DepositModal } from '@/components/DepositModal';
import { usePools } from '@/hooks/use-pools';

const FALLBACK_POOLS: PoolData[] = [
  {
    id: "arsenal",
    team: "Arsenal",
    symbol: "pAFC",
    status: "Open",
    poolSize: 142500,
    poolCap: 200000,
    tokenValue: 1.24,
    change24h: 3.2,
    holders: 847,
    sparklineData: [1.1, 1.15, 1.12, 1.18, 1.20, 1.22, 1.24]
  },
  {
    id: "mancity",
    team: "Manchester City",
    symbol: "pCITY",
    status: "Closing Soon",
    poolSize: 187200,
    poolCap: 200000,
    tokenValue: 2.18,
    change24h: 1.8,
    holders: 1203,
    sparklineData: [2.05, 2.10, 2.08, 2.15, 2.14, 2.16, 2.18]
  },
  {
    id: "okc",
    team: "OKC Thunder",
    symbol: "pOKC",
    status: "Open",
    poolSize: 89400,
    poolCap: 150000,
    tokenValue: 0.87,
    change24h: -0.5,
    holders: 634,
    sparklineData: [0.90, 0.92, 0.89, 0.88, 0.86, 0.88, 0.87]
  },
  {
    id: "spurs",
    team: "San Antonio Spurs",
    symbol: "pSAS",
    status: "Closed",
    poolSize: 150000,
    poolCap: 150000,
    tokenValue: 1.45,
    change24h: 0.0,
    holders: 892,
    sparklineData: [1.40, 1.42, 1.45, 1.44, 1.46, 1.45, 1.45]
  }
];

const FAQS = [
  {
    q: "What is a Pryzen Team Index?",
    a: "Pryzen Team Index is a new way to back your favorite team through a live team-based token. Instead of placing a one-off bet, users enter a pool whose underlying funds are deployed on Polymarket through the index strategy."
  },
  {
    q: "Where are the funds deployed?",
    a: "Underlying funds are strategically deployed across relevant sports markets on Polymarket, creating a diversified exposure based on team performance rather than a single event outcome."
  },
  {
    q: "How can I enter?",
    a: "You can enter open pools using USDC on the Polygon network, or with CHZ and supported fan tokens through our wrapped access gateway."
  },
  {
    q: "What do I receive?",
    a: "Upon entering a pool, you receive a specific Pryzen Team Index token representing your share of that pool. This token's value fluctuates based on the underlying strategy performance."
  },
  {
    q: "Can I still join a live pool?",
    a: "Pools are available only during their live entry window. Once a pool reaches its cap or closes, new entries are paused until the next phase."
  },
  {
    q: "Is the token publicly listed?",
    a: "Currently in Mainnet Pilot, tokens are not yet publicly listed on secondary exchanges. 'Listing Soon' indicates planned future liquidity options."
  },
  {
    q: "Do holders receive gains when the team wins?",
    a: "Yes, in case of team victories and successful underlying market resolutions, gains are distributed to eligible token holders proportionally to their stake."
  }
];

// --- COMPONENTS ---

function truncateAddr(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

const Nav = () => {
  const [scrolled, setScrolled] = useState(false);
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { wallets: navWallets } = useWallets();
  const [, navigate] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const walletAddress = navWallets[0]?.address || user?.wallet?.address;
  const displayIdentity = walletAddress
    ? truncateAddr(walletAddress)
    : user?.email?.address ?? (user as any)?.google?.email ?? null;

  const handleEnterApp = () => {
    if (!ready) return;
    if (authenticated) {
      scrollTo('live-pools');
    } else {
      login();
    }
  };

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
      scrolled ? 'bg-background/80 backdrop-blur-xl border-white/10 py-3 shadow-lg' : 'bg-transparent border-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight text-white">Pryzen Team Index</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-8">
          {['What is It', 'Live Pools', 'Pricing', 'FAQ'].map((item) => (
            <button 
              key={item} 
              onClick={() => scrollTo(item.toLowerCase().replace(' ', '-'))}
              className="text-sm font-medium text-muted-foreground hover:text-white transition-colors"
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {ready && (
            authenticated ? (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-sm font-mono text-muted-foreground bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                  {displayIdentity}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-white hover:text-primary transition-colors"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="hidden sm:block text-sm font-medium text-white hover:text-primary transition-colors"
              >
                Log In
              </button>
            )
          )}
          <button
            onClick={handleEnterApp}
            className="px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10 transition-all"
          >
            Enter App
          </button>
          <button
            onClick={() => navigate('/admin')}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/15 flex items-center justify-center border border-white/10 transition-all"
            title="Admin Panel"
          >
            <Settings className="w-4 h-4 text-muted-foreground hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function Home() {
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);
  const { authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { data: backendPools, isLoading: poolsLoading, isError: poolsError } = usePools();

  const pools = backendPools && backendPools.length > 0 ? backendPools : FALLBACK_POOLS;
  const walletAddress = wallets[0]?.address;

  const handleEnterPool = (pool: PoolData) => {
    if (!authenticated) {
      login();
      return;
    }
    setSelectedPool(pool);
  };

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30 selection:text-white">
      <Nav />

      {/* 1. HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background glow generated image */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] opacity-40 pointer-events-none -translate-y-1/4 translate-x-1/4">
           <img 
             src={`${import.meta.env.BASE_URL}images/hero-glow.png`} 
             alt="Glow background" 
             className="w-full h-full object-cover mix-blend-screen"
           />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
                  Mainnet Pilot
                </span>
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white text-xs font-medium">
                  4 Teams Live
                </span>
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-display leading-[1.1] mb-6">
                Back your team <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-300">
                  beyond a single match.
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Pryzen Team Index is a new way to back your favorite team through a live team-based token. 
                Instead of placing a one-off bet, enter a pool whose underlying funds are deployed 
                on Polymarket through index strategies.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button 
                  onClick={() => document.getElementById('live-pools')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:bg-primary/90 hover:shadow-[0_0_30px_-5px_hsl(var(--primary))] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  Explore Live Indexes <ArrowRight className="w-5 h-5" />
                </button>
                <button className="px-8 py-4 rounded-xl bg-white/5 text-white font-bold text-lg border border-white/10 hover:bg-white/10 transition-all duration-300">
                  Join the Pilot
                </button>
              </div>

              <div className="flex items-center gap-6 text-sm text-muted-foreground font-medium">
                <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-primary"/> Polygon Issuance</div>
                <div className="flex items-center gap-2"><Coins className="w-4 h-4 text-primary"/> CHZ + Fan Tokens</div>
              </div>
            </motion.div>

            {/* Hero Mockup Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.2, type: "spring" }}
              className="relative perspective-1000 hidden lg:block"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-[3rem] -z-10" />
              
              <div className="bg-glass-card border border-white/10 rounded-3xl p-8 premium-shadow transform rotate-y-[-5deg] rotate-x-[5deg] transition-transform duration-500 hover:rotate-y-0 hover:rotate-x-0 cursor-default">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-3xl font-bold font-display text-red-400">
                      A
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold font-display text-white">Arsenal Index</h3>
                      <p className="text-muted-foreground text-sm">pAFC · Arsenal F.C.</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-bold uppercase border border-green-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                  </span>
                </div>

                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-2">Current Token Value</p>
                  <div className="flex items-baseline gap-3">
                    <h2 className="text-5xl font-mono font-bold text-white">$1.24</h2>
                    <span className="text-green-400 font-semibold flex items-center text-lg">
                      <TrendingUp className="w-5 h-5 mr-1" /> +3.2%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Current Holders</p>
                    <p className="text-xl font-bold text-white">847</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <p className="text-sm font-bold text-accent bg-accent/10 w-fit px-2 py-1 rounded border border-accent/20 mt-1">Listing Soon</p>
                  </div>
                </div>

                {authenticated && walletAddress && (
                  <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 w-fit">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs font-semibold text-green-400">Connected</span>
                    <span className="text-xs font-mono text-green-300/70">{truncateAddr(walletAddress)}</span>
                  </div>
                )}

                <button className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors">
                  Enter Pool
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. WHAT IS IT */}
      <section id="what-is-it" className="py-24 bg-black/40 relative border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-6">A new way to back a team over time</h2>
            <p className="text-lg text-muted-foreground">
              We're shifting the paradigm from single-match betting to continuous team exposure. 
              Hold an index token that captures the team's ongoing performance across multiple markets.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Activity, title: "Beyond one match", desc: "Your exposure isn't limited to 90 minutes. The token reflects aggregate team performance over the season." },
              { icon: LineChart, title: "Live market strategy", desc: "Underlying funds are algorithmically deployed into deep liquidity prediction markets like Polymarket." },
              { icon: Trophy, title: "Victory-based gains", desc: "When the team succeeds and underlying markets resolve positively, gains flow back to token holders." }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 2b. WHY POLYMARKET */}
      <section className="py-16 relative bg-black/20 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Why Polymarket?</p>
            <h2 className="text-2xl sm:text-3xl font-bold font-display mb-10 text-white">
              The world's largest prediction market — and the infrastructure behind every Pryzen Team Index.
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
              {[
                { value: ">94%", label: "Accuracy 1 month out" },
                { value: ">96%", label: "Accuracy 4 hours out" },
                { value: "$102M+", label: "Total volume traded" },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white/5 border border-white/10 rounded-2xl px-6 py-5"
                >
                  <p className="text-3xl font-bold text-primary mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-white/60 mb-3">
              Polymarket odds are right over 94% of the time — a month before the event even happens.
            </p>
            <a
              href="https://polymarket.com/fr/accuracy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            >
              View accuracy data →
            </a>
          </motion.div>
        </div>
      </section>

      {/* 3. HOW IT WORKS */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">How it works</h2>
            <p className="text-muted-foreground">Four simple steps to get exposure to your favorite team.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              "Choose a live team pool",
              "Enter with preferred asset",
              "Receive your Team Index token",
              "Follow the index live"
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-2xl bg-secondary border border-white/5"
              >
                <div className="text-5xl font-display font-extrabold text-white/5 absolute -top-4 -right-2 pointer-events-none">
                  0{i+1}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-4">
                  {i+1}
                </div>
                <h3 className="text-lg font-bold text-white relative z-10">{step}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. LIVE POOLS (KEY SECTION) */}
      <section id="live-pools" className="py-24 bg-black/40 border-y border-white/5 relative overflow-hidden">
        {/* Decorative background circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-4">Live Pryzen Team Indexes</h2>
              <p className="text-muted-foreground max-w-xl">
                Pools are available only during their live entry window. Once a pool reaches its cap or closes, new entries are paused until the next phase.
              </p>
            </div>
            <button className="text-primary hover:text-white font-medium flex items-center gap-2 transition-colors">
              View All History <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {poolsLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Loading live pools…</span>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
              {pools.map((pool, i) => (
                <PoolCard key={pool.id} pool={pool} index={i} onEnter={handleEnterPool} />
              ))}
            </div>
          )}
          {poolsError && !poolsLoading && (
            <p className="text-center text-xs text-amber-400/70 mt-4">Showing demo data — backend is unreachable.</p>
          )}
        </div>
      </section>

      {/* 5. PRICING & VALUE */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold font-display mb-6">What drives the value of a Pryzen Team Index</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Each Team Index runs an active strategy on Polymarket, automatically taking positions on upcoming matches and competition outcomes on behalf of the pool. The combined value of all open positions forms the Index Value that backs each token.
              </p>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Live position examples — Arsenal</p>
                {[
                  "Arsenal to win vs. Chelsea (Premier League)",
                  "Arsenal to advance to the Champions League semi-finals",
                  "Arsenal top-4 finish this season",
                ].map((ex, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm text-white/80">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                      <svg className="w-2.5 h-2.5 text-primary" fill="none" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                    {ex}
                  </div>
                ))}
              </div>
              
              <div className="bg-glass-card border border-primary/20 p-6 rounded-2xl mb-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <h4 className="text-sm text-primary font-bold uppercase tracking-wider mb-2">The Formula</h4>
                <p className="text-xl font-mono font-medium text-white mb-3">
                  Token Value = Index Value / Circulating Supply
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A Team Index token represents your share of a team-based pool. Its value is derived from the live value of the underlying index — a basket of active Polymarket positions taken on behalf of the team.
                </p>
              </div>
            </motion.div>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "Index Value", value: "$104,350", desc: "Total value of deployed positions" },
                { label: "Circulating Supply", value: "84,150", desc: "Total tokens minted in pool" },
                { label: "Current Token Value", value: "$1.24", desc: "Calculated real-time price", highlight: true },
                { label: "Listing Status", value: "Coming Soon", desc: "Secondary market trading" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-6 rounded-2xl border",
                    stat.highlight ? "bg-primary/10 border-primary/30" : "bg-white/5 border-white/10"
                  )}
                >
                  <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                  <p className={cn("text-2xl font-bold mb-1 font-mono", stat.highlight ? "text-primary" : "text-white")}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. ENTRY OPTIONS & GAINS (Combined Grid) */}
      <section className="py-24 bg-black/40 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* Entry Options */}
            <div>
              <h2 className="text-2xl font-bold font-display mb-8 flex items-center gap-3">
                <Wallet className="w-6 h-6 text-primary" /> Entry Options
              </h2>
              <div className="space-y-4">
                {[
                  { title: "USDC on Polygon", desc: "Direct stablecoin entry for instant minting with zero slippage." },
                  { title: "CHZ Access", desc: "Use your Chiliz tokens through our specialized wrapped gateway." },
                  { title: "Supported Fan Tokens", desc: "Convert existing static fan tokens into active index exposure." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gains Distribution */}
            <div>
              <h2 className="text-2xl font-bold font-display mb-8 flex items-center gap-3">
                <Zap className="w-6 h-6 text-primary" /> Gains Distribution
              </h2>
              <div className="space-y-4">
                {[
                  { title: "Team Victory Payouts", desc: "When the team wins and prediction markets resolve, value accrues to the index." },
                  { title: "Holder Qualification", desc: "You must hold the token during the resolution snapshot to be eligible for gains." },
                  { title: "More Than Price Exposure", desc: "It's not just holding a token hoping number goes up—it's yield generated from underlying market wins." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. DASHBOARD PREVIEW */}
      <section className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold font-display mb-6">Win the Pryze</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
              Every Team Index pool has a closing date. Participants who hold tokens <span className="text-white font-semibold">before the pool closes</span> are eligible for the Pryze — a performance-based reward distributed when the index settles. The earlier you enter, the higher your potential allocation.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
              {[
                { icon: "🟢", label: "Enter pool before close", color: "" },
                { icon: "→", label: "", color: "text-white/20", arrow: true },
                { icon: "🏆", label: "Index settles", color: "" },
                { icon: "→", label: "", color: "text-white/20", arrow: true },
                { icon: "✨", label: "Pryze distributed", color: "" },
              ].map((item, i) =>
                item.arrow ? (
                  <span key={i} className="text-white/20 text-xl select-none">→</span>
                ) : (
                  <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <span className={`text-sm ${item.color}`}>{item.icon}</span>
                    <span className="text-sm font-medium text-white/80">{item.label}</span>
                  </div>
                )
              )}
            </div>

          </motion.div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="faq" className="py-24 bg-black/40 border-y border-white/5">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold font-display mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* 9. FINAL CTA */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-4xl sm:text-5xl font-bold font-display mb-6">Join a live Pryzen Team Index pool</h2>
            <p className="text-xl text-muted-foreground mb-10">
              The Mainnet Pilot is live. Entry is capped per pool. Don't miss the window.
            </p>
            <button 
              onClick={() => document.getElementById('live-pools')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 rounded-xl bg-white text-background font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-[0_0_40px_-10px_rgba(255,255,255,0.5)]"
            >
              Enter App Now
            </button>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-12 text-center text-muted-foreground text-sm">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
          <Layers className="w-5 h-5" />
          <span className="font-display font-bold text-lg tracking-tight">Pryzen Team Index</span>
        </div>
        <p>© {new Date().getFullYear()} Pryzen Team Index. All rights reserved.</p>
        <p className="mt-2 text-xs opacity-50">Mainnet Pilot phase. smart contracts carry inherent risks.</p>
      </footer>

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

// Simple standalone FAQ Accordion Item
function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-white/10 rounded-xl bg-white/5 overflow-hidden transition-all duration-200">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors focus:outline-none"
      >
        <span className="font-semibold text-white">{question}</span>
        <ChevronDown className={cn("w-5 h-5 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="px-6 pb-5 pt-1 text-muted-foreground leading-relaxed border-t border-white/5">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
