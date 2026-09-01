create table public.rooms (
  id text primary key,
  floor int not null,
  name text not null default 'Nueva sala',
  kind text not null default 'sala',
  marker text not null default 'none',
  color text,
  descripcion text,
  x numeric not null default 0.5,
  y numeric not null default 0.5,
  w numeric not null default 2,
  h numeric not null default 1.6,
  rot numeric not null default 0,
  height numeric not null default 34,
  photo text,
  photo_index int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.rooms to anon;
grant select, insert, update, delete on public.rooms to authenticated;
grant all on public.rooms to service_role;
alter table public.rooms enable row level security;
create policy "rooms_public_read" on public.rooms for select using (true);
create policy "rooms_admin_write" on public.rooms for all to authenticated using (true) with check (true);

create table public.escuelas (
  id text primary key,
  nombre text not null default 'Nueva escuela',
  descripcion text not null default '',
  imagen text,
  imagen_index int not null default 0,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.escuelas to anon;
grant select, insert, update, delete on public.escuelas to authenticated;
grant all on public.escuelas to service_role;
alter table public.escuelas enable row level security;
create policy "escuelas_public_read" on public.escuelas for select using (true);
create policy "escuelas_admin_write" on public.escuelas for all to authenticated using (true) with check (true);

create table public.equipos (
  id text primary key,
  nombre text not null default 'Nuevo equipo',
  descripcion text not null default '',
  imagen text,
  imagen_index int not null default 0,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.equipos to anon;
grant select, insert, update, delete on public.equipos to authenticated;
grant all on public.equipos to service_role;
alter table public.equipos enable row level security;
create policy "equipos_public_read" on public.equipos for select using (true);
create policy "equipos_admin_write" on public.equipos for all to authenticated using (true) with check (true);

create table public.personas (
  id text primary key,
  grupo text not null check (grupo in ('escuelas','equipos')),
  grupo_id text not null,
  nombre text not null default 'Nombre y apellido',
  cargo text not null default 'Cargo',
  email text not null default 'correo@duocuc.cl',
  foto text,
  orden int not null default 0,
  created_at timestamptz not null default now()
);
create index personas_grupo_idx on public.personas (grupo, grupo_id);
grant select on public.personas to anon;
grant select, insert, update, delete on public.personas to authenticated;
grant all on public.personas to service_role;
alter table public.personas enable row level security;
create policy "personas_public_read" on public.personas for select using (true);
create policy "personas_admin_write" on public.personas for all to authenticated using (true) with check (true);

create table public.app_settings (
  id int primary key default 1,
  map_w numeric not null default 8,
  map_h numeric not null default 6.4,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to anon;
grant select, insert, update on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "app_settings_public_read" on public.app_settings for select using (true);
create policy "app_settings_admin_write" on public.app_settings for all to authenticated using (true) with check (true);
insert into public.app_settings (id) values (1);

create table public.admin_accounts (
  id uuid primary key,
  nombre text not null default '',
  email text not null unique,
  rol text not null default 'editor' check (rol in ('superadmin','editor')),
  is_owner boolean not null default false,
  foto text,
  created_at timestamptz not null default now()
);
grant select, update on public.admin_accounts to authenticated;
grant all on public.admin_accounts to service_role;
alter table public.admin_accounts enable row level security;
create policy "admin_accounts_read" on public.admin_accounts for select to authenticated using (true);
create policy "admin_accounts_update_self" on public.admin_accounts for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admin_accounts where id = _user_id and rol = _role)
$$;

insert into public.rooms (id, floor, name, kind, marker, x, y, w, h, height, photo_index)
select f.floor || '-' || l.i,
       f.floor,
       case when l.kind = 'sala' then replace(l.label, 'Sala ', 'Sala ' || case when f.floor = -1 then 'S' else f.floor::text end) else l.label end,
       l.kind, l.marker, l.x, l.y, l.w, l.h,
       case when l.kind = 'sala' then 34 else 22 end,
       l.i
from (values (-1),(1),(2),(3),(4),(5),(6),(7),(8)) as f(floor)
cross join (values
  (0, 0, 0, 3, 2, 'sala', 'info', 'Sala A'),
  (1, 3.3, 0, 2, 2, 'sala', 'none', 'Sala B'),
  (2, 5.6, 0, 2.4, 2, 'sala', 'wifi', 'Sala C'),
  (3, 0, 2.4, 1.6, 1.6, 'escalera', 'escalera', 'Escalera Norte'),
  (4, 1.9, 2.4, 1.2, 1.6, 'servicio', 'ascensor', 'Ascensores'),
  (5, 3.4, 2.4, 2.2, 1.6, 'sala', 'bano', 'Servicios higiénicos'),
  (6, 5.9, 2.4, 2.1, 1.6, 'sala', 'libro', 'Sala D'),
  (7, 0, 4.3, 3.6, 2, 'sala', 'cafeteria', 'Sala E'),
  (8, 3.9, 4.3, 4.1, 2, 'sala', 'none', 'Laboratorio'),
  (9, 6.6, 2.4, 1.4, 1.6, 'escalera', 'escalera', 'Rampa')
) as l(i, x, y, w, h, kind, marker, label);

insert into public.escuelas (id, nombre, descripcion, imagen_index, orden) values
('informatica','Escuela de Informática y Telecomunicaciones','Carreras de desarrollo de software, redes, ciberseguridad y telecomunicaciones.',0,0),
('ingenieria','Escuela de Ingeniería y Recursos Naturales','Mecánica automotriz, electricidad, mantenimiento industrial y prevención.',1,1),
('administracion','Escuela de Administración y Negocios','Administración de empresas, contabilidad, marketing y comercio internacional.',2,2);

insert into public.equipos (id, nombre, descripcion, imagen_index, orden) values
('directores','Directores de la Sede','Dirección general, académica y de asuntos estudiantiles.',2,0),
('pastoral','Pastoral','Acompañamiento, voluntariado y actividades de formación valórica.',1,1),
('financiamiento','Financiamiento','Becas, gratuidad, CAE y convenios de pago para estudiantes.',0,2);

insert into public.personas (id, grupo, grupo_id, nombre, cargo, email, orden) values
('inf-1','escuelas','informatica','Carla Muñoz Rivas','Directora de Carrera','cmunoz@duocuc.cl',0),
('inf-2','escuelas','informatica','Rodrigo Pérez Lagos','Jefe de Carrera Analista Programador','rperez@duocuc.cl',1),
('inf-3','escuelas','informatica','Valentina Soto Díaz','Coordinadora Académica','vsoto@duocuc.cl',2),
('inf-4','escuelas','informatica','Matías Fuentes Vera','Docente Coordinador Redes','mfuentes@duocuc.cl',3),
('ing-1','escuelas','ingenieria','Jorge Herrera Pinto','Director de Carrera','jherrera@duocuc.cl',0),
('ing-2','escuelas','ingenieria','Paula Reyes Cárdenas','Jefa de Carrera Electricidad','preyes@duocuc.cl',1),
('ing-3','escuelas','ingenieria','Cristián Vidal Rojas','Coordinador de Talleres','cvidal@duocuc.cl',2),
('adm-1','escuelas','administracion','Andrea Castillo Núñez','Directora de Carrera','acastillo@duocuc.cl',0),
('adm-2','escuelas','administracion','Felipe Araya Bustos','Jefe de Carrera Contabilidad','faraya@duocuc.cl',1),
('adm-3','escuelas','administracion','Daniela Torres Mella','Coordinadora de Prácticas','dtorres@duocuc.cl',2),
('dir-1','equipos','directores','Vicente Salinas Concha','Director de Sede','vsalinas@duocuc.cl',0),
('dir-2','equipos','directores','Marcela Ibáñez Rojas','Subdirectora Académica','mibanez@duocuc.cl',1),
('dir-3','equipos','directores','Ignacio Bravo León','Director de Asuntos Estudiantiles','ibravo@duocuc.cl',2),
('pas-1','equipos','pastoral','Hermana Rosa Molina','Coordinadora de Pastoral','rmolina@duocuc.cl',0),
('pas-2','equipos','pastoral','Tomás Aguilera Pinto','Animador Pastoral','taguilera@duocuc.cl',1),
('fin-1','equipos','financiamiento','Karla Espinoza Vera','Jefa de Financiamiento','kespinoza@duocuc.cl',0),
('fin-2','equipos','financiamiento','Sebastián Ruiz Gómez','Ejecutivo de Becas y Créditos','sruiz@duocuc.cl',1);