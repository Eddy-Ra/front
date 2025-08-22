export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export type AiEmailResponse = {
  id: number;
  email: string;
  subject: string;
  message: string;
  prospect_status?: string | null;
  validated_by_admin?: boolean | null;
  validated_at?: string | null;
  sent_at?: string | null;
  email_dispatched?: boolean | null;
  created_at?: string | null;
  [key: string]: any;
};

export async function fetchAiEmailResponses(page = 1, perPage = 15): Promise<{ items: AiEmailResponse[]; total: number | null }>
{
  const url = `${API_BASE}/api/ai-email-responses?page=${page}&per_page=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur de chargement');
  return res.json();
}

export async function updateAiEmailResponse(id: number, payload: Partial<AiEmailResponse>): Promise<AiEmailResponse>
{
  const url = `${API_BASE}/api/ai-email-responses/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur de mise à jour');
  return res.json();
}

export async function createAiEmailResponse(payload: Pick<AiEmailResponse, 'email' | 'subject' | 'message'> & Partial<AiEmailResponse>): Promise<AiEmailResponse>
{
  const url = `${API_BASE}/api/ai-email-responses`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur de création');
  return res.json();
}

export type AnalyzeMail = {
  id?: number;
  full_name?: string | null;
  email?: string | null;
  subject?: string | null;
  message?: string | null;
  status?: string | null; // ex: "intéressé", "intéressé plus tard", "non intéressé", "aucun rapport"
  reference?: string | null;
  timestamp?: string | null;
  category_id?: string | number | null;
  Entreprise?: string | null; // colonne telle quelle
  [key: string]: any;
};

export async function fetchAnalyzeMail(page = 1, perPage = 15): Promise<{ items: AnalyzeMail[]; total: number | null }>
{
  const url = `${API_BASE}/api/analyze-mail?page=${page}&per_page=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur de chargement');
  return res.json();
}

export type PromptRelance = {
  id: number;
  label: string;
  type_reponse: string;
  subject_template: string;
  message_template: string;
  language?: string | null;
  tags?: string[] | null;
  active?: boolean | null;
  use_count?: number | null;
  last_used_at?: string | null;
  created_by_email?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function fetchPromptsRelance(page = 1, perPage = 15): Promise<{ items: PromptRelance[]; total: number | null }>
{
  const url = `${API_BASE}/api/prompts-relance?page=${page}&per_page=${perPage}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Erreur de chargement');
  return res.json();
}

export async function createPromptRelance(payload: Partial<PromptRelance>): Promise<PromptRelance>
{
  const url = `${API_BASE}/api/prompts-relance`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur de création');
  return res.json();
}

export async function updatePromptRelance(id: number, payload: Partial<PromptRelance>): Promise<PromptRelance>
{
  const url = `${API_BASE}/api/prompts-relance/${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Erreur de mise à jour');
  return res.json();
}

export async function deletePromptRelance(id: number): Promise<void>
{
  const url = `${API_BASE}/api/prompts-relance/${id}`;
  const res = await fetch(url, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Erreur de suppression');
}


