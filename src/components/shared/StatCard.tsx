"use client";

import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend: { value: string; positive: boolean };
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-slate">{title}</p>
          <p className="text-2xl font-semibold text-navy">{value}</p>
        </div>
        <div className="rounded-lg bg-gold/10 p-2.5">
          <Icon className="h-5 w-5 text-gold-dark" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {trend.positive ? (
          <TrendingUp className="h-4 w-4 text-emerald-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-500" />
        )}
        <span
          className={cn(
            "text-xs font-semibold",
            trend.positive ? "text-emerald-600" : "text-red-500"
          )}
        >
          {trend.value}
        </span>
        <span className="text-xs text-slate">vs mois dernier</span>
      </div>
    </motion.div>
  );
}
