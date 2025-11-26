
import React, { useState, useEffect } from "react";
import { Property } from "@/entities/all"; // Only Property is imported for listing existing properties
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3,
  MapPin,
  Home,
  DollarSign,
  TrendingUp,
  Calendar,
  Ruler,
  RefreshCw,
  Target,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ComparableAnalysis() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [comparables, setComparables] = useState([]);
  const [marketData, setMarketData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchRadius, setSearchRadius] = useState(1);
  const [timeframe, setTimeframe] = useState(6);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    // This function will now only load properties already saved in our DB (non-Zillow data)
    try {
      const propsData = await Property.list("-created_date", 50);
      setProperties(propsData);
      if (propsData.length > 0) {
        setSelectedProperty(propsData[0]);
        // Do not automatically analyze comparables on load to comply with Zillow data usage rules
      }
    } catch (error) {
      console.error("Error loading properties:", error);
    }
  };

  const analyzeComparables = async (property) => {
    setIsAnalyzing(true);
    setComparables([]); // Clear previous comparables
    setMarketData(null); // Clear previous market data
    try {
      // Generate AI-powered comparable analysis
      const compAnalysis = await InvokeLLM({
        prompt: `Analyze comparable sales for this investment property:

        Subject Property:
        Address: ${property.address}, ${property.city}, ${property.state}
        Beds/Baths: ${property.bedrooms}/${property.bathrooms}
        Square Feet: ${property.square_feet}
        Year Built: ${property.year_built}
        Current Assessment: $${property.assessed_value?.toLocaleString()}

        Find 5-8 recent comparable sales within ${searchRadius} miles sold in the last ${timeframe} months.
        For each comp, provide:
        - Exact address and basic details
        - Sale price and date
        - Price per square foot
        - Distance from subject
        - Quality rating based on similarity
        - Any adjustments needed for size, age, condition, location
        - Final adjusted value

        Also provide current market conditions for ${property.city}, ${property.state} including:
        - Average days on market
        - Price trends
        - Inventory levels
        - Market temperature

        Focus on properties that would be good comparables for ARV estimation.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            comparables: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  comp_address: { type: "string" },
                  comp_city: { type: "string" },
                  comp_state: { type: "string" },
                  comp_zip: { type: "string" },
                  sale_price: { type: "number" },
                  sale_date: { type: "string" },
                  bedrooms: { type: "number" },
                  bathrooms: { type: "number" },
                  square_feet: { type: "number" },
                  year_built: { type: "number" },
                  distance_miles: { type: "number" },
                  price_per_sqft: { type: "number" },
                  days_old: { type: "number" },
                  comp_quality: { type: "string" },
                  adjustments: {
                    type: "object",
                    properties: {
                      size_adjustment: { type: "number" },
                      age_adjustment: { type: "number" },
                      condition_adjustment: { type: "number" },
                      location_adjustment: { type: "number" }
                    }
                  },
                  adjusted_price: { type: "number" }
                }
              }
            },
            market_analysis: {
              type: "object",
              properties: {
                avg_days_on_market: { type: "number" },
                median_sale_price: { type: "number" },
                price_per_sqft: { type: "number" },
                price_trend_3m: { type: "number" },
                price_trend_6m: { type: "number" },
                absorption_rate: { type: "number" },
                market_temperature: { type: "string" }
              }
            },
            arv_estimate: { type: "number" },
            confidence_level: { type: "string" }
          }
        }
      });

      // MODIFICATION: Do NOT save to database. Set directly to state.
      // Zillow API compliance rules prevent storing derived data.
      if (compAnalysis.comparables) {
        // Assign temporary IDs for React key prop
        const compsForDisplay = compAnalysis.comparables.map((c, i) => ({ ...c, id: `temp-comp-${i}` }));
        setComparables(compsForDisplay);
      }
      if (compAnalysis.market_analysis) {
        setMarketData(compAnalysis.market_analysis);
      }
      // No Property.update call for ARV to avoid creating derivative works

    } catch (error) {
      console.error("Error analyzing comparables:", error);
    }
    setIsAnalyzing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case "Excellent": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "Good": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Fair": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Poor": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // REMOVED avgARV calculation to avoid creating derivative works

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Comparable Analysis</h1>
          <p className="text-slate-600 text-lg">AI-powered comparable sales analysis for accurate ARV estimation</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Property Selector */}
          <div className="lg:col-span-3">
            <Card className="glass-effect border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-500" />
                  Select Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Search Radius</label>
                      <Select value={searchRadius.toString()} onValueChange={v => setSearchRadius(parseInt(v))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.5">0.5 miles</SelectItem>
                          <SelectItem value="1">1 mile</SelectItem>
                          <SelectItem value="2">2 miles</SelectItem>
                          <SelectItem value="3">3 miles</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Timeframe</label>
                      <Select value={timeframe.toString()} onValueChange={v => setTimeframe(parseInt(v))}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="3">3 months</SelectItem>
                          <SelectItem value="6">6 months</SelectItem>
                          <SelectItem value="12">12 months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {properties.map((property) => (
                      <div
                        key={property.id}
                        onClick={() => setSelectedProperty(property)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedProperty?.id === property.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <h4 className="font-medium text-slate-900 text-sm">{property.address}</h4>
                        <p className="text-xs text-slate-600">{property.city}, {property.state}</p>
                        <p className="text-xs text-slate-500">
                          {property.bedrooms}bd/{property.bathrooms}ba • {property.square_feet?.toLocaleString()} sqft
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analysis */}
          <div className="lg:col-span-9 space-y-6">
            {selectedProperty && (
              <>
                {/* Subject Property */}
                <Card className="glass-effect border-slate-200/50 shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-purple-500" />
                        Subject Property
                      </CardTitle>
                      <Button
                        onClick={() => analyzeComparables(selectedProperty)}
                        disabled={isAnalyzing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isAnalyzing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Analyze Comps
                          </>
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{selectedProperty.address}</h3>
                        <p className="text-slate-600 flex items-center gap-1 mb-4">
                          <MapPin className="w-4 h-4" />
                          {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600">Bedrooms</p>
                            <p className="font-bold text-slate-900">{selectedProperty.bedrooms}</p>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600">Bathrooms</p>
                            <p className="font-bold text-slate-900">{selectedProperty.bathrooms}</p>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600">Square Feet</p>
                            <p className="font-bold text-slate-900">{selectedProperty.square_feet?.toLocaleString()}</p>
                          </div>
                          <div className="text-center p-3 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-600">Year Built</p>
                            <p className="font-bold text-slate-900">{selectedProperty.year_built}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">Valuation Summary</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <span className="text-sm text-blue-800">Current Assessment</span>
                            <span className="font-bold text-blue-900">{formatCurrency(selectedProperty.assessed_value)}</span>
                          </div>
                          {selectedProperty.arv && (
                            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
                              <span className="text-sm text-emerald-800">AI Estimated ARV</span>
                              <span className="font-bold text-emerald-900">{formatCurrency(selectedProperty.arv)}</span>
                            </div>
                          )}
                          {/* REMOVED Comp Average ARV display to avoid creating derivative works */}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Data */}
                {marketData && (
                  <Card className="glass-effect border-slate-200/50 shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        Market Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <Calendar className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Avg Days on Market</p>
                          <p className="font-bold text-slate-900">{marketData.avg_days_on_market} days</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <DollarSign className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Median Price</p>
                          <p className="font-bold text-slate-900">{formatCurrency(marketData.median_sale_price)}</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <Ruler className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">Price/SqFt</p>
                          <p className="font-bold text-slate-900">${marketData.price_per_sqft}</p>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                          <p className="text-sm text-slate-600">6M Trend</p>
                          <p className={`font-bold ${marketData.price_trend_6m >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {marketData.price_trend_6m >= 0 ? '+' : ''}{marketData.price_trend_6m}%
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparables */}
                <Card className="glass-effect border-slate-200/50 shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      Comparable Sales ({comparables.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <AnimatePresence>
                        {comparables.map((comp, index) => (
                          <motion.div
                            key={comp.id} // Using temporary ID for key
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-slate-900">{comp.comp_address}</h4>
                                <p className="text-slate-600 text-sm">{comp.comp_city}, {comp.comp_state}</p>
                                <p className="text-slate-500 text-sm">
                                  Sold {new Date(comp.sale_date).toLocaleDateString()} • {comp.distance_miles} miles away
                                </p>
                              </div>
                              <Badge className={`${getQualityColor(comp.comp_quality)} border`}>
                                {comp.comp_quality}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-3">
                              <div className="text-center p-2 bg-slate-50 rounded">
                                <p className="text-xs text-slate-600">Sale Price</p>
                                <p className="font-semibold text-slate-900">{formatCurrency(comp.sale_price)}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-50 rounded">
                                <p className="text-xs text-slate-600">$/SqFt</p>
                                <p className="font-semibold text-slate-900">${comp.price_per_sqft}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-50 rounded">
                                <p className="text-xs text-slate-600">Beds/Baths</p>
                                <p className="font-semibold text-slate-900">{comp.bedrooms}/{comp.bathrooms}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-50 rounded">
                                <p className="text-xs text-slate-600">Sq Ft</p>
                                <p className="font-semibold text-slate-900">{comp.square_feet?.toLocaleString()}</p>
                              </div>
                              <div className="text-center p-2 bg-slate-50 rounded">
                                <p className="text-xs text-slate-600">Year Built</p>
                                <p className="font-semibold text-slate-900">{comp.year_built}</p>
                              </div>
                              <div className="text-center p-2 bg-emerald-50 rounded">
                                <p className="text-xs text-emerald-700">Adjusted Price</p>
                                <p className="font-semibold text-emerald-900">{formatCurrency(comp.adjusted_price)}</p>
                              </div>
                            </div>

                            {comp.adjustments && (
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="text-center p-1 bg-blue-50 rounded">
                                  <p className="text-blue-600">Size Adj</p>
                                  <p className="font-medium">{comp.adjustments.size_adjustment >= 0 ? '+' : ''}{formatCurrency(comp.adjustments.size_adjustment)}</p>
                                </div>
                                <div className="text-center p-1 bg-amber-50 rounded">
                                  <p className="text-amber-600">Age Adj</p>
                                  <p className="font-medium">{comp.adjustments.age_adjustment >= 0 ? '+' : ''}{formatCurrency(comp.adjustments.age_adjustment)}</p>
                                </div>
                                <div className="text-center p-1 bg-purple-50 rounded">
                                  <p className="text-purple-600">Condition Adj</p>
                                  <p className="font-medium">{comp.adjustments.condition_adjustment >= 0 ? '+' : ''}{formatCurrency(comp.adjustments.condition_adjustment)}</p>
                                </div>
                                <div className="text-center p-1 bg-green-50 rounded">
                                  <p className="text-green-600">Location Adj</p>
                                  <p className="font-medium">{comp.adjustments.location_adjustment >= 0 ? '+' : ''}{formatCurrency(comp.adjustments.location_adjustment)}</p>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
