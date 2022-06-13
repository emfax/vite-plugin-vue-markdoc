import type { Plugin } from "vite";
import { dirname, join, resolve } from "node:path";
import markdocToVue from "./markdoc-loader";
import { cwd } from "node:process";
import { readFileSync } from "node:fs";
import { indexLoader } from "./index-loader";

// Export Markdoc types
export { Tag } from "@markdoc/markdoc";
export type { Node } from "@markdoc/markdoc";

export interface Options {
  markdoc: Record<string, string>;
}

const filter = (id: string) => {
  if (id.endsWith(".md")) return true;
  if (id.endsWith(".md.vue")) return true;
};

const INDEX_RE = /index\.md$/i;

export default function (options: Record<string, unknown> = {}): Plugin {
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
        const iter = markdocToVue(source, options);
        let curr = iter.next();
        while (!curr.done) {
          const src = curr.value;

          curr = iter.next(resolve(dirname(id), src));
        }
        
        return curr.value;
      }

      const result = indexLoader(source, id);
      if (result.ok) {
        return result.value;
      } else if (result.ok === false) {
        this.error(result.error);
      }
    },
  };
}


