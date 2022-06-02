import {
  ArrayExpression,
  ExportNamedDeclaration,
  Expression,
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