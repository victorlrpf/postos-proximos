/**
 * Verificação da lógica de conversão/qualificação com registros reais do cadastro da ANP
 * (município de Americana/SP, consulta de 10/11/2026). Rode com: npm run verificar
 */
import assert from 'node:assert/strict';

import { categoriaDoProduto, nomeAmigavel } from '../src/domain/combustiveis';
import { converterGlp, converterPosto } from '../src/domain/conversores';
import type { AnpCombustivelRaw, AnpGlpRaw } from '../src/types';
import { distanciaKm, formatarDistancia, parseCoordenadas } from '../src/utils/geo';
import { normalizar, titulo } from '../src/utils/text';
import { paraUf } from '../src/utils/uf';

const base = {
  autorizacao: 'X',
  dataPublicacao: '01/01/2020',
  cnpj: '61639713000194',
  complemento: '',
  cep: '13468450',
  uf: 'SP',
  municipio: 'AMERICANA',
  validacao: '',
  observacao: '',
  statusSIGAF: '',
  inadimplenciaPMQC: [] as unknown[],
};

const tokio: AnpCombustivelRaw = {
  ...base,
  codigoSIMP: '1317821',
  razaoSocial: 'POSTO TOKIO PETRO 9 LTDA',
  endereco: 'RUA IGARATA,  725',
  bairro: 'JARDIM IPIRANGA',
  distribuidora: 'BANDEIRA BRANCA',
  produtos: [
    { produto: 'ETANOL HIDRATADO COMUM', tancagem: 30, unidMedidaTancagem: 'm³', qtdeBicos: 4 },
    { produto: 'GÁS NATURAL VEICULAR', tancagem: 0, unidMedidaTancagem: 'm³', qtdeBicos: 0 },
    { produto: 'GASOLINA C COMUM', tancagem: 15, unidMedidaTancagem: 'm³', qtdeBicos: 4 },
    { produto: 'GASOLINA C COMUM ADITIVADA', tancagem: 15, unidMedidaTancagem: 'm³', qtdeBicos: 4 },
  ],
  latitude: '-22.7463243',
  longitude: '-47.36122765',
  dataObtencao: '01/04/2026',
  origemInformacao: 'Preposto da empresa',
};

const semCoordenadas: AnpCombustivelRaw = {
  ...base,
  codigoSIMP: '1054272',
  razaoSocial: 'AMERICAMANIA - COMERCIO VAREJISTA DE COMBUSTIVEIS LTDA',
  endereco: 'AVENIDA BRASIL,  780',
  bairro: 'VILA PARAISO',
  distribuidora: 'RAIZEN',
  produtos: [
    { produto: 'ETANOL HIDRATADO COMUM', tancagem: 15, unidMedidaTancagem: 'm³', qtdeBicos: 6 },
    { produto: 'GASOLINA C PREMIUM', tancagem: 10, unidMedidaTancagem: 'm³', qtdeBicos: 2 },
    { produto: 'ÓLEO DIESEL B S10 - COMUM', tancagem: 10, unidMedidaTancagem: 'm³', qtdeBicos: 6 },
  ],
  latitude: '',
  longitude: '',
  dataObtencao: '',
  origemInformacao: '',
};

const hangar: AnpCombustivelRaw = {
  ...base,
  codigoSIMP: '1169484',
  razaoSocial: 'MASTER AVGAS LTDA.',
  endereco: 'VIA DE ACESSO COMANDANTE  CÉSAR ALBUQUERQUE ALMEIDA,  1051',
  bairro: 'BAIRRO DA LAGOA',
  distribuidora: 'BANDEIRA BRANCA',
  produtos: [
    { produto: 'GASOLINA DE AVIAÇÃO', tancagem: 15, unidMedidaTancagem: 'm³', qtdeBicos: 1 },
    { produto: 'QUEROSENE DE AVIAÇÃO (JET A-1)', tancagem: 20, unidMedidaTancagem: 'm³', qtdeBicos: 1 },
  ],
  latitude: '-22.7553385',
  longitude: '-47.2653578',
  dataObtencao: '26/07/2022',
  origemInformacao: 'Agente de fiscalização da ANP',
};

const fiscalizadoAntigo: AnpCombustivelRaw = {
  ...base,
  codigoSIMP: '1009038',
  razaoSocial: 'POSTO GONCALVES DIAS LTDA',
  endereco: 'RUA GONCALVES DIAS,  1180',
  bairro: 'CENTRO',
  distribuidora: 'BANDEIRA BRANCA',
  produtos: [
    { produto: 'ÓLEO DIESEL B S10 - COMUM', tancagem: 10, unidMedidaTancagem: 'm³', qtdeBicos: 2 },
    { produto: 'ÓLEO DIESEL B S500 - COMUM', tancagem: 10, unidMedidaTancagem: 'm³', qtdeBicos: 2 },
    { produto: 'ETANOL HIDRATADO COMUM', tancagem: 60, unidMedidaTancagem: 'm³', qtdeBicos: 4 },
  ],
  latitude: '-22.73907906',
  longitude: '-47.33687035',
  dataObtencao: '14/11/2016',
  origemInformacao: 'Agente de fiscalização da ANP',
};

const comGnv: AnpCombustivelRaw = {
  ...base,
  codigoSIMP: '1303197',
  razaoSocial: 'AUTO POSTO PAULISTA DA COLINA LTDA',
  endereco: 'AVENIDA PAULISTA,  499',
  bairro: 'JARDIM NOSSA SENHORA DE FATIMA',
  distribuidora: 'ALE',
  produtos: [
    { produto: 'GÁS NATURAL VEICULAR', tancagem: 0, unidMedidaTancagem: 'm³', qtdeBicos: 4 },
    { produto: 'GASOLINA C COMUM', tancagem: 20, unidMedidaTancagem: 'm³', qtdeBicos: 6 },
  ],
  latitude: '-22.73766505',
  longitude: '-47.32016596',
  dataObtencao: '08/11/2024',
  origemInformacao: 'Preposto da empresa',
};

