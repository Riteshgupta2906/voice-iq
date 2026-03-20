import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn(
        "h-2 w-full overflow-hidden rounded-full bg-white/10",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary via-cyan-300 to-amber-300 transition-all duration-500"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}
