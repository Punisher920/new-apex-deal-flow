import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { criteria } = await req.json();

    const prompt = `You are a real estate investment deal sourcing AI. Based on the following investor criteria, generate 5-8 realistic off-market property leads that would match this investor's needs. These should represent properties sourced from public records, FSBO listings, Craigslist, and pre-foreclosure data.

Investor Criteria:
${JSON.stringify(criteria, null, 2)}

For each property, generate realistic data including:
- A real-sounding address in a relevant market
- Property details (beds, baths, sqft, year built)
- Assessed value and estimated last sale price
- A motivation score (0-100) based on distress indicators
- Source type (FSBO, Pre-Foreclosure, Probate, Absentee Owner, Tax Lien, Expired Listing)
- Key motivation factors

Return a JSON array with this structure:
{
  "leads": [
    {
      "address": "123 Main St",
      "city": "Tampa",
      "state": "FL",
      "zip": "33601",
      "beds": 3,
      "baths": 2,
      "building_sqft": 1450,
      "year_built": 1978,
      "assessed_value": 185000,
      "last_sale_price": 142000,
      "last_sale_date": "2019-03-15",
      "motivation_score": 82,
      "source_type": "Pre-Foreclosure",
      "motivation_factors": ["Financial Distress", "Time Pressure"],
      "lead_temperature": "Hot",
      "absentee_owner": true,
      "owner_name": "John Smith",
      "notes": "Property has been vacant 8 months, owner relocated out of state"
    }
  ]
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          leads: {
            type: "array",
            items: {
              type: "object",
              properties: {
                address: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                zip: { type: "string" },
                beds: { type: "number" },
                baths: { type: "number" },
                building_sqft: { type: "number" },
                year_built: { type: "number" },
                assessed_value: { type: "number" },
                last_sale_price: { type: "number" },
                last_sale_date: { type: "string" },
                motivation_score: { type: "number" },
                source_type: { type: "string" },
                motivation_factors: { type: "array", items: { type: "string" } },
                lead_temperature: { type: "string" },
                absentee_owner: { type: "boolean" },
                owner_name: { type: "string" },
                notes: { type: "string" }
              }
            }
          }
        }
      }
    });

    const leads = result.leads || [];
    const created = [];

    for (const lead of leads) {
      const parcel_id = `AI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const property = await base44.entities.Property.create({
        parcel_id,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        beds: lead.beds,
        baths: lead.baths,
        building_sqft: lead.building_sqft,
        year_built: lead.year_built,
        assessed_value: lead.assessed_value,
        last_sale_price: lead.last_sale_price,
        last_sale_date: lead.last_sale_date,
        status: "Active Lead",
        negotiation_notes: `Sourced via AI: ${lead.source_type}. ${lead.notes || ''}`
      });

      await base44.entities.Owner.create({
        parcel_id,
        owner_name: lead.owner_name || "Unknown Owner",
        absentee_owner: lead.absentee_owner || false,
        mailing_address: lead.absentee_owner ? "Out of state" : lead.address
      });

      await base44.entities.Score.create({
        parcel_id,
        motivation_score: lead.motivation_score,
        equity_estimate: Math.round(((lead.assessed_value - lead.last_sale_price) / lead.assessed_value) * 100) || 0,
        flags: lead.absentee_owner ? ["absentee"] : []
      });

      await base44.entities.LeadSource.create({
        property_id: property.id,
        source_type: lead.source_type || "FSBO",
        motivation_factors: lead.motivation_factors || [],
        lead_temperature: lead.lead_temperature || "Warm",
        discovered_date: new Date().toISOString().split('T')[0]
      });

      created.push({ ...lead, property_id: property.id, parcel_id });
    }

    return Response.json({ success: true, leads_created: created.length, leads: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});