let ok = 0;
const teste = (nome: string, fn: () => void) => {
  fn();
  ok += 1;
  console.log(`  ok  ${nome}`);
};

teste('GNV com 0 bicos não conta como produto disponível', () => {
  const p = converterPosto(tokio)!;
  assert.deepEqual(p.categorias.sort(), ['etanol', 'gasolina']);
  assert.equal(p.totalBicos, 12);
});

teste('GNV com bicos > 0 vira categoria gnv', () => {
  assert.ok(converterPosto(comGnv)!.categorias.includes('gnv'));
});

teste('cadastro só de aviação é descartado', () => {
  assert.equal(converterPosto(hangar), null);
});

teste('string vazia de coordenada vira null; coordenada válida é numérica', () => {
  assert.equal(converterPosto(semCoordenadas)!.coords, null);
  assert.deepEqual(converterPosto(tokio)!.coords, { latitude: -22.7463243, longitude: -47.36122765 });
});

teste('coordenadas fora do Brasil são descartadas', () => {
  assert.equal(parseCoordenadas('40.7', '-74.0'), null);
  assert.equal(parseCoordenadas('abc', '-47'), null);
});

teste('bandeira branca não ganha selo de bandeira; distribuidora ganha', () => {
  assert.ok(!converterPosto(tokio)!.qualificacao.selos.some((s) => s.startsWith('Bandeira')));
  assert.ok(converterPosto(semCoordenadas)!.qualificacao.selos.includes('Bandeira RAIZEN'));
});

teste('fiscalização gera selo; dado de 2016 gera aviso mas continua "regular"', () => {
  const q = converterPosto(fiscalizadoAntigo)!.qualificacao;
  assert.ok(q.selos.includes('Localização conferida pela fiscalização da ANP'));
  assert.ok(q.alertas.some((a) => a.includes('2016')));
  assert.equal(q.nivel, 'regular');
});

teste('pendência PMQC ou SIGAF coloca o posto em "atenção"', () => {
  const pmqc = converterPosto({ ...tokio, inadimplenciaPMQC: [{}] })!;
  assert.equal(pmqc.qualificacao.nivel, 'atencao');
  const sigaf = converterPosto({ ...tokio, statusSIGAF: 'SUSPENSO' })!;
  assert.equal(sigaf.qualificacao.nivel, 'atencao');
});

teste('nomes amigáveis dos produtos', () => {
  assert.equal(nomeAmigavel('GASOLINA C COMUM'), 'Gasolina comum');
  assert.equal(nomeAmigavel('GASOLINA C COMUM ADITIVADA'), 'Gasolina aditivada');
  assert.equal(nomeAmigavel('GASOLINA C PREMIUM ADITIVADA'), 'Gasolina premium aditivada');
  assert.equal(nomeAmigavel('ETANOL HIDRATADO ADITIVADO'), 'Etanol aditivado');
  assert.equal(nomeAmigavel('ÓLEO DIESEL B S10 - ADITIVADO'), 'Diesel S10 aditivado');
  assert.equal(nomeAmigavel('ÓLEO DIESEL B S500 - COMUM'), 'Diesel S500');
  assert.equal(categoriaDoProduto('QUEROSENE ILUMINANTE'), null);
});

teste('texto: título, normalização e UF', () => {
  assert.equal(titulo('AUTO POSTO SÃO JERÔNIMO DE AMERICANA LTDA'), 'Auto Posto São Jerônimo de Americana Ltda');
  assert.equal(titulo('MARGINAL RODOVIA AMERICANA NOVA ODESSA,  S/N'), 'Marginal Rodovia Americana Nova Odessa, S/N');
  assert.equal(normalizar('Águas de  Lindóia'), 'AGUAS DE LINDOIA');
  assert.equal(paraUf('São Paulo'), 'SP');
  assert.equal(paraUf('SP'), 'SP');
  assert.equal(paraUf('Estado de São Paulo'), 'SP');
  assert.equal(paraUf('Narnia'), null);
});

teste('distância entre dois postos reais de Americana é plausível', () => {
  const a = parseCoordenadas('-22.7463243', '-47.36122765')!; // Tokio Petro 9
  const b = parseCoordenadas('-22.73907906', '-47.33687035')!; // Gonçalves Dias
  const km = distanciaKm(a, b);
  assert.ok(km > 2 && km < 3.5, `distância inesperada: ${km}`);
  assert.equal(formatarDistancia(0.43), '400 m');
  assert.equal(formatarDistancia(2.46), '2,5 km');
});

teste('GLP: converte e limpa espaços', () => {
  const glp: AnpGlpRaw = {
    codigoSIMP: '1303419',
    autorizacao: 'GLPSP0438663',
    dataPublicacao: '09/08/2024',
    razaoSocial: 'WEG GAS E AGUA LTDA',
    cnpj: '53566877000100',
    endereco: 'RUA DAS ROSAS,  460',
    complemento: 'QUADRA41                  LOTE  01',
    bairro: 'CIDADE JARDIM II',
    cep: '13467110',
    uf: 'SP',
    municipio: 'AMERICANA',
    distribuidora: 'NACIONAL GÁS BUTANO',
    classe: '1 ÁREA  - Classe III - NBR 15514',
    statusSIGAF: '',
  };
  const r = converterGlp(glp);
  assert.equal(r.endereco, 'RUA DAS ROSAS, 460');
  assert.equal(r.complemento, 'QUADRA41 LOTE 01');
});

console.log(`\n${ok} verificações passaram.`);
