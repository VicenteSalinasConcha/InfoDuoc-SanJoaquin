// ============================================================================
// ARCHIVO: src/lib/infoduoc-store.tsx  —  CEREBRO DE LA APLICACIÓN
// ----------------------------------------------------------------------------
// ¿Qué hace? Es el "almacén central" de TODOS los datos: salas del mapa,
// escuelas, equipos de sede, personas, administradores y tamaño del mapa.
// Lee y guarda en la base de datos (Lovable Cloud) en tiempo real.
//
// ¿Cómo editar datos por defecto?
//   - FLOORS: lista de pisos del edificio (-1 al 8).
//   - roomPhotos / groupImages: fotos de respaldo cuando una sala o escuela
//     no tiene foto subida (usan las imágenes de src/assets).
//   - DEFAULT_MAP_SIZE: tamaño inicial del plano en "unidades" (u).
//
// Cada función (updateRoom, addEscuela, etc.) hace 2 cosas:
//   1) Actualiza la pantalla al instante (estado local).
//   2) Guarda el cambio en la base de datos (Supabase/Lovable Cloud).
// ============================================================================
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import salaLab from "@/assets/sala-lab.jpg";
import salaClase from "@/assets/sala-clase.jpg";
import salaBiblioteca from "@/assets/sala-biblioteca.jpg";
import escuelaInformatica from "@/assets/escuela-informatica.jpg";
import escuelaIngenieria from "@/assets/escuela-ingenieria.jpg";
import escuelaAdministracion from "@/assets/escuela-administracion.jpg";
import { supabase } from "@/integrations/supabase/client";
import {
  createAdminAccount,
  deleteAdminAccount,
  ensureOwner,
  updateAdminAccount,
} from "@/lib/admin.functions";
import { InfoDuocContext } from "@/lib/infoduoc-context";

export { useInfoDuoc } from "@/lib/infoduoc-context";

export type RoomKind = "sala" | "escalera" | "servicio";
/** Clave de ícono: ver ROOM_ICONS en @/lib/room-icons */
export type MarkerKind = string;

export type Room = {
  id: string;
  floor: number;
  name: string;
  photo: string;
  kind: RoomKind;
  marker: MarkerKind;
  color?: string | undefined;
  descripcion?: string | undefined;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  height: number;
};

export type AdminProfile = {
  email: string;
  password: string;
  foto?: string | undefined;
  nombre: string;
};

export type AdminRole = "superadmin" | "editor";

export type AdminAccount = {
  id: string;
  nombre: string;
  email: string;
  password: string;
  rol: AdminRole;
};

export type Persona = {
  id: string;
  nombre: string;
  cargo: string;
  email: string;
  descripcion?: string;
  foto?: string;
};


export type Escuela = {
  id: string;
  nombre: string;
  imagen: string;
  descripcion: string;
  equipo: Persona[];
};

export type EquipoSede = {
  id: string;
  nombre: string;
  descripcion: string;
  imagen: string;
  miembros: Persona[];
};

export const FLOORS = [-1, 1, 2, 3, 4, 5, 6, 7, 8];

const roomPhotos = [salaClase, salaLab, salaBiblioteca];
const groupImages = [escuelaInformatica, escuelaIngenieria, escuelaAdministracion];

const roomPhoto = (photo: string | null, index: number) =>
  photo ?? roomPhotos[index % roomPhotos.length] ?? salaClase;
const groupImage = (imagen: string | null, index: number) =>
  imagen ?? groupImages[index % groupImages.length] ?? escuelaInformatica;

export type MapSize = { w: number; h: number };

type Data = {
  rooms: Room[];
  escuelas: Escuela[];
  equipos: EquipoSede[];
  mapSize?: MapSize;
  profile?: AdminProfile;
  admins?: AdminAccount[];
};

export const DEFAULT_MAP_SIZE: MapSize = { w: 8, h: 6.4 };

export const DEFAULT_PROFILE: AdminProfile = {
  nombre: "Vicente Salinas Concha",
  email: "vicentesalinasconcha@gmail.com",
  password: "",
};

