import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { cn } from "@/lib/utils";

type Stat = { value: string; label: string };

/**
 * StatGrid — reusable statistics grid. `variant` switches between the
 * translucent style used on dark hero backgrounds and a light card style.
 *
 * Values render as-is rather than counting up: a count-up left the headline
 * figures showing truncated intermediate numbers ("150+" reading as "7+"),
 * which looked like a data error. The cards still animate in via Stagger.
 */
export default function StatGrid({
  stats,
  variant = "light",
  className,
}: {
  stats: Stat[];
  variant?: "light" | "glass";
  className?: string;
}) {
  return (
    <Stagger className={cn("grid grid-cols-2 gap-4", className)}>
      {stats.map((s) => (
        <StaggerItem key={s.label}>
          <div
            className={cn(
              "rounded-xl p-6",
              variant === "glass"
                ? "border border-white/10 bg-white/5 backdrop-blur"
                : "border border-border bg-secondary/50 text-center"
            )}
          >
            <p
              className={cn(
                "text-3xl font-extrabold tabular-nums md:text-4xl",
                variant === "glass" ? "text-accent" : "text-primary"
              )}
            >
              {s.value}
            </p>
            <p
              className={cn(
                "mt-1 text-sm",
                variant === "glass" ? "text-slate-300" : "text-muted-foreground"
              )}
            >
              {s.label}
            </p>
          </div>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
