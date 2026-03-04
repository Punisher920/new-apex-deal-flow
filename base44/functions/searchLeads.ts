import axios from 'axios';

const API_URL = process.env.DEAL_FLOW_API_URL || 'http://localhost:8080';

export default async function searchLeads({
  query,
  limit = 20,
}: {
  query: string;
  limit?: number;
}) {
  const response = await axios.get(`${API_URL}/leads/search`, {
    params: { q: query, limit },
  });
  return response.data;
}
