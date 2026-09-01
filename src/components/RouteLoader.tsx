// ============================================================================
// ARCHIVO: src/components/RouteLoader.tsx  —  PANTALLA DE CARGA
// ----------------------------------------------------------------------------
// Círculo amarillo girando que aparece al cambiar de página.
// Cambia colores/tamaño editando las clases de Tailwind en este archivo.
// ============================================================================
import { useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/** Muestra un spinner amarillo mientras se navega entre páginas. */
export function RouteLoader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [visible, setVisible] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 600);
    return () => clearTimeout(t);
  }, [pathname]);

  if (!visible) return null;


  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy-deep/55 backdrop-blur-sm animate-in duration-200 fade-in"
    >
      <div className="flex flex-col items-center gap-4">
        <span className="size-14 animate-spin rounded-full border-4 border-primary-foreground/20 border-t-duoc-yellow" />
        <span className="text-sm font-semibold text-primary-foreground/80">Cargando…</span>
      </div>
      <span className="sr-only">Cargando página</span>
    </div>
  );
}
