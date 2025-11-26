import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { DollarSign, Percent, TrendingUp, Home, Banknote, Calendar, Shield, FileText } from 'lucide-react';

const InputGroup = ({ children }) => (
  <div className="relative">{children}</div>
);

const InputIcon = ({ children }) => (
  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{children}</div>
);

export default function CriteriaForm({ criteria, setCriteria }) {
  const handleInputChange = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
  };

  const handleSelectChange = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: value }));
  };

  const handleSliderChange = (key, value) => {
    setCriteria(prev => ({ ...prev, [key]: value[0] }));
  };

  return (
    <div className="space-y-8">
      {/* Profit & Exit Strategy */}
      <Card className="glass-effect border-slate-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500" />Profit & Exit Strategy</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="exitStrategy">Primary Exit Strategy</Label>
            <Select value={criteria.exitStrategy} onValueChange={v => handleSelectChange('exitStrategy', v)}>
              <SelectTrigger id="exitStrategy" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Fix & Flip">Fix & Flip</SelectItem>
                <SelectItem value="BRRRR">BRRRR</SelectItem>
                <SelectItem value="Wholetail">Wholetail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="desiredProfitWholesale">Minimum Wholesale Fee</Label>
            <InputGroup>
              <InputIcon><DollarSign className="w-4 h-4" /></InputIcon>
              <Input id="desiredProfitWholesale" type="number" value={criteria.desiredProfitWholesale} onChange={e => handleInputChange('desiredProfitWholesale', e.target.value)} className="pl-10" />
            </InputGroup>
          </div>
          <div>
            <Label htmlFor="desiredProfitFlip">Target Flip Profit (Net)</Label>
            <InputGroup>
              <InputIcon><DollarSign className="w-4 h-4" /></InputIcon>
              <Input id="desiredProfitFlip" type="number" value={criteria.desiredProfitFlip} onChange={e => handleInputChange('desiredProfitFlip', e.target.value)} className="pl-10" />
            </InputGroup>
          </div>
           <div>
            <Label>Offer % of ARV ({criteria.offerPctOfArv}%)</Label>
            <Slider value={[criteria.offerPctOfArv]} onValueChange={v => handleSliderChange('offerPctOfArv', v)} max={100} step={1} />
          </div>
        </CardContent>
      </Card>

      {/* Flip Assumptions */}
      <Card className="glass-effect border-slate-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Banknote className="w-5 h-5 text-blue-500" />Flip Assumptions</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="financingType">Default Financing</Label>
            <Select value={criteria.financingType} onValueChange={v => handleSelectChange('financingType', v)}>
              <SelectTrigger id="financingType" className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Hard Money">Hard Money</SelectItem>
                <SelectItem value="Private Money">Private Money</SelectItem>
                <SelectItem value="DSCR Loan">DSCR Loan</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Holding Period ({criteria.holdingPeriodMonths} Months)</Label>
            <Slider value={[criteria.holdingPeriodMonths]} onValueChange={v => handleSliderChange('holdingPeriodMonths', v)} max={24} step={1} />
          </div>
          <div>
            <Label>Interest Rate ({criteria.interestRatePct}%)</Label>
            <Slider value={[criteria.interestRatePct]} onValueChange={v => handleSliderChange('interestRatePct', v)} max={20} step={0.1} />
          </div>
          <div>
            <Label>Rehab Contingency ({criteria.rehabContingencyPct}%)</Label>
            <Slider value={[criteria.rehabContingencyPct]} onValueChange={v => handleSliderChange('rehabContingencyPct', v)} max={30} step={1} />
          </div>
        </CardContent>
      </Card>
      
      {/* Transaction Costs */}
      <Card className="glass-effect border-slate-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5 text-orange-500" />Transaction Costs</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
           <div>
            <Label>Buying Closing Costs ({criteria.closingCostsBuyPct}%)</Label>
            <Slider value={[criteria.closingCostsBuyPct]} onValueChange={v => handleSliderChange('closingCostsBuyPct', v)} max={10} step={0.1} />
          </div>
          <div>
            <Label>Selling Agent Commissions ({criteria.agentCommissionsSellPct}%)</Label>
            <Slider value={[criteria.agentCommissionsSellPct]} onValueChange={v => handleSliderChange('agentCommissionsSellPct', v)} max={10} step={0.5} />
          </div>
          <div>
            <Label>Selling Closing Costs ({criteria.closingCostsSellPct}%)</Label>
            <Slider value={[criteria.closingCostsSellPct]} onValueChange={v => handleSliderChange('closingCostsSellPct', v)} max={10} step={0.1} />
          </div>
          <div>
            <Label htmlFor="attorneyFee">Attorney Fee</Label>
            <InputGroup>
              <InputIcon><DollarSign className="w-4 h-4" /></InputIcon>
              <Input id="attorneyFee" type="number" value={criteria.attorneyFee} onChange={e => handleInputChange('attorneyFee', e.target.value)} className="pl-10" />
            </InputGroup>
          </div>
           <div>
            <Label htmlFor="titleInsurance">Title Insurance</Label>
            <InputGroup>
              <InputIcon><DollarSign className="w-4 h-4" /></InputIcon>
              <Input id="titleInsurance" type="number" value={criteria.titleInsurance} onChange={e => handleInputChange('titleInsurance', e.target.value)} className="pl-10" />
            </InputGroup>
          </div>
           <div>
            <Label htmlFor="photographyFee">Photography Fee</Label>
            <InputGroup>
              <InputIcon><DollarSign className="w-4 h-4" /></InputIcon>
              <Input id="photographyFee" type="number" value={criteria.photographyFee} onChange={e => handleInputChange('photographyFee', e.target.value)} className="pl-10" />
            </InputGroup>
          </div>
           <div>
            <Label htmlFor="otherExpenses">Other Fixed Expenses</Label>
            <InputGroup>
              <InputIcon><DollarSign className="w-4 h-4" /></InputIcon>
              <Input id="otherExpenses" type="number" value={criteria.otherExpenses} onChange={e => handleInputChange('otherExpenses', e.target.value)} className="pl-10" />
            </InputGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}