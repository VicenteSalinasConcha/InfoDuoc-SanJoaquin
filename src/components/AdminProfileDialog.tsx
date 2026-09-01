// ============================================================================
// ARCHIVO: src/components/AdminProfileDialog.tsx  —  EDITAR PERFIL (ADMIN)
// ----------------------------------------------------------------------------
// Ventana para que el administrador cambie su foto, nombre, correo y
// contraseña. Los cambios se guardan en la base de datos y en la autenticación.
// ============================================================================
import { Upload, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fileToDataUrl, initials, useInfoDuoc } from "@/lib/infoduoc-store";

export function AdminProfileDialog({ trigger }: { trigger: React.ReactNode }) {
  const { profile, updateProfile } = useInfoDuoc();
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState(profile.nombre);
  const [email, setEmail] = useState(profile.email);
  const [foto, setFoto] = useState(profile.foto);
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");

  useEffect(() => {
    if (open) {
      setNombre(profile.nombre);
      setEmail(profile.email);
      setFoto(profile.foto);
      setPass("");
      setPass2("");
    }
  }, [open, profile]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) {
      toast.error("Ingresa un correo válido");
      return;
    }
    if (pass && pass !== pass2) {
      toast.error("Las contraseñas nuevas no coinciden");
      return;
    }
    if (pass && pass.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    updateProfile({ nombre, email, foto, ...(pass ? { password: pass } : {}) });
    toast.success("Perfil de administrador actualizado");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="size-5" /> Editar perfil de administrador
          </DialogTitle>
          <DialogDescription>
            Cambia tu foto, tu correo de acceso y tu contraseña.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4">
            {foto ? (
              <img
                src={foto}
                alt="Foto de perfil del administrador"
                className="size-16 rounded-full object-cover"
              />
            ) : (
              <span className="flex size-16 items-center justify-center rounded-full bg-navy text-lg font-black text-primary-foreground">
                {initials(nombre || "AD")}
              </span>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary">
              <Upload className="size-4" /> Cambiar foto
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setFoto(await fileToDataUrl(file));
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-nombre">Nombre</Label>
            <Input
              id="perfil-nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-email">Correo de acceso</Label>
            <Input
              id="perfil-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-pass">Contraseña nueva</Label>
            <Input
              id="perfil-pass"
              type="password"
              value={pass}
              placeholder="Dejar vacío para mantener la actual"
              onChange={(e) => setPass(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perfil-pass2">Repetir contraseña nueva</Label>
            <Input
              id="perfil-pass2"
              type="password"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full">
            Guardar cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
