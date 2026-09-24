export interface EvidenceItem {
  id: string;
  incidentId: string;
  type: 'file_hash' | 'ip_address' | 'domain' | 'log_snippet' | 'user_account';
  value: string;
  description?: string;
  collectedAt: string;
  confidenceScore: number;
}