export type InfoDuocContextValue = {
  data: Data;
  /** true mientras se cargan los datos desde la base de datos */
  loading: boolean;
  isAdmin: boolean;
  /** Solo el dueño (superadmin) puede gestionar cuentas y roles */
  isOwner: boolean;
  currentAdmin: AdminAccount | null;
  admins: AdminAccount[];
  addAdmin: (a: Omit<AdminAccount, "id">) => Promise<boolean>;
  updateAdmin: (id: string, patch: Partial<AdminAccount>) => void;
  deleteAdmin: (id: string) => void;
  login: (user: string, pass: string) => Promise<boolean>;
  logout: () => void;
  profile: AdminProfile;
  updateProfile: (patch: Partial<AdminProfile>) => void;
  mapSize: MapSize;
  updateMapSize: (patch: Partial<MapSize>) => void;
  updateRoom: (id: string, patch: Partial<Room>) => void;
  updateEscuela: (id: string, patch: Partial<Escuela>) => void;
  updatePersona: (
    group: "escuelas" | "equipos",
    groupId: string,
    personaId: string,
    patch: Partial<Persona>,
  ) => void;
  updateEquipo: (id: string, patch: Partial<EquipoSede>) => void;
  addRoom: (floor: number) => void;
  deleteRoom: (id: string) => void;
  addEscuela: () => void;
  deleteEscuela: (id: string) => void;
  addEquipo: () => void;
  deleteEquipo: (id: string) => void;
  addPersona: (group: "escuelas" | "equipos", groupId: string) => void;
  deletePersona: (group: "escuelas" | "equipos", groupId: string, personaId: string) => void;
  reset: () => void;
  /** Recarga los datos desde la base de datos */
  reload: () => void;
  /** Vuelve a leer la base de datos (los cambios ya se guardan al instante) */
  save: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);

const emptyData = (): Data => ({
  rooms: [],
  escuelas: [],
  equipos: [],
  mapSize: { ...DEFAULT_MAP_SIZE },
  profile: { ...DEFAULT_PROFILE },
  admins: [],
});

