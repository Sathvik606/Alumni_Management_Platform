import { cn } from '@/lib/utils';

/**
 * GradientGlow — reusable radial lime/chartreuse glow orb.
 * Place absolutely inside a relative container.
 */
export default function GradientGlow({
  size = 'md',
  color = 'lime',
  className = '',
  intensity = 'default',
}) {
  const sizes = {
    sm: 'w-48 h-48',
    md: 'w-96 h-96',
    lg: 'w-[600px] h-[600px]',
    xl: 'w-[900px] h-[900px]',
  };

  const colors = {
    lime: 'rgba(200, 250, 95, 0.12)',
    limeStrong: 'rgba(200, 250, 95, 0.22)',
    white: 'rgba(255, 255, 255, 0.06)',
    teal: 'rgba(56, 217, 169, 0.1)',
  };

  const intensityMap = {
    subtle: 0.6,
    default: 1,
    strong: 1.4,
  };

  const glowColor = colors[color] || colors.lime;
  const scale = intensityMap[intensity] || 1;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute rounded-full blur-3xl',
        sizes[size],
        className,
      )}
      style={{
        background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
        opacity: scale,
      }}
    />
  );
}
