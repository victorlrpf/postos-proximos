import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

interface Props {
  tipo: 'carregando' | 'erro' | 'vazio';
  titulo: string;
  detalhe?: string;
  acao?: { texto: string; onPress: () => void };
}

export function StatusView({ tipo, titulo, detalhe, acao }: Props) {
  return (
    <View style={styles.container}>
      {tipo === 'carregando' ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : (
        <Ionicons
          name={tipo === 'erro' ? 'cloud-offline' : 'search'}
          size={40}
          color={colors.muted}
        />
      )}
      <Text style={styles.titulo}>{titulo}</Text>
      {detalhe ? <Text style={styles.detalhe}>{detalhe}</Text> : null}
      {acao ? (
        <Pressable onPress={acao.onPress} style={styles.botao} accessibilityRole="button">
          <Text style={styles.botaoTexto}>{acao.texto}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 10 },
  titulo: { fontSize: 17, fontWeight: '700', color: colors.text, textAlign: 'center' },
  detalhe: { fontSize: 14, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  botao: {
    marginTop: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: radius.pill,
  },
  botaoTexto: { color: '#fff', fontWeight: '700' },
});
