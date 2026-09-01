// ============================================================================
// ARCHIVO: src/components/IconPicker.tsx  —  SELECTOR VISUAL DE ÍCONOS
// ----------------------------------------------------------------------------
// Cuadro de diálogo del panel de administración para escoger el ícono y color
// de cada sala. Lee el catálogo desde src/lib/room-icons.tsx.
// ============================================================================
import { Ban } from "lucide-react";

import { Label } from "@/components/ui/label";
import { ICON_GROUPS, ICON_OPTIONS, MARKER_COLORS, markerColor } from "@/lib/room-icons";

type Props = {
  value: string;
  color?: string | undefined;
  onChange: (marker: string) => void;
  onColor: (color: string | undefined) => void;
};

export function IconPicker({ value, color, onChange, onColor }: Props) {
  const active = markerColor(value, color);
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Ícono de la sala</Label>
        <div className="max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border p-3">
          <button
            type="button"
            onClick={() => onChange("none")}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-semibold transition-colors ${
              value === "none" || !value
                ? "bg-accent/20 text-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Ban className="size-4" /> Sin ícono
          </button>
          {ICON_GROUPS.map((group) => (
            <div key={group}>
              <p className="mb-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                {group}
              </p>
              <div className="grid grid-cols-6 gap-1.5">
                {ICON_OPTIONS.filter((o) => o.group === group).map((o) => {
                  const Icon = o.icon;
                  const selected = value === o.key;
                  return (
                    <button
                      key={o.key}
                      type="button"
                      title={o.label}
                      aria-label={o.label}
                      onClick={() => onChange(o.key)}
                      className={`flex aspect-square items-center justify-center rounded-md border transition-all hover:scale-105 ${
                        selected ? "border-accent ring-2 ring-accent" : "border-border"
                      }`}
                      style={{ background: `color-mix(in oklab, ${o.color} 18%, transparent)` }}
                    >
                      <Icon className="size-4" style={{ color: o.color }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Color del ícono</Label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onColor(undefined)}
            className={`rounded-md border px-2 py-1 text-xs font-semibold ${
              color ? "border-border text-muted-foreground" : "border-accent text-foreground"
            }`}
          >
            Automático
          </button>
          {MARKER_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              aria-label={c.label}
              onClick={() => onColor(c.value)}
              className={`size-7 rounded-full border-2 transition-transform hover:scale-110 ${
                color === c.value ? "border-foreground" : "border-transparent"
              }`}
              style={{ background: c.value }}
            />
          ))}
          <span
            className="ml-auto rounded-md px-2 py-1 text-xs font-bold text-primary-foreground"
            style={{ background: active }}
          >
            Vista previa
          </span>
        </div>
      </div>
    </div>
  );
}
