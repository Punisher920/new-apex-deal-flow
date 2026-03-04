import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [properties, outreachLogs, buyers, scores, leadSources, maos] = await Promise.all([
      base44.entities.Property.list('-created_date', 500),
      base44.entities.OutreachLog.list('-contact_date', 500),
      base44.entities.Buyer.list('-created_date', 200),
      base44.entities.Score.list('-motivation_score', 500),
      base44.entities.LeadSource.list('-created_date', 500),
      base44.entities.MAOCalculation.list('-calculation_date', 200),
    ]);

    // Pipeline breakdown
    const pipelineStats = {
      "Active Lead": 0, "Under Review": 0, "Offer Sent": 0,
      "Contract": 0, "Assigned": 0, "Closed": 0, "Archived": 0
    };
    properties.forEach(p => { if (pipelineStats[p.status] !== undefined) pipelineStats[p.status]++; });

    // Score distribution
    const scoreDistribution = [
      { range: "90-100", count: 0, label: "Fire" },
      { range: "80-89", count: 0, label: "Hot" },
      { range: "70-79", count: 0, label: "Warm" },
      { range: "60-69", count: 0, label: "Qualified" },
      { range: "0-59", count: 0, label: "Cold" }
    ];
    scores.forEach(s => {
      const score = s.motivation_score || 0;
      if (score >= 90) scoreDistribution[0].count++;
      else if (score >= 80) scoreDistribution[1].count++;
      else if (score >= 70) scoreDistribution[2].count++;
      else if (score >= 60) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    });

    // Outreach engagement
    const outreachByMethod = { SMS: 0, Email: 0, Phone: 0, Mail: 0 };
    const outreachByStatus = { Sent: 0, Delivered: 0, Responded: 0, Interested: 0, "Not Interested": 0 };
    outreachLogs.forEach(log => {
      if (outreachByMethod[log.contact_method] !== undefined) outreachByMethod[log.contact_method]++;
      if (outreachByStatus[log.status] !== undefined) outreachByStatus[log.status]++;
    });

    const responseRate = outreachLogs.length > 0
      ? ((outreachByStatus.Responded + outreachByStatus.Interested) / outreachLogs.length * 100).toFixed(1)
      : 0;

    const interestRate = outreachLogs.length > 0
      ? (outreachByStatus.Interested / outreachLogs.length * 100).toFixed(1)
      : 0;

    // Lead source breakdown
    const sourceBreakdown = {};
    leadSources.forEach(ls => {
      sourceBreakdown[ls.source_type] = (sourceBreakdown[ls.source_type] || 0) + 1;
    });

    // Market breakdown by city
    const marketBreakdown = {};
    properties.forEach(p => {
      const key = `${p.city}, ${p.state}`;
      if (!marketBreakdown[key]) marketBreakdown[key] = { city: p.city, state: p.state, count: 0, closed: 0, totalValue: 0 };
      marketBreakdown[key].count++;
      if (p.status === 'Closed') marketBreakdown[key].closed++;
      marketBreakdown[key].totalValue += p.assessed_value || 0;
    });

    const marketList = Object.values(marketBreakdown)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(m => ({ ...m, conversionRate: m.count > 0 ? ((m.closed / m.count) * 100).toFixed(1) : 0 }));

    // ROI analysis from MAO calculations
    const roiData = maos.map(m => ({
      property_id: m.property_id,
      arv: m.arv,
      rehab: m.rehab_estimate,
      assignment_fee: m.assignment_fee || 0,
      mao_wholesale: m.mao_wholesale,
      projected_roi: m.arv > 0 ? (((m.arv - (m.mao_wholesale || 0) - (m.rehab_estimate || 0)) / (m.mao_wholesale || 1)) * 100).toFixed(1) : 0
    })).filter(r => r.mao_wholesale > 0).slice(0, 20);

    // Buyer conversion
    const activeBuyers = buyers.filter(b => b.status === 'Active').length;
    const vipBuyers = buyers.filter(b => b.buyer_tier === 'A-List').length;
    const totalDeals = buyers.reduce((s, b) => s + (b.deals_purchased || 0), 0);
    const totalVolume = buyers.reduce((s, b) => s + (b.total_volume || 0), 0);

    // Monthly trend (last 6 months)
    const now = new Date();
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      const monthStart = d.toISOString();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
      const leadsAdded = properties.filter(p => p.created_date >= monthStart && p.created_date <= monthEnd).length;
      const outreachSent = outreachLogs.filter(l => l.contact_date >= monthStart && l.contact_date <= monthEnd).length;
      monthlyTrend.push({ month, leadsAdded, outreachSent });
    }

    return Response.json({
      success: true,
      summary: {
        total_leads: properties.length,
        hot_leads: scores.filter(s => (s.motivation_score || 0) >= 80).length,
        total_outreach: outreachLogs.length,
        response_rate: parseFloat(responseRate),
        interest_rate: parseFloat(interestRate),
        active_buyers: activeBuyers,
        vip_buyers: vipBuyers,
        total_deals_closed: pipelineStats["Closed"],
        total_buyer_volume: totalVolume,
        avg_roi: roiData.length > 0 ? (roiData.reduce((s, r) => s + parseFloat(r.projected_roi), 0) / roiData.length).toFixed(1) : 0
      },
      pipeline_stats: Object.entries(pipelineStats).map(([stage, count]) => ({ stage, count })),
      score_distribution: scoreDistribution,
      outreach_by_method: Object.entries(outreachByMethod).map(([method, count]) => ({ method, count })),
      outreach_by_status: Object.entries(outreachByStatus).map(([status, count]) => ({ status, count })),
      source_breakdown: Object.entries(sourceBreakdown).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
      market_breakdown: marketList,
      roi_data: roiData,
      monthly_trend: monthlyTrend,
      buyer_stats: {
        total: buyers.length,
        active: activeBuyers,
        vip: vipBuyers,
        total_deals: totalDeals,
        total_volume: totalVolume
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});