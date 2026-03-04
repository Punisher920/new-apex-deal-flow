import axios from 'axios';

const API_URL = process.env.DEAL_FLOW_API_URL || 'http://localhost:8080';

export default async function getHotLeads({
  minScore = 80,
  limit = 20,
}: {
  minScore?: number;
  limit?: number;
}) {
  const response = await axios.get(`${API_URL}/leads/hot`, {
    params: { minScore, limit },
  });
  return response.data;
}
