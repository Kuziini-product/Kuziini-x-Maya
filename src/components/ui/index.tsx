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
    "inline-flex items-center justify-center gap-2 font-body font-semibold rounded-2xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none select-none";

  const variants = {
    primary:
      "bg-ocean-600 text-white shadow-md hover:bg-ocean-700 active:bg-ocean-800",
    secondary:
      "bg-sand-100 text-sand-800 hover:bg-sand-200 active:bg-sand-300",
    ghost: "bg-transparent text-ocean-600 hover:bg-ocean-50",
    danger: "bg-coral-500 text-white hover:bg-coral-600",
    outline:
      "border-2 border-ocean-200 text-ocean-700 hover:border-ocean-400 bg-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3.5 text-base",
    lg: "px-8 py-4 text-lg",
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
    ocean: "bg-ocean-100 text-ocean-700",
    coral: "bg-coral-100 text-coral-700",
    sand: "bg-sand-100 text-sand-700",
    green: "bg-emerald-100 text-emerald-700",
    gray: "bg-gray-100 text-gray-600",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-body",
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
    <Loader2 className={cn("w-5 h-5 animate-spin text-ocean-500", className)} />
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
        "bg-white rounded-3xl shadow-card p-4",
        onClick && "cursor-pointer hover:shadow-card-hover transition-shadow",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-gray-100", className)} />;
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
      <h3 className="font-display text-xl text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
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
        "font-display text-2xl text-gray-900 leading-tight",
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
    <div className="sticky top-0 z-30 bg-cream/90 backdrop-blur-md border-b border-gray-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {back}
          <div>
            <h1 className="font-display text-lg font-semibold text-gray-900 leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-gray-500 font-body">{subtitle}</p>
            )}
          </div>
        </div>
        {right}
      </div>
    </div>
  );
}
