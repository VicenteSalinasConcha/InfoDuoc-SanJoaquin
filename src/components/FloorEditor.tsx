// ============================================================================
// ARCHIVO: src/components/FloorEditor.tsx  —  EDITOR VISUAL DE PISOS (2D)
// ----------------------------------------------------------------------------
// Plano cuadriculado donde el administrador "dibuja" el mapa:
//   - Arrastrar un bloque = moverlo (se ajusta a la grilla con SNAP).
//   - Esquina amarilla inferior = cambiar tamaño.
//   - Círculo amarillo superior = girar (rotación en grados).
//   - Botón rojo = eliminar el bloque.
// UNIT = píxeles por unidad "u" del plano; SNAP = precisión del ajuste (0.1).
// ============================================================================
import { RotateCw, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import type { Room } from "@/lib/infoduoc-store";

const UNIT = 56;
const SNAP = 0.1;

const snap = (v: number) => Math.round(v / SNAP) * SNAP;

type Props = {
  rooms: Room[];
  gridW: number;
  gridH: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChange: (id: string, patch: Partial<Room>) => void;
  onDelete: (id: string) => void;
};

export function FloorEditor({
  rooms,
  gridW,
  gridH,
  selectedId,
  onSelect,
  onChange,
  onDelete,
}: Props) {
  const stage = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | {
    id: string;
    mode: "move" | "resize" | "rotate";
    startX: number;
    startY: number;
    startAngle: number;
    room: Room;
  }>(null);

  const start = (e: React.PointerEvent, room: Room, mode: "move" | "resize" | "rotate") => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSelect(room.id);
    let startAngle = 0;
    if (mode === "rotate" && stage.current) {
      const rect = stage.current.getBoundingClientRect();
      const cx = rect.left + (room.x + room.w / 2) * UNIT;
      const cy = rect.top + (room.y + room.h / 2) * UNIT;
      startAngle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
    }
    setDrag({ id: room.id, mode, startX: e.clientX, startY: e.clientY, startAngle, room });
  };

  const move = (e: React.PointerEvent) => {
    if (!drag) return;
    const dx = (e.clientX - drag.startX) / UNIT;
    const dy = (e.clientY - drag.startY) / UNIT;
    const r = drag.room;
    if (drag.mode === "move") {
      onChange(drag.id, {
        x: snap(Math.min(Math.max(0, r.x + dx), gridW - r.w)),
        y: snap(Math.min(Math.max(0, r.y + dy), gridH - r.h)),
      });
    } else if (drag.mode === "resize") {
      onChange(drag.id, {
        w: snap(Math.min(Math.max(0.6, r.w + dx), gridW - r.x)),
        h: snap(Math.min(Math.max(0.6, r.h + dy), gridH - r.y)),
      });
    } else if (stage.current) {
      const rect = stage.current.getBoundingClientRect();
      const cx = rect.left + (r.x + r.w / 2) * UNIT;
      const cy = rect.top + (r.y + r.h / 2) * UNIT;
      const angle = (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      const next = Math.round((r.rot ?? 0) + (angle - drag.startAngle));
      onChange(drag.id, { rot: ((next % 360) + 360) % 360 });
    }
  };

  return (
    <div
      className="max-w-full overflow-auto rounded-xl border border-border bg-muted/40 p-3 sm:p-4"
      onPointerMove={move}
      onPointerUp={() => setDrag(null)}
    >
      <div
        ref={stage}
        className="relative shrink-0 rounded-md bg-map-floor"
        style={{
          width: gridW * UNIT,
          height: gridH * UNIT,
          backgroundImage:
            "linear-gradient(to right, oklch(0 0 0/8%) 1px, transparent 1px), linear-gradient(to bottom, oklch(0 0 0/8%) 1px, transparent 1px)",
          backgroundSize: `${UNIT / 2}px ${UNIT / 2}px`,
        }}
      >
        {rooms.map((room) => {
          const active = selectedId === room.id;
          return (
            <div
              key={room.id}
              onPointerDown={(e) => start(e, room, "move")}
              className={`absolute cursor-move touch-none overflow-hidden rounded-[3px] text-[10px] font-bold transition-shadow ${
                active
                  ? "ring-2 ring-accent shadow-[var(--shadow-elevated)]"
                  : "ring-1 ring-navy/25"
              }`}
              style={{
                left: room.x * UNIT,
                top: room.y * UNIT,
                width: room.w * UNIT,
                height: room.h * UNIT,
                transform: `rotate(${room.rot ?? 0}deg)`,
                backgroundColor:
                  room.kind === "escalera"
                    ? "var(--map-stairs)"
                    : room.kind === "servicio"
                      ? "var(--map-wall)"
                      : "var(--map-roof)",
                backgroundImage: room.photo ? `url(${room.photo})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <span className="absolute inset-x-0 bottom-0 truncate bg-navy/75 px-1 py-0.5 text-primary-foreground">
                {room.name}
              </span>
              {active && (
                <>
                  <button
                    type="button"
                    aria-label={`Eliminar ${room.name}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => onDelete(room.id)}
                    className="absolute top-0.5 left-0.5 rounded bg-destructive p-0.5 text-primary-foreground"
                  >
                    <Trash2 className="size-3" />
                  </button>
                  <span
                    role="button"
                    aria-label={`Girar ${room.name}`}
                    onPointerDown={(e) => start(e, room, "rotate")}
                    className="absolute top-0.5 right-0.5 flex size-4 cursor-grab touch-none items-center justify-center rounded-full bg-accent text-accent-foreground"
                  >
                    <RotateCw className="size-3" />
                  </span>
                  <span
                    onPointerDown={(e) => start(e, room, "resize")}
                    className="absolute right-0 bottom-0 size-3 cursor-nwse-resize touch-none bg-accent"
                  />
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function EditorHint({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        Arrastra los bloques para moverlos, usa la esquina amarilla para el tamaño y el círculo
        amarillo superior para girarlos.
      </p>
      <Button onClick={onAdd}>Agregar bloque</Button>
    </div>
  );
}
