const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function BadgeRing({
  percent,
  color,
}: {
  percent: number;
  color: string;
}) {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const obtained = percent >= 100;

  return (
    <div className="relative w-[46px] h-[46px] mx-auto">
      <svg width="46" height="46" className="-rotate-90">
        <circle cx="23" cy="23" r={RADIUS} stroke="#2B2B38" strokeWidth="3" fill="none" />
        <circle
          cx="23"
          cy="23"
          r={RADIUS}
          stroke={color}
          strokeWidth="3"
          fill="none"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold"
        style={{ color }}
      >
        {obtained ? "✓" : `${percent}%`}
      </span>
    </div>
  );
}
