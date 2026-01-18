-- Tabelle e regole per i lead personali

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  nome_struttura text not null,
  telefono text not null,
  occupazione text not null,
  prezzo_medio text not null,
  altre_strutture text not null,
  info text not null,
  citta text not null,
  booking_link text not null,
  caricato_da text not null,
  data_attivazione date,
  tipo_tariffa text,
  report_statistiche text,
  report_incassi text,
  report_statistiche_inviato text,
  report_incassi_inviato text,
  data_prossimo_report_statistiche date,
  data_prossimo_report_incassi date,
  data_report_incassi date,
  invio_contratto text,
  ultima_data_contatto date,
  info_extra text,
  report_mesi jsonb not null default '{}'::jsonb,
  report_mesi_statistiche jsonb not null default '{}'::jsonb,
  report_mesi_incassi jsonb not null default '{}'::jsonb,
  status text not null default 'nuovo',
  created_at timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "Lead visibili a tutti gli utenti autenticati"
  on public.leads
  for select
  using (auth.uid() is not null);

create policy "Lead inseriti da utenti autenticati"
  on public.leads
  for insert
  with check (auth.uid() is not null);

create policy "Lead aggiornati da utenti autenticati"
  on public.leads
  for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "Lead eliminati da utenti autenticati"
  on public.leads
  for delete
  using (auth.uid() is not null);
