import type { Categoria } from '../types';
import { normalizar, titulo } from '../utils/text';

export const CATEGORIAS: { key: Categoria; label: string }[] = [
  { key: 'gasolina', label: 'Gasolina' },
  { key: 'etanol', label: 'Etanol' },
  { key: 'diesel', label: 'Diesel' },
  { key: 'gnv', label: 'GNV' },
];

export const labelCategoria = (c: Categoria): string =>
  CATEGORIAS.find((x) => x.key === c)?.label ?? c;

/**
 * Classifica o produto cadastrado na ANP. Produtos que não abastecem veículos
 * de passeio/carga rodoviária (querosene, gasolina de aviação...) retornam null.
 */
export function categoriaDoProduto(produtoAnp: string): Categoria | null {
  const n = normalizar(produtoAnp);
  if (n.includes('AVIACAO') || n.includes('QUEROSENE')) return null;
  if (n.includes('GASOLINA')) return 'gasolina';
  if (n.includes('ETANOL')) return 'etanol';
  if (n.includes('DIESEL')) return 'diesel';
  if (n.includes('GAS NATURAL VEICULAR') || n === 'GNV') return 'gnv';
  return null;
}

/** "ÓLEO DIESEL B S10 - ADITIVADO" -> "Diesel S10 aditivado" */
export function nomeAmigavel(produtoAnp: string): string {
  const n = normalizar(produtoAnp);
  const aditivado = n.includes('ADITIVAD');
  switch (categoriaDoProduto(produtoAnp)) {
    case 'gasolina': {
      const premium = n.includes('PREMIUM');
      if (premium && aditivado) return 'Gasolina premium aditivada';
      if (premium) return 'Gasolina premium';
      if (aditivado) return 'Gasolina aditivada';
      return 'Gasolina comum';
    }
    case 'etanol':
      return aditivado ? 'Etanol aditivado' : 'Etanol';
    case 'diesel': {
      const tipo = n.includes('S10') ? 'S10' : n.includes('S500') ? 'S500' : '';
      return ['Diesel', tipo, aditivado ? 'aditivado' : ''].filter(Boolean).join(' ');
    }
    case 'gnv':
      return 'GNV';
    default:
      return titulo(produtoAnp);
  }
}
