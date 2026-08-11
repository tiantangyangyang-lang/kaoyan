import { motion } from "motion/react";

const reveal = (reduced: boolean, delay = 0) => ({
  initial: reduced ? false : { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: reduced ? 0 : 0.55, delay: reduced ? 0 : delay },
});

const trace = (reduced: boolean, delay = 0) => ({
  initial: reduced ? false : { pathLength: 0, opacity: 0 },
  animate: { pathLength: 1, opacity: 1 },
  transition: {
    duration: reduced ? 0 : 0.85,
    delay: reduced ? 0 : delay,
    ease: "easeInOut" as const,
  },
});

function GraphAxes() {
  return (
    <g className="math-animation-axes">
      <line x1="48" y1="252" x2="326" y2="252" />
      <line x1="70" y1="274" x2="70" y2="24" />
      <path d="M326 252l-9-5v10zM70 24l-5 9h10z" />
      <text x="330" y="266">x</text>
      <text x="55" y="25">y</text>
    </g>
  );
}

export function AsymptoteScene({
  step,
  accent,
  reduced,
}: {
  step: number;
  accent: string;
  reduced: boolean;
}) {
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="用斜率极限和截距极限确定斜渐近线">
      <GraphAxes />
      <motion.line
        x1="74"
        y1="250"
        x2="316"
        y2="56"
        stroke="#94a3b8"
        strokeWidth="2.5"
        strokeDasharray="7 7"
        {...trace(reduced)}
      />
      <text x="246" y="98" className="math-animation-muted">y=x</text>

      <motion.path
        d="M92 203 C150 157 224 98 316 28"
        fill="none"
        stroke={accent}
        strokeWidth="5"
        strokeLinecap="round"
        {...trace(reduced, 0.08)}
      />
      <text x="90" y="192" className="math-animation-accent">原曲线</text>

      {step === 0 ? (
        <motion.g {...reveal(reduced, 0.2)}>
          <line x1="70" y1="252" x2="256" y2="76" stroke="#0f172a" strokeWidth="2.5" />
          <circle cx="256" cy="76" r="6" fill="#0f172a" />
          <text x="266" y="75">P(x,y)</text>
          <text x="156" y="224" className="math-animation-formula">y/x → 1</text>
          <text x="145" y="243" className="math-animation-muted">远端方向与 y=x 平行</text>
        </motion.g>
      ) : null}

      {step >= 1 ? (
        <motion.g {...reveal(reduced, 0.12)}>
          <motion.line
            x1="74"
            y1="220"
            x2="316"
            y2="26"
            stroke="#f59e0b"
            strokeWidth="3"
            strokeDasharray="9 6"
            {...trace(reduced, 0.1)}
          />
          <line x1="286" y1="80" x2="286" y2="56" stroke="#e11d48" strokeWidth="4" />
          <path d="M281 80h10M281 56h10" stroke="#e11d48" strokeWidth="2" />
          <text x="192" y="52" className="math-animation-warm">y=x+1/e</text>
          <text x="294" y="72" className="math-animation-warning">1/e</text>
          <text x="137" y="275" className="math-animation-formula">y-x → 1/e</text>
        </motion.g>
      ) : null}

      {step >= 2 ? (
        <motion.g {...reveal(reduced, 0.2)}>
          <rect x="216" y="112" width="112" height="38" rx="19" fill="#fff7ed" stroke="#f59e0b" />
          <text x="232" y="137" className="math-animation-warm">答案 B</text>
          <motion.circle
            cx="308"
            cy="34"
            r="7"
            fill={accent}
            animate={reduced ? undefined : { scale: [1, 1.3, 1] }}
            transition={{ duration: 1.2, repeat: reduced ? 0 : Infinity }}
          />
        </motion.g>
      ) : null}
    </svg>
  );
}

const regionPath =
  "M60 50 H300 L300 250 Q180 -150 60 250 Z";
const parabolaPath =
  "M60 250 Q180 -150 300 250";

