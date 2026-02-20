// PrivacyShowcase — "Why Privacy Matters" section
//
// Each pillar gets a mini visual demonstration instead of just an icon:
//   1. No Front-Running  → encrypted bid board (hashes + lock icons)
//   2. No Information Leakage → masked data fields (dots + locks)
//   3. Fair by Design → verification flow (Tx → ZK Proof → Verified)
//
// GSAP ScrollTrigger handles scroll-triggered stagger entrance.
// Background uses pure black to match the rest of the landing page.

import { useRef } from "react";
import { motion, useInView } from "motion/react";
import { ShieldCheck, EyeOff, Scale, Lock } from "lucide-react";

// ── Visual demonstration sub-components ──────────────────────────
// These show the privacy concept visually rather than just describing it.

// Encrypted bid board — shows sealed bids as on-chain hashes
function BidBoardVisual() {
  const bids = [
    { bidder: "Bidder A", hash: "0xa3f...91c" },
    { bidder: "Bidder B", hash: "0x7b2...e4d" },
    { bidder: "Bidder C", hash: "0xc9e...2f7" },
  ];

  return (
    <div className="space-y-1.5 font-mono text-xs">
      {bids.map((bid, i) => (
        <motion.div
          key={bid.bidder}
          custom={i}
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0.5, borderColor: "rgba(38,38,38,0.5)", x: 0 },
            animate: (i) => ({
              opacity: [0.5, 1, 1, 0.5, 0.5],
              borderColor: [
                "rgba(38,38,38,0.5)",
                "rgba(16,185,129,0.5)",
                "rgba(16,185,129,0.5)",
                "rgba(38,38,38,0.5)",
                "rgba(38,38,38,0.5)"
              ],
              x: [0, 4, 4, 0, 0],
              transition: {
                repeat: Infinity,
                duration: 3,
                delay: i * 1,
                times: [0, 0.05, 0.28, 0.33, 1]
              }
            })
          }}
          className="flex items-center justify-between rounded-lg bg-black/60 px-3 py-2 border"
        >
          <span className="text-neutral-500">{bid.bidder}</span>
          <span className="text-emerald-400/60">{bid.hash}</span>
          <div className="flex items-center gap-1 text-emerald-500/40">
            <Lock className="h-3 w-3" />
            <span>Sealed</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Masked data fields — shows all auction data is hidden
function DataFieldsVisual() {
  const fields = ["Identity", "Bid Amount", "Strategy"];

  return (
    <div className="space-y-1.5 font-mono text-xs">
      {fields.map((field, i) => (
        <motion.div
          key={field}
          custom={i}
          initial="initial"
          animate="animate"
          variants={{
            initial: { opacity: 0.4, filter: "blur(2px)", borderColor: "rgba(38,38,38,0.5)" },
            animate: (i) => ({
              opacity: [0.4, 1, 1, 0.4, 0.4],
              filter: ["blur(2px)", "blur(0px)", "blur(0px)", "blur(2px)", "blur(2px)"],
              borderColor: [
                "rgba(38,38,38,0.5)",
                "rgba(16,185,129,0.5)",
                "rgba(16,185,129,0.5)",
                "rgba(38,38,38,0.5)",
                "rgba(38,38,38,0.5)"
              ],
              transition: {
                repeat: Infinity,
                duration: 3,
                delay: i * 1,
                times: [0, 0.05, 0.28, 0.33, 1]
              }
            })
          }}
          className="flex items-center justify-between rounded-lg bg-black/60 px-3 py-2 border"
        >
          <span className="text-neutral-500 w-20">{field}</span>
          <span className="text-neutral-700 tracking-tight">●●●●●●●●●●</span>
          <Lock className="h-3 w-3 text-emerald-500/40 shrink-0" />
        </motion.div>
      ))}
    </div>
  );
}

// Verification flow — shows Tx → ZK Proof → Verified chain
function VerifyFlowVisual() {
  const steps = [
    { label: "Transaction", short: "Tx", active: false },
    { label: "ZK Proof", short: "ZK", active: true },
    { label: "Verified", short: "✓", active: true },
  ];

  return (
    <div className="flex items-center justify-between gap-1.5 font-mono text-xs py-1">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 min-w-0">
          {/* Step circle */}
          <motion.div
            custom={i}
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0.5, scale: 0.95 },
              animate: (i) => ({
                opacity: [0.5, 1, 1, 0.5, 0.5],
                scale: [0.95, 1.05, 1.05, 0.95, 0.95],
                transition: { 
                  repeat: Infinity,
                  duration: 3,
                  delay: i * 1,
                  times: [0, 0.05, 0.28, 0.33, 1]
                }
              })
            }}
            className="flex flex-col items-center text-center w-full"
          >
            <motion.div
              variants={{
                initial: { 
                  borderColor: "rgba(38,38,38,1)", 
                  backgroundColor: "rgba(0,0,0,0.6)",
                  color: "rgba(115,115,115,1)"
                },
                animate: (i) => ({
                  borderColor: [
                    "rgba(38,38,38,1)",
                    "rgba(16,185,129,0.5)",
                    "rgba(16,185,129,0.5)",
                    "rgba(38,38,38,1)",
                    "rgba(38,38,38,1)"
                  ],
                  backgroundColor: [
                    "rgba(0,0,0,0.6)",
                    "rgba(16,185,129,0.1)",
                    "rgba(16,185,129,0.1)",
                    "rgba(0,0,0,0.6)",
                    "rgba(0,0,0,0.6)"
                  ],
                  color: [
                    "rgba(115,115,115,1)",
                    "rgba(52,211,153,1)",
                    "rgba(52,211,153,1)",
                    "rgba(115,115,115,1)",
                    "rgba(115,115,115,1)"
                  ],
                  transition: { 
                    repeat: Infinity,
                    duration: 3,
                    delay: i * 1,
                    times: [0, 0.05, 0.28, 0.33, 1]
                  }
                })
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full border text-sm font-medium mb-1.5"
            >
              {step.short}
            </motion.div>
            <span
              className={`text-[10px] text-neutral-500`}
            >
              {step.label}
            </span>
          </motion.div>
          {/* Connecting line */}
          {i < steps.length - 1 && (
            <div className="flex-1 min-w-[8px] px-0.5 -mt-4">
              <motion.div
                custom={i}
                initial="initial"
                animate="animate"
                variants={{
                  initial: { opacity: 0.3, backgroundColor: "rgba(64,64,64,1)" },
                  animate: (i) => ({
                    opacity: [0.3, 1, 1, 0.3, 0.3],
                    backgroundColor: [
                      "rgba(64,64,64,1)",
                      "rgba(16,185,129,0.7)",
                      "rgba(16,185,129,0.7)",
                      "rgba(64,64,64,1)",
                      "rgba(64,64,64,1)"
                    ],
                    transition: {
                      repeat: Infinity,
                      duration: 3,
                      delay: i * 1 + 0.5,
                      times: [0, 0.05, 0.28, 0.33, 1]
                    }
                  })
                }}
                className={`h-px w-full`}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Maps pillar type to its visual component
const VISUAL_MAP = {
  bids: BidBoardVisual,
  data: DataFieldsVisual,
  verify: VerifyFlowVisual,
};

// ── Pillar data ──────────────────────────────────────────────────
const PILLARS = [
  {
    icon: ShieldCheck,
    title: "No Front-Running",
    description:
      "Your bids are hidden until the reveal phase. No one can see your bid and outbid you by $1.",
    visual: "bids",
  },
  {
    icon: EyeOff,
    title: "No Information Leakage",
    description:
      "Bid amounts, bidder identity, and strategy stay private. Only you know your position.",
    visual: "data",
  },
  {
    icon: Scale,
    title: "Fair by Design",
    description:
      "ZK proofs ensure honest settlement. Cryptographic guarantees replace trust.",
    visual: "verify",
  },
];

// ── Component ────────────────────────────────────────────────────
export function PrivacyShowcase() {
  // Scroll-triggered stagger using framer-motion's useInView
  const gridRef = useRef(null);
  const isGridInView = useInView(gridRef, { once: true, margin: "-80px" });

  return (
    <section id="privacy" className="relative z-10 bg-black pt-40 pb-52">
      {/* Thin gradient separator from the section above */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

      <div className="mx-auto max-w-6xl px-4">
        {/* ── Section header ─────────────────────────────── */}
        <div className="mb-16 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Why Privacy Matters
          </h2>
          <p className="mt-3 text-neutral-400 max-w-2xl mx-auto">
            Public blockchains expose everything. Aloe uses Aleo&apos;s
            zero-knowledge proofs to keep your auction activity private.
          </p>
        </div>

        {/* ── Privacy pillar cards — staggered entrance on scroll ── */}
        <motion.div
          ref={gridRef}
          className="grid gap-4 md:grid-cols-3"
          initial="hidden"
          animate={isGridInView ? "visible" : "hidden"}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15 } },
          }}
        >
          {PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            const Visual = VISUAL_MAP[pillar.visual];

            return (
              <motion.div
                key={pillar.title}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="group rounded-2xl border border-neutral-800 bg-neutral-950/80 p-5 hover:border-emerald-500/30 transition-colors duration-300"
                style={{
                  // Subtle dot grid texture for depth
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              >
                {/* Visual demonstration area — shows, don't tell */}
                <div className="mb-5 rounded-xl border border-neutral-800/60 bg-black/50 p-3.5">
                  <Visual />
                </div>

                {/* Icon + Title + Description */}
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {pillar.title}
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
