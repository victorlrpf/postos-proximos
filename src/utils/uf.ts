import { normalizar } from './text';

export const ESTADOS_BRASIL = [
  { nome: 'Acre', uf: 'AC' },
  { nome: 'Alagoas', uf: 'AL' },
  { nome: 'Amapá', uf: 'AP' },
  { nome: 'Amazonas', uf: 'AM' },
  { nome: 'Bahia', uf: 'BA' },
  { nome: 'Ceará', uf: 'CE' },
  { nome: 'Distrito Federal', uf: 'DF' },
  { nome: 'Espírito Santo', uf: 'ES' },
  { nome: 'Goiás', uf: 'GO' },
  { nome: 'Maranhão', uf: 'MA' },
  { nome: 'Mato Grosso', uf: 'MT' },
  { nome: 'Mato Grosso do Sul', uf: 'MS' },
  { nome: 'Minas Gerais', uf: 'MG' },
  { nome: 'Pará', uf: 'PA' },
  { nome: 'Paraíba', uf: 'PB' },
  { nome: 'Paraná', uf: 'PR' },
  { nome: 'Pernambuco', uf: 'PE' },
  { nome: 'Piauí', uf: 'PI' },
  { nome: 'Rio de Janeiro', uf: 'RJ' },
  { nome: 'Rio Grande do Norte', uf: 'RN' },
  { nome: 'Rio Grande do Sul', uf: 'RS' },
  { nome: 'Rondônia', uf: 'RO' },
  { nome: 'Roraima', uf: 'RR' },
  { nome: 'Santa Catarina', uf: 'SC' },
  { nome: 'São Paulo', uf: 'SP' },
  { nome: 'Sergipe', uf: 'SE' },
  { nome: 'Tocantins', uf: 'TO' },
] as const;

const ESTADOS = Object.fromEntries(
  ESTADOS_BRASIL.map(({ nome, uf }) => [normalizar(nome), uf]),
);

const SIGLAS: Set<string> = new Set(ESTADOS_BRASIL.map(({ uf }) => uf));

/** Aceita "São Paulo", "SP", "Estado de São Paulo"... e devolve a sigla, ou null. */
export function paraUf(regiao: string | null | undefined): string | null {
  if (!regiao) return null;
  const n = normalizar(regiao).replace(/^ESTADO D[EO] /, '');
  if (SIGLAS.has(n)) return n;
  return ESTADOS[n] ?? null;
}

export const isUfValida = (uf: string): boolean => SIGLAS.has(uf.trim().toUpperCase());