export function IntegralRegionScene({
  step,
  accent,
  reduced,
}: {
  step: number;
  accent: string;
  reduced: boolean;
}) {
  const verticalSlices = [78, 106, 138, 222, 254, 282];
  const leftBoundary = 95;
  const rightBoundary = 265;

  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="积分区域从竖切换成左右两段横切">
      <g className="math-animation-axes">
        <line x1="38" y1="250" x2="322" y2="250" />
        <line x1="180" y1="278" x2="180" y2="28" />
        <path d="M322 250l-9-5v10zM180 28l-5 9h10z" />
      </g>
      <motion.path
        d={regionPath}
        fill={`${accent}24`}
        stroke="none"
        {...reveal(reduced)}
      />
      <motion.path d={parabolaPath} fill="none" stroke={accent} strokeWidth="4" {...trace(reduced)} />
      <line x1="60" y1="50" x2="300" y2="50" stroke="#0f172a" strokeWidth="3" />
      <text x="304" y="54">y=4</text>
      <text x="245" y="224" className="math-animation-accent">y=4-x²</text>
      <text x="52" y="270">-2</text>
      <text x="294" y="270">2</text>

      {step === 0 ? (
        <motion.g {...reveal(reduced, 0.15)}>
          {verticalSlices.map((x, index) => (
            <motion.line
              key={x}
              x1={x}
              y1="50"
              x2={x}
              y2={50 + ((x - 180) ** 2) / 72}
              stroke="#f59e0b"
              strokeWidth="4"
              initial={reduced ? false : { pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: reduced ? 0 : 0.45, delay: reduced ? 0 : index * 0.08 }}
            />
          ))}
          <text x="100" y="291" className="math-animation-formula">-2≤x≤2，4-x²≤y≤4</text>
        </motion.g>
      ) : null}

      {step >= 1 ? (
        <motion.g {...reveal(reduced, 0.12)}>
          <line x1="60" y1="150" x2={leftBoundary} y2="150" stroke="#f59e0b" strokeWidth="8" />
          <line x1={rightBoundary} y1="150" x2="300" y2="150" stroke="#f59e0b" strokeWidth="8" />
          <line x1={leftBoundary} y1="150" x2={rightBoundary} y2="150" stroke="#94a3b8" strokeWidth="3" strokeDasharray="7 6" />
          <circle cx={leftBoundary} cy="150" r="5" fill="#0f172a" />
          <circle cx={rightBoundary} cy="150" r="5" fill="#0f172a" />
          <text x="130" y="139" className="math-animation-muted">中间不属于 D</text>
          <text x="128" y="171" className="math-animation-formula">x² ≥ 4-y</text>
        </motion.g>
      ) : null}

      {step >= 2 ? (
        <motion.g {...reveal(reduced, 0.18)}>
          <path d="M60 186v8h35v-8M265 186v8h35v-8" fill="none" stroke="#e11d48" strokeWidth="2.5" />
          <text x="44" y="214" className="math-animation-warning">[-2,-√(4-y)]</text>
          <text x="242" y="214" className="math-animation-warning">[√(4-y),2]</text>
          <rect x="135" y="224" width="90" height="34" rx="17" fill="#fff1f2" stroke="#e11d48" />
          <text x="157" y="246" className="math-animation-warning">选 A</text>
        </motion.g>
      ) : null}
    </svg>
  );
}

export function RadialDensityScene({
  step,
  accent,
  reduced,
}: {
  step: number;
  accent: string;
  reduced: boolean;
}) {
  return (
    <svg viewBox="0 0 360 300" role="img" aria-label="径向概率从单位圆盘变换为Z的线性密度">
      <defs>
        <radialGradient id="radial-density-gradient">
          <stop offset="0%" stopColor={accent} stopOpacity="0.08" />
          <stop offset="65%" stopColor={accent} stopOpacity="0.28" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.78" />
        </radialGradient>
      </defs>

      {step === 0 ? (
        <motion.g {...reveal(reduced)}>
          <circle cx="180" cy="142" r="92" fill="url(#radial-density-gradient)" stroke={accent} strokeWidth="3" />
          {[30, 52, 72].map((radius, index) => (
            <motion.circle
              key={radius}
              cx="180"
              cy="142"
              r={radius}
              fill="none"
              stroke={accent}
              strokeOpacity={0.25 + index * 0.15}
              strokeWidth="3"
              initial={reduced ? false : { scale: 0.65, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : index * 0.12 }}
            />
          ))}
          <line x1="180" y1="142" x2="272" y2="142" stroke="#0f172a" strokeWidth="3" />
          <text x="222" y="132">r</text>
          <text x="117" y="262" className="math-animation-formula">f(x,y)=(2/π)r²</text>
          <text x="113" y="282" className="math-animation-muted">越靠外，单位面积密度越大</text>
        </motion.g>
      ) : null}

      {step === 1 ? (
        <motion.g {...reveal(reduced)}>
          <circle cx="180" cy="135" r="96" fill="#f8fafc" stroke="#94a3b8" strokeWidth="3" />
          <motion.circle
            cx="180"
            cy="135"
            r="67"
            fill={`${accent}55`}
            stroke={accent}
            strokeWidth="4"
            initial={reduced ? false : { r: 8, opacity: 0.35 }}
            animate={{ r: 67, opacity: 1 }}
            transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut" }}
          />
          <line x1="180" y1="135" x2="247" y2="135" stroke="#0f172a" strokeWidth="3" />
          <text x="198" y="124">√z</text>
          <text x="103" y="257" className="math-animation-formula">F_Z(z)=P(r²≤z)=z²</text>
          <text x="125" y="280" className="math-animation-muted">0≤z≤1</text>
        </motion.g>
      ) : null}

      {step >= 2 ? (
        <motion.g {...reveal(reduced)}>
          <circle cx="82" cy="136" r="58" fill={`${accent}22`} stroke={accent} strokeWidth="3" />
          <line x1="82" y1="136" x2="140" y2="136" stroke="#0f172a" strokeWidth="2.5" />
          <text x="98" y="126">r</text>
          <motion.path d="M146 136h34" stroke="#64748b" strokeWidth="3" {...trace(reduced)} />
          <path d="M171 130l10 6-10 6z" fill="#64748b" />

          <line x1="205" y1="234" x2="326" y2="234" stroke="#94a3b8" strokeWidth="2" />
          <line x1="205" y1="250" x2="205" y2="55" stroke="#94a3b8" strokeWidth="2" />
          <motion.path d="M205 234 L315 74 L315 234 Z" fill={`${accent}28`} stroke="none" {...reveal(reduced, 0.1)} />
          <motion.line x1="205" y1="234" x2="315" y2="74" stroke={accent} strokeWidth="5" {...trace(reduced, 0.12)} />
          <text x="198" y="252">0</text>
          <text x="310" y="252">1</text>
          <text x="318" y="78">2</text>
          <text x="220" y="58" className="math-animation-formula">f_Z(z)=2z</text>
          <text x="58" y="224">Z=r²</text>
          <text x="104" y="280" className="math-animation-muted">圆盘累积 → 对 z 求导 → 线性密度</text>
        </motion.g>
      ) : null}
    </svg>
  );
}
