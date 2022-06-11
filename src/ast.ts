import {
  ArrayExpression,
  ArrowFunctionExpression,
  ExportNamedDeclaration,
  Expression,
  Literal,
  ObjectExpression,
  Program,
  Property,
} from "estree";

export function addObjectProperty(obj: ObjectExpression, key: string, value: Expression): void {
  obj.properties.push(newProperty(key, value));
}

export function newArrayExpression(): ArrayExpression {
  return {
    type: "ArrayExpression",
    elements: [],
  };
}

export function newExportNamedDeclaration(name: string, init: Expression): ExportNamedDeclaration {
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

export function newImportFunction(path: string): ArrowFunctionExpression {
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

export function newLiteral(value?: string | number): Literal {
  return {
    type: "Literal",
    value,
  };
}

export function newObjectExpression(): ObjectExpression {
  return { type: "ObjectExpression", properties: [] };
}

export function arrayExpressionPush(arr: ArrayExpression, element: Expression) {
  arr.elements.push(element);
}

export function newProgram(...body: ExportNamedDeclaration[]): Program {
  return {
    type: "Program",
    body,
    sourceType: "module",
  };
}

export function newProperty(key: string, value: Expression): Property {
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
