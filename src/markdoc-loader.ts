import Markdoc from "@markdoc/markdoc";

export default function* markdocToVue(source: string, options = {}): Generator<string, string, string> {
  const ast = Markdoc.parse(source);

  for (const child of ast.walk()) {
    if (child.type === "image") {
      child.attributes.src = yield child.attributes.src;
    }
  }

  const renderable = Markdoc.transform(ast, options);
  const html = Markdoc.renderers.html(renderable);

  return `<template>${html}</template>`;
}
