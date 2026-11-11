import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { CATEGORIAS } from '../domain/combustiveis';
import { useStations } from '../context/StationsContext';
import { colors, radius } from '../theme';
import type { Categoria } from '../types';

interface ChipProps {
  texto: string;
  ativo: boolean;
  onPress: () => void;
  icone?: keyof typeof Ionicons.glyphMap;
}

function Chip({ texto, ativo, onPress, icone }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[styles.chip, ativo && styles.chipAtivo]}
    >
      {icone ? (
        <Ionicons name={icone} size={14} color={ativo ? '#fff' : colors.primaryDark} />
      ) : null}
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{texto}</Text>
    </Pressable>
  );
}

export function FilterBar({ mostrarBusca = false }: { mostrarBusca?: boolean }) {
  const { filtros, atualizarFiltros } = useStations();

  const alternarCategoria = (c: Categoria) => {
    const ativas = filtros.categorias.includes(c)
      ? filtros.categorias.filter((x) => x !== c)
      : [...filtros.categorias, c];
    atualizarFiltros({ categorias: ativas });
  };

  return (
    <View style={styles.container}>
      {mostrarBusca ? (
        <View style={styles.busca}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            value={filtros.busca}
            onChangeText={(busca) => atualizarFiltros({ busca })}
            placeholder="Buscar por nome, bairro ou bandeira"
            placeholderTextColor={colors.muted}
            style={styles.input}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIAS.map((c) => (
          <Chip
            key={c.key}
            texto={c.label}
            ativo={filtros.categorias.includes(c.key)}
            onPress={() => alternarCategoria(c.key)}
          />
        ))}
        <Chip
          texto="Só regulares"
          icone="shield-checkmark"
          ativo={filtros.situacao === 'regular'}
          onPress={() =>
            atualizarFiltros({ situacao: filtros.situacao === 'regular' ? 'todas' : 'regular' })
          }
        />
        <Chip
          texto="Com alertas ANP"
          icone="alert-circle"
          ativo={filtros.situacao === 'atencao'}
          onPress={() =>
            atualizarFiltros({ situacao: filtros.situacao === 'atencao' ? 'todas' : 'atencao' })
          }
        />
        {mostrarBusca ? (
          <Chip
            texto={filtros.ordenacao === 'distancia' ? 'Mais perto' : 'Mais bicos'}
            icone="swap-vertical"
            ativo={false}
            onPress={() =>
              atualizarFiltros({
                ordenacao: filtros.ordenacao === 'distancia' ? 'bicos' : 'distancia',
              })
            }
          />
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
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
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTexto: { fontSize: 13, fontWeight: '600', color: colors.primaryDark },
  chipTextoAtivo: { color: '#fff' },
});
