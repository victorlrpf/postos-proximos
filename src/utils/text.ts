export const semAcento = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Maiúsculas, sem acento e com espaços colapsados: forma usada para comparar nomes. */
export const normalizar = (s: string): string =>
  semAcento(s).toUpperCase().replace(/\s+/g, ' ').trim();

const MINUSCULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'a', 'o']);

/** "AUTO POSTO SÃO JERÔNIMO DE AMERICANA LTDA" -> "Auto Posto São Jerônimo de Americana Ltda" */
export const titulo = (s: string): string => {
  const limpo = s.replace(/\s+/g, ' ').trim().toLowerCase();
  if (!limpo) return '';
  return limpo
    .split(' ')
    .map((palavra, i) => {
      if (i > 0 && MINUSCULAS.has(palavra)) return palavra;
      if (palavra === 's/n') return 'S/N';
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
};

/** Interpreta "dd/mm/aaaa" (formato da ANP). Retorna null se inválida. */
export const parseDataBr = (s: string): Date | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
};
