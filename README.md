# Quizdian

An Obsidian plugin that generates quizzes directly from your notes —
multiple choice and fill-in-the-blank, grounded in what you've actually
written, gradeable, shareable by code, and remembered locally as history.
Companion to [Quizora](../quizora), the web app and RAG backend this plugin
calls into.

## Why a plugin, not just the web app

The web app requires uploading a file before it can generate anything.
Quizdian skips that step entirely — it reads a note (or several) straight
out of your vault and sends the raw text directly to the backend, no
upload, no Pinecone/embedding step needed for a single note's worth of
content. Both share the same backend, so a quiz made in either place is
retrievable from either place by its code.

## Features

- **Select notes** — multi-select with search/filter, combines several
  notes' content into one quiz if more than one is checked
- **Generate quiz from this note** — a command (⌘/Ctrl+P) that works on
  whatever note is currently open, no picker needed
- **Join a quiz** by code — looks it up, shows title/question
  count/code for confirmation before joining
- **Review before saving** — a quiz is generated and shown with a title
  field and its shareable code before you commit to it; nothing is lost if
  you close the dialog, since the save already happened, but you're free to
  rename it
- **Question cards** — MCQ and fill-in-the-blank, in their own workspace
  tab (not a popup), with Back/Next, Enter-to-advance on fill-in-blank, and
  the quiz code visible + click-to-copy throughout
- **Grading** — MCQ compared instantly, client-side, no API call.
  Fill-in-blank batched into one call to the backend's `/api/grade`, judged
  semantically (so "database sharding" and "sharding" both count correct)
- **Score screen** — total, missed questions with the correct answer shown,
  Retake and Back to home
- **History** — every quiz you've generated or joined, stored locally per
  vault (Obsidian's own plugin data, `data.json` — never sent anywhere),
  shown on the home view, click to jump straight back in offline
- **Settings tab** — configurable backend URL, so this can point at
  `localhost:3000` during development or a real deployed URL in normal use

## Setup

1. Clone this repo into `YourVault/.obsidian/plugins/quizdian/`, or build
   elsewhere and copy just `main.js`, `manifest.json`, and `styles.css`
   into that folder.
2. `npm install`
3. `npm run dev` — builds `main.js` in watch mode (esbuild).
4. In Obsidian: Settings → Community plugins → turn off **Restricted mode**
   if it's on → find "Quizdian" in the installed list → enable it.
5. Open Settings → Quizdian, and set **Backend URL** to wherever the
   Quizora backend is running (`http://localhost:3000` for local
   development, or your deployed Vercel URL).

Obsidian does **not** auto-reload a plugin when `main.js` changes — after
each edit, toggle Quizdian off and on in Community plugins (or install the
community "Hot Reload" plugin to automate this).

## Architecture

```
Obsidian (Quizdian plugin)              Quizora backend (Next.js, deployed)
─────────────────────────               ──────────────────────────────────
Read note(s) from vault
        │
        ▼
POST /api/generate-from-text  ────────▶  Groq generates questions,
        │                                grounded in the note text sent
        ◀────────────────────────────    (no retrieval step — the note
        │                                 IS the context)
        ▼
POST /api/save-quiz  ─────────────────▶  Random 4-3-4 code, inserted
        │                                into Postgres
        ◀────────────────────────────
        ▼
GET /api/quiz/[code]  ─────────────────▶  (used by "Join a quiz")
PATCH /api/quiz/[code] ────────────────▶  (used when editing a saved title)
POST /api/grade  ──────────────────────▶  Semantic grading for
                                          fill-in-blank answers only
```

Every route above has CORS enabled (`Access-Control-Allow-Origin: "*"` +
an `OPTIONS` handler), since the plugin runs from Obsidian's own origin
(`app://obsidian.md`), not the web app's origin — without it, every fetch
call from the plugin fails a preflight check before it's even sent.

## Project structure

```
src/
  main.ts                   # plugin entry: registers views, ribbon icon,
                              # the "Generate quiz from this note" command,
                              # loads/saves settings + history (data.json)
  settings.ts                # settings tab — backend URL field
  HomeView.ts                 # the plugin's home tab: Select notes /
                              # Join quiz buttons + History list
  MultiNoteSelectModal.ts     # checkbox note picker with search/filter
  GenerateOptionsModal.ts      # "how many questions" prompt
  GeneratingModal.ts            # loading spinner shown during generation
  SaveQuizModal.ts               # shows title/code after auto-save,
                                   # title is editable (PATCHes the backend)
  JoinQuizModal.ts                 # code entry -> preview -> join
  QuizView.ts                       # the actual quiz-taking tab: question
                                     # cards, grading, score screen
```

## Known limitations

- No offline generation — every "Generate quiz" or "Join quiz" action needs
  the backend reachable. History lets you *retake* a previously loaded quiz
  fully offline, since the questions are cached locally once loaded.
- `Access-Control-Allow-Origin: "*"` on the backend is intentionally
  permissive for development; worth tightening to an explicit allowlist
  before wide distribution.
- Not yet submitted to Obsidian's community plugin directory — currently
  installed manually (see Setup). Submission requires: no "Obsidian" in
  `manifest.json`'s description, `this.app` used throughout (not the global
  `app`), no stray `console.log` calls, and a PR adding this repo to
  `obsidian-releases/community-plugins.json`.

## Backend

This plugin has no logic of its own beyond reading notes and rendering UI —
every actual capability (chunking, embeddings, retrieval, LLM generation,
grading, PDF export, the code-based share system) lives in the Quizora
backend. See that repo's README for the full RAG pipeline, environment
variables, and deployment instructions.