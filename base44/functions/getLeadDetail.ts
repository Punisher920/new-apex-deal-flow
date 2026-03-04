import axios from 'axios';

const API_URL = process.env.DEAL_FLOW_API_URL || 'http://localhost:8080';

export default async function getLeadDetail({ id }: { id: string }) {
  const response = await axios.get(`${API_URL}/leads/${id}`);
  return response.data;
}
