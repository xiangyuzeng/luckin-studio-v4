export interface Account {
  id: string;
  name: string;
  api_key: string;
  is_primary: boolean;
  daily_quota: number;
  used_today: number;
  last_reset: string | null;
  notes: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateAccountRequest {
  name: string;
  apiKey: string;
  isPrimary?: boolean;
  dailyQuota?: number;
  notes?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  apiKey?: string;
  isPrimary?: boolean;
  dailyQuota?: number;
  notes?: string;
}
