
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Property, MAOCalculation, LeadSource, User } from "@/entities/all";
import { InvokeLLM } from "@/integrations/Core";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Target,
  Lightbulb,
  RefreshCw,
  Save,
  Home,
  Wrench
} from "lucide-react";
import { motion } from "framer-motion";

const defaultCriteria = {
  desiredProfitFlip: 40000,
  desiredProfitWholesale: 20000,
  offerPctOfArv: 70,
  closingCostsBuyPct: 2.0,
  agentCommissionsSellPct: 6,
  closingCostsSellPct: 1.5,
  doubleCloseExtraPct: 1.5,
  rehabContingencyPct: 15,
  holdingPeriodMonths: 6,
  interestRatePct: 9.5,
  downPaymentPct: 20,
  attorneyFee: 995,
  titleInsurance: 500,
  photographyFee: 300,
  otherExpenses: 500,
};

const rehabEstimates = {
  Light: { under1500: 10000, '1500-2500': 15000, '2500-3500': 20000, '3500-5000': 30000, over5000: 40000 },
  Average: { under1500: 25000, '1500-2500': 35000, '2500-3500': 45000, '3500-5000': 55000, over5000: 70000 },
  Heavy: { under1500: 50000, '1500-2500': 60000, '2500-3500': 90000, '3500-5000': 100000, over5000: 120000 },
  'Full Gut': { under1500: 75000, '1500-2500': 100000, '2500-3500': 125000, '3500-5000': 150000, over5000: 200000 },
};

