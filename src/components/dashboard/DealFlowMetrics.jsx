import React, { useState, useEffect } from "react";
import { getDealFlowData } from "@/functions/getDealFlowData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, DollarSign, Clock, CheckCircle, RefreshCw, Zap } from "lucide-react";

const PIPELINE_STAGES = [
  { key: "new", label: "New Leads", color: "bg-blue-500", textColor: "text-blue-700", bg: "bg-blue-50" },
  { key: "under_review", label: "Under Review", color: "bg-amber-500", textColor: "text-amber-700", bg: "bg-amber-50" },
  { key: "offer_sent", label: "Offer Sent", color: "bg-purple-500", textColor: "text-purple-700", bg: "bg-purple-50" },
  { key: "contract", label: "Under Contract", color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "closed", label: "Closed", color: "bg-slate-500", textColor: "text-slate-700", bg: "bg-slate-50" },
];

export default function DealFlowMetrics({ searchQuery = "" }) {
  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFallback, setIsFallback] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await getDealFlowData({ endpoint: '/metrics', search: searchQuery });
      if (res.data?.fallback || res.data?.error) {
        setIsFallback(true);
        setMetrics(getMockMetrics());
      } else {
        setIsFallback(false);
        setMetrics(res.data?.data || getMockMetrics());
      }
    } catch {
      setIsFallback(true);
      setMetrics(getMockMetrics());
    }
    setIsLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchMetrics();
  }, [searchQuery]);

  if (isLoading) {
    return (
      <Card className="glass-effect border-slate-200/50 shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-amber-500" />
            Live Deal Flow Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 animate-pulse">
            {PIPELINE_STAGES.map(s => (
              <div key={s.key} className="flex-1 h-20 bg-slate-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-amber-500" />
            Live Deal Flow Pipeline
            {isFallback && (
              <Badge variant="outline" className="text-xs text-slate-500 ml-2">Demo Data</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button size="icon" variant="ghost" onClick={fetchMetrics} className="h-7 w-7">
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Pipeline stages */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {PIPELINE_STAGES.map(stage => {
            const count = metrics?.pipeline?.[stage.key] ?? 0;
            const value = metrics?.pipeline_value?.[stage.key] ?? 0;
            return (
              <div key={stage.key} className={`${stage.bg} rounded-xl p-3 border border-${stage.color.replace('bg-', '')}/20`}>
                <div className={`w-2 h-2 rounded-full ${stage.color} mb-2`} />
                <p className="text-xs text-slate-500 font-medium">{stage.label}</p>
                <p className={`text-2xl font-bold ${stage.textColor}`}>{count}</p>
                {value > 0 && (
                  <p className="text-xs text-slate-400 mt-1">${(value / 1000).toFixed(0)}K</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Total Pipeline Value</p>
            <p className="text-lg font-bold text-slate-900">
              ${((metrics?.total_pipeline_value || 0) / 1000000).toFixed(1)}M
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Avg Days to Close</p>
            <p className="text-lg font-bold text-slate-900">{metrics?.avg_days_to_close || 0}d</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-slate-500 mb-1">Close Rate</p>
            <p className="text-lg font-bold text-emerald-600">{metrics?.close_rate || 0}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getMockMetrics() {
  return {
    pipeline: { new: 34, under_review: 18, offer_sent: 9, contract: 4, closed: 12 },
    pipeline_value: { new: 2100000, under_review: 1400000, offer_sent: 720000, contract: 380000, closed: 1200000 },
    total_pipeline_value: 5800000,
    avg_days_to_close: 22,
    close_rate: 31
  };
}