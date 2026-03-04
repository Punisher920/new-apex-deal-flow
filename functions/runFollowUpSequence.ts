import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { type, id, method } = await req.json();
    // type: 'lead' | 'buyer'

    let results = { sent: [], skipped: [] };

    if (type === 'lead') {
      const properties = id
        ? [await base44.entities.Property.get(id)]
        : await base44.entities.Property.filter({ status: "Active Lead" });

      for (const property of properties) {
        const owner = await base44.entities.Owner.filter({ parcel_id: property.parcel_id });
        if (!owner || owner.length === 0) { results.skipped.push(property.id); continue; }

        const ownerData = owner[0];
        const recentLogs = await base44.entities.OutreachLog.filter({ parcel_id: property.parcel_id });
        const daysSinceLastContact = recentLogs.length > 0
          ? Math.floor((Date.now() - new Date(recentLogs[0].contact_date)) / (1000 * 60 * 60 * 24))
          : 999;

        if (daysSinceLastContact < 3 && !id) { results.skipped.push(property.id); continue; }

        const contactMethod = method || (recentLogs.length === 0 ? "SMS" : recentLogs.length === 1 ? "Email" : "Phone");
        const firstName = ownerData.owner_name?.split(' ')[0] || "Homeowner";

        let message = "";
        if (contactMethod === "SMS") {
          message = `Hi ${firstName}, I'm a local cash buyer interested in your property at ${property.address}. No agents, fast close. Would you consider an offer? Reply YES to learn more.`;
        } else if (contactMethod === "Email") {
          message = `Dear ${ownerData.owner_name},\n\nI hope you're doing well. I'm a local real estate investor and I wanted to follow up about your property at ${property.address}.\n\nI can offer a fair cash offer with a quick, hassle-free closing - no repairs needed, no agent fees. Please reply or call if you'd like to explore options.\n\nBest regards`;
        } else {
          message = `Follow-up call script: Ask about timeline, motivation, price expectations. Property: ${property.address}`;
        }

        await base44.entities.OutreachLog.create({
          parcel_id: property.parcel_id,
          owner_name: ownerData.owner_name,
          contact_method: contactMethod,
          contact_date: new Date().toISOString(),
          message_sent: message,
          follow_up_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: "Sent"
        });

        if (contactMethod === "Email") {
          await base44.integrations.Core.SendEmail({
            to: user.email,
            subject: `[DealFinder] Follow-up sent to ${ownerData.owner_name} - ${property.address}`,
            body: `A follow-up ${contactMethod} was automatically sent to ${ownerData.owner_name} for ${property.address}.\n\nMessage:\n${message}`
          });
        }

        results.sent.push({ property_id: property.id, address: property.address, method: contactMethod });
      }
    } else if (type === 'buyer') {
      const buyers = id
        ? [await base44.entities.Buyer.get(id)]
        : await base44.entities.Buyer.filter({ status: "Active" });

      const properties = await base44.entities.Property.filter({ status: "Active Lead" });

      for (const buyer of buyers) {
        const matchingProps = properties.filter(p => {
          const priceOk = (!buyer.min_price || p.assessed_value >= buyer.min_price) &&
                         (!buyer.max_price || p.assessed_value <= buyer.max_price);
          return priceOk;
        }).slice(0, 3);

        if (matchingProps.length === 0) { results.skipped.push(buyer.id); continue; }

        const propList = matchingProps.map(p => `- ${p.address}, ${p.city} ${p.state} | Est. Value: $${(p.assessed_value || 0).toLocaleString()}`).join('\n');

        const emailBody = `Hi ${buyer.name.split(' ')[0]},\n\nWe have ${matchingProps.length} new deal(s) that match your criteria:\n\n${propList}\n\nReply to this email or log in to DealFinder to review and make offers.\n\nHappy investing!`;

        await base44.integrations.Core.SendEmail({
          to: buyer.email,
          subject: `[DealFinder] ${matchingProps.length} New Deals Match Your Criteria`,
          body: emailBody
        });

        await base44.entities.OutreachLog.create({
          parcel_id: matchingProps[0]?.parcel_id || 'buyer-outreach',
          owner_name: buyer.name,
          contact_method: "Email",
          contact_date: new Date().toISOString(),
          message_sent: emailBody,
          status: "Sent"
        });

        results.sent.push({ buyer_id: buyer.id, name: buyer.name, deals_sent: matchingProps.length });
      }
    }

    return Response.json({ success: true, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});