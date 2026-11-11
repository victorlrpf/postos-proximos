import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useStations } from '../context/StationsContext';
import { colors, radius } from '../theme';
import { titulo } from '../utils/text';

/** Título do cabeçalho: mostra o município atual e abre a troca de cidade. */
export function LocalHeader() {
  const { local } = useStations();
  return (
    <Pressable
      onPress={() => router.push('/cidade')}
      style={styles.botao}
      accessibilityRole="button"
      accessibilityLabel={`Cidade atual ${titulo(local.municipio)}, ${local.uf}. Toque para trocar.`}
    >
      <Ionicons name="location" size={16} color="#fff" />
      <Text style={styles.texto} numberOfLines={1}>
        {titulo(local.municipio)} / {local.uf}
      </Text>
      <Ionicons name="chevron-down" size={16} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    maxWidth: 260,
  },
  texto: { color: '#fff', fontSize: 15, fontWeight: '700', flexShrink: 1 },
});

export const headerColors = { fundo: colors.primary, texto: '#fff' };