export function InfoDuocProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(emptyData);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState<AdminAccount | null>(null);
  const isAdmin = currentAdmin !== null;
  const dataRef = useRef(data);
  dataRef.current = data;

  const loadAll = useCallback(async () => {
    const [rooms, escuelas, equipos, personas, settings] = await Promise.all([
      supabase.from("rooms").select("*").order("floor").order("id"),
      supabase.from("escuelas").select("*").order("orden"),
      supabase.from("equipos").select("*").order("orden"),
      supabase.from("personas").select("*").order("orden"),
      supabase.from("app_settings").select("*").eq("id", 1).maybeSingle(),
    ]);

    const people = personas.data ?? [];
    const toPersona = (r: (typeof people)[number]): Persona => ({
      id: r.id,
      nombre: r.nombre,
      cargo: r.cargo,
      email: r.email,
      descripcion: (r as { descripcion?: string | null }).descripcion ?? "",
      ...(r.foto ? { foto: r.foto } : {}),
    });


    setData((prev) => ({
      ...prev,
      rooms: (rooms.data ?? []).map((r) => ({
        id: r.id,
        floor: Number(r.floor),
        name: r.name,
        photo: roomPhoto(r.photo, Number(r.photo_index)),
        kind: r.kind as RoomKind,
        marker: r.marker,
        color: r.color ?? undefined,
        descripcion: r.descripcion ?? undefined,
        x: Number(r.x),
        y: Number(r.y),
        w: Number(r.w),
        h: Number(r.h),
        rot: Number(r.rot),
        height: Number(r.height),
      })),
      escuelas: (escuelas.data ?? []).map((e) => ({
        id: e.id,
        nombre: e.nombre,
        descripcion: e.descripcion,
        imagen: groupImage(e.imagen, Number(e.imagen_index)),
        equipo: people.filter((p) => p.grupo === "escuelas" && p.grupo_id === e.id).map(toPersona),
      })),
      equipos: (equipos.data ?? []).map((e) => ({
        id: e.id,
        nombre: e.nombre,
        descripcion: e.descripcion,
        imagen: groupImage(e.imagen, Number(e.imagen_index)),
        miembros: people.filter((p) => p.grupo === "equipos" && p.grupo_id === e.id).map(toPersona),
      })),
      mapSize: settings.data
        ? { w: Number(settings.data.map_w), h: Number(settings.data.map_h) }
        : { ...DEFAULT_MAP_SIZE },
    }));
    setLoading(false);
  }, []);

  const loadAdmins = useCallback(async () => {
    const { data: rows } = await supabase.from("admin_accounts").select("*").order("created_at");
    if (!rows) return;
    setData((prev) => ({
      ...prev,
      admins: rows
        .filter((r) => !r.is_owner)
        .map((r) => ({
          id: r.id,
          nombre: r.nombre,
          email: r.email,
          password: "",
          rol: r.rol as AdminRole,
        })),
      profile: (() => {
        const owner = rows.find((r) => r.is_owner);
        return owner
          ? {
              nombre: owner.nombre,
              email: owner.email,
              password: "",
              foto: owner.foto ?? undefined,
            }
          : (prev.profile ?? { ...DEFAULT_PROFILE });
      })(),
    }));
  }, []);

  const applySession = useCallback(
    async (userId: string | undefined) => {
      if (!userId) {
        setCurrentAdmin(null);
        return;
      }
      const { data: row } = await supabase
        .from("admin_accounts")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!row) {
        setCurrentAdmin(null);
        return;
      }
      setCurrentAdmin({
        id: row.id,
        nombre: row.nombre,
        email: row.email,
        password: "",
        rol: row.rol as AdminRole,
      });
      void loadAdmins();
    },
    [loadAdmins],
  );

  useEffect(() => {
    void loadAll();
    void supabase.auth.getSession().then(({ data: s }) => applySession(s.session?.user.id));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void applySession(session?.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadAll, applySession]);

  /** Actualiza el estado local al instante y guarda en la base de datos */
  const push = useCallback(
    (next: Data, write: () => PromiseLike<unknown>) => {
      setData(next);
      void (async () => {
        try {
          await write();
        } catch {
          /* ignore */
        }
      })();
    },
    [],
  );

  const value = useMemo<InfoDuocContextValue>(() => {
    const d = data;
    const profile = d.profile ?? DEFAULT_PROFILE;

    const roomColumns = (patch: Partial<Room>) => {
      const cols: Record<string, unknown> = {};
      (["name", "kind", "marker", "x", "y", "w", "h", "rot", "height", "photo"] as const).forEach(
        (k) => {
          if (patch[k] !== undefined) cols[k] = patch[k];
        },
      );
      if (patch.color !== undefined) cols['color'] = patch.color ?? null;
      if (patch.descripcion !== undefined) cols['descripcion'] = patch.descripcion ?? null;
      return cols;
    };

    return {
      data: d,
      loading,
      isAdmin,
      currentAdmin,
      isOwner: currentAdmin?.rol === "superadmin",
      admins: d.admins ?? [],

      addAdmin: async (a) => {
        try {
          const res = await createAdminAccount({
            data: { nombre: a.nombre, email: a.email, password: a.password, rol: a.rol },
          });
          if (!res.ok) return false;
          await loadAdmins();
          return true;
        } catch {
          return false;
        }
      },
      updateAdmin: (id, patch) => {
        setData((prev) => ({
          ...prev,
          admins: (prev.admins ?? []).map((x) => (x.id === id ? { ...x, ...patch } : x)),
        }));
        void updateAdminAccount({
          data: {
            id,
            ...(patch.nombre !== undefined ? { nombre: patch.nombre } : {}),
            ...(patch.rol !== undefined ? { rol: patch.rol } : {}),
            ...(patch.password ? { password: patch.password } : {}),
          },
        });
      },
      deleteAdmin: (id) => {
        setData((prev) => ({ ...prev, admins: (prev.admins ?? []).filter((x) => x.id !== id) }));
        void deleteAdminAccount({ data: { id } }).then(() => loadAdmins());
      },

      login: async (user, pass) => {
        const email = user.trim().toLowerCase();
        try {
          await ensureOwner();
        } catch {
          /* ignore */
        }
        const { data: signIn, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });
        if (error || !signIn.user) return false;
        const { data: row } = await supabase
          .from("admin_accounts")
          .select("*")
          .eq("id", signIn.user.id)
          .maybeSingle();
        if (!row) {
          await supabase.auth.signOut();
          return false;
        }
        setCurrentAdmin({
          id: row.id,
          nombre: row.nombre,
          email: row.email,
          password: "",
          rol: row.rol as AdminRole,
        });
        void loadAdmins();
        return true;
      },
      logout: () => {
        setCurrentAdmin(null);
        void supabase.auth.signOut();
      },

      profile,
      updateProfile: (patch) => {
        const nextProfile = { ...profile, ...patch };
        setData((prev) => ({ ...prev, profile: nextProfile }));
        void (async () => {
          if (currentAdmin) {
            const cols: Record<string, unknown> = {};
            if (patch.nombre !== undefined) cols['nombre'] = patch.nombre;
            if (patch.foto !== undefined) cols['foto'] = patch.foto ?? null;
            if (Object.keys(cols).length > 0) {
              await supabase.from("admin_accounts").update(cols as never).eq("id", currentAdmin.id);
            }
            const auth: { email?: string; password?: string } = {};
            if (patch.email && patch.email !== currentAdmin.email) auth.email = patch.email;
            if (patch.password) auth.password = patch.password;
            if (Object.keys(auth).length > 0) await supabase.auth.updateUser(auth);
            if (patch.email && patch.email !== currentAdmin.email) {
              await supabase
                .from("admin_accounts")
                .update({ email: patch.email })
                .eq("id", currentAdmin.id);
            }
          }
          await loadAdmins();
        })();
      },

      mapSize: d.mapSize ?? DEFAULT_MAP_SIZE,
      updateMapSize: (patch) => {
        const next = { ...(d.mapSize ?? DEFAULT_MAP_SIZE), ...patch };
        push({ ...d, mapSize: next }, () =>
          supabase.from("app_settings").upsert({ id: 1, map_w: next.w, map_h: next.h }),
        );
      },

      updateRoom: (id, patch) =>
        push({ ...d, rooms: d.rooms.map((r) => (r.id === id ? { ...r, ...patch } : r)) }, () =>
          supabase.from("rooms").update(roomColumns(patch) as never).eq("id", id),
        ),
      addRoom: (floor) => {
        const room: Room = {
          id: `${floor}-${uid()}`,
          floor,
          name: "Nueva sala",
          photo: roomPhotos[0] ?? salaClase,
          kind: "sala",
          marker: "none",
          x: 0.5,
          y: 0.5,
          w: 2,
          h: 1.6,
          rot: 0,
          height: 34,
        };
        push({ ...d, rooms: [...d.rooms, room] }, () =>
          supabase.from("rooms").insert({
            id: room.id,
            floor,
            name: room.name,
            kind: room.kind,
            marker: room.marker,
            x: room.x,
            y: room.y,
            w: room.w,
            h: room.h,
            rot: 0,
            height: room.height,
            photo_index: 0,
          }),
        );
      },
      deleteRoom: (id) =>
        push({ ...d, rooms: d.rooms.filter((r) => r.id !== id) }, () =>
          supabase.from("rooms").delete().eq("id", id),
        ),

      updateEscuela: (id, patch) =>
        push(
          { ...d, escuelas: d.escuelas.map((e) => (e.id === id ? { ...e, ...patch } : e)) },
          () => {
            const cols: Record<string, unknown> = {};
            if (patch.nombre !== undefined) cols['nombre'] = patch.nombre;
            if (patch.descripcion !== undefined) cols['descripcion'] = patch.descripcion;
            if (patch.imagen !== undefined) cols['imagen'] = patch.imagen;
            return supabase.from("escuelas").update(cols as never).eq("id", id);
          },
        ),
      addEscuela: () => {
        const id = uid();
        push(
          {
            ...d,
            escuelas: [
              ...d.escuelas,
              {
                id,
                nombre: "Nueva escuela",
                imagen: escuelaInformatica,
                descripcion: "Descripción de la escuela.",
                equipo: [],
              },
            ],
          },
          () =>
            supabase.from("escuelas").insert({
              id,
              nombre: "Nueva escuela",
              descripcion: "Descripción de la escuela.",
              imagen_index: 0,
              orden: d.escuelas.length,
            }),
        );
      },
      deleteEscuela: (id) =>
        push({ ...d, escuelas: d.escuelas.filter((e) => e.id !== id) }, async () => {
          await supabase.from("personas").delete().eq("grupo", "escuelas").eq("grupo_id", id);
          await supabase.from("escuelas").delete().eq("id", id);
        }),

      updateEquipo: (id, patch) =>
        push({ ...d, equipos: d.equipos.map((e) => (e.id === id ? { ...e, ...patch } : e)) }, () => {
          const cols: Record<string, unknown> = {};
          if (patch.nombre !== undefined) cols['nombre'] = patch.nombre;
          if (patch.descripcion !== undefined) cols['descripcion'] = patch.descripcion;
          if (patch.imagen !== undefined) cols['imagen'] = patch.imagen;
          return supabase.from("equipos").update(cols as never).eq("id", id);
        }),
      addEquipo: () => {
        const id = uid();
        push(
          {
            ...d,
            equipos: [
              ...d.equipos,
              {
                id,
                nombre: "Nuevo equipo",
                descripcion: "Descripción del equipo.",
                imagen: escuelaAdministracion,
                miembros: [],
              },
            ],
          },
          () =>
            supabase.from("equipos").insert({
              id,
              nombre: "Nuevo equipo",
              descripcion: "Descripción del equipo.",
              imagen_index: 2,
              orden: d.equipos.length,
            }),
        );
      },
      deleteEquipo: (id) =>
        push({ ...d, equipos: d.equipos.filter((e) => e.id !== id) }, async () => {
          await supabase.from("personas").delete().eq("grupo", "equipos").eq("grupo_id", id);
          await supabase.from("equipos").delete().eq("id", id);
        }),

      updatePersona: (group, groupId, personaId, patch) => {
        const next: Data =
          group === "escuelas"
            ? {
                ...d,
                escuelas: d.escuelas.map((e) =>
                  e.id === groupId
                    ? {
                        ...e,
                        equipo: e.equipo.map((m) => (m.id === personaId ? { ...m, ...patch } : m)),
                      }
                    : e,
                ),
              }
            : {
                ...d,
                equipos: d.equipos.map((e) =>
                  e.id === groupId
                    ? {
                        ...e,
                        miembros: e.miembros.map((m) =>
                          m.id === personaId ? { ...m, ...patch } : m,
                        ),
                      }
                    : e,
                ),
              };
        push(next, () => {
          const cols: Record<string, unknown> = {};
          if (patch.nombre !== undefined) cols['nombre'] = patch.nombre;
          if (patch.cargo !== undefined) cols['cargo'] = patch.cargo;
          if (patch.email !== undefined) cols['email'] = patch.email;
          if (patch.descripcion !== undefined) cols['descripcion'] = patch.descripcion ?? "";

          if (patch.foto !== undefined) cols['foto'] = patch.foto ?? null;
          return supabase.from("personas").update(cols as never).eq("id", personaId);
        });
      },
      addPersona: (group, groupId) => {
        const nueva: Persona = {
          id: uid(),
          nombre: "Nombre y apellido",
          cargo: "Cargo",
          email: "correo@duocuc.cl",
        };
        const next: Data =
          group === "escuelas"
            ? {
                ...d,
                escuelas: d.escuelas.map((e) =>
                  e.id === groupId ? { ...e, equipo: [...e.equipo, nueva] } : e,
                ),
              }
            : {
                ...d,
                equipos: d.equipos.map((e) =>
                  e.id === groupId ? { ...e, miembros: [...e.miembros, nueva] } : e,
                ),
              };
        push(next, () =>
          supabase.from("personas").insert({
            id: nueva.id,
            grupo: group,
            grupo_id: groupId,
            nombre: nueva.nombre,
            cargo: nueva.cargo,
            email: nueva.email,
            orden: 99,
          }),
        );
      },
      deletePersona: (group, groupId, personaId) => {
        const next: Data =
          group === "escuelas"
            ? {
                ...d,
                escuelas: d.escuelas.map((e) =>
                  e.id === groupId
                    ? { ...e, equipo: e.equipo.filter((m) => m.id !== personaId) }
                    : e,
                ),
              }
            : {
                ...d,
                equipos: d.equipos.map((e) =>
                  e.id === groupId
                    ? { ...e, miembros: e.miembros.filter((m) => m.id !== personaId) }
                    : e,
                ),
              };
        push(next, () => supabase.from("personas").delete().eq("id", personaId));
      },

      reset: () => void loadAll(),
      reload: () => void loadAll(),
      save: () => void loadAll(),
    };
  }, [data, loading, currentAdmin, isAdmin, push, loadAll, loadAdmins]);

  return <InfoDuocContext.Provider value={value}>{children}</InfoDuocContext.Provider>;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function initials(nombre: string) {
  return nombre
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}
