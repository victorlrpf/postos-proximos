import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
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
import { normalizar, titulo } from '../utils/text';
import { ESTADOS_BRASIL } from '../utils/uf';

type MunicipioIbge = { id: number; nome: string };
type TipoSeletor = 'estado' | 'cidade';

export default function CidadeModal() {
  const { local, definirLocal, usarMinhaLocalizacao } = useStations();
  const [municipio, setMunicipio] = useState(titulo(local.municipio));
  const [uf, setUf] = useState(local.uf);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [localizando, setLocalizando] = useState(false);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [carregandoMunicipios, setCarregandoMunicipios] = useState(true);
  const [erroMunicipios, setErroMunicipios] = useState<string | null>(null);
  const [tentativaMunicipios, setTentativaMunicipios] = useState(0);
  const [seletor, setSeletor] = useState<TipoSeletor | null>(null);
  const [buscaSeletor, setBuscaSeletor] = useState('');

  useEffect(() => {
    let ativo = true;
    setCarregandoMunicipios(true);
    setErroMunicipios(null);
    setMunicipios([]);

    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
    )
      .then(async (resposta) => {
        if (!resposta.ok) throw new Error('Não foi possível carregar as cidades deste estado.');
        const dados: unknown = await resposta.json();
        if (
          !Array.isArray(dados) ||
          !dados.every(
            (item): item is MunicipioIbge =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              typeof item.id === 'number' &&
              'nome' in item &&
              typeof item.nome === 'string',
          )
        ) {
          throw new Error('A lista de municípios recebida é inválida.');
        }
        return dados.map((item) => item.nome);
      })
      .then((nomes) => {
        if (!ativo) return;
        setMunicipios(nomes);
        setMunicipio((atual) =>
          nomes.some((nome) => normalizar(nome) === normalizar(atual)) ? atual : '',
        );
      })
      .catch((erro: unknown) => {
        if (!ativo) return;
        setErroMunicipios(
          erro instanceof Error ? erro.message : 'Não foi possível carregar os municípios.',
        );
      })
      .finally(() => {
        if (ativo) setCarregandoMunicipios(false);
      });

    return () => {
      ativo = false;
    };
  }, [uf, tentativaMunicipios]);

  const opcoesSeletor = useMemo(() => {
    const opcoes =
      seletor === 'estado'
        ? ESTADOS_BRASIL.map((estado) => ({
            chave: estado.uf,
            titulo: `${estado.nome} (${estado.uf})`,
            valor: estado.uf,
          }))
        : municipios.map((nome) => ({ chave: nome, titulo: nome, valor: nome }));
    const consulta = normalizar(buscaSeletor);
    return consulta ? opcoes.filter((opcao) => normalizar(opcao.titulo).includes(consulta)) : opcoes;
  }, [seletor, municipios, buscaSeletor]);

  const buscar = () => {
    if (!municipio || !municipios.some((nome) => normalizar(nome) === normalizar(municipio))) {
      setMensagem('Selecione uma cidade da lista do estado escolhido.');
      return;
    }
    definirLocal({ uf, municipio });
    router.back();
  };

  const abrirSeletor = (tipo: TipoSeletor) => {
    setBuscaSeletor('');
    setSeletor(tipo);
  };

  const selecionarOpcao = (valor: string) => {
    if (seletor === 'estado') {
      setUf(valor);
      setMunicipio('');
      setMunicipios([]);
      setCarregandoMunicipios(true);
      setErroMunicipios(null);
      setMensagem(null);
    } else {
      setMunicipio(valor);
      setMensagem(null);
    }
    setSeletor(null);
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
        <Text style={styles.rotulo}>Estado (UF)</Text>
        <Pressable
          style={styles.seletorCampo}
          onPress={() => abrirSeletor('estado')}
          accessibilityRole="button"
          accessibilityLabel={`Estado: ${ESTADOS_BRASIL.find((estado) => estado.uf === uf)?.nome ?? uf}`}
        >
          <Text style={styles.seletorTexto}>
            {ESTADOS_BRASIL.find((estado) => estado.uf === uf)?.nome ?? uf} ({uf})
          </Text>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </Pressable>

        <Text style={styles.rotulo}>Cidade</Text>
        <Pressable
          style={[
            styles.seletorCampo,
            (carregandoMunicipios || !!erroMunicipios) && styles.campoDesabilitado,
          ]}
          onPress={() => abrirSeletor('cidade')}
          disabled={carregandoMunicipios || !!erroMunicipios}
          accessibilityRole="button"
          accessibilityLabel={municipio ? `Cidade: ${titulo(municipio)}` : 'Selecionar cidade'}
        >
          <Text style={[styles.seletorTexto, !municipio && styles.placeholder]}>
            {carregandoMunicipios
              ? 'Carregando cidades…'
              : municipio
                ? titulo(municipio)
                : 'Selecione uma cidade'}
          </Text>
          {carregandoMunicipios ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="chevron-down" size={18} color={colors.muted} />
          )}
        </Pressable>
        {erroMunicipios ? (
          <View style={styles.erroMunicipios}>
            <Text style={styles.erro}>{erroMunicipios}</Text>
            <Pressable
              onPress={() => setTentativaMunicipios((tentativa) => tentativa + 1)}
              accessibilityRole="button"
            >
              <Text style={styles.tentarNovamente}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        {mensagem ? <Text style={styles.erro}>{mensagem}</Text> : null}

        <Pressable
          style={[
            styles.primario,
            (!municipio || carregandoMunicipios) && styles.primarioDesabilitado,
          ]}
          onPress={buscar}
          disabled={!municipio || carregandoMunicipios}
          accessibilityRole="button"
        >
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

      <Modal
        visible={seletor !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSeletor(null)}
      >
        <View style={styles.modalFundo}>
          <View style={styles.modalConteudo}>
            <View style={styles.modalTopo}>
              <Text style={styles.modalTitulo}>
                {seletor === 'estado' ? 'Selecione o estado' : 'Selecione a cidade'}
              </Text>
              <Pressable
                onPress={() => setSeletor(null)}
                accessibilityRole="button"
                accessibilityLabel="Fechar seleção"
              >
                <Text style={styles.fechar}>Fechar</Text>
              </Pressable>
            </View>
            <TextInput
              value={buscaSeletor}
              onChangeText={setBuscaSeletor}
              placeholder={seletor === 'estado' ? 'Buscar estado' : 'Buscar cidade'}
              placeholderTextColor={colors.muted}
              style={styles.buscaInput}
              autoCorrect={false}
              autoCapitalize="words"
              accessibilityLabel={seletor === 'estado' ? 'Buscar estado' : 'Buscar cidade'}
            />
            <FlatList
              data={opcoesSeletor}
              keyExtractor={(item) => item.chave}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separador} />}
              ListEmptyComponent={
                <Text style={styles.listaVazia}>
                  {seletor === 'cidade' && carregandoMunicipios
                    ? 'Carregando cidades…'
                    : 'Nenhuma opção encontrada.'}
                </Text>
              }
              renderItem={({ item }) => (
                <Pressable
                  style={styles.opcao}
                  onPress={() => selecionarOpcao(item.valor)}
                  accessibilityRole="button"
                >
                  <Text style={styles.opcaoTexto}>{item.titulo}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  conteudo: { padding: 20, gap: 10 },
  rotulo: { fontSize: 13, fontWeight: '700', color: colors.muted, marginTop: 6 },
  seletorCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 48,
  },
  campoDesabilitado: { opacity: 0.6 },
  seletorTexto: {
    fontSize: 16,
    color: colors.text,
  },
  placeholder: { color: colors.muted },
  chevron: { fontSize: 22, color: colors.muted, marginTop: -7 },
  erro: { color: colors.danger, fontSize: 13 },
  erroMunicipios: { gap: 4 },
  tentarNovamente: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  primario: {
    marginTop: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primarioDesabilitado: { opacity: 0.5 },
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
  modalFundo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalConteudo: {
    height: '85%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  modalTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  modalTitulo: { fontSize: 18, fontWeight: '800', color: colors.text },
  fechar: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  buscaInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
  },
  opcao: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 8 },
  opcaoTexto: { color: colors.text, fontSize: 15 },
  separador: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  listaVazia: { color: colors.muted, textAlign: 'center', padding: 20, fontSize: 14 },
});
