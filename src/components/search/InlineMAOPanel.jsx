import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Calculator } from "lucide-react";

export default function InlineMAOPanel({ property }) {
  const [arv, setArv] = useState(property.arv || 0);
  const [rehab, setRehab] = useState(property.rehab_estimate || 0);
  const [assignmentFee, setAssignmentFee] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const listPrice = property.list_price || 0;

  const calculate = () => {
    const maoWholesale = (arv * 0.70) - rehab - assignmentFee;
    const maoFlip = (arv * 0.75) - rehab;
    const profit = maoWholesale - listPrice;
    setResult({ maoWholesale, maoFlip, profit });
  };

  const fmt = (n) => `$${Math.round(n).toLocaleString()}`;

  return (
    <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
        <Calculator className="w-4 h-4" /> MAO Calculator
      </p>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <Label className="text-xs">ARV ($)</Label>
          <Input type="number" value={arv} onChange={e => setArv(Number(e.target.value))} className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Rehab Est. ($)</Label>
          <Input type="number" value={rehab} onChange={e => setRehab(Number(e.target.value))} className="h-8 text-sm mt-1" />
        </div>
        <div>
          <Label className="text-xs">Assignment Fee ($)</Label>
          <Input type="number" value={assignmentFee} onChange={e => setAssignmentFee(Number(e.target.value))} className="h-8 text-sm mt-1" />
        </div>
      </div>
      <Button size="sm" onClick={calculate} className="bg-yellow-500 hover:bg-yellow-600 text-white w-full mb-3">
        Calculate
      </Button>
      {result && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-white rounded p-2 border border-yellow-200">
            <p className="text-xs text-slate-500">MAO (Wholesale)</p>
            <p className={`font-bold text-sm ${result.maoWholesale > listPrice ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(result.maoWholesale)}</p>
          </div>
          <div className="bg-white rounded p-2 border border-yellow-200">
            <p className="text-xs text-slate-500">MAO (Flip)</p>
            <p className="font-bold text-sm text-blue-600">{fmt(result.maoFlip)}</p>
          </div>
          <div className="bg-white rounded p-2 border border-yellow-200">
            <p className="text-xs text-slate-500">Est. Profit</p>
            <p className={`font-bold text-sm ${result.profit > 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmt(result.profit)}</p>
          </div>
        </div>
      )}
    </div>
  );
}