import type { ApiResponse } from '../types/api';
import type { SimulationState } from '../types/incident';
import { mockSimulationState } from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

function createErrorResponse<T>(code: string, message: string): ApiResponse<T> {
  return {
    success: false,
    data: null,
    error: { code, message },
  };
}

export const startSimulation = async (scenario: 'suspicious' | 'benign'): Promise<ApiResponse<SimulationState>> => {
  if (USE_MOCK) {
    await delay();
    return {
      success: true,
      data: { ...mockSimulationState, scenario },
      error: null,
    };
  }

  try {
    const res = await fetch(`${BASE_URL}/simulation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (!res.ok) return createErrorResponse('HTTP_ERROR', `Request failed with status ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return createErrorResponse('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error');
  }
};

export const nextEvent = async (): Promise<ApiResponse<SimulationState>> => {
  if (USE_MOCK) {
    await delay();
    return { success: true, data: mockSimulationState, error: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/simulation/next`, { method: 'POST' });
    if (!res.ok) return createErrorResponse('HTTP_ERROR', `Request failed with status ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return createErrorResponse('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error');
  }
};

export const previousEvent = async (): Promise<ApiResponse<SimulationState>> => {
  if (USE_MOCK) {
    await delay();
    return { success: true, data: mockSimulationState, error: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/simulation/previous`, { method: 'POST' });
    if (!res.ok) return createErrorResponse('HTTP_ERROR', `Request failed with status ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return createErrorResponse('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error');
  }
};

export const resetSimulation = async (): Promise<ApiResponse<SimulationState>> => {
  if (USE_MOCK) {
    await delay();
    return { success: true, data: mockSimulationState, error: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/simulation/reset`, { method: 'POST' });
    if (!res.ok) return createErrorResponse('HTTP_ERROR', `Request failed with status ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return createErrorResponse('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error');
  }
};

export const getSimulationState = async (): Promise<ApiResponse<SimulationState>> => {
  if (USE_MOCK) {
    await delay();
    return { success: true, data: mockSimulationState, error: null };
  }

  try {
    const res = await fetch(`${BASE_URL}/simulation/state`);
    if (!res.ok) return createErrorResponse('HTTP_ERROR', `Request failed with status ${res.status}`);
    return await res.json();
  } catch (err: unknown) {
    return createErrorResponse('NETWORK_ERROR', err instanceof Error ? err.message : 'Network error');
  }
};
