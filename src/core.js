export function program(statements) {
  return { kind: "Program", statements };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(name, type, mutable) {
  return { kind: "Variable", name, type, mutable };
}

export function argument(name, type, value) {
  return { kind: "Argument", name, type, value };
}

// export function constantDeclaration(variable, initializer) {
//   return { kind: "ConstantDeclaration", variable, initializer, mutable: false };
// }

export function printStatement(expressions) {
  return { kind: "PrintStatement", expressions, type: voidType };
}

export function functionDeclaration(func) {
  return { kind: "FunctionDeclaration", func };
}

export function func(name, params, body, type, isMethod) {
  return { kind: "FunctionType", name, params, body, type, isMethod };
}

// export function intrinsicFunction(name, type) {
//   return { kind: "FunctionType", name, type, intrinsic: true };
// }

export function functionType(paramNames, paramTypes, returnType) {
  return { kind: "FunctionType", paramNames, paramTypes, returnType };
}

export function functionCall(callee, args) {
  return { kind: "FunctionCall", callee, args };
}

export function incrementStatement(variable) {
  return { kind: "IncrementStatement", variable };
}

export function decrementStatement(variable) {
  return { kind: "DecrementStatement", variable };
}

export function assignmentStatement(target, source, type) {
  return { kind: "AssignmentStatement", target, source, type };
}

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression };
}

export const shortReturnStatement = { kind: "ShortReturnStatement" };

export function unaryExpression(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type };
}

export function binaryExpression(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function ternaryExpression(op, consequence, alternate) {
  return {
    kind: "TernaryExpression",
    op,
    consequence,
    alternate,
    type: consequence.type,
  };
}

export function nilCoalescingExpression(op, left, right, type) {
  return { kind: "NilCoalescingExpression", op, left, right, type };
}

export function ifStatement(condition, consequence, alternate) {
  return { kind: "IfStatement", condition, consequence, alternate };
}

export function shortIfStatement(condition, consequence) {
  return { kind: "ShortIfStatement", condition, consequence };
}

export function whileStatement(condition, body) {
  return { kind: "LoopStatement", condition, body };
}

export function repeatStatement(count, body) {
  return { kind: "RepeatStatement", count, body };
}

export function forEachStatement(iterator, collection, body) {
  return { kind: "ForEachStatement", iterator, collection, body };
}

export function forRangeStatement(iterator, start, op, end, body) {
  return { kind: "ForRangeStatement", iterator, start, op, end, body };
}

export const breakStatement = { kind: "BreakStatement" };

export function emptyOptional(baseType) {
  return { kind: "EmptyOptional", baseType, type: optionalType(baseType) };
}

export function optionalType(baseType) {
  return { kind: "OptionalType", baseType };
}

export function listType(baseType) {
  return { kind: "ListType", baseType };
}

export function listExpression(elements, type) {
  return { kind: "ListExpression", elements, type };
}

export function emptyListExpression(type) {
  return { kind: "EmptyListExpression", type };
}

export function subscriptExpression(list, index) {
  return { kind: "SubscriptExpression", list, index, type: list.type.baseType };
}

// export function call(callee, args) {
//   return { kind: "Call", callee, args, type: callee.type.returnType };
// }

// eventually add parent classes/superclasses as parameter for classDeclaration?
// export function classDeclaration(name, superClass, fields, methods) {
export function classDeclaration(type) {
  return { kind: "ClassDeclaration", type };
}

export function classInit(fieldArgs, fields) {
  return { kind: "ClassDeclaration", fieldArgs, fields };
}

export function objectType(name, fields, fieldArgs, methods) {
  return { kind: "ObjectType", name, fields, fieldArgs, methods };
}

// export function objectDefinition(name, fields, methods) {
//   return { kind: "ObjectDefinition", name, fields, methods };
// }

export function objectCall(callee, args, type) {
  return { kind: "ObjectCall", callee, args, type };
}

export function memberExpression(object, op, field, isField) {
  return { kind: "MemberExpression", object, op, field, type: field.type, isField };
}

// export function objectInstance(name, fields) {
//   return { kind: "ObjectInstance", name, fields };
// }

export function stringExpression(strings) {
  return { kind: "StringExpression", strings, type: stringType };
}

export function fieldArg(name, type) {
  return { kind: "FieldArgument", name, type };
}

export function field(name, type, value) {
  return { kind: "Field", name, type, value };
}

export const voidType = "void";
export const anyType = "any";
export const booleanType = "boolean";
export const floatType = "float";
export const intType = "int";
export const stringType = "string";
export const zilchType = "zilch";

const floatToFloatType = functionType([floatType], floatType);
const anyToVoidType = functionType([anyType], voidType);
const stringToIntType = functionType(stringType, intType);

export const standardLibrary = Object.freeze({
  int: intType,
  float: floatType,
  string: stringType,
  boolean: booleanType,
  void: voidType,
  any: anyType,
  zilch: zilchType,
  π: variable("π", false, floatType),
  // proclaim: intrinsicFunction("proclaim", anyToVoidType),
});

String.prototype.type = stringType;
Number.prototype.type = floatType;
BigInt.prototype.type = intType;
Boolean.prototype.type = booleanType;
