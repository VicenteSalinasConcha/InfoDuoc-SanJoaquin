// ============================================================================
// ARCHIVO: src/routes/direccion.tsx  —  PÁGINA "DIRECCIÓN"
// ----------------------------------------------------------------------------
// Muestra tarjetas expandibles de Escuelas y del Equipo de Sede.
// Al hacer clic en una tarjeta se despliega su equipo: foto circular grande,
// nombre, cargo, descripción y correo (el correo solo aparece si está
// escrito; si no, se oculta).
// Los datos vienen del store (useInfoDuoc) y se editan en /admin.
// Tamaño de las fotos circulares: clases "size-24 sm:size-28" en PersonaRow.
// ============================================================================
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, Mail } from "lucide-react";
import { useState } from "react";

import { initials, useInfoDuoc, type Persona } from "@/lib/infoduoc-store";

export const Route = createFileRoute("/direccion")({
  head: () => ({
    meta: [
      { title: "Dirección: escuelas y equipos — InfoDuoc San Joaquín" },
      {
        name: "description",
        content:
          "Directores de carrera, equipos de escuelas y equipo de sede (dirección, pastoral y financiamiento) de la Sede San Joaquín.",
      },
      { property: "og:title", content: "Dirección — InfoDuoc San Joaquín" },
      {
        property: "og:description",
        content: "Conoce a las escuelas y al equipo de la Sede San Joaquín con sus contactos.",
      },
    ],
  }),
  component: DireccionPage,
});

function PersonaRow({ persona }: { persona: Persona }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      {persona.foto ? (
        <img
          src={persona.foto}
          alt={persona.nombre}
          loading="lazy"
          className="size-24 shrink-0 rounded-full border-2 border-accent object-cover sm:size-28"
        />
      ) : (
        <div className="flex size-24 shrink-0 items-center justify-center rounded-full border-2 border-accent bg-navy text-2xl font-bold text-primary-foreground sm:size-28">
          {initials(persona.nombre)}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-card-foreground">{persona.nombre}</p>
        <p className="text-sm text-muted-foreground">{persona.cargo}</p>
        {persona.descripcion ? (
          <p className="mt-1 text-sm text-muted-foreground">{persona.descripcion}</p>
        ) : null}
        {persona.email?.trim() ? (
          <a
            href={`mailto:${persona.email}`}
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-navy-soft hover:underline"
          >
            <Mail className="size-3.5" /> {persona.email}
          </a>
        ) : null}
      </div>
    </div>
  );
}


function DireccionPage() {
  const { data } = useInfoDuoc();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
      <h1 className="text-2xl sm:text-3xl font-black text-foreground">Dirección de la Sede</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Selecciona una tarjeta para ver al equipo, sus cargos y correos de contacto.
      </p>

      <section className="mt-10">
        <h2 className="text-sm font-bold tracking-[0.18em] text-navy-soft uppercase">Escuelas</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {data.escuelas.map((escuela) => {
            const open = openId === escuela.id;
            return (
              <article
                key={escuela.id}
                className={`overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 ${
                  open ? "lg:col-span-3 shadow-[var(--shadow-elevated)]" : "hover:-translate-y-1"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(escuela.id)}
                  className="relative block h-44 w-full text-left sm:h-52"
                >
                  <img
                    src={escuela.imagen}
                    alt={escuela.nombre}
                    width={1024}
                    height={640}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(0.19_0.06_262/92%),oklch(0.19_0.06_262/45%))]" />
                  <div className="relative flex h-full flex-col justify-end p-6">
                    <h3 className="text-xl font-bold text-primary-foreground">{escuela.nombre}</h3>
                    <p className="mt-1 text-sm text-primary-foreground/70">{escuela.descripcion}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-duoc-yellow uppercase">
                      {open ? "Cerrar" : "Ver equipo"}
                      <ChevronDown
                        className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="grid animate-in gap-4 p-6 duration-300 fade-in slide-in-from-top-2 md:grid-cols-2 xl:grid-cols-3">
                    {escuela.equipo.map((m) => (
                      <PersonaRow key={m.id} persona={m} />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-14 border-t border-border pt-10 pb-6">
        <h2 className="text-sm font-bold tracking-[0.18em] text-navy-soft uppercase">
          Equipo de Sede
        </h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-3">
          {data.equipos.map((equipo) => {
            const open = openId === equipo.id;
            return (
              <article
                key={equipo.id}
                className={`overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 ${
                  open ? "lg:col-span-3 shadow-[var(--shadow-elevated)]" : "hover:-translate-y-1"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggle(equipo.id)}
                  className="relative block h-40 w-full text-left sm:h-44"
                >
                  <img
                    src={equipo.imagen}
                    alt={equipo.nombre}
                    width={1024}
                    height={640}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(0deg,oklch(0.19_0.06_262/92%),oklch(0.19_0.06_262/50%))]" />
                  <div className="relative flex h-full flex-col justify-end p-6">
                    <h3 className="text-lg font-bold text-primary-foreground">{equipo.nombre}</h3>
                    <p className="mt-1 text-sm text-primary-foreground/70">{equipo.descripcion}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-duoc-yellow uppercase">
                      {open ? "Cerrar" : "Ver equipo"}
                      <ChevronDown
                        className={`size-4 transition-transform ${open ? "rotate-180" : ""}`}
                      />
                    </span>
                  </div>
                </button>
                {open && (
                  <div className="grid animate-in gap-4 p-6 duration-300 fade-in slide-in-from-top-2 md:grid-cols-2 xl:grid-cols-3">
                    {equipo.miembros.map((m) => (
                      <PersonaRow key={m.id} persona={m} />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
