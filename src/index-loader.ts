import { dirname, resolve } from "node:path";
import Markdoc from "@markdoc/markdoc";
import type { Node } from "@markdoc/markdoc";
import { Ok, Err, Result } from "./common";
import yaml from "js-yaml";
import {
  ArrayExpression,
  ObjectExpression,
} from "estree";
import { generate } from "astring";
import {
  addObjectProperty,
  newArrayExpression,
  newExportNamedDeclaration,
  newImportFunction,
  newLiteral,
  newObjectExpression,
  newProgram,
  newProperty,
} from "./ast";

function generateModule(routes: ArrayExpression, toc: ArrayExpression): string {
  return generate(
    newProgram(
      newExportNamedDeclaration("routes", routes),
      newExportNamedDeclaration("toc", toc),
    )
  );
}

function newRouteRecord(path: string, url: string): ObjectExpression {
  return {
    type: "ObjectExpression",
    properties: [
      newProperty("path", { type: "Literal", value: path }),
      newProperty("component", newImportFunction(url)),
    ],
  };
}

function push(arr: ArrayExpression, el: ObjectExpression) {
  arr.elements.push(el);
}

export function indexLoader(source: string, id: string): Result<string | null, string> {
  const ast = Markdoc.parse(source);

  const frontmatter = yaml.load(ast.attributes.frontmatter);

  const list = ast.children[0];
  if (list.type !== "list") {
    return null;
  };

  const routes = newArrayExpression();
  const toc = newArrayExpression();

  nest(list, routes, toc);

  return Ok(generateModule(routes, toc));

  function nest(list: Node,  routes: ArrayExpression, toc: ArrayExpression): Result<undefined, string> {

    for (const listItem of list.children) {
      const tocItem = newObjectExpression();

      for (let node of listItem.children) {
        if (node.type === "inline") {
          node = node.children[0]; // node.type === "link"
          
          if (node.attributes.href) {
            const path = resolve(frontmatter.baseUrl || "", node.attributes.href)
              .replace(/(readme)?\.md$/i, "");
            const url = resolve(dirname(id), node.attributes.href);

            addObjectProperty(tocItem, "path", newLiteral(path));

            push(routes, newRouteRecord(path, url));
          }

          node = node.children[0]; // node.type === "text"

          if (!node) {
            return Err("index entries must have text");
          }

          addObjectProperty(tocItem, "text", newLiteral(node.attributes.content));

          continue;
        }

        if (node.type === "list") {
          const children = newArrayExpression();
          const result = nest(node, routes, children);
          if (!result.ok) return result;
          addObjectProperty(tocItem, "children", children);
        }
      }

      push(toc, tocItem);
    }

    return Ok();
  }
}
