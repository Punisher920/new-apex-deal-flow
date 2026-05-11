import React, { useState, useEffect, useCallback } from "react";
import { Property, Alert } from "@/entities/all";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  MapPin, 
  Search,
  Filter,
  Sparkles,
  BarChart3,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import StatsOverview from "../components/dashboard/StatsOverview";
import PropertyMap from "../components/dashboard/PropertyMap";
import DealCard from "../components/dashboard/DealCard";
import FilterPanel from "../components/dashboard/FilterPanel";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import DealFlowMetrics from "../components/dashboard/DealFlowMetrics";
import AgentHub from "../components/dashboard/AgentHub";

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [isNLSearching, setIsNLSearching] = useState(false);
  const [nlSearchResult, setNLSearchResult] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minDealScore: 70,
    maxPrice: 500000,
    minProfit: 10000,
    propertyType: "all",
    location: "all"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [propertiesData, alertsData] = await Promise.all([
        Property.list("-deal_score", 50),
        Alert.filter({ viewed: false }, "-created_date", 10)
      ]);
      setProperties(propertiesData);
      setAlerts(alertsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleSearch = async () => {
    const query = searchInput.trim();
    setSearchQuery(query);
    if (!query) { setNLSearchResult(null); return; }

    // Natural language: if it looks like a plain NL query (not an address), use AI to interpret
    const isNL = /find|show|list|deals?|properties|in\s|with\s|under\s|\$|profit|score|bedrooms?/i.test(query);
    if (isNL) {
      setIsNLSearching(true);
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `You are a real estate deal filter assistant. Given this natural language query: "${query}"
Extract structured filter criteria from it as JSON. Return only valid JSON with these optional fields:
{ "city": string, "minScore": number, "maxPrice": number, "minProfit": number, "propertyType": string, "summary": string }
Example: "find flips in Tampa under 300k" -> { "city": "Tampa", "maxPrice": 300000, "summary": "Flips in Tampa under $300K" }`,
          response_json_schema: {
            type: "object",
            properties: {
              city: { type: "string" },
              minScore: { type: "number" },
              maxPrice: { type: "number" },
              minProfit: { type: "number" },
              propertyType: { type: "string" },
              summary: { type: "string" }
            }
          }
        });
        setNLSearchResult(result);
        if (result.maxPrice) setFilters(f => ({ ...f, maxPrice: result.maxPrice }));
        if (result.minScore) setFilters(f => ({ ...f, minDealScore: result.minScore }));
        if (result.minProfit) setFilters(f => ({ ...f, minProfit: result.minProfit }));
      } catch { /* ignore */ }
      setIsNLSearching(false);
    }
  };

  const filteredProperties = properties.filter(property => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      property.address?.toLowerCase().includes(q) ||
      property.city?.toLowerCase().includes(q) ||
      property.state?.toLowerCase().includes(q) ||
      property.zip?.toLowerCase().includes(q) ||
      (nlSearchResult?.city && property.city?.toLowerCase().includes(nlSearchResult.city.toLowerCase()));
    const matchesScore = !property.deal_score || property.deal_score >= filters.minDealScore;
    const matchesPrice = !property.list_price || property.list_price <= filters.maxPrice;
    const matchesProfit = !property.projected_profit || property.projected_profit >= filters.minProfit;
    const matchesType = filters.propertyType === "all" || property.property_type === filters.propertyType;
    const matchesLocation = filters.location === "all" || property.state === filters.location;
    
    return matchesSearch && matchesScore && matchesPrice && matchesProfit && matchesType && matchesLocation;
  });

  const highScoreDeals = filteredProperties.filter(p => p.deal_score >= 80);
  const totalProfit = filteredProperties.reduce((sum, p) => sum + (p.projected_profit || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="p-6 lg:p-8">
        <div className="max-w-8xl mx-auto">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">
                Deal Dashboard
              </h1>
              <p className="text-slate-600 text-lg">
                AI-powered real estate investment opportunities
              </p>
            </div>
            
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder='Search or ask: "Find flips in any city under $300K"'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 pr-24 bg-white/80 backdrop-blur-sm border-slate-200/50"
                />
                <Button
                  size="sm"
                  onClick={handleSearch}
                  disabled={isNLSearching}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs gold-gradient text-white"
                >
                  {isNLSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Sparkles className="w-3 h-3 mr-1" />Search</>}
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-white/80 backdrop-blur-sm border-slate-200/50"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* NL Search Result Banner */}
          {nlSearchResult?.summary && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-amber-800 font-medium">AI Search: {nlSearchResult.summary}</span>
              </div>
              <Button size="sm" variant="ghost" className="h-6 text-xs text-amber-600" onClick={() => { setNLSearchResult(null); setSearchQuery(""); setSearchInput(""); setFilters({ minDealScore: 70, maxPrice: 500000, minProfit: 10000, propertyType: "all", location: "all" }); }}>
                Clear
              </Button>
            </motion.div>
          )}

          {/* Stats Overview */}
          <StatsOverview 
            properties={filteredProperties}
            highScoreDeals={highScoreDeals}
            totalProfit={totalProfit}
            isLoading={isLoading}
          />

          {/* Live Deal Flow Metrics */}
          <div className="mt-8">
            <DealFlowMetrics searchQuery={searchQuery} />
          </div>

          <div className="grid lg:grid-cols-12 gap-8 mt-8">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Map View */}
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <MapPin className="w-5 h-5 text-amber-500" />
                    Deal Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PropertyMap properties={filteredProperties} />
                </CardContent>
              </Card>

              {/* Deal Cards */}
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      Top Deals ({filteredProperties.length})
                    </CardTitle>
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                      {highScoreDeals.length} High Score
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <AnimatePresence>
                      {filteredProperties.slice(0, 10).map((property, index) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <DealCard 
                            property={property} 
                            rank={index + 1}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FilterPanel 
                      filters={filters}
                      onChange={setFilters}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alerts */}
              <AlertsPanel alerts={alerts} onRefresh={loadData} />

              {/* Agent Hub */}
              <AgentHub />

              {/* Market Insights */}
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                    Market Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">🌎 Nationwide Search Active</h4>
                      <p className="text-sm text-blue-700">Search properties across all 50 states — filter by state in the panel</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2">Price Trends</h4>
                      <p className="text-sm text-amber-700">Use AI search to discover top deals in any US market</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}