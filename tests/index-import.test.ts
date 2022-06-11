import { readFile } from "node:fs/promises";
import { describe, expect, test } from "vitest";
import { indexLoader } from "../src/index-loader";

describe('index importer', () => {
  test("tricky index", async () => {
    const md = await readFile("tests/fixtures/tricky-index.md", "utf-8");
    const result = indexLoader(md, "/tricky-index.md");

    if (result.ok) {
      expect(result.value).toMatchSnapshot();
    } else if (result.ok === false) {
      throw new Error(result.error);
    }
  });

  test.skip("weird index", async () => {
    const md = await readFile("tests/fixtures/weird-index.md", "utf-8");
    const result = indexLoader(md, "/weird-index.md");

    if (result.ok) {
      expect(result.value).toMatchSnapshot();
    } else if (result.ok === false) {
      throw new Error(result.error);
    }
  });
});
