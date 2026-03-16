# BaoBuildBuddy -- Explained Like You're 5

This is the picture book version of the system. If the main [README](../README.md) feels like the full game manual, this is the one with diagrams.

If what you really want is "show me how to make local AI work," jump to [Local AI Setup](./LOCAL_AI_SETUP.md).

---

## The tiny version

BaoBuildBuddy is a helper for game-industry job hunting.

- The **client** is the screen you click on.
- The **server** is the manager that decides what should happen.
- The **database** is the notebook that remembers things.
- The **scraper** is the robot that visits job boards and fills out forms.
- The **desktop** app wraps the same system for local installs.
- The **shared** package is the rulebook that keeps every part speaking the same language.

---

## System map

```mermaid
flowchart LR
  Person["You"] --> Client["Nuxt client<br/>pretty screens"]
  Client --> Server["Elysia server<br/>traffic controller"]
  Server --> Database["SQLite database<br/>memory notebook"]
  Server --> AI["AI providers<br/>thinking helper"]
  Server --> Scraper["Playwright scraper/RPA<br/>robot browser"]
  Desktop["Tauri desktop app"] --> Client
  Shared["Shared schemas and types<br/>rulebook"] --> Client
  Shared --> Server
  Shared --> Scraper
```

---

## What happens when you click around

### Opening the app

The Nuxt client renders the page, asks the server for saved data, and the server reads from SQLite.

```mermaid
sequenceDiagram
  participant U as You
  participant C as Nuxt Client
  participant S as Elysia Server
  participant D as SQLite

  U->>C: Open page
  C->>S: Request page data
  S->>D: Read saved records
  D-->>S: Records
  S-->>C: Typed response
  C-->>U: Render page
```

### Asking the AI for help

Your message goes to the server with page context. The server adds business rules, the AI writes a reply, and it comes back as a chat bubble.

```mermaid
sequenceDiagram
  participant U as You
  participant C as Chat UI
  participant S as AI Route
  participant A as AI Provider

  U->>C: Ask a question
  C->>S: Message + route context + focused entity
  S->>A: Prompt with app context
  A-->>S: Reply
  S-->>C: Typed chat response
  C-->>U: Bubble + context chips
```

### Refreshing jobs

The server launches the scraper robot, which visits job sources, normalizes everything into one format, and saves it for a clean list in the UI.

```mermaid
sequenceDiagram
  participant U as You
  participant C as Automation UI
  participant S as Server
  participant R as Scraper Robot
  participant D as SQLite

  U->>C: Click refresh jobs
  C->>S: Start scraper run
  S->>R: Launch provider script
  R-->>S: Normalized jobs
  S->>D: Save jobs
  S-->>C: Run status + results
```

### Applying for a job

The server gathers your resume, job info, and settings. The AI helps map fields. The scraper robot opens the real form, fills it in, captures screenshots, and submits.

```mermaid
flowchart TD
  Start["Start apply run"] --> Gather["Load resume, job, settings"]
  Gather --> AI["Ask AI for field mapping and answer hints"]
  AI --> RPA["Open real form in Playwright"]
  RPA --> Fill["Fill fields, select options, upload resume"]
  Fill --> Shots["Capture screenshots and progress events"]
  Shots --> Save["Persist run output and artifacts"]
  Save --> Review["Show status in automation runs UI"]
```

### Sending an email reply

The AI drafts the message. If delivery is enabled, the server sends it through SMTP.

```mermaid
sequenceDiagram
  participant U as You
  participant C as Email Page
  participant S as Automation Service
  participant A as AI Provider
  participant M as SMTP Service

  U->>C: Generate and send reply
  C->>S: Email request
  S->>A: Draft reply
  A-->>S: Reply text
  S->>M: Deliver with SMTP settings
  M-->>S: Delivered metadata
  S-->>C: Draft + delivery result
```

### Scheduling a task for later

The server saves a `pending` run in the database and sets a timer. If the app restarts, it reloads pending runs and restores timers.

```mermaid
flowchart LR
  Page["Automation page"] --> Route["Schedule route"]
  Route --> DB["automation_runs row<br/>status = pending"]
  DB --> Timer["Local timer"]
  Restart["App restart"] --> DB
  Timer --> Dispatch["Check run type"]
  Dispatch --> Apply["Job apply"]
  Dispatch --> Email["Email reply"]
  Dispatch --> Scrape["Scraper"]
```

---

## Where screenshots come from

The browser robot creates screenshots during automation runs. They're stored in run records and served through the screenshot route.

```mermaid
flowchart LR
  Robot["Playwright automation"] --> Files["Screenshot files"]
  Files --> Run["automation_runs record"]
  Run --> Route["automation-screenshots route"]
  Route --> UI["Run detail page"]
```

---

## Why there are so many packages

Each package owns one job:

| Package              | Responsibility                                |
|----------------------|-----------------------------------------------|
| `packages/client`    | User interface                                |
| `packages/server`    | API, orchestration, persistence               |
| `packages/shared`    | Types, schemas, constants, validation         |
| `packages/scraper`   | Job scraping and RPA browser execution        |
| `packages/desktop`   | Desktop wrapper and installers                |

This split keeps one package from trying to do everything.

---

## The happy path

1. Open the app.
2. Configure settings and AI providers.
3. Refresh jobs from supported sources.
4. Review a job and prepare a resume or cover letter.
5. Run or schedule job-apply, email, or scraper automation.
6. Review screenshots and run history.
7. Generate and optionally deliver follow-up emails.

---

## Something broke -- where to look

| Symptom                           | Check here                         |
|-----------------------------------|------------------------------------|
| UI looks wrong                    | `packages/client`                  |
| Route or API issue                | `packages/server/src/routes`       |
| Data shape mismatch               | `packages/shared`                  |
| Browser automation issue          | `packages/scraper`                 |
| Installer or app shell issue      | `packages/desktop`                 |

---

## What to read next

| Topic                              | Guide                                            |
|------------------------------------|--------------------------------------------------|
| Full technical reference           | [README.md](../README.md)                        |
| Local AI setup                     | [Local AI Setup](./LOCAL_AI_SETUP.md)             |
| First-time setup                   | [Starter Guide](./STARTER_GUIDE.md)              |
| Automation details                 | [Automation Guide](./AUTOMATION.md)               |
