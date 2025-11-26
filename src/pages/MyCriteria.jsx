
import React, { useState, useEffect } from 'react';
import { User } from '@/entities/User';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { ClipboardList, Save } from 'lucide-react';
import CriteriaForm from '../components/criteria/CriteriaForm';

const defaultCriteria = {
  // Profit & Exit
  exitStrategy: 'Wholesale',
  desiredProfitFlip: 40000,
  desiredProfitWholesale: 20000, // Changed from 10000 to 20000

  // Financing (for Flips)
  financingType: 'Hard Money',
  downPaymentPct: 20,
  interestRatePct: 9.5,
  loanPointsPct: 2,
  holdingPeriodMonths: 6,

  // Commissions & Closing Costs (as %)
  agentCommissionsSellPct: 6,
  closingCostsBuyPct: 2.0, // Changed from 3 to 2.0
  closingCostsSellPct: 1.5,
  
  // Overheads
  rehabContingencyPct: 15,
  
  // Fixed Transaction Costs (from spreadsheet) - New additions
  offerPctOfArv: 70,
  flatListingFee: 150,
  attorneyFee: 995,
  titleInsurance: 500,
  efileFee: 35,
  recordingFee: 25,
  stateTaxStamps: 200,
  photographyFee: 300,
  otherExpenses: 500,
};

export default function MyCriteria() {
  const [criteria, setCriteria] = useState(defaultCriteria);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);
        if (currentUser.deal_criteria) {
          // Merge saved criteria with defaults to ensure all keys are present
          const savedCriteria = JSON.parse(currentUser.deal_criteria);
          setCriteria(prev => ({ ...prev, ...savedCriteria }));
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
      setIsLoading(false);
    };
    fetchUserData();
  }, []);
  
  const handleSave = async () => {
    if (!user) return;
    try {
      await User.updateMyUserData({ deal_criteria: JSON.stringify(criteria) });
      toast({
        title: "Success",
        description: "Your investment criteria have been saved.",
        variant: "success",
      });
    } catch (error) {
      console.error("Failed to save criteria:", error);
      toast({
        title: "Error",
        description: "Could not save your criteria. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8 flex items-center justify-center">
        <ClipboardList className="w-16 h-16 text-slate-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">My Investment Criteria</h1>
            <p className="text-slate-600 text-lg">Define your "Buy Box" to automate and standardize your deal analysis.</p>
          </div>
          <Button onClick={handleSave} className="bg-amber-500 hover:bg-amber-600 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save Criteria
          </Button>
        </div>
        
        <CriteriaForm criteria={criteria} setCriteria={setCriteria} />
        
      </div>
    </div>
  );
}
