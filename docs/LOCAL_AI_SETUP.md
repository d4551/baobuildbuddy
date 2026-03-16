# Local AI Setup Guide

This guide helps you run AI features on your own computer using Ollama, without needing any cloud API keys.

**The shortest version:**

1. Install Ollama from [ollama.com/download](https://ollama.com/download/).
2. Download a model: `ollama pull llama3.2`
3. Open BaoBuildBuddy > **Settings > AI Providers**.
4. Set the endpoint to `http://localhost:11434/v1`, leave the model blank for auto-detect, then test and save.

---

## What "local AI" means

- Ollama runs the AI engine on your computer.
- BaoBuildBuddy talks to Ollama over your local network.
- Your data stays on your machine -- no cloud requests needed.

---

## Who this guide is for

- "I want the simplest path to get AI working."
- "I don't want to start with API keys."
- "I want to test AI features on my own machine first."

**Other starting points:**
- Big-picture explanation: [ELI5 System Walkthrough](./ELI5_SYSTEM_WALKTHROUGH.md)
- Full project setup: [Starter Guide](./STARTER_GUIDE.md)

---

## Before you start

Make sure:

- BaoBuildBuddy is already installed or cloned
- You can open the app locally
- You have internet for the initial Ollama install and model download
- You have enough disk space for at least one model

---

## Step 1: Install Ollama

Download and install from the official page:

- [Ollama Download](https://ollama.com/download/)
- [Ollama Quickstart](https://docs.ollama.com/quickstart) (vendor's getting-started guide)

## Step 2: Start Ollama

**macOS / Windows:** Opening the Ollama app is usually enough.

**Linux:**
```bash
ollama serve
```

If Ollama is already running, you don't need to start it again.

## Step 3: Download a model

For a safe first choice:

```bash
ollama pull llama3.2
```

Other models that work well with BaoBuildBuddy:
- `granite-code`
- `mistral`

## Step 4: Verify Ollama works

```bash
ollama run llama3.2
```

If you see a prompt and can ask a question, Ollama is working. Type `/bye` or press `Ctrl+C` to exit.

## Step 5: Connect BaoBuildBuddy

1. Open **Settings** in BaoBuildBuddy.
2. Go to **AI Providers**.
3. Enter `http://localhost:11434/v1` as the endpoint (if not already filled in).
4. Leave the model field blank for auto-detect, or enter `llama3.2` to lock to a specific model.
5. Click the test button.
6. Save your settings.

The app defaults already match Ollama's local OpenAI-compatible endpoint, so many users only need to install Ollama and test the connection.

## Step 6: Try a real feature

After saving your settings, test one of these:

- **AI Chat** -- ask a simple question
- **Resume** -- try a draft or review action
- **Interview** -- generate a practice prompt

If any of those works, your local AI setup is complete.

---

## Troubleshooting

### BaoBuildBuddy says it can't reach the local model

- Ollama is running
- The endpoint is `http://localhost:11434/v1`
- You clicked "test" after saving

### The connection works but replies fail

Usually the model isn't downloaded yet:

```bash
ollama pull llama3.2
```

### The model field is empty

That's fine. BaoBuildBuddy auto-detects the model from Ollama when the endpoint is set and the server has models available.

### It feels slow

Normal on the first request. The model needs time to load into memory. Later requests are faster.

---

## Official references

- [Ollama Download](https://ollama.com/download/)
- [Ollama Quickstart](https://docs.ollama.com/quickstart)

---

## What to read next

| Topic                              | Guide                                            |
|------------------------------------|--------------------------------------------------|
| First-time project setup           | [Starter Guide](./STARTER_GUIDE.md)              |
| Plain-English system overview      | [ELI5 System Walkthrough](./ELI5_SYSTEM_WALKTHROUGH.md) |
| Full technical reference           | [README.md](../README.md)                        |
