import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-memory mock data (replace with real DB integration)
const mockLeads = [
  { id: '1', address: '123 Elm St', city: 'Nashville', state: 'TN', zip: '37201', deal_score: 92, status: 'Active Lead', list_price: 185000, projected_profit: 45000, property_type: 'Single Family', created_date: new Date().toISOString() },
  { id: '2', address: '456 Oak Ave', city: 'Memphis', state: 'TN', zip: '38101', deal_score: 85, status: 'Under Review', list_price: 125000, projected_profit: 32000, property_type: 'Duplex', created_date: new Date().toISOString() },
  { id: '3', address: '789 Pine Rd', city: 'Knoxville', state: 'TN', zip: '37901', deal_score: 78, status: 'Active Lead', list_price: 210000, projected_profit: 28000, property_type: 'Single Family', created_date: new Date().toISOString() },
  { id: '4', address: '321 Maple Dr', city: 'Chattanooga', state: 'TN', zip: '37401', deal_score: 88, status: 'Offer Sent', list_price: 155000, projected_profit: 38000, property_type: 'Condo', created_date: new Date().toISOString() },
  { id: '5', address: '654 Cedar Ln', city: 'Nashville', state: 'TN', zip: '37202', deal_score: 95, status: 'Active Lead', list_price: 98000, projected_profit: 55000, property_type: 'Single Family', created_date: new Date().toISOString() },
];

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /leads
app.get('/leads', (req, res) => {
  let { limit = 50, offset = 0, status, sort = '-created_date' } = req.query;
  limit = parseInt(limit);
  offset = parseInt(offset);
  let leads = [...mockLeads];
  if (status) leads = leads.filter(l => l.status === status);
  if (sort.startsWith('-')) {
    const key = sort.slice(1);
    leads.sort((a, b) => (b[key] ?? 0) - (a[key] ?? 0));
  } else {
    leads.sort((a, b) => (a[sort] ?? 0) - (b[sort] ?? 0));
  }
  const paginated = leads.slice(offset, offset + limit);
  res.json({ leads: paginated, total: leads.length });
});

// GET /leads/hot
app.get('/leads/hot', (req, res) => {
  const { minScore = 80, limit = 20 } = req.query;
  const hot = mockLeads
    .filter(l => l.deal_score >= parseInt(minScore))
    .sort((a, b) => b.deal_score - a.deal_score)
    .slice(0, parseInt(limit));
  res.json({ leads: hot, total: hot.length });
});

// GET /leads/search
app.get('/leads/search', (req, res) => {
  const { q = '', limit = 20 } = req.query;
  const query = q.toLowerCase();
  const results = mockLeads
    .filter(l =>
      l.address?.toLowerCase().includes(query) ||
      l.city?.toLowerCase().includes(query) ||
      l.zip?.includes(query)
    )
    .slice(0, parseInt(limit));
  res.json({ leads: results, total: results.length });
});

// GET /leads/:id
app.get('/leads/:id', (req, res) => {
  const lead = mockLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  res.json(lead);
});

// GET /stats/dashboard
app.get('/stats/dashboard', (req, res) => {
  const hotLeads = mockLeads.filter(l => l.deal_score >= 80).length;
  const avgDealScore = mockLeads.reduce((s, l) => s + l.deal_score, 0) / mockLeads.length;
  const totalProjectedProfit = mockLeads.reduce((s, l) => s + (l.projected_profit || 0), 0);
  res.json({
    totalLeads: mockLeads.length,
    hotLeads,
    avgDealScore,
    totalProjectedProfit,
    newLeadsToday: 2,
    conversionRate: 18.5,
    topMarkets: ['Nashville', 'Memphis', 'Knoxville'],
  });
});

app.listen(PORT, () => {
  console.log(`Apex Deal Flow API running on port ${PORT}`);
});
