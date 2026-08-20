/**
 * Umami — analítica autoalojada, sin cookies.
 *
 * Queda completamente inerte si falta cualquiera de las tres variables de
 * entorno: no inyecta el script ni envía eventos. Así el desarrollo local y
 * los builds de prueba nunca contaminan las estadísticas de producción.
 *
 * Las vistas de página NO se registran desde aquí: el tracker de Umami
 * intercepta `history.pushState`, así que las rutas de React Router se
 * registran solas. Aquí solo viven los eventos de uso.
 *
 * Configuración: `VITE_UMAMI_URL` + `VITE_UMAMI_WEBSITE_ID` en el `.env` de la
 * raíz. Ver la sección «Analítica (Umami)» del README.
 */

/** Valores que Umami acepta como propiedades de un evento. */
type ValorEvento = string | number | boolean;

type DatosEvento = Record<string, ValorEvento>;

interface UmamiGlobal {
  track: (nombre: string, datos?: DatosEvento) => void;
}

declare global {
  interface Window {
    umami?: UmamiGlobal;
  }
}

/**
 * Unión cerrada de eventos. Agregar uno aquí antes de usarlo — así un typo
 * es un error de compilación y no una fila huérfana en la base de Umami.
 * Mantener sincronizada la tabla del README (sección «Analítica (Umami)»).
 */
export type Evento =
  | "mapa_vista"
  | "mapa_departamento_click"
  | "mapa_municipio_click"
  | "variable_seleccionada"
  | "anio_cambiado"
  | "tabla_vista"
  | "tabla_orden"
  | "tabla_busqueda"
  | "exportar_xlsx"
  | "ficha_departamento"
  | "ficha_municipio"
  | "navegar_a_ficha"
  | "grafica_orden"
  | "dispersion_ejes"
  | "inicio_cta";

const URL_BASE = import.meta.env.VITE_UMAMI_URL?.replace(/\/$/, "");
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;

export const analyticsHabilitado = Boolean(URL_BASE && WEBSITE_ID);

let inicializado = false;

/**
 * Inyecta el tracker. Idempotente — llamarlo dos veces (StrictMode monta los
 * efectos por duplicado en desarrollo) no duplica el script.
 */
export function initAnalytics(): void {
  if (!analyticsHabilitado || inicializado) return;
  inicializado = true;

  const script = document.createElement("script");
  script.defer = true;
  script.src = `${URL_BASE}/script.js`;
  script.dataset.websiteId = WEBSITE_ID as string;
  document.head.appendChild(script);
}

/**
 * Registra un evento de uso. Silencioso si la analítica está deshabilitada o
 * si un bloqueador impidió que cargara el tracker.
 */
export function track(evento: Evento, datos?: DatosEvento): void {
  if (!analyticsHabilitado) return;
  try {
    window.umami?.track(evento, datos);
  } catch {
    // La analítica nunca debe romper la aplicación.
  }
}

const temporizadores = new Map<Evento, number>();

/**
 * Igual que `track`, pero espera a que el usuario deje de escribir. Para
 * cajas de búsqueda, donde emitir por pulsación generaría ruido inservible.
 */
export function trackDebounced(
  evento: Evento,
  datos?: DatosEvento,
  esperaMs = 800
): void {
  if (!analyticsHabilitado) return;
  const pendiente = temporizadores.get(evento);
  if (pendiente !== undefined) window.clearTimeout(pendiente);
  temporizadores.set(
    evento,
    window.setTimeout(() => {
      temporizadores.delete(evento);
      track(evento, datos);
    }, esperaMs)
  );
}
