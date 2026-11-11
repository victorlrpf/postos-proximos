import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

type Tom = 'ok' | 'warn' | 'neutro';

interface Props {
  texto: string;
  tom?: Tom;
  icone?: keyof typeof Ionicons.glyphMap;
}

const PALETA: Record<Tom, { fundo: string; texto: string }> = {
  ok: { fundo: colors.okSoft, texto: colors.ok },
  warn: { fundo: colors.warnSoft, texto: colors.warn },
  neutro: { fundo: colors.primarySoft, texto: colors.primaryDark },
};

export function Badge({ texto, tom = 'neutro', icone }: Props) {
  const p = PALETA[tom];
  return (
    <View style={[styles.base, { backgroundColor: p.fundo }]}>
      {icone ? <Ionicons name={icone} size={12} color={p.texto} /> : null}
      <Text style={[styles.texto, { color: p.texto }]}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  texto: { fontSize: 12, fontWeight: '600' },
});
