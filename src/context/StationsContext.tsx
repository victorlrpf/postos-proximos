import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { LOCAL_PADRAO } from '../config';
import { buscarPostos, buscarRevendedoresGlp } from '../services/anp';
import type {
  Coordenadas,
  Filtros,
  Local,
  PostoComDistancia,
  Posto,
  RevendedorGlp,
} from '../types';
import { distanciaKm } from '../utils/geo';
import { normalizar } from '../utils/text';
import { paraUf } from '../utils/uf';

const LOCAL_KEY = 'local:manual:v1';

type Status = 'carregando' | 'pronto' | 'erro';
type Permissao = 'desconhecida' | 'concedida' | 'negada';

interface StationsContextValue {
  local: Local;
  definirLocal: (l: Local) => void;
  usarMinhaLocalizacao: () => Promise<boolean>;

  posicao: Coordenadas | null;
  permissao: Permissao;

  status: Status;
  erro: string | null;
  desatualizado: boolean;
  baixadoEm: number | null;
  recarregar: () => Promise<void>;

  /** Postos já filtrados e ordenados. */
  postos: PostoComDistancia[];
  totalPostos: number;
  semCoordenadas: number;
  gas: RevendedorGlp[];
  erroGas: string | null;

  filtros: Filtros;
  atualizarFiltros: (parcial: Partial<Filtros>) => void;
  buscarPosto: (id: string) => PostoComDistancia | undefined;
}

const FILTROS_INICIAIS: Filtros = {
  categorias: [],
  situacao: 'todas',
  ordenacao: 'distancia',
  busca: '',
};

const Ctx = createContext<StationsContextValue | null>(null);

