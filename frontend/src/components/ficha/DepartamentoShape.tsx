import { useGeoData } from "@/api/geo";
import RegionShape from "@/components/ficha/RegionShape";

interface Props {
  slug: string;
  size?: number;
  className?: string;
}

export default function DepartamentoShape({ slug, size = 220, className }: Props) {
  const { data: geoData, isLoading } = useGeoData();
  return (
    <RegionShape
      features={geoData?.features}
      slug={slug}
      size={size}
      className={className}
      isLoading={isLoading}
      ariaLabel="Silueta del departamento"
    />
  );
}
