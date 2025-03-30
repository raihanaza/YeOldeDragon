export function program(statements) {
  return { kind: "Program", statements };
}

export function block(statements) {
  return { kind: "Block", statements };
}

export function variableDeclaration(variable, initializer) {
  return { kind: "VariableDeclaration", variable, initializer };
}

export function variable(name, type, mutable) {
  return { kind: "Variable", name, type, mutable };
}

export function argument(name, type) {
  return { kind: "Argument", name, type };
}

export function constantDeclaration(variable, initializer, mutable) {
  return { kind: "ConstantDeclaration", variable, initializer, mutable: false };
}

export function printStatement(expression) {
  return { kind: "PrintStatement", expression, type: voidType };
}

export function functionDeclaration(func) {
  return { kind: "FunctionDeclaration", func };
}

export function func(name, params, body, type) {
  return { kind: "FunctionType", name, params, body, type };
}

export function functionType(paramNames, paramTypes, returnType) {
  return { kind: "FunctionType", paramNames, paramTypes, returnType };
}

export function functionCall(name, args) {
  if (name.instrinsic) {
    if (name.type.returnType === voidType) {
      return { kind: name.name.replace(/^\p{L}/u, (c) => c.toUpperCase()), args };
    } else if (name.type.paramTypes.lenth === 1) {
      return unaryExpression(name.name, args[0], name.type.returnType);
    } else {
      return binaryExpression(name.name, args[0], args[1], name.type.returnType);
    }
  }
  return { kind: "FunctionCall", name, args };
}

export function intrinsicFunction(name, type) {
  return { kind: "Function", name, type, intrinsic: true };
}

export function incrementStatement(variable) {
  return { kind: "IncrementStatement", variable };
}

export function decrementStatement(variable) {
  return { kind: "DecrementStatement", variable };
}

export function assignmentStatement(target, source) {
  return { kind: "AssignmentStatement", target, source };
}

export function returnStatement(expression) {
  return { kind: "ReturnStatement", expression };
}

export function shortReturnStatement() {
  return { kind: "ShortReturnStatement" };
}

export function unaryExpression(op, operand, type) {
  return { kind: "UnaryExpression", op, operand, type };
}

export function binaryExpression(op, left, right, type) {
  return { kind: "BinaryExpression", op, left, right, type };
}

export function ternaryExpression(op, consequence, alternate) {
  return { kind: "TernaryExpression", op, consequence, alternate, type: consequence.type };
}

export function nilCoalescingExpression(left, right) {
  return { kind: "NilCoalescingExpression", left, right, type: left.type };
}

export function ifStatement(condition, consequence, alternate) {
  return { kind: "IfStatement", condition, consequence, alternate };
}

export function shortIfStatement(condition, consequence) {
  return { kind: "ShortIfStatement", condition, consequence };
}

export function elseStatement(consequence) {
  return { kind: "ElseStatement", consequence };
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

export function breakStatement() {
  return { kind: "BreakStatement" };
}

export function optionalType(type) {
  return { kind: "OptionalType", type };
}

export function listType(type) {
  return { kind: "ListType", type };
}

export function emptyListType(type) {
  return { kind: "EmptyListType", type };
}

export function listExpression(elements, type) {
  return { kind: "ListExpression", elements, type };
}

export function emptyListExpression(type) {
  return { kind: "EmptyListExpression", type };
}

export function subscriptExpression(list, index) {
  //TODO: revisit this type if there's a better way to do it
  return { kind: "SubscriptExpression", list, index, type: list.type.replace("[", "").replace("]", "") };
}

export function call(callee, args) {
  return { kind: "Call", callee, args, type: callee.type.returnType };
}

// eventually add parent classes/superclasses as parameter for classDeclaration?
// export function classDeclaration(name, superClass, fields, methods) {
export function classDeclaration(type) {
  return { kind: "ClassDeclaration", type };
}

export function classInitializer(fields, initialValues) {
  return { kind: "ClassInitializer", fields, initialValues };
}

export function objectType(name, fields, values, methods) {
  return { kind: "ObjectType", name, fields, values, methods };
}

export function objectDefinition(name, fields, methods) {
  return { kind: "ObjectDefinition", name, fields, methods };
}

export function objectCall(callee, args) {
  return { kind: "ObjectCall", callee, args, type: callee.type.returnType };
}

export function memberExpression(object, op, field) {
  return { kind: "MemberExpression", object, op, field, type: field.type };
}

export function objectInstance(name, fields) {
  return { kind: "ObjectInstance", name, fields };
}

export function stringExpression(strings) {
  return { kind: "StringExpression", strings, type: stringType };
}

export function field(name, type) {
  return { kind: "Field", name, type };
}

export const voidType = "void";
export const anyType = "any";
export const booleanType = "boolean";
export const floatType = "float";
export const intType = "int";
export const stringType = "string";

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
  π: variable("π", false, floatType),
  proclaim: intrinsicFunction("proclaim", anyToVoidType),
  exp: intrinsicFunction("exp", floatToFloatType),
  sin: intrinsicFunction("sin", floatToFloatType),
  cos: intrinsicFunction("cos", floatToFloatType),
  exp: intrinsicFunction("exp", floatToFloatType),
  ln: intrinsicFunction("ln", floatToFloatType),
  hypot: intrinsicFunction("hypot", floatToFloatType),
  bytes: intrinsicFunction("bytes", stringToIntType),
});

String.prototype.type = stringType;
Number.prototype.type = floatType;
BigInt.prototype.type = intType;
Boolean.prototype.type = booleanType;
