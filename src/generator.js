import { voidType, standardLibrary, listExpression} from "./core.js"

export default function generate(program) {
  const output = []

  const targetName = (mapping => {
    return entity => {
      if (!mapping.has(entity)) {
        mapping.set(entity, mapping.size + 1)
      }
      return `${entity.name}_${mapping.get(entity)}`
    }
  })(new Map())

  const gen = node => generators?.[node?.kind]?.(node) ?? node

  const generators = {
    Program(p) {
      p.statements.forEach(gen)
    }, 
    VariableDeclaration(d) {
      output.push(`let ${gen(d.variable)} = ${gen(d.initializer)};`)
    },
    Variable(v) {
      return targetName(v)
    },
    // Argument(a) {

    // },
    ConstantDeclaration(d) {
      output.push(`const ${gen(d.variable)} = ${gen(d.initializer)};`)
    },
    PrintStatement(s) {
      output.push(`console.log(${s.expressions.map(gen).join(", ")});`)

      // if (s.expressions.length === 1 && typeof s.expressions[0].value === "string" && s.expressions[0].value.includes("${")) {
      //   const expr = s.expressions[0]
      //   const parts = [];
      //   const regex = /\${([^}]+)\}/g;
      //   let lastIndex = 0;
      //   let match;

      //   while ((match = regex.exec(expr.value)) !== null) {
      //     if (match.index > lastIndex) {
      //       parts.push(JSON.stringify(expr.value.slice(lastIndex, match.index)));
      //     }
      //     const originalName = match[1].trim();
      //     const renamed = targetName({ name: originalName }); 
      //     parts.push(renamed);
      //     lastIndex = regex.lastIndex;
      //     // parts.push(targetName({ name: match[1].trim() }));
      //     // lastIndex = regex.lastIndex;
      //   }

      //   if (lastIndex < expr.value.length) {
      //     parts.push(JSON.stringify(expr.value.slice(lastIndex)));
      //   }
      //   output.push(`console.log(${parts.join(", ")});`)
      // } else {
      //   output.push(`console.log(${s.expressions.map(gen).join(", ")});`)
      // }
    },
    FunctionDeclaration(d) {
      output.push(`function ${gen(d.fun)}(${d.fun.params.map(gen).join(", ")}) {`)
      d.fun.body.forEach(gen)
      output.push(`}`)
    },
    // FunctionType(f) {
      
    // },
    FunctionCall(f) {
      return targetName(f.name) + `(${f.args.map(gen).join(", ")})`
    },
    IncrementStatement(s) {
      output.push(`${gen(s.variable)}++;`)
    }, 
    DecrementStatement(s) {
      output.push(`${gen(s.variable)}--;`)
    }, 
    AssignmentStatement(s) {
      output.push(`${gen(s.target)} = ${gen(s.source)};`)
    },
    ReturnStatement(s) {
      output.push(`return ${gen(s.expression)};`)
    },
    ShortReturnStatement(s) {
      output.push(`return;`)
    },
    UnaryExpression(e) {
      return `${e.op}(${gen(e.operand)})`
    },
    BinaryExpression(e) {
      const op = { "==" : "===", "!=": "!=="}[e.op] ?? e.op
      return `${gen(e.left)} ${op} ${gen(e.right)}`
    },
    TernaryExpression(e) {
      return `((${gen(e.op)}) ? (${gen(e.consequence)}) : (${gen(e.alternate)}))`
    }, 
    // NilCoalescingExpression(e) {

    // },
    IfStatement(s) {
      output.push(`if (${gen(s.condition)}) {`)
      s.consequence.forEach(gen)
      if (s.alternate?.kind?.endsWith?.("IfStatement")) {
        output.push(`} else if (${gen(s.alternate.condition)}) {`)
        s.alternate.consequence.forEach(gen)
        if (s.alternate.alternate) {
          if (s.alternate.alternate.kind?.endsWith?.("IfStatement")) {
            output.push(`} else`)
            gen(s.alternate.alternate)
          } else {
            output.push(`} else {`)
            if(Array.isArray(s.alternate.alternate)) {
              s.alternate.alternate.forEach(gen)
            } else {
              gen(s.alternate.alternate)
            }
            output.push(`}`)
          }
        } else {
          output.push(`}`)
        }
      } else if (s.alternate) {
        output.push(`} else {`)
        if (Array.isArray(s.alternate)) {
          s.alternate.forEach(gen)
        } else {
          gen(s.alternate)
        }
        output.push(`}`)
      }
    },
    ShortIfStatement(s) {
      output.push(`if (${gen(s.condition)}) {`)
      s.consequence.forEach(gen)
      output.push(`}`)
    },
    WhileStatement(s) {
      output.push(`while (${gen(s.condition)}) {`)
      s.body.forEach(gen)
      output.push(`}`)
    }, 
    RepeatStatement(s) {
      const i = targetName({ name: "i"})
      output.push(`for (let ${i} = 0; ${i} < ${gen(s.count)}; ${i}++) {`)
      s.body.forEach(gen)
      output.push(`}`)
    },
    ForEachStatement(s) {
      output.push(`for (let ${gen(s.id)} of ${gen(s.exp)})`)
      s.body.forEach(gen)
      output.push(`}`)
    },
    ForRangeStatement(s) {
      const i = targetName(s.iterator)
      const op = s.op === "..." ? "<=" : "<"
      output.push(`for (let ${i} = ${gen(s.low)}; ${i} ${op} ${gen(s.high)}; ${i}++);`)
      s.body.forEach(gen)
      output.push(`}`)
    },
    BreakStatement(s) {
      output.push("break;")
    },
    EmptyOptional(t) {
      return "undefined"
    },
    ListType(t) {
      return `[${gen(t.baseType)}]`
    },
    ListExpression(e) {
      return `[${gen(e.elements).join(",")}];`
    },
    EmptyListExpressioin(e) {
      return "[]"
    },
    SubscriptExpression(e) {
      return `${gen(e.list)}[${gen(e.index)}]`
    },
    ClassDeclaration(d) {

    },
    ClassInitializer(d) {

    },
    ObjectType(t) {
      return targetName(t)
    },
    ObjectCall(d) {

    },
    MemberExpression(e) {
      const object = gen(e.object)
      const field = JSON.stringify(gen(e.field))
      const chain = e.op === "." ? "" : e.op
      return `(${object}${chain}[${field}])`
    },
    Function(f) {
      return targetName(f)
    },
    StringExpression(e) {
      const parts = e.strings.map((litOrInterp) =>
        litOrInterp.kind ? `\$\{${gen(litOrInterp)}\}` : gen(litOrInterp)
      ).join("")
      const hasInterpolation = e.strings.some((litOrInterp) => litOrInterp.kind);

      if (hasInterpolation) {
        return `\`${parts}\``;
      } else {
        return `"${parts}"`;
      }
    },
    Field(f) {
      return targetName(f)
    },
  }

  gen(program) 
  return output.join("\n")
}