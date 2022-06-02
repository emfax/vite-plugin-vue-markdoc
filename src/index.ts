import Markdoc from "@markdoc/markdoc";
import { generate } from "astring";
import { ArrayExpression, ArrowFunctionExpression, ExportNamedDeclaration, Expression, ObjectExpression, Program, Property } from "estree";
import type { Plugin } from "vite";
import { dirname, join, resolve } from "node:path";
import markdocToVue from "./markdoc-loader";
import { cwd } from "node:process";
import { readFileSync } from "node:fs";
import yaml from "js-yaml";
import { addObjectProperty } from "./ast";
import link from "./transforms/link";

export interface Options {
  markdoc: Record<string, string>;
}

const filter = (id: string) => {
  if (id.endsWith(".md")) return true;
  if (id.endsWith(".md.vue")) return true;
};

const INDEX_RE = /index\.md$/i;

export default function (): Plugin {
  return {
    enforce: "pre",

    name: "vite-plugin-vue-markdoc",

    async resolveId(source, importer) {
      if (source.endsWith(".md") && !INDEX_RE.test(source)) {
        const resolution = await this.resolve(source, importer, { skipSelf: true });
        return `${resolution.id}.vue`;
      }

      return null;
    },

    load(id) {
      if (id.endsWith(".md.vue")) {        
        let path = id.slice(0, -4);
        if (process.env.NODE_ENV === "development") {
          path = join(cwd(), path);
        }

        return readFileSync(path, "utf-8");
      }

      return null;
    },

    async transform(source, id) {
      if (!filter(id)) {
        return null;
      }

      if (id.endsWith(".md.vue")) {
        const iter = markdocToVue(source, { nodes: { link }});
        let curr = iter.next();
        while (!curr.done) {
          const src = curr.value;

          curr = iter.next(resolve(dirname(id), src));
        }

        console.log(curr.value);
        return curr.value;
      }

      const ast = Markdoc.parse(source);

      const frontmatter = yaml.load(ast.attributes.frontmatter);

      const list = ast.children[0];

      if (list.type !== "list") {
        return null;
      };

      const stack = [list];
      const routes = newArrayExpression();
      const toc = [newArrayExpression()];
      for (const child of list.walk()) {
        stack.push(child);

        if (child.type === "list") {
          toc.push(newArrayExpression());
        }

        if (child.type === "link") {
          if (child.children.length === 0) {
            this.error("links in markdown index must have text");
          }
    
          continue;
        }

        if (child.type === "text") {
          const text = stack.pop();
          const link = stack.pop();

          // Pop the `inline` Node
          stack.pop();

          const item = stack.pop();
          let list = stack[stack.length - 1];

          if (!list.children.includes(item)) {
            stack.pop(); // List
            stack.pop(); // Item that wraps list
            list = stack[stack.length - 1];

            if (toc.length > 1) {
              foldToc(toc);
            }
          }

          const path = join(
            frontmatter.baseUrl || "",
            link.attributes.href.replace(/(readme)?\.md$/i, ""),
          );

          push(toc[toc.length - 1], newTocItem(text.attributes.content, path));

          if (link.attributes.href) {
            push(routes, newRouteRecord(path, resolve(dirname(id), link.attributes.href)));
          }
        }
      }

      return generateModule(routes, toc.pop());
    },
  };
}

function newArrayExpression(): ArrayExpression {
  return {
    type: "ArrayExpression",
    elements: [],
  };
}

function newProperty(key: string, value: Expression): Property {
  return {
    type: "Property",
    method: false,
    shorthand: false,
    computed: false,
    kind: "init",
    key: {
      type: "Identifier",
      name: key,
    },
    value,
  };
}

function newImportFunction(path: string): ArrowFunctionExpression {
  return {
    type: "ArrowFunctionExpression",
    expression: true,
    generator: false,
    async: false,
    params: [],
    body: {
      type: "ImportExpression",
      source: {
        type: "Literal",
        value: path,
      },
    }
  };
}

function generateModule(routes: ArrayExpression, toc: ArrayExpression): string {
  return generate(
    newProgram(
      newExportNamedDeclaration("routes", routes),
      newExportNamedDeclaration("toc", toc),
    )
  );
}

function newExportNamedDeclaration(name: string, init: Expression): ExportNamedDeclaration {
  return {
    type: "ExportNamedDeclaration",
    declaration: {
      type: "VariableDeclaration",
      declarations: [
        {
          type: "VariableDeclarator",
          "id": {
            type: "Identifier",
            name,
          },
          init,
        }
      ],
      kind: "const",
    },
    specifiers: [],
  };
}

function newProgram(...body: ExportNamedDeclaration[]): Program {
  return {
    type: "Program",
    body,
    sourceType: "module",
  };
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

function newTocItem(text: string, path?: string): ObjectExpression {
  const properties = [
    newProperty("text", { type: "Literal", value: text }),
  ];

  if (path) {
    properties.push(newProperty("path", { type: "Literal", value: path }));
  }

  return {
    type: "ObjectExpression",
    properties,
  };
}

function push(arr: ArrayExpression, el: ObjectExpression) {
  arr.elements.push(el);
}

function foldToc(arrays: ArrayExpression[]): void {
  const children = arrays.pop();
  const parentArray = arrays[arrays.length - 1];
  const parentObject = parentArray.elements.pop() as ObjectExpression;
  addObjectProperty(parentObject, "children", children);
  parentArray.elements.push(parentObject);
}
