import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { FilterBar } from '../../components/FilterBar';
import { StationCard } from '../../components/StationCard';
import { StatusView } from '../../components/StatusView';
import { useStations } from '../../context/StationsContext';
import { colors } from '../../theme';
import { titulo } from '../../utils/text';

export default function ListaScreen() {
  const { postos, totalPostos, status, erro, recarregar, local, desatualizado, baixadoEm, posicao } =
    useStations();

  if (status === 'carregando' && totalPostos === 0) {
    return <StatusView tipo="carregando" titulo={`Buscando postos em ${titulo(local.municipio)}…`} />;
  }

  if (status === 'erro') {
    return (
      <StatusView
        tipo="erro"
        titulo="Não consegui consultar a ANP"
        detalhe={erro ?? undefined}
        acao={{ texto: 'Tentar de novo', onPress: () => void recarregar() }}
      />
    );
  }

  const cabecalho = (
    <View style={styles.cabecalho}>
      <FilterBar mostrarBusca />
      <Text style={styles.resumo}>
        {postos.length} de {totalPostos} postos em {titulo(local.municipio)}
        {posicao ? ' · ordenados pela sua posição' : ''}
      </Text>
      {desatualizado && baixadoEm ? (
        <Text style={styles.aviso}>
          Sem conexão com a ANP: exibindo dados salvos em{' '}
          {new Date(baixadoEm).toLocaleDateString('pt-BR')}.
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={postos}
      keyExtractor={(p) => p.id}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={
        <StatusView
          tipo="vazio"
          titulo="Nenhum posto encontrado"
          detalhe="Ajuste os filtros ou a busca, ou troque a cidade."
        />
      }
      ListFooterComponent={
        <Text style={styles.rodape}>
          Fonte: cadastro de revendedores da ANP. A ANP não informa preços nem resultados de análise
          de combustível; “Regular” indica ausência de pendências registradas.
        </Text>
      }
      renderItem={({ item }) => (
        <StationCard
          posto={item}
          onPress={() => router.push({ pathname: '/posto/[id]', params: { id: item.id } })}
        />
      )}
      ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
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
  resumo: { fontSize: 13, color: colors.muted },
  aviso: { fontSize: 13, color: colors.warn },
  rodape: { marginTop: 16, fontSize: 12, color: colors.muted, textAlign: 'center', lineHeight: 17 },
});
