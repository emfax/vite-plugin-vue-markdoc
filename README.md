# @terbo/vite-plugin-vue-markdoc

A Vite plugin to support importing Markdoc documents.

This is a work in progress.

## Install

```bash
npm install -D @terbo/vite-plugin-vue-markdoc
```

## Usage

Import the plugin into your `vite.config.js` configuration file,

```javascript
import Markdoc from "@terbo/vite-plugin-vue-markdoc";

export default {
  plugins: [
    Markdoc({
      // options
    }),
  ],
};
```

### Index File

In order to import all your Markdoc documents, you need an index file that references all the included documents. The index file must be a Markdoc file that only contains a list of links to other Markdoc documents. Optionally, the index file can contain front matter.

Providing a `baseUrl` property in the front matter will prepend all routes.

```markdown
---
baseUrl: /docs
---

- [Introduction](README.md)
- [Design](guide/design.md)
```
