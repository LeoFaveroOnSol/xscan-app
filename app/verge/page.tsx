'use client'
import { useEffect } from 'react'
import './verge.css'

function useScrollReveal() {
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12 }
    )
    document.querySelectorAll('.animate-on-scroll').forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function Badge({ variant, children, className = '' }: { variant: 'orange' | 'green'; children: React.ReactNode; className?: string }) {
  return <span className={`${variant === 'orange' ? 'badge-orange' : 'badge-green'} ${className}`}>{children}</span>
}

function Card({ tilt, title, children }: { tilt: 'left' | 'right'; title: string; children: React.ReactNode }) {
  return (
    <div className={`animate-on-scroll verge-card ${tilt === 'left' ? 'card-tilt-left' : 'card-tilt-right'} max-w-lg w-full`}>
      <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '24px', color: '#1A1A1A', marginBottom: '12px' }}>{title}</h3>
      <p style={{ fontSize: '15px', fontWeight: 400, color: '#4A4A4A', lineHeight: 1.7 }}>{children}</p>
    </div>
  )
}

function Illustration({ text, src, className = '' }: { text: string; src?: string; className?: string }) {
  if (src) {
    return (
      <div className={`relative rounded-lg overflow-hidden ${className}`}>
        <img src={src} alt={text} className="w-full h-full object-cover" style={{ minHeight: '300px' }} />
      </div>
    )
  }
  return <div className={`illustration-placeholder text-center px-8 py-10 ${className}`}>{text}</div>
}

