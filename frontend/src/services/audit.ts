export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  timestamp: string;
}

export const getAuditLogs = async (): Promise<AuditLog[]> => {
  return [];
};
