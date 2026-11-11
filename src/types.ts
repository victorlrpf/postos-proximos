/** Formato bruto devolvido por https://revendedoresapi.anp.gov.br/v1/combustivel */
export interface AnpProdutoRaw {
  produto: string;
  tancagem: number;
  unidMedidaTancagem: string;
  qtdeBicos: number;
}

export interface AnpCombustivelRaw {
  codigoSIMP: string;
  autorizacao: string;
  dataPublicacao: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  distribuidora: string;
  produtos: AnpProdutoRaw[];
  latitude: string;
  longitude: string;
  validacao: string;
  dataObtencao: string;
  origemInformacao: string;
  observacao: string;
  statusSIGAF: string;
  inadimplenciaPMQC: unknown[];
}

/** Formato bruto devolvido por https://revendedoresapi.anp.gov.br/v1/glp */
export interface AnpGlpRaw {
  codigoSIMP: string;
  autorizacao: string;
  dataPublicacao: string;
  razaoSocial: string;
  cnpj: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cep: string;
  uf: string;
  municipio: string;
  distribuidora: string;
  classe: string;
  statusSIGAF: string;
}

export interface AnpEnvelope<T> {
  status: number;
  title: string;
  succeeded: boolean;
  data: T[];
  searchPageFilter?: {
    numeroPagina: number;
    tamanhoPagina: number;
    totalRegistro: number;
    totalPagina: number;
  };
}

export type Categoria = 'gasolina' | 'etanol' | 'diesel' | 'gnv';

export interface Coordenadas {
  latitude: number;
  longitude: number;
}

export interface ProdutoPosto {
  nomeAnp: string;
  nome: string;
  categoria: Categoria;
  bicos: number;
  tancagemM3: number;
}

export type NivelQualificacao = 'regular' | 'atencao';

export interface Qualificacao {
  nivel: NivelQualificacao;
  /** Pontos que merecem atenção do motorista. */
  alertas: string[];
  /** Pontos positivos verificáveis nos dados da ANP. */
  selos: string[];
}

export interface Posto {
  id: string;
  nome: string;
  cnpj: string;
  autorizacao: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  bandeira: string;
  bandeiraBranca: boolean;
  produtos: ProdutoPosto[];
  categorias: Categoria[];
  totalBicos: number;
  coords: Coordenadas | null;
  observacao: string;
  origemInformacao: string;
  dataObtencao: string;
  dataPublicacao: string;
  qualificacao: Qualificacao;
}

export interface PostoComDistancia extends Posto {
  distanciaKm: number | null;
}

export interface RevendedorGlp {
  id: string;
  nome: string;
  cnpj: string;
  autorizacao: string;
  endereco: string;
  complemento: string;
  bairro: string;
  cep: string;
  municipio: string;
  uf: string;
  bandeira: string;
  classe: string;
  dataPublicacao: string;
}

export interface Local {
  uf: string;
  municipio: string;
}

export type Ordenacao = 'distancia' | 'bicos';
export type SituacaoFiltro = 'todas' | 'regular' | 'atencao';

export interface Filtros {
  categorias: Categoria[];
  situacao: SituacaoFiltro;
  ordenacao: Ordenacao;
  busca: string;
}
