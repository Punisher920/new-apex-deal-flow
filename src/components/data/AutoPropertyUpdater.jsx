import React, { useState, useEffect } from "react";
import { Property, DataSource } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  RefreshCw, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Database
} from "lucide-react";
import { motion } from "framer-motion";

export default function AutoPropertyUpdater() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [updateStats, setUpdateStats] = useState({
    total: 0,
    updated: 0,
    newDeals: 0,
    errors: 0
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Auto-update every 15 minutes
    const interval = setInterval(runAutoUpdate, 900000);
    return () => clearInterval(interval);
  }, []);

  const runAutoUpdate = async () => {
    setIsUpdating(true);
    setUpdateProgress(0);
    
    try {
      // Get existing properties
      const properties = await Property.list("", 100);
      setUpdateStats(prev => ({ ...prev, total: properties.length }));
      
      let updated = 0;
      let newDeals = 0;
      let errors = 0;

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        
        try {
          // Simulate property update with AI-enhanced data
          const enhancedData = await enhancePropertyData(property);
          
          if (enhancedData) {
            await Property.update(property.id, enhancedData);
            updated++;
            
            // Check if it's a new high-scoring deal
            if (enhancedData.deal_score >= 85 && property.deal_score < 85) {
              newDeals++;
            }
          }
        } catch (error) {
          console.error(`Error updating property ${property.id}:`, error);
          errors++;
        }
        
        // Update progress
        const progress = ((i + 1) / properties.length) * 100;
        setUpdateProgress(progress);
        setUpdateStats(prev => ({ ...prev, updated, newDeals, errors }));
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error("Auto-update error:", error);
    }
    
    setIsUpdating(false);
  };

  const enhancePropertyData = async (property) => {
    try {
      // Use AI to enhance property data with market insights
      const response = await InvokeLLM({
        prompt: `Analyze this property and provide updated real estate metrics:
        
        Property: ${property.address}, ${property.city}, ${property.state}
        Current List Price: $${property.list_price}
        Bedrooms: ${property.bedrooms}, Bathrooms: ${property.bathrooms}
        Square Feet: ${property.square_feet}
        Year Built: ${property.year_built}
        
        Provide realistic updated estimates for:
        1. Current ARV (After Repair Value) based on recent comparable sales
        2. Updated rehab estimate considering current material/labor costs
        3. Revised deal score (0-100) based on current market conditions
        4. Projected profit potential
        5. Any new distress signals or market opportunities
        
        Consider current Tennessee real estate market conditions and provide conservative but realistic estimates.`,
        response_json_schema: {
          type: "object",
          properties: {
            arv: { type: "number" },
            rehab_estimate: { type: "number" },
            deal_score: { type: "number" },
            projected_profit: { type: "number" },
            mao: { type: "number" },
            distress_signals: { 
              type: "array",
              items: { type: "string" }
            },
            market_insights: { type: "string" }
          }
        }
      });
      
      return response;
    } catch (error) {
      console.error("Error enhancing property data:", error);
      return null;
    }
  };

  const manualUpdate = () => {
    runAutoUpdate();
  };

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Property Auto-Updater
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isUpdating ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Updating Properties...</span>
              <span className="text-sm text-slate-600">{Math.round(updateProgress)}%</span>
            </div>
            <Progress value={updateProgress} className="h-2" />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Database className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">Total</p>
                <p className="font-bold">{updateStats.total}</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <RefreshCw className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">Updated</p>
                <p className="font-bold text-blue-600">{updateStats.updated}</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">New Deals</p>
                <p className="font-bold text-emerald-600">{updateStats.newDeals}</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">Errors</p>
                <p className="font-bold text-red-600">{updateStats.errors}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-slate-900">Auto-Update Status</h4>
                <p className="text-sm text-slate-600">
                  {lastUpdate ? 
                    `Last updated: ${new Date(lastUpdate).toLocaleString()}` :
                    "No recent updates"
                  }
                </p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">Frequency</p>
                <p className="font-bold">15 min</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <RefreshCw className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">Last Run</p>
                <p className="font-bold text-blue-600">{updateStats.updated}</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">New Deals</p>
                <p className="font-bold text-emerald-600">{updateStats.newDeals}</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <Zap className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                <p className="text-xs text-slate-600">AI Enhanced</p>
                <p className="font-bold text-amber-600">Yes</p>
              </div>
            </div>
            
            <Button 
              onClick={manualUpdate} 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Run Manual Update
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}