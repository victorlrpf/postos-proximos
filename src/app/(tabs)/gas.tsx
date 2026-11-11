import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Badge } from '../../components/Badge';
import { StatusView } from '../../components/StatusView';
import { enderecoCompleto } from '../../components/StationCard';
import { useStations } from '../../context/StationsContext';
import { colors, radius, shadow } from '../../theme';
import { urlRota } from '../../utils/geo';
import { normalizar, titulo } from '../../utils/text';

export default function GasScreen() {
  const { gas, erroGas, status, recarregar, local } = useStations();
  const [busca, setBusca] = useState('');

  const lista = useMemo(() => {
    const termo = normalizar(busca);
    const filtrada = termo
      ? gas.filter((g) => normalizar(`${g.nome} ${g.bairro} ${g.endereco} ${g.bandeira}`).includes(termo))
      : gas;
    return [...filtrada].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [gas, busca]);

  if (status === 'carregando' && gas.length === 0) {
    return <StatusView tipo="carregando" titulo={`Buscando revendedores em ${titulo(local.municipio)}…`} />;
  }

  if (erroGas && gas.length === 0) {
    return (
      <StatusView
        tipo="erro"
        titulo="Não consegui carregar os revendedores de gás"
        detalhe={erroGas}
        acao={{ texto: 'Tentar de novo', onPress: () => void recarregar() }}
      />
    );
  }

  return (
    <FlatList
      data={lista}
      keyExtractor={(g) => g.id}
      contentContainerStyle={styles.lista}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      ListHeaderComponent={
        <View style={styles.cabecalho}>
          <View style={styles.busca}>
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              value={busca}
              onChangeText={setBusca}
              placeholder="Buscar por nome, bairro ou distribuidora"
              placeholderTextColor={colors.muted}
              style={styles.input}
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
          </View>
          <Text style={styles.nota}>
            {lista.length} revendedores de gás de cozinha (GLP) em {titulo(local.municipio)}. O cadastro
            da ANP não traz coordenadas para eles, então não aparecem no mapa.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <StatusView tipo="vazio" titulo="Nenhum revendedor encontrado" detalhe="Tente outra busca." />
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.nome}>{titulo(item.nome)}</Text>
          <Text style={styles.endereco}>
            {titulo(item.endereco)}
            {item.complemento ? `, ${titulo(item.complemento)}` : ''} · {titulo(item.bairro)}
          </Text>
          <View style={styles.linha}>
            <Badge
              texto={item.bandeira === 'INDEPENDENTE' ? 'Independente' : titulo(item.bandeira)}
              icone="flame"
            />
          </View>
          {item.classe ? <Text style={styles.classe}>Instalação: {item.classe.replace(/\s+/g, ' ')}</Text> : null}
          <Pressable
            style={styles.rota}
            accessibilityRole="button"
            onPress={() => Linking.openURL(urlRota(null, enderecoCompleto(item)))}
          >
            <Ionicons name="navigate-circle" size={18} color="#fff" />
            <Text style={styles.rotaTexto}>Traçar rota</Text>
          </Pressable>
        </View>
      )}
      refreshControl={
        <RefreshControl
          refreshing={status === 'carregando'}
          onRefresh={() => void recarregar()}
          tintColor={colors.primary}
        />
      }
      keyboardShouldPersistTaps="handled"
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 12, paddingBottom: 32 },
  cabecalho: { gap: 10, marginBottom: 12 },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  input: { flex: 1, fontSize: 15, color: colors.text },
  nota: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  nome: { fontSize: 16, fontWeight: '700', color: colors.text },
  endereco: { fontSize: 13, color: colors.muted },
  linha: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  classe: { fontSize: 12, color: colors.muted },
  rota: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: 10,
  },
  rotaTexto: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
