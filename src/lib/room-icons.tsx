// ============================================================================
// ARCHIVO: src/lib/room-icons.tsx  —  CATÁLOGO DE ÍCONOS DE SALAS
// ----------------------------------------------------------------------------
// Lista de íconos disponibles para cada sala (baños, escaleras, laboratorios,
// cancha de bienestar, sala de seguridad, etc.), agrupados por categoría.
// Cada ícono puede tener un color por defecto (ej. baños azules, escaleras
// rojas). Para agregar uno nuevo: importa el ícono de "lucide-react" y súmelo
// al arreglo ROOM_ICONS con su clave, etiqueta y color.
// ============================================================================
import {
  Accessibility,
  ArrowUpDown,
  Baby,
  BadgeCheck,
  Banknote,
  Bath,
  Beaker,
  Bike,
  BookOpen,
  Briefcase,
  Bus,
  Cable,
  Calculator,
  Camera,
  Car,
  Church,
  Goal,
  ClipboardList,
  Coffee,
  Computer,
  Cpu,
  Croissant,
  Dumbbell,
  FireExtinguisher,
  FlaskConical,
  Footprints,
  GraduationCap,
  HeartPulse,
  Info,
  Laptop,
  Library,
  MapPin,
  Megaphone,
  MonitorPlay,
  MoveVertical,
  Music,
  Printer,
  Projector,
  Recycle,
  Server,
  ShieldCheck,
  ShoppingBag,
  ShowerHead,
  Sofa,
  Toilet,
  Mars,
  Venus,
  PersonStanding,
  Volleyball,
  Stethoscope,
  Trees,
  TriangleAlert,
  Users,
  Utensils,
  Wifi,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type IconOption = {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Token CSS por defecto para este tipo de ícono */
  color: string;
  group: string;
};

/** Paleta de colores disponibles para los marcadores */
export const MARKER_COLORS: Array<{ key: string; label: string; value: string }> = [
  { key: "navy", label: "Azul institucional", value: "oklch(0.38 0.12 262)" },
  { key: "blue", label: "Azul claro", value: "oklch(0.6 0.16 250)" },
  { key: "cyan", label: "Celeste", value: "oklch(0.68 0.12 220)" },
  { key: "red", label: "Rojo", value: "oklch(0.55 0.2 27)" },
  { key: "orange", label: "Naranja", value: "oklch(0.68 0.18 55)" },
  { key: "yellow", label: "Amarillo", value: "oklch(0.82 0.16 88)" },
  { key: "green", label: "Verde", value: "oklch(0.55 0.15 150)" },
  { key: "purple", label: "Morado", value: "oklch(0.5 0.17 300)" },
  { key: "pink", label: "Rosado", value: "oklch(0.65 0.17 350)" },
  { key: "gray", label: "Gris", value: "oklch(0.45 0.01 260)" },
];

const BLUE = "oklch(0.6 0.16 250)";
const RED = "oklch(0.55 0.2 27)";
const NAVY = "oklch(0.38 0.12 262)";
const GREEN = "oklch(0.55 0.15 150)";
const ORANGE = "oklch(0.68 0.18 55)";
const PURPLE = "oklch(0.5 0.17 300)";
const PINK = "oklch(0.65 0.17 350)";

export const ICON_OPTIONS: IconOption[] = [
  // Circulación (rojo)
  { key: "escalera", label: "Escalera", icon: ArrowUpDown, color: RED, group: "Circulación" },
  { key: "escalera2", label: "Escalera (huellas)", icon: Footprints, color: RED, group: "Circulación" },
  { key: "ascensor", label: "Ascensor", icon: MoveVertical, color: RED, group: "Circulación" },
  { key: "rampa", label: "Rampa accesible", icon: Accessibility, color: RED, group: "Circulación" },
  { key: "salida", label: "Salida / emergencia", icon: TriangleAlert, color: RED, group: "Circulación" },
  { key: "extintor", label: "Extintor", icon: FireExtinguisher, color: RED, group: "Circulación" },
  { key: "punto", label: "Punto de encuentro", icon: MapPin, color: RED, group: "Circulación" },

  // Baños y servicios (azul)
  { key: "bano", label: "Baño", icon: Bath, color: BLUE, group: "Baños y servicios" },
  { key: "bano-hombres", label: "Baño hombres", icon: Mars, color: BLUE, group: "Baños y servicios" },
  { key: "bano-mujeres", label: "Baño mujeres", icon: Venus, color: PINK, group: "Baños y servicios" },
  { key: "bano-mixto", label: "Baño mixto", icon: Users, color: BLUE, group: "Baños y servicios" },
  { key: "bano-accesible", label: "Baño accesible (silla de ruedas)", icon: Accessibility, color: BLUE, group: "Baños y servicios" },
  { key: "retrete", label: "Retrete / inodoro", icon: Toilet, color: BLUE, group: "Baños y servicios" },
  { key: "ducha", label: "Duchas / camarines", icon: ShowerHead, color: BLUE, group: "Baños y servicios" },
  { key: "accesibilidad", label: "Acceso universal", icon: PersonStanding, color: BLUE, group: "Baños y servicios" },
  { key: "muda", label: "Sala de muda", icon: Baby, color: BLUE, group: "Baños y servicios" },
  { key: "reciclaje", label: "Reciclaje", icon: Recycle, color: GREEN, group: "Baños y servicios" },
  { key: "mantencion", label: "Mantención", icon: Wrench, color: NAVY, group: "Baños y servicios" },
  { key: "seguridad", label: "Seguridad", icon: ShieldCheck, color: NAVY, group: "Baños y servicios" },
  { key: "enfermeria", label: "Enfermería", icon: HeartPulse, color: RED, group: "Baños y servicios" },
  { key: "salud", label: "Salud / primeros auxilios", icon: Stethoscope, color: RED, group: "Baños y servicios" },

  // Aulas y laboratorios (azul marino)
  { key: "info", label: "Información", icon: Info, color: NAVY, group: "Aulas y laboratorios" },
  { key: "sala", label: "Sala de clases", icon: Projector, color: NAVY, group: "Aulas y laboratorios" },
  { key: "lab-info", label: "Lab. de computación", icon: Computer, color: NAVY, group: "Aulas y laboratorios" },
  { key: "laptop", label: "Sala de notebooks", icon: Laptop, color: NAVY, group: "Aulas y laboratorios" },
  { key: "redes", label: "Lab. de redes", icon: Cable, color: NAVY, group: "Aulas y laboratorios" },
  { key: "servidores", label: "Sala de servidores", icon: Server, color: NAVY, group: "Aulas y laboratorios" },
  { key: "sala-seguridad", label: "Sala de seguridad", icon: ShieldCheck, color: NAVY, group: "Aulas y laboratorios" },
  { key: "electronica", label: "Lab. de electrónica", icon: Cpu, color: NAVY, group: "Aulas y laboratorios" },
  { key: "quimica", label: "Lab. de química", icon: FlaskConical, color: PURPLE, group: "Aulas y laboratorios" },
  { key: "ciencias", label: "Lab. de ciencias", icon: Beaker, color: PURPLE, group: "Aulas y laboratorios" },
  { key: "taller", label: "Taller mecánico", icon: Car, color: ORANGE, group: "Aulas y laboratorios" },
  { key: "audiovisual", label: "Sala audiovisual", icon: MonitorPlay, color: NAVY, group: "Aulas y laboratorios" },
  { key: "foto", label: "Estudio fotográfico", icon: Camera, color: NAVY, group: "Aulas y laboratorios" },
  { key: "musica", label: "Sala de música", icon: Music, color: PURPLE, group: "Aulas y laboratorios" },

  // Estudio y trámites
  { key: "libro", label: "Biblioteca", icon: Library, color: ORANGE, group: "Estudio y trámites" },
  { key: "lectura", label: "Sala de lectura", icon: BookOpen, color: ORANGE, group: "Estudio y trámites" },
  { key: "impresion", label: "Impresión", icon: Printer, color: NAVY, group: "Estudio y trámites" },
  { key: "wifi", label: "Zona WiFi", icon: Wifi, color: GREEN, group: "Estudio y trámites" },
  { key: "financiamiento", label: "Financiamiento", icon: Banknote, color: GREEN, group: "Estudio y trámites" },
  { key: "matricula", label: "Matrícula", icon: ClipboardList, color: GREEN, group: "Estudio y trámites" },
  { key: "titulacion", label: "Titulación", icon: GraduationCap, color: ORANGE, group: "Estudio y trámites" },
  { key: "oficina", label: "Oficina / dirección", icon: Briefcase, color: NAVY, group: "Estudio y trámites" },
  { key: "reuniones", label: "Sala de reuniones", icon: Users, color: NAVY, group: "Estudio y trámites" },
  { key: "certificados", label: "Certificados", icon: BadgeCheck, color: GREEN, group: "Estudio y trámites" },
  { key: "calculo", label: "Sala de cálculo", icon: Calculator, color: NAVY, group: "Estudio y trámites" },

  // Bienestar y esparcimiento
  { key: "cafeteria", label: "Cafetería", icon: Coffee, color: ORANGE, group: "Bienestar" },
  { key: "casino", label: "Casino / comedor", icon: Utensils, color: ORANGE, group: "Bienestar" },
  { key: "snack", label: "Snacks", icon: Croissant, color: ORANGE, group: "Bienestar" },
  { key: "tienda", label: "Tienda", icon: ShoppingBag, color: ORANGE, group: "Bienestar" },
  { key: "cancha", label: "Cancha deportiva", icon: Goal, color: GREEN, group: "Bienestar" },
  { key: "cancha-multi", label: "Multicancha", icon: Volleyball, color: GREEN, group: "Bienestar" },
  { key: "gimnasio", label: "Gimnasio", icon: Dumbbell, color: GREEN, group: "Bienestar" },
  { key: "estar", label: "Sala de estar", icon: Sofa, color: GREEN, group: "Bienestar" },
  { key: "patio", label: "Patio / áreas verdes", icon: Trees, color: GREEN, group: "Bienestar" },
  { key: "pastoral", label: "Pastoral / capilla", icon: Church, color: PURPLE, group: "Bienestar" },
  { key: "difusion", label: "Difusión", icon: Megaphone, color: ORANGE, group: "Bienestar" },
  { key: "bicicletero", label: "Bicicletero", icon: Bike, color: GREEN, group: "Bienestar" },
  { key: "paradero", label: "Paradero / transporte", icon: Bus, color: GREEN, group: "Bienestar" },
];

export const ICON_MAP: Record<string, IconOption> = Object.fromEntries(
  ICON_OPTIONS.map((o) => [o.key, o]),
);

export const ICON_GROUPS = Array.from(new Set(ICON_OPTIONS.map((o) => o.group)));

export function getIcon(key: string | undefined) {
  if (!key || key === "none") return null;
  return ICON_MAP[key] ?? null;
}

export function markerColor(key: string | undefined, custom?: string) {
  if (custom) return custom;
  return getIcon(key)?.color ?? NAVY;
}
