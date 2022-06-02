import markdoc from "../src";
import { resolve } from "node:path";
import { rollup, RollupBuild } from "rollup";
import type { OutputOptions } from "rollup";
import { beforeAll, test } from 'vitest';

let bundle: RollupBuild;

const outputOptions: OutputOptions = {
  format: "es",
};

beforeAll(async () => {
  bundle = await rollup({
    input: resolve(__dirname, "fixtures/index.ts"),
    plugins: [markdoc()],
  });
});

test("the correct files are imported", () => {
  console.log(bundle.watchFiles);
});

test("assets are included in build", async () => {
  const { output } = await bundle.generate(outputOptions);

  for (const chunkOrAsset of output) {
    if (chunkOrAsset.type === "asset") {
      console.log('Asset', chunkOrAsset);
    } else {
      console.log('Chunk', chunkOrAsset.fileName, chunkOrAsset.code);
    }
  }
});