const getRehabSizeCategory = (sqft) => {
  if (sqft < 1500) return 'under1500';
  if (sqft >= 1500 && sqft < 2500) return '1500-2500';
  if (sqft >= 2500 && sqft < 3500) return '2500-3500';
  if (sqft >= 3500 && sqft < 5000) return '3500-5000';
  return 'over5000';
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

export default function SmartMAOCalculator() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [leadSource, setLeadSource] = useState(null);
  const [userCriteria, setUserCriteria] = useState(defaultCriteria);
  const [isCalculating, setIsCalculating] = useState(false);

  const [inputs, setInputs] = useState({
    arv: 0,
    rehabLevel: 'Average',
    manualRepairsOverride: '',
    wholesaleFee: 20000,
  });

  const selectProperty = useCallback(async (property) => {
    setSelectedProperty(property);
    
    try {
      const leadSources = await LeadSource.filter({ property_id: property.id });
      setLeadSource(leadSources[0] || null);
    } catch (error) {
      console.error("Error loading lead source:", error);
    }

    if (property.arv) {
      setInputs(prev => ({
        ...prev,
        arv: property.arv,
        manualRepairsOverride: property.rehab_estimate || '',
      }));
    } else {
      // Don't auto-generate, wait for user click
    }
  }, []); // Dependencies: State setters (setSelectedProperty, setLeadSource, setInputs) are stable and don't need to be included. External functions (LeadSource.filter) are also stable.

  const loadData = useCallback(async () => {
    try {
      const [propsData, userData] = await Promise.all([
        Property.list("-created_date", 50),
        User.me().catch(() => null)
      ]);
      
      setProperties(propsData);
      
      if (userData?.deal_criteria) {
        const savedCriteria = JSON.parse(userData.deal_criteria);
        setUserCriteria({ ...defaultCriteria, ...savedCriteria });
        setInputs(prev => ({...prev, wholesaleFee: savedCriteria.desiredProfitWholesale || 20000}));
      }

      if (propsData.length > 0) {
        await selectProperty(propsData[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }, [selectProperty]); // Dependencies: selectProperty is a callback and needs to be included. State setters (setProperties, setUserCriteria, setInputs) are stable. External functions (Property.list, User.me) are stable.

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateAIEstimates = async (property) => {
    setIsCalculating(true);
    try {
      const estimates = await InvokeLLM({
        prompt: `You are a specialized Real Estate Wholesaling AI Analyst. Find a highly-qualified wholesale property lead similar to this property: ${property.address}, ${property.city}, ${property.state}.
        
        Analyze it using this formula: MAO = (ARV * 70%) - Estimated Rehab Costs - Desired Wholesale Fee.
        
        - Find 3-5 renovated comps to get the ARV.
        - Estimate rehab costs using a tiered approach (Light/Medium/Heavy).
        - Use a desired wholesale fee of ${inputs.wholesaleFee}.
        
        Return the analysis for the new lead you found.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            arv_estimate: { type: "number" },
            rehab_estimate: { type: "number" },
          }
        }
      });

      if (estimates.arv_estimate) {
        setInputs(prev => ({
          ...prev,
          arv: estimates.arv_estimate,
          manualRepairsOverride: estimates.rehab_estimate || '',
        }));
        await Property.update(property.id, {
          arv: estimates.arv_estimate,
          rehab_estimate: estimates.rehab_estimate
        });
      }
    } catch (error) {
      console.error("Error generating AI estimates:", error);
    }
    setIsCalculating(false);
  };

  const calculations = useMemo(() => {
    if (!selectedProperty) return {};

    const { arv, rehabLevel, manualRepairsOverride, wholesaleFee } = inputs;
    const { closingCostsBuyPct, doubleCloseExtraPct, offerPctOfArv } = userCriteria;

    const rehabSizeCategory = getRehabSizeCategory(selectedProperty.square_feet);
    const autoRepairs = rehabEstimates[rehabLevel][rehabSizeCategory] || 0;
    const effectiveRepairs = parseFloat(manualRepairsOverride) || autoRepairs;
    
    // Using the user's specified MAO formula
    const maoAssignment = (arv * (offerPctOfArv / 100)) - effectiveRepairs - wholesaleFee;
    const maoDoubleClose = maoAssignment - (arv * (doubleCloseExtraPct / 100));

    const calculateMaoForFee = (fee) => {
      return (arv * (offerPctOfArv / 100)) - effectiveRepairs - fee;
    };
    
    // Other calculations for display
    const listingPrice = arv * 0.96; // Assuming 96% Percent off Market Value
    const closingCostsBuyer = arv * (closingCostsBuyPct / 100);

    return {
      listingPrice,
      closingCostsBuyer,
      maoAssignment,
      maoDoubleClose,
      autoRepairs,
      effectiveRepairs,
      offerTiers: {
        '40k': calculateMaoForFee(40000),
        '30k': calculateMaoForFee(30000),
        '20k': calculateMaoForFee(20000),
        '10k': calculateMaoForFee(10000),
      }
    };
  }, [inputs, selectedProperty, userCriteria]);
  
  const handleInputChange = (key, value) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">MAO Calculator Pro</h1>
          <p className="text-slate-600 text-lg">AI-powered underwriting for wholesale and flip deals</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-effect border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Select Property
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      onClick={() => selectProperty(property)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedProperty?.id === property.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <h4 className="font-medium text-slate-900 text-sm">{property.address}</h4>
                      <p className="text-xs text-slate-600">{property.city}, {property.state}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {leadSource && (
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Lightbulb className="w-5 h-5 text-amber-500" />Lead Intelligence</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm">Type: <Badge>{leadSource.source_type}</Badge></p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8 space-y-6">
            {selectedProperty && (
              <div className="grid lg:grid-cols-3 gap-6">
                
                {/* Inputs Card */}
                <Card className="lg:col-span-1 glass-effect border-slate-200/50 shadow-xl">
                  <CardHeader>
                    <CardTitle>Inputs</CardTitle>
                     <div className="flex justify-end">
                      <Button 
                        onClick={() => generateAIEstimates(selectedProperty)}
                        disabled={isCalculating}
                        variant="outline"
                        size="sm"
                      >
                        {isCalculating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <><Lightbulb className="w-4 h-4 mr-2" />AI Assist</>}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="arv">ARV (After Repair Value)</Label>
                      <Input id="arv" type="number" value={inputs.arv} onChange={e => handleInputChange('arv', parseFloat(e.target.value))} />
                    </div>
                     <div>
                      <Label htmlFor="wholesaleFee">Desired Wholesale Fee</Label>
                      <Input id="wholesaleFee" type="number" value={inputs.wholesaleFee} onChange={e => handleInputChange('wholesaleFee', parseFloat(e.target.value))} />
                    </div>
                    <div>
                        <Label htmlFor="rehabLevel">Rehab Level</Label>
                        <Select value={inputs.rehabLevel} onValueChange={level => handleInputChange('rehabLevel', level)}>
                            <SelectTrigger id="rehabLevel"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Light">Light</SelectItem>
                                <SelectItem value="Average">Average</SelectItem>
                                <SelectItem value="Heavy">Heavy</SelectItem>
                                <SelectItem value="Full Gut">Full Gut</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div>
                      <Label htmlFor="manualRepairsOverride">Manual Repairs Override</Label>
                      <Input id="manualRepairsOverride" type="number" value={inputs.manualRepairsOverride} onChange={e => handleInputChange('manualRepairsOverride', e.target.value)} placeholder={formatCurrency(calculations.autoRepairs)}/>
                    </div>
                    <div>
                      <Label>Effective Repairs</Label>
                      <p className="font-bold text-lg">{formatCurrency(calculations.effectiveRepairs)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Outputs Card */}
                <Card className="lg:col-span-2 glass-effect border-slate-200/50 shadow-xl">
                  <CardHeader><CardTitle>Outputs</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700">MAO (Assignment)</p>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(calculations.maoAssignment)}</p>
                        </div>
                        <div className="p-3 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-700">MAO (Double Close)</p>
                            <p className="text-2xl font-bold text-purple-900">{formatCurrency(calculations.maoDoubleClose)}</p>
                        </div>
                    </div>

                    <Card>
                      <CardHeader><CardTitle className="text-md">Cash Offer by Wholesale Fee</CardTitle></CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                           {Object.entries(calculations.offerTiers).reverse().map(([fee, offer]) => (
                               <div key={fee} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                  <p className="text-sm text-slate-700">{formatCurrency(parseInt(fee, 10) * 1000)} Fee</p>
                                  <p className="font-medium text-emerald-700">{formatCurrency(offer)}</p>
                              </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-600">Suggested Listing Price</span> <span>{formatCurrency(calculations.listingPrice)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-600">Buyer Closing Costs ({userCriteria.closingCostsBuyPct}%)</span> <span>{formatCurrency(calculations.closingCostsBuyer)}</span></div>
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
