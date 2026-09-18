import { beforeEach, describe, expect, it } from "vitest";
import { useSeleccion } from "./seleccion";

const ESTADO_INICIAL = useSeleccion.getState();

beforeEach(() => {
  useSeleccion.setState(ESTADO_INICIAL, true);
});

describe("useSeleccion", () => {
  it("arranca sin nada seleccionado", () => {
    const s = useSeleccion.getState();
    expect(s.departamentoActivo).toBeNull();
    expect(s.municipioActivo).toBeNull();
    expect(s.municipioDeptActivo).toBeNull();
    expect(s.lagoActivo).toBeNull();
    expect(s.departamentosComparar).toEqual([]);
  });

  it("setDepartamentoActivo activa el departamento y cierra el lago", () => {
    useSeleccion.getState().setLagoActivo("atitlan");
    useSeleccion.getState().setDepartamentoActivo("peten");
    const s = useSeleccion.getState();
    expect(s.departamentoActivo).toBe("peten");
    expect(s.lagoActivo).toBeNull();
  });

  it("setDepartamentoActivo(null) no reabre un lago que ya estaba cerrado", () => {
    useSeleccion.getState().setDepartamentoActivo(null);
    expect(useSeleccion.getState().lagoActivo).toBeNull();
  });

  it("setMunicipioActivo guarda el departamento del municipio y cierra el lago", () => {
    useSeleccion.getState().setLagoActivo("amatitlan");
    useSeleccion.getState().setMunicipioActivo("san-jose", "peten");
    const s = useSeleccion.getState();
    expect(s.municipioActivo).toBe("san-jose");
    expect(s.municipioDeptActivo).toBe("peten");
    expect(s.lagoActivo).toBeNull();
  });

  it("setMunicipioActivo(null) limpia también el departamento del municipio", () => {
    useSeleccion.getState().setMunicipioActivo("san-jose", "peten");
    useSeleccion.getState().setMunicipioActivo(null);
    const s = useSeleccion.getState();
    expect(s.municipioActivo).toBeNull();
    expect(s.municipioDeptActivo).toBeNull();
  });

  it("setLagoActivo cierra departamento y municipio (comparten el panel)", () => {
    useSeleccion.getState().setDepartamentoActivo("peten");
    useSeleccion.getState().setMunicipioActivo("san-jose", "peten");
    useSeleccion.getState().setLagoActivo("atitlan");
    const s = useSeleccion.getState();
    expect(s.lagoActivo).toBe("atitlan");
    expect(s.departamentoActivo).toBeNull();
    expect(s.municipioActivo).toBeNull();
    expect(s.municipioDeptActivo).toBeNull();
  });

  it("toggleComparar agrega hasta 2 departamentos", () => {
    useSeleccion.getState().toggleComparar("guatemala");
    useSeleccion.getState().toggleComparar("peten");
    expect(useSeleccion.getState().departamentosComparar).toEqual(["guatemala", "peten"]);
  });

  it("toggleComparar ignora un tercer departamento", () => {
    useSeleccion.getState().toggleComparar("guatemala");
    useSeleccion.getState().toggleComparar("peten");
    useSeleccion.getState().toggleComparar("izabal");
    expect(useSeleccion.getState().departamentosComparar).toEqual(["guatemala", "peten"]);
  });

  it("toggleComparar quita un departamento ya seleccionado", () => {
    useSeleccion.getState().toggleComparar("guatemala");
    useSeleccion.getState().toggleComparar("guatemala");
    expect(useSeleccion.getState().departamentosComparar).toEqual([]);
  });

  it("clearComparar vacía la selección", () => {
    useSeleccion.getState().toggleComparar("guatemala");
    useSeleccion.getState().toggleComparar("peten");
    useSeleccion.getState().clearComparar();
    expect(useSeleccion.getState().departamentosComparar).toEqual([]);
  });
});
