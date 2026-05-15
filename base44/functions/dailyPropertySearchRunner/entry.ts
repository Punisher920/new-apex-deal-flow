import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Default search markets - can be customized based on user criteria
    const searchMarkets = [
      { location: 'Knoxville, TN', property_types: ['Single Family', 'Multi-Family'], max_price: 250000 },
      { location: 'Nashville, TN', property_types: ['Single Family', 'Multi-Family'], max_price: 300000 },
      { location: 'Memphis, TN', property_types: ['Single Family', 'Multi-Family'], max_price: 200000 }
    ];

    const allResults = [];

    // Search each market
    for (const market of searchMarkets) {
      const response = await base44.functions.invoke('searchProperties', {
        location: market.location,
        property_types: market.property_types,
        max_price: market.max_price
      });

      if (response.results && response.results.length > 0) {
        // Only keep high-score deals (>70)
        const highScoreDeals = response.results.filter(p => p.deal_score >= 70);
        allResults.push({
          market: market.location,
          count: highScoreDeals.length,
          deals: highScoreDeals.slice(0, 5) // Top 5 per market
        });

        // Store high-score deals as active leads
        for (const deal of highScoreDeals) {
          await base44.entities.Property.create({
            parcel_id: deal.property_id || `${deal.address}-${Date.now()}`,
            address: deal.address,
            city: deal.city,
            state: deal.state,
            zip: deal.zip,
            beds: deal.beds,
            baths: deal.baths,
            building_sqft: deal.sqft,
            last_sale_price: deal.list_price,
            status: 'Active Lead',
            negotiation_notes: `Deal Score: ${deal.deal_score}/100 | Est. Profit: $${deal.projected_profit}`
          });
        }
      }
    }

    return Response.json({
      success: true,
      message: `Daily search complete. Found ${allResults.reduce((sum, m) => sum + m.count, 0)} high-score deals across ${allResults.length} markets`,
      markets: allResults,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});