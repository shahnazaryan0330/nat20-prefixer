import * as vscode from "vscode";
import autoprefixer from "autoprefixer";
import postcss from "postcss";
import postcssLess from "postcss-less";
import postcssScss from "postcss-scss";
import { postcssOpacityVisibility } from "./postcssOpacityVisibility";
import { postcssStripPrefixes } from "./postcssStripPrefixes";

/** Tailwind IntelliSense often sets languageId `tailwindcss` instead of `css`. */
const SUPPORTED = new Set([
  "css",
  "scss",
  "less",
  "postcss",
  "tailwindcss",
]);

function fullDocumentRange(doc: vscode.TextDocument): vscode.Range {
  const last = doc.lineAt(doc.lineCount - 1);
  return new vscode.Range(new vscode.Position(0, 0), last.range.end);
}

function isSupported(languageId: string): boolean {
  return SUPPORTED.has(languageId);
}

function getBrowserslist(): string {
  const raw = vscode.workspace
    .getConfiguration("nat20Prefixer")
    .get<string>("browserslist");
  const q = raw?.trim();
  return q && q.length > 0
    ? q
    : "> 0.5%, last 2 versions, Firefox ESR, not dead";
}

function getPrefixOnSave(): boolean {
  return !!vscode.workspace
    .getConfiguration("nat20Prefixer")
    .get<boolean>("prefixOnSave");
}

function postcssSyntax(languageId: string) {
  if (languageId === "scss") {
    return postcssScss;
  }
  if (languageId === "less") {
    return postcssLess;
  }
  return undefined;
}

async function prefixSource(
  source: string,
  languageId: string,
  browserslist: string
): Promise<string> {
  const syntax = postcssSyntax(languageId);
  const processor = postcss([
    postcssOpacityVisibility,
    autoprefixer({ overrideBrowserslist: browserslist }),
  ]);
  const result = await processor.process(source, {
    from: undefined,
    ...(syntax ? { syntax } : {}),
  });
  return result.css;
}

async function stripPrefixesSource(
  source: string,
  languageId: string
): Promise<string> {
  const syntax = postcssSyntax(languageId);
  const result = await postcss([postcssStripPrefixes]).process(source, {
    from: undefined,
    ...(syntax ? { syntax } : {}),
  });
  return result.css;
}

