import type { AnpCombustivelRaw, AnpGlpRaw, Posto, ProdutoPosto, RevendedorGlp } from '../types';
import { parseCoordenadas } from '../utils/geo';
import { categoriaDoProduto, nomeAmigavel } from './combustiveis';
import { ehBandeiraBranca, qualificar } from './qualificacao';


export function converterPosto(raw: AnpCombustivelRaw): Posto | null {
  // Só contam produtos com bico: a ANP lista, por exemplo, GNV com 0 bicos e 0 m³
  // em postos que não vendem GNV de fato.
  const produtos: ProdutoPosto[] = [];
  for (const p of raw.produtos ?? []) {
    const categoria = categoriaDoProduto(p.produto);
    if (!categoria || !(p.qtdeBicos > 0)) continue;
    produtos.push({
      nomeAnp: p.produto,
      nome: nomeAmigavel(p.produto),
      categoria,
      bicos: p.qtdeBicos,
      tancagemM3: p.tancagem,
    });
  }

  // Descarta cadastros que não abastecem veículos rodoviários (ex.: hangar de aviação).
  if (produtos.length === 0) return null;

  produtos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  return {
    id: raw.codigoSIMP,
    nome: raw.razaoSocial.trim(),
    cnpj: raw.cnpj,
    autorizacao: raw.autorizacao,
    endereco: raw.endereco.replace(/\s+/g, ' ').trim(),
    complemento: (raw.complemento ?? '').trim(),
    bairro: raw.bairro.trim(),
    cep: raw.cep,
    municipio: raw.municipio,
    uf: raw.uf,
    bandeira: raw.distribuidora.trim(),
    bandeiraBranca: ehBandeiraBranca(raw.distribuidora),
    produtos,
    categorias: [...new Set(produtos.map((p) => p.categoria))],
    totalBicos: produtos.reduce((soma, p) => soma + p.bicos, 0),
    coords: parseCoordenadas(raw.latitude, raw.longitude),
    observacao: (raw.observacao ?? '').trim(),
    origemInformacao: (raw.origemInformacao ?? '').trim(),
    dataObtencao: raw.dataObtencao ?? '',
    dataPublicacao: raw.dataPublicacao ?? '',
    qualificacao: qualificar(raw),
  };
}

export function converterGlp(raw: AnpGlpRaw): RevendedorGlp {
  return {
    id: raw.codigoSIMP,
    nome: raw.razaoSocial.trim(),
    cnpj: raw.cnpj,
    autorizacao: raw.autorizacao,
    endereco: raw.endereco.replace(/\s+/g, ' ').trim(),
    complemento: (raw.complemento ?? '').replace(/\s+/g, ' ').trim(),
    bairro: raw.bairro.trim(),
    cep: raw.cep,
    municipio: raw.municipio,
    uf: raw.uf,
    bandeira: raw.distribuidora.trim(),
    classe: (raw.classe ?? '').trim(),
    dataPublicacao: raw.dataPublicacao ?? '',
  };
}

