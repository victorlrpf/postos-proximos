import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Badge } from '../../components/Badge';
import { StatusView } from '../../components/StatusView';
import { enderecoCompleto } from '../../components/StationCard';
import { useStations } from '../../context/StationsContext';
import { colors, radius, shadow } from '../../theme';
import { formatarDistancia, urlRota } from '../../utils/geo';
import { titulo } from '../../utils/text';

function voltarParaOrigem() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

const formatarCnpj = (cnpj: string): string =>
  cnpj.length === 14
    ? cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    : cnpj;

const formatarCep = (cep: string): string =>
  cep.length === 8 ? cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : cep;

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  if (!valor) return null;
  return (
    <View style={styles.dado}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

export default function PostoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { buscarPosto } = useStations();
  const posto = id ? buscarPosto(id) : undefined;

  if (!posto) {
    return (
      <StatusView
        tipo="vazio"
        titulo="Posto não encontrado"
        detalhe="Ele pode ter saído da lista após uma atualização dos dados."
        acao={{ texto: 'Voltar', onPress: voltarParaOrigem }}
      />
    );
  }

  const atencao = posto.qualificacao.nivel === 'atencao';

  return (
    <ScrollView contentContainerStyle={styles.conteudo}>
      <View style={styles.card}>
        <Text style={styles.nome}>{titulo(posto.nome)}</Text>
        <Text style={styles.endereco}>
          {titulo(posto.endereco)}
          {posto.complemento ? `, ${titulo(posto.complemento)}` : ''}
        </Text>
        <Text style={styles.endereco}>
          {titulo(posto.bairro)} · {titulo(posto.municipio)}/{posto.uf} · CEP {formatarCep(posto.cep)}
        </Text>
        <View style={styles.linha}>
          <Badge
            texto={atencao ? 'Atenção' : 'Regular na ANP'}
            tom={atencao ? 'warn' : 'ok'}
            icone={atencao ? 'alert-circle' : 'shield-checkmark'}
          />
          {posto.distanciaKm !== null ? (
            <Badge texto={`a ${formatarDistancia(posto.distanciaKm)}`} icone="navigate" />
          ) : null}
        </View>

        <Pressable
          style={styles.rota}
          accessibilityRole="button"
          onPress={() => Linking.openURL(urlRota(posto.coords, enderecoCompleto(posto)))}
        >
          <Ionicons name="navigate-circle" size={20} color="#fff" />
          <Text style={styles.rotaTexto}>Traçar rota</Text>
        </Pressable>
      </View>

      {posto.qualificacao.alertas.length > 0 || posto.qualificacao.selos.length > 0 ? (
        <View style={styles.card}>
          <Text style={styles.secao}>Situação no cadastro da ANP</Text>
          {posto.qualificacao.alertas.map((a) => (
            <View key={a} style={styles.item}>
              <Ionicons name="alert-circle" size={18} color={colors.warn} />
              <Text style={styles.itemTexto}>{a}</Text>
            </View>
          ))}
          {posto.qualificacao.selos.map((s) => (
            <View key={s} style={styles.item}>
              <Ionicons name="checkmark-circle" size={18} color={colors.ok} />
              <Text style={styles.itemTexto}>{s}</Text>
            </View>
          ))}
          {!atencao ? (
            <Text style={styles.nota}>
              Sem pendências de qualidade registradas. Isso não substitui análise de laboratório: a ANP
              não divulga resultados por posto neste cadastro.
            </Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.secao}>Combustíveis e bicos</Text>
        {posto.produtos.map((p) => (
          <View key={p.nomeAnp} style={styles.produto}>
            <Text style={styles.produtoNome}>{p.nome}</Text>
            <Text style={styles.produtoInfo}>
              {p.bicos} {p.bicos === 1 ? 'bico' : 'bicos'}
              {p.tancagemM3 > 0 ? ` · tanque ${String(p.tancagemM3).replace('.', ',')} m³` : ''}
            </Text>
          </View>
        ))}
        <Text style={styles.nota}>Preços não constam no cadastro da ANP; confira na bomba.</Text>
      </View>

      {posto.observacao ? (
        <View style={styles.card}>
          <Text style={styles.secao}>Observação da fiscalização</Text>
          <Text style={styles.itemTexto}>{posto.observacao}</Text>
          <Text style={styles.nota}>Anotação registrada na data da visita; pode estar desatualizada.</Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={styles.secao}>Dados cadastrais</Text>
        <Linha rotulo="Bandeira" valor={posto.bandeiraBranca ? 'Bandeira branca' : titulo(posto.bandeira)} />
        <Linha rotulo="CNPJ" valor={formatarCnpj(posto.cnpj)} />
        <Linha rotulo="Autorização ANP" valor={posto.autorizacao} />
        <Linha rotulo="Autorizado desde" valor={posto.dataPublicacao} />
        <Linha rotulo="Localização obtida em" valor={posto.dataObtencao} />
        <Linha rotulo="Origem da localização" valor={posto.origemInformacao} />
      </View>

      <Text style={styles.fonte}>Fonte: ANP — revendedoresapi.anp.gov.br</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 12, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 16,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  nome: { fontSize: 20, fontWeight: '800', color: colors.text },
  endereco: { fontSize: 14, color: colors.muted },
  linha: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  rota: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 13,
  },
  rotaTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secao: { fontSize: 15, fontWeight: '800', color: colors.text },
  item: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  itemTexto: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  nota: { fontSize: 12, color: colors.muted, lineHeight: 17 },
  produto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  produtoNome: { fontSize: 14, fontWeight: '600', color: colors.text },
  produtoInfo: { fontSize: 13, color: colors.muted },
  dado: { gap: 1 },
  rotulo: { fontSize: 12, color: colors.muted },
  valor: { fontSize: 14, color: colors.text },
  fonte: { textAlign: 'center', fontSize: 12, color: colors.muted },
});
