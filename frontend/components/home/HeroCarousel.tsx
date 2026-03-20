'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// SLIDE DATA
// ─────────────────────────────────────────────────────────────
interface Slide {
  id:           number
  bg:           string
  productBg:    string
  eyebrow:      string
  headline:     string[]
  features:     string[]
  tags:         string[]
  ctaLabel:     string
  ctaHref:      string
  productEmoji: string
  fromPrice:    string
}

const SLIDES: Slide[] = [
  {
    id: 1,
    bg: '#dff0e8', productBg: '#a8d8c4',
    eyebrow: 'Starting ₹99',
    headline: ['Bestselling Mobile', 'Accessories'],
    features: ['Wide Selection', 'Top Brands'],
    tags: ['Earbuds', 'Cases', 'Chargers', 'Power Banks'],
    ctaLabel: 'Shop Now', ctaHref: '/category/mobiles',
    productEmoji: '📱', fromPrice: '₹99',
  },
  {
    id: 2,
    bg: '#e8eeff', productBg: '#b4c2ff',
    eyebrow: 'Under ₹399',
    headline: ['Shop T-Shirts', '& Polos'],
    features: ['Top Brands', 'Latest Trends'],
    tags: ['Men', 'Women', 'Kids', 'Oversized'],
    ctaLabel: 'Explore Fashion', ctaHref: '/category/fashion',
    productEmoji: '👕', fromPrice: '₹399',
  },
  {
    id: 3,
    bg: '#fff3e0', productBg: '#ffc98a',
    eyebrow: 'Up to 55% off',
    headline: ['Appliances for', 'Your Home'],
    features: ['Trusted Brands', 'Free Delivery'],
    tags: ['ACs', 'Fridges', 'Washing Machines', 'Microwaves'],
    ctaLabel: 'Shop Appliances', ctaHref: '/category/appliances',
    productEmoji: '🏠', fromPrice: '₹8,999',
  },
  {
    id: 4,
    bg: '#e8f8f0', productBg: '#90ddb8',
    eyebrow: 'Min. 40% off',
    headline: ['Sports &', 'Fitness Gear'],
    features: ['Min. 40% Off', 'Top Brands'],
    tags: ['Shoes', 'Equipment', 'Clothing', 'Supplements'],
    ctaLabel: 'Shop Sports', ctaHref: '/category/sports',
    productEmoji: '⚽', fromPrice: '₹499',
  },
  {
    id: 5,
    bg: '#f8eeff', productBg: '#d8a8f8',
    eyebrow: 'From ₹99',
    headline: ['Beauty &', 'Skincare Deals'],
    features: ['Genuine Products', 'Top Picks'],
    tags: ['Skincare', 'Makeup', 'Haircare', 'Combos'],
    ctaLabel: 'Shop Beauty', ctaHref: '/category/beauty',
    productEmoji: '💄', fromPrice: '₹99',
  },
]

const SLIDE_DURATION = 4500
const ANIM_DURATION  = 380
// ⚡ Throttle: update progress bar only every 80ms (not 60fps)
const PROGRESS_THROTTLE = 80

