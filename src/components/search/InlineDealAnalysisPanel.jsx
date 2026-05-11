import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, CheckCircle, XCircle } from "lucide-react";

export default function InlineDealAnalysisPanel({ property }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this wholesale real estate deal quickly:
Address: ${property.address}, ${property.city}, ${property.state}
List Price: $${property.list_price?.toLocaleString()}
ARV: $${property.arv?.toLocaleString()}
Rehab Estimate: $${property.rehab_estimate?.toLocaleString()}
Beds/Baths: ${property.bedrooms}/${property.bathrooms}
Year Built: ${property.year_built}
Days on Market: ${property.days_on_market}
Distress Signals: ${property.distress_signals?.join(', ') || 'None'}

Provide a brief deal analysis: verdict (Good Deal/Marginal/Pass), 2-3 pros, 2-3 cons, recommended max offer, and one sentence summary.`,
        response_json_schema: {
          type: "object",
          properties: {
            verdict: { type: "string" },
            summary: { type: "string" },
            pros: { type: "array", items: { type: "string" } },
            cons: { type: "array", items: { type: "string" } },
            recommended_offer: { type: "number" }
          }
        }
      });
      setAnalysis(result);
    } catch (e) {
      setAnalysis({ verdict: "Error", summary: "Analysis failed. Please try again.", pros: [], cons: [], recommended_offer: 0 });
    }
    setLoading(false);
  };

  const verdictColor = {
    "Good Deal": "bg-emerald-500",
    "Marginal": "bg-amber-500",
    "Pass": "bg-red-500"
  };

  return (
    <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <p className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4" /> AI Deal Analysis
      </p>
      {!analysis && (
        <Button size="sm" onClick={runAnalysis} disabled={loading} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : "Run AI Analysis"}
        </Button>
      )}
      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge className={`${verdictColor[analysis.verdict] || 'bg-slate-500'} text-white`}>{analysis.verdict}</Badge>
            {analysis.recommended_offer > 0 && (
              <span className="text-sm text-slate-600">Recommended Offer: <strong>${analysis.recommended_offer?.toLocaleString()}</strong></span>
            )}
          </div>
          <p className="text-sm text-slate-700 italic">"{analysis.summary}"</p>
          <div className="grid grid-cols-2 gap-3">
            {analysis.pros?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-emerald-700 mb-1">Pros</p>
                {analysis.pros.map((pro, i) => (
                  <div key={i} className="flex items-start gap-1 text-xs text-slate-600 mb-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                    {pro}
                  </div>
                ))}
              </div>
            )}
            {analysis.cons?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-700 mb-1">Cons</p>
                {analysis.cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-1 text-xs text-slate-600 mb-1">
                    <XCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                    {con}
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={() => setAnalysis(null)} className="text-xs">Re-analyze</Button>
        </div>
      )}
    </div>
  );
}