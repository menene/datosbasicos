import { useMemo } from "react";
import { useGeoMunicipios } from "@/api/geo";
import { slugify } from "@/lib/mapa";
import RegionShape from "@/components/ficha/RegionShape";

interface Props {
  slug: string;
  /** Parent department slug — scopes the search so same-named municipios don't collide. */
  departamentoSlug: string;
  size?: number;
  className?: string;
}

export default function MunicipioShape({ slug, departamentoSlug, size = 220, className }: Props) {
  const { data: geoData, isLoading } = useGeoMunicipios();

  const features = useMemo(
    () =>
      geoData?.features.filter(
        (f) => slugify((f.properties?.["departamento"] as string) ?? "") === departamentoSlug
      ),
    [geoData, departamentoSlug]
  );

  return (
    <RegionShape
      features={features}
      slug={slug}
      size={size}
      className={className}
      isLoading={isLoading}
      ariaLabel="Silueta del municipio"
    />
  );
}
