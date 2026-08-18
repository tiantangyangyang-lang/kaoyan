import { useEffect, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type {
  MathAnimationKind,
  MathAnimationSpec,
  MathAnimationVariant,
} from "../../types";
import {
  AsymptoteScene,
  IntegralRegionScene,
  ProbabilityResultsScene,
  RadialDensityScene,
} from "./RedesignedScenes";

const draw = (reduced: boolean) => ({
  initial: reduced ? false : { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: { duration: reduced ? 0 : 1.1, ease: "easeInOut" as const },
});

function Axes() {
  return (
    <g className="math-animation-axes">
      <line x1="24" y1="150" x2="336" y2="150" />
      <line x1="180" y1="18" x2="180" y2="282" />
      <path d="M336 150l-9-5v10zM180 18l-5 9h10z" />
    </g>
  );
}

function Scene({
  kind,
  variant,
  step,
  accent,
  reduced,
}: {
  kind: MathAnimationKind;
  variant?: MathAnimationVariant;
  step: number;
  accent: string;
  reduced: boolean;
}) {
  const common = draw(reduced);
  if (kind === "asymptote") {
    return <AsymptoteScene step={step} accent={accent} reduced={reduced} />;
  }
  if (kind === "tangent-plane") {
    return (
      <svg viewBox="0 0 360 300" role="img" aria-label="曲面在原点的切平面">
        <path d="M44 224 Q178 55 316 202 Q188 270 44 224Z" fill="#dbeafe" stroke="#60a5fa" />
        <motion.path
          d="M66 225 Q178 78 300 198"
          fill="none" stroke={accent} strokeWidth="4" {...common}
        />
        {step >= 1 && (
          <motion.polygon
            points="72,230 202,92 305,186 172,270"
            fill={`${accent}2b`} stroke={accent} strokeWidth="3"
            initial={reduced ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          />
        )}
        <motion.circle cx="178" cy="202" r="7" fill="#111827" animate={reduced ? { scale: 1 } : { scale: [1, 1.3, 1] }} />
        {step >= 2 && <text x="195" y="220">z = x + 2y</text>}
      </svg>
    );
  }
  if (kind === "tangent-intercept") {
    return (
      <svg viewBox="0 0 360 300" role="img" aria-label="曲线切线与纵轴截距">
        <Axes />
        <motion.path d="M42 252 C105 240 145 198 180 142 C220 80 275 66 326 92" fill="none" stroke={accent} strokeWidth="5" {...common} />
        <motion.circle cx="220" cy="91" r="7" fill="#111827" animate={reduced ? { scale: 1 } : { scale: [1, 1.25, 1] }} />
        {step >= 1 && <motion.line x1="82" y1="203" x2="310" y2="18" stroke="#f59e0b" strokeWidth="3" {...common} />}
        {step >= 1 && <text x="188" y="80">P(x,y)</text>}
        {step >= 2 && (
          <motion.g initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
            <line x1="180" y1="150" x2="220" y2="150" stroke="#e11d48" strokeWidth="4" />
            <line x1="180" y1="123" x2="180" y2="150" stroke="#e11d48" strokeWidth="4" />
            <text x="193" y="170">距离 x</text>
            <text x="98" y="118">截距 y-xy′</text>
          </motion.g>
        )}
      </svg>
    );
  }
  if (kind === "cylindrical-solid") {
    return (
      <svg viewBox="0 0 360 300" role="img" aria-label="单位圆盘上方的柱体区域">
        <ellipse cx="180" cy="238" rx="112" ry="38" fill="#d1fae5" stroke="#10b981" strokeWidth="3" />
        <motion.path d="M68 238V116 M292 238V76" stroke={accent} strokeWidth="4" {...common} />
        <motion.path d="M68 116 Q180 68 292 76 Q180 126 68 116Z" fill={`${accent}38`} stroke={accent} strokeWidth="3" {...common} />
        {step >= 1 && <motion.ellipse cx="180" cy="238" rx="112" ry="38" fill="none" stroke="#111827" strokeWidth="3" initial={reduced ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} />}
        {step >= 2 && (
          <motion.g initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
            <line x1="238" y1="220" x2="238" y2="98" stroke="#f59e0b" strokeWidth="6" />
            <text x="247" y="157">0 ≤ z ≤ 1-x</text>
          </motion.g>
        )}
      </svg>
    );
  }
  if (kind === "integral-region") {
    return <IntegralRegionScene step={step} accent={accent} reduced={reduced} />;
  }
  if (kind === "radial-density") {
    if (variant === "probability-three-results-v1") {
      return <ProbabilityResultsScene step={step} accent={accent} reduced={reduced} />;
    }
    return <RadialDensityScene step={step} accent={accent} reduced={reduced} />;
  }

  const unsupportedKind: never = kind;
  throw new Error(`Unsupported animation kind: ${unsupportedKind}`);
}

export function MathAnimation({ spec }: { spec: MathAnimationSpec }) {
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const reduced = Boolean(useReducedMotion());

  useEffect(() => {
    if (!playing) return;
    if (step >= spec.steps.length - 1) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((current) => current + 1), 2200);
    return () => window.clearTimeout(timer);
  }, [playing, spec.steps.length, step]);

  return (
    <section className="math-animation-card" style={{ "--animation-accent": spec.accent } as CSSProperties}>
      <div className="math-animation-copy">
        <span className="section-label">动态解析 · 登录专享</span>
        <h3>{spec.title}</h3>
        <p>{spec.summary}</p>
        <div className="math-animation-steps" role="group" aria-label="动画讲解步骤">
          {spec.steps.map((item, index) => (
            <button
              key={item.title}
              className={step === index ? "active" : ""}
              onClick={() => {
                setPlaying(false);
                setStep(index);
              }}
            >
              <span>{index + 1}</span>
              {item.title}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.p
            className="math-animation-explanation"
            key={step}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
          >
            {spec.steps[step]?.body}
          </motion.p>
        </AnimatePresence>
        <button
          className="button secondary animation-play"
          onClick={() => {
            if (step >= spec.steps.length - 1) setStep(0);
            setPlaying((current) => !current);
          }}
        >
          {playing ? "暂停讲解" : step >= spec.steps.length - 1 ? "重新播放" : "自动播放"}
        </button>
      </div>
      <div className="math-animation-stage">
        <Scene
          kind={spec.kind}
          variant={spec.variant}
          step={step}
          accent={spec.accent}
          reduced={reduced}
        />
      </div>
    </section>
  );
}
