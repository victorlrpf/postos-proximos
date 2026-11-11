import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useStations } from '../context/StationsContext';
import { colors, radius } from '../theme';
import { titulo } from '../utils/text';
import { isUfValida } from '../utils/uf';

export default function CidadeModal() {
  const { local, definirLocal, usarMinhaLocalizacao } = useStations();
  const [municipio, setMunicipio] = useState(titulo(local.municipio));
  const [uf, setUf] = useState(local.uf);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [localizando, setLocalizando] = useState(false);

  const buscar = () => {
    if (municipio.trim().length < 2) {
      setMensagem('Digite o nome da cidade.');
      return;
    }
    if (!isUfValida(uf)) {
      setMensagem('Informe a sigla do estado, por exemplo SP.');
      return;
    }
    definirLocal({ uf, municipio });
    router.back();
  };

  const usarGps = async () => {
    setLocalizando(true);
    setMensagem(null);
    const ok = await usarMinhaLocalizacao();
    setLocalizando(false);
    if (ok) router.back();
    else setMensagem('Não consegui descobrir sua cidade. Verifique a permissão de localização.');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <Text style={styles.rotulo}>Cidade</Text>
        <TextInput
          value={municipio}
          onChangeText={setMunicipio}
          placeholder="Ex.: Americana"
          placeholderTextColor={colors.muted}
          style={styles.input}
          autoCapitalize="words"
          autoCorrect={false}
        />

        <Text style={styles.rotulo}>Estado (UF)</Text>
        <TextInput
          value={uf}
          onChangeText={(t) => setUf(t.toUpperCase().slice(0, 2))}
          placeholder="SP"
          placeholderTextColor={colors.muted}
          style={[styles.input, { width: 90 }]}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={2}
        />

        {mensagem ? <Text style={styles.erro}>{mensagem}</Text> : null}

        <Pressable style={styles.primario} onPress={buscar} accessibilityRole="button">
          <Text style={styles.primarioTexto}>Buscar postos</Text>
        </Pressable>
        <Pressable
          style={styles.secundario}
          onPress={() => void usarGps()}
          disabled={localizando}
          accessibilityRole="button"
        >
          <Text style={styles.secundarioTexto}>
            {localizando ? 'Localizando…' : 'Usar minha localização'}
          </Text>
        </Pressable>

        <View style={styles.sobre}>
          <Text style={styles.sobreTitulo}>Sobre os dados</Text>
          <Text style={styles.sobreTexto}>
            As informações vêm do cadastro público de revendedores da ANP (Agência Nacional do
            Petróleo). Ele traz endereço, bandeira, combustíveis, bicos e situação cadastral. Não traz
            preços nem resultados de análise de combustível. A localização de alguns postos pode estar
            desatualizada ou ausente.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 20, gap: 10 },
  rotulo: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 6 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 16,
    color: colors.text,
  },
  erro: { color: colors.danger, fontSize: 13 },
  primario: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarioTexto: { color: '#fff', fontWeight: '800', fontSize: 16 },
  secundario: {
    borderRadius: radius.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  secundarioTexto: { color: colors.primary, fontWeight: '700', fontSize: 15 },
  sobre: {
    marginTop: 18,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    gap: 6,
  },
  sobreTitulo: { fontWeight: '800', color: colors.primaryDark },
  sobreTexto: { fontSize: 13, color: colors.text, lineHeight: 19 },
});
