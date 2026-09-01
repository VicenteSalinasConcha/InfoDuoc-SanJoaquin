// ============================================================================
// ARCHIVO: src/routes/mapa.tsx  —  PÁGINA "MAPA" (plano isométrico 3D)
// ----------------------------------------------------------------------------
// ¿Qué hace? Dibuja el mapa 3D del edificio por pisos, con:
//   - Buscador inteligente de salas (arriba).
//   - Botones de piso (-1 al 8).
//   - Zoom (+/−, rueda del mouse y pellizco en celular) y arrastre (pan).
//   - Salas que se iluminan en amarillo al pasar el cursor y muestran su
//     nombre; al hacer clic abren un modal con foto e información.
//
// ¿Qué editar aquí?
//   - UNIT (línea siguiente): tamaño en píxeles de 1 unidad "u" del plano.
//   - MIN_ZOOM / MAX_ZOOM: qué tanto se puede alejar/acercar el mapa.
//   - La sección "Capa 3D: bloques" controla los colores de las salas
//     (amarillo al pasar el cursor, gris normal, patrón de escaleras).
//   - La sección "Capa plana" dibuja nombres e íconos siempre legibles.
// ============================================================================
import { createFileRoute } from "@tanstack/react-router";
import { Maximize2, Minus, MousePointerClick, Move, Plus, RefreshCw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FLOORS, useInfoDuoc, type Room } from "@/lib/infoduoc-store";
import { getIcon, markerColor } from "@/lib/room-icons";

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa isométrico por pisos — InfoDuoc San Joaquín" },
      {
        name: "description",
        content:
          "Explora el plano isométrico 3D de la Sede San Joaquín piso por piso, acerca, desplaza y revisa fotos reales de cada sala.",
      },
      { property: "og:title", content: "Mapa isométrico — InfoDuoc San Joaquín" },
      {
        property: "og:description",
        content: "Plano 3D interactivo con salas, escaleras y rampas de la Sede San Joaquín.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MapaPage,
});

const UNIT = 66;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.9;
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);

const COS45 = Math.SQRT1_2;
const COS55 = Math.cos((55 * Math.PI) / 180);
const SIN55 = Math.sin((55 * Math.PI) / 180);

/** Proyecta un punto del plano isométrico (rotateX(55deg) rotateZ(45deg)) a la capa plana. */
function project(x: number, y: number, z: number, w: number, h: number) {
  const dx = x - w / 2;
  const dy = y - h / 2;
  const rx = dx * COS45 - dy * COS45;
  const ry = dx * COS45 + dy * COS45;
  return { x: w / 2 + rx, y: h / 2 + ry * COS55 - z * SIN55 };
}

