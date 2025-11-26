import React, { useState, useEffect, useMemo } from "react";
import { Property, User } from "@/entities/all";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Calculator,
  Home,
  DollarSign,
  TrendingUp,
  MapPin,
  Wrench,
  Info,
  ChevronDown
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const defaultCriteria = {
  desiredProfitFlip: 40000,
  desiredProfitWholesale: 20000,
  offerPctOfArv: 70,
  agentCommissionsSellPct: 6,
  closingCostsBuyPct: 2,
  closingCostsSellPct: 1.5,
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

const CostRow = ({ label, value, tooltip }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-200">
    <div className="flex items-center gap-1.5">
      <p className="text-sm text-slate-600">{label}</p>
      {tooltip && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3.5 h-3.5 text-slate-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
    <p className="font-medium text-slate-800">{formatCurrency(value)}</p>
  </div>
);

export default function DealAnalysis() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [userCriteria, setUserCriteria] = useState(defaultCriteria);

  const [dealValues, setDealValues] = useState({
    arv: 0,
    rehabLevel: 'Average',
    rehabOverride: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const [propsData, userData] = await Promise.all([
        Property.list("-deal_score", 20),
        User.me().catch(() => null)
      ]);
      
      setProperties(propsData);
      
      if (userData && userData.deal_criteria) {
        setUserCriteria({ ...defaultCriteria, ...JSON.parse(userData.deal_criteria) });
      }

      if (propsData.length > 0) {
        handleSelectProperty(propsData[0]);
      }
    };
    loadData();
  }, []);

  const handleSelectProperty = (property) => {
    setSelectedProperty(property);
    setDealValues({
      arv: property.arv || 0,
      rehabLevel: 'Average',
      rehabOverride: property.rehab_estimate || '',
    });
  };

  const calculations = useMemo(() => {
    if (!selectedProperty) return {};
    
    const { arv, rehabLevel, rehabOverride } = dealValues;
    const {
      desiredProfitWholesale, offerPctOfArv, agentCommissionsSellPct,
      closingCostsBuyPct, closingCostsSellPct, attorneyFee, titleInsurance,
      photographyFee, otherExpenses
    } = userCriteria;

    const rehabSizeCategory = getRehabSizeCategory(selectedProperty.square_feet);
    const estimatedRehab = rehabEstimates[rehabLevel][rehabSizeCategory];
    const finalRehabCost = parseFloat(rehabOverride) || estimatedRehab || 0;
    
    const totalClosingCosts = 
        (arv * (agentCommissionsSellPct / 100)) +
        (arv * (closingCostsSellPct / 100)) +
        (arv * (closingCostsBuyPct / 100));
        
    const totalFixedFees = attorneyFee + titleInsurance + photographyFee + otherExpenses;

    const totalDeductions = finalRehabCost + totalClosingCosts + totalFixedFees;
    
    const calculateMaoForFee = (fee) => {
      return (arv * (offerPctOfArv / 100)) - totalDeductions - fee;
    };
    
    const mao = calculateMaoForFee(desiredProfitWholesale);

    return {
      finalRehabCost,
      totalClosingCosts,
      totalFixedFees,
      totalDeductions,
      mao,
      offerTiers: {
        '40k': calculateMaoForFee(40000),
        '30k': calculateMaoForFee(30000),
        '20k': calculateMaoForFee(20000),
        '10k': calculateMaoForFee(10000),
      }
    };
  }, [dealValues, selectedProperty, userCriteria]);

  if (!selectedProperty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8 flex items-center justify-center">
        <Home className="w-16 h-16 text-slate-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Deal & Offer Analysis</h1>
          <p className="text-slate-600 text-lg">Underwrite deals and generate offers using your custom Buy Box formula.</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="glass-effect border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Home className="w-5 h-5 text-blue-500" />Select Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[80vh] overflow-y-auto">
                  {properties.slice(0, 10).map((property) => (
                    <div
                      key={property.id}
                      onClick={() => handleSelectProperty(property)}
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
          </div>

          {/* Right Panel */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="glass-effect border-slate-200/50 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5 text-purple-500" />{selectedProperty.address}</CardTitle>
                <CardDescription>{selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code} • {selectedProperty.square_feet} sqft • Built {selectedProperty.year_built}</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <Label htmlFor="arv">After Repair Value (ARV)</Label>
                        <Input id="arv" type="number" placeholder="Enter ARV" value={dealValues.arv} onChange={e => setDealValues(v => ({...v, arv: parseFloat(e.target.value) || 0}))} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label htmlFor="rehabLevel">Rehab Level</Label>
                            <Select value={dealValues.rehabLevel} onValueChange={level => setDealValues(v => ({...v, rehabLevel: level, rehabOverride: ''}))}>
                                <SelectTrigger id="rehabLevel">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Light">Light</SelectItem>
                                    <SelectItem value="Average">Average</SelectItem>
                                    <SelectItem value="Heavy">Heavy</SelectItem>
                                    <SelectItem value="Full Gut">Full Gut</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="rehabOverride">Rehab Override</Label>
                            <Input id="rehabOverride" type="number" placeholder="Bid Amount" value={dealValues.rehabOverride} onChange={e => setDealValues(v => ({...v, rehabOverride: e.target.value}))} />
                        </div>
                    </div>
                 </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Cost Breakdown */}
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wrench className="w-5 h-5 text-orange-500" />Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <CostRow label="Rehab Costs" value={calculations.finalRehabCost} tooltip={`Based on ${dealValues.rehabOverride ? 'manual override' : `${dealValues.rehabLevel} level for ${getRehabSizeCategory(selectedProperty.square_feet)} sqft`}`} />
                    <CostRow label="Closing Costs" value={calculations.totalClosingCosts} tooltip="Combined buyer, seller, and agent commissions" />
                    <CostRow label="Fixed Fees" value={calculations.totalFixedFees} tooltip="Attorney, title, photos, and other expenses" />
                    <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 mt-2">
                      <p className="text-sm font-semibold text-slate-800">Total Estimated Costs</p>
                      <p className="font-bold text-lg text-slate-900">{formatCurrency(calculations.totalDeductions)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Offer Calculator */}
              <Card className="glass-effect border-slate-200/50 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" />Wholesale MAO</CardTitle>
                  <CardDescription>Based on {userCriteria.offerPctOfArv}% of ARV</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200 text-center mb-4">
                    <h4 className="font-semibold text-emerald-900 mb-1">Max Allowable Offer</h4>
                    <p className="text-3xl font-bold text-emerald-900">{formatCurrency(calculations.mao)}</p>
                    <p className="text-sm text-emerald-700 mt-1">For your target fee of {formatCurrency(userCriteria.desiredProfitWholesale)}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-center text-slate-600 mb-2">Offer Stack (Based on Fee)</h4>
                    {Object.entries(calculations.offerTiers).reverse().map(([fee, offer]) => (
                         <div key={fee} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                            <p className="text-sm text-slate-700">Offer for <span className="font-semibold">{formatCurrency(parseInt(fee, 10) * 1000)}</span> Fee:</p>
                            <p className="font-medium text-emerald-700">{formatCurrency(offer)}</p>
                        </div>
                    ))}
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