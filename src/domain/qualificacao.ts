import { LOCALIZACAO_ANTIGA_ANOS } from '../config';
import type { AnpCombustivelRaw, Qualificacao } from '../types';
import { normalizar, parseDataBr } from '../utils/text';

export const ehBandeiraBranca = (distribuidora: string): boolean =>
  normalizar(distribuidora).includes('BANDEIRA BRANCA');

/**
 * Critérios 100% derivados do cadastro público da ANP (nada inventado):
 *
 * ALERTAS (colocam o posto em "atenção"):
 *  - inadimplenciaPMQC preenchido: pendência no Programa de Monitoramento da
 *    Qualidade dos Combustíveis.
 *  - statusSIGAF preenchido: o cadastro traz uma situação especial no sistema da ANP.
 *
 * SELOS (informativos):
 *  - bandeira de distribuidora identificada (origem do combustível rastreável);
 *  - localização conferida por agente de fiscalização da ANP.
 *
 * Importante: o cadastro NÃO traz preço nem resultado de análise de laboratório,
 * então "regular" significa "sem pendências registradas", não "combustível testado".
 */
export function qualificar(raw: AnpCombustivelRaw, agora: Date = new Date()): Qualificacao {
  const alertas: string[] = [];
  const selos: string[] = [];

  const pendenciasPmqc = Array.isArray(raw.inadimplenciaPMQC) ? raw.inadimplenciaPMQC.length : 0;
  if (pendenciasPmqc > 0) {
    alertas.push(
      pendenciasPmqc === 1
        ? '1 pendência no monitoramento de qualidade (PMQC)'
        : `${pendenciasPmqc} pendências no monitoramento de qualidade (PMQC)`,
    );
  }

  const sigaf = raw.statusSIGAF?.trim();
  if (sigaf) alertas.push(`Situação registrada na ANP (SIGAF): ${sigaf}`);

  if (!ehBandeiraBranca(raw.distribuidora)) {
    selos.push(`Bandeira ${raw.distribuidora.trim()}`);
  }

  if (normalizar(raw.origemInformacao ?? '').includes('FISCALIZACAO')) {
    selos.push('Localização conferida pela fiscalização da ANP');
  }

  const data = parseDataBr(raw.dataObtencao ?? '');
  if (data && agora.getFullYear() - data.getFullYear() >= LOCALIZACAO_ANTIGA_ANOS) {
    alertas.push(`Dados de localização de ${data.getFullYear()} (podem estar desatualizados)`);
  }

  // Dado antigo é só um aviso; não rebaixa o posto sozinho.
  const graves = alertas.filter((a) => !a.startsWith('Dados de localização'));
  return { nivel: graves.length > 0 ? 'atencao' : 'regular', alertas, selos };
}
