export interface Client {
  id: string;
  nome_cliente: string;
  cpf_cnpj: string;
  telefone: string;
  email: string;
  endereco_obra: string;
  nome_empreitada: string;
  data_inicio: string;
  data_prevista_conclusao: string;
  status: 'ativa' | 'concluida' | 'pausada';
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface Tool {
  id: string;
  nome: string;
  codigo_patrimonio: string;
  categoria: 'eletrica' | 'manual' | 'pesada' | 'medicao' | 'seguranca' | 'outro';
  descricao: string;
  status: 'disponivel' | 'em_uso' | 'manutencao';
  created_at: string;
}

export interface Report {
  id: string;
  client_id: string;
  data_relatorio: string;
  equipe: string;
  condicoes_climaticas: 'ensolarado' | 'parcialmente_nublado' | 'nublado' | 'chuvoso';
  ferramentas_ids: string[];
  atividades_dia: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
  // joined
  client?: Client;
  images?: ReportImage[];
}

export interface ReportImage {
  id: string;
  report_id: string;
  url: string;
  filename: string;
  created_at: string;
}

export interface Webhook {
  id: string;
  event_type: 'relatorio.criado' | 'relatorio.atualizado' | 'cliente.cadastrado';
  url: string;
  active: boolean;
  created_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event_type: string;
  status_code: number;
  created_at: string;
  payload: string;
}

export const WEATHER_OPTIONS = [
  { value: 'ensolarado', label: '☀️ Ensolarado', icon: '☀️' },
  { value: 'parcialmente_nublado', label: '⛅ Parcialmente Nublado', icon: '⛅' },
  { value: 'nublado', label: '🌥️ Nublado', icon: '🌥️' },
  { value: 'chuvoso', label: '🌧️ Chuvoso', icon: '🌧️' },
] as const;

export const TOOL_CATEGORIES = [
  { value: 'eletrica', label: 'Elétrica' },
  { value: 'manual', label: 'Manual' },
  { value: 'pesada', label: 'Pesada' },
  { value: 'medicao', label: 'Medição' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'outro', label: 'Outro' },
] as const;

export const CLIENT_STATUS = [
  { value: 'ativa', label: 'Ativa', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'concluida', label: 'Concluída', color: 'bg-blue-100 text-blue-700' },
  { value: 'pausada', label: 'Pausada', color: 'bg-amber-100 text-amber-700' },
] as const;

export const TOOL_STATUS = [
  { value: 'disponivel', label: 'Disponível', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'em_uso', label: 'Em uso', color: 'bg-amber-100 text-amber-700' },
  { value: 'manutencao', label: 'Manutenção', color: 'bg-red-100 text-red-700' },
] as const;
