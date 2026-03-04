import React, { useState, useEffect } from "react";
import { Property, Owner, Score, OutreachLog } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Target,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Star,
  AlertTriangle,
  Send,
  ChevronDown,
  MessageSquare,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AILeadSourcing from "@/components/leads/AILeadSourcing";
import FollowUpSequencer from "@/components/leads/FollowUpSequencer";

const DealStatusBadge = ({ status }) => {
  const statusConfig = {
    "Active Lead": "bg-blue-100 text-blue-800",
    "Under Review": "bg-yellow-100 text-yellow-800",
    "Offer Sent": "bg-orange-100 text-orange-800",
    "Contract": "bg-purple-100 text-purple-800",
    "Assigned": "bg-indigo-100 text-indigo-800",
    "Closed": "bg-emerald-100 text-emerald-800",
    "Archived": "bg-slate-100 text-slate-800",
  };
  return <Badge className={statusConfig[status] || "bg-gray-100"}>{status}</Badge>;
};

export default function LeadsPipeline() {
  const [properties, setProperties] = useState([]);
  const [scores, setScores] = useState([]);
  const [owners, setOwners] = useState([]);
  const [outreachLogs, setOutreachLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedProperty, setExpandedProperty] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [propsData, scoresData, ownersData, outreachData] = await Promise.all([
        Property.list("-created_date", 100),
        Score.list("-motivation_score", 100),
        Owner.list("-created_date", 100),
        OutreachLog.list("-contact_date", 100)
      ]);
      
      setProperties(propsData);
      setScores(scoresData);
      setOwners(ownersData);
      setOutreachLogs(outreachData);
    } catch (error) {
      console.error("Error loading pipeline data:", error);
    }
    setIsLoading(false);
  };

  const getPropertyScore = (parcelId) => {
    const score = scores.find(s => s.parcel_id === parcelId);
    return score ? score.motivation_score : 0;
  };

  const getPropertyOwner = (parcelId) => {
    return owners.find(o => o.parcel_id === parcelId);
  };

  const getOutreachStatus = (parcelId) => {
    const logs = outreachLogs.filter(log => log.parcel_id === parcelId);
    if (logs.length === 0) return "Not Contacted";
    
    const latest = logs.sort((a, b) => new Date(b.contact_date) - new Date(a.contact_date))[0];
    return latest.status;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-red-500 text-white";
    if (score >= 70) return "bg-orange-500 text-white";
    if (score >= 60) return "bg-yellow-500 text-white";
    return "bg-slate-500 text-white";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Hot";
    if (score >= 70) return "Warm";
    if (score >= 60) return "Qualified";
    return "Cold";
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         property.city?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const score = getPropertyScore(property.parcel_id);
    const matchesScore = filterScore === "all" || 
                        (filterScore === "hot" && score >= 80) ||
                        (filterScore === "warm" && score >= 70 && score < 80) ||
                        (filterScore === "qualified" && score >= 60 && score < 70);
    
    // property.status is a new field from the AI model
    const currentDealStatus = property.status || "Active Lead";
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "active_lead" && currentDealStatus === "Active Lead") ||
                         (filterStatus === "under_review" && currentDealStatus === "Under Review") ||
                         (filterStatus === "offer_sent" && currentDealStatus === "Offer Sent") ||
                         (filterStatus === "contract" && currentDealStatus === "Contract") ||
                         (filterStatus === "assigned" && currentDealStatus === "Assigned") ||
                         (filterStatus === "closed" && currentDealStatus === "Closed") ||
                         (filterStatus === "archived" && currentDealStatus === "Archived");
    
    return matchesSearch && matchesScore && matchesStatus;
  });

  const handleOutreach = async (property, method) => {
    const owner = getPropertyOwner(property.parcel_id);
    if (!owner) return;

    try {
      let message = "";
      if (method === "SMS") {
        message = `Hi ${owner.owner_name.split(' ')[0]}, I'm interested in purchasing your property at ${property.address}. Would you consider selling? Text back YES if interested.`;
      } else if (method === "Email") {
        message = `Dear ${owner.owner_name}, I hope this message finds you well. I'm a local real estate investor interested in purchasing your property at ${property.address}. I can close quickly with cash. Please reply if you'd like to discuss.`;
      }

      await OutreachLog.create({
        parcel_id: property.parcel_id,
        owner_name: owner.owner_name,
        contact_method: method,
        contact_date: new Date().toISOString(),
        message_sent: message,
        status: "Sent"
      });

      await loadData();
    } catch (error) {
      console.error("Error sending outreach:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const stats = {
    total: properties.length,
    hot: properties.filter(p => getPropertyScore(p.parcel_id) >= 80).length,
    contacted: properties.filter(p => getOutreachStatus(p.parcel_id) !== "Not Contacted").length,
    responded: properties.filter(p => getOutreachStatus(p.parcel_id) === "Responded").length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Leads Pipeline</h1>
          <p className="text-slate-600 text-lg">Motivated seller prospects sorted by likelihood to sell</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Leads</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Star className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.hot}</p>
              <p className="text-sm text-slate-600">Hot Leads</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Send className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.contacted}</p>
              <p className="text-sm text-slate-600">Contacted</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-slate-200/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <Phone className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-900">{stats.responded}</p>
              <p className="text-sm text-slate-600">Responded</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-effect border-slate-200/50 shadow-xl mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by address or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterScore} onValueChange={setFilterScore}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Score Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">Hot (80+)</SelectItem>
                  <SelectItem value="warm">Warm (70-79)</SelectItem>
                  <SelectItem value="qualified">Qualified (60-69)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active_lead">Active Lead</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="offer_sent">Offer Sent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Properties List */}
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Lead Properties ({filteredProperties.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {filteredProperties.map((property, index) => {
                  const score = getPropertyScore(property.parcel_id);
                  const owner = getPropertyOwner(property.parcel_id);
                  
                  return (
                    <motion.div
                      key={property.parcel_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-slate-900">{property.address}</h4>
                          <p className="text-slate-600 flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {property.city}, {property.state} {property.zip}
                          </p>
                          {owner && (
                            <p className="text-sm text-slate-500 mt-1">Owner: {owner.owner_name}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                           <DealStatusBadge status={property.status || "Active Lead"} />
                          <Badge className={`${getScoreColor(score)} px-3 py-1`}>
                            {score} - {getScoreLabel(score)}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Assessed</p>
                          <p className="font-semibold">{formatCurrency(property.assessed_value)}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Last Sale</p>
                          <p className="font-semibold">{formatCurrency(property.last_sale_price)}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Year Built</p>
                          <p className="font-semibold">{property.year_built}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Beds/Baths</p>
                          <p className="font-semibold">{property.beds}/{property.baths}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-50 rounded">
                          <p className="text-xs text-slate-600">Sq Ft</p>
                          <p className="font-semibold">{property.building_sqft?.toLocaleString()}</p>
                        </div>
                      </div>

                      {owner?.absentee_owner && (
                        <div className="mb-3">
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Absentee Owner
                          </Badge>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                          <div className="flex gap-3">
                            <Button 
                              size="sm" 
                              onClick={() => handleOutreach(property, "SMS")}
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={!owner}
                            >
                              <Phone className="w-4 h-4 mr-2" />
                              Send SMS
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleOutreach(property, "Email")}
                              disabled={!owner}
                            >
                              <Mail className="w-4 h-4 mr-2" />
                              Send Email
                            </Button>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => setExpandedProperty(expandedProperty === property.id ? null : property.id)}>
                            Details
                            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${expandedProperty === property.id ? 'rotate-180' : ''}`} />
                          </Button>
                      </div>

                      <AnimatePresence>
                        {expandedProperty === property.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-slate-200 overflow-hidden"
                          >
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h5 className="font-semibold flex items-center gap-2 mb-2"><MessageSquare className="w-4 h-4 text-slate-500" />Negotiation Notes</h5>
                                <p className="text-slate-600 whitespace-pre-wrap">{property.negotiation_notes || "No notes yet."}</p>
                              </div>
                              <div>
                                <h5 className="font-semibold flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-slate-500" />Buyer Feedback</h5>
                                <p className="text-slate-600 whitespace-pre-wrap">{property.buyer_feedback || "No feedback yet."}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}