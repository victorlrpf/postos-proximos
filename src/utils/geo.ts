import type { Coordenadas } from '../types';

const RAIO_TERRA_KM = 6371;
const rad = (g: number) => (g * Math.PI) / 180;

export function distanciaKm(a: Coordenadas, b: Coordenadas): number {
  const dLat = rad(b.latitude - a.latitude);
  const dLon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

export function formatarDistancia(km: number): string {
  if (km < 1) return `${Math.round(km * 10) * 100} m`;
  return `${km.toFixed(1).replace('.', ',')} km`;
}

/**
 * A ANP devolve latitude/longitude como texto ("-22.7463243") e, para parte dos
 * postos, como string vazia. Também descartamos valores fora do território brasileiro,
 * que indicam erro de cadastro.
 */
export function parseCoordenadas(lat: string, lon: string): Coordenadas | null {
  if (!lat?.trim() || !lon?.trim()) return null;
  const latitude = Number.parseFloat(lat.replace(',', '.'));
  const longitude = Number.parseFloat(lon.replace(',', '.'));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -34 || latitude > 6 || longitude < -74 || longitude > -28) return null;
  return { latitude, longitude };
}

export function urlRota(destino: Coordenadas | null, enderecoCompleto: string): string {
  const alvo = destino
    ? `${destino.latitude},${destino.longitude}`
    : encodeURIComponent(enderecoCompleto);
  return `https://www.google.com/maps/dir/?api=1&destination=${alvo}`;
}
