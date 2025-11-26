import React, { useState, useEffect } from "react";
import { Buyer } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Building,
  TrendingUp,
  Star,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import BuyerCard from "../components/buyers/BuyerCard";
import AddBuyerForm from "../components/buyers/AddBuyerForm";

export default function Buyers() {
  const [buyers, setBuyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    loadBuyers();
  }, []);

  const loadBuyers = async () => {
    setIsLoading(true);
    const data = await Buyer.list("-deals_purchased", 50);
    setBuyers(data);
    setIsLoading(false);
  };

  const handleAddBuyer = async (buyerData) => {
    await Buyer.create(buyerData);
    await loadBuyers();
    setShowAddForm(false);
  };

  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = buyer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         buyer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         buyer.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === "all" || 
                         (filter === "active" && buyer.active) ||
                         (filter === "inactive" && !buyer.active) ||
                         buyer.investment_type === filter;
    
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: buyers.length,
    active: buyers.filter(b => b.active).length,
    avgDeals: buyers.length > 0 ? (buyers.reduce((sum, b) => sum + (b.deals_purchased || 0), 0) / buyers.length).toFixed(1) : 0,
    topInvestors: buyers.filter(b => (b.deals_purchased || 0) >= 3).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Buyer Management</h1>
            <p className="text-slate-600 text-lg">Manage your investor network and buyer relationships</p>
          </div>
          
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Buyer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Buyers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Buyers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Deals</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgDeals}</p>
                </div>
                <Star className="w-8 h-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Top Investors</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.topInvestors}</p>
                </div>
                <Building className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="glass-effect border-slate-200/50 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search buyers by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "active", "Fix & Flip", "Buy & Hold", "Wholesale", "BRRRR"].map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(filterOption)}
                    className={filter === filterOption ? "bg-slate-900 text-white" : ""}
                  >
                    {filterOption === "all" ? "All" : filterOption}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Buyers List */}
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Buyer Directory ({filteredBuyers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <AnimatePresence>
                {filteredBuyers.map((buyer, index) => (
                  <motion.div
                    key={buyer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <BuyerCard buyer={buyer} />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {filteredBuyers.length === 0 && !isLoading && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">No buyers found</h3>
                  <p className="text-slate-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Add Buyer Form Modal */}
        <AnimatePresence>
          {showAddForm && (
            <AddBuyerForm
              onSubmit={handleAddBuyer}
              onCancel={() => setShowAddForm(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}