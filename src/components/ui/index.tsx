"use client";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading,
  icon,
  fullWidth,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold tracking-[0.1em] uppercase transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    primary:
      "bg-[#C9AB81] text-[#0A0A0A] active:opacity-80",
    secondary:
      "bg-white/[0.06] text-white border border-white/[0.1] active:bg-white/[0.1]",
    ghost: "bg-transparent text-[#C9AB81] active:bg-white/[0.06]",
    danger: "bg-red-600/80 text-white active:bg-red-700",
    outline:
      "border border-[#C9AB81]/40 text-[#C9AB81] active:bg-[#C9AB81]/10",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3.5 text-sm",
    lg: "px-8 py-4 text-sm",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "ocean" | "coral" | "sand" | "green" | "gray" | "purple";
}

export function Badge({ children, className, variant = "ocean" }: BadgeProps) {
  const variants = {
    ocean: "bg-[#C9AB81]/20 text-[#C9AB81]",
    coral: "bg-red-500/20 text-red-400",
    sand: "bg-amber-500/20 text-amber-400",
    green: "bg-emerald-500/20 text-emerald-400",
    gray: "bg-white/10 text-white/50",
    purple: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wider uppercase",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("w-5 h-5 animate-spin text-[#C9AB81]", className)} />
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white/[0.03] border border-white/[0.06] p-4",
        onClick && "cursor-pointer active:bg-white/[0.06] transition-all",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-white/[0.08]", className)} />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <span className="text-5xl mb-4">{icon}</span>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-white/40 text-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

// ─── Section Title ─────────────────────────────────────────────────────────────

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-2xl font-bold text-white leading-tight tracking-wide",
        className
      )}
    >
      {children}
    </h2>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="sticky top-0 z-30 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back}
          <div>
            <h1 className="text-xs font-bold tracking-[0.2em] uppercase text-[#C9AB81]">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[10px] text-white/40 tracking-widest uppercase">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}

