import { beforeEach, describe, expect, it } from "vitest";
import { ANIO_PREDETERMINADO, useFiltros } from "./filtros";

const ESTADO_INICIAL = useFiltros.getState();

beforeEach(() => {
  useFiltros.setState(ESTADO_INICIAL, true);
});

describe("useFiltros", () => {
  it("arranca con los valores por defecto", () => {
    const s = useFiltros.getState();
    expect(s.variableActiva).toBe("poblacion_total");
    expect(s.region).toBeNull();
    expect(s.busqueda).toBe("");
    expect(s.anios).toEqual([ANIO_PREDETERMINADO]);
    expect(s.anioMapa).toBe(ANIO_PREDETERMINADO);
  });

  it("setVariable actualiza la variable activa", () => {
    useFiltros.getState().setVariable("idh");
    expect(useFiltros.getState().variableActiva).toBe("idh");
  });

  it("setRegion actualiza y permite limpiar con null", () => {
    useFiltros.getState().setRegion("Norte");
    expect(useFiltros.getState().region).toBe("Norte");
    useFiltros.getState().setRegion(null);
    expect(useFiltros.getState().region).toBeNull();
  });

  it("setBusqueda actualiza el texto de búsqueda", () => {
    useFiltros.getState().setBusqueda("Petén");
    expect(useFiltros.getState().busqueda).toBe("Petén");
  });

  it("setAnios ordena ascendente y deduplica", () => {
    useFiltros.getState().setAnios([2025, 1994, 2025, 2005]);
    expect(useFiltros.getState().anios).toEqual([1994, 2005, 2025]);
  });

  it("setAnios ignora una lista vacía (siempre debe quedar al menos un año)", () => {
    useFiltros.getState().setAnios([2005]);
    useFiltros.getState().setAnios([]);
    expect(useFiltros.getState().anios).toEqual([2005]);
  });

  it("toggleAnio agrega un año ausente y lo mantiene ordenado", () => {
    useFiltros.getState().setAnios([2025]);
    useFiltros.getState().toggleAnio(1994);
    expect(useFiltros.getState().anios).toEqual([1994, 2025]);
  });

  it("toggleAnio quita un año presente", () => {
    useFiltros.getState().setAnios([1994, 2025]);
    useFiltros.getState().toggleAnio(1994);
    expect(useFiltros.getState().anios).toEqual([2025]);
  });

  it("toggleAnio no permite quedar sin ningún año seleccionado", () => {
    useFiltros.getState().setAnios([2025]);
    useFiltros.getState().toggleAnio(2025);
    expect(useFiltros.getState().anios).toEqual([2025]);
  });

  it("setAnioMapa actualiza el año del mapa independientemente de `anios`", () => {
    useFiltros.getState().setAnios([2025]);
    useFiltros.getState().setAnioMapa(1994);
    expect(useFiltros.getState().anioMapa).toBe(1994);
    expect(useFiltros.getState().anios).toEqual([2025]);
  });
});
