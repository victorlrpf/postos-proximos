import AsyncStorage from '@react-native-async-storage/async-storage';

import { ANP_BASE_URL, CACHE_TTL_MS, TIMEOUT_MS } from '../config';
import { converterGlp, converterPosto } from '../domain/conversores';
import type {
  AnpCombustivelRaw,
  AnpEnvelope,
  AnpGlpRaw,
  Local,
  Posto,
  RevendedorGlp,
} from '../types';
import { normalizar, semAcento } from '../utils/text';

export interface Resultado<T> {
  itens: T[];
  /** true quando a rede falhou e estamos mostrando o último cache salvo. */
  desatualizado: boolean;
  /** Quando os dados foram baixados da ANP. */
  baixadoEm: number;
}

interface CacheEntrada<T> {
  baixadoEm: number;
  data: T[];
}

type Recurso = 'combustivel' | 'glp';

const chaveCache = (recurso: Recurso, local: Local) =>
  `anp:v1:${recurso}:${local.uf}:${normalizar(local.municipio)}`;

async function lerCache<T>(chave: string): Promise<CacheEntrada<T> | null> {
  try {
    const bruto = await AsyncStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as CacheEntrada<T>) : null;
  } catch {
    return null;
  }
}

async function gravarCache<T>(chave: string, data: T[]): Promise<void> {
  try {
    const entrada: CacheEntrada<T> = { baixadoEm: Date.now(), data };
    await AsyncStorage.setItem(chave, JSON.stringify(entrada));
  } catch {
    // cache é só otimização
  }
}

async function requisitar<T>(recurso: Recurso, uf: string, municipio: string): Promise<T[]> {
  const url =
    `${ANP_BASE_URL}/${recurso}?uf=${encodeURIComponent(uf)}` +
    `&municipio=${encodeURIComponent(municipio)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const resposta = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!resposta.ok) throw new Error(`A ANP respondeu com erro ${resposta.status}.`);
    const corpo = (await resposta.json()) as AnpEnvelope<T>;
    if (!corpo.succeeded || !Array.isArray(corpo.data)) {
      throw new Error(corpo.title || 'Resposta inesperada da ANP.');
    }
    return corpo.data;
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error('A ANP demorou demais para responder.');
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Busca um recurso da ANP para o município. Tenta primeiro o nome sem acento
 * (como o cadastro costuma gravar) e, se vier vazio, o nome original. Depois filtra
 * localmente pelo município pedido, para nunca exibir postos de outra cidade caso o
 * filtro do servidor seja ignorado.
 */
async function baixar<TRaw extends { municipio: string; uf: string }>(
  recurso: Recurso,
  local: Local,
): Promise<TRaw[]> {
  const uf = local.uf.trim().toUpperCase();
  const original = local.municipio.trim().toUpperCase();
  const candidatos = [...new Set([semAcento(original), original])];
  const alvo = normalizar(local.municipio);

  for (const nome of candidatos) {
    const dados = await requisitar<TRaw>(recurso, uf, nome);
    const doMunicipio = dados.filter((d) => normalizar(d.municipio) === alvo);
    if (doMunicipio.length > 0) return doMunicipio;
  }
  return [];
}

async function comCache<TRaw extends { municipio: string; uf: string }, TOut>(
  recurso: Recurso,
  local: Local,
  converter: (bruto: TRaw[]) => TOut[],
  forcar: boolean,
): Promise<Resultado<TOut>> {
  const chave = chaveCache(recurso, local);
  const cache = await lerCache<TRaw>(chave);

  if (cache && !forcar && Date.now() - cache.baixadoEm < CACHE_TTL_MS) {
    return { itens: converter(cache.data), desatualizado: false, baixadoEm: cache.baixadoEm };
  }

  try {
    const bruto = await baixar<TRaw>(recurso, local);
    await gravarCache(chave, bruto);
    return { itens: converter(bruto), desatualizado: false, baixadoEm: Date.now() };
  } catch (erro) {
    if (cache) {
      return { itens: converter(cache.data), desatualizado: true, baixadoEm: cache.baixadoEm };
    }
    throw erro;
  }
}

// ---------------------------------------------------------------------------
// API pública do serviço
// ---------------------------------------------------------------------------

export const buscarPostos = (local: Local, forcar = false): Promise<Resultado<Posto>> =>
  comCache<AnpCombustivelRaw, Posto>(
    'combustivel',
    local,
    (bruto) => bruto.map(converterPosto).filter((p): p is Posto => p !== null),
    forcar,
  );

export const buscarRevendedoresGlp = (
  local: Local,
  forcar = false,
): Promise<Resultado<RevendedorGlp>> =>
  comCache<AnpGlpRaw, RevendedorGlp>('glp', local, (bruto) => bruto.map(converterGlp), forcar);
