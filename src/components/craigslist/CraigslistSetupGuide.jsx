import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Code, Rss, Server, Zap, CheckCircle } from 'lucide-react';

export default function CraigslistSetupGuide() {
  return (
    <Card className="glass-effect border-slate-200/50 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          Craigslist Data Source Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rss" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="rss">RSS Feeds</TabsTrigger>
            <TabsTrigger value="python">Python Library</TabsTrigger>
            <TabsTrigger value="api">Scraping APIs</TabsTrigger>
            <TabsTrigger value="custom">Custom API</TabsTrigger>
          </TabsList>

          <TabsContent value="rss" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle className="w-3 h-3 mr-1" />Recommended</Badge>
              <Badge variant="outline">ToS Compliant</Badge>
              <Badge variant="outline">No Coding Required</Badge>
            </div>
            
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Rss className="w-4 h-4 text-orange-500" />
                RSS Feed Method
              </h4>
              <p className="text-sm text-slate-700 mb-3">
                Craigslist provides RSS feeds for all searches. This is the simplest and most ToS-compliant method.
              </p>
              
              <div className="space-y-2">
                <div className="text-sm">
                  <p className="font-medium text-slate-800">Step 1: Perform a Craigslist Search</p>
                  <p className="text-slate-600">Go to Craigslist and search for properties (e.g., "real estate" or "housing")</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">Step 2: Add "format=rss" to the URL</p>
                  <code className="block bg-white p-2 rounded text-xs mt-1">
                    https://tampa.craigslist.org/search/rea?query=foreclosure&format=rss
                  </code>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-slate-800">Step 3: Use that URL in your backend</p>
                  <p className="text-slate-600">Parse the RSS XML with any standard library (Python: feedparser, Node: rss-parser)</p>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="text-blue-800">
                <strong>Pro Tip:</strong> Set up a cron job to fetch the RSS feed every 15-30 minutes to get fresh listings automatically.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="python" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Requires Backend</Badge>
              <Badge variant="outline">More Control</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Code className="w-4 h-4 text-blue-500" />
                python-craigslist Library
              </h4>
              <p className="text-sm text-slate-700 mb-3">
                Use the unofficial Python library to scrape Craigslist in a structured way.
              </p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">Installation:</p>
                  <code className="block bg-white p-2 rounded text-xs">
                    pip install python-craigslist
                  </code>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">Example Usage:</p>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
{`from craigslist import CraigslistHousing

cl = CraigslistHousing(
    site='tampa', 
    category='reo',  # Real estate for sale
    filters={'max_price': 300000, 'min_price': 50000}
)

for result in cl.get_results(sort_by='newest', limit=50):
    print(result['name'], result['price'], result['url'])`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="text-amber-800">
                <strong>Note:</strong> This is screen-scraping. Respect Craigslist ToS and rate-limit your requests (e.g., 1 request every 5 seconds).
              </p>
            </div>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Paid Service</Badge>
              <Badge variant="outline">Reliable</Badge>
              <Badge className="bg-purple-100 text-purple-800">No Maintenance</Badge>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  Third-Party Scraping APIs
                </h4>
                <p className="text-sm text-slate-700 mb-3">
                  Professional scraping services handle proxies, rate limits, and maintenance for you.
                </p>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-blue-500 pl-3">
                    <p className="font-medium text-sm">ScraperAPI</p>
                    <p className="text-xs text-slate-600">General-purpose scraping with geotargeting and JavaScript rendering</p>
                    <code className="text-xs text-slate-500">https://scraperapi.com</code>
                  </div>
                  
                  <div className="border-l-4 border-emerald-500 pl-3">
                    <p className="font-medium text-sm">Apify</p>
                    <p className="text-xs text-slate-600">Marketplace with ready-made Craigslist scrapers</p>
                    <code className="text-xs text-slate-500">https://apify.com/store</code>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-3">
                    <p className="font-medium text-sm">SerpAPI</p>
                    <p className="text-xs text-slate-600">Structured data extraction from search engines and classifieds</p>
                    <code className="text-xs text-slate-500">https://serpapi.com</code>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm">
                <p className="text-emerald-800">
                  <strong>Best For:</strong> Production applications where reliability and compliance are critical.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="outline">Advanced</Badge>
              <Badge variant="outline">Full Control</Badge>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-green-500" />
                Custom API with Puppeteer/Playwright
              </h4>
              <p className="text-sm text-slate-700 mb-3">
                Build your own scraping API with a headless browser for maximum control.
              </p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">Tech Stack:</p>
                  <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                    <li>Puppeteer or Playwright (headless Chrome)</li>
                    <li>Flask or FastAPI (Python) or Express (Node.js)</li>
                    <li>Redis for caching results</li>
                    <li>Celery for background tasks</li>
                  </ul>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">Example API Endpoint:</p>
                  <code className="block bg-white p-2 rounded text-xs">
                    GET /api/craigslist?location=tampa&category=rea&max_price=300000
                  </code>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-800 mb-1">Response Format:</p>
                  <pre className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "listings": [
    {
      "title": "3BR/2BA Foreclosure - Needs Work",
      "price": 125000,
      "location": "Tampa, FL",
      "url": "https://tampa.craigslist.org/...",
      "posted_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 47
}`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm">
              <p className="text-purple-800">
                <strong>Deployment:</strong> Use Render, Railway, or Heroku for easy deployment with automatic scaling.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}