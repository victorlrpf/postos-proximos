import Ionicons from '@expo/vector-icons/Ionicons';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { labelCategoria } from '../domain/combustiveis';
import { colors, radius, shadow } from '../theme';
import type { PostoComDistancia } from '../types';
import { formatarDistancia, urlRota } from '../utils/geo';
import { titulo } from '../utils/text';
import { Badge } from './Badge';

interface Props {
  posto: PostoComDistancia;
  onPress: () => void;
  /** Versão enxuta usada no cartão sobre o mapa. */
  compacto?: boolean;
}

export function enderecoCompleto(p: {
  endereco: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
}): string {
  return `${titulo(p.endereco)}, ${titulo(p.bairro)}, ${titulo(p.municipio)} - ${p.uf}, ${p.cep}`;
}

export function StationCard({ posto, onPress, compacto = false }: Props) {
  const atencao = posto.qualificacao.nivel === 'atencao';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${titulo(posto.nome)}, ver detalhes`}
      style={({ pressed }) => [styles.card, compacto && styles.compacto, pressed && styles.pressed]}
    >
      <View style={styles.topo}>
        <View style={styles.titulos}>
          <Text style={styles.nome} numberOfLines={compacto ? 1 : 2}>
            {titulo(posto.nome)}
          </Text>
          <Text style={styles.endereco} numberOfLines={1}>
            {titulo(posto.endereco)} · {titulo(posto.bairro)}
          </Text>
        </View>
        {posto.distanciaKm !== null ? (
          <View style={styles.distancia}>
            <Ionicons name="navigate" size={12} color={colors.primaryDark} />
            <Text style={styles.distanciaTexto}>{formatarDistancia(posto.distanciaKm)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.linha}>
        <Badge
          texto={atencao ? 'Atenção' : 'Regular na ANP'}
          tom={atencao ? 'warn' : 'ok'}
          icone={atencao ? 'alert-circle' : 'shield-checkmark'}
        />
        <Badge texto={posto.bandeiraBranca ? 'Bandeira branca' : titulo(posto.bandeira)} />
        <Badge texto={`${posto.totalBicos} bicos`} icone="water" />
      </View>

      <View style={styles.linha}>
        {posto.categorias.map((c) => (
          <Text key={c} style={styles.combustivel}>
            {labelCategoria(c)}
          </Text>
        ))}
      </View>

      {!posto.coords ? (
        <Text style={styles.semLocal}>Sem coordenadas no cadastro da ANP; a rota usa o endereço.</Text>
      ) : null}

      {!compacto ? null : (
        <Pressable
          onPress={() => Linking.openURL(urlRota(posto.coords, enderecoCompleto(posto)))}
          style={styles.rota}
          accessibilityRole="button"
          accessibilityLabel="Traçar rota até o posto"
        >
          <Ionicons name="navigate-circle" size={18} color="#fff" />
          <Text style={styles.rotaTexto}>Traçar rota</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow,
  },
  compacto: { borderRadius: radius.lg },
  pressed: { opacity: 0.85 },
  topo: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  titulos: { flex: 1, gap: 2 },
  nome: { fontSize: 16, fontWeight: '700', color: colors.text },
  endereco: { fontSize: 13, color: colors.muted },
  distancia: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  distanciaTexto: { fontSize: 12, fontWeight: '700', color: colors.primaryDark },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  combustivel: { fontSize: 13, fontWeight: '600', color: colors.text },
  semLocal: { fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  rota: {
    marginTop: 4,
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
