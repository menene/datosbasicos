import { Mail } from "lucide-react";

export const EMAIL_CONTACTO = "info@datosbasicos.gt";

/** Correo de contacto, grande y centrado. Lo usan el inicio y la página Acerca. */
export default function BloqueContacto({ className = "" }: { className?: string }) {
  return (
    <div className={`text-center ${className}`}>
      <p className="inline-flex items-center gap-2 text-xs text-selva font-body font-medium tracking-widest uppercase mb-3">
        <Mail size={13} className="shrink-0" />
        Escríbenos
      </p>
      <a
        href={`mailto:${EMAIL_CONTACTO}`}
        className="block font-display font-bold text-foreground text-3xl sm:text-4xl md:text-5xl break-words
                   hover:text-selva transition-colors"
      >
        {EMAIL_CONTACTO}
      </a>
      <p className="mt-3 text-sm text-muted-foreground font-body">
        Comentarios, correcciones de datos o propuestas de colaboración.
      </p>
    </div>
  );
}
