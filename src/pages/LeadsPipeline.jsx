import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Target, Phone, Mail, MapPin, TrendingUp, Search,
  Star, AlertTriangle, Send, ChevronDown, MessageSquare,
  Users, Flame, Thermometer, Snowflake, ArrowUpDown, RefreshCw,
  Home, DollarSign, Calendar, Tag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AILeadSourcing from "@/components/leads/AILeadSourcing";
import FollowUpSequencer from "@/components/leads/FollowUpSequencer";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

const SOURCE_TYPES = ["FSBO","Pre-Foreclosure","Probate","Foreclosure","Divorce","Tax Lien","Expired Listing","FRBO","Bankruptcy","Code Violation"];

const DEAL_STATUS_CONFIG = {
  "Active Lead": "bg-blue-100 text-blue-800",
  "Under Review": "bg-yellow-100 text-yellow-800",
  "Offer Sent": "bg-orange-100 text-orange-800",
  "Contract": "bg-purple-100 text-purple-800",
  "Assigned": "bg-indigo-100 text-indigo-800",
  "Closed": "bg-emerald-100 text-emerald-800",
  "Archived": "bg-slate-100 text-slate-800",
};

const DealStatusBadge = ({ status }) => (
  <Badge className={DEAL_STATUS_CONFIG[status] || "bg-gray-100"}>{status}</Badge>
);

const TemperatureIcon = ({ temp }) => {
  if (temp === "Hot") return <Flame className="w-4 h-4 text-red-500" />;
  if (temp === "Warm") return <Thermometer className="w-4 h-4 text-orange-400" />;
  return <Snowflake className="w-4 h-4 text-blue-400" />;
};

