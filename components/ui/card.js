import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-white/10 bg-white/5 shadow-glow backdrop-blur-xl",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-2 p-6", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />
  );
}

export function CardDescription({ className, ...props }) {
  return (
    <p className={cn("text-sm leading-6 text-muted-foreground", className)} {...props} />
  );
}

export function CardContent({ className, ...props }) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return (
    <div className={cn("flex items-center gap-3 px-6 pb-6 pt-1", className)} {...props} />
  );
}
