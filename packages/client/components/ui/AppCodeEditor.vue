<script setup lang="ts">
import { json } from "@codemirror/lang-json";
import { css } from "@codemirror/lang-css";
import { markdown } from "@codemirror/lang-markdown";
import { defaultKeymap, history, historyKeymap, redo, undo } from "@codemirror/commands";
import { bracketMatching, defaultHighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { linter, lintGutter } from "@codemirror/lint";
import { highlightSelectionMatches, openSearchPanel, searchKeymap } from "@codemirror/search";
import { EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder as cmPlaceholder,
} from "@codemirror/view";
import { safeParseJson } from "@bao/shared/utils/json";
import { useI18n } from "vue-i18n";
import {
  EDITOR_HOST_CLASS,
  EDITOR_MIN_HEIGHT_CLASS,
  EDITOR_PROSE_MODES,
  type EditorMode,
} from "~/constants/editor";

const props = withDefaults(
  defineProps<{
    readonly modelValue: string;
    readonly mode: EditorMode;
    readonly ariaLabel: string;
    readonly placeholder?: string;
    readonly readonly?: boolean;
    readonly minHeightClass?: string;
  }>(),
  {
    placeholder: "",
    readonly: false,
    minHeightClass: EDITOR_MIN_HEIGHT_CLASS,
  },
);

const { t } = useI18n();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const hostRef = ref<HTMLDivElement | null>(null);
let view: EditorView | null = null;

const jsonParseLinter = linter((viewState) => {
  const text = viewState.state.doc.toString();
  if (text.trim().length === 0) {
    return [];
  }
  if (safeParseJson(text) !== null) {
    return [];
  }
  return [
    {
      from: 0,
      to: Math.min(text.length, Math.max(1, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"))),
      severity: "error",
      message: t("editor.jsonInvalid"),
    },
  ];
});

const baoTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "0.875rem",
    backgroundColor: "var(--color-base-100)",
    color: "var(--color-base-content)",
  },
  ".cm-content": {
    caretColor: "var(--color-primary)",
    fontFamily: "var(--font-sans, ui-sans-serif, system-ui, sans-serif)",
    padding: "0.75rem",
  },
  "&.cm-focused": {
    outline: "2px solid var(--color-primary)",
    outlineOffset: "0",
  },
  ".cm-gutters": {
    backgroundColor: "var(--color-base-200)",
    color: "var(--color-base-content)",
    borderRight: "1px solid var(--color-base-300)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in oklab, var(--color-primary) 8%, transparent)",
  },
  ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
    backgroundColor: "color-mix(in oklab, var(--color-primary) 28%, transparent)",
  },
});

const monoTheme = EditorView.theme({
  ".cm-content": {
    fontFamily: "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
  },
});

function languageExtensions(mode: EditorMode): Extension[] {
  if (mode === "json") {
    return [json(), lintGutter(), jsonParseLinter];
  }
  if (mode === "css") {
    return [css()];
  }
  if (mode === "markdown") {
    return [markdown()];
  }
  return [];
}

function buildExtensions(): Extension[] {
  const isProse = EDITOR_PROSE_MODES.includes(props.mode);
  const extensions: Extension[] = [
    history(),
    highlightActiveLine(),
    highlightSelectionMatches(),
    bracketMatching(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    baoTheme,
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        emit("update:modelValue", update.state.doc.toString());
      }
    }),
    EditorView.editorAttributes.of({
      "aria-label": props.ariaLabel,
      role: "textbox",
    }),
  ];
  if (!isProse) {
    extensions.push(lineNumbers(), monoTheme);
  }
  extensions.push(...languageExtensions(props.mode));
  if (props.placeholder) {
    extensions.push(cmPlaceholder(props.placeholder));
  }
  if (props.readonly) {
    extensions.push(EditorState.readOnly.of(true));
  }
  return extensions;
}

function mountEditor(): void {
  if (!hostRef.value || view) {
    return;
  }
  view = new EditorView({
    parent: hostRef.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: buildExtensions(),
    }),
  });
}

function openFind(): void {
  if (view) {
    openSearchPanel(view);
  }
}

function runUndo(): void {
  if (view) {
    undo(view);
  }
}

function runRedo(): void {
  if (view) {
    redo(view);
  }
}

watch(
  () => props.modelValue,
  (next) => {
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (next === current) {
      return;
    }
    view.dispatch({
      changes: { from: 0, to: current.length, insert: next },
    });
  },
);

onMounted(() => {
  mountEditor();
});

onBeforeUnmount(() => {
  view?.destroy();
  view = null;
});

defineExpose({
  openFind,
  runUndo,
  runRedo,
  focus: () => view?.focus(),
});
</script>

<template>
  <div
    ref="hostRef"
    :class="[EDITOR_HOST_CLASS, minHeightClass]"
    data-testid="app-code-editor"
  />
</template>
