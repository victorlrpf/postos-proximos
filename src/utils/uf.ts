import { normalizar } from './text';

const ESTADOS: Record<string, string> = {
  ACRE: 'AC',
  ALAGOAS: 'AL',
  AMAPA: 'AP',
  AMAZONAS: 'AM',
  BAHIA: 'BA',
  CEARA: 'CE',
  'DISTRITO FEDERAL': 'DF',
  'ESPIRITO SANTO': 'ES',
  GOIAS: 'GO',
  MARANHAO: 'MA',
  'MATO GROSSO': 'MT',
  'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG',
  PARA: 'PA',
  PARAIBA: 'PB',
  PARANA: 'PR',
  PERNAMBUCO: 'PE',
  PIAUI: 'PI',
  'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN',
  'RIO GRANDE DO SUL': 'RS',
  RONDONIA: 'RO',
  RORAIMA: 'RR',
  'SANTA CATARINA': 'SC',
  'SAO PAULO': 'SP',
  SERGIPE: 'SE',
  TOCANTINS: 'TO',
};

const SIGLAS = new Set(Object.values(ESTADOS));

/** Aceita "São Paulo", "SP", "Estado de São Paulo"... e devolve a sigla, ou null. */
export function paraUf(regiao: string | null | undefined): string | null {
  if (!regiao) return null;
  const n = normalizar(regiao).replace(/^ESTADO D[EO] /, '');
  if (SIGLAS.has(n)) return n;
  return ESTADOS[n] ?? null;
}

export const isUfValida = (uf: string): boolean => SIGLAS.has(uf.trim().toUpperCase());
