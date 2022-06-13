import { Tag } from "@markdoc/markdoc";
import type { Node, Schema } from "@markdoc/markdoc";
import slugify from "slugify";

// Or replace this with your own function
function generateID(node: Node, attributes: { [key: string]: unknown }) {
  if (attributes.id && typeof attributes.id === 'string') {
    return attributes.id;
  }

  let id = "";

  for(const child of node.walk()) {
    if (child.type === "inline") continue;

    if (child.type === "text") {
      const text = child.attributes.content as string;

      id = slugify(text);
    }
  }

  return id;
}

export const heading = {
  children: ["inline"],
  
  attributes: {
    id: { type: String },
    level: { type: Number, required: true, default: 1 },
  },
  
  transform(node: Node, config): Tag {
    const children = node.transformChildren(config);

    const id = generateID(node, node.attributes);

    return new Tag(
      `h${node.attributes['level']}`,
      { ...(id && { id }) },
      children,
    );
  }
} as Schema;
