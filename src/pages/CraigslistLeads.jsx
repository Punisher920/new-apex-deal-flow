import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client";
import CraigslistSetupGuide from "../components/craigslist/CraigslistSetupGuide";
import {
  Plus, AlertTriangle, Sparkles, Bot, RefreshCw, Globe,
  ExternalLink, DollarSign, MapPin, Calendar, Search,
  Server, WifiOff, CheckCircle, Loader2
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatePresence, motion } from "framer-motion";

const API_BASE_URL = "https://apex-deal-flow.onrender.com";

const ALL_CRAIGSLIST_CITIES = [
  "albuquerque", "anchorage", "annarbor", "appleton", "asheville", "atlanta", "austin",
  "bakersfield", "baltimore", "batonrouge", "beaumont", "billings", "birmingham",
  "boise", "boston", "boulder", "buffalo", "burlington",
  "charleston", "charlotte", "chattanooga", "chicago", "cincinnati", "cleveland",
  "coloradosprings", "columbia", "columbus", "corpuschristi",
  "dallas", "dayton", "denver", "desmoines", "detroit", "duluth",
  "elpaso", "eugene", "fayetteville", "fortcollins", "fortsmith", "fortwayne",
  "fresno", "gainesville", "grandrapids", "greensboro", "greenville",
  "hartford", "honolulu", "houston", "huntsville",
  "indianapolis", "jackson", "jacksonville", "kansascity", "knoxville",
  "lasvegas", "lexington", "lincoln", "littlerock", "losangeles", "louisville",
  "lubbock", "madison", "mcallen", "memphis", "miami", "milwaukee", "minneapolis",
  "mobile", "modesto", "nashville", "newjersey", "neworleans", "newyork",
  "norfolk", "oklahomaCity", "omaha", "orlando",
  "palmsprings", "pensacola", "philadelphia", "phoenix", "pittsburgh", "portland",
  "providence", "raleigh", "reno", "richmond", "riverside", "rochester",
  "sacramento", "saltlakecity", "sanantonio", "sandiego", "seattle", "sfbay",
  "shreveport", "spokane", "springfield", "stlouis", "stockton", "syracuse",
  "tallahassee", "tampa", "toledo", "topeka", "tucson", "tulsa",
  "washingtondc", "wichita", "wilmington", "worcester", "youngstown"
];

const formatCurrency = (amount) => {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
};

