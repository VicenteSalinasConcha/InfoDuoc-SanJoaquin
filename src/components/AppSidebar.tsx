// ============================================================================
// ARCHIVO: src/components/AppSidebar.tsx  —  MENÚ LATERAL + LOGIN OCULTO
// ----------------------------------------------------------------------------
// Barra de navegación (Inicio, Mapa, Dirección y Administración si hay sesión).
// En celular se convierte en barra superior con botón hamburguesa (drawer).
// Hacer clic en el título "InfoDuoc" abre el modal de inicio de sesión.
// Aquí también viven el botón de cerrar sesión y el menú de accesibilidad.
// ============================================================================
import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, Users, ShieldCheck, LogOut, Lock, UserCog, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminProfileDialog } from "@/components/AdminProfileDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials, useInfoDuoc } from "@/lib/infoduoc-store";

const navItems = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/mapa", label: "Mapa", icon: Map },
  { to: "/direccion", label: "Dirección", icon: Users },
] as const;

export function AppSidebar() {
  const { isAdmin, isOwner, login, logout, profile, currentAdmin } = useInfoDuoc();
  const cuenta = currentAdmin ?? { nombre: profile.nombre, email: profile.email, rol: "editor" as const };
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMenu(false);
  }, [pathname]);


  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(user, pass);
    setBusy(false);
    if (ok) {
      toast.success("Acceso concedido", { description: "Panel de Administración habilitado." });
      setOpen(false);
      setUser("");
      setPass("");
    } else {
      toast.error("Credenciales inválidas");
    }
  };

  return (
    <>
      {/* Barra superior solo móvil */}
      <div className="fixed inset-x-0 top-0 z-40 grid h-14 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-sidebar-border bg-sidebar px-3 text-sidebar-foreground lg:hidden">
        <button
          type="button"
          onClick={() => setMenu(true)}
          aria-label="Abrir menú"
          className="flex size-10 shrink-0 items-center justify-center rounded-lg hover:bg-sidebar-accent"
        >
          <Menu className="size-5" />
        </button>
        <span className="truncate text-lg font-black tracking-tight">
          <span className="bg-[image:var(--gradient-gold)] bg-clip-text text-transparent">
            InfoDuoc
          </span>
          <span className="ml-2 text-xs font-medium text-sidebar-foreground/60">San Joaquín</span>
        </span>
      </div>

      {menu && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMenu(false)}
          className="animate-in fixed inset-0 z-40 bg-navy-deep/70 duration-200 fade-in lg:hidden"
        />
      )}

    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-[17rem] max-w-[85vw] shrink-0 flex-col overflow-y-auto border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:static lg:w-72 lg:translate-x-0 ${
        menu ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <button
        type="button"
        onClick={() => setMenu(false)}
        aria-label="Cerrar menú"
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-lg hover:bg-sidebar-accent lg:hidden"
      >
        <X className="size-5" />
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group px-6 py-7 text-left transition-colors hover:bg-sidebar-accent/60"
        title="Acceso administrador"
      >
        <span className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <span className="bg-[image:var(--gradient-gold)] bg-clip-text text-transparent">
            InfoDuoc
          </span>
          <Lock className="size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
        </span>
        <span className="mt-1 block text-sm font-medium text-sidebar-foreground/70">
          Sede San Joaquín
        </span>
      </button>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-sidebar-foreground/80 transition-all hover:translate-x-1 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            activeProps={{
              className:
                "!bg-sidebar-accent !text-sidebar-foreground border-l-4 border-duoc-yellow pl-3",
            }}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        ))}

        {isAdmin && (
          <Link
            to="/admin"
            className="mt-2 flex animate-in items-center gap-3 rounded-lg border border-duoc-yellow/40 bg-duoc-yellow/10 px-4 py-3 text-sm font-semibold text-duoc-yellow transition-all fade-in slide-in-from-left-3 hover:bg-duoc-yellow/20"
            activeProps={{ className: "!bg-duoc-yellow/25" }}
          >
            <ShieldCheck className="size-5" />
            Panel de Administración
          </Link>
        )}
      </nav>

      {isAdmin && (
        <div className="space-y-1 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-sidebar-accent/50 px-3 py-2">
            {isOwner && profile.foto ? (
              <img
                src={profile.foto}
                alt={`Foto de ${profile.nombre}`}
                className="size-9 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-full bg-duoc-yellow/20 text-xs font-black text-duoc-yellow">
                {initials(cuenta.nombre)}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-sidebar-foreground">{cuenta.nombre}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">{cuenta.email}</p>
              <p className="text-[10px] font-bold text-duoc-yellow">
                {cuenta.rol === "superadmin" ? "Superadministrador" : "Editor"}
              </p>
            </div>
          </div>
          {isOwner && (
          <AdminProfileDialog
            trigger={
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <UserCog className="size-4" /> Editar perfil
              </Button>
            }
          />
          )}
          <Button
            variant="ghost"
            onClick={logout}
            className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      )}

      <p className="px-6 pb-5 text-xs text-sidebar-foreground/45">
        Duoc UC · Información de sede interactiva
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Acceso administrador</DialogTitle>
            <DialogDescription>
              Ingresa tus credenciales para editar la información de la sede.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-user">Usuario</Label>
              <Input
                id="admin-user"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                placeholder="correo institucional"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-pass">Contraseña</Label>
              <Input
                id="admin-pass"
                type="password"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Entrar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </aside>
    </>
  );
}
