import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  TrendingUp, 
  DollarSign,
  Clock,
  Star,
  AlertTriangle,
  ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";

export default function DealCard({ property, rank }) {
  const getScoreColor = (score) => {
    if (score >= 90) return "bg-emerald-500 text-white";
    if (score >= 80) return "bg-amber-500 text-white";
    if (score >= 70) return "bg-blue-500 text-white";
    return "bg-slate-500 text-white";
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Great";
    if (score >= 70) return "Good";
    return "Fair";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-effect border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3">
              <div className="bg-slate-100 text-slate-700 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                #{rank}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-slate-900 mb-1">
                  {property.address}
                </h3>
                <p className="text-slate-600 flex items-center gap-1 text-sm">
                  <MapPin className="w-4 h-4" />
                  {property.city}, {property.state}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(property.deal_score)}`}>
                <Star className="w-3 h-3" />
                {property.deal_score}
              </div>
              <p className="text-xs text-slate-500 mt-1">{getScoreBadge(property.deal_score)}</p>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Bed className="w-4 h-4" />
              {property.bedrooms}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Bath className="w-4 h-4" />
              {property.bathrooms}
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Square className="w-4 h-4" />
              {property.square_feet?.toLocaleString()} sqft
            </div>
            <div className="flex items-center gap-1 text-sm text-slate-600">
              <Clock className="w-4 h-4" />
              {property.days_on_market} DOM
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 mb-1">List Price</p>
              <p className="font-semibold text-slate-900">{formatCurrency(property.list_price)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">ARV</p>
              <p className="font-semibold text-slate-900">{formatCurrency(property.arv)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Est. Profit</p>
              <p className="font-bold text-emerald-600">{formatCurrency(property.projected_profit)}</p>
            </div>
          </div>

          {property.distress_signals?.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {property.distress_signals.slice(0, 3).map((signal, index) => (
                  <Badge key={index} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {signal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
              <TrendingUp className="w-4 h-4 mr-2" />
              Analyze Deal
            </Button>
            <Button variant="outline" className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <DollarSign className="w-4 h-4 mr-2" />
              Make Offer
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-600 hover:text-slate-900">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}