import * as core from "./core.js";

const INT = core.intType;
const FLOAT = core.floatType;
const STRING = core.stringType;
const BOOLEAN = core.booleanType;
const VOID = core.voidType;
const ANY = core.anyType;

class Context {
  //checks if in loop so that it can break
  constructor({ parent = null, locals = new Map(), inLoop = false, function: f = null }) {
    Object.assign(this, { parent, locals, inLoop, function: f })
  }
  add(name, entity) {
    this.locals.set(name, entity);
  }
  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name);
  }
  static root() {
    return new Context({ locals: new Map(Object.entries(core.standardLibrary)) });
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() });
  }
}

export default function analyze(match) {
  //initial context, new context must be created when moving into a new scope and returned to old context when leaving scope
  let context = Context.root();
  const grammar = match.matcher.grammar;

  //error checking gate
  function check(condition, message, errorLocation) {
    if (!condition) {
      const prefix = errorLocation.at.source.getLineAndColumnMessage();
      throw new Error(`${prefix} ${message}`);
    }
  }


  function determineType(str) {
    if (str == "int") {
      return INT
    } else if (str == "string") {
      return STRING
    } else if (str == "zilch") {
      return VOID
    } else if (str == "bool") {
      return BOOLEAN
    } else if (str == "float") {
      return FLOAT
    } else {
      return ANY
    }
  }

  //utility functions
  function checkNotDeclared(name, at) {
    check(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

  function checkHasBeenDeclared(entitty, at) {
    check(entitty, `Identifier ${at} not declared`, at);
  }

  function checkHasNumericType(e, at) {
    const expectedTypes = [INT, FLOAT];
    check(expectedTypes.includes(e.type), `Expected numeric type but got ${e.type.name}`, at);
  }

  function checkHasIntType(e, at) {
    check(e.type === core.intType, `Expected int type but got ${e.type.name}`, at);
  }

  function checkHasFloatType(e, at) {
    check(e.type === core.floatType, `Expected float type but got ${e.type.name}`, at);
  }

  function checkHasBoolenType(e, at) {
    check(e.type === core.booleanType, `Expected boolean type but got ${e.type.name}`, at);
  }

  function checkHasStringType(e, at) {
    check(e.type === core.stringType, `Expected string type but got ${e.type.name}`, at);
  }

  function checkHasListType(e, at) {
    check(e.type.kind === "ListType", `Expected list type but got ${e.type.name}`, at);
  }

  function checkHasOptionalType(e, at) {
    check(e.type.kind === "OptionalType", `Expected optional type but got ${e.type.name}`, at);
  }

  function checkHasFunctionType(e, at) {
    check(e.type.kind === "FunctionType", `Expected function type but got ${e.type.name}`, at);
  }

  function checkIsStringOrNumericType(e, at) {
    const expectedTypes = [core.intType, core.floatType, core.stringType];
    check(expectedTypes.includes(e.type), `Expected string or numeric type but got ${e.type.name}`, at);
  }

  function checkHasOptionalObjectType(e, at) {
    check(e.type?.kind === "OptionalType" && e.type.baseType?.kind === "ObjectType", `Expected an optional object but got ${e.type.name}`, at)
  }

  function checkHasObjectType(e, at) {
    check(e.type?.kind === "ObjectType", `Expected an object type but got ${e.type.name}`, at)
  }

  function checkIsMutable(e, at) {
    check(e.mutable, `Cannot assign to immutable variable ${e.name}`, at);
  }

  function checkBothSameType(type1, type2, at) {
    check(type1 === type2, `Operands must have the same type`, at);
  }

  function checkAllSameType(elements, at) {
    if (elements.length > 0) {
      const type = elements[0].type;
      for (const e of elements) {
        check(e.type === type, `All elements must have the same type`, at);
      }
    }
  }

  function checkIsType(e, at) {
    const isBasicType = /int|float|string|boolean|void|any/.test(e.name);
    const isCompositeType = /ObjectTupe|FunctionType|ListType|OptionalType/.test(e?.kind);
    check(isBasicType || isCompositeType, "Type expected", at)
  }

  function includesAsField(objectType, type) {
    return objectType.fields.some(field => field.type === type || 
      (field.type?.kind === "ObjectType" && includesAsField(field.type, type))
    )
  }

  function checkIfSelfContaining(objectType, at) {
    const selfContaining = includesAsField(objectType, objectType)
    check(!selfContaining, `Object type ${struct.name} cannot contain itself`, at);
  }

  function equivalent (t1, t2) {
    return (
      t1 === t2 || 
      (t1?.kind === "OptionalType" && t2?.kind == "OptionalType" && equivalent(t1.type, t2.type)) || 
      (t1?.kind === "ListType" && t2?.kind === "ListType" && equivalent(t1.type, t2.type)) ||
      (t1?.kind === "FunctionType" && t2?.kind === "FunctionType" && equivalent(t1.returnType === t2.returnType) && (t1.paramTypes.length === t2.paramTypes.length) && (t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i]))))
    )
  }

  function assignable(fromType, toType) {
    return (
      toType === core.anyType ||
      equivalent(fromType, toType) ||
      (fromType?.kind === "FunctionType" && toType?.kind === "FunctionType" && assignable(fromType.returnType, toType.returnType) && fromType.paramTypes.length === toType.paramTypes.length && toType.paramTypes.every((t, i) => assignable(t, fromType.paramTypes[i])))
    )
  }

  function typeDescription(type) {
    switch (type.kind) {
      case "VoidType": return "void";
      case "AnyType": return "any";
      case "IntType": return "int";
      case "FloatType": return "float";
      case "StringType": return "string";
      case "BooleanType": return "boolean";
      case "ListType": return `[${typeDescription(type.type)}]`;
      case "OptionalType": return `${typeDescription(type.baseType)}?`;
      case "ObjectType": return type.name;
      case "FunctionType": 
        const paramTypes = type.paramTypes.map(typeDescription).join(", ");
        const returnTypes = typeDescription(type.returnType);
        return `(${paramTypes}) => ${returnTypes}`;
    }
  }

  function checkIsAssignable(e, { toType: type }, at) {
    check(assignable(e.type, type), `Cannot assign ${typeDescription(e.type)} to ${typeDescription(type)}`, at);
  }

  function isMutable(e) {
    return (
      (e?.kind === "Variable" && e.mutable) ||
      (e?.kind == "SubscriptExpression" && isMutable(e?.list)) ||
      (e?.kind === "MemberExpression" && isMutable(e?.object))
    )
  }

  function checkIsMutable(e, at) {
    check(isMutable(e), `Cannot assign to immutable expression ${e.name}`, at);
  }

  function checkHasDistinctFields(type, at) {
    const fieldNames = new Set(type.fields.map(field => field.name));
    check(fieldNames.size === type.fields.length, `Fields must be distinct from each other`, at);
  }

  function checkHasMember(object, field, at) {
    check(object.type.fields.map(field => field.name).includes(field), `Object type ${object.name} does not have a field ${field}`, at);
  }

  function checkInLoop(at) {
    check(context.inLoop, `Break statement must be inside a loop`, at);
  }

  function checkInFunction(at) {
    check(context.function, `Return statement must be inside a function`, at);
  }

  function checkIsCallable(e, at) {
    const callable = e?.kind === "ObjectType" || e?.kind === "FunctionType";
    check(callable, `Expression is not callable. Can only call functions or objects`, at);
  }

  function checkReturnsNothing(f, at) {
    const returnsNothing = f.type.returnType === core.voidType;
    check(returnsNothing, `Function ${f.name} must return void`, at);
  }

  function checkReturnsSomething(f, at) {
    const returnsSomething = f.type.returnType !== core.voidType;
    check(returnsSomething, `Function ${f.name} must return a value`, at);
  }

  function checkArgumentCount(argCount, paramCount, at) {
    check(argCount === paramCount, `Expected ${paramCount} arguments but got ${argCount}`, at);
  }

  function checkIfReturnable(e, { from: f }, at) {
    checkIsAssignable(e, { toType: f.type.returnType }, at);
  }

  const analyzer = grammar.createSemantics().addOperation("analyze", {
    Program(statements) {
      return core.program(statements.children.map(s => s.analyze()));
    },
    VarDecl(qualifier, id, _colon, type, _eq, exp, _semi) {
      checkNotDeclared(id.sourceString, id);
      const mutable = qualifier.sourceString === "thine";
      const varType = determineType(type.sourceString);
      const variable = core.variable(id.sourceString, varType, mutable);
      const initializer = exp.analyze();
      checkBothSameType(varType, initializer.type, exp)
      context.add(id.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    }, 
    PrintStmt(_print, exp, _semi) {
      return core.printStatement(exp.analyze());
    },
    TypeDecl(_object, id, _left, fields, _right) {
      checkNotDeclared(id.sourceString, id);
      const type = core.objectType(id.sourceString, []);
      context.add(id.sourceString, type);
      type.fields = fields.children.map(field => field.analyze());
      checkHasDistinctFields(type, id);
      checkIfSelfContaining(type, id);
      return core.typeDeclaration(type);
    },
    FuncDecl(_fun, id, parameters, _equals, exp, _semi) {
      checkNotDeclared(id.sourceString, id);
      const fun = core.functionDeclaration(id.sourceString);
      context.add(id.sourceString, fun);

      context = new Context({ parent: context, function: fun });
      const params = parameters.analyze();
      const body = exp.analyze();
      context = context.parent;
      return core.functionDeclaration(id.sourceString, params, body);
    },
    // TODO: func call
    Statement_incdec(_inc, id, _semi) {
      const variable = id.analyze();
      return core.incrementStatement(variable);
    },
    Statement_assign(variable, _eq, exp, _semi) {
      const target = variable.analyze();
      const source = exp.analyze();
      checkIsMutable(target, variable);
      checkIsAssignable(source, target, variable);
      return core.assignmentStatement(target, source);
    },
    Statement_return(returnKeyword, exp, _semi) {
      checkInFunction(returnKeyword);
      checkReturnsSomething(context.function, returnKeyword);
      const returnExpression = exp.analyze();
      checkIfReturnable(returnExpression, context.function, exp);
      return core.returnStatement(returnExpression);
    },
    Statement_returnvoid(returnKeyword, _semi) {
      checkInFunction(returnKeyword);
      checkReturnsNothing(context.function, returnKeyword);
      return core.shortReturnStatement();
    },
    IfStmt_long(_if, exp, block1, _else, block2) {
      const test = exp.analyze();
      checkHasBoolenType(test, exp);
      context = context.newChildContext();
      const consequent = block1.analyze();
      context = context.parent;
      context = context.newChildContext();
      const alternate = block2.analyze();
      context = context.parent;
      return core.ifStatement(test, consequent, alternate);
    },
    IfStmt_elseif(_if, exp, block1, _else, trailingIfStatement) {
      const text = exp.analyze();
      checkHasBoolenType(test, exp);
      context = context.newChildContext();
      const consequent = block1.analyze();
      context = context.parent;
      const alternate = trailingIfStatement.analyze();
      return core.ifStatement(test, consequent, alternate);
    }, 
    IfStmt_short(_if, exp, block) {
      const test = exp.analyze();
      checkHasBoolenType(test, exp);
      context = context.newChildContext();
      const consequent = block.analyze();
      context = context.parent;
      return core.shortIfStatement(test, consequent);  
    },
    LoopStmt_while(whileKeyword, exp, block) {
      const test = exp.analyze();
      checkHasBoolenType(test, exp);
      context = context.newChildContext({ inLoop: true });
      const body = block.analyze();
      context = context.parent;
      return core.whileStatement(test, body);
    }, 
    LoopStmt_for(forKeyword, exp, block) {
      const count = exp.analyze()
      checkHasIntType(count, exp);
      context = context.newChildContext({ inLoop: true });
      const body = block.analyze();
      context = context.parent;
      return core.forStatement(count, body);
    }, 
    LoopStmt_range(forKeyword, id, _in, exp1, op, exp2, block) {
      const [low, high] = [exp1.analyze(), exp2.analyze()];
      checkHasIntType(low, exp1);
      checkHasIntType(high, exp2);
      const iterator = core.variable(id.sourceString, INT, false);
      context = context.newChildContext({ inLoop: true });
      context.add(id.sourceString, iterator);
      const body = block.analyze();
      context = context.parent;
      return core.forRangeStatement(iterator, low, op.sourceString, high, body);
    }, 
    LoopStmt_forEach(forKeyword, id, _in, exp, block) {
      const collection = exp.analyze();
      checkHasListType(collection, exp);
      const iterator = core.variable(id.sourceString, collection.type.type, false);
      context = context.newChildContext({ inLoop: true });
      context.add(iterator.name, iterator);
      const body = block.analyze();
      context = context.parent;
      return core.forEachStatement(iterator, collection, body);
    },
    Statement_break(breakKeyword, _semi) {
      checkInLoop(breakKeyword);
      return core.breakStatement();
    },
    Block(_open, statements, _close) {
      return statements.children.map((s) => s.analyze());
    },
    Param(id, _colon, type) {
      const param = core.variable(id.sourceString, type.analyze(), false);
      context.add(param.name, param);
      return param;
    },
    Params(_open, params, _close) {
      return params.asIteration().children.map(p => p.analyze());
    },
    Type_optional(baseType, _question) {
      return core.optionalType(baseType.analyze());
    },
    Type_list(_open, type, _close) {
      return core.listType(type.analyze());
    },
    Type_function(_open, types, _close, _arrow, type) {
      const paramTypes = types.asIteration().children.map(t => t.analyze());
      const returnType = type.analyze();
      return core.functionType(paramTypes, returnType);
    },
    Type_id(id) {
      const e = context.lookup(id.sourceString);
      checkHasBeenDeclared(e, id);
      checkIsType(e, id);
      return e;
    },
    Exp0_ternary(exp1, _questionMark, exp2, _colon, exp3) {
      const test = exp1.analyze();
      checkHasBoolenType(test, exp1);
      const [consequence, alternate] = [exp2.analyze(), exp3.analyze()];
      checkBothSameType(consequence.type, alternate.type, exp2);
      return core.ternaryExpression(test, consequence, alternate);
    },
    Exp1_nilcoalescing(exp1, elseOp, exp2) {
      const [optional, op, alternate] = [exp1.analyze(), elseOp.sourceString, exp2.analyze()];
      checkHasOptionalType(optional, exp1);
      checkIsAssignable(alternate, optional.type.type, exp2);
      return core.nilCoalescingExpression(optional, alternate);
    },
    Exp2_or(exp1, _or, exp2) {
      let left = exp1.analyze();
      checkHasBoolenType(left, exp1);
      for (let e of exps.children) {
        let right = e.analyze();
        checkHasBoolenType(right, e);
        left = core.binaryExpression("||", left, right, BOOLEAN);
      }
      return left;
    },
    Exp2_and(exp1, _and, exp2) {
      let left = exp1.analyze();
      checkHasBoolenType(left, exp1);
      for (let e of exps.children) {
        let right = e.analyze();
        checkHasBoolenType(right, e);
        left = core.binaryExpression("&&", left, right, BOOLEAN);
      }
      return left;
    },
    Exp3_compare(exp1, relop, exp2) {
      const [left, op, right] = [exp1.analyze(), relop.sourceString, exp2.analyze()];
      checkBothSameType(left.type, right.type, exp1);
      if (["==", "!="].includes(op)) {
        return core.binaryExpression(op, left, right, BOOLEAN);
      } else if (["<", "<=", ">", ">="].includes(op)) {
        checkHasNumericType(left, exp1);
        return core.binaryExpression(op, left, right, BOOLEAN);
      }
    },
    Exp4_addsub(exp1, addOp, exp2) {
      const [left, op, right] = [exp1.analyze(), addOp.sourceString, exp2.analyze()];
      checkBothSameType(left.type, right.type, exp1);
      if (op === "+") {
        checkHasNumericType(left, exp1);
      }
      return core.binaryExpression(op, left, right, left.type);
    },
    Exp5_multiply(exp1, mulOp, exp2) {
      const [left, op, right] = [exp1.analyze(), mulOp.sourceString, exp2.analyze()];
      checkHasNumericType(left, exp1);
      checkBothSameType(left.type, right.type, exp1);
      return core.binaryExpression(op, left, right, left.type);
    },
    Exp6_power(exp1, powerOp, exp2) {
      const [left, op, right] = [exp1.analyze(), powerOp.sourceString, exp2.analyze()];
      checkHasNumericType(left, exp1);
      checkBothSameType(left.type, right.type, exp1);
      return core.binaryExpression(op, left, right, left.type);
    },
    Exp6_unary(unaryOp, exp) {
      const [op, operand] = [unaryOp.sourceString, exp.analyze()]
      let type
      if (op === "ne") {
        checkHasBoolenType(operand, exp)
        type = BOOLEAN
      } else if (op === "-") {
        checkHasNumericType(operand, exp)
        type = operand.type
      }
      return core.unaryExpression(op, operand, type)
    },
    Exp7_call(exp, open, argList, close) {
      const callee = exp.analyze();
      checkIsCallable(callee, exp)
      const exps = argList.asIteration().children
      const targetTypes = callee?.kind === "ObjectType" ? callee.fields.map(f => f.type) : callee.type.paramTypes
      checkArgumentCount(exps.length, targetTypes.length, open)
      const args = exps.map((exp, i) => { 
        const arg = exp.analyze()
        checkIsAssignable(arg, targetTypes[i], exp)
        return arg
      })
      return callee?.kind === "ObjectType" ? core.objectCall(callee, args) : core.functionCall(callee, args)
    },
    Exp7_subscript(exp1, _open, exp2, _close) {
      const [array, subscript] = [exp1.analyze(), exp2.analyze()]
      checkHasListType(array, exp1)
      checkHasIntType(subscript, exp2)
      return core.subscriptExpression(array, subscript)
    }, 
    Exp7_member(exp, dot, id) {
      //TODO: some error handling here
      const object = exp.analyze()
      let objectType
      if (dot.sourceString === "?.") {
        checkHasOptionalObjectType(object, exp)
        objectType = object.type.baseType
      } else {
        checkHasObjectType(object, exp)
        objectType = object.type
      }
      checkHasMember(objectType, id.sourceString, id)
      const field = objectType.fields.find(f => f.name === id.sourceString)
      return core.memberExpression(object, dot.sourceString, field)
    },
    Exp7_id(id) {
      const e = context.lookup(id.sourceString);
      checkHasBeenDeclared(e, id);
      return e;
    },
    Exp7_emptylist(_open, _close) {
      return core.emptyListExpression(core.anyType);
    },
    Exp7_listExp(_open, args, _close) {
      const elements = args.asIteration().children.map(e => e.analyze());
      checkAllSameType(elements, args);
      return core.listExpression(elements);
    }, 
    Exp7_parens(_open, exp, _close) {
      return exp.analyze();
    },
    shall(_) { 
      return true 
    },
    shant(_) { 
      return false 
    },
    floatLiteral(_whole, _point, _fraction, _e, _sign, _exponent) { 
      return Number(this.sourceString) 
    },
    intLiteral(_digits) { 
      return BigInt(this.sourceString) 
    },
    //TODO: go over this with Toal
    String(_openQuote, lit1, interp, lit2, _closeQuote) { 
      const staticText1 = lit1.sourceString
      const interpolations = interp.children.map(i => i.children[1].analyze());
      const staticText2 = lit2.sourceString
      return core.stringExpression(staticText1, interpolations, staticText2);
    },
  })

  return analyzer(match).analyze();
}                                                                                                                                                        