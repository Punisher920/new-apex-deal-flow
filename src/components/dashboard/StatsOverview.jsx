import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Home } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
  >
    <Card className="glass-effect border-slate-200/50 shadow-xl hover:shadow-2xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl lg:text-3xl font-bold text-slate-900">{value}</h3>
              {trend && (
                <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {trend}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function StatsOverview({ properties, highScoreDeals, totalProfit, isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-20 mb-2"></div>
                <div className="h-8 bg-slate-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-slate-200 rounded w-24"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const avgDealScore = properties.length > 0 
    ? (properties.reduce((sum, p) => sum + (p.deal_score || 0), 0) / properties.length).toFixed(1)
    : 0;

  const avgProfit = properties.length > 0
    ? (totalProfit / properties.length).toFixed(0)
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Deals"
        value={properties.length}
        subtitle="Active opportunities"
        icon={Home}
        color="bg-blue-500"
        trend="+12%"
        index={0}
      />
      <StatCard
        title="High Score Deals"
        value={highScoreDeals.length}
        subtitle="Score ≥80"
        icon={Target}
        color="bg-emerald-500"
        trend="+8%"
        index={1}
      />
      <StatCard
        title="Avg Deal Score"
        value={avgDealScore}
        subtitle="AI confidence"
        icon={TrendingUp}
        color="bg-amber-500"
        trend="+5.2"
        index={2}
      />
      <StatCard
        title="Avg Profit"
        value={`$${avgProfit}K`}
        subtitle="Per deal"
        icon={DollarSign}
        color="bg-purple-500"
        trend="+15%"
        index={3}
      />
    </div>
  );
}