# BaoBuildBuddy Local AI Setup Guide

This is the non-technical walkthrough for people who want BaoBuildBuddy to use AI on their own computer instead of starting with a cloud API key.

If you want the shortest version:

1. Install Ollama from [ollama.com/download](https://ollama.com/download/).
2. Follow the official [Ollama Quickstart](https://docs.ollama.com/quickstart) if you want the vendor's version first.
3. Download one model with `ollama pull llama3.2`.
4. Open BaoBuildBuddy and go to **Settings > AI Providers**.
5. Set the local endpoint to `http://localhost:11434/v1`, leave the model blank for auto-detect, then test and save.

## What "local AI" means

In plain English:

- Ollama runs the AI engine on your computer.
- BaoBuildBuddy talks to Ollama over your local network.
- Your app can use AI features without sending every request to a cloud provider.

## Who this guide is for

Use this guide if any of these sound like you:

- "I want the simplest path."
- "I do not want to start with API keys."
- "I want to test BaoBuildBuddy with AI on my own machine first."

If you want the big-picture explanation first, read [ELI5 System Walkthrough](./ELI5_SYSTEM_WALKTHROUGH.md).

If you want the full project setup guide, read [STARTER_GUIDE.md](./STARTER_GUIDE.md).

## Before you start

Make sure:

- BaoBuildBuddy is already installed or cloned.
- You can open the app locally.
- You have an internet connection for the first Ollama install and model download.
- You have enough free disk space for at least one model.

## Step 1: Install Ollama

Open the official Ollama download page and install the version for your operating system:

- [Ollama Download](https://ollama.com/download/)

If you prefer the official getting-started guide from Ollama, use:

- [Ollama Quickstart](https://docs.ollama.com/quickstart)

## Step 2: Start Ollama

On macOS or Windows, opening the Ollama app is usually enough.

On Linux, you may need to start it from a terminal:

```bash
ollama serve
```

If Ollama is already running, you do not need to start it again.

## Step 3: Download your first model

If you just want one safe first choice for BaoBuildBuddy, use:

```bash
ollama pull llama3.2
```

You can also try one of the other models already suggested by the app:

- `granite-code`
- `mistral`

## Step 4: Check that Ollama works

Run this in a terminal:

```bash
ollama run llama3.2
```

If you see a prompt and can ask a question, Ollama is working.

Type `/bye` or press `Ctrl+C` when you want to exit.

## Step 5: Connect BaoBuildBuddy to Ollama

Open BaoBuildBuddy, then:

1. Go to **Settings**.
2. Open **AI Providers**.
3. Find the local AI section.
4. Enter `http://localhost:11434/v1` as the endpoint if it is not already filled in.
5. Leave the model field blank if you want BaoBuildBuddy to auto-detect the first available local model.
6. If you prefer to lock it to one model, enter `llama3.2`.
7. Use the test button.
8. Save your settings.

The app defaults already match Ollama's local OpenAI-compatible endpoint, so many users only need to install Ollama and test the connection.

## Step 6: Try a real feature

After saving your local AI settings, test one of these:

- Open **AI Chat** and ask a simple question.
- Open **Resume** and try a draft or review action.
- Open **Interview** and generate a practice prompt.

If one of those works, your local AI setup is complete.

## If something does not work

### BaoBuildBuddy says it cannot reach the local model

Check these first:

- Ollama is running.
- The endpoint is `http://localhost:11434/v1`.
- You clicked the test button after saving.

### The connection works but replies fail

Usually this means the model is not downloaded yet.

Run:

```bash
ollama pull llama3.2
```

Then try again.

### The model field is empty

That is allowed in BaoBuildBuddy.

The app can auto-detect the model from your local Ollama server when the endpoint is set and the server returns available models.

### It feels slow

That is normal on the first run.

The first request may need time to load the model into memory. Later requests are usually faster.

## Official references

- [Ollama Download](https://ollama.com/download/)
- [Ollama Quickstart](https://docs.ollama.com/quickstart)

## Read next

- [STARTER_GUIDE.md](./STARTER_GUIDE.md)
- [ELI5_SYSTEM_WALKTHROUGH.md](./ELI5_SYSTEM_WALKTHROUGH.md)
- [README.md](../README.md)