// ─────────────────────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────────────────────
const CSS = `
  .hc-wrap { position:relative; overflow:hidden; user-select:none; }
  .hc-slide { position:absolute; inset:0; will-change:transform,opacity; }

  .hc-enter-r { animation: hcInR  ${ANIM_DURATION}ms cubic-bezier(.25,.46,.45,.94) both; }
  .hc-enter-l { animation: hcInL  ${ANIM_DURATION}ms cubic-bezier(.25,.46,.45,.94) both; }
  .hc-exit-l  { animation: hcOutL ${ANIM_DURATION}ms cubic-bezier(.25,.46,.45,.94) both; }
  .hc-exit-r  { animation: hcOutR ${ANIM_DURATION}ms cubic-bezier(.25,.46,.45,.94) both; }

  @keyframes hcInR  { from{transform:translateX(6%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes hcInL  { from{transform:translateX(-6%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes hcOutL { from{transform:translateX(0);opacity:1} to{transform:translateX(-6%);opacity:0} }
  @keyframes hcOutR { from{transform:translateX(0);opacity:1} to{transform:translateX(6%);opacity:0} }

  .hc-t1 { animation: hcUp .4s .05s both; }
  .hc-t2 { animation: hcUp .4s .13s both; }
  .hc-t3 { animation: hcUp .4s .20s both; }
  .hc-t4 { animation: hcUp .4s .27s both; }
  .hc-t5 { animation: hcUp .4s .34s both; }
  @keyframes hcUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

  .hc-float { animation: hcFloat 3.6s ease-in-out infinite; }
  @keyframes hcFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }

  .hc-dot-pulse { animation: hcPulse 2s ease-in-out infinite; }
  @keyframes hcPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }

  .hc-arrow { transition: background .18s, transform .18s, box-shadow .18s; }
  .hc-arrow:hover { background:white !important; transform:scale(1.1); }

  .hc-tag { transition: border-color .15s, color .15s, background .15s; }
  .hc-tag:hover { border-color:#F97316; color:#F97316; background:white; }
`

