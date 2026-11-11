# Postos Próximos

App React Native (Expo + Expo Router) que mostra no mapa e em lista os postos de combustível e
revendedores de gás (GLP) pnerto do motorista, usando como fonte o cadastro público da ANP:

- `https://revendedoresapi.anp.gov.br/v1/combustivel?uf=SP&municipio=AMERICANA`
- `https://revendedoresapi.anp.gov.br/v1/glp?uf=SP&municipio=AMERICANA`

## Como rodar

```bash
npm install
npx expo start
```

Abra no **Expo Go** (Android/iOS) lendo o QR code. O mapa usa `react-native-maps`, que funciona no
Expo Go. Para gerar um build próprio (`eas build`), o Android exige uma chave do Google Maps:
adicione `android.config.googleMaps.apiKey` no `app.json`.

Outros comandos: `npm run typecheck` e `npm run verificar` (testa a conversão/qualificação com
registros reais da ANP).

## O que o app faz

- Detecta a cidade pelo GPS (ou usa a cidade escolhida manualmente; padrão: Americana/SP).
- **Mapa**: marcadores verdes (regular) e laranjas (atenção); toque abre um popup com informações
  do posto, e toque no popup para acessar os detalhes completos.
- **Lista**: busca por nome/bairro/bandeira, filtros por combustível (Gasolina, Etanol, Diesel,
  GNV), situação regular ou com alertas registrados na ANP e ordenação por distância ou número de bicos.
- **Gás (GLP)**: revendedores de gás de cozinha, com rota pelo endereço.
- **Detalhes**: produtos, bicos, tancagem, situação cadastral, observações da fiscalização.
- Cache local de 12 h (funciona offline com o último dado salvo).

## O que significa "qualificado"

Tudo vem do cadastro da ANP, sem dados inventados:

| Sinal | Origem no JSON | Efeito |
| --- | --- | --- |
| Pendência no monitoramento de qualidade | `inadimplenciaPMQC` preenchido | **Atenção** |
| Situação especial no sistema da ANP | `statusSIGAF` preenchido | **Atenção** |
| Bandeira de distribuidora identificada | `distribuidora` ≠ bandeira branca | Selo |
| Localização conferida por fiscalização | `origemInformacao` | Selo |
| Localização com 4+ anos | `dataObtencao` | Aviso (não rebaixa) |

**Limite importante:** o cadastro da ANP **não tem preços nem resultado de análise de laboratório**.
"Regular" quer dizer "sem pendências registradas", não "combustível testado". Para preços seria
preciso outra fonte (por exemplo o levantamento semanal de preços da ANP, ou dados colaborativos).

## Detalhes dos dados tratados

- Produto com `qtdeBicos = 0` é ignorado (a ANP lista GNV com 0 bicos em postos que não vendem GNV).
- Cadastros só de aviação (gasolina de aviação/querosene) são descartados.
- `latitude`/`longitude` vêm como texto e, em parte dos postos, vazios: esses aparecem só na lista e
  a rota usa o endereço. Coordenadas fora do Brasil são descartadas.
- Os revendedores de GLP não têm coordenadas no cadastro.
- O nome do município é enviado sem acento e, se vier vazio, com acento; o resultado é filtrado
  localmente para nunca mostrar postos de outra cidade.

## Estrutura

```
src/
  app/            rotas (Expo Router): (tabs)/ mapa, lista, gas · posto/[id] · cidade (modal)
  components/     Badge, StationCard, FilterBar, StatusView, LocalHeader
  context/        StationsContext: localização, carga dos dados, filtros
  domain/         combustiveis, qualificacao, conversores (lógica pura)
  services/anp.ts chamadas à API, timeout, cache
  utils/          texto, geo, UF
scripts/          verificar-conversao.ts
```

## Próximos passos sugeridos

1. Preços: integrar o levantamento de preços da ANP ou fonte colaborativa.
2. Geocodificar (com cache) os postos sem coordenadas para que apareçam no mapa.
3. Favoritos e histórico de postos.
4. Paginação, caso uma cidade grande passe de 5000 registros (hoje a ANP devolve tudo em uma página).
