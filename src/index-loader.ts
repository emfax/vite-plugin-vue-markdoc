import { dirname, join, resolve } from "node:path";
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

/**
 * Decrement the last item in an array of integers and return the new value.
 * Return null if list is empty.
 * 
 * @param stack 
 */
function decrementTail(stack: number[]): number | null {
  if (stack.length === 0) return null;
  const result = --stack[stack.length - 1];

  return result;
}

function foldToc(arrays: ArrayExpression[]): void {
  if (arrays.length <= 1) return;

  const children = arrays.pop();
  const parentArray = arrays[arrays.length - 1];
  const parentObject = parentArray.elements.pop() as ObjectExpression;
  addObjectProperty(parentObject, "children", children);
  parentArray.elements.push(parentObject);
}

function generateModule(routes: ArrayExpression, toc: ArrayExpression): string {
  return generate(
    newProgram(
      newExportNamedDeclaration("routes", routes),
      newExportNamedDeclaration("toc", toc),
    )
  );
}

function last<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  
  return arr[arr.length - 1];
}

// function newTocItem(text: string, path?: string): ObjectExpression {
//   const properties = [
//     newProperty("text", { type: "Literal", value: text }),
//   ];

//   if (path) {
//     properties.push(newProperty("path", { type: "Literal", value: path }));
//   }

//   return {
//     type: "ObjectExpression",
//     properties,
//   };
// }

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
            const path = resolve(
              frontmatter.baseUrl || "",
              node.attributes.href.replace(/(readme)?\.md$/i, "")
            );
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
