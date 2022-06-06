import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, test } from "vitest";
import Markdoc from "@markdoc/markdoc"; 
import heading from "../src/transforms/heading";

let md = "";

describe('heading transformer', () => {
  beforeAll(async () => {
    md = await readFile("tests/fixtures/heading.md", "utf-8");
  });

  test("the correct id is generated", () => {
    const ast = Markdoc.parse(md);
    const renderable = Markdoc.transform(ast, { nodes: { heading }});
    const html = Markdoc.renderers.html(renderable);

    expect(html).toMatchSnapshot();
  });
});
