import { describe, expect, it } from "vitest";
import {
  PREDETERMINADO,
  escribirEstado,
  filasMunicipios,
  leerEstado,
  mediana,
  pasaFiltrosLugar,
  pasaRango,
  pearson,
} from "./explorador";
import type { Municipio } from "@/types/municipio";

const leer = (qs: string) => leerEstado(new URLSearchParams(qs));

describe("estado en la URL", () => {
  it("sin parámetros da el estado predeterminado", () => {
    expect(leer("")).toEqual(PREDETERMINADO);
    expect(escribirEstado(PREDETERMINADO)).toEqual({});
  });

  it("ida y vuelta conserva una vista armada", () => {
    const qs =
      "nivel=municipios&tipo=dispersion&v=vulnerabilidad_social&x=pct_indigena&depto=alta-verapaz&cat=alta,muy+alta&min=40&color=categoria";
    const e = leer(qs);
    expect(e.nivel).toBe("municipios");
    expect(e.categorias).toEqual(["alta", "muy alta"]);
    expect(e.min).toBe(40);
    expect(leerEstado(new URLSearchParams(escribirEstado(e)))).toEqual(e);
  });

  it("municipios arrancan en 20 lugares; 'todos' se guarda explícito", () => {
    expect(leer("nivel=municipios").limite).toBe(20);
    expect(leer("nivel=municipios&n=todos").limite).toBeNull();
    expect(escribirEstado({ ...leer("nivel=municipios"), limite: null }).n).toBe("todos");
    expect(escribirEstado(leer("nivel=municipios")).n).toBeUndefined();
  });

  it("descarta valores que no aplican al nivel", () => {
    const e = leer("depto=alta-verapaz&cat=alta&color=categoria&anio=2018");
    expect(e.depto).toBeNull();
    expect(e.categorias).toEqual([]);
    expect(e.color).toBe("uno");
    expect(e.anio).toBe(2025); // 2018 solo existe para municipios
    expect(leer("nivel=municipios&anio=2018").anio).toBe(2018);
  });
});

describe("filtros", () => {
  const muni = {
    slug: "coban",
    nombre: "Cobán",
    departamento_slug: "alta-verapaz",
    departamento: "Alta Verapaz",
    vulnerabilidad_categoria: "alta",
    poblacion_total: 263630,
    series: { "2018": { poblacion_total: 212427 } },
  } as unknown as Municipio;
  const filas = filasMunicipios([muni], new Map([["alta-verapaz", "norte"]]));

  it("una fila por año, con la región del departamento", () => {
    expect(filas.map((f) => f.anio)).toEqual([2018, 2025]);
    expect(filas[1].valores.poblacion_total).toBe(263630);
    expect(filas[0].region).toBe("norte");
  });

  it("región, departamento y categoría", () => {
    const f = filas[1];
    expect(pasaFiltrosLugar(f, { ...PREDETERMINADO, region: "norte" })).toBe(true);
    expect(pasaFiltrosLugar(f, { ...PREDETERMINADO, region: "central" })).toBe(false);
    expect(pasaFiltrosLugar(f, { ...PREDETERMINADO, categorias: ["muy alta"] })).toBe(false);
    expect(pasaFiltrosLugar(f, { ...PREDETERMINADO, categorias: ["alta"] })).toBe(true);
  });

  it("rango inclusivo; sin dato nunca pasa", () => {
    const e = { ...PREDETERMINADO, min: 10, max: 20 };
    expect(pasaRango(10, e)).toBe(true);
    expect(pasaRango(20, e)).toBe(true);
    expect(pasaRango(20.1, e)).toBe(false);
    expect(pasaRango(undefined, PREDETERMINADO)).toBe(false);
  });
});

describe("estadísticas", () => {
  it("mediana con cantidad par e impar", () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([4, 1, 3, 2])).toBe(2.5);
    expect(mediana([])).toBeNull();
  });

  it("pearson", () => {
    expect(pearson([{ x: 1, y: 2 }, { x: 2, y: 4 }, { x: 3, y: 6 }])).toBeCloseTo(1);
    expect(pearson([{ x: 1, y: 3 }, { x: 2, y: 2 }, { x: 3, y: 1 }])).toBeCloseTo(-1);
    expect(pearson([{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }])).toBeNull();
    expect(pearson([{ x: 1, y: 1 }])).toBeNull();
  });
});
