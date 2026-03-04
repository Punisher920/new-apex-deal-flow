import axios from 'axios';

const API_URL = process.env.DEAL_FLOW_API_URL || 'http://localhost:8080';

export default async function getDashboardStats() {
  const response = await axios.get(`${API_URL}/stats/dashboard`);
  return response.data;
  // Returns: { totalLeads, hotLeads, avgDealScore, totalProjectedProfit,
  //            newLeadsToday, conversionRate, topMarkets }
}
