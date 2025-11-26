import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  TrendingUp, TrendingDown, MapPin, DollarSign, Home, Clock, BarChart3, 
  RefreshCw, Bot, Loader2, Plus, Building, Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MarketAnalysis() {
  const [markets, setMarkets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMarket, setNewMarket] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatingMarket, setUpdatingMarket] = useState(null);

  useEffect(() => {
    loadMarkets();
  }, []);

  const loadMarkets = async () => {
    setIsLoading(true);
    try {
      const data = await base44.entities.MarketData.list("-last_updated", 50);
      setMarkets(data);
    } catch (error) {
      console.error("Error loading markets:", error);
    }
    setIsLoading(false);
  };

  const addAndUpdateMarket = async () => {
    if (!newMarket.trim()) return;
    setIsUpdating(true);

    try {
      // Use AI to fetch market data
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Search for current real estate market data for ${newMarket}. Find:
1. Median sale price
2. Average sale price
3. Price per square foot
4. Average days on market
5. Current inventory count
6. Average rental rate
7. Rental yield percentage
8. Cap rate
9. 3-month, 6-month, and 12-month price trends
10. Foreclosure rate
11. Market type (buyer's, seller's, or balanced)
12. ZIP code for this area

Use current data from Zillow, Realtor.com, Redfin, and local MLS sources.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            city: { type: "string" },
            state: { type: "string" },
            zip_code: { type: "string" },
            median_sale_price: { type: "number" },
            avg_sale_price: { type: "number" },
            price_per_sqft: { type: "number" },
            avg_days_on_market: { type: "number" },
            inventory_count: { type: "number" },
            avg_rental_rate: { type: "number" },
            rental_yield: { type: "number" },
            cap_rate: { type: "number" },
            price_trend_3m: { type: "number" },
            price_trend_6m: { type: "number" },
            price_trend_12m: { type: "number" },
            foreclosure_rate: { type: "number" },
            market_type: { type: "string" },
            wholesale_activity_score: { type: "number" },
            investor_demand_score: { type: "number" }
          }
        }
      });

      // Create market data record
      await base44.entities.MarketData.create({
        ...response,
        last_updated: new Date().toISOString(),
        data_source: "AI Web Search"
      });

      setNewMarket("");
      await loadMarkets();

    } catch (error) {
      console.error("Error adding market:", error);
    }
    setIsUpdating(false);
  };

  const refreshMarket = async (market) => {
    setUpdatingMarket(market.id);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Get CURRENT real estate market data for ${market.city}, ${market.state} (ZIP: ${market.zip_code}). Return updated pricing, inventory, trends, and market conditions.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            median_sale_price: { type: "number" },
            avg_sale_price: { type: "number" },
            price_per_sqft: { type: "number" },
            avg_days_on_market: { type: "number" },
            inventory_count: { type: "number" },
            avg_rental_rate: { type: "number" },
            rental_yield: { type: "number" },
            cap_rate: { type: "number" },
            price_trend_3m: { type: "number" },
            price_trend_6m: { type: "number" },
            price_trend_12m: { type: "number" },
            foreclosure_rate: { type: "number" },
            market_type: { type: "string" },
            wholesale_activity_score: { type: "number" },
            investor_demand_score: { type: "number" }
          }
        }
      });

      await base44.entities.MarketData.update(market.id, {
        ...response,
        last_updated: new Date().toISOString()
      });

      await loadMarkets();
    } catch (error) {
      console.error("Error refreshing market:", error);
    }
    setUpdatingMarket(null);
  };

  const generateMonthlyReport = async () => {
    setIsUpdating(true);
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "apex_deal_flow_manager",
        metadata: { name: `Monthly Market Report - ${new Date().toLocaleDateString()}` }
      });

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `Generate a comprehensive monthly market report:

1. READ all MarketData records
2. For each market, summarize:
   - Current median price and trend direction
   - Days on market and inventory levels
   - Best investment opportunities
   - Wholesale activity score
3. Identify the TOP 3 markets for wholesale deals based on:
   - High inventory
   - Longer days on market
   - Price decline trends
   - High wholesale activity scores
4. Identify TOP 3 markets for rental investments based on:
   - Highest rental yields
   - Best cap rates
   - Price appreciation potential
5. Provide specific actionable recommendations

Create an Alert record with the report summary.`
      });

    } catch (error) {
      console.error("Error generating report:", error);
    }
    setIsUpdating(false);
  };

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(amount || 0);

  const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

  const getTrendIcon = (value) => {
    if (value > 0) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
    if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <span className="w-4 h-4 text-slate-400">—</span>;
  };

  const getMarketTypeColor = (type) => {
    switch (type) {
      case "Buyer's Market": return "bg-emerald-100 text-emerald-800";
      case "Seller's Market": return "bg-red-100 text-red-800";
      default: return "bg-blue-100 text-blue-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Market Analysis</h1>
            <p className="text-slate-600 text-lg">AI-powered market data for accurate ARV and deal scoring</p>
          </div>
          <Button onClick={generateMonthlyReport} disabled={isUpdating} className="bg-purple-600 hover:bg-purple-700">
            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            Generate Monthly Report
          </Button>
        </div>

        {/* Add Market */}
        <Card className="glass-effect border-slate-200/50 shadow-xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              Add Target Market
            </CardTitle>
            <CardDescription>Enter a city, state, or ZIP code to track market data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="e.g., Tampa, FL or 33602"
                value={newMarket}
                onChange={(e) => setNewMarket(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && addAndUpdateMarket()}
              />
              <Button onClick={addAndUpdateMarket} disabled={isUpdating || !newMarket.trim()}>
                {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
                Analyze Market
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Markets Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : markets.length === 0 ? (
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertTitle>No Markets Added</AlertTitle>
            <AlertDescription>Add a target market above to start tracking real estate data.</AlertDescription>
          </Alert>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {markets.map((market, index) => (
                <motion.div
                  key={market.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-effect border-slate-200/50 shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            {market.city}, {market.state}
                          </CardTitle>
                          <p className="text-slate-500 text-sm">ZIP: {market.zip_code}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={getMarketTypeColor(market.market_type)}>
                            {market.market_type || "Unknown"}
                          </Badge>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => refreshMarket(market)}
                            disabled={updatingMarket === market.id}
                          >
                            {updatingMarket === market.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {/* Key Metrics */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-600">Median Price</p>
                          <p className="font-bold text-sm">{formatCurrency(market.median_sale_price)}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <Home className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-600">$/SqFt</p>
                          <p className="font-bold text-sm">${market.price_per_sqft || 0}</p>
                        </div>
                        <div className="text-center p-3 bg-slate-50 rounded-lg">
                          <Clock className="w-5 h-5 text-purple-500 mx-auto mb-1" />
                          <p className="text-xs text-slate-600">Days on Market</p>
                          <p className="font-bold text-sm">{market.avg_days_on_market || 0}</p>
                        </div>
                      </div>

                      {/* Trends */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="p-2 bg-slate-50 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {getTrendIcon(market.price_trend_3m)}
                            <span className="text-xs font-medium">3M</span>
                          </div>
                          <p className={`text-sm font-bold ${market.price_trend_3m >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatPercent(market.price_trend_3m)}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {getTrendIcon(market.price_trend_6m)}
                            <span className="text-xs font-medium">6M</span>
                          </div>
                          <p className={`text-sm font-bold ${market.price_trend_6m >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatPercent(market.price_trend_6m)}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            {getTrendIcon(market.price_trend_12m)}
                            <span className="text-xs font-medium">12M</span>
                          </div>
                          <p className={`text-sm font-bold ${market.price_trend_12m >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatPercent(market.price_trend_12m)}
                          </p>
                        </div>
                      </div>

                      {/* Investment Metrics */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-emerald-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-700">Rental Yield</span>
                          </div>
                          <p className="text-lg font-bold text-emerald-900">{formatPercent(market.rental_yield)}</p>
                          <p className="text-xs text-emerald-600">Avg Rent: {formatCurrency(market.avg_rental_rate)}/mo</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <Percent className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">Cap Rate</span>
                          </div>
                          <p className="text-lg font-bold text-purple-900">{formatPercent(market.cap_rate)}</p>
                          <p className="text-xs text-purple-600">Inventory: {market.inventory_count || 0}</p>
                        </div>
                      </div>

                      {/* Scores */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-center">
                          <p className="text-xs text-amber-700">Wholesale Activity</p>
                          <p className="text-lg font-bold text-amber-900">{market.wholesale_activity_score || 0}/100</p>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-center">
                          <p className="text-xs text-blue-700">Investor Demand</p>
                          <p className="text-lg font-bold text-blue-900">{market.investor_demand_score || 0}/100</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-4 text-right">
                        Updated: {market.last_updated ? new Date(market.last_updated).toLocaleDateString() : 'Never'}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}