function MapaPage() {
  const { data, mapSize, reload } = useInfoDuoc();
  const [floor, setFloor] = useState(1);
  const [selected, setSelected] = useState<Room | null>(null);
  const [, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const viewport = useRef<HTMLDivElement>(null);
  const pan = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const dragged = useRef(false);
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  const [query, setQuery] = useState("");
  const norm = (t: string) =>
    t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const results = useMemo(() => {
    const q = norm(query);
    if (q.length < 1) return [];
    const tokens = q.split(" ").filter(Boolean);
    return data.rooms
      .filter((r) => {
        const hay = norm(`${r.name} ${r.descripcion ?? ""} piso ${r.floor}`);
        return tokens.every((t) => hay.includes(t));
      })
      .slice(0, 8);
  }, [data.rooms, query]);

  const goToRoom = (room: Room) => {
    setFloor(room.floor);
    setActiveId(room.id);
    setSelected(room);
    setQuery("");
    resetView();
  };

  const rooms = useMemo(() => data.rooms.filter((r) => r.floor === floor), [data.rooms, floor]);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const { zoom: z, offset: o } = stateRef.current;
    const el = viewport.current;
    const rect = el?.getBoundingClientRect();
    const cx = px ?? (rect ? rect.width / 2 : 0);
    const cy = py ?? (rect ? rect.height / 2 : 0);
    const next = clamp(z * factor, MIN_ZOOM, MAX_ZOOM);
    const k = next / z;
    setZoom(next);
    setOffset({ x: cx - (cx - o.x) * k, y: cy - (cy - o.y) * k });
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAt(Math.exp(-dy * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    // Zoom por pellizco (móvil/tablet)
    let pinch: number | null = null;
    const dist = (t: TouchList) =>
      Math.hypot(t[0]!.clientX - t[1]!.clientX, t[0]!.clientY - t[1]!.clientY);
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) pinch = dist(e.touches);
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || pinch === null) return;
      e.preventDefault();
      const d = dist(e.touches);
      if (d <= 0) return;
      const rect = el.getBoundingClientRect();
      const cx = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2 - rect.left;
      const cy = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2 - rect.top;
      zoomAt(d / pinch, cx, cy);
      pinch = d;
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [zoomAt]);

  const fitZoom = () => (typeof window !== "undefined" && window.innerWidth < 640 ? 0.65 : 1);

  /** Centra el mapa compensando el escalado desde el origen. */
  const centerOffset = (z: number) => {
    const rect = viewport.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: (rect.width / 2) * (1 - z), y: (rect.height / 2) * (1 - z) };
  };

  const resetView = useCallback(() => {
    const z = fitZoom();
    setZoom(z);
    setOffset(centerOffset(z));
  }, []);

  // Encuadre inicial (más alejado en pantallas pequeñas)
  useEffect(() => {
    resetView();
  }, [resetView]);

  const openRoom = (room: Room) => {
    setActiveId(room.id);
    setSelected(room);
  };

  return (
    <div className="min-h-screen bg-[image:var(--gradient-navy)] px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-primary-foreground sm:text-3xl">
            Mapa de la sede
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-primary-foreground/65 sm:text-sm">
            <span className="inline-flex items-center gap-1.5">
              <MousePointerClick className="size-4 shrink-0" /> Toca una sala para ver su foto
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Move className="size-4 shrink-0" /> Arrastra para desplazar · pellizca o usa + / −
              para acercar
            </span>
          </p>
        </div>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-primary-foreground/60" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && results[0]) goToRoom(results[0]);
              if (e.key === "Escape") setQuery("");
            }}
            placeholder="Buscar sala (ej: Sala 504, laboratorio, baño)"
            aria-label="Buscar sala por nombre"
            className="border-primary-foreground/20 bg-primary-foreground/10 pr-9 pl-9 text-primary-foreground placeholder:text-primary-foreground/50"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Limpiar búsqueda"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-primary-foreground/60 hover:text-primary-foreground"
            >
              <X className="size-4" />
            </button>
          )}
          {query.length > 0 && (
            <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border bg-popover shadow-[var(--shadow-elevated)]">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-muted-foreground">Sin resultados</p>
              ) : (
                results.map((r) => {
                  const o = getIcon(r.marker);
                  const RIcon = o?.icon ?? Search;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => goToRoom(r)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-secondary"
                    >
                      <span
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: markerColor(r.marker, r.color) }}
                      >
                        <RIcon className="size-4 text-primary-foreground" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-foreground">
                          {r.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {r.floor === -1 ? "Piso -1" : `Piso ${r.floor}`}
                          {o?.label ? ` · ${o.label}` : ""}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        <div className="-mx-1 flex w-full gap-2 overflow-x-auto rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-2 sm:mx-0 sm:w-auto sm:flex-wrap sm:overflow-visible">
          {FLOORS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFloor(f);
                setActiveId(null);
              }}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all sm:px-4 sm:text-sm ${
                f === floor
                  ? "bg-[image:var(--gradient-gold)] text-accent-foreground shadow-[var(--shadow-elevated)]"
                  : "text-primary-foreground/70 hover:bg-primary-foreground/10"
              }`}
            >
              {f === -1 ? "Piso -1" : `Piso ${f}`}
            </button>
          ))}
        </div>
      </header>

      <div className="relative mt-6 sm:mt-8 overflow-hidden rounded-3xl border border-primary-foreground/10 bg-navy-deep/40">
        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex flex-col gap-2">
          <Button
            size="icon"
            variant="secondary"
            aria-label="Acercar"
            onClick={() => zoomAt(1.2)}
            disabled={zoom >= MAX_ZOOM - 0.001}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Alejar"
            onClick={() => zoomAt(1 / 1.2)}
            disabled={zoom <= MIN_ZOOM + 0.001}
          >
            <Minus className="size-4" />
          </Button>
          <Button size="icon" variant="secondary" aria-label="Centrar mapa" onClick={resetView}>
            <Maximize2 className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            aria-label="Actualizar mapa"
            title="Actualizar mapa"
            onClick={() => {
              reload();
              toast.success("Mapa actualizado");
            }}
          >
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <span className="absolute bottom-4 left-4 z-20 rounded-full bg-navy-deep/70 px-3 py-1 text-xs font-bold text-primary-foreground/80">
          {Math.round(zoom * 100)}%
        </span>

        <div
          ref={viewport}
          className="relative h-[58vh] min-h-[19rem] sm:h-[62vh] sm:min-h-[26rem] cursor-grab touch-none overflow-hidden active:cursor-grabbing"
          onPointerDown={(e) => {
            dragged.current = false;
            pan.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
          }}
          onPointerMove={(e) => {
            const p = pan.current;
            if (!p) return;
            const dx = e.clientX - p.x;
            const dy = e.clientY - p.y;
            if (!dragged.current && Math.hypot(dx, dy) < 5) return;
            if (!dragged.current) {
              dragged.current = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }
            setOffset({ x: p.ox + dx, y: p.oy + dy });
          }}
          onPointerUp={(e) => {
            pan.current = null;
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerLeave={() => {
            pan.current = null;
            setHoverId(null);
          }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
          >
            <div>
              <div
                key={floor}
                className="relative animate-in duration-500 fade-in zoom-in-95"
                style={{ width: mapSize.w * UNIT, height: mapSize.h * UNIT }}
              >
                {/* Capa 3D: bloques */}
                <div className="iso-stage absolute inset-0">
                  <div className="absolute -inset-6 rounded-sm bg-map-floor/85 shadow-[0_0_0_2px_oklch(0.75_0_0/40%)]" />
                  {rooms.map((room) => {
                    const isStair = room.kind === "escalera";
                    const lifted = hoverId === room.id;
                    return (
                      <div
                        key={room.id}
                        className="absolute"
                        style={{
                          left: room.x * UNIT,
                          top: room.y * UNIT,
                          width: room.w * UNIT - 6,
                          height: room.h * UNIT - 6,
                          transform: `rotate(${room.rot ?? 0}deg)`,
                          transformStyle: "preserve-3d",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (!dragged.current) openRoom(room);
                          }}
                          onPointerEnter={() => setHoverId(room.id)}
                          onPointerLeave={() => setHoverId((c) => (c === room.id ? null : c))}
                          onFocus={() => setHoverId(room.id)}
                          onBlur={() => setHoverId((c) => (c === room.id ? null : c))}
                          aria-label={room.name}
                          className="block size-full cursor-pointer rounded-[3px] transition-all duration-300 outline-none"
                          style={{
                            background: lifted
                              ? "var(--duoc-yellow)"
                              : isStair
                                ? "var(--map-stairs)"
                                : "var(--map-roof)",
                            transform: `translateZ(${room.height + (lifted ? 26 : 0)}px)`,
                            boxShadow: `-${room.height * 0.55}px ${room.height * 0.55}px 0 0 ${
                              lifted
                                ? "var(--duoc-orange)"
                                : isStair
                                  ? "oklch(0.5 0.15 250)"
                                  : "var(--map-wall)"
                            }, 0 24px 32px -14px oklch(0.19 0.06 262 / 55%)`,
                          }}
                        >
                          {isStair && (
                            <span
                              className="pointer-events-none block size-full rounded-[3px]"
                              style={{
                                background:
                                  "repeating-linear-gradient(135deg, oklch(0.19 0.06 262 / 28%) 0 3px, transparent 3px 12px)",
                                boxShadow: "inset 0 0 0 2px oklch(0.19 0.06 262 / 35%)",
                              }}
                            />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Capa plana: nombres y marcadores siempre rectos y legibles */}
                <div className="pointer-events-none absolute inset-0">
                  {rooms.map((room) => {
                    const isStair = room.kind === "escalera";
                    const isHover = hoverId === room.id;
                    const isSelected = selected?.id === room.id;
                    const lifted = isHover;
                    const opt = getIcon(room.marker);
                    const Icon = opt?.icon ?? null;
                    const color = markerColor(room.marker, room.color);
                    const p = project(
                      (room.x + room.w / 2) * UNIT,
                      (room.y + room.h / 2) * UNIT,
                      room.height + (lifted ? 26 : 0),
                      mapSize.w * UNIT,
                      mapSize.h * UNIT,
                    );
                    return (
                      <div
                        key={room.id}
                        className="absolute"
                        style={{ left: p.x, top: p.y, transition: "top 300ms" }}
                      >
                        {(isHover || isSelected) && (
                          <span
                            className={`absolute top-0 left-0 block max-w-[11rem] -translate-x-1/2 -translate-y-1/2 truncate rounded-md border px-2 py-0.5 text-center text-[12px] leading-tight font-bold tracking-tight shadow-sm transition-colors ${
                              lifted
                                ? "border-navy bg-navy text-primary-foreground"
                                : "border-border/70 bg-card/95 text-navy"
                            }`}
                          >
                            {room.name}
                          </span>
                        )}

                        {Icon && (
                          <span
                            className="absolute top-0 left-0 flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-2 shadow-[var(--shadow-elevated)]"
                            style={{
                              background: color,
                              borderColor: "var(--card)",
                              transform: `translate(-50%, ${lifted ? -68 : -52}px)`,
                              transition: "transform 300ms",
                            }}
                          >
                            <Icon className="size-5 text-primary-foreground" />
                          </span>
                        )}

                        {isHover && (
                          <div
                            className="animate-in absolute top-0 left-0 w-max -translate-x-1/2 rounded-lg bg-[image:var(--gradient-gold)] px-3 py-1.5 text-center shadow-[var(--shadow-elevated)] duration-200 fade-in zoom-in-95"
                            style={{ transform: "translate(-50%, -140px)" }}
                          >
                            <p className="text-sm font-black text-accent-foreground">{room.name}</p>
                            <p className="text-[10px] font-semibold text-accent-foreground/75">
                              {opt?.label ?? (isStair ? "Circulación" : "Recinto")} · clic para ver
                              más
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      <Dialog
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selected?.name}</DialogTitle>
            <DialogDescription>
              {selected?.floor === -1 ? "Piso -1" : `Piso ${selected?.floor}`} ·{" "}
              {getIcon(selected?.marker)?.label ??
                (selected?.kind === "escalera" ? "Circulación vertical" : "Recinto")}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <>
              <img
                src={selected.photo}
                alt={`Interior de ${selected.name}`}
                width={1024}
                height={640}
                loading="lazy"
                className="w-full rounded-xl border border-border object-cover"
              />
              {selected.descripcion && (
                <p className="text-sm text-muted-foreground">{selected.descripcion}</p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