// ─────────────────────────────────────────────────────────────
// SLIDE CONTENT
// ─────────────────────────────────────────────────────────────
function SlideContent({ slide, animate }: { slide: Slide; animate: boolean }) {
  const t = (n: number) => animate ? `hc-t${n}` : ''

  return (
    <div style={{
      width:'100%', height:'100%',
      display:'flex', alignItems:'center',
      maxWidth:1440, margin:'0 auto',
      padding:'0 clamp(16px,4vw,64px)',
    }}>

      {/* LEFT */}
      <div style={{ flex:1, minWidth:0, padding:'32px 20px 48px 0' }}>

        <p className={t(1)} style={{
          fontSize:'clamp(22px,3.8vw,52px)',
          fontWeight:900, lineHeight:1,
          color:'#F97316', marginBottom:8,
        }}>
          {slide.eyebrow}
        </p>

        <h2 className={t(2)} style={{
          fontSize:'clamp(14px,2.1vw,27px)',
          fontWeight:900, color:'#1a1a2e',
          lineHeight:1.25, marginBottom:14,
        }}>
          {slide.headline.map((l, i) => <span key={i} style={{ display:'block' }}>{l}</span>)}
        </h2>

        <div className={t(3)} style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
          {slide.features.map((f, i) => (
            <span key={f} style={{ display:'flex', alignItems:'center' }}>
              <span style={{ fontSize:12, fontWeight:600, color:'#6b7280' }}>{f}</span>
              {i < slide.features.length - 1 && (
                <span style={{ margin:'0 12px', color:'#d1d5db', fontSize:14 }}>|</span>
              )}
            </span>
          ))}
        </div>

        <div className={t(4)} style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
          {slide.tags.map(tag => (
            <Link key={tag} href={slide.ctaHref} className="hc-tag" style={{
              fontSize:11, fontWeight:700, padding:'5px 12px',
              borderRadius:999, border:'1.5px solid rgba(0,0,0,0.12)',
              color:'#4b5563', background:'rgba(255,255,255,0.65)',
              textDecoration:'none', whiteSpace:'nowrap',
            }}>
              {tag}
            </Link>
          ))}
        </div>

        <div className={t(5)}>
          <Link href={slide.ctaHref} style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'#F97316', color:'white',
            fontWeight:900, fontSize:14,
            padding:'12px 28px', borderRadius:999,
            textDecoration:'none',
            boxShadow:'0 6px 20px rgba(249,115,22,0.38)',
          }}>
            {slide.ctaLabel}
            <ChevronRight size={15} />
          </Link>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{
        flexShrink:0,
        width:'clamp(150px,34%,400px)',
        height:'100%',
        position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {/* Circle bg */}
        <div style={{
          position:'absolute', borderRadius:'50%',
          width:'80%', aspectRatio:'1/1',
          background:slide.productBg, opacity:.75,
          top:'50%', left:'50%', transform:'translate(-50%,-50%)',
        }} />

        {/* Emoji */}
        <span className={animate ? 'hc-float' : ''} style={{
          position:'relative', zIndex:2,
          fontSize:'clamp(64px,10.5vw,148px)',
          lineHeight:1, userSelect:'none',
          filter:'drop-shadow(0 16px 32px rgba(0,0,0,0.13))',
        }}>
          {slide.productEmoji}
        </span>

        {/* Price badge */}
        <div style={{
          position:'absolute', top:'14%', right:'5%', zIndex:10,
          background:'white', borderRadius:14,
          padding:'8px 14px',
          boxShadow:'0 4px 18px rgba(0,0,0,0.10)',
          border:'1px solid rgba(0,0,0,0.06)',
        }}>
          <p style={{ fontSize:8, fontWeight:800, color:'#9ca3af', textTransform:'uppercase', letterSpacing:'.08em', lineHeight:1, marginBottom:3 }}>From</p>
          <p style={{ fontSize:15, fontWeight:900, color:'#F97316', lineHeight:1 }}>{slide.fromPrice}</p>
        </div>

        {/* In Stock badge */}
        <div style={{
          position:'absolute', bottom:'14%', left:'5%', zIndex:10,
          background:'white', borderRadius:12, padding:'7px 12px',
          boxShadow:'0 4px 18px rgba(0,0,0,0.10)',
          border:'1px solid rgba(0,0,0,0.06)',
          display:'flex', alignItems:'center', gap:7,
        }}>
          <span className="hc-dot-pulse" style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:'#22c55e', flexShrink:0 }} />
          <span style={{ fontSize:11, fontWeight:800, color:'#374151' }}>In Stock</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export default function HeroCarousel() {
  const [curr,      setCurr]      = useState(0)
  const [prev,      setPrev]      = useState<number | null>(null)
  const [dir,       setDir]       = useState<'next'|'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const [progress,  setProgress]  = useState(0)
  const [paused,    setPaused]    = useState(false)

  const pausedRef   = useRef(false)
  const busyRef     = useRef(false)
  const goNextRef   = useRef<()=>void>(()=>{})
  const lastProg    = useRef(0) // throttle tracker

  useEffect(() => { pausedRef.current = paused }, [paused])

  const goTo = useCallback((idx: number, d: 'next'|'prev' = 'next') => {
    if (busyRef.current || idx === curr) return
    busyRef.current = true
    setDir(d)
    setPrev(curr)
    setCurr(idx)
    setAnimating(true)
    setProgress(0)
    lastProg.current = 0
    setTimeout(() => {
      setAnimating(false)
      setPrev(null)
      busyRef.current = false
    }, ANIM_DURATION + 40)
  }, [curr])

  const goNext = useCallback(() => goTo((curr + 1) % SLIDES.length, 'next'), [curr, goTo])
  const goPrev = useCallback(() => goTo((curr - 1 + SLIDES.length) % SLIDES.length, 'prev'), [curr, goTo])

  useEffect(() => { goNextRef.current = goNext }, [goNext])

  // ⚡ RAF loop — THROTTLED to PROGRESS_THROTTLE ms
  // This prevents 60fps setState calls which caused full-page re-renders
  useEffect(() => {
    let raf: number
    let start     = Date.now()
    let pacc      = 0
    let pt: number | null = null
    let lastTick  = 0  // throttle timestamp

    const tick = (now: number) => {
      // Throttle: only run logic every PROGRESS_THROTTLE ms
      if (now - lastTick < PROGRESS_THROTTLE) {
        raf = requestAnimationFrame(tick)
        return
      }
      lastTick = now

      if (pausedRef.current) {
        if (pt === null) pt = Date.now()
        raf = requestAnimationFrame(tick)
        return
      }
      if (pt !== null) { pacc += Date.now() - pt; pt = null }
      if (busyRef.current) { raf = requestAnimationFrame(tick); return }

      const p = Math.min((Date.now() - start - pacc) / SLIDE_DURATION, 1)

      // Only call setState if value actually changed meaningfully (avoid micro-updates)
      if (Math.abs(p - lastProg.current) > 0.004) {
        setProgress(p)
        lastProg.current = p
      }

      if (p >= 1) goNextRef.current()
      else raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [curr])

  const slide     = SLIDES[curr]
  const prevSlide = prev !== null ? SLIDES[prev] : null
  const enterCls  = dir === 'next' ? 'hc-enter-r' : 'hc-enter-l'
  const exitCls   = dir === 'next' ? 'hc-exit-l'  : 'hc-exit-r'

  return (
    <>
      <style>{CSS}</style>

      <section
        className="hc-wrap"
        style={{ background: slide.bg, transition: `background ${ANIM_DURATION}ms ease` }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Progress bar */}
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'rgba(0,0,0,0.08)', zIndex:40 }}>
          <div style={{
            height:'100%', background:'#F97316',
            width:`${progress * 100}%`,
            borderRadius:'0 4px 4px 0',
            transition:'none',
          }} />
        </div>

        {/* Height box */}
        <div style={{ position:'relative', height:'clamp(256px,38vw,460px)' }}>

          {/* Exiting */}
          {animating && prevSlide && (
            <div className={`hc-slide ${exitCls}`} style={{ background: prevSlide.bg }}>
              <SlideContent slide={prevSlide} animate={false} />
            </div>
          )}

          {/* Active */}
          <div className={`hc-slide${animating ? ` ${enterCls}` : ''}`} key={curr} style={{ background: slide.bg }}>
            <SlideContent slide={slide} animate={!animating} />
          </div>
        </div>

        {/* Left arrow */}
        <button className="hc-arrow" onClick={goPrev} aria-label="Previous" style={{
          position:'absolute', left:'clamp(8px,1.5vw,16px)',
          top:'50%', transform:'translateY(-50%)',
          zIndex:30, width:38, height:38, borderRadius:'50%',
          background:'rgba(255,255,255,0.82)',
          border:'1.5px solid rgba(0,0,0,0.10)',
          boxShadow:'0 2px 10px rgba(0,0,0,0.10)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <ChevronLeft size={20} color="#374151" />
        </button>

        {/* Right arrow */}
        <button className="hc-arrow" onClick={goNext} aria-label="Next" style={{
          position:'absolute', right:'clamp(8px,1.5vw,16px)',
          top:'50%', transform:'translateY(-50%)',
          zIndex:30, width:38, height:38, borderRadius:'50%',
          background:'rgba(255,255,255,0.82)',
          border:'1.5px solid rgba(0,0,0,0.10)',
          boxShadow:'0 2px 10px rgba(0,0,0,0.10)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer',
        }}>
          <ChevronRight size={20} color="#374151" />
        </button>

        {/* Dots */}
        <div style={{
          position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)',
          zIndex:30, display:'flex', alignItems:'center', gap:6,
        }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i, i > curr ? 'next' : 'prev')}
              aria-label={`Slide ${i + 1}`}
              style={{
                position:'relative', overflow:'hidden', height:7,
                width: i === curr ? 24 : 7,
                borderRadius:999, border:'none', cursor:'pointer', padding:0,
                background: i === curr ? '#F97316' : i < curr ? 'rgba(249,115,22,0.4)' : 'rgba(0,0,0,0.18)',
                transition:'width .3s ease, background .3s ease',
              }}>
              {i === curr && (
                <span style={{
                  position:'absolute', inset:0, borderRadius:999,
                  background:'rgba(255,255,255,0.3)',
                  transformOrigin:'left',
                  transform:`scaleX(${progress})`,
                  transition:'none',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Paused label */}
        {paused && (
          <span style={{
            position:'absolute', bottom:12, right:14, zIndex:30,
            fontSize:9, fontWeight:800, textTransform:'uppercase',
            letterSpacing:'.14em', color:'rgba(0,0,0,0.22)',
          }}>
            ⏸ Paused
          </span>
        )}
      </section>
    </>
  )
}