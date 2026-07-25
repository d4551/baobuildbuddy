# CONTRACT_ESCALATION — Editor UX (2026-07-25)

## Conflict
Writing and JSON power surfaces used raw `<textarea class="font-mono">`, lacking search/lint/history.
External playbooks may push TipTap/Monaco wholesale; product needs CM6 SSOT under Nuxt/daisyUI tokens.

## Resolution (owner_wins)
- **Code/JSON/CSS:** CodeMirror 6 via `AppCodeEditor` (ClientOnly).
- **Prose (cover letter / resume long text):** CM6 plain/markdown, non-mono theme.
- **Chrome:** `AppEditorChrome` + `useEditorChrome` (dirty, autosave, find, undo/redo).
- **Bans:** `!important` in client; new JSON mono textareas outside AppCodeEditor.
- **Non-goals:** Vim, collab, minimap, full IDE command palette.
