// ============================================================================
// ARCHIVO: src/routes/admin.tsx  —  PANEL DE ADMINISTRACIÓN
// ----------------------------------------------------------------------------
// Solo visible tras iniciar sesión (clic en el título "InfoDuoc" del menú).
// Pestañas:
//   - "Editor de pisos": plano 2D para mover/redimensionar/girar bloques,
//     sliders de tamaño del mapa (4 a 25 u) y panel del bloque seleccionado
//     (nombre, descripción, tipo, ícono, color, altura 3D, rotación y foto).
//   - "Salas del mapa": lista por piso para editar nombre y foto.
//   - "Escuelas" y "Equipo de Sede": nombre, descripción, imagen y personas
//     (nombre, cargo, correo, descripción y foto de perfil).
//   - "Administradores": solo el dueño (superadmin) crea/edita cuentas.
// Todo se guarda automáticamente en la base de datos al editar.
// ============================================================================
import { createFileRoute } from "@tanstack/react-router";
import { Plus, RotateCcw, Save, Trash2, Upload, UserCog } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminAccounts } from "@/components/AdminAccounts";
import { AdminProfileDialog } from "@/components/AdminProfileDialog";
import { EditorHint, FloorEditor } from "@/components/FloorEditor";
import { IconPicker } from "@/components/IconPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { FLOORS, fileToDataUrl, useInfoDuoc, type RoomKind } from "@/lib/infoduoc-store";


export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de Administración — InfoDuoc San Joaquín" },
      {
        name: "description",
        content:
          "Edita el plano por pisos, nombres y fotos de salas, y la información de escuelas y equipos de la sede.",
      },
      { property: "og:title", content: "Panel de Administración — InfoDuoc" },
      {
        property: "og:description",
        content: "Editor de pisos y administración de salas, escuelas y equipos de San Joaquín.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const KINDS: RoomKind[] = ["sala", "escalera", "servicio"];


function ImageUpload({ onFile, label }: { onFile: (dataUrl: string) => void; label: string }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary">
      <Upload className="size-4" />
      {label}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onFile(await fileToDataUrl(file));
          toast.success("Imagen actualizada");
          e.target.value = "";
        }}
      />
    </label>
  );
}

