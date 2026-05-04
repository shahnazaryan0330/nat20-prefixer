import type { AtRule, Declaration, Node, Plugin, Rule } from "postcss";

function isKeyframesAtRule(at: AtRule): boolean {
  const n = at.name.toLowerCase();
  if (n === "keyframes") {
    return true;
  }
  return /^-[\w]+-keyframes$/.test(n);
}

function ruleInsideKeyframes(rule: Rule): boolean {
  let p: Node | undefined = rule.parent;
  while (p) {
    if (p.type === "atrule" && isKeyframesAtRule(p as AtRule)) {
      return true;
    }
    p = p.parent;
  }
  return false;
}

function stripImportant(value: string): { core: string; important: boolean } {
  const m = /\s*!important\s*$/i.exec(value);
  if (m && m.index !== undefined) {
    return { core: value.slice(0, m.index).trim(), important: true };
  }
  return { core: value.trim(), important: false };
}

/** Only literal 1 / 0 (and 100% / 0% as full opacity / full transparency). */
function classifyOpacity(core: string): "zero" | "one" | "other" {
  const v = core.trim().toLowerCase();
  if (/^(0(\.0+)?|0%)$/.test(v)) {
    return "zero";
  }
  if (/^(1(\.0+)?|100%)$/.test(v)) {
    return "one";
  }
  return "other";
}

function directDecls(rule: Rule): Declaration[] {
  const out: Declaration[] = [];
  for (const node of rule.nodes) {
    if (node.type === "decl") {
      out.push(node as Declaration);
    }
  }
  return out;
}

function visibilityTargets(
  decls: Declaration[]
): { opacity?: Declaration; visibility: Declaration[] } {
  let opacity: Declaration | undefined;
  const visibility: Declaration[] = [];
  for (const d of decls) {
    const p = d.prop.toLowerCase();
    if (p === "opacity") {
      opacity = d;
    } else if (p === "visibility") {
      visibility.push(d);
    }
  }
  return { opacity, visibility };
}

function sameVisibility(a: string, b: string): boolean {
  return a.trim().replace(/\s+/g, " ") === b.trim().replace(/\s+/g, " ");
}

/**
 * Only inside `@keyframes` (and vendor-prefixed variants):
 * `opacity: 1` → `visibility: visible`, `opacity: 0` → `visibility: hidden`.
 * Only direct declarations in a rule block (not nested selectors).
 */
export const postcssOpacityVisibility: Plugin = {
  postcssPlugin: "postcss-opacity-visibility",
  Rule(rule: Rule) {
    const decls = directDecls(rule);
    const { opacity: opacityDecl, visibility: visDecls } =
      visibilityTargets(decls);
    if (!opacityDecl) {
      return;
    }

    const { core, important } = stripImportant(opacityDecl.value);
    const kind = classifyOpacity(core);
    if (kind === "other") {
      return;
    }

    if (!ruleInsideKeyframes(rule)) {
      return;
    }

    const vis = kind === "one" ? "visible" : "hidden";
    const visValue = important ? `${vis} !important` : vis;

    if (visDecls.length > 0) {
      const last = visDecls[visDecls.length - 1];
      for (let i = 0; i < visDecls.length - 1; i++) {
        visDecls[i].remove();
      }
      if (sameVisibility(last.value, visValue)) {
        return;
      }
      last.value = visValue;
      return;
    }

    opacityDecl.cloneAfter({ prop: "visibility", value: visValue });
  },
};