export default function LeadsPipeline() {
  const [properties, setProperties] = useState([]);
  const [scores, setScores] = useState([]);
  const [owners, setOwners] = useState([]);
  const [outreachLogs, setOutreachLogs] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterScore, setFilterScore] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [sortBy, setSortBy] = useState("score_desc");

  const [expandedProperty, setExpandedProperty] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [propsData, scoresData, ownersData, outreachData, sourcesData] = await Promise.all([
        base44.entities.Property.list("-created_date", 200),
        base44.entities.Score.list("-motivation_score", 200),
        base44.entities.Owner.list("-created_date", 200),
        base44.entities.OutreachLog.list("-contact_date", 200),
        base44.entities.LeadSource.list("-created_date", 200)
      ]);
      setProperties(propsData);
      setScores(scoresData);
      setOwners(ownersData);
      setOutreachLogs(outreachData);
      setLeadSources(sourcesData);
    } catch (error) {
      console.error("Error loading pipeline data:", error);
    }
    setIsLoading(false);
  };

  // Fast lookup maps
  const scoreMap = useMemo(() => Object.fromEntries(scores.map(s => [s.parcel_id, s])), [scores]);
  const ownerMap = useMemo(() => Object.fromEntries(owners.map(o => [o.parcel_id, o])), [owners]);
  const outreachMap = useMemo(() => {
    const map = {};
    for (const log of outreachLogs) {
      if (!map[log.parcel_id]) map[log.parcel_id] = [];
      map[log.parcel_id].push(log);
    }
    return map;
  }, [outreachLogs]);
  const sourceMap = useMemo(() => Object.fromEntries(leadSources.map(s => [s.property_id, s])), [leadSources]);

  const getScore = (parcelId) => scoreMap[parcelId]?.motivation_score || 0;
  const getOwner = (parcelId) => ownerMap[parcelId];
  const getOutreachLogs = (parcelId) => outreachMap[parcelId] || [];
  const getLatestOutreach = (parcelId) => {
    const logs = getOutreachLogs(parcelId);
    if (!logs.length) return "Not Contacted";
    return logs.sort((a, b) => new Date(b.contact_date) - new Date(a.contact_date))[0].status;
  };
  const getLeadSource = (propertyId) => sourceMap[propertyId];

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-red-500 text-white";
    if (score >= 70) return "bg-orange-500 text-white";
    if (score >= 60) return "bg-yellow-500 text-white";
    return "bg-slate-400 text-white";
  };
  const getScoreLabel = (score) => {
    if (score >= 80) return "Hot";
    if (score >= 70) return "Warm";
    if (score >= 60) return "Qualified";
    return "Cold";
  };

  const filteredAndSorted = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    let result = properties.filter(p => {
      const owner = getOwner(p.parcel_id);
      const src = getLeadSource(p.id);
      const score = getScore(p.parcel_id);

      // Search across all relevant fields
      if (q) {
        const haystack = [
          p.address, p.city, p.state, p.zip, p.county_fips,
          owner?.owner_name,
          src?.source_type,
          getScoreLabel(score),
          p.status
        ].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Score filter
      if (filterScore !== "all") {
        if (filterScore === "hot" && score < 80) return false;
        if (filterScore === "warm" && (score < 70 || score >= 80)) return false;
        if (filterScore === "qualified" && (score < 60 || score >= 70)) return false;
        if (filterScore === "cold" && score >= 60) return false;
      }

      // Status filter
      const status = p.status || "Active Lead";
      if (filterStatus !== "all" && status.toLowerCase().replace(/ /g,"_") !== filterStatus) return false;

      // State filter
      if (filterState !== "all" && p.state !== filterState) return false;

      // Source type filter
      if (filterSource !== "all") {
        const src = getLeadSource(p.id);
        if (!src || src.source_type !== filterSource) return false;
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      const sa = getScore(a.parcel_id), sb = getScore(b.parcel_id);
      if (sortBy === "score_desc") return sb - sa;
      if (sortBy === "score_asc") return sa - sb;
      if (sortBy === "date_desc") return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "date_asc") return new Date(a.created_date) - new Date(b.created_date);
      if (sortBy === "price_desc") return (b.assessed_value || 0) - (a.assessed_value || 0);
      if (sortBy === "price_asc") return (a.assessed_value || 0) - (b.assessed_value || 0);
      return 0;
    });

    return result;
  }, [properties, scores, owners, leadSources, searchQuery, filterScore, filterStatus, filterState, filterSource, sortBy]);

  const handleOutreach = async (property, method) => {
    const owner = getOwner(property.parcel_id);
    if (!owner) return;
    const first = owner.owner_name.split(' ')[0];
    const message = method === "SMS"
      ? `Hi ${first}, I'm a cash buyer interested in your property at ${property.address}. Would you consider an offer? Reply YES if interested.`
      : `Dear ${owner.owner_name}, I'm a local real estate investor interested in purchasing ${property.address}. I can close quickly with cash. Please reply if you'd like to discuss.`;

    await base44.entities.OutreachLog.create({
      parcel_id: property.parcel_id,
      owner_name: owner.owner_name,
      contact_method: method,
      contact_date: new Date().toISOString(),
      message_sent: message,
      status: "Sent"
    });
    await loadData();
  };

  const updateStatus = async (property, newStatus) => {
    await base44.entities.Property.update(property.id, { status: newStatus });
    await loadData();
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount || 0);

  const stats = useMemo(() => ({
    total: properties.length,
    hot: properties.filter(p => getScore(p.parcel_id) >= 80).length,
    contacted: properties.filter(p => getLatestOutreach(p.parcel_id) !== "Not Contacted").length,
    responded: properties.filter(p => ["Responded","Interested"].includes(getLatestOutreach(p.parcel_id))).length
  }), [properties, scores, outreachLogs]);

  const clearFilters = () => {
    setSearchQuery(""); setFilterScore("all"); setFilterStatus("all");
    setFilterState("all"); setFilterSource("all"); setSortBy("score_desc");
  };

  const hasActiveFilters = searchQuery || filterScore !== "all" || filterStatus !== "all" || filterState !== "all" || filterSource !== "all";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Leads Pipeline</h1>
            <p className="text-slate-600 text-lg">Motivated seller prospects — search, filter, and sort nationwide</p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={isLoading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* AI Tools */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <AILeadSourcing onLeadsCreated={loadData} />
          <FollowUpSequencer type="lead" onComplete={loadData} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: <Target className="w-8 h-8 text-blue-500" />, value: stats.total, label: "Total Leads" },
            { icon: <Flame className="w-8 h-8 text-red-500" />, value: stats.hot, label: "Hot Leads (80+)" },
            { icon: <Send className="w-8 h-8 text-emerald-500" />, value: stats.contacted, label: "Contacted" },
            { icon: <Phone className="w-8 h-8 text-purple-500" />, value: stats.responded, label: "Responded" },
          ].map(({ icon, value, label }) => (
            <Card key={label} className="glass-effect border-slate-200/50 shadow-xl">
              <CardContent className="p-6 text-center">
                <div className="mx-auto mb-2 w-fit">{icon}</div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="text-sm text-slate-600">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search & Filters */}
        <Card className="glass-effect border-slate-200/50 shadow-xl mb-6">
          <CardContent className="p-5 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="Search by address, city, state, ZIP, owner name, or source type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Select value={filterScore} onValueChange={setFilterScore}>
                <SelectTrigger><SelectValue placeholder="Score" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Scores</SelectItem>
                  <SelectItem value="hot">🔥 Hot (80+)</SelectItem>
                  <SelectItem value="warm">🌡 Warm (70-79)</SelectItem>
                  <SelectItem value="qualified">✓ Qualified (60-69)</SelectItem>
                  <SelectItem value="cold">❄ Cold (&lt;60)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active_lead">Active Lead</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="offer_sent">Offer Sent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">🌎 All States</SelectItem>
                  {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger><SelectValue placeholder="Source" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {SOURCE_TYPES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="score_desc">Score: High → Low</SelectItem>
                  <SelectItem value="score_asc">Score: Low → High</SelectItem>
                  <SelectItem value="date_desc">Newest First</SelectItem>
                  <SelectItem value="date_asc">Oldest First</SelectItem>
                  <SelectItem value="price_desc">Value: High → Low</SelectItem>
                  <SelectItem value="price_asc">Value: Low → High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">
                  Showing <strong>{filteredAndSorted.length}</strong> of {properties.length} leads
                </span>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 h-7">
                  Clear all filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Properties List */}
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Lead Properties ({filteredAndSorted.length})
              </span>
              <span className="flex items-center gap-1 text-sm text-slate-500 font-normal">
                <ArrowUpDown className="w-4 h-4" />
                {sortBy === "score_desc" ? "By Score ↓" : sortBy === "date_desc" ? "Newest" : "Sorted"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : filteredAndSorted.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="font-medium">No leads match your filters</p>
                <p className="text-sm mt-1">Try adjusting your search or filters</p>
                {hasActiveFilters && <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Clear Filters</Button>}
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredAndSorted.map((property, index) => {
                    const score = getScore(property.parcel_id);
                    const owner = getOwner(property.parcel_id);
                    const outreachList = getOutreachLogs(property.parcel_id);
                    const latestOutreach = getLatestOutreach(property.parcel_id);
                    const leadSource = getLeadSource(property.id);
                    const isExpanded = expandedProperty === property.id;

                    return (
                      <motion.div
                        key={property.id || property.parcel_id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: Math.min(index * 0.03, 0.3) }}
                        className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all"
                      >
                        {/* Main Row */}
                        <div className="p-4">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2 flex-wrap">
                                <h4 className="font-semibold text-lg text-slate-900 leading-tight">{property.address}</h4>
                                {owner?.absentee_owner && (
                                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-xs shrink-0">
                                    <AlertTriangle className="w-3 h-3 mr-1" />Absentee
                                  </Badge>
                                )}
                              </div>
                              <p className="text-slate-500 flex items-center gap-1 text-sm mt-0.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                {property.city}, {property.state} {property.zip}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {leadSource && (
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs gap-1">
                                    <Tag className="w-3 h-3" />{leadSource.source_type}
                                  </Badge>
                                )}
                                {leadSource?.lead_temperature && (
                                  <Badge className={`text-xs gap-1 ${leadSource.lead_temperature === "Hot" ? "bg-red-50 text-red-700 border-red-200" : leadSource.lead_temperature === "Warm" ? "bg-orange-50 text-orange-700 border-orange-200" : "bg-blue-50 text-blue-700 border-blue-200"} border`}>
                                    <TemperatureIcon temp={leadSource.lead_temperature} />
                                    {leadSource.lead_temperature}
                                  </Badge>
                                )}
                                {latestOutreach !== "Not Contacted" && (
                                  <Badge className="bg-purple-50 text-purple-700 border border-purple-200 text-xs">
                                    {outreachList.length}x contacted · {latestOutreach}
                                  </Badge>
                                )}
                                {owner?.owner_name && (
                                  <span className="text-xs text-slate-500">Owner: {owner.owner_name}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <DealStatusBadge status={property.status || "Active Lead"} />
                              <Badge className={`${getScoreColor(score)} px-3 py-1 text-sm font-bold`}>
                                {score} · {getScoreLabel(score)}
                              </Badge>
                            </div>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Assessed</p>
                              <p className="font-semibold text-sm">{formatCurrency(property.assessed_value)}</p>
                            </div>
                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Last Sale</p>
                              <p className="font-semibold text-sm">{formatCurrency(property.last_sale_price)}</p>
                            </div>
                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Built</p>
                              <p className="font-semibold text-sm">{property.year_built || "—"}</p>
                            </div>
                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Beds/Baths</p>
                              <p className="font-semibold text-sm">{property.beds || "—"}/{property.baths || "—"}</p>
                            </div>
                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                              <p className="text-xs text-slate-500">Sq Ft</p>
                              <p className="font-semibold text-sm">{property.building_sqft?.toLocaleString() || "—"}</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-wrap justify-between items-center gap-2">
                            <div className="flex gap-2 flex-wrap">
                              <Button size="sm" onClick={() => handleOutreach(property, "SMS")} className="bg-emerald-600 hover:bg-emerald-700 gap-1" disabled={!owner}>
                                <Phone className="w-3.5 h-3.5" /> SMS
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleOutreach(property, "Email")} disabled={!owner} className="gap-1">
                                <Mail className="w-3.5 h-3.5" /> Email
                              </Button>
                              <Select value={property.status || "Active Lead"} onValueChange={(v) => updateStatus(property, v)}>
                                <SelectTrigger className="h-8 text-xs w-36 bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.keys(DEAL_STATUS_CONFIG).map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => setExpandedProperty(isExpanded ? null : property.id)} className="gap-1 text-slate-500">
                              Details
                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </Button>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="border-t border-slate-100 overflow-hidden"
                            >
                              <div className="p-4 bg-slate-50/50 grid md:grid-cols-3 gap-4 text-sm">
                                <div>
                                  <h5 className="font-semibold flex items-center gap-2 mb-2 text-slate-700">
                                    <Tag className="w-4 h-4" /> Lead Source Info
                                  </h5>
                                  {leadSource ? (
                                    <div className="space-y-1 text-slate-600">
                                      <p><span className="font-medium">Type:</span> {leadSource.source_type}</p>
                                      <p><span className="font-medium">Temperature:</span> {leadSource.lead_temperature}</p>
                                      {leadSource.motivation_factors?.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {leadSource.motivation_factors.map((f, i) => (
                                            <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  ) : <p className="text-slate-400">No source data</p>}
                                </div>
                                <div>
                                  <h5 className="font-semibold flex items-center gap-2 mb-2 text-slate-700">
                                    <MessageSquare className="w-4 h-4" /> Negotiation Notes
                                  </h5>
                                  <p className="text-slate-600 whitespace-pre-wrap">{property.negotiation_notes || "No notes yet."}</p>
                                </div>
                                <div>
                                  <h5 className="font-semibold flex items-center gap-2 mb-2 text-slate-700">
                                    <Users className="w-4 h-4" /> Outreach History ({outreachList.length})
                                  </h5>
                                  {outreachList.length === 0 ? (
                                    <p className="text-slate-400">Not yet contacted</p>
                                  ) : (
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {outreachList.slice(0, 5).map((log, i) => (
                                        <div key={i} className="flex justify-between text-xs text-slate-600 bg-white rounded p-1.5 border border-slate-100">
                                          <span>{log.contact_method} · {log.status}</span>
                                          <span className="text-slate-400">{new Date(log.contact_date).toLocaleDateString()}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}