import axios from 'axios';
import { Solution } from '../types';

const API_BASE_URL = import.meta.env.VITE_AWS_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const solveTowerOfHanoi = async (numberOfDisks: number): Promise<Solution> => {
  const endpoint = API_BASE_URL.includes('localhost') ? '/dev/solve' : '/solve';
  const response = await api.post<Solution>(endpoint, { numberOfDisks });
  console.log('response', response);
  return response.data;
};
