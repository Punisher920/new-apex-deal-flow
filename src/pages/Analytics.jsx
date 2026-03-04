import React, { useState, useEffect } from "react";
import { getAnalyticsData } from "@/functions/getAnalyticsData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  BarChart3, TrendingUp, Users, DollarSign, Target, MessageCircle,
  RefreshCw, MapPin, Star, ArrowUpRight, Percent
} from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316"];

function StatCard({ icon: Icon, label, value, sub, color = "amber" }) {
  const colorMap = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card className="shadow-sm">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    const res = await getAnalyticsData({});
    if (res.data?.success) {
      setData(res.data);
    } else {
      setError(res.data?.error || "Failed to load analytics");
    }
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600 mb-4">{error || "No data available"}</p>
          <Button onClick={loadData}>Retry</Button>
        </div>
      </div>
    );
  }

  const { summary, pipeline_stats, score_distribution, outreach_by_method, outreach_by_status, source_breakdown, market_breakdown, monthly_trend, buyer_stats } = data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-1">Analytics Dashboard</h1>
            <p className="text-slate-500">Deal performance, market trends & outreach insights</p>
          </div>
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8"
        >
          <StatCard icon={Target} label="Total Leads" value={summary.total_leads} color="blue" />
          <StatCard icon={Star} label="Hot Leads" value={summary.hot_leads} sub="Score 80+" color="red" />
          <StatCard icon={MessageCircle} label="Outreach Sent" value={summary.total_outreach} color="purple" />
          <StatCard icon={Percent} label="Response Rate" value={`${summary.response_rate}%`} color="green" />
          <StatCard icon={DollarSign} label="Deals Closed" value={summary.total_deals_closed} color="amber" />
        </motion.div>

        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList className="bg-white shadow-sm border border-slate-200 p-1 rounded-xl">
            <TabsTrigger value="pipeline" className="rounded-lg">Pipeline</TabsTrigger>
            <TabsTrigger value="outreach" className="rounded-lg">Outreach</TabsTrigger>
            <TabsTrigger value="markets" className="rounded-lg">Markets</TabsTrigger>
            <TabsTrigger value="buyers" className="rounded-lg">Buyers</TabsTrigger>
            <TabsTrigger value="trends" className="rounded-lg">Trends</TabsTrigger>
          </TabsList>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-base">Pipeline Stage Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={pipeline_stats} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="stage" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-base">Lead Score Distribution</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={score_distribution.filter(s => s.count > 0)}
                        dataKey="count"
                        nameKey="label"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ label, count }) => `${label}: ${count}`}
                      >
                        {score_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Lead Sources</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={source_breakdown} layout="vertical" margin={{ left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="source" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Outreach Tab */}
          <TabsContent value="outreach" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
              <StatCard icon={MessageCircle} label="Total Contacts" value={summary.total_outreach} color="blue" />
              <StatCard icon={ArrowUpRight} label="Response Rate" value={`${summary.response_rate}%`} color="green" />
              <StatCard icon={Star} label="Interest Rate" value={`${summary.interest_rate}%`} color="amber" />
              <StatCard icon={Users} label="Interested" value={outreach_by_status.find(s => s.status === "Interested")?.count || 0} color="purple" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-base">Outreach by Method</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={outreach_by_method.filter(m => m.count > 0)} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={90} label={({ method, count }) => `${method}: ${count}`}>
                        {outreach_by_method.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader><CardTitle className="text-base">Outreach Funnel</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={outreach_by_status} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="status" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {outreach_by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Markets Tab */}
          <TabsContent value="markets" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-amber-500" />ROI Analysis by Market</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={market_breakdown} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="city" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="count" name="Total Leads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="closed" name="Closed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {market_breakdown.map((market, i) => (
                <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-slate-900">{market.city}, {market.state}</h4>
                        <p className="text-sm text-slate-500">{market.count} leads total</p>
                      </div>
                      <Badge className={parseFloat(market.conversionRate) > 10 ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}>
                        {market.conversionRate}% closed
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Avg Value</span>
                        <span className="font-medium">${market.count > 0 ? Math.round(market.totalValue / market.count).toLocaleString() : 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Closed Deals</span>
                        <span className="font-medium text-emerald-600">{market.closed}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {market_breakdown.length === 0 && (
                <div className="col-span-3 text-center py-12 text-slate-400">
                  No market data yet. Add properties to see market breakdowns.
                </div>
              )}
            </div>
          </TabsContent>

          {/* Buyers Tab */}
          <TabsContent value="buyers" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Buyers" value={buyer_stats.total} color="blue" />
              <StatCard icon={TrendingUp} label="Active Buyers" value={buyer_stats.active} color="green" />
              <StatCard icon={Star} label="VIP / A-List" value={buyer_stats.vip} color="amber" />
              <StatCard icon={DollarSign} label="Total Volume" value={`$${(buyer_stats.total_volume / 1000000).toFixed(1)}M`} color="purple" />
            </div>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">Buyer Conversion Funnel</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Total Buyers", value: buyer_stats.total, color: "bg-blue-500", pct: 100 },
                    { label: "Active Buyers", value: buyer_stats.active, color: "bg-emerald-500", pct: buyer_stats.total > 0 ? Math.round((buyer_stats.active / buyer_stats.total) * 100) : 0 },
                    { label: "VIP / A-List", value: buyer_stats.vip, color: "bg-amber-500", pct: buyer_stats.total > 0 ? Math.round((buyer_stats.vip / buyer_stats.total) * 100) : 0 },
                    { label: "Deals Purchased", value: buyer_stats.total_deals, color: "bg-purple-500", pct: buyer_stats.total > 0 ? Math.min(100, Math.round((buyer_stats.total_deals / buyer_stats.total) * 100)) : 0 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-semibold">{item.value} <span className="text-slate-400 font-normal">({item.pct}%)</span></span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" />Monthly Activity Trend (Last 6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={monthly_trend} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="leadsAdded" name="Leads Added" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="outreachSent" name="Outreach Sent" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-3 gap-4">
              {[
                { label: "Avg Response Rate", value: `${summary.response_rate}%`, icon: MessageCircle, color: "blue", trend: "Leads responding to outreach" },
                { label: "Avg Projected ROI", value: `${summary.avg_roi}%`, icon: TrendingUp, color: "green", trend: "Across all MAO calculations" },
                { label: "Interest Rate", value: `${summary.interest_rate}%`, icon: Star, color: "amber", trend: "Leads expressing interest" },
              ].map((item, i) => (
                <Card key={i} className="shadow-sm">
                  <CardContent className="p-6 text-center">
                    <item.icon className={`w-8 h-8 mx-auto mb-3 text-${item.color}-500`} />
                    <p className="text-3xl font-bold text-slate-900 mb-1">{item.value}</p>
                    <p className="font-semibold text-slate-700 mb-1">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.trend}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}