export function StationsProvider({ children }: { children: ReactNode }) {
  const [local, setLocal] = useState<Local>(LOCAL_PADRAO);
  const [iniciado, setIniciado] = useState(false);
  const manualRef = useRef(false);

  const [posicao, setPosicao] = useState<Coordenadas | null>(null);
  const [permissao, setPermissao] = useState<Permissao>('desconhecida');

  const [status, setStatus] = useState<Status>('carregando');
  const [erro, setErro] = useState<string | null>(null);
  const [desatualizado, setDesatualizado] = useState(false);
  const [baixadoEm, setBaixadoEm] = useState<number | null>(null);
  const [todosPostos, setTodosPostos] = useState<Posto[]>([]);
  const [gas, setGas] = useState<RevendedorGlp[]>([]);
  const [erroGas, setErroGas] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);

  const requisicao = useRef(0);

  const carregar = useCallback(async (alvo: Local, forcar = false) => {
    const id = ++requisicao.current;
    setStatus('carregando');
    setErro(null);

    const [rp, rg] = await Promise.allSettled([
      buscarPostos(alvo, forcar),
      buscarRevendedoresGlp(alvo, forcar),
    ]);
    if (id !== requisicao.current) return; // chegou resposta de uma busca antiga

    if (rp.status === 'fulfilled') {
      setTodosPostos(rp.value.itens);
      setDesatualizado(rp.value.desatualizado);
      setBaixadoEm(rp.value.baixadoEm);
      setStatus('pronto');
    } else {
      setTodosPostos([]);
      setErro(
        rp.reason instanceof Error
          ? rp.reason.message
          : 'Não foi possível consultar a ANP agora.',
      );
      setStatus('erro');
    }

    if (rg.status === 'fulfilled') {
      setGas(rg.value.itens);
      setErroGas(null);
    } else {
      setGas([]);
      setErroGas(
        rg.reason instanceof Error ? rg.reason.message : 'Não foi possível carregar os dados de gás.',
      );
    }
  }, []);

  // --- Localização do aparelho -------------------------------------------------

  const aplicarCidadeAutomatica = useCallback(async (coords: Coordenadas) => {
    try {
      const [endereco] = await Location.reverseGeocodeAsync(coords);
      const uf = paraUf(endereco?.region);
      const cidade = (endereco?.city ?? endereco?.subregion)?.trim();
      if (!uf || !cidade) return false;
      const novo: Local = { uf, municipio: cidade.toUpperCase() };
      setLocal((atual) =>
        atual.uf === novo.uf && normalizar(atual.municipio) === normalizar(novo.municipio)
          ? atual
          : novo,
      );
      return true;
    } catch {
      return false;
    }
  }, []);

  const detectar = useCallback(
    async (aplicarCidade: boolean): Promise<boolean> => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted) {
          setPermissao('negada');
          return false;
        }
        setPermissao('concedida');

        const ultima = await Location.getLastKnownPositionAsync();
        let coords: Coordenadas | null = ultima
          ? { latitude: ultima.coords.latitude, longitude: ultima.coords.longitude }
          : null;
        if (coords) setPosicao(coords);

        try {
          const atual = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          coords = { latitude: atual.coords.latitude, longitude: atual.coords.longitude };
          setPosicao(coords);
        } catch {
          // mantém a última posição conhecida, se houver
        }

        if (!coords) return false;
        return aplicarCidade ? await aplicarCidadeAutomatica(coords) : true;
      } catch {
        return false;
      }
    },
    [aplicarCidadeAutomatica],
  );

  // Inicialização: restaura o município escolhido manualmente e tenta localizar.
  useEffect(() => {
    (async () => {
      try {
        const salvo = await AsyncStorage.getItem(LOCAL_KEY);
        if (salvo) {
          const l = JSON.parse(salvo) as Local;
          if (l?.uf && l?.municipio) {
            manualRef.current = true;
            setLocal(l);
          }
        }
      } catch {
        // segue com o padrão
      }
      setIniciado(true);
      void detectar(!manualRef.current);
    })();
  }, [detectar]);

  useEffect(() => {
    if (iniciado) void carregar(local);
  }, [iniciado, local, carregar]);

  // --- Ações -------------------------------------------------------------------

  const definirLocal = useCallback((l: Local) => {
    const novo: Local = { uf: l.uf.trim().toUpperCase(), municipio: l.municipio.trim().toUpperCase() };
    manualRef.current = true;
    AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(novo)).catch(() => {});
    setLocal(novo);
  }, []);

  const usarMinhaLocalizacao = useCallback(async () => {
    manualRef.current = false;
    await AsyncStorage.removeItem(LOCAL_KEY).catch(() => {});
    return detectar(true);
  }, [detectar]);

  const recarregar = useCallback(() => carregar(local, true), [carregar, local]);

  const atualizarFiltros = useCallback(
    (parcial: Partial<Filtros>) => setFiltros((f) => ({ ...f, ...parcial })),
    [],
  );

  // --- Derivados ---------------------------------------------------------------

  const comDistancia = useMemo<PostoComDistancia[]>(
    () =>
      todosPostos.map((p) => ({
        ...p,
        distanciaKm: posicao && p.coords ? distanciaKm(posicao, p.coords) : null,
      })),
    [todosPostos, posicao],
  );

  const postos = useMemo(() => {
    const busca = normalizar(filtros.busca);
    const lista = comDistancia.filter((p) => {
      if (!filtros.categorias.every((c) => p.categorias.includes(c))) return false;
      if (filtros.situacao !== 'todas' && p.qualificacao.nivel !== filtros.situacao) return false;
      if (busca) {
        const texto = normalizar(`${p.nome} ${p.bairro} ${p.endereco} ${p.bandeira}`);
        if (!texto.includes(busca)) return false;
      }
      return true;
    });

    const porNome = (a: PostoComDistancia, b: PostoComDistancia) =>
      a.nome.localeCompare(b.nome, 'pt-BR');

    return lista.sort((a, b) => {
      if (filtros.ordenacao === 'bicos') {
        return b.totalBicos - a.totalBicos || porNome(a, b);
      }
      if (a.distanciaKm === null && b.distanciaKm === null) return porNome(a, b);
      if (a.distanciaKm === null) return 1;
      if (b.distanciaKm === null) return -1;
      return a.distanciaKm - b.distanciaKm;
    });
  }, [comDistancia, filtros]);

  const semCoordenadas = useMemo(() => postos.filter((p) => !p.coords).length, [postos]);

  const buscarPosto = useCallback(
    (id: string) => comDistancia.find((p) => p.id === id),
    [comDistancia],
  );

  const valor = useMemo<StationsContextValue>(
    () => ({
      local,
      definirLocal,
      usarMinhaLocalizacao,
      posicao,
      permissao,
      status,
      erro,
      desatualizado,
      baixadoEm,
      recarregar,
      postos,
      totalPostos: todosPostos.length,
      semCoordenadas,
      gas,
      erroGas,
      filtros,
      atualizarFiltros,
      buscarPosto,
    }),
    [
      local,
      definirLocal,
      usarMinhaLocalizacao,
      posicao,
      permissao,
      status,
      erro,
      desatualizado,
      baixadoEm,
      recarregar,
      postos,
      todosPostos.length,
      semCoordenadas,
      gas,
      erroGas,
      filtros,
      atualizarFiltros,
      buscarPosto,
    ],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useStations(): StationsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStations precisa estar dentro de <StationsProvider>.');
  return ctx;
}
