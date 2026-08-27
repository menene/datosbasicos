"""Indicadores derivados: densidad poblacional y tiempo de duplicación.

Ambos son cocientes de otros dos indicadores, así que se calculan en vez de
copiarse cuando el documento fuente no los trae:

    densidad_hab_km2         = población total / extensión territorial (km²)
    tiempo_duplicacion_anios = 70 / tasa de crecimiento anual (%)   [regla del 70]

Política, idéntica en los dos scripts de extracción y en el frontend
(`frontend/src/lib/derivados.ts`, que la repite para los datos que llegan por API):

1. Si falta el valor y se pueden aplicar los insumos, se calcula.
2. Si el valor existe pero contradice a la fórmula por más de `TOLERANCIA`, gana la
   fórmula: significa que el número publicado quedó obsoleto (por ejemplo, una
   densidad que venía con una población anterior a la que ahora tenemos) o que es un
   error del documento.
3. Si faltan los insumos, se conserva el valor publicado.
"""
from __future__ import annotations

# Regla del 70: una población que crece r % al año duplica su tamaño en 70/r años.
# Ej.: r = 2.00 → 70 / 2.00 = 35 años.
CONSTANTE_DUPLICACION = 70.0

# Desacuerdo tolerado entre el valor publicado y el calculado: hasta 1.5x en
# cualquier dirección. Más que eso ya no es redondeo ni un insumo ligeramente
# distinto, es un dato equivocado.
TOLERANCIA = 0.5


def densidad(poblacion: float | None, superficie: float | None) -> float | None:
    if not poblacion or not superficie or superficie <= 0:
        return None
    return round(poblacion / superficie, 2)


def tiempo_duplicacion(tasa_crecimiento: float | None) -> float | None:
    if not tasa_crecimiento or tasa_crecimiento <= 0:
        return None
    return round(CONSTANTE_DUPLICACION / tasa_crecimiento, 2)


def _resolver(publicado: float | None, calculado: float | None) -> tuple[float | None, str]:
    """Devuelve (valor, motivo) donde motivo ∈ {"publicado", "calculado", "corregido"}."""
    if calculado is None:
        return publicado, "publicado"
    if publicado is None:
        return calculado, "calculado"
    mayor, menor = max(publicado, calculado), min(publicado, calculado)
    if menor <= 0 or mayor / menor > 1 + TOLERANCIA:
        return calculado, "corregido"
    return publicado, "publicado"


def completar(registro: dict, superficie: float | None = None) -> dict[str, int]:
    """Rellena en sitio densidad y tiempo de duplicación. Devuelve el conteo por motivo.

    `superficie` permite pasar la extensión desde fuera (los indicadores de
    departamento no la llevan: vive en el departamento, no en el corte anual).
    """
    conteo = {"calculado": 0, "corregido": 0}
    sup = superficie if superficie is not None else registro.get("superficie_km2")

    for clave, calculado in (
        ("densidad_hab_km2", densidad(registro.get("poblacion_total"), sup)),
        ("tiempo_duplicacion_anios", tiempo_duplicacion(registro.get("crecimiento_anual_pct"))),
    ):
        valor, motivo = _resolver(registro.get(clave), calculado)
        registro[clave] = valor
        if motivo in conteo:
            conteo[motivo] += 1

    return conteo
