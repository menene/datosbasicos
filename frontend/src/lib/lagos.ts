import type { NivelContaminacion } from "@/types/lago";

/** Semáforo de contaminación de la fuente: rojo = muy alto, amarillo = moderado. */
const COLOR_NIVEL: Record<NivelContaminacion, string> = {
  muy_alto: "#B91C1C",
  alto: "#C2410C",
  moderado: "#A16207",
  bajo: "#15803D",
};

const ETIQUETA_NIVEL: Record<NivelContaminacion, string> = {
  muy_alto: "Muy alto",
  alto: "Alto",
  moderado: "Moderado",
  bajo: "Bajo",
};

export const colorNivel = (nivel: NivelContaminacion): string => COLOR_NIVEL[nivel];
export const etiquetaNivel = (nivel: NivelContaminacion): string => ETIQUETA_NIVEL[nivel];
