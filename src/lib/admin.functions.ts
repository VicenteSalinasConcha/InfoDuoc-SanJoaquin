// ============================================================================
// ARCHIVO: src/lib/admin.functions.ts  —  FUNCIONES DE SERVIDOR (CUENTAS)
// ----------------------------------------------------------------------------
// Lógica del lado del servidor para crear/actualizar/eliminar cuentas de
// administrador y garantizar que exista la cuenta dueña (superadmin).
// NUNCA se importa desde componentes con lógica de interfaz sin pasar por el
// store; usa permisos especiales, no exponer claves en el cliente.
// ============================================================================
import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const OWNER_EMAIL = "vicentesalinasconcha@gmail.com";
const OWNER_PASSWORD = "123456";
const OWNER_NAME = "Vicente Salinas Concha";

/**
 * Crea (una sola vez) la cuenta del dueño con credenciales fijas.
 * Es idempotente: si ya existe, no hace nada.
 */
export const ensureOwner = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: existing } = await supabaseAdmin
    .from("admin_accounts")
    .select("id")
    .eq("is_owner", true)
    .maybeSingle();
  if (existing) return { created: false };

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
  });

  let userId = created?.user?.id;
  if (error || !userId) {
    // Puede existir el usuario en Auth sin fila en admin_accounts.
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    userId = list?.users.find((u) => u.email?.toLowerCase() === OWNER_EMAIL)?.id;
  }
  if (!userId) throw new Error("No se pudo crear la cuenta del administrador dueño");

  await supabaseAdmin.from("admin_accounts").upsert({
    id: userId,
    nombre: OWNER_NAME,
    email: OWNER_EMAIL,
    rol: "superadmin",
    is_owner: true,
  });
  return { created: true };
});

async function assertSuperadmin(supabase: {
  from: (t: "admin_accounts") => {
    select: (c: string) => {
      eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: unknown }> };
    };
  };
}, userId: string) {
  const { data } = await supabase.from("admin_accounts").select("rol").eq("id", userId).maybeSingle();
  const rol = (data as { rol?: string } | null)?.rol;
  if (rol !== "superadmin") throw new Error("Solo un superadministrador puede gestionar cuentas");
}

export const createAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { nombre: string; email: string; password: string; rol: "superadmin" | "editor" }) => {
      const email = input.email.trim().toLowerCase();
      if (!email.includes("@")) throw new Error("Correo inválido");
      if (input.password.length < 4) throw new Error("La contraseña debe tener al menos 4 caracteres");
      return { nombre: input.nombre.trim().slice(0, 120), email, password: input.password, rol: input.rol };
    },
  )
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created?.user) return { ok: false, message: "Ese correo ya tiene una cuenta" };

    const { error: rowError } = await supabaseAdmin.from("admin_accounts").insert({
      id: created.user.id,
      nombre: data.nombre,
      email: data.email,
      rol: data.rol,
    });
    if (rowError) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return { ok: false, message: "Ese correo ya tiene una cuenta" };
    }
    return { ok: true };
  });

export const updateAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { id: string; nombre?: string; rol?: "superadmin" | "editor"; password?: string }) => input,
  )
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: Record<string, string> = {};
    if (data.nombre !== undefined) patch['nombre'] = data.nombre;
    if (data.rol !== undefined) patch['rol'] = data.rol;
    if (Object.keys(patch).length > 0) {
      await supabaseAdmin.from("admin_accounts").update(patch as never).eq("id", data.id);
    }
    if (data.password && data.password.length >= 4) {
      await supabaseAdmin.auth.admin.updateUserById(data.id, { password: data.password });
    }
    return { ok: true };
  });

export const deleteAdminAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.supabase as never, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row } = await supabaseAdmin
      .from("admin_accounts")
      .select("is_owner")
      .eq("id", data.id)
      .maybeSingle();
    if (row?.is_owner) return { ok: false, message: "No se puede eliminar la cuenta del dueño" };

    await supabaseAdmin.from("admin_accounts").delete().eq("id", data.id);
    await supabaseAdmin.auth.admin.deleteUser(data.id);
    return { ok: true };
  });
