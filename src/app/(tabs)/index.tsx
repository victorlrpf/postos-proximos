import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import { FilterBar } from '../../components/FilterBar';
import { StatusView } from '../../components/StatusView';
import { useStations } from '../../context/StationsContext';
import { labelCategoria } from '../../domain/combustiveis';
import { colors, radius, shadow } from '../../theme';
import type { Coordenadas } from '../../types';
import { formatarDistancia } from '../../utils/geo';
import { titulo } from '../../utils/text';

const QTD_MAIS_PROXIMOS = 10;

export default function MapaScreen() {
  const { postos, posicao, permissao, status, erro, recarregar, local, semCoordenadas, totalPostos } =
    useStations();

  const mapRef = useRef<MapView>(null);
  const [mapaPronto, setMapaPronto] = useState(false);

  const postosNoMapa = useMemo(() => postos.filter((p) => p.coords !== null), [postos]);

  // Enquadra o mapa: o motorista + os postos mais próximos (ou todos, sem localização).
  useEffect(() => {
    if (!mapaPronto || postosNoMapa.length === 0) return;
    const pontos: Coordenadas[] = posicao
      ? [posicao, ...postosNoMapa.slice(0, QTD_MAIS_PROXIMOS).map((p) => p.coords as Coordenadas)]
      : postosNoMapa.map((p) => p.coords as Coordenadas);
    mapRef.current?.fitToCoordinates(pontos, {
      edgePadding: { top: 120, right: 50, bottom: 220, left: 50 },
      animated: true,
    });
  }, [mapaPronto, postosNoMapa, posicao]);

  const centralizarEmMim = () => {
    if (!posicao) return;
    mapRef.current?.animateToRegion(
      { ...posicao, latitudeDelta: 0.03, longitudeDelta: 0.03 },
      400,
    );
  };

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

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        showsUserLocation={permissao === 'concedida'}
        showsMyLocationButton={false}
        onMapReady={() => setMapaPronto(true)}
        initialRegion={{
          latitude: -22.7375,
          longitude: -47.3331,
          latitudeDelta: 0.15,
          longitudeDelta: 0.15,
        }}
      >
        {postosNoMapa.map((p) => (
          <Marker
            key={p.id}
            coordinate={p.coords as Coordenadas}
            title={titulo(p.nome)}
            description={titulo(p.endereco)}
            pinColor={p.qualificacao.nivel === 'regular' ? colors.ok : colors.warn}
          >
            <Callout
              onPress={() =>
                router.push({ pathname: '/posto/[id]', params: { id: p.id } })
              }
            >
              <View style={styles.popup}>
                <Text style={styles.popupNome} numberOfLines={2}>
                  {titulo(p.nome)}
                </Text>
                <Text style={styles.popupEndereco} numberOfLines={2}>
                  {titulo(p.endereco)} · {titulo(p.bairro)}
                </Text>
                <View style={styles.popupLinha}>
                  <View
                    style={[
                      styles.popupBadge,
                      p.qualificacao.nivel === 'regular'
                        ? styles.popupBadgeRegular
                        : styles.popupBadgeAtencao,
                    ]}
                  >
                    <Text
                      style={[
                        styles.popupBadgeTexto,
                        p.qualificacao.nivel === 'regular'
                          ? styles.popupTextoRegular
                          : styles.popupTextoAtencao,
                      ]}
                    >
                      {p.qualificacao.nivel === 'regular' ? 'Regular na ANP' : 'Atenção'}
                    </Text>
                  </View>
                  {p.distanciaKm !== null ? (
                    <Text style={styles.popupDistancia}>{formatarDistancia(p.distanciaKm)}</Text>
                  ) : null}
                </View>
                <Text style={styles.popupEndereco} numberOfLines={1}>
                  {p.bandeiraBranca ? 'Bandeira branca' : titulo(p.bandeira)} · {p.totalBicos}{' '}
                  {p.totalBicos === 1 ? 'bico' : 'bicos'}
                </Text>
                <Text style={styles.popupCombustiveis} numberOfLines={2}>
                  {p.categorias.map(labelCategoria).join(' · ')}
                </Text>
                <View style={styles.popupDetalhes}>
                  <Text style={styles.popupDetalhesTexto}>Toque para ver detalhes</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                </View>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <View style={styles.topo} pointerEvents="box-none">
        <FilterBar />
        {permissao === 'negada' ? (
          <Pressable style={styles.aviso} onPress={() => Linking.openSettings()}>
            <Ionicons name="locate" size={16} color={colors.warn} />
            <Text style={styles.avisoTexto}>
              Localização desligada. Toque para ativar e ver os postos mais próximos.
            </Text>
          </Pressable>
        ) : null}
        {status === 'pronto' && semCoordenadas > 0 ? (
          <View style={styles.aviso}>
            <Ionicons name="information-circle" size={16} color={colors.muted} />
            <Text style={styles.avisoTexto}>
              {semCoordenadas} {semCoordenadas === 1 ? 'posto não tem' : 'postos não têm'} coordenadas
              na ANP e só aparece{semCoordenadas === 1 ? '' : 'm'} na aba Lista.
            </Text>
          </View>
        ) : null}
      </View>

      {status === 'carregando' ? (
        <View style={styles.carregando}>
          <StatusView tipo="carregando" titulo={`Buscando postos em ${titulo(local.municipio)}…`} />
        </View>
      ) : null}

      {status === 'pronto' && totalPostos === 0 ? (
        <View style={styles.carregando}>
          <StatusView
            tipo="vazio"
            titulo="Nenhum posto encontrado"
            detalhe={`A ANP não retornou postos para ${titulo(local.municipio)}/${local.uf}. Confira o nome da cidade.`}
            acao={{ texto: 'Trocar cidade', onPress: () => router.push('/cidade') }}
          />
        </View>
      ) : null}

      {status === 'pronto' && totalPostos > 0 && postos.length === 0 ? (
        <View style={styles.vazioFiltro}>
          <Text style={styles.avisoTexto}>Nenhum posto atende aos filtros escolhidos.</Text>
        </View>
      ) : null}

      <View style={styles.rodape} pointerEvents="box-none">
        {posicao ? (
          <Pressable
            style={styles.fab}
            onPress={centralizarEmMim}
            accessibilityRole="button"
            accessibilityLabel="Centralizar o mapa na minha posição"
          >
            <Ionicons name="locate" size={22} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topo: { position: 'absolute', top: 0, left: 0, right: 0, padding: 12, gap: 8 },
  aviso: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...shadow,
  },
  avisoTexto: { flex: 1, fontSize: 12.5, color: colors.text },
  carregando: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(244,246,245,0.92)',
  },
  vazioFiltro: {
    position: 'absolute',
    alignSelf: 'center',
    top: '45%',
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: radius.md,
    ...shadow,
  },
  rodape: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 10 },
  fab: {
    alignSelf: 'flex-end',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  popup: { width: 230, gap: 6, padding: 4 },
  popupNome: { fontSize: 15, fontWeight: '700', color: colors.text },
  popupEndereco: { fontSize: 12, color: colors.muted },
  popupLinha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  popupBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.pill },
  popupBadgeRegular: { backgroundColor: colors.okSoft },
  popupBadgeAtencao: { backgroundColor: colors.warnSoft },
  popupBadgeTexto: { fontSize: 11, fontWeight: '600' },
  popupTextoRegular: { color: colors.ok },
  popupTextoAtencao: { color: colors.warn },
  popupDistancia: { fontSize: 11, color: colors.muted },
  popupCombustiveis: { fontSize: 12, fontWeight: '600', color: colors.text },
  popupDetalhes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  popupDetalhesTexto: { fontSize: 12, fontWeight: '700', color: colors.primary },
});
