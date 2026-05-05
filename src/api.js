import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL, timeout: 15000 });

export const scanText = async (text, source = 'Manual Input') => {
  const res = await api.post('/scan', { text, source });
  return res.data;
};

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export default api;
