import { ViewPlugin, type ViewUpdate } from "@codemirror/view";
import type { Extension } from "@codemirror/state";

/**
 * Same-origin multi-tab collab via BroadcastChannel.
 * Honest local collab (not cloud Yjs). Last-write-wins on remote updates.
 */
export const createEditorCollabExtension = (channelName: string): Extension =>
  ViewPlugin.fromClass(
    class {
      private channel: BroadcastChannel | null = null;
      private applyingRemote = false;
      private lastSent = "";

      constructor(readonly view: import("@codemirror/view").EditorView) {
        if (typeof BroadcastChannel === "undefined") {
          return;
        }
        this.channel = new BroadcastChannel(channelName);
        this.channel.onmessage = (event: MessageEvent<{ text?: string }>) => {
          const text = event.data?.text;
          if (typeof text !== "string") {
            return;
          }
          const current = this.view.state.doc.toString();
          if (text === current) {
            return;
          }
          this.applyingRemote = true;
          this.view.dispatch({
            changes: { from: 0, to: current.length, insert: text },
          });
          this.applyingRemote = false;
        };
      }

      update(update: ViewUpdate): void {
        if (!this.channel || !update.docChanged || this.applyingRemote) {
          return;
        }
        const next = update.state.doc.toString();
        if (next === this.lastSent) {
          return;
        }
        this.lastSent = next;
        this.channel.postMessage({ text: next });
      }

      destroy(): void {
        this.channel?.close();
        this.channel = null;
      }
    },
  );
