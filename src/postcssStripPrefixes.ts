import type { AtRule, Container, Declaration, Plugin, Root } from "postcss";

const VENDOR_PROP = /^-(webkit|moz|ms|o)-(.+)$/i;

function bareFromPrefixedProp(prop: string): string | null {
  const m = VENDOR_PROP.exec(prop);
  return m ? m[2] : null;
}

function isVendorPrefixedProp(prop: string): boolean {
  return VENDOR_PROP.test(prop);
}

function directDeclarations(container: Container): Declaration[] {
  const out: Declaration[] = [];
  if (!container.nodes) {
    return out;
  }
  for (const node of container.nodes) {
    if (node.type === "decl") {
      out.push(node as Declaration);
    }
  }
  return out;
}

function hasUnprefixedBareSibling(
  container: Container,
  bareLower: string,
  skip: Declaration
): boolean {
  for (const d of directDeclarations(container)) {
    if (d === skip) {
      continue;
    }
    if (isVendorPrefixedProp(d.prop)) {
      continue;
    }
    if (d.prop.toLowerCase() === bareLower) {
      return true;
    }
  }
  return false;
}

/** Keep the last declaration when duplicate property names appear (case-insensitive). */
function dedupeDeclarationsInContainer(container: Container): void {
  const decls = directDeclarations(container);
  if (decls.length < 2) {
    return;
  }
  const lastByProp = new Map<string, Declaration>();
  for (const d of decls) {
    lastByProp.set(d.prop.toLowerCase(), d);
  }
  if (lastByProp.size === decls.length) {
    return;
  }
  for (const d of decls) {
    if (lastByProp.get(d.prop.toLowerCase()) !== d) {
      d.remove();
    }
  }
}

/**
 * Strips `-webkit-` / `-moz-` / `-ms-` / `-o-` from property names and `@-*-keyframes` at-rule names.
 * If an unprefixed property already exists, the prefixed declaration is removed; otherwise rename and dedupe.
 */
export const postcssStripPrefixes: Plugin = {
  postcssPlugin: "postcss-strip-prefixes",
  OnceExit(root: Root) {
    root.walkAtRules((at) => {
      if (/^-(webkit|moz|ms|o)-keyframes$/i.test(at.name)) {
        at.name = "keyframes";
      }
    });

    const redundant: Declaration[] = [];
    root.walkDecls((decl) => {
      const bare = bareFromPrefixedProp(decl.prop);
      if (!bare) {
        return;
      }
      const parent = decl.parent as Container | undefined;
      if (!parent?.nodes) {
        return;
      }
      if (hasUnprefixedBareSibling(parent, bare.toLowerCase(), decl)) {
        redundant.push(decl);
      }
    });
    for (const d of redundant) {
      d.remove();
    }

    root.walkDecls((decl) => {
      const bare = bareFromPrefixedProp(decl.prop);
      if (bare) {
        decl.prop = bare;
      }
    });

    root.walk((node) => {
      if (node.type === "rule" || node.type === "atrule") {
        dedupeDeclarationsInContainer(node as Container);
      }
    });
  },
};
