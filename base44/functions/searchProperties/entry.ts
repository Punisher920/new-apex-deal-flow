import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const RAPIDAPI_KEY = Deno.env.get("RAPIDAPI_KEY");
const RAPIDAPI_HOST = "realty-in-us.p.rapidapi.com";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      city,
      state_code,
      postal_code,
      min_price,
      max_price,
      beds_min,
      baths_min,
      property_type,
      limit = 20,
      offset = 0
    } = body;

    if (!postal_code && !(city && state_code) && !state_code) {
      return Response.json({ error: 'Please provide city+state or zip code' }, { status: 400 });
    }

    // Map property types to realty-in-us API types
    const typeMap = {
      'Single Family': ['single_family'],
      'Multi-Family': ['multi_family', 'duplex_triplex'],
      'Condo': ['condos', 'condo_townhome'],
      'Townhome': ['townhomes', 'condo_townhome']
    };

    const requestBody = {
      limit,
      offset,
      status: ["for_sale"],
      sort: { direction: "desc", field: "list_date" }
    };

    if (postal_code) {
      requestBody.postal_code = postal_code;
    } else {
      if (city) requestBody.city = city;
      if (state_code) requestBody.state_code = state_code;
    }

    if (min_price || max_price) {
      requestBody.list_price = {};
      if (min_price) requestBody.list_price.min = min_price;
      if (max_price) requestBody.list_price.max = max_price;
    }

    if (beds_min) {
      requestBody.beds = { min: beds_min };
    }

    if (baths_min) {
      requestBody.baths = { min: baths_min };
    }

    if (property_type && typeMap[property_type]) {
      requestBody.type = typeMap[property_type];
    }

    const response = await fetch(`https://${RAPIDAPI_HOST}/properties/v3/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('RapidAPI error:', response.status, errText);
      return Response.json({ error: `API error ${response.status}`, details: errText }, { status: response.status });
    }

    const data = await response.json();

    const homes = data?.data?.home_search?.results || [];
    const totalCount = data?.data?.home_search?.total || 0;

    const properties = homes.map((home, index) => {
      const loc = home.location?.address || {};
      const desc = home.description || {};
      const price = home.list_price || 0;
      const sqft = desc.sqft || null;

      // Estimate ARV: 20% above list price (wholesaler will refine in MAO calc)
      const estimatedArv = Math.round(price * 1.20);
      const estimatedRehab = sqft ? Math.min(Math.round(sqft * 25), 65000) : 35000;
      const projectedProfit = Math.round(estimatedArv * 0.70 - price - estimatedRehab - 15000);

      const dom = home.days_on_market || 0;
      const priceReduced = home.price_reduced_amount > 0;
      const dealScore = Math.max(30, Math.min(100,
        50 +
        (dom > 90 ? 20 : dom > 60 ? 12 : dom > 30 ? 6 : 0) +
        (priceReduced ? 15 : 0) +
        (home.flags?.is_foreclosure ? 15 : 0) +
        (projectedProfit > 30000 ? 15 : projectedProfit > 10000 ? 5 : -10)
      ));

      const distressSignals = [];
      if (dom > 30) distressSignals.push(`${dom} days on market`);
      if (priceReduced) distressSignals.push(`Price reduced $${(home.price_reduced_amount || 0).toLocaleString()}`);
      if (home.flags?.is_foreclosure) distressSignals.push('Foreclosure');
      if (home.flags?.is_short_sale) distressSignals.push('Short Sale');
      if (home.flags?.is_price_reduced) distressSignals.push('Price Reduced');
      if (home.tags?.includes('reduced')) distressSignals.push('Price Reduced');

      return {
        id: home.property_id || `prop-${index}`,
        property_id: home.property_id,
        address: loc.line || 'Unknown Address',
        city: loc.city || city || '',
        state: loc.state_code || state_code || '',
        zip_code: loc.postal_code || postal_code || '',
        list_price: price,
        bedrooms: desc.beds || null,
        bathrooms: desc.baths_consolidated || desc.baths || null,
        square_feet: sqft,
        year_built: desc.year_built || null,
        lot_sqft: desc.lot_sqft || null,
        property_type: desc.type || property_type,
        days_on_market: dom,
        price_reduced_amount: home.price_reduced_amount || 0,
        arv: estimatedArv,
        rehab_estimate: estimatedRehab,
        projected_profit: projectedProfit,
        deal_score: dealScore,
        distress_signals: distressSignals,
        photo_url: home.primary_photo?.href || null,
        listing_url: home.href || null,
        mls_id: home.mls?.id || null,
        status: home.status || 'for_sale',
        flags: home.flags || {}
      };
    });

    return Response.json({
      properties,
      total: totalCount,
      source: 'Realtor.com (Live Data)'
    });

  } catch (error) {
    console.error('searchProperties error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});