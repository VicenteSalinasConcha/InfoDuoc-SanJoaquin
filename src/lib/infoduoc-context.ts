// Contexto estable de InfoDuoc.
//
// Vive separado del store para que React Fast Refresh pueda reemplazar la
// implementación del proveedor sin crear otra identidad de contexto. Tanto el
// proveedor como todos los consumidores siempre apuntan a esta única instancia.
import { createContext, useContext } from "react";

import type { InfoDuocContextValue } from "@/lib/infoduoc-store";

export const InfoDuocContext = createContext<InfoDuocContextValue | null>(null);

export function useInfoDuoc() {
  const value = useContext(InfoDuocContext);

  if (value === null) {
    throw new Error("useInfoDuoc debe usarse dentro de InfoDuocProvider");
  }

  return value;
}