export default function VergePage() {
  useScrollReveal()

  return (
    <div className="verge-root relative overflow-hidden">
      <div className="light-rays" />

      <nav className="sticky top-0 z-50 backdrop-blur-md border-b border-white/5" style={{ background: 'rgba(26, 43, 26, 0.85)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <img src="/verge-logo-dark.jpg" alt="$VERGE" className="w-8 h-8 rounded-full" />
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', color: '#4ADE80' }}>$VERGE</span>
          </a>
          <div className="hidden md:flex items-center gap-8" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500, fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
            <a href="#home" className="hover:text-[#4ADE80] transition-colors">Home</a>
            <a href="#about" className="hover:text-[#4ADE80] transition-colors">About</a>
            <a href="#tokenomics" className="hover:text-[#4ADE80] transition-colors">Tokenomics</a>
            <a href="#roadmap" className="hover:text-[#4ADE80] transition-colors">Roadmap</a>
          </div>
          <a href="#buy" className="inline-block px-6 py-2 rounded-lg text-white text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, background: 'linear-gradient(135deg, #C17F1A, #d4952e)' }}>Buy now</a>
        </div>
      </nav>

      <section id="home" className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="absolute left-[5%] top-[18%] w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-red-600 opacity-25 blur-xl" />
        <div className="absolute left-[10%] top-[45%] w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 opacity-15 blur-lg" />
        <div className="absolute right-[5%] top-[22%] w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 opacity-20 blur-xl" />
        <div className="absolute right-[12%] top-[50%] w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 opacity-15 blur-lg" />

        <Badge variant="green">$Verge</Badge>

        <h1 className="hero-highlight mt-8 mb-10 max-w-3xl">
          <span>Riches or Ruin.</span><br />
          <span>Pick one.</span>
        </h1>

        <div className="flex gap-4 mb-16 flex-wrap justify-center">
          <a href="#buy" className="inline-block px-8 py-3 rounded-lg text-lg" style={{ background: '#4ADE80', color: '#1A2B1A', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>Buy now</a>
          <a href="#chart" className="inline-block px-8 py-3 rounded-lg text-lg border-2 border-white text-white hover:bg-white/10 transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>View chart</a>
        </div>

        <Illustration text="Bull vs Bear Boxing Standoff" src="/verge-hero-boxing.png" className="max-w-2xl w-full mx-auto" />
      </section>

      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-on-scroll"><Badge variant="green">The Eternal PvP</Badge></div>
          <h2 className="animate-on-scroll mt-6 mb-16" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '34px', color: 'white' }}>
            Survival isn&apos;t promised.<br className="hidden sm:block" /> It&apos;s <span style={{ color: '#4ADE80' }}>earned.</span>
          </h2>
          <div className="flex flex-col md:flex-row gap-10 justify-center items-center">
            <Card tilt="left" title="The Bulls 🐂">Diamond-handed chads who eat dips for breakfast. They know every sell from a weak-handed bear is just more SOL in their own pockets. They stack while the world burns.</Card>
            <Card tilt="right" title="The Bears 🐻">Doom-scrolling cowards. They&apos;re the exit liquidity. They sell because they&apos;re scared, paying the 1.5% coward tax that goes straight to the Bulls. Stay poor.</Card>
          </div>
        </div>
      </section>

      <section id="about" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Illustration text="Sistine Chapel - Bull vs Bear" src="/verge-sistine.png" className="animate-on-scroll w-full mb-12" />
          <Illustration text="Bear Pepe" src="/verge-bear-pepe.png" className="animate-on-scroll max-w-xs mx-auto mb-10 min-h-[180px]" />
          <div className="text-center">
            <div className="animate-on-scroll"><Badge variant="orange">THIS IS $VERGE</Badge></div>
            <div className="animate-on-scroll mt-8 mx-auto max-w-3xl verge-card" style={{ transform: 'none', background: '#F5F5F0' }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '20px', color: '#1A2B1A', marginBottom: '12px' }}>Built on Solana. Whether you live on-chain or just got here.</p>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7 }}>We&apos;re here to survive the edge and come out with more SOL than we started with. Conviction is the only utility that matters.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <Illustration text="Coinbarrel Labs" src="/verge-coinbarrel.png" className="animate-on-scroll max-w-lg mx-auto mb-12" />
          <div className="text-center">
            <div className="animate-on-scroll"><Badge variant="orange">Coinbarrel:</Badge></div>
            <h2 className="animate-on-scroll mt-6 mb-16" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '34px' }}>Built for the <span style={{ color: '#4ADE80' }}>chaos</span> of the trenches.</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-10 justify-center items-center">
            <Card tilt="left" title="Fees Belong to the Holders">100% of every tax flows straight back to the community. No team wallets. No rug. Just pure redistribution to the diamond hands.</Card>
            <Card tilt="right" title="AUTOMATIC SOL REWARDS">Hold $VERGE, get SOL. No staking, no claiming, no bullshit. Pure Solana landing in your wallet because some bear decided to sell. Passive income for chads.</Card>
          </div>
          <div className="animate-on-scroll mt-16 cta-banner">Coinbarrel&apos;s tech thrives in chaos.</div>
        </div>
      </section>

      <section id="tokenomics" className="relative z-10 py-24 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-on-scroll flex flex-wrap items-center justify-center gap-6">
            <Badge variant="orange">The 1,5% Tax: Feed the bulls</Badge>
            <div className="tax-badge">
              <span className="tax-number">1,5%</span>
              <span className="tax-sub">On every buy &amp; sell</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-10 justify-center items-center mt-16">
            <Card tilt="left" title="Tipping the chads">Every time a Bear panics and hits sell, they&apos;re essentially tipping you in Solana. More volume = more SOL in your wallet.</Card>
            <Card tilt="right" title="Kill the PVP">The tax rewards the ones who actually stay in the trenches. We don&apos;t want quick flips; we want more SOL.</Card>
          </div>
          <Illustration text="Bull Pepe" src="/verge-bull-pepe.png" className="animate-on-scroll max-w-xs mx-auto mt-16 min-h-[220px]" />
        </div>
      </section>

      <section id="roadmap" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="animate-on-scroll"><Badge variant="orange">Bull or Bear?</Badge></div>
          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center mt-14">
            <div className="animate-on-scroll choice-card-bull max-w-sm w-full">
              <span className="text-6xl mb-4 block">🐂</span>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '26px', color: '#4ADE80', marginBottom: '8px' }}>Bulls</h3>
              <p className="text-white/80" style={{ fontSize: '15px' }}>Stack SOL &amp; Thrive</p>
            </div>
            <div className="animate-on-scroll choice-card-bear max-w-sm w-full">
              <span className="text-6xl mb-4 block">🐻</span>
              <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '26px', color: '#EF4444', marginBottom: '8px' }}>Bears</h3>
              <p className="text-white/80" style={{ fontSize: '15px' }}>Pay tax &amp; watch</p>
            </div>
          </div>
          <div className="animate-on-scroll mt-16 cta-banner">Join the fight on <a href="https://coinbarrel.com" className="underline underline-offset-4 hover:opacity-80">coinbarrel.com</a></div>
          <p className="animate-on-scroll mt-10" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '28px', color: 'rgba(255,255,255,0.9)' }}>$VERGE: Stack SOL. <span style={{ color: '#4ADE80' }}>Stay chad.</span></p>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-12 px-6" style={{ background: 'rgba(20, 30, 20, 0.6)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <a href="#" className="flex items-center gap-2">
              <img src="/verge-logo-dark.jpg" alt="$VERGE" className="w-7 h-7 rounded-full" />
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '18px', color: '#4ADE80' }}>$VERGE</span>
            </a>
            <div className="flex gap-4">
              <a href="#buy" className="inline-block px-6 py-2 rounded-lg text-sm" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, background: 'linear-gradient(135deg, #C17F1A, #d4952e)', color: 'white' }}>Buy now</a>
              <a href="#chart" className="inline-block px-6 py-2 rounded-lg text-sm border-2 border-white text-white" style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>View chart</a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
            <div className="flex items-center gap-6">
              <a href="#x" className="text-white/60 hover:text-[#4ADE80] transition-colors text-xl font-bold">𝕏</a>
              <a href="#instagram" className="text-white/60 hover:text-[#4ADE80] transition-colors text-xl">📷</a>
              <a href="#telegram" className="text-white/60 hover:text-[#4ADE80] transition-colors text-xl">✈️</a>
            </div>
            <p className="text-white/40 text-sm" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>© 2025 $VERGE. All Rights Reserved</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
