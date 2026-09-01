// ============================================================================
// ARCHIVO: src/routes/index.tsx  —  PÁGINA DE INICIO (tutorial/bienvenida)
// ----------------------------------------------------------------------------
// Portada de InfoDuoc: explica qué es la app, cómo navegar el mapa (buscar,
// hacer clic en salas, acercar/alejar) y enlaces a Mapa y Dirección.
// Edita aquí los textos de bienvenida y las tarjetas de ayuda.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accessibility,
  Hand,
  Layers,
  Map,
  MousePointerClick,
  Search,
  Users,
  ZoomIn,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InfoDuoc Sede San Joaquín — Inicio y tutorial de uso" },
      {
        name: "description",
        content:
          "Kiosco informativo de la Sede San Joaquín: aprende a usar el mapa isométrico por pisos y el directorio de escuelas y equipos.",
      },
      { property: "og:title", content: "InfoDuoc Sede San Joaquín" },
      {
        property: "og:description",
        content: "Tutorial de uso, mapa interactivo por pisos y directorio de la Sede San Joaquín.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Inicio,
});

const pasos = [
  {
    icon: Layers,
    titulo: "1. Elige el piso",
    texto:
      "En el mapa, usa los botones del piso -1 al piso 8 para cambiar de nivel. El plano se dibuja en 3D isométrico.",
  },
  {
    icon: MousePointerClick,
    titulo: "2. Pasa el mouse",
    texto:
      "Al pasar el cursor, la sala se pinta de amarillo, se eleva y aparece su nombre sobre el bloque.",
  },
  {
    icon: Search,
    titulo: "3. Haz clic para ver más",
    texto:
      "Al presionar una sala se abre una ventana con su fotografía real, el piso y la información del recinto.",
  },
  {
    icon: Hand,
    titulo: "4. Desplaza el plano",
    texto: "Arrastra con el mouse para mover el mapa y ubicarte en la zona que te interesa.",
  },
  {
    icon: ZoomIn,
    titulo: "5. Acerca y aleja",
    texto:
      "Usa la rueda del mouse o los botones + y − para el zoom. El botón de centrar devuelve la vista original.",
  },
  {
    icon: Accessibility,
    titulo: "6. Accesibilidad",
    texto:
      "El botón amarillo abajo a la derecha permite aumentar el tamaño de letra, activar alto contraste y filtros para daltonismo.",
  },
];

const leyenda = [
  { color: "oklch(0.55 0.2 27)", texto: "Rojo: escaleras, ascensores y salidas" },
  { color: "oklch(0.6 0.16 250)", texto: "Azul: baños y servicios" },
  { color: "oklch(0.68 0.18 55)", texto: "Naranja: biblioteca, cafetería y casino" },
  { color: "oklch(0.55 0.15 150)", texto: "Verde: WiFi, trámites y áreas verdes" },
];

function Inicio() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[image:var(--gradient-navy)] px-4 py-10 sm:px-8 sm:py-14 lg:px-10 lg:py-16">
      <div className="pointer-events-none absolute -top-40 -right-40 size-[34rem] rounded-full bg-duoc-yellow/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-52 -left-32 size-[30rem] rounded-full bg-map-stairs/20 blur-3xl" />

      <div className="relative mx-auto max-w-5xl">
        <div className="animate-in text-center duration-700 fade-in slide-in-from-bottom-6">
          <span className="inline-block rounded-full border border-duoc-yellow/40 px-4 py-1.5 text-xs font-bold tracking-[0.2em] text-duoc-yellow uppercase">
            Kiosco informativo
          </span>
          <h1 className="mt-6 text-3xl leading-tight font-black text-primary-foreground sm:text-4xl lg:text-5xl xl:text-6xl">
            Bienvenido a{" "}
            <span className="bg-[image:var(--gradient-gold)] bg-clip-text text-transparent">
              InfoDuoc Sede San Joaquín
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-primary-foreground/75 sm:text-lg">
            Esta aplicación te ayuda a ubicar salas, laboratorios, baños y escaleras de la sede, y a
            conocer a las escuelas y equipos que te atienden. En el menú de la izquierda encuentras
            el mapa y dirección.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <Link
              to="/mapa"
              className="group rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5 sm:p-7 text-left transition-all hover:-translate-y-1 hover:border-duoc-yellow/50 hover:bg-primary-foreground/10"
            >
              <Map className="size-8 text-duoc-yellow" />
              <h2 className="mt-4 text-xl font-bold text-primary-foreground">Mapa</h2>
              <p className="mt-1 text-sm text-primary-foreground/65">
                Plano isométrico 3D del piso -1 al piso 8 con salas, escaleras y rampas.
              </p>
            </Link>
            <Link
              to="/direccion"
              className="group rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-5 sm:p-7 text-left transition-all hover:-translate-y-1 hover:border-duoc-yellow/50 hover:bg-primary-foreground/10"
            >
              <Users className="size-8 text-duoc-yellow" />
              <h2 className="mt-4 text-xl font-bold text-primary-foreground">Dirección</h2>
              <p className="mt-1 text-sm text-primary-foreground/65">
                Escuelas, directores de carrera y equipos de sede con sus contactos.
              </p>
            </Link>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-black text-primary-foreground">
            Tutorial: ¿cómo se navega?
          </h2>
          <p className="mt-1 text-sm text-primary-foreground/65">
            Seis pasos simples para moverte por InfoDuoc.
          </p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pasos.map(({ icon: Icon, titulo, texto }) => (
              <li
                key={titulo}
                className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/5 p-6 transition-all hover:-translate-y-1 hover:border-duoc-yellow/40"
              >
                <span className="flex size-11 items-center justify-center rounded-xl bg-[image:var(--gradient-gold)]">
                  <Icon className="size-5 text-accent-foreground" />
                </span>
                <h3 className="mt-4 text-base font-bold text-primary-foreground">{titulo}</h3>
                <p className="mt-1.5 text-sm text-primary-foreground/65">{texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 rounded-2xl border border-primary-foreground/12 bg-primary-foreground/5 p-5 sm:p-7">
          <h2 className="text-lg font-bold text-primary-foreground">
            Leyenda de colores de los íconos
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {leyenda.map((l) => (
              <li key={l.texto} className="flex items-center gap-3 text-sm text-primary-foreground/75">
                <span
                  className="size-5 shrink-0 rounded-full border-2 border-primary-foreground/30"
                  style={{ background: l.color }}
                />
                {l.texto}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
