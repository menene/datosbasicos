import { describe, expect, it } from "vitest";
import {
  calcularDensidad,
  calcularDuplicacion,
  completarDepartamento,
  completarDerivados,
  completarMunicipio,
  CONSTANTE_DUPLICACION,
} from "./derivados";
import type { Departamento } from "@/types/departamento";
import type { Municipio } from "@/types/municipio";

describe("calcularDensidad", () => {
  it("divides población entre superficie, redondeado a 2 decimales", () => {
    expect(calcularDensidad(1000, 3)).toBeCloseTo(333.33, 2);
  });

  it("regresa null si falta población, superficie, o superficie <= 0", () => {
    expect(calcularDensidad(null, 10)).toBeNull();
    expect(calcularDensidad(1000, null)).toBeNull();
    expect(calcularDensidad(1000, 0)).toBeNull();
    expect(calcularDensidad(1000, -5)).toBeNull();
    expect(calcularDensidad(0, 10)).toBeNull();
  });
});

describe("calcularDuplicacion", () => {
  it("aplica la regla del 70", () => {
    expect(calcularDuplicacion(2)).toBe(CONSTANTE_DUPLICACION / 2);
    expect(calcularDuplicacion(1.4)).toBeCloseTo(50, 2);
  });

  it("regresa null si la tasa falta o no es positiva", () => {
    expect(calcularDuplicacion(null)).toBeNull();
    expect(calcularDuplicacion(0)).toBeNull();
    expect(calcularDuplicacion(-1)).toBeNull();
  });
});

describe("completarDerivados", () => {
  it("calcula cuando el valor publicado falta", () => {
    const registro = {
      poblacion_total: 1000,
      densidad_hab_km2: null as number | null,
      crecimiento_anual_pct: 2,
      tiempo_duplicacion_anios: null as number | null,
    };
    const out = completarDerivados(registro, 10);
    expect(out.densidad_hab_km2).toBe(100);
    expect(out.tiempo_duplicacion_anios).toBe(35);
  });

  it("conserva el valor publicado si no hay insumos para calcular", () => {
    const registro = { densidad_hab_km2: 42, poblacion_total: null };
    const out = completarDerivados(registro, null);
    expect(out.densidad_hab_km2).toBe(42);
  });

  it("conserva el valor publicado si está dentro de la tolerancia (1.5x) del calculado", () => {
    // calculado = 1000/10 = 100; publicado = 140 está dentro de 1.5x
    const registro = { poblacion_total: 1000, densidad_hab_km2: 140 };
    const out = completarDerivados(registro, 10);
    expect(out.densidad_hab_km2).toBe(140);
  });

  it("el calculado gana si el publicado contradice por más de 1.5x", () => {
    // calculado = 1000/10 = 100; publicado = 200 es 2x el calculado
    const registro = { poblacion_total: 1000, densidad_hab_km2: 200 };
    const out = completarDerivados(registro, 10);
    expect(out.densidad_hab_km2).toBe(100);
  });

  it("regresa el mismo objeto (sin copiar) si nada cambió", () => {
    const registro = { poblacion_total: null, densidad_hab_km2: null, crecimiento_anual_pct: null };
    const out = completarDerivados(registro, null);
    expect(out).toBe(registro);
  });
});

describe("completarDepartamento", () => {
  const base = {
    id: 1,
    slug: "guatemala",
    nombre: "Guatemala",
    region: null,
    superficie_km2: 10,
    cabecera: null,
    feria_titular: null,
    distancia_capital_km: null,
    idiomas_predominantes: null,
  } as unknown as Departamento;

  it("completa la densidad de indicadores usando la superficie del departamento", () => {
    const depto: Departamento = {
      ...base,
      indicadores: { poblacion_total: 1000, densidad_hab_km2: null } as never,
    };
    const out = completarDepartamento(depto);
    expect((out.indicadores as never as { densidad_hab_km2: number }).densidad_hab_km2).toBe(100);
  });

  it("no falla si no hay indicadores", () => {
    const depto: Departamento = { ...base, indicadores: null };
    expect(completarDepartamento(depto)).toBe(depto);
  });
});

describe("completarMunicipio", () => {
  const base = {
    slug: "san-jose",
    nombre: "San José",
    departamento_slug: "peten",
    departamento: "Petén",
    superficie_km2: 20,
    poblacion_total: 2000,
    densidad_hab_km2: null,
  } as unknown as Municipio;

  it("completa la densidad usando la superficie del municipio", () => {
    const out = completarMunicipio(base);
    expect(out.densidad_hab_km2).toBe(100);
  });

  it("no falla con municipio null/undefined", () => {
    expect(completarMunicipio(null as unknown as Municipio)).toBeNull();
  });
});
