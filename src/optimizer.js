import * as core from "./core.js";

export default function optimize(node) {
  return optimizers?.[node.kind]?.(node) ?? node
}

const isZero = n => n === 0 | n === 0.0 | n === 0n
const isOne = n => n === 1 | n === 1.0 | n === 1n

const optimizers = {
  Program(p) {
    p.statements = p.statements.flatMap(optimize)
    return p
  },
  VariableDeclaration(d) {
    d.variable = optimize(d.variable)
    d.initializer = optimize(d.initializer)
    return d
  },
  ClassDeclaration(d) {
    if (d.type.methods) {
      d.type.methods = d.type.methods.map(optimize)
    }
    return d
  },
  ObjectCall(c) {
    c.callee = optimize(c.callee)
    c.args = c.args.map(optimize)
    return c
  },
  ObjectType(t) {
    t.fields = t.fields.map(optimize)
    if (t.methods) {
      t.methods = t.methods.map(optimize)
    }
    return t
  },
  Argument(a) {
    return a
  },
  FieldArgument(a) {
    return a
  },
  Field(f) {
    return f
  },
  IncrementStatement(s) {
    s.variable = optimize(s.variable)
    return s
  }, 
  DecrementStatement(s) {
    s.variable = optimize(s.variable)
    return s
  },
  AssignmentStatement(s) {
    s.target = optimize(s.target)
    s.source = optimize(s.source)
    if (s.source === s.target) { 
      return []
    }
    return s
  },
  BreakStatement(s) {
    return s
  },
  ReturnStatement(s) {
    s.expression = optimize(s.expression)
    return s
  },
  ShortReturnStatement(s) {
    return s
  },
  UnaryExpression(e) {
    e.op = optimize(e.op)
    e.operand = optimize(e.operand)
    if (e.operand.constructor === Number) {
      if (e.op === "-") return -(e.operand)
    }
    return e
  },
  BinaryExpression(e) {
    e.op = optimize(e.op)
    e.left = optimize(e.left)
    e.right = optimize(e.right)

    if (e.op === "&&") {
      if (e.left === true) return e.right
      if (e.right === true) return e.left
      if (e.left === false && e.right === false) return false
    } else if (e.op === "||") {
      if (e.left === false) return e.right
      if (e.right === false) return e.left
      if (e.left === true && e.right === true) return true
    } else if ([Number, BigInt].includes(e.left.constructor)) {
      if ([Number, BigInt].includes(e.right.constructor)) {
        if (["+", "-"].includes(e.op) && isZero(e.right)) return e.left
        if (["*", "/"].includes(e.op) && isOne(e.right)) return e.left
        if (e.op === "*" && isZero(e.right)) return e.right
        if (e.op === "^" && isZero(e.right)) return 1
        if (isZero(e.left) && e.op === "+") return e.right
        if (isZero(e.left) && e.op === "-") return -(e.right)
        if (isOne(e.left) && e.op === "*") return e.right
        if (isZero(e.left) && e.op === "*") return e.left
        if (isZero(e.left) && ["*", "/"].includes(e.op)) return e.left
        if (e.op === "+") return (e.left + e.right)
        if (e.op === "-") return (e.left - e.right)
        if (e.op === "*") return (e.left * e.right)
        if (e.op === "/") return (e.left / e.right)
        if (e.op === "%") return (e.left % e.right)
        if (e.op === "^") return (e.left ** e.right)
        if (e.op === "<") return (e.left < e.right)
        if (e.op === "<=") return (e.left <= e.right)
        if (e.op === ">") return (e.left > e.right)
        if (e.op === ">=") return (e.left >= e.right)
        if (e.op === "==") return (e.left === e.right)
        if (e.op === "!=") return (e.left !== e.right)
      } 
    } 
    return e
  },
  TernaryExpression(e) {
    e.op = optimize(e.op)
    e.consequence = optimize(e.consequence)
    e.alternate = optimize(e.alternate)
    return e.op ? e.consequence : e.alternate
  },
  NilCoalescingExpression(e) {
    e.left = optimize(e.left)
    e.right = optimize(e.right)
    if (e.left.kind === "EmptyOptional") {
      return e.right
    }
    return e.left
  },
  IfStatement(s) {
    s.condition = optimize(s.condition)
    s.consequence = s.consequence.flatMap(optimize)
    if (s.alternate?.kind?.endsWith?.("IfStatement")) {
      s.alternate = optimize(s.alternate)
    } else {
      s.alternate = s.alternate.flatMap(optimize)
    }
    if (s.condition.constructor === Boolean) {
      return s.condition ? s.consequence : s.alternate
    }
    return s
  },
  ShortIfStatement(s) {
    s.condition = optimize(s.condition)
    s.consequence = s.consequence.flatMap(optimize)
    if (s.condition == false) { return []}
    if ((s.condition.constructor === Boolean) && (s.condition === true)) {
      return s.consequence
    }
    return s
  },
  LoopStatement(s) {
    s.condition = optimize(s.condition)
    if (s.condition === false) {
      return []
    }
    s.body = s.body.flatMap(optimize)
    return s
  },
  RepeatStatement(s) {
    s.count = optimize(s.count)
    if (s.count === 0) {
      return []
    }
    s.body = s.body.flatMap(optimize)
    return s
  },
  ForEachStatement(s) {
    s.iterator = optimize(s.iterator)
    s.collection = optimize(s.collection)
    s.body = s.body.flatMap(optimize)
    if (s.collection?.kind === "EmptyListExpression") {
      return []
    } 
    return s
  },
  ForRangeStatement(s) {
    s.iterator = optimize(s.iterator)
    s.start = optimize(s.start)
    s.op = optimize(s.op)
    s.end = optimize(s.end)
    s.body = s.body.flatMap(optimize)
    if (s.start.constructor === Number && s.end.constructor === Number && s.start > s.end) {
      return []
    }
    return s
  },
  EmptyOptional(o) {
    return o
  },
  ListExpression(e) {
    e.elements = e.elements.map(optimize)
    return e
  },
  EmptyListExpression(e) {
    return e
  },
  SubscriptExpression(e) {
    e.list = optimize(e.list)
    e.index = optimize(e.index)
    return e
  },
  MemberExpression(e) {
    return e
  },

  FunctionDeclaration(d) {
    return d
  },
  FunctionType(f) {
    return f
  },
  FunctionCall(c) {
    c.callee = optimize(c.callee)
    c.args = c.args.flatMap(optimize)
    return c
  },
  PrintStatement(s) {
    return s
  },
  StringExpression(e) {
    return e
  },
}