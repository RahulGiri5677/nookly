import { cn } from "@/lib/utils";
interface NookLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}
export function NookLogo({
  size = "md",
  className
}: NookLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-5xl"
  };
  return <h1 className={cn("font-semibold tracking-tight text-foreground", sizeClasses[size], className)}>Nook</h1>;
}