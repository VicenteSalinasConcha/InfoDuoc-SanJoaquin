# Guía de edición — InfoDuoc Sede San Joaquín

Esta guía explica **qué archivo tocar** para cambiar cada cosa de la aplicación.
Todos los archivos importantes tienen un encabezado comentado que resume su función.

## ¿Dónde se guarda la información?

Todo (salas, fotos, nombres, escuelas, personas, administradores y tamaño del
mapa) se guarda automáticamente en la **base de datos (Lovable Cloud)** cada vez
que editas algo en el panel de administración. No necesitas tocar código para
agregar salas, subir fotos o crear administradores: hazlo desde `/admin`.

## Mapa rápido de archivos

| Quiero cambiar… | Archivo |
| --- | --- |
| Textos de bienvenida / tutorial | `src/routes/index.tsx` |
| Mapa 3D: zoom, colores de salas, buscador | `src/routes/mapa.tsx` |
| Página Dirección (tarjetas y fotos circulares) | `src/routes/direccion.tsx` |
| Panel de administración (pestañas y formularios) | `src/routes/admin.tsx` |
| Editor de pisos (arrastrar, tamaño, girar) | `src/components/FloorEditor.tsx` |
| Menú lateral y login oculto | `src/components/AppSidebar.tsx` |
| Íconos disponibles para salas | `src/lib/room-icons.tsx` |
| Selector visual de íconos | `src/components/IconPicker.tsx` |
| Datos centrales y guardado en la base de datos | `src/lib/infoduoc-store.tsx` |
| Cuentas de administrador (servidor) | `src/lib/admin.functions.ts` |
| Gestión de administradores (interfaz) | `src/components/AdminAccounts.tsx` |
| Editar perfil del administrador | `src/components/AdminProfileDialog.tsx` |
| Menú de accesibilidad (letra, daltonismo) | `src/components/AccessibilityMenu.tsx` |
| Pantalla de carga amarilla | `src/components/RouteLoader.tsx` |
| Colores institucionales y tema | `src/styles.css` |
| Estructura general de la app | `src/routes/__root.tsx` |
| Imágenes por defecto (salas y escuelas) | `src/assets/` |

## Tareas frecuentes

### Agregar o editar una sala del mapa
1. Inicia sesión (clic en el título **InfoDuoc** del menú).
2. Ve a **Administración → Editor de pisos**.
3. "Agregar bloque", arrástralo, dale tamaño con la esquina amarilla y gíralo
   con el círculo amarillo.
4. Con el bloque seleccionado: nombre, descripción, tipo, ícono, color, altura
   3D y foto. Todo se guarda solo.

### Cambiar el tamaño del plano
En **Administración → Editor de pisos**, mueve los sliders "Ancho del mapa" y
"Largo del mapa" (de 4 a 25 u).

### Agregar un ícono nuevo al catálogo
Edita `src/lib/room-icons.tsx`: importa el ícono desde `lucide-react` y agrégalo
al arreglo `ROOM_ICONS` con clave, etiqueta, grupo y color.

### Crear otro administrador
En **Administración → Administradores** (solo visible para el dueño): correo,
contraseña y rol (`editor` o `superadmin`).

### Cambiar fotos de personas o escuelas
En **Administración → Escuelas / Equipo de Sede** usa el botón "Subir foto" /
"Cambiar imagen de tarjeta". Las fotos se guardan en la base de datos.

### Cambiar colores institucionales
Edita `src/styles.css`: los colores azul oscuro, amarillo y naranja están
definidos como variables (tokens) al inicio del tema.

## Notas técnicas

- Los textos del código con `//` son **comentarios**: no afectan el programa,
  solo explican qué hace cada parte.
- No edites `src/integrations/supabase/*` ni `src/routeTree.gen.ts`: se generan
  automáticamente.
- Las credenciales del dueño se crean automáticamente en el primer inicio de
  sesión (`vicentesalinasconcha@gmail.com`).
