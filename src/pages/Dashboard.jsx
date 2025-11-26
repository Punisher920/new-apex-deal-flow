import React, { useState, useEffect } from "react";
import { Property, Alert } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  Home,
  Search,
  Filter,
  Star,
  AlertTriangle,
  Clock,
  BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import StatsOverview from "../components/dashboard/StatsOverview";
import PropertyMap from "../components/dashboard/PropertyMap";
import DealCard from "../components/dashboard/DealCard";
import FilterPanel from "../components/dashboard/FilterPanel";
import AlertsPanel from "../components/dashboard/AlertsPanel";

export default function Dashboard() {
  const [properties, setProperties] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScore = property.deal_score >= filters.minDealScore;
    const matchesPrice = property.list_price <= filters.maxPrice;
    const matchesProfit = property.projected_profit >= filters.minProfit;
    const matchesType = filters.propertyType === "all" || property.property_type === filters.propertyType;
    
    return matchesSearch && matchesScore && matchesPrice && matchesProfit && matchesType;
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
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search properties, cities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/80 backdrop-blur-sm border-slate-200/50"
                />
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

          {/* Stats Overview */}
          <StatsOverview 
            properties={filteredProperties}
            highScoreDeals={highScoreDeals}
            totalProfit={totalProfit}
            isLoading={isLoading}
          />

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
                      <h4 className="font-semibold text-blue-900 mb-2">Hot Markets</h4>
                      <p className="text-sm text-blue-700">Nashville, TN showing 23% increase in wholesale opportunities</p>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                      <h4 className="font-semibold text-amber-900 mb-2">Price Trends</h4>
                      <p className="text-sm text-amber-700">Average deal profit up 15% this month</p>
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