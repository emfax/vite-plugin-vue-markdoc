import { Tag } from "@markdoc/markdoc";
import type { Node, Schema } from "@markdoc/markdoc";

export const link = {
  attributes: {
    href: String,
    title: String,
  },

  transform(node, config) {
    const children = node.transformChildren(config);

    const { tag, attributes } = linker(node);

    return new Tag(tag, attributes, children);
  },
} as Schema;

function linker(node: Node): { tag: string, attributes: Record<string, string> } {
  const href = node.attributes.href;

  if (/^http/i.test(href)) {
    return {
      tag: "a",
      attributes: { ...node.attributes, target: "_blank" },
    };
  }

  if (href.endsWith(".md")) {
    return {
      tag: "router-link",
      attributes: { to: href.slice(0, -3).replace(/readme/i, '') },
    };
  }
}
