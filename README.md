# Lead Strutture - Setup rapido

## gest alc

###### By Denco

## 1) Crea progetto Supabase (gratis)
1. Vai su https://supabase.com e crea un nuovo progetto.
2. Nel progetto, apri **SQL Editor** e incolla il contenuto di `supabase.sql`.
3. Vai su **Authentication > Users** e crea 3 utenti:
   - `davide@azienda.it`
   - `alessio@azienda.it`
   - `lorenzo@azienda.it`

## 2) Inserisci le chiavi nel frontend
1. Vai su **Project Settings > API**.
2. Copia **Project URL** e **anon public key**.
3. Apri `app.js` e sostituisci:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

## 3) Pubblica gratis (sempre online)
Opzione semplice: **Netlify**
1. Vai su https://www.netlify.com
2. Crea un sito da una cartella (drag & drop) caricando questi file:
   - `index.html`
   - `styles.css`
   - `app.js`
3. Otterrai un link gratuito sempre attivo.

Opzione alternativa: **Vercel**
1. Vai su https://vercel.com
2. Crea un nuovo progetto “Static” caricando la cartella.

## 4) Uso
- Ogni utente vede solo i propri lead.
- Cambia lo stato per colorare la riga.

## Cache busting (opzionale)
Per evitare che il browser mostri file vecchi, puoi incrementare la versione:

```bash
./scripts/bump-version.sh
```

Oppure, per pubblicare tutto in un colpo solo:

```bash
./scripts/publish.sh "Messaggio commit"
```
