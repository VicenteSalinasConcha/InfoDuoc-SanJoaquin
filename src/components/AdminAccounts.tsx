// ============================================================================
// ARCHIVO: src/components/AdminAccounts.tsx  —  GESTIÓN DE ADMINISTRADORES
// ----------------------------------------------------------------------------
// Solo el dueño (superadmin) puede usarlo. Permite crear cuentas de
// administrador con correo y contraseña, asignar rol (superadmin/editor),
// editarlas y eliminarlas. Las cuentas se crean en la base de datos con
// autenticación real (Lovable Cloud).
// ============================================================================
import { Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { useInfoDuoc, type AdminRole } from "@/lib/infoduoc-store";

const ROLES: Array<{ value: AdminRole; label: string; hint: string }> = [
  {
    value: "superadmin",
    label: "Superadministrador",
    hint: "Acceso total, incluida la gestión de cuentas y roles.",
  },
  { value: "editor", label: "Editor", hint: "Puede editar mapa, salas, escuelas y equipos." },
];

export function AdminAccounts() {
  const { admins, addAdmin, updateAdmin, deleteAdmin, profile, currentAdmin } = useInfoDuoc();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<AdminRole>("editor");

  const [busy, setBusy] = useState(false);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim() || password.length < 4) {
      toast.error("Completa nombre, correo y una contraseña de al menos 4 caracteres");
      return;
    }
    setBusy(true);
    const ok = await addAdmin({ nombre: nombre.trim(), email: email.trim(), password, rol });
    setBusy(false);
    if (!ok) {
      toast.error("Ese correo ya tiene una cuenta de administrador");
      return;
    }
    toast.success("Cuenta creada", { description: `${email.trim()} ya puede iniciar sesión.` });
    setNombre("");
    setEmail("");
    setPassword("");
    setRol("editor");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-xl border border-duoc-yellow/40 bg-duoc-yellow/10 p-4">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-duoc-yellow" />
        <p className="text-sm text-foreground">
          Solo <strong>{profile.email}</strong> (superadministrador dueño) puede crear cuentas y
          asignar roles. Sesión actual: <strong>{currentAdmin?.email}</strong>.
        </p>
      </div>

      <form
        onSubmit={crear}
        className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-2">
          <Label htmlFor="na-nombre">Nombre</Label>
          <Input
            id="na-nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre y apellido"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="na-email">Correo</Label>
          <Input
            id="na-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@duocuc.cl"
            autoComplete="off"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="na-pass">Contraseña</Label>
          <Input
            id="na-pass"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mínimo 4 caracteres"
            autoComplete="new-password"
          />
        </div>
        <div className="space-y-2">
          <Label>Rol</Label>
          <Select value={rol} onValueChange={(v) => setRol(v as AdminRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={busy} className="gap-2 self-end">
          <UserPlus className="size-4" /> Crear cuenta
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">
          Cuentas de administrador ({admins.length + 1})
        </h2>

        <div className="rounded-xl border border-border bg-secondary/40 p-4">
          <p className="text-sm font-bold text-foreground">{profile.nombre}</p>
          <p className="text-xs text-muted-foreground">
            {profile.email} · Superadministrador (dueño) · no editable desde aquí
          </p>
        </div>

        {admins.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no has creado otras cuentas. Usa el formulario para agregar administradores.
          </p>
        ) : (
          admins.map((a) => (
            <div
              key={a.id}
              className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5"
            >
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={a.nombre}
                  onChange={(e) => updateAdmin(a.id, { nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Correo</Label>
                <Input
                  value={a.email}
                  onChange={(e) => updateAdmin(a.id, { email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña</Label>
                <Input
                  value={a.password}
                  onChange={(e) => updateAdmin(a.id, { password: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={a.rol}
                  onValueChange={(v) => updateAdmin(a.id, { rol: v as AdminRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                className="gap-2 self-end text-destructive"
                onClick={() => {
                  deleteAdmin(a.id);
                  toast.success("Cuenta eliminada");
                }}
              >
                <Trash2 className="size-4" /> Eliminar
              </Button>
              <p className="text-xs text-muted-foreground lg:col-span-5">
                {ROLES.find((r) => r.value === a.rol)?.hint}
              </p>
            </div>
          ))
        )}
      </div>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Plus className="size-3" /> Las cuentas se guardan junto al resto de los datos de la sede.
      </p>
    </div>
  );
}
