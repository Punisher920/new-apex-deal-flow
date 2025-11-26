import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Sliders } from "lucide-react";

export default function FilterPanel({ filters, onChange }) {
  const handleFilterChange = (key, value) => {
    onChange(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sliders className="w-5 h-5 text-purple-500" />
          Deal Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Min Deal Score: {filters.minDealScore}
          </Label>
          <Slider
            value={[filters.minDealScore]}
            onValueChange={(value) => handleFilterChange('minDealScore', value[0])}
            max={100}
            min={0}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Max Price: ${filters.maxPrice?.toLocaleString()}
          </Label>
          <Slider
            value={[filters.maxPrice]}
            onValueChange={(value) => handleFilterChange('maxPrice', value[0])}
            max={1000000}
            min={50000}
            step={25000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>$50K</span>
            <span>$500K</span>
            <span>$1M</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Min Profit: ${filters.minProfit?.toLocaleString()}
          </Label>
          <Slider
            value={[filters.minProfit]}
            onValueChange={(value) => handleFilterChange('minProfit', value[0])}
            max={100000}
            min={5000}
            step={2500}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>$5K</span>
            <span>$50K</span>
            <span>$100K</span>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Property Type
          </Label>
          <Select 
            value={filters.propertyType} 
            onValueChange={(value) => handleFilterChange('propertyType', value)}
          >
            <SelectTrigger className="bg-white/80">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Single Family">Single Family</SelectItem>
              <SelectItem value="Townhome">Townhome</SelectItem>
              <SelectItem value="Condo">Condo</SelectItem>
              <SelectItem value="Multi-Family">Multi-Family</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-3 block">
            Location
          </Label>
          <Select 
            value={filters.location} 
            onValueChange={(value) => handleFilterChange('location', value)}
          >
            <SelectTrigger className="bg-white/80">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="nashville">Nashville, TN</SelectItem>
              <SelectItem value="memphis">Memphis, TN</SelectItem>
              <SelectItem value="knoxville">Knoxville, TN</SelectItem>
              <SelectItem value="chattanooga">Chattanooga, TN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}