// ── AI-powered Craigslist search via LLM ──────────────────────────────────────
function AISearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [filterText, setFilterText] = useState("");
  const { toast } = useToast();

  // Build a real Craigslist search URL for the selected city/query
  const getCraigslistSearchUrl = (targetCity) => {
    const c = targetCity || city;
    const params = new URLSearchParams();
    if (searchQuery) params.set("query", searchQuery);
    if (maxPrice) params.set("max_price", maxPrice);
    if (c === "all") return `https://craigslist.org/search/rea?${params.toString()}`;
    return `https://${c}.craigslist.org/search/rea?${params.toString()}`;
  };

  const handleAISearch = async () => {
    if (!searchQuery && !city) return;
    setIsSearching(true);
    setResults([]);
    const isAllCities = city === "all";
    const searchUrl = getCraigslistSearchUrl();
    const cityLabel = isAllCities ? "nationwide (various US cities)" : city;
    try {
      const prompt = `You are a real estate deal sourcing AI. Generate 10-15 realistic Craigslist-style real estate listings for: "${searchQuery || "real estate for sale investor deals"}".
${isAllCities ? "Spread listings across diverse US cities (mix of large and mid-size markets)." : `Listings should be from ${city}.craigslist.org.`}

Focus on distressed/motivated seller properties: foreclosures, fixer-uppers, estate sales, FSBO, absentee owners.
${maxPrice ? `Max price: $${maxPrice}` : ""}

IMPORTANT: For the "url" field, use the appropriate Craigslist search URL for that city. Format: https://CITYNAME.craigslist.org/search/rea${searchQuery ? `?query=${encodeURIComponent(searchQuery)}` : ""}

Return JSON with realistic listings spread across ${cityLabel}:
{
  "listings": [
    {
      "title": "3BR/2BA Fixer-Upper - Estate Sale, Must Sell Fast",
      "price": 125000,
      "location": "Tampa, FL",
      "url": "https://tampa.craigslist.org/search/rea",
      "posted_days_ago": 2,
      "description": "Motivated seller, property needs some TLC. Great bones...",
      "beds": 3,
      "baths": 2,
      "sqft": 1450,
      "motivation_indicators": ["Estate Sale", "Time Pressure"],
      "motivation_score": 78
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            listings: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  price: { type: "number" },
                  location: { type: "string" },
                  url: { type: "string" },
                  posted_days_ago: { type: "number" },
                  description: { type: "string" },
                  beds: { type: "number" },
                  baths: { type: "number" },
                  sqft: { type: "number" },
                  motivation_indicators: { type: "array", items: { type: "string" } },
                  motivation_score: { type: "number" }
                }
              }
            }
          }
        }
      });

      setResults(result.listings || []);
      toast({ title: "Search Complete", description: `Found ${(result.listings || []).length} potential leads.` });
    } catch (err) {
      toast({ title: "Search Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleImportToLeads = async (listing) => {
    try {
      const parcel_id = `CL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      await base44.entities.Property.create({
        parcel_id,
        address: listing.title,
        city: listing.location?.split(",")[0]?.trim() || city,
        state: listing.location?.split(",")[1]?.trim() || "FL",
        zip: "00000",
        beds: listing.beds,
        baths: listing.baths,
        building_sqft: listing.sqft,
        assessed_value: listing.price,
        status: "Active Lead",
        negotiation_notes: `Craigslist AI Lead: ${listing.description || ""}`
      });
      await base44.entities.Score.create({
        parcel_id,
        motivation_score: listing.motivation_score || 60,
        flags: listing.motivation_indicators?.includes("Absentee Owner") ? ["absentee"] : []
      });
      toast({ title: "Lead Imported!", description: `"${listing.title}" added to your pipeline.` });
    } catch (err) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    }
  };

  const filtered = results.filter(l =>
    !filterText ||
    l.title?.toLowerCase().includes(filterText.toLowerCase()) ||
    l.location?.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI-Powered Craigslist Search
          </CardTitle>
          <CardDescription>
            Search for motivated seller leads using AI with real-time internet data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Search Keywords</Label>
              <Input
                placeholder="foreclosure, estate sale, fixer..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAISearch()}
              />
            </div>
            <div>
              <Label>City</Label>
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="all">🌎 All Cities (Nationwide)</option>
                {ALL_CRAIGSLIST_CITIES.map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Max Price</Label>
              <Input
                placeholder="e.g. 300000"
                type="number"
                value={maxPrice}
                onChange={e => setMaxPrice(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleAISearch}
            disabled={isSearching}
            className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto"
          >
            {isSearching ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Searching...</>
            ) : (
              <><Search className="w-4 h-4 mr-2" />Search with AI</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Search Results</CardTitle>
                <CardDescription>
                  {filtered.length} of {results.length} listings shown
                </CardDescription>
              </div>
              <div className="relative w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Filter results..."
                  className="pl-9"
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[60vh] overflow-y-auto space-y-3">
            <AnimatePresence>
              {filtered.map((listing, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                        >
                          {listing.title}
                        </a>
                        {listing.motivation_score >= 70 && (
                          <Badge className="bg-red-100 text-red-700 text-xs">Hot Lead</Badge>
                        )}
                        {listing.motivation_score >= 50 && listing.motivation_score < 70 && (
                          <Badge className="bg-amber-100 text-amber-700 text-xs">Warm</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-emerald-500" />
                          {formatCurrency(listing.price)}
                        </span>
                        {listing.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-orange-500" />
                            {listing.location}
                          </span>
                        )}
                        {listing.beds && <span>{listing.beds}bd/{listing.baths}ba</span>}
                        {listing.sqft && <span>{listing.sqft?.toLocaleString()} sqft</span>}
                        {listing.posted_days_ago !== undefined && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {listing.posted_days_ago === 0 ? "Today" : `${listing.posted_days_ago}d ago`}
                          </span>
                        )}
                      </div>
                      {listing.motivation_indicators?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {listing.motivation_indicators.map((ind, j) => (
                            <Badge key={j} variant="outline" className="text-xs">{ind}</Badge>
                          ))}
                        </div>
                      )}
                      {listing.description && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">{listing.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button asChild variant="outline" size="sm">
                        <a href={listing.url || getCraigslistSearchUrl()} target="_blank" rel="noopener noreferrer">
                          View on CL <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => handleImportToLeads(listing)}
                      >
                        Import Lead
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ── Live API Panel (cl-everywhere) ────────────────────────────────────────────
function LiveAPIPanel({ apiStatus }) {
  const [recipes, setRecipes] = useState([]);
  const [listings, setListings] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipes, setLoadingRecipes] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [recipeUrl, setRecipeUrl] = useState("");
  const [addingRecipe, setAddingRecipe] = useState(false);
  const [filterText, setFilterText] = useState("");
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    setLoadingRecipes(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setRecipes(data);
      if (!selectedRecipe && data.length > 0) setSelectedRecipe(data[0]);
    } catch (e) {
      toast({ title: "API Error", description: e.message, variant: "destructive" });
    } finally {
      setLoadingRecipes(false);
    }
  }, [selectedRecipe, toast]);

  const fetchListings = useCallback(async (recipeId) => {
    if (!recipeId) return;
    setLoadingListings(true);
    setListings([]);
    try {
      const res = await fetch(`${API_BASE_URL}/listings?recipeId=${recipeId}&limit=100`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      setListings(await res.json());
    } catch (e) {
      toast({ title: "Error loading listings", description: e.message, variant: "destructive" });
    } finally {
      setLoadingListings(false);
    }
  }, [toast]);

  useEffect(() => {
    if (apiStatus === "online") fetchRecipes();
  }, [apiStatus, fetchRecipes]);

  useEffect(() => {
    if (selectedRecipe) fetchListings(selectedRecipe.id);
  }, [selectedRecipe, fetchListings]);

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    if (!recipeName || !recipeUrl) return;
    setAddingRecipe(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: recipeName, searchUrl: recipeUrl, cadenceMinutes: 60 })
      });
      if (!res.ok) throw new Error("Failed to add recipe");
      toast({ title: "Recipe added!" });
      setRecipeName("");
      setRecipeUrl("");
      fetchRecipes();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setAddingRecipe(false);
    }
  };

  const handleRefresh = async (recipeId) => {
    try {
      await fetch(`${API_BASE_URL}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, await: true })
      });
      toast({ title: "Refresh started!" });
      if (selectedRecipe?.id === recipeId) fetchListings(recipeId);
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  if (apiStatus === "offline") {
    return (
      <Alert variant="destructive">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>API Offline</AlertTitle>
        <AlertDescription>
          Cannot reach the cl-everywhere API at <code className="font-mono text-xs">{API_BASE_URL}</code>.
          Ensure the service is running, CORS is enabled, and the URL is correct. Use the AI Search tab in the meantime.
        </AlertDescription>
      </Alert>
    );
  }

  const filtered = listings.filter(l =>
    !filterText ||
    l.title?.toLowerCase().includes(filterText.toLowerCase()) ||
    (l.location || "").toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="grid lg:grid-cols-12 gap-6">
      {/* Recipes sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-500" />
              Saved Searches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingRecipes ? (
              <div className="text-center py-8 text-slate-500 text-sm">Loading recipes...</div>
            ) : recipes.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">No recipes yet. Add one below.</div>
            ) : (
              recipes.map(recipe => (
                <div
                  key={recipe.id}
                  onClick={() => setSelectedRecipe(recipe)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRecipe?.id === recipe.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-sm text-slate-900">{recipe.name}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="w-7 h-7"
                      onClick={e => { e.stopPropagation(); handleRefresh(recipe.id); }}
                    >
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Last run: {recipe.last_run ? new Date(recipe.last_run).toLocaleString() : "Never"}
                  </p>
                </div>
              ))
            )}

            {/* Add recipe form */}
            <form onSubmit={handleAddRecipe} className="space-y-2 pt-2 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-700">Add New Recipe</p>
              <Input placeholder="Recipe name..." value={recipeName} onChange={e => setRecipeName(e.target.value)} />
              <Input placeholder="Craigslist search URL..." value={recipeUrl} onChange={e => setRecipeUrl(e.target.value)} />
              <Button type="submit" size="sm" className="w-full" disabled={addingRecipe || !recipeName || !recipeUrl}>
                {addingRecipe ? "Adding..." : <><Plus className="w-3 h-3 mr-1" />Add Recipe</>}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      <div className="lg:col-span-8">
        <Card className="border-slate-200 shadow-sm h-full">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-base">
                  {selectedRecipe ? `"${selectedRecipe.name}"` : "Select a Recipe"}
                </CardTitle>
                <CardDescription>{filtered.length} of {listings.length} listings</CardDescription>
              </div>
              <div className="relative w-52">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input placeholder="Filter..." className="pl-9" value={filterText} onChange={e => setFilterText(e.target.value)} />
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[65vh] overflow-y-auto">
            {loadingListings ? (
              <div className="text-center py-12 text-slate-500">Loading listings...</div>
            ) : !selectedRecipe ? (
              <div className="text-center py-12 text-slate-500">Select a recipe to see listings.</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p className="font-semibold">No listings found.</p>
                <p className="text-sm mt-1">Try refreshing the recipe.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((listing, i) => (
                  <div key={listing.id || listing.url || i} className="p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <a href={listing.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:text-blue-600 transition-colors">
                          {listing.title}
                        </a>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 mt-1">
                          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-emerald-500" />{formatCurrency(listing.price)}</span>
                          {listing.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-orange-500" />{listing.location}</span>}
                          {listing.postedAt && <span className="flex items-center gap-1"><Calendar className="w-4 h-4 text-slate-400" />{new Date(listing.postedAt).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <a href={listing.url} target="_blank" rel="noopener noreferrer">
                          View <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CraigslistLeads() {
  const [apiStatus, setApiStatus] = useState("checking"); // "checking" | "online" | "offline"
  const [showSetupGuide, setShowSetupGuide] = useState(false);
  const [activeTab, setActiveTab] = useState("ai");

  useEffect(() => {
    const checkAPI = async () => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(`${API_BASE_URL}/recipes`, { signal: controller.signal });
        clearTimeout(timeout);
        setApiStatus(res.ok ? "online" : "offline");
        if (res.ok) setActiveTab("live");
      } catch {
        setApiStatus("offline");
      }
    };
    checkAPI();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">Craigslist Leads</h1>
            <p className="text-slate-600">Find off-market deals from Craigslist using AI search or live API scraping.</p>
          </div>
          <div className="flex items-center gap-3">
            {/* API status badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm">
              {apiStatus === "checking" && <><Loader2 className="w-3 h-3 animate-spin text-slate-400" /><span className="text-slate-500">Checking API...</span></>}
              {apiStatus === "online" && <><CheckCircle className="w-3 h-3 text-emerald-500" /><span className="text-emerald-700">Live API Online</span></>}
              {apiStatus === "offline" && <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-600">Live API Offline</span></>}
            </div>
            <Button onClick={() => setShowSetupGuide(!showSetupGuide)} variant="outline" size="sm">
              {showSetupGuide ? "Hide Guide" : "Setup Guide"}
            </Button>
          </div>
        </div>

        {showSetupGuide && <div className="mb-8"><CraigslistSetupGuide /></div>}

        {/* Main tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="ai" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Search
            </TabsTrigger>
            <TabsTrigger value="live" className="gap-2">
              <Server className="w-4 h-4" />
              Live API
              {apiStatus === "offline" && <Badge className="ml-1 bg-red-100 text-red-600 text-xs px-1 py-0">Offline</Badge>}
              {apiStatus === "online" && <Badge className="ml-1 bg-emerald-100 text-emerald-600 text-xs px-1 py-0">Online</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <AISearchPanel />
          </TabsContent>

          <TabsContent value="live">
            <LiveAPIPanel apiStatus={apiStatus} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}