import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Mail, 
  Building, 
  MapPin,
  DollarSign,
  Star,
  MessageCircle,
  Share2
} from "lucide-react";

const investmentTypeColors = {
  "Fix & Flip": "bg-blue-100 text-blue-800 border-blue-200",
  "Buy & Hold": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Wholesale": "bg-amber-100 text-amber-800 border-amber-200",
  "BRRRR": "bg-purple-100 text-purple-800 border-purple-200"
};

export default function BuyerCard({ buyer }) {
  const formatCurrency = (amount) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getActivityLevel = (deals) => {
    if (deals >= 5) return { level: "High", color: "text-emerald-600" };
    if (deals >= 2) return { level: "Medium", color: "text-amber-600" };
    return { level: "New", color: "text-slate-600" };
  };

  const activity = getActivityLevel(buyer.deals_purchased || 0);

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-slate-200/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">{buyer.name}</h3>
              <Badge className={`text-xs ${investmentTypeColors[buyer.investment_type]} border`}>
                {buyer.investment_type}
              </Badge>
              {!buyer.active && (
                <Badge variant="outline" className="bg-slate-100 text-slate-600">
                  Inactive
                </Badge>
              )}
            </div>
            
            {buyer.company && (
              <p className="text-slate-600 flex items-center gap-1 text-sm mb-2">
                <Building className="w-4 h-4" />
                {buyer.company}
              </p>
            )}
            
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span className="flex items-center gap-1">
                <Mail className="w-4 h-4" />
                {buyer.email}
              </span>
              {buyer.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {buyer.phone}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <Star className="w-4 h-4 text-amber-500" />
              <span className={`text-sm font-medium ${activity.color}`}>
                {activity.level}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {buyer.deals_purchased || 0} deals completed
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Max Budget</p>
            <p className="font-semibold text-slate-900">{formatCurrency(buyer.max_budget)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Min Beds</p>
            <p className="font-semibold text-slate-900">{buyer.min_bedrooms || "Any"}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Max Rehab</p>
            <p className="font-semibold text-slate-900">{formatCurrency(buyer.max_rehab_budget)}</p>
          </div>
          <div className="text-center p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600 mb-1">Avg Close</p>
            <p className="font-semibold text-slate-900">{buyer.avg_close_time || "N/A"} days</p>
          </div>
        </div>

        {buyer.preferred_areas?.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Preferred Areas:</p>
            <div className="flex flex-wrap gap-2">
              {buyer.preferred_areas.slice(0, 3).map((area, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {area}
                </Badge>
              ))}
              {buyer.preferred_areas.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{buyer.preferred_areas.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800">
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            <Share2 className="w-4 h-4 mr-2" />
            Send Deals
          </Button>
          <Button size="sm" variant="ghost" className="px-3">
            <DollarSign className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}