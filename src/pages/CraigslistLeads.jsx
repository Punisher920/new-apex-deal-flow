import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { base44 } from "@/api/base44Client"; // Fixed import
import RecipeManager from "../components/craigslist/RecipeManager";
import ListingViewer from "../components/craigslist/ListingViewer";
import CraigslistSetupGuide from "../components/craigslist/CraigslistSetupGuide";
import { Plus, AlertTriangle, Sparkles, Bot, RefreshCw, Globe } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// IMPORTANT: This URL points to your deployed 'cl-everywhere' API service.
// You can also manage this in your Base44 environment variables.
const API_BASE_URL = "https://apex-deal-flow.onrender.com";

// All Craigslist city subdomains for nationwide scraping
const ALL_CRAIGSLIST_CITIES = [
  "atlanta", "austin", "baltimore", "boston", "charlotte", "chicago", "cincinnati", "cleveland", 
  "columbus", "dallas", "denver", "detroit", "houston", "indianapolis", "jacksonville", "kansascity",
  "lasvegas", "losangeles", "louisville", "memphis", "miami", "milwaukee", "minneapolis", "nashville",
  "neworleans", "newyork", "oklahomacity", "orlando", "philadelphia", "phoenix", "pittsburgh", "portland",
  "raleigh", "richmond", "sacramento", "saltlakecity", "sanantonio", "sandiego", "seattle", "sfbay",
  "stlouis", "tampa", "tucson", "washingtondc", "albuquerque", "anchorage", "bakersfield", "birmingham",
  "boise", "buffalo", "charleston", "coloradosprings", "dayton", "elpaso", "fresno", "greensboro",
  "hartford", "honolulu", "knoxville", "lexington", "littlerock", "madison", "mcallen", "modesto",
  "newjersey", "norfolk", "omaha", "providence", "reno", "rochester", "spokane", "springfield",
  "stockton", "syracuse", "toledo", "tulsa", "wichita", "wilmington", "worcester", "youngstown"
];

// Generate all Craigslist real estate URLs for nationwide scraping
const generateAllCraigslistUrls = (category = "rea") => {
  return ALL_CRAIGSLIST_CITIES.map(city => `https://${city}.craigslist.org/search/${category}`);
};