async function stripPrefixesDocumentEdits(
  doc: vscode.TextDocument
): Promise<vscode.TextEdit[]> {
  if (!isSupported(doc.languageId)) {
    return [];
  }
  const text = doc.getText();
  let out: string;
  try {
    out = await stripPrefixesSource(text, doc.languageId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    vscode.window.showErrorMessage(`Nat20 Prefixer: ${msg}`);
    return [];
  }
  if (out === text) {
    return [];
  }
  const full = doc.validateRange(fullDocumentRange(doc));
  return [vscode.TextEdit.replace(full, out)];
}

async function prefixDocumentEdits(
  doc: vscode.TextDocument
): Promise<vscode.TextEdit[]> {
  if (!isSupported(doc.languageId)) {
    return [];
  }
  const text = doc.getText();
  const browsers = getBrowserslist();
  let out: string;
  try {
    out = await prefixSource(text, doc.languageId, browsers);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    vscode.window.showErrorMessage(`Nat20 Prefixer: ${msg}`);
    return [];
  }
  if (out === text) {
    return [];
  }
  const full = doc.validateRange(fullDocumentRange(doc));
  return [vscode.TextEdit.replace(full, out)];
}

function unsupportedLanguageMessage(languageId: string): string {
  return (
    "Nat20 Prefixer: Only CSS, SCSS, Less, PostCSS, and Tailwind CSS are supported " +
    `(current language: "${languageId}"). Use "Change Language Mode" if needed.`
  );
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("nat20-prefixer.prefixDocument", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("Nat20 Prefixer: No active editor.");
        return;
      }
      if (!isSupported(editor.document.languageId)) {
        vscode.window.showInformationMessage(
          unsupportedLanguageMessage(editor.document.languageId)
        );
        return;
      }
      const edits = await prefixDocumentEdits(editor.document);
      if (edits.length === 0) {
        vscode.window.showInformationMessage(
          "Nat20 Prefixer: No changes — for the current Browserslist no prefixes are needed, " +
            "or opacity is not 0/1, or visibility tweaks are not applied outside @keyframes. " +
            "Try a property such as user-select or tighten nat20Prefixer.browserslist."
        );
        return;
      }
      const ok = await editor.edit((b) => {
        for (const e of edits) {
          b.replace(e.range, e.newText);
        }
      });
      if (!ok) {
        vscode.window.showWarningMessage(
          "Nat20 Prefixer: The editor did not apply the edit (possible version conflict or read-only file)."
        );
        return;
      }
      vscode.window.setStatusBarMessage("Nat20 Prefixer: Prefixes updated.", 2500);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("nat20-prefixer.prefixSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("Nat20 Prefixer: No active editor.");
        return;
      }
      if (!isSupported(editor.document.languageId)) {
        vscode.window.showInformationMessage(
          unsupportedLanguageMessage(editor.document.languageId)
        );
        return;
      }
      const sel = editor.selection;
      const chunk = editor.document.getText(sel);
      if (!chunk.trim()) {
        vscode.window.showInformationMessage("Nat20 Prefixer: Select a CSS fragment.");
        return;
      }
      let out: string;
      try {
        out = await prefixSource(chunk, editor.document.languageId, getBrowserslist());
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(`Nat20 Prefixer: ${msg}`);
        return;
      }
      if (out === chunk) {
        vscode.window.showInformationMessage(
          "Nat20 Prefixer: No changes for the selection (prefixes / opacity→visibility only inside @keyframes)."
        );
        return;
      }
      const ok = await editor.edit((b) => b.replace(sel, out));
      if (!ok) {
        vscode.window.showWarningMessage("Nat20 Prefixer: Could not apply the edit to the selection.");
        return;
      }
      vscode.window.setStatusBarMessage("Nat20 Prefixer: Selection updated.", 2500);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("nat20-prefixer.stripPrefixesDocument", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("Nat20 Prefixer: No active editor.");
        return;
      }
      if (!isSupported(editor.document.languageId)) {
        vscode.window.showInformationMessage(
          unsupportedLanguageMessage(editor.document.languageId)
        );
        return;
      }
      const edits = await stripPrefixesDocumentEdits(editor.document);
      if (edits.length === 0) {
        vscode.window.showInformationMessage(
          "Nat20 Prefixer: Nothing to strip — no prefixed property names or @keyframes found."
        );
        return;
      }
      const ok = await editor.edit((b) => {
        for (const e of edits) {
          b.replace(e.range, e.newText);
        }
      });
      if (!ok) {
        vscode.window.showWarningMessage(
          "Nat20 Prefixer: The editor did not apply the edit (possible version conflict or read-only file)."
        );
        return;
      }
      vscode.window.setStatusBarMessage("Nat20 Prefixer: Prefixes stripped.", 2500);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("nat20-prefixer.stripPrefixesSelection", async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("Nat20 Prefixer: No active editor.");
        return;
      }
      if (!isSupported(editor.document.languageId)) {
        vscode.window.showInformationMessage(
          unsupportedLanguageMessage(editor.document.languageId)
        );
        return;
      }
      const sel = editor.selection;
      const chunk = editor.document.getText(sel);
      if (!chunk.trim()) {
        vscode.window.showInformationMessage("Nat20 Prefixer: Select a CSS fragment.");
        return;
      }
      let out: string;
      try {
        out = await stripPrefixesSource(chunk, editor.document.languageId);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(`Nat20 Prefixer: ${msg}`);
        return;
      }
      if (out === chunk) {
        vscode.window.showInformationMessage(
          "Nat20 Prefixer: Nothing to strip in the selection (no prefixed properties / @keyframes)."
        );
        return;
      }
      const ok = await editor.edit((b) => b.replace(sel, out));
      if (!ok) {
        vscode.window.showWarningMessage("Nat20 Prefixer: Could not apply the edit to the selection.");
        return;
      }
      vscode.window.setStatusBarMessage("Nat20 Prefixer: Selection: prefixes stripped.", 2500);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument((event) => {
      if (!getPrefixOnSave()) {
        return;
      }
      if (!isSupported(event.document.languageId)) {
        return;
      }
      event.waitUntil(
        (async () => {
          const edits = await prefixDocumentEdits(event.document);
          return edits;
        })()
      );
    })
  );
}

export function deactivate(): void {}
