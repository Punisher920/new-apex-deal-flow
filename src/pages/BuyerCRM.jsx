import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Plus, Mail, Phone, MapPin, DollarSign, Home, Star, Send, Target,
  TrendingUp, Clock, Bot, Loader2, CheckCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddBuyerForm from "../components/buyers/AddBuyerForm";
import FollowUpSequencer from "@/components/leads/FollowUpSequencer";

export default function BuyerCRM() {
  const [buyers, setBuyers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTier, setFilterTier] = useState("all");
  const [filterFocus, setFilterFocus] = useState("all");
  const [sendingDeals, setSendingDeals] = useState({});
  const [isAIMatching, setIsAIMatching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [buyersData, propsData] = await Promise.all([
        base44.entities.Buyer.list("-created_date", 100),
        base44.entities.Property.filter({ status: "Active Lead" }, "-created_date", 100)
      ]);
      setBuyers(buyersData);
      setProperties(propsData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
    setIsLoading(false);
  };

  const handleAddBuyer = async (buyerData) => {
    try {
      await base44.entities.Buyer.create(buyerData);
      await loadData();
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding buyer:", error);
    }
  };

  const calculateMatchScore = (buyer, property) => {
    let score = 0;
    
    // Location match
    if (buyer.target_locations?.some(loc => 
      property.city?.toLowerCase().includes(loc.toLowerCase()) ||
      property.zip?.includes(loc) ||
      property.state?.toLowerCase().includes(loc.toLowerCase())
    )) score += 30;
    
    // Price match
    const price = property.assessed_value || property.last_sale_price || 0;
    if (price >= (buyer.min_price || 0) && price <= (buyer.max_price || Infinity)) score += 25;
    
    // Property type match
    if (buyer.target_property_types?.includes("Single Family")) score += 15;
    
    // Beds/baths match
    if (property.beds >= (buyer.min_bedrooms || 0)) score += 10;
    if (property.baths >= (buyer.min_bathrooms || 0)) score += 5;
    
    // Buyer tier bonus
    if (buyer.buyer_tier === "A-List") score += 10;
    else if (buyer.buyer_tier === "VIP") score += 15;
    
    return Math.min(score, 100);
  };

  const getMatchingProperties = (buyer) => {
    return properties.filter(prop => calculateMatchScore(buyer, prop) >= 50)
      .map(prop => ({ ...prop, matchScore: calculateMatchScore(buyer, prop) }))
      .sort((a, b) => b.matchScore - a.matchScore);
  };

  const sendDealsTobuyer = async (buyer) => {
    setSendingDeals(prev => ({ ...prev, [buyer.id]: true }));
    try {
      const matches = getMatchingProperties(buyer).slice(0, 5);
      if (matches.length === 0) return;

      const dealsList = matches.map(p => 
        `• ${p.address}, ${p.city}, ${p.state} - $${(p.assessed_value || 0).toLocaleString()} (Match: ${p.matchScore}%)`
      ).join('\n');

      await base44.integrations.Core.SendEmail({
        to: buyer.email,
        subject: `🏡 ${matches.length} New Wholesale Deals Matching Your Criteria`,
        body: `Hi ${buyer.name},\n\nWe found ${matches.length} properties matching your investment criteria:\n\n${dealsList}\n\nReply to this email to get full property details and ARV analysis.\n\nBest regards,\nYour Wholesale Team`
      });

      // Log outreach
      await base44.entities.OutreachLog.create({
        parcel_id: matches[0].parcel_id || matches[0].id,
        owner_name: buyer.name,
        contact_method: "Email",
        contact_date: new Date().toISOString(),
        message_sent: `Sent ${matches.length} deal matches to buyer`,
        status: "Sent"
      });

      // Update buyer last contact
      await base44.entities.Buyer.update(buyer.id, {
        last_purchase_date: new Date().toISOString().split('T')[0]
      });

    } catch (error) {
      console.error("Error sending deals:", error);
    }
    setSendingDeals(prev => ({ ...prev, [buyer.id]: false }));
  };

  const triggerAIMatching = async () => {
    setIsAIMatching(true);
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "apex_deal_flow_manager",
        metadata: { name: `Buyer Matching - ${new Date().toLocaleString()}` }
      });

      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `Match all active buyers with current property inventory. For each buyer:
1. Read all Buyers with status "Active"
2. Read all Properties with status "Active Lead"
3. Calculate match scores based on location, price, property type
4. For buyers with matches scoring 70+, send them an email notification about the matching properties
5. Update buyer records with latest activity

Execute this now and report back with:
- Number of buyers matched
- Number of notifications sent
- Top 5 highest-scoring matches`
      });

    } catch (error) {
      console.error("Error triggering AI matching:", error);
    }
    setIsAIMatching(false);
  };

  const filteredBuyers = buyers.filter(buyer => {
    const matchesSearch = buyer.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         buyer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         buyer.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = filterTier === "all" || buyer.buyer_tier === filterTier;
    const matchesFocus = filterFocus === "all" || buyer.investment_focus === filterFocus;
    return matchesSearch && matchesTier && matchesFocus;
  });

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(amount || 0);

  const tierColors = {
    "A-List": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "B-List": "bg-blue-100 text-blue-800 border-blue-200",
    "C-List": "bg-slate-100 text-slate-800 border-slate-200",
    "New": "bg-purple-100 text-purple-800 border-purple-200",
    "VIP": "bg-amber-100 text-amber-800 border-amber-200"
  };

  const stats = {
    total: buyers.length,
    active: buyers.filter(b => b.status === "Active").length,
    vip: buyers.filter(b => b.buyer_tier === "VIP" || b.buyer_tier === "A-List").length,
    totalVolume: buyers.reduce((sum, b) => sum + (b.total_volume || 0), 0)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">AI-Powered Buyer CRM</h1>
            <p className="text-slate-600 text-lg">Manage investors and auto-match them with deals</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={triggerAIMatching} disabled={isAIMatching} className="bg-purple-600 hover:bg-purple-700">
              {isAIMatching ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bot className="w-4 h-4 mr-2" />}
              AI Match All
            </Button>
            <Button onClick={() => setShowAddForm(true)} className="bg-amber-500 hover:bg-amber-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Buyer
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Buyers</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.active}</p>
              <p className="text-sm text-slate-600">Active</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.vip}</p>
              <p className="text-sm text-slate-600">VIP/A-List</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalVolume)}</p>
              <p className="text-sm text-slate-600">Total Volume</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-slate-200/50 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Search buyers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="A-List">A-List</SelectItem>
                  <SelectItem value="B-List">B-List</SelectItem>
                  <SelectItem value="C-List">C-List</SelectItem>
                  <SelectItem value="New">New</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterFocus} onValueChange={setFilterFocus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Focus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Focus</SelectItem>
                  <SelectItem value="Fix & Flip">Fix & Flip</SelectItem>
                  <SelectItem value="Buy & Hold">Buy & Hold</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="BRRRR">BRRRR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Buyers Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <AnimatePresence>
            {filteredBuyers.map((buyer, index) => {
              const matches = getMatchingProperties(buyer);
              const hotDeals = matches.filter(m => m.matchScore >= 80);
              
              return (
                <motion.div
                  key={buyer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-effect border-slate-200/50 shadow-xl hover:shadow-2xl transition-all">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl flex items-center gap-2">
                            {buyer.name}
                            {buyer.status === "VIP" && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                          </CardTitle>
                          {buyer.company && <p className="text-slate-500 text-sm">{buyer.company}</p>}
                          <p className="text-slate-600 flex items-center gap-1 mt-1">
                            <Mail className="w-4 h-4" /> {buyer.email}
                          </p>
                          {buyer.phone && (
                            <p className="text-slate-600 flex items-center gap-1">
                              <Phone className="w-4 h-4" /> {buyer.phone}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge className={tierColors[buyer.buyer_tier] || tierColors["New"]}>
                            {buyer.buyer_tier || "New"}
                          </Badge>
                          {buyer.investment_focus && (
                            <Badge variant="outline" className="text-xs">
                              {buyer.investment_focus}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-600">Budget</p>
                          <p className="font-bold text-sm">{formatCurrency(buyer.max_price)}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-600">Deals</p>
                          <p className="font-bold text-sm">{buyer.deals_purchased || 0}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                          <p className="text-xs text-slate-600">ROI Target</p>
                          <p className="font-bold text-sm">{buyer.desired_roi || 15}%</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <Home className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                          <p className="text-xs text-emerald-700">Matches</p>
                          <p className="font-bold text-emerald-900">{matches.length}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-red-600 mx-auto mb-1" />
                          <p className="text-xs text-red-700">Hot (80%+)</p>
                          <p className="font-bold text-red-900">{hotDeals.length}</p>
                        </div>
                      </div>

                      {buyer.target_locations?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-slate-600 mb-1">Target Areas:</p>
                          <div className="flex flex-wrap gap-1">
                            {buyer.target_locations.slice(0, 3).map((loc, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{loc}</Badge>
                            ))}
                            {buyer.target_locations.length > 3 && (
                              <Badge variant="outline" className="text-xs">+{buyer.target_locations.length - 3}</Badge>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 bg-slate-900 hover:bg-slate-800"
                          disabled={matches.length === 0 || sendingDeals[buyer.id]}
                          onClick={() => sendDealsTobuyer(buyer)}
                        >
                          {sendingDeals[buyer.id] ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Send Deals
                        </Button>
                        <Button size="sm" variant="outline">
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Phone className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {showAddForm && (
            <AddBuyerForm onSubmit={handleAddBuyer} onCancel={() => setShowAddForm(false)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}