function AdminPage() {
  const {
    isAdmin,
    isOwner,
    data,
    updateRoom,
    updateEscuela,
    updateEquipo,
    updatePersona,
    addRoom,
    deleteRoom,
    addEscuela,
    deleteEscuela,
    addEquipo,
    deleteEquipo,
    addPersona,
    deletePersona,
    reset,
    mapSize,
    updateMapSize,
    save,
  } = useInfoDuoc();
  const [floor, setFloor] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-10">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold text-foreground">Acceso restringido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Inicia sesión haciendo clic en el título “InfoDuoc” del menú lateral.
          </p>
        </div>
      </div>
    );
  }

  const rooms = data.rooms.filter((r) => r.floor === floor);
  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground">Panel de Administración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Los cambios se guardan automáticamente en la base de datos simulada.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isOwner && (
            <AdminProfileDialog
              trigger={
                <Button variant="secondary" className="gap-2">
                  <UserCog className="size-4" /> Editar perfil de administrador
                </Button>
              }
            />
          )}
          <Button
            onClick={() => {
              save();
              toast.success("Cambios guardados — el mapa ya está actualizado");
            }}
            className="gap-2 bg-[image:var(--gradient-gold)] font-bold text-accent-foreground hover:opacity-90"
          >
            <Save className="size-4" /> Guardar cambios
          </Button>
          <Button variant="outline" onClick={reset} className="gap-2">
            <RotateCcw className="size-4" /> Restaurar datos
          </Button>
        </div>

      </div>

      <Tabs defaultValue="pisos" className="mt-8">
        <TabsList className="flex w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="pisos">Editor de pisos</TabsTrigger>
          <TabsTrigger value="salas">Salas del mapa</TabsTrigger>
          <TabsTrigger value="escuelas">Escuelas</TabsTrigger>
          <TabsTrigger value="equipos">Equipo de Sede</TabsTrigger>
          {isOwner && <TabsTrigger value="admins">Administradores</TabsTrigger>}
        </TabsList>

        <TabsContent value="pisos" className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {FLOORS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFloor(f);
                  setSelectedId(null);
                }}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                  f === floor
                    ? "bg-navy text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-muted"
                }`}
              >
                {f === -1 ? "Piso -1" : `Piso ${f}`}
              </button>
            ))}
          </div>

          <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Ancho del mapa: {mapSize.w.toFixed(1)} u</Label>
              <Slider
                min={4}
                max={25}
                step={0.5}
                value={[mapSize.w]}
                onValueChange={([v]) => updateMapSize({ w: v ?? mapSize.w })}
              />
            </div>
            <div className="space-y-2">
              <Label>Largo del mapa: {mapSize.h.toFixed(1)} u</Label>
              <Slider
                min={4}
                max={25}
                step={0.5}
                value={[mapSize.h]}
                onValueChange={([v]) => updateMapSize({ h: v ?? mapSize.h })}
              />
            </div>
          </div>

          <EditorHint
            onAdd={() => {
              addRoom(floor);
              toast.success("Bloque agregado");
            }}
          />

          <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <FloorEditor
              rooms={rooms}
              gridW={mapSize.w}
              gridH={mapSize.h}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onChange={updateRoom}
              onDelete={(id) => {
                deleteRoom(id);
                setSelectedId(null);
                toast.success("Bloque eliminado");
              }}
            />

            <div className="sticky top-4 max-h-[calc(100vh-2rem)] space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-5">
              {!selected ? (
                <p className="text-sm text-muted-foreground">
                  Selecciona un bloque del plano para editar su nombre, tipo, ícono, altura y
                  fotografía.
                </p>
              ) : (
                <>
                  <h2 className="text-lg font-bold text-foreground">Bloque seleccionado</h2>
                  <div className="space-y-2">
                    <Label htmlFor="sel-name">Nombre</Label>
                    <Input
                      id="sel-name"
                      value={selected.name}
                      onChange={(e) => updateRoom(selected.id, { name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sel-desc">Información de la sala</Label>
                    <Textarea
                      id="sel-desc"
                      rows={3}
                      placeholder="Descripción que verán los estudiantes al presionar la sala."
                      value={selected.descripcion ?? ""}
                      onChange={(e) => updateRoom(selected.id, { descripcion: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Tipo de recinto</Label>
                      <Select
                        value={selected.kind}
                        onValueChange={(v) => updateRoom(selected.id, { kind: v as RoomKind })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {KINDS.map((k) => (
                            <SelectItem key={k} value={k}>
                              {k}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <IconPicker
                    value={selected.marker}
                    color={selected.color}
                    onChange={(marker) => updateRoom(selected.id, { marker })}
                    onColor={(color) => updateRoom(selected.id, { color })}
                  />

                  <div className="grid gap-4 sm:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="sel-w">Ancho</Label>
                      <Input
                        id="sel-w"
                        type="number"
                        step="0.1"
                        value={selected.w}
                        onChange={(e) => updateRoom(selected.id, { w: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sel-h">Largo</Label>
                      <Input
                        id="sel-h"
                        type="number"
                        step="0.1"
                        value={selected.h}
                        onChange={(e) => updateRoom(selected.id, { h: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Altura 3D: {selected.height}px</Label>
                      <Slider
                        min={10}
                        max={80}
                        step={2}
                        value={[selected.height]}
                        onValueChange={([v]) =>
                          updateRoom(selected.id, { height: v ?? selected.height })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rotación: {selected.rot ?? 0}°</Label>
                      <Slider
                        min={0}
                        max={359}
                        step={1}
                        value={[selected.rot ?? 0]}
                        onValueChange={([v]) => updateRoom(selected.id, { rot: v ?? 0 })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={selected.photo}
                      alt={selected.name}
                      loading="lazy"
                      className="h-20 w-28 rounded-lg object-cover"
                    />
                    <ImageUpload
                      label="Cambiar foto"
                      onFile={(photo) => updateRoom(selected.id, { photo })}
                    />
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => {
                        deleteRoom(selected.id);
                        setSelectedId(null);
                      }}
                    >
                      <Trash2 className="size-4" /> Eliminar bloque
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="salas" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {FLOORS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFloor(f)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                    f === floor
                      ? "bg-navy text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-muted"
                  }`}
                >
                  {f === -1 ? "Piso -1" : `Piso ${f}`}
                </button>
              ))}
            </div>
            <Button className="gap-2" onClick={() => addRoom(floor)}>
              <Plus className="size-4" /> Agregar sala
            </Button>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex gap-4 rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-elevated)]"
              >
                <img
                  src={room.photo}
                  alt={room.name}
                  loading="lazy"
                  className="size-24 shrink-0 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`room-${room.id}`}>Nombre de la sala</Label>
                  <Input
                    id={`room-${room.id}`}
                    value={room.name}
                    onChange={(e) => updateRoom(room.id, { name: e.target.value })}
                  />
                  <div className="flex flex-wrap gap-2">
                    <ImageUpload
                      label="Subir foto"
                      onFile={(photo) => updateRoom(room.id, { photo })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Eliminar ${room.name}`}
                      onClick={() => deleteRoom(room.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="escuelas" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={addEscuela}>
              <Plus className="size-4" /> Agregar escuela
            </Button>
          </div>
          {data.escuelas.map((escuela) => (
            <div key={escuela.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap gap-6">
                <img
                  src={escuela.imagen}
                  alt={escuela.nombre}
                  loading="lazy"
                  className="h-28 w-44 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Nombre de la escuela</Label>
                    <Input
                      value={escuela.nombre}
                      onChange={(e) => updateEscuela(escuela.id, { nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={escuela.descripcion}
                      onChange={(e) => updateEscuela(escuela.id, { descripcion: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ImageUpload
                      label="Cambiar imagen de tarjeta"
                      onFile={(imagen) => updateEscuela(escuela.id, { imagen })}
                    />
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => deleteEscuela(escuela.id)}
                    >
                      <Trash2 className="size-4" /> Eliminar escuela
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {escuela.equipo.map((m) => (
                  <div key={m.id} className="space-y-2 rounded-lg border border-border p-4">
                    <Input
                      value={m.nombre}
                      onChange={(e) =>
                        updatePersona("escuelas", escuela.id, m.id, { nombre: e.target.value })
                      }
                      placeholder="Nombre"
                    />
                    <Input
                      value={m.cargo}
                      onChange={(e) =>
                        updatePersona("escuelas", escuela.id, m.id, { cargo: e.target.value })
                      }
                      placeholder="Cargo"
                    />
                    <Input
                      value={m.email}
                      onChange={(e) =>
                        updatePersona("escuelas", escuela.id, m.id, { email: e.target.value })
                      }
                      placeholder="Correo (opcional)"
                    />
                    <Textarea
                      value={m.descripcion ?? ""}
                      onChange={(e) =>
                        updatePersona("escuelas", escuela.id, m.id, { descripcion: e.target.value })
                      }
                      placeholder="Descripción (opcional)"
                      rows={2}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {m.foto ? (
                        <img
                          src={m.foto}
                          alt={m.nombre}
                          className="size-16 shrink-0 rounded-full border-2 border-accent object-cover"
                        />
                      ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground">
                          Sin foto
                        </div>
                      )}
                      <ImageUpload
                        label="Foto de perfil"
                        onFile={(foto) => updatePersona("escuelas", escuela.id, m.id, { foto })}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${m.nombre}`}
                        onClick={() => deletePersona("escuelas", escuela.id, m.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="h-full min-h-24 gap-2"
                  onClick={() => addPersona("escuelas", escuela.id)}
                >
                  <Plus className="size-4" /> Agregar persona
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="equipos" className="mt-6 space-y-6">
          <div className="flex justify-end">
            <Button className="gap-2" onClick={addEquipo}>
              <Plus className="size-4" /> Agregar equipo
            </Button>
          </div>
          {data.equipos.map((equipo) => (
            <div key={equipo.id} className="rounded-xl border border-border bg-card p-6">
              <div className="flex flex-wrap gap-6">
                <img
                  src={equipo.imagen}
                  alt={equipo.nombre}
                  loading="lazy"
                  className="h-28 w-44 rounded-lg object-cover"
                />
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label>Nombre del equipo</Label>
                    <Input
                      value={equipo.nombre}
                      onChange={(e) => updateEquipo(equipo.id, { nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Input
                      value={equipo.descripcion}
                      onChange={(e) => updateEquipo(equipo.id, { descripcion: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <ImageUpload
                      label="Cambiar imagen de tarjeta"
                      onFile={(imagen) => updateEquipo(equipo.id, { imagen })}
                    />
                    <Button
                      variant="destructive"
                      className="gap-2"
                      onClick={() => deleteEquipo(equipo.id)}
                    >
                      <Trash2 className="size-4" /> Eliminar equipo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {equipo.miembros.map((m) => (
                  <div key={m.id} className="space-y-2 rounded-lg border border-border p-4">
                    <Input
                      value={m.nombre}
                      onChange={(e) =>
                        updatePersona("equipos", equipo.id, m.id, { nombre: e.target.value })
                      }
                      placeholder="Nombre"
                    />
                    <Input
                      value={m.cargo}
                      onChange={(e) =>
                        updatePersona("equipos", equipo.id, m.id, { cargo: e.target.value })
                      }
                      placeholder="Cargo"
                    />
                    <Input
                      value={m.email}
                      onChange={(e) =>
                        updatePersona("equipos", equipo.id, m.id, { email: e.target.value })
                      }
                      placeholder="Correo (opcional)"
                    />
                    <Textarea
                      value={m.descripcion ?? ""}
                      onChange={(e) =>
                        updatePersona("equipos", equipo.id, m.id, { descripcion: e.target.value })
                      }
                      placeholder="Descripción (opcional)"
                      rows={2}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {m.foto ? (
                        <img
                          src={m.foto}
                          alt={m.nombre}
                          className="size-16 shrink-0 rounded-full border-2 border-accent object-cover"
                        />
                      ) : (
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-border text-xs text-muted-foreground">
                          Sin foto
                        </div>
                      )}
                      <ImageUpload
                        label="Foto de perfil"
                        onFile={(foto) => updatePersona("equipos", equipo.id, m.id, { foto })}
                      />

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Eliminar ${m.nombre}`}
                        onClick={() => deletePersona("equipos", equipo.id, m.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="h-full min-h-24 gap-2"
                  onClick={() => addPersona("equipos", equipo.id)}
                >
                  <Plus className="size-4" /> Agregar persona
                </Button>
              </div>
            </div>
          ))}
        </TabsContent>

        {isOwner && (
          <TabsContent value="admins" className="mt-6">
            <AdminAccounts />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
