import React, { useState } from "react";
import { sourceDealLeads } from "@/functions/sourceDealLeads";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, MapPin, Star, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AILeadSourcing({ onLeadsCreated }) {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSource = async () => {
    setIsRunning(true);
    setResult(null);
    setError(null);

    // Load user criteria
    let criteria = {};
    try {
      const user = await base44.auth.me();
      criteria = user?.investment_criteria || {
        target_locations: ["Tampa, FL", "Orlando, FL"],
        max_price: 300000,
        min_beds: 3,
        investment_focus: "Wholesale",
        property_types: ["Single Family"]
      };
    } catch (e) {
      criteria = { target_locations: [], max_price: 300000, min_beds: 3 };
    }

    const res = await sourceDealLeads({ criteria });
    if (res.data?.success) {
      setResult(res.data);
      if (onLeadsCreated) onLeadsCreated();
    } else {
      setError(res.data?.error || "Failed to source leads");
    }
    setIsRunning(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "bg-red-100 text-red-700";
    if (score >= 70) return "bg-orange-100 text-orange-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Bot className="w-5 h-5" />
          AI Deal Sourcing
        </CardTitle>
        <p className="text-sm text-amber-700">Automatically finds off-market deals from public records, FSBO, pre-foreclosures & Craigslist</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSource}
          disabled={isRunning}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-2"
        >
          {isRunning ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Sourcing deals...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Source New Leads with AI</>
          )}
        </Button>

        {isRunning && (
          <div className="text-center py-3">
            <p className="text-sm text-amber-700 animate-pulse">Scanning public records, FSBO sites, and pre-foreclosure data...</p>
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                {result.leads_created} new leads added to your pipeline!
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.leads?.map((lead, i) => (
                  <div key={i} className="flex justify-between items-center p-2.5 bg-white rounded-lg border border-amber-100 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-slate-700 truncate max-w-[180px]">{lead.address}, {lead.city}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className="text-xs bg-slate-100 text-slate-600">{lead.source_type}</Badge>
                      <Badge className={`text-xs ${getScoreColor(lead.motivation_score)}`}>
                        <Star className="w-3 h-3 mr-1" />{lead.motivation_score}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}