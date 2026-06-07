create table public.users (
  id uuid not null default gen_random_uuid (),
  email text null,
  created_at timestamp with time zone not null default (now() AT TIME ZONE 'America/Sao_Paulo'::text),
  user_id uuid null,
  name text null,
  cep numeric null,
  constraint users_pkey primary key (id),
  constraint users_user_id_key unique (user_id)
) TABLESPACE pg_default;

create table public.roles (
  id uuid not null default gen_random_uuid (),
  name text null,
  created_at timestamp with time zone not null default now(),
  constraint roles_pkey primary key (id)
) TABLESPACE pg_default;

create table public.collaborators (
  id uuid not null default gen_random_uuid (),
  email text not null,
  role text null default 'Colaborador'::text,
  created_at timestamp with time zone null default (now() AT TIME ZONE 'America/Sao_Paulo'::text),
  user_id uuid null,
  role_id uuid null,
  constraint collaborators_pkey primary key (id),
  constraint collaborators_email_key unique (email),
  constraint collaborators_role_id_fkey foreign KEY (role_id) references roles (id),
  constraint collaborators_user_id_fkey foreign KEY (user_id) references users (user_id)
) TABLESPACE pg_default;

create table public.permissions_collaborators (
  id uuid not null default gen_random_uuid (),
  "canViewSidebar" jsonb null,
  "canViewKanban" jsonb null,
  created_at timestamp with time zone not null default now(),
  role_id uuid null,
  constraint permissions_pkey primary key (id),
  constraint permissions_collaborators_role_id_fkey foreign KEY (role_id) references roles (id)
) TABLESPACE pg_default;

//eventos
create table public.discount_event (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  value numeric null,
  type text null,
  created_at timestamp with time zone not null default now(),
  min numeric null,
  constraint discount_event_pkey primary key (id),
  constraint discount_event_event_id_fkey foreign KEY (event_id) references fluxes_events (id)
) TABLESPACE pg_default;

create table public.registrations_events (
  id uuid not null default gen_random_uuid (),
  form_data jsonb not null,
  status text null default 'pending'::text,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone null default (now() AT TIME ZONE 'America/Sao_Paulo'::text),
  user_id uuid not null,
  qr_code text null,
  payment_id text null,
  present boolean null default false,
  present_at timestamp with time zone null,
  event_id uuid null,
  type text not null,
  number text null,
  email text null,
  price numeric null,
  coupon text null,
  "useCoupon" boolean null default false,
  name text null,
  present_online boolean null default false,
  send_email boolean null default false,
  constraint fluxes_registrations_pkey primary key (id),
  constraint fluxes_registrations_event_id_fkey foreign KEY (event_id) references eventos (id),
  constraint fluxes_registrations_user_id_fkey foreign KEY (user_id) references users (id)
) TABLESPACE pg_default;

create table public.curses_event (
  id uuid not null default gen_random_uuid (),
  event_id uuid null,
  name text null,
  type text null,
  inicio timestamp with time zone null,
  fim timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  price numeric null,
  descricao text null,
  photo text null,
  "limit" numeric null default '18'::numeric,
  constraint curses_event_pkey primary key (id),
  constraint curses_event_event_id_fkey foreign KEY (event_id) references fluxes_events (id)
) TABLESPACE pg_default;

create table public.cursos_registrations (
  id uuid not null default gen_random_uuid (),
  curso_id uuid null,
  registration_id uuid null,
  created_at timestamp with time zone not null default now(),
  constraint cursos_registrations_pkey primary key (id),
  constraint cursos_registrations_curso_id_fkey foreign KEY (curso_id) references curses_event (id),
  constraint cursos_registrations_registration_id_fkey foreign KEY (registration_id) references registrations_events (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.curses_presence (
  id uuid not null default gen_random_uuid (),
  curso_id uuid not null,
  registration_id uuid not null,
  created_at timestamp with time zone null default now(),
  curso_registration_id uuid null,
  constraint curses_presence_pkey primary key (id),
  constraint unique_presence unique (curso_id, registration_id),
  constraint curses_presence_curso_registration_id_fkey foreign KEY (curso_registration_id) references cursos_registrations (id),
  constraint fk_curso foreign KEY (curso_id) references curses_event (id) on delete CASCADE,
  constraint fk_registration foreign KEY (registration_id) references fluxes_registrations (id) on delete CASCADE
) TABLESPACE pg_default;

//Equipe

create table public.definicoes_campos (
    id uuid default gen_random_uuid() primary key,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    nome_campo text not null unique, -- Nome técnico interno (ex: "linkedin", "cpf")
    label text not null,             -- Nome exibido na interface (ex: "LinkedIn", "CPF")
    tipo_campo text not null default 'text', -- 'text', 'number', 'date', 'boolean'
    obrigatorio boolean default false
);

create table public.membros (
    id uuid default gen_random_uuid() primary key,
    criado_em timestamp with time zone default timezone('utc'::text, now()) not null,
    nome text not null,
    email text not null unique,
    telefone text,
    universidade text,
    curso text,
    data_ingresso date not null default current_date,
    
    -- Coluna JSONB para armazenar valores dos campos dinâmicos de forma flexível.
    -- Exemplo de formato: {"linkedin": "https://linkedin.com/in/...", "cpf": "123.456.789-00"}
    campos_personalizados jsonb default '{}'::jsonb not null
);

-- 3. POLÍTICAS DE SEGURANÇA (RLS - Row Level Security)
-- Por padrão, habilitamos o RLS nas tabelas por segurança
alter table public.definicoes_campos enable row level security;
alter table public.membros enable row level security;

-- Criar políticas públicas de acesso total (Ideal para desenvolvimento inicial. 
-- Em produção, substitua pela autenticação de usuários apropriada)
create policy "Acesso público total para definicoes_campos" 
    on public.definicoes_campos for all 
    using (true) 
    with check (true);

create policy "Acesso público total para membros" 
    on public.membros for all 
    using (true) 
    with check (true);


-- Criar tabela de atas de reunião
create table meeting_minutes (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  date date not null default current_date,
  location text,
  facilitator text not null,
  recorder text not null,
  attendees text[] not null default '{}',
  agenda text not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de itens de ação vinculados à ata
create table action_items (
  id uuid default gen_random_uuid() primary key,
  meeting_id uuid references meeting_minutes(id) on delete cascade not null,
  task text not null,
  assignee_name text not null,
  assignee_email text,
  due_date date,
  status text not null default 'Pendente' check (status in ('Pendente', 'Em Andamento', 'Concluído')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar leitura pública para propósitos de teste (ajuste conforme suas regras de RLS)
alter table meeting_minutes enable row level security;
alter table action_items enable row level security;

create policy "Permitir leitura pública de atas" on meeting_minutes for select using (true);
create policy "Permitir inserção pública de atas" on meeting_minutes for insert with check (true);
create policy "Permitir exclusão pública de atas" on meeting_minutes for delete using (true);

create policy "Permitir leitura pública de ações" on action_items for select using (true);
create policy "Permitir inserção pública de ações" on action_items for insert with check (true);
create policy "Permitir atualização pública de ações" on action_items for update using (true);
create policy "Permitir exclusão pública de ações" on action_items for delete using (true);