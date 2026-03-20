import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  );
}
