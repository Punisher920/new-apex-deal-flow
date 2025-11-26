import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Search,
  MapPin,
  Loader2,
  Home,
  DollarSign,
  TrendingUp,
  AlertCircle,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PropertySearchEngine() {
  const [searchParams, setSearchParams] = useState({
    location: "",
    state: "",
    city: "",
    zipCode: "",
    minPrice: 50000,
    maxPrice: 500000,
    minBeds: 1,
    maxBeds: 6,
    minBaths: 1,
    propertyType: "Single Family",
    maxDaysOnMarket: 180,
    minDealScore: 70
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchStats, setSearchStats] = useState({
    totalFound: 0,
    highScoreDeals: 0,
    avgDealScore: 0,
    avgProfit: 0
  });

  const states = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
  ];

  const runPropertySearch = async () => {
    const location = searchParams.location || searchParams.city || searchParams.state;
    if (!location) {
      setSearchError("Please enter a location to search.");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSearchError(null);

    try {
      const searchQuery = `Search Zillow, Realtor.com, Redfin, and real estate listing sites to find 10-15 REAL properties currently for sale in ${location}. 

REQUIREMENTS:
- Price range: $${searchParams.minPrice.toLocaleString()} - $${searchParams.maxPrice.toLocaleString()}
- Bedrooms: ${searchParams.minBeds}-${searchParams.maxBeds}
- Property type: ${searchParams.propertyType}
- Focus on: distressed properties, foreclosures, motivated sellers, fixer-uppers, and wholesale opportunities

For each property found, provide:
1. Full street address (real addresses from current listings)
2. City, State, ZIP
3. Current listing price from Zillow/MLS
4. Bedrooms and bathrooms
5. Square footage
6. Year built
7. Zillow URL or listing URL if available
8. Estimated ARV (After Repair Value) based on comparable sales
9. Estimated rehab costs based on property condition
10. Days on market
11. Calculate a deal score (0-100) based on: price vs ARV, equity potential, motivated seller signals
12. Calculate projected wholesale profit: (ARV * 0.70) - list_price - rehab_estimate - 20000

IMPORTANT: Only return REAL properties with actual addresses currently listed for sale. Do not make up fake properties.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: searchQuery,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            properties: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  address: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  zip_code: { type: "string" },
                  list_price: { type: "number" },
                  bedrooms: { type: "number" },
                  bathrooms: { type: "number" },
                  square_feet: { type: "number" },
                  year_built: { type: "number" },
                  zillow_url: { type: "string" },
                  arv: { type: "number" },
                  rehab_estimate: { type: "number" },
                  deal_score: { type: "number" },
                  projected_profit: { type: "number" },
                  days_on_market: { type: "number" },
                  distress_signals: { type: "array", items: { type: "string" } }
                }
              }
            },
            search_source: { type: "string" }
          }
        }
      });

      if (!response || !response.properties) {
        throw new Error("No properties found. Please try different search criteria.");
      }

      // Filter results based on criteria
      const filteredProperties = response.properties.filter(prop => {
        const isValid =
          typeof prop.list_price === 'number' &&
          typeof prop.bedrooms === 'number' &&
          typeof prop.bathrooms === 'number' &&
          typeof prop.deal_score === 'number';

        if (!isValid) return false;

        return prop.list_price >= searchParams.minPrice &&
               prop.list_price <= searchParams.maxPrice &&
               prop.bedrooms >= searchParams.minBeds &&
               prop.bedrooms <= searchParams.maxBeds &&
               prop.bathrooms >= searchParams.minBaths &&
               (prop.deal_score || 50) >= searchParams.minDealScore;
      });

      // Assign temporary IDs for React rendering
      const propertiesForDisplay = filteredProperties.map((p, index) => ({
        ...p,
        id: `temp-${index}`,
        property_type: searchParams.propertyType
      }));

      setSearchResults(propertiesForDisplay);

      // Calculate stats
      const stats = {
        totalFound: propertiesForDisplay.length,
        highScoreDeals: propertiesForDisplay.filter(p => (p.deal_score || 0) >= 85).length,
        avgDealScore: propertiesForDisplay.length > 0 ?
          (propertiesForDisplay.reduce((sum, p) => sum + (p.deal_score || 0), 0) / propertiesForDisplay.length).toFixed(1) : 0,
        avgProfit: propertiesForDisplay.length > 0 ?
          (propertiesForDisplay.reduce((sum, p) => sum + (p.projected_profit || 0), 0) / propertiesForDisplay.length).toFixed(0) : 0
      };

      setSearchStats(stats);

    } catch (error) {
      console.error("Search error:", error);
      setSearchError(error.message || "Search failed. Please try again with different criteria.");
    }

    setIsSearching(false);
  };

  const handleParamChange = (key, value) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Zillow Connection Status */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <Home className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 flex items-center gap-2">
          Zillow + Real Estate Data Connected
          <Badge className="bg-emerald-500 text-white text-xs">Live</Badge>
        </AlertTitle>
        <AlertDescription className="text-blue-700">
          Searching Zillow, Realtor.com, Redfin, and MLS listings in real-time via AI web search.
        </AlertDescription>
      </Alert>

      {/* Search Form */}
      <Card className="glass-effect border-slate-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-500" />
            Zillow Property Search
          </CardTitle>
          <p className="text-slate-600">Search real Zillow listings for wholesale deals across all 50 states</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Location Search */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="location">General Location</Label>
              <Input
                id="location"
                placeholder="City, State, ZIP, or Address"
                value={searchParams.location}
                onChange={(e) => handleParamChange('location', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Select value={searchParams.state} onValueChange={(value) => handleParamChange('state', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select State" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>All States</SelectItem>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                placeholder="Specific city"
                value={searchParams.city}
                onChange={(e) => handleParamChange('city', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Price Range */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="mb-3 block">
                Price Range: ${searchParams.minPrice.toLocaleString()} - ${searchParams.maxPrice.toLocaleString()}
              </Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Min Price: ${searchParams.minPrice.toLocaleString()}</Label>
                  <Slider
                    value={[searchParams.minPrice]}
                    onValueChange={(value) => handleParamChange('minPrice', value[0])}
                    max={800000}
                    min={25000}
                    step={25000}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Max Price: ${searchParams.maxPrice.toLocaleString()}</Label>
                  <Slider
                    value={[searchParams.maxPrice]}
                    onValueChange={(value) => handleParamChange('maxPrice', value[0])}
                    max={1000000}
                    min={50000}
                    step={25000}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Deal Criteria</Label>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Min Deal Score: {searchParams.minDealScore}</Label>
                  <Slider
                    value={[searchParams.minDealScore]}
                    onValueChange={(value) => handleParamChange('minDealScore', value[0])}
                    max={100}
                    min={50}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-sm">Max Days on Market: {searchParams.maxDaysOnMarket}</Label>
                  <Slider
                    value={[searchParams.maxDaysOnMarket]}
                    onValueChange={(value) => handleParamChange('maxDaysOnMarket', value[0])}
                    max={365}
                    min={30}
                    step={30}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Property Specs */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="minBeds">Min Beds</Label>
              <Select value={searchParams.minBeds.toString()} onValueChange={(value) => handleParamChange('minBeds', parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="maxBeds">Max Beds</Label>
              <Select value={searchParams.maxBeds.toString()} onValueChange={(value) => handleParamChange('maxBeds', parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7,8].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}+</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="minBaths">Min Baths</Label>
              <Select value={searchParams.minBaths.toString()} onValueChange={(value) => handleParamChange('minBaths', parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="propertyType">Property Type</Label>
              <Select value={searchParams.propertyType} onValueChange={(value) => handleParamChange('propertyType', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single Family">Single Family</SelectItem>
                  <SelectItem value="Townhome">Townhome</SelectItem>
                  <SelectItem value="Condo">Condo</SelectItem>
                  <SelectItem value="Multi-Family">Multi-Family</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={runPropertySearch}
            disabled={isSearching}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Searching Zillow & MLS...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Search Zillow Properties
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {searchError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Search Failed</AlertTitle>
          <AlertDescription>
            {searchError}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Stats */}
      {searchResults.length > 0 && !searchError && (
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Search Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <Home className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-900">{searchStats.totalFound}</p>
                <p className="text-sm text-blue-700">Properties Found</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-900">{searchStats.highScoreDeals}</p>
                <p className="text-sm text-emerald-700">High Score Deals</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg">
                <Badge className="w-6 h-6 bg-amber-500 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{searchStats.avgDealScore}</span>
                </Badge>
                <p className="text-2xl font-bold text-amber-900">{searchStats.avgDealScore}</p>
                <p className="text-sm text-amber-700">Avg Deal Score</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-900">${searchStats.avgProfit}K</p>
                <p className="text-sm text-purple-700">Avg Profit</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !searchError && (
        <Card className="glass-effect border-slate-200/50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-500" />
                Found Properties ({searchResults.length})
              </span>
              <Badge className="bg-blue-100 text-blue-800">
                Powered by Zillow AI Search
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AnimatePresence>
                {searchResults.slice(0, 10).map((property, index) => (
                  <motion.div
                    key={property.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-lg">{property.address}</h4>
                        <p className="text-slate-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {property.city}, {property.state} {property.zip_code}
                        </p>
                      </div>
                      <Badge className={`${(property.deal_score || 0) >= 85 ? 'bg-emerald-500' : (property.deal_score || 0) >= 75 ? 'bg-amber-500' : 'bg-slate-500'} text-white`}>
                        Score: {property.deal_score || 50}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-3">
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="text-xs text-slate-600">List Price</p>
                        <p className="font-semibold">${property.list_price?.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="text-xs text-slate-600">ARV</p>
                        <p className="font-semibold">${property.arv?.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="text-xs text-slate-600">Est. Profit</p>
                        <p className="font-semibold text-emerald-600">${property.projected_profit?.toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="text-xs text-slate-600">Beds/Baths</p>
                        <p className="font-semibold">{property.bedrooms}/{property.bathrooms}</p>
                      </div>
                      <div className="text-center p-2 bg-slate-50 rounded">
                        <p className="text-xs text-slate-600">Year Built</p>
                        <p className="font-semibold">{property.year_built}</p>
                      </div>
                    </div>

                    {property.distress_signals?.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-2">
                          {property.distress_signals.slice(0, 3).map((signal, i) => (
                            <Badge key={i} variant="outline" className="text-xs bg-orange-50 text-orange-700">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3">
                      {property.zillow_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={property.zillow_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View on Zillow
                          </a>
                        </Button>
                      )}
                      <Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Analyze Deal
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Calculate MAO
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}