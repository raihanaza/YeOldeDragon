import { voidType, standardLibrary, func } from "./core.js";

export default function generate(program) {
  const output = [];

  const targetName = ((mapping) => {
    return (entity) => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1);
      }
      return `${entity.name}_${mapping.get(entity)}`;
    };
  })(new Map());

  const gen = (node) => generators?.[node?.kind]?.(node) ?? node;

  const generators = {
    Program(p) {
      p.statements.forEach(gen);
    },
    VariableDeclaration(d) {
      // We don't care about const vs. let in the generated code! The analyzer has
      // already checked that we never updated a const, so let is always fine.
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`);
    },

    Variable(v) {
      return targetName(v);
    },
    ClassDeclaration(d) {
      output.push(`class ${gen(d.type)} {`);
      output.push(`constructor(${d.type.fields.map(gen).join(",")}) {`);
      for (let field of d.type.fields) {
        output.push(`this[${JSON.stringify(gen(field))}] = ${gen(field)};`);
      }
      output.push("}");
      if (d.type.methods) {
        d.type.methods.forEach(gen);
      }
      output.push("}");
    },
    ObjectCall(c) {
      return `new ${gen(c.callee)}(${c.args.map(gen).join(", ")})`;
    },
    ObjectType(t) {
      return targetName(t);
    },
    Argument(a) {
      return targetName(a);
    },
    FieldArgument(f) {
      return targetName(f);
    },
    Field(f) {
      return targetName(f);
    },
    IncrementStatement(s) {
      output.push(`${gen(s.variable)}++;`);
    },
    DecrementStatement(s) {
      output.push(`${gen(s.variable)}--;`);
    },
    AssignmentStatement(s) {
      output.push(`${gen(s.target)} = ${gen(s.source)};`);
    },
    BreakStatement(s) {
      output.push("break;");
    },
    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)};`);
    },
    ShortReturnStatement(s) {
      output.push(`return;`);
    },
    UnaryExpression(e) {
      if (e.op === "ne") {
        return `!(${gen(e.operand)})`;
      } else {
        return `${e.op}(${gen(e.operand)})`;
      }
    },
    BinaryExpression(e) {
      const op = { "==": "===", "!=": "!==", "^": "**" }[e.op] ?? e.op;
      return `${gen(e.left)} ${op} ${gen(e.right)}`;
    },
    TernaryExpression(e) {
      return `(${gen(e.op)}) ? (${gen(e.consequence)}) : (${gen(e.alternate)})`;
    },
    NilCoalescingExpression(e) {
      const left = gen(e.left);
      const right = gen(e.right);
      return `(${left} ${e.op} ${right})`;
    },
    IfStatement(s) {
      output.push(`if (${gen(s.condition)}) {`);
      s.consequence.forEach(gen);
      if (s.alternate?.kind?.endsWith?.("IfStatement")) {
        output.push("} else");
        gen(s.alternate);
      } else {
        output.push("} else {");
        s.alternate.forEach(gen);
        output.push("}");
      }
    },
    ShortIfStatement(s) {
      output.push(`if (${gen(s.condition)}) {`);
      s.consequence.forEach(gen);
      output.push(`}`);
    },
    LoopStatement(s) {
      output.push(`while (${gen(s.condition)}) {`);
      s.body.forEach(gen);
      output.push(`}`);
    },
    RepeatStatement(s) {
      const i = targetName({ name: "i" });
      output.push(`for (let ${i} = 0; ${i} < ${gen(s.count)}; ${i}++) {`);
      s.body.forEach(gen);
      output.push(`}`);
    },
    ForEachStatement(s) {
      output.push(`for (let ${gen(s.iterator)} of ${gen(s.collection)}) {`);
      s.body.forEach(gen);
      output.push(`}`);
    },
    ForRangeStatement(s) {
      const i = targetName(s.iterator);
      const op = s.op === "..." ? "<=" : "<";
      output.push(`for (let ${i} = ${gen(s.start)}; ${i} ${op} ${gen(s.end)}; ${i}++) {`);
      s.body.forEach(gen);
      output.push(`}`);
    },
    EmptyOptional(e) {
      return "null";
    },
    ListExpression(e) {
      return `[${e.elements.map(gen).join(", ")}]`;
    },
    EmptyListExpression(e) {
      return "[]";
    },
    SubscriptExpression(e) {
      return `${gen(e.list)}[${gen(e.index)}]`;
    },
    MemberExpression(e) {
      const object = gen(e.object);
      const field = JSON.stringify(gen(e.field));
      const chain = e.op === "." ? "" : e.op;
      return `(${object}${chain}[${field}])`;
    },
    FunctionDeclaration(d) {
      const funcKeyword = d.func.isMethod ? "" : "function ";
      output.push(`${funcKeyword}${gen(d.func)}(${d.func.params.map(gen).join(", ")}) {`);
      d.func.body.forEach(gen);
      output.push("}");
    },
    FunctionType(f) {
      return targetName(f);
    },
    FunctionCall(c) {
      const argValues = c.args.map((arg) => gen(arg.value));
      const targetCode = `${gen(c.callee)}(${argValues.join(", ")})`;
      // Calls in expressions vs in statements are handled differently
      //TODO: revisit this cause we don't allow functions to be assigned to variables yet
      // if (c.callee.type.returnType !== voidType) {
      //   return targetCode;
      // }
      output.push(`${targetCode};`);
    },
    PrintStatement(s) {
      output.push(`console.log(${s.expressions.map(gen).join(", ")});`);
    },
    StringExpression(e) {
      const parts = e.strings
        .map((litOrInterp) => (litOrInterp.kind ? `\$\{${gen(litOrInterp)}\}` : gen(litOrInterp)))
        .join("");
      const hasInterpolation = e.strings.some((litOrInterp) => litOrInterp.kind);
      return hasInterpolation ? `\`${parts}\`` : `"${parts}"`;
    },
  };

  gen(program);
  return output.join("\n");
}
