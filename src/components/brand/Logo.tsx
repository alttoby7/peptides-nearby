type LogoProps = {
  size?: number;
  variant?: "full" | "mark";
};

export function LogoMark({ size = 28, decorative = false }: { size?: number; decorative?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="shrink-0"
      aria-hidden={decorative || undefined} role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : "Peptides Nearby"}>
      <path d="M16 28L8 18L7 10L16 5L25 10L24 18Z" fill="#0ea5e9" fillOpacity="0.16" />
      <path d="M8 18L16 28L24 18" stroke="#059669" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 18L7 10L16 5L25 10L24 18" stroke="#0ea5e9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="14" r="3" fill="#0f172a" />
      <g fill="#0ea5e9">
        <circle cx="7" cy="10" r="4" />
        <circle cx="16" cy="5" r="4" />
        <circle cx="25" cy="10" r="4" />
      </g>
      <g fill="#059669">
        <circle cx="8" cy="18" r="4" />
        <circle cx="24" cy="18" r="4" />
      </g>
    </svg>
  );
}

export function Logo({ size = 28, variant = "full" }: LogoProps) {
  if (variant === "mark") return <LogoMark size={size} />;
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-text-primary" style={{ fontSize: size * 17 / 28 }}>
      <LogoMark size={size} decorative />
      <span className="font-body font-bold tracking-tight">Peptides <span className="font-display text-[1.18em] font-normal">Nearby</span></span>
    </span>
  );
}
