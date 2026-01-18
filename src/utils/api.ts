import axios from 'axios';
import { Solution } from '../types';

const API_BASE_URL = import.meta.env.VITE_AWS_API_URL || 'http://localhost:3001';
console.log('API_BASE_URL', API_BASE_URL);
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const solveTowerOfHanoi = async (numberOfDisks: number): Promise<Solution> => {
  // Use /solve for production (API Gateway URL already includes /dev stage)
  // Use /dev/solve for local development (serverless-offline)
  const endpoint = API_BASE_URL.includes('localhost') ? '/dev/solve' : '/solve';
  const response = await api.post<Solution>(endpoint, { numberOfDisks });
  return response.data;
};