export default function CraigslistLeads() {
  const [recipes, setRecipes] = useState([]);
  const [listings, setListings] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isLoading, setIsLoading] = useState({ recipes: true, listings: false });
  const [error, setError] = useState(null);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // New state
  const [showSetupGuide, setShowSetupGuide] = useState(false); // New state
  const [isCreatingNationwide, setIsCreatingNationwide] = useState(false);
  const { toast } = useToast();

  const fetchRecipes = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/recipes`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.detail || 'Failed to fetch recipes.');
      }
      const data = await response.json();
      setRecipes(data);
      if (!selectedRecipe && data.length > 0) {
        setSelectedRecipe(data[0]);
      }
    } catch (e) {
      let errorMessage = e.message;
      if (e.message.includes("Failed to fetch")) {
          errorMessage = "Could not connect to the API. Please ensure the URL is correct, the service is running, and CORS is configured to allow requests from this domain.";
      }
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(p => ({ ...p, recipes: false }));
    }
  }, [selectedRecipe, toast]);

  const fetchListings = useCallback(async (recipeId) => {
    if (!recipeId) return;
    setIsLoading(p => ({ ...p, listings: true }));
    setListings([]);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/listings?recipeId=${recipeId}&limit=100`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: `Server responded with ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.detail || 'Failed to fetch listings.');
      }
      const data = await response.json();
      setListings(data);
    } catch (e) {
      let errorMessage = e.message;
      if (e.message.includes("Failed to fetch")) {
          errorMessage = "Could not connect to the API. Please ensure the URL is correct, the service is running, and CORS is configured to allow requests from this domain.";
      }
      setError(errorMessage);
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsLoading(p => ({ ...p, listings: false }));
    }
  }, [toast]);

  useEffect(() => {
    if (API_BASE_URL !== "https://your-deployed-cl-everywhere-api.com") {
      fetchRecipes();
    }
  }, [fetchRecipes]);

  useEffect(() => {
    if (selectedRecipe) {
      fetchListings(selectedRecipe.id);
    }
  }, [selectedRecipe, fetchListings]);

  const handleRefresh = async (recipeId) => {
    toast({ title: "Refreshing...", description: "Kicking off a new scrape. This may take a moment." });
    try {
      const response = await fetch(`${API_BASE_URL}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, await: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Refresh failed');
      toast({ title: "Refresh Complete", description: `Ingested ${result.ingested} new or updated listings.`, variant: "success" });
      if (selectedRecipe?.id === recipeId) {
        fetchListings(recipeId); // Refresh listings view
      }
      fetchRecipes(); // Refresh recipes to update last_run
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  const handleRecipeAdded = () => {
    setIsAddingRecipe(false);
    fetchRecipes();
  };

  const handleCreateNationwideRecipe = async () => {
    setIsCreatingNationwide(true);
    try {
      const allUrls = generateAllCraigslistUrls("rea");
      
      const response = await fetch(`${API_BASE_URL}/recipes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: "🇺🇸 All USA - Real Estate",
          urls: allUrls,
          schedule: "0 */6 * * *" // Every 6 hours
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to create nationwide recipe');
      }

      toast({ 
        title: "Nationwide Recipe Created!", 
        description: `Scraping ${allUrls.length} Craigslist cities for real estate listings.`,
        variant: "success" 
      });
      fetchRecipes();
    } catch (e) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsCreatingNationwide(false);
    }
  };

  const handleAIAnalysis = async () => {
    if (listings.length === 0) {
      toast({ title: "No Listings", description: "Please load listings first.", variant: "destructive" });
      return;
    }

    setIsAnalyzing(true);
    try {
      // Create a conversation with the Apex Deal Flow Manager
      const conversation = await base44.agents.createConversation({
        agent_name: "apex_deal_flow_manager",
        metadata: { name: `Craigslist Analysis - ${selectedRecipe?.name}` }
      });

      // Prepare listing data for the agent
      const listingsSummary = listings.slice(0, 10).map(listing => ({
        title: listing.title,
        price: listing.price,
        location: listing.location,
        url: listing.url,
        posted_at: listing.postedAt
      }));

      // Send the analysis request with explicit action instructions
      await base44.agents.addMessage(conversation, {
        role: 'user',
        content: `ANALYZE AND CREATE PROPERTY RECORDS NOW:

I have ${listings.length} Craigslist real estate leads that need to be processed. For each qualified lead, you MUST:

1. Visit the listing URL and extract ALL property details
2. Use web search to find comparable sales in the area
3. Calculate ARV using 3-5 recent comparable sales
4. Estimate rehab costs based on property condition
5. Calculate MAO using: (ARV × 70%) - Rehab - $20,000 wholesale fee
6. CREATE a Property record in the database with all data
7. CREATE an Owner record if contact info is available
8. CREATE a Score record with motivation indicators

Here are the first 10 listings:
${JSON.stringify(listingsSummary, null, 2)}

DO NOT just analyze - you must CREATE the database records. Use your Property.create, Owner.create, and Score.create tools. 

Report back with:
- Number of properties created
- Number of high-score deals found
- Any errors encountered`
      });

      toast({ 
        title: "AI Analysis Started", 
        description: "The agent is analyzing leads and creating property records. Check Agent Chat for progress.",
        variant: "success" 
      });

    } catch (error) {
      console.error("Error starting AI analysis:", error);
      toast({ title: "Error", description: `Failed to start AI analysis: ${error.message}`, variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  if (API_BASE_URL === "https://your-deployed-cl-everywhere-api.com") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
        <Alert variant="destructive" className="max-w-4xl mx-auto mt-16">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Configuration Required</AlertTitle>
          <AlertDescription>
            Please update the `API_BASE_URL` constant in the file{" "}
            <code className="font-mono bg-red-100 px-1 py-0.5 rounded">pages/CraigslistLeads.jsx</code>{" "}
            to point to your deployed 'cl-everywhere' API service.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 lg:p-8">
      <div className="max-w-8xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Craigslist Leads</h1>
            <p className="text-slate-600 text-lg">Manage saved searches and find off-market deals from Craigslist.</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowSetupGuide(!showSetupGuide)} variant="outline">
              {showSetupGuide ? "Hide Guide" : "Setup Guide"}
            </Button>
            <Button 
              onClick={handleAIAnalysis} 
              disabled={isAnalyzing || listings.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isAnalyzing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" />AI Analyze & Create</>
              )}
            </Button>
            <Button 
              onClick={handleCreateNationwideRecipe} 
              disabled={isCreatingNationwide}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isCreatingNationwide ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Creating...</>
              ) : (
                <><Globe className="w-4 h-4 mr-2" />Scrape All USA</>
              )}
            </Button>
            <Button onClick={() => setIsAddingRecipe(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Search Recipe
            </Button>
          </div>
        </div>

        {showSetupGuide && (
          <div className="mb-8">
            <CraigslistSetupGuide />
          </div>
        )}

        {error && (
            <Alert variant="destructive" className="mb-8">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>API Connection Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        {listings.length > 0 && (
          <Alert className="mb-8 bg-purple-50 border-purple-200">
            <Bot className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-900">AI-Powered Lead Analysis</AlertTitle>
            <AlertDescription className="text-purple-700">
              Click "AI Analyze & Create" to have the Apex Deal Flow Manager automatically analyze these listings, 
              calculate MAO for qualified leads, and CREATE property records in your database.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <RecipeManager
              recipes={recipes}
              selectedRecipe={selectedRecipe}
              onSelectRecipe={setSelectedRecipe}
              onRefresh={handleRefresh}
              isLoading={isLoading.recipes}
              isAdding={isAddingRecipe}
              onAddClose={() => setIsAddingRecipe(false)}
              onRecipeAdded={handleRecipeAdded}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
          <div className="lg:col-span-8">
            <ListingViewer 
              listings={listings}
              isLoading={isLoading.listings}
              recipeName={selectedRecipe?.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}