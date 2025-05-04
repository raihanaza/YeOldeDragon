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
    //d.type = optimize(d.type)
    //d.fields = d.fields.map(optimize)
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
      if (e.op === "-") return -e.operand
    }
    return e
  },
  BinaryExpresion(e) {
    e.op = optimize(e.op)
    e.left = optimize(e.left)
    e.right = optimize(e.right)
    if (e.op === "??") {
      if (e.left.kind === "EmptyOptional") {
        return e.right
      }
    } else if (e.op === "&&") {
      if (e.left === true) return e.right
      if (e.right === true) return e.left
    } else if (e.op === "||") {
      if (e.left === false) return e.right
      if (e.right === false) return e.left
    } else if ([Number, BigInt].includes(e.left.constructor)) {
      if ([Number, BigInt].includes(e.right.constructor)) {
        if (e.op === "+") return e.left + e.right
        if (e.op === "-") return e.left - e.right
        if (e.op === "*") return e.left * e.right
        if (e.op === "/") return e.left / e.right
        if (e.op === "**") return e.left ** e.right
        if (e.op === "<") return e.left < e.right
        if (e.op === "<=") return e.left <= e.right
        if (e.op === ">") return e.left > e.right
        if (e.op === ">=") return e.left >= e.right
        if (e.op === "==") return e.left === e.right
        if (e.op === "!=") return e.left !== e.right
      }
      if (isZero(e.left) && e.op === "+") return e.right
      if (isZero(e.left) && e.op === "-") return core.unaryExpression("-", e.right, e.right.type)
      if (isOne(e.left) && e.op === "*") return e.right
      if (isZero(e.left) && e.op === "*") return e.left
      if (isZero(e.left) && ["*", "/"].includes(e.op)) return e.left
    } else if ([Number, BigInt]. includes(e.right.constructor)) {
      if (["+", "-"].includes(e.op) && isZero(e.right)) return e.left
      if (["*", "/"].includes(e.op) && isOne(e.right)) return e.left
      if (e.op === "*" && isZero(e.right)) return e.right
      if (e.op === "**" && isZero(e.right)) return 1
    }
    return e
  },
  TernaryExpression(e) {
    e.op = optimize(e.op)
    e.consequence = optimize(e.consequence)
    e.alternate = optimize(e.alternate)
    if (e.op.constructor === Boolean) {
      return e.op ? e.consequence : e.alternate
    }
    return e
  },
  NilCoalescingExpression(e) {
    e.op = optimize(e.op)
    e.left = optimize(e.left)
    e.right = optimize(e.right)
    if (e.left.kind === "EmptyOptional") {
      return e.right
    }
    return e
  },
  IfStatement(s) {
    s.condition = optimize(s.condition)
    s.consequence = s.consequence.flatMap(optimize)
    //s.alternate = s.alternate.flatMap(optimize)
    // if (s.alernate?.kind?.endsWith?.("IfStatement")) {
    //   s.alternate = optimize(s.alternate)
    // } else {
    //   s.alternate = s.alternate.flatMap(optimize)
    // }
    // if (s.condition.constructor === Boolean) {
    //   return s.test ? s.consequence : s.alternate
    // }
    return s
  },
  ShortIfStatement(s) {
    s.condition = optimize(s.condition)
    s.consequence = s.consequence.flatMap(optimize)
    if (s.condition.constructor === Boolean) {
      return s.test ? s.consequence : s.alternate
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
    if (s.collection?.kind === "EmptyList") {
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
    // e.object = optimize(e.object)
    return e
  },

  FunctionDeclaration(d) {
    // d.func = optimize(d.func)
    return d
  },
  FunctionType(f) {
    // f.params = f.params.map(optimize)
    // f.returnType = optimize(f.returnType)
    return f
  },
  FunctionCall(c) {
    // c.callee = optimize(c.callee)
    // c.args = c.args.map(optimize)
    return c
  },
  Function(f) {
    if (f.body) {
      f.body = f.body.flatMap(optimize)
    }
  },
  PrintStatement(s) {
    s.expressions = s.expressions.map(optimize)
    return s
  },
  StringExpression(e) {
    return e
  },
}