import { createClientFromRequest } from 'npm:@base44/sdk@0.8.27';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { criteria } = await req.json();

    const locations = criteria?.target_locations?.length
      ? criteria.target_locations
      : ["Nationwide USA"];
    const isNationwide = locations.includes("Nationwide") || locations.includes("Nationwide USA");

    const locationInstruction = isNationwide
      ? "Spread leads across diverse US markets — include properties from at least 5 different states covering Southeast, Midwest, Southwest, Northeast, and South regions."
      : `Target these specific locations: ${locations.join(", ")}.`;

    const prompt = `You are a real estate deal sourcing AI. Generate 8-12 realistic off-market distressed property leads based on this investor profile.

Investor Criteria:
- Investment focus: ${criteria?.investment_focus || "Wholesale"}
- Max price: $${criteria?.max_price || 300000}
- Min bedrooms: ${criteria?.min_beds || 3}
- Property types: ${(criteria?.property_types || ["Single Family"]).join(", ")}

Location instructions: ${locationInstruction}

For each lead, generate realistic and internally consistent data:
- The assessed_value should be realistic for the market (use real comps in your knowledge)
- The last_sale_price should be lower than assessed_value to show equity opportunity
- The motivation_score (0-100) should be driven by the distress signals you assign
- Assign source_type and motivation_factors that align logically (e.g. Probate → "Inherited Property")
- Mix lead temperatures: some Hot (80+), some Warm (65-79), some Qualified (50-64)
- Use realistic US street addresses with correct ZIP codes for the city/state

Return JSON with this exact structure:
{
  "leads": [
    {
      "address": "742 Evergreen Terrace",
      "city": "Memphis",
      "state": "TN",
      "zip": "38103",
      "beds": 3,
      "baths": 2,
      "building_sqft": 1380,
      "year_built": 1975,
      "assessed_value": 148000,
      "last_sale_price": 98000,
      "last_sale_date": "2017-06-12",
      "motivation_score": 84,
      "source_type": "Pre-Foreclosure",
      "motivation_factors": ["Financial Distress", "Time Pressure"],
      "lead_temperature": "Hot",
      "absentee_owner": true,
      "owner_name": "James R. Howard",
      "notes": "Property vacant 10 months. Owner relocated to Georgia. Foreclosure auction scheduled in 60 days."
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

      const equityEstimate = lead.assessed_value && lead.last_sale_price
        ? Math.round(((lead.assessed_value - lead.last_sale_price) / lead.assessed_value) * 100)
        : 0;

      await base44.entities.Score.create({
        parcel_id,
        motivation_score: lead.motivation_score,
        equity_estimate: Math.max(0, equityEstimate),
        flags: [
          ...(lead.absentee_owner ? ["absentee"] : []),
          ...(lead.motivation_score >= 80 ? [] : []),
          ...(equityEstimate >= 30 ? [] : ["equity_low"])
        ]
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