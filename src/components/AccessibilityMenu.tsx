// ============================================================================
// ARCHIVO: src/components/AccessibilityMenu.tsx  —  BOTÓN DE ACCESIBILIDAD
// ----------------------------------------------------------------------------
// Menú flotante para agrandar/achicar la letra, activar alto contraste y
// filtros de daltonismo. Aplica clases CSS al documento; no toca los datos.
// ============================================================================
import { Accessibility, Contrast, RotateCcw, Type } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";

type Vision = "normal" | "protanopia" | "deuteranopia" | "tritanopia" | "grayscale";

const VISION_OPTIONS: Array<{ key: Vision; label: string }> = [
  { key: "normal", label: "Sin filtro" },
  { key: "protanopia", label: "Protanopía (rojo)" },
  { key: "deuteranopia", label: "Deuteranopía (verde)" },
  { key: "tritanopia", label: "Tritanopía (azul)" },
  { key: "grayscale", label: "Escala de grises" },
];

const STORAGE = "infoduoc-a11y";

export function AccessibilityMenu() {
  const [scale, setScale] = useState(100);
  const [vision, setVision] = useState<Vision>("normal");
  const [contrast, setContrast] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const s = JSON.parse(raw) as { scale?: number; vision?: Vision; contrast?: boolean };
        if (s.scale) setScale(s.scale);
        if (s.vision) setVision(s.vision);
        if (s.contrast) setContrast(s.contrast);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = `${scale}%`;
    const filters: string[] = [];
    if (vision !== "normal") filters.push(`url(#a11y-${vision})`);
    if (contrast) filters.push("contrast(1.25) saturate(1.2)");
    root.style.filter = filters.join(" ");
    try {
      localStorage.setItem(STORAGE, JSON.stringify({ scale, vision, contrast }));
    } catch {
      /* ignore */
    }
  }, [scale, vision, contrast]);

  return (
    <>
      {/* Filtros de daltonismo */}
      <svg aria-hidden="true" className="pointer-events-none absolute size-0">
        <defs>
          <filter id="a11y-protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0 0 0  0.558 0.442 0 0 0  0 0.242 0.758 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="a11y-deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0 0 0  0.7 0.3 0 0 0  0 0.3 0.7 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="a11y-tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.95 0.05 0 0 0  0 0.433 0.567 0 0  0 0.475 0.525 0 0  0 0 0 1 0"
            />
          </filter>
          <filter id="a11y-grayscale">
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      <div className="fixed right-5 bottom-5 z-50">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              className="size-12 rounded-full bg-[image:var(--gradient-gold)] text-accent-foreground shadow-[var(--shadow-elevated)] hover:brightness-105"
              aria-label="Opciones de accesibilidad"
              title="Accesibilidad: tamaño de letra y daltonismo"
            >
              <Accessibility className="size-6" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" side="top" className="w-80 space-y-5">
            <div>
              <h2 className="text-sm font-bold text-foreground">Accesibilidad</h2>
              <p className="text-xs text-muted-foreground">
                Ajusta la aplicación a tus necesidades visuales.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="size-4" /> Tamaño de letra: {scale}%
              </Label>
              <Slider
                min={80}
                max={160}
                step={5}
                value={[scale]}
                onValueChange={([v]) => setScale(v ?? 100)}
              />
            </div>

            <div className="space-y-2">
              <Label>Modo de color (daltonismo)</Label>
              <div className="grid grid-cols-2 gap-2">
                {VISION_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setVision(o.key)}
                    className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition-colors ${
                      vision === o.key
                        ? "border-accent bg-accent/15 text-foreground"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant={contrast ? "default" : "outline"}
              className="w-full justify-start gap-2"
              onClick={() => setContrast((c) => !c)}
            >
              <Contrast className="size-4" />
              {contrast ? "Alto contraste activado" : "Activar alto contraste"}
            </Button>

            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={() => {
                setScale(100);
                setVision("normal");
                setContrast(false);
              }}
            >
              <RotateCcw className="size-4" /> Restablecer
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
