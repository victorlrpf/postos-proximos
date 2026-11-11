import type { Local } from './types';

export const ANP_BASE_URL = 'https://revendedoresapi.anp.gov.br/v1';

/** Município usado enquanto a localização do aparelho não é conhecida. */
export const LOCAL_PADRAO: Local = { uf: 'SP', municipio: 'AMERICANA' };

/** Tempo máximo de espera por resposta da ANP. */
export const TIMEOUT_MS = 25_000;

/** Por quanto tempo os dados em cache continuam "frescos" (cadastro muda pouco). */
export const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

/** Dados de localização mais antigos que isso recebem um aviso de desatualização. */
export const LOCALIZACAO_ANTIGA_ANOS = 4;
