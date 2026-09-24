export interface SOCEvent {
  id: string;
  timestamp: string;
  eventType: string;
  sourceIp: string;
  destinationIp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'raw' | 'processed' | 'correlated';
  rawPayload?: string;
}
