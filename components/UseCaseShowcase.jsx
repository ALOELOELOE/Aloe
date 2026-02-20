// UseCaseShowcase — Interactive tabbed spotlight for use cases
//
// Replaces the static 3-card grid with a two-column showcase:
//   LEFT:  Expanded detail view with animated auction flow visualization
//   RIGHT: Clickable tab selectors that auto-cycle with a progress bar
//
// GSAP powers: scroll entrance, content swap crossfade, flow node stagger,
// progress bar fill, and the "out → in" transition on tab change.

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Gavel,
  ImageIcon,
  Briefcase,
  ChevronRight,
} from "lucide-react";

// Register ScrollTrigger (client-side only — avoids SSR crash)
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ── Use-case data ──────────────────────────────────────────────────
// Each use case shares the same sealed-bid primitive but targets a different market.
// `steps` powers the animated flow visualization in the showcase.
const USE_CASES = [
  {
    icon: Gavel,
    title: "Sealed-Bid Auctions",
    description:
      "Bid without revealing your hand. ZK-committed bids prevent sniping and information leakage across all auction types.",
    privacy: "Eliminates bid sniping & front-running",
    href: "/dashboard",
    status: "live",
    steps: [
      "Create Auction",
      "Submit Sealed Bid",
      "Reveal Bids",
      "Settle Winner",
    ],
  },
  {
    icon: ImageIcon,
    title: "NFT Auctions",
    description:
      "Private NFT sales with sealed bids. Collectors bid without exposing portfolio or bid history to the market.",
    privacy: "Protects portfolio exposure & bid tracking",
    href: "/nft",
    status: "coming_soon",
    steps: [
      "List NFT",
      "Sealed Offers",
      "Reveal & Rank",
      "Transfer Asset",
    ],
  },
  {
    icon: Briefcase,
    title: "Procurement / RFQ",
    description:
      "Reverse auctions for sourcing. Suppliers submit sealed quotes — lowest wins. No price manipulation possible.",
    privacy: "Prevents price collusion & bid-rigging",
    href: "/procurement",
    status: "coming_soon",
    steps: [
      "Post RFQ",
      "Sealed Quotes",
      "Evaluate Bids",
      "Award Contract",
    ],
  },
];

// Seconds before auto-advancing to the next use case
const CYCLE_DURATION = 6;

