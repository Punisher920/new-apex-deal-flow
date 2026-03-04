import axios from 'axios';

const API_URL = process.env.DEAL_FLOW_API_URL || 'http://localhost:8080';

export default async function getLeads({
  limit = 50,
  offset = 0,
  status,
  sort = '-created_date',
}: {
  limit?: number;
  offset?: number;
  status?: string;
  sort?: string;
}) {
  const params: Record<string, any> = { limit, offset, sort };
  if (status) params.status = status;

  const response = await axios.get(`${API_URL}/leads`, { params });
  return response.data;
}