// ── Component ──────────────────────────────────────────────────────
export function UseCaseShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  // DOM refs for GSAP targeting
  const sectionRef = useRef(null);
  const showcaseRef = useRef(null);
  const flowRef = useRef(null);
  const progressRefs = useRef([]); // one per tab
  const timerRef = useRef(null); // holds the active GSAP tween for auto-cycle
  const isFirstRender = useRef(true); // skip content-swap animation on mount

  const activeCase = USE_CASES[activeIndex];
  const Icon = activeCase.icon;
  const isLive = activeCase.status === "live";

  // ── Auto-cycle timer ──────────────────────────────────────────
  // Fills the progress bar on the active tab, then crossfades to the next use case.
  const startCycle = useCallback(() => {
    if (timerRef.current) timerRef.current.kill();

    const bar = progressRefs.current[activeIndex];
    if (!bar) return;

    timerRef.current = gsap.fromTo(
      bar,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: CYCLE_DURATION,
        ease: "none",
        onComplete: () => {
          // Animate showcase OUT, then advance index
          gsap.to(showcaseRef.current, {
            opacity: 0,
            y: -8,
            duration: 0.2,
            ease: "power2.in",
            onComplete: () =>
              setActiveIndex((prev) => (prev + 1) % USE_CASES.length),
          });
        },
      }
    );
  }, [activeIndex]);

  // ── Content swap + flow stagger on tab change ─────────────────
  useEffect(() => {
    // Reset all progress bars to empty
    progressRefs.current.forEach(
      (el) => el && gsap.set(el, { scaleX: 0 })
    );

    // On first render, let ScrollTrigger handle the entrance — don't double-animate
    if (!isFirstRender.current) {
      // Animate showcase IN from below
      gsap.set(showcaseRef.current, { opacity: 0, y: 16 });
      gsap.to(showcaseRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "power2.out",
      });

      // Stagger flow step nodes (numbered circles + labels)
      const nodes = flowRef.current?.querySelectorAll("[data-node]");
      const lines = flowRef.current?.querySelectorAll("[data-line]");
      if (nodes?.length) {
        gsap.fromTo(
          nodes,
          { opacity: 0, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.3,
            stagger: 0.08,
            ease: "power2.out",
            delay: 0.15,
          }
        );
      }
      // Grow connecting lines between nodes
      if (lines?.length) {
        gsap.fromTo(
          lines,
          { scaleX: 0 },
          {
            scaleX: 1,
            duration: 0.25,
            stagger: 0.08,
            ease: "power2.out",
            delay: 0.2,
          }
        );
      }
    }

    isFirstRender.current = false;
    startCycle();

    return () => {
      if (timerRef.current) timerRef.current.kill();
    };
  }, [activeIndex, startCycle]);

  // ── Scroll-triggered entrance (runs once) ─────────────────────
  useEffect(() => {
    if (!sectionRef.current) return;

    const entranceEls = sectionRef.current.querySelectorAll("[data-entrance]");
    const ctx = gsap.context(() => {
      gsap.from(entranceEls, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 80%",
          once: true,
        },
        opacity: 0,
        y: 40,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
      });
    });

    return () => ctx.revert();
  }, []);

  // ── Tab click handler — animate out, then switch ──────────────
  const handleTabClick = (index) => {
    if (index === activeIndex) return;
    if (timerRef.current) timerRef.current.kill();

    gsap.to(showcaseRef.current, {
      opacity: 0,
      y: -8,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => setActiveIndex(index),
    });
  };

  // ── Render ────────────────────────────────────────────────────
  return (
    <section
      ref={sectionRef}
      id="use-cases"
      className="relative z-10 bg-black pt-48 pb-40"
    >
      <div className="mx-auto max-w-6xl px-4">
        {/* ── Section header ─────────────────────────────── */}
        <div className="mb-16 text-center" data-entrance>
          <h2 className="text-3xl font-bold md:text-4xl">
            One Primitive, Many Applications
          </h2>
          <p className="mt-3 text-neutral-400 max-w-2xl mx-auto">
            The same composable auction contract powers every use case.
            Different frontends, same privacy guarantees.
          </p>
        </div>

        {/* ── Two-column layout ──────────────────────────── */}
        {/* On mobile: tabs first (horizontal pills), showcase below */}
        {/* On desktop: showcase left, tabs right (vertical list) */}
        <div
          className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_300px] gap-6"
          data-entrance
        >
          {/* ── LEFT: Expanded showcase card ──────────────── */}
          <div
            className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950/60"
            style={{
              // Subtle dot grid adds depth without distraction
              backgroundImage:
                "radial-gradient(rgba(255,255,255,0.025) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          >
            {/* Thin emerald accent line at top edge */}
            <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

            <div ref={showcaseRef} className="p-6 sm:p-8 lg:p-10">
              {/* Icon + Title + Badge */}
              <div className="flex items-start gap-4 mb-6">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/20">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">
                      {activeCase.title}
                    </h3>
                    <Badge
                      variant={isLive ? "default" : "outline"}
                      className={
                        isLive
                          ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                          : "border-neutral-700 text-neutral-500"
                      }
                    >
                      {isLive ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                      ) : (
                        "Coming Soon"
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">
                    {activeCase.description}
                  </p>
                </div>
              </div>

              {/* ── Flow visualization — horizontal step process ─── */}
              <div
                ref={flowRef}
                className="my-8 rounded-xl border border-neutral-800/60 bg-black/40 p-4 sm:p-6"
              >
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-5">
                  How it works
                </p>
                <div className="flex items-start">
                  {activeCase.steps.map((step, i) => (
                    <div
                      key={`${activeCase.title}-step-${i}`}
                      className="flex items-start flex-1 min-w-0"
                    >
                      {/* Step node: numbered circle + label */}
                      <div
                        data-node
                        className="flex flex-col items-center text-center w-full"
                      >
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-xs sm:text-sm font-mono font-medium text-emerald-400 mb-2">
                          {String(i + 1).padStart(2, "0")}
                        </div>
                        <span className="text-[10px] sm:text-xs text-neutral-400 leading-tight px-0.5">
                          {step}
                        </span>
                      </div>
                      {/* Connecting gradient line between nodes */}
                      {i < activeCase.steps.length - 1 && (
                        <div className="flex-1 flex items-center pt-[18px] sm:pt-5 px-0.5 sm:px-1 min-w-[8px]">
                          <div
                            data-line
                            className="h-px w-full bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 origin-left"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Privacy note + CTA ──────────────────────────── */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-neutral-800/50">
                <p className="text-sm text-emerald-400/80">
                  {activeCase.privacy}
                </p>
                <Link href={activeCase.href}>
                  <Button
                    size="sm"
                    className={
                      isLive
                        ? "gap-2 bg-emerald-500 text-black hover:bg-emerald-400 shrink-0"
                        : "gap-2 border-neutral-700 text-neutral-500 shrink-0"
                    }
                    variant={isLive ? "default" : "outline"}
                    disabled={!isLive}
                  >
                    {isLive ? "Launch App" : "Coming Soon"}
                    {isLive && <ArrowRight className="h-4 w-4" />}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Tab selectors ─────────────────────── */}
          {/* Horizontal scrollable row on mobile, vertical list on desktop */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            {USE_CASES.map((uc, i) => {
              const TabIcon = uc.icon;
              const isActive = i === activeIndex;
              const isTabLive = uc.status === "live";

              return (
                <button
                  key={uc.title}
                  onClick={() => handleTabClick(i)}
                  className={`
                    relative text-left rounded-xl border overflow-hidden
                    p-3 lg:p-4 transition-all duration-200
                    flex-shrink-0 w-[200px] lg:w-auto
                    ${
                      isActive
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-neutral-800 bg-transparent hover:border-neutral-700 hover:bg-neutral-900/30"
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    {/* Tab icon */}
                    <div
                      className={`flex h-8 w-8 lg:h-9 lg:w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-neutral-800/50 text-neutral-500"
                      }`}
                    >
                      <TabIcon className="h-4 w-4" />
                    </div>
                    {/* Tab text */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium truncate ${
                            isActive ? "text-white" : "text-neutral-400"
                          }`}
                        >
                          {uc.title}
                        </p>
                        {/* Green dot for "Live" status */}
                        {isTabLive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                        )}
                      </div>
                      {/* Privacy tagline — desktop only */}
                      <p className="hidden lg:block text-xs text-neutral-600 mt-0.5 truncate">
                        {uc.privacy}
                      </p>
                    </div>
                    {/* Arrow indicator — desktop only */}
                    <ChevronRight
                      className={`hidden lg:block h-4 w-4 shrink-0 ml-auto transition-colors ${
                        isActive ? "text-emerald-400" : "text-neutral-700"
                      }`}
                    />
                  </div>

                  {/* Progress bar — thin line at tab bottom, GSAP fills scaleX 0→1 */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800/50 ${
                      isActive ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div
                      ref={(el) => (progressRefs.current[i] = el)}
                      className="h-full bg-emerald-500/50 origin-left"
                      style={{ transform: "scaleX(0)" }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
