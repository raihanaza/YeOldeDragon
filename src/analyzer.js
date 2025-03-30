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
    Object.assign(this, { parent, locals, inLoop, function: f });
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

  //utility functions
  function checkNotDeclared(name, at) {
    check(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

  function checkHasBeenDeclared(entity, name, at) {
    check(entity, `Identifier ${name} not declared`, at);
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
    // console.log("LIST ", e)
    //TODO: add in type check for what's inside brackets
    check(
      (e.type.startsWith("[") && e.type.endsWith("]")) || e.type === "ListType",
      `Expected list type but got ${e.type.name}`,
      at
    );
  }

  function checkIsListOrString(e, at) {
    check(
      (e.type.startsWith("[") && e.type.endsWith("]")) || e.type === STRING,
      `Expected list or string type but got ${e.type.name}`,
      at
    );
  }

  function checkHasOptionalType(e, at) {
    check(e.type.kind === "OptionalType", `Expected optional type but got ${e.type.name}`, at);
  }

  // function checkHasFunctionType(e, at) {
  //   check(e.type.kind === "FunctionType", `Expected function type but got ${e.type.name}`, at);
  // }

  function checkIsStringOrNumericType(e, at) {
    const expectedTypes = [core.intType, core.floatType, core.stringType];
    check(expectedTypes.includes(e.type), `Expected string or numeric type but got ${e.type.name}`, at);
  }

  function checkHasOptionalObjectType(e, at) {
    check(
      e.type?.kind === "OptionalType" && e.type.baseType?.kind === "ObjectType",
      `Expected an optional object but got ${e.type.name}`,
      at
    );
  }

  function checkHasObjectType(e, at) {
    check(e.type?.kind === "ObjectType", `Expected an object type but got ${e.type.name}`, at);
  }

  function checkIsMutable(e, at) {
    check(isMutable(e), `Cannot assign to immutable variable ${e.name}`, at);
  }

  function checkBothSameType(e1, e2, at) {
    check(e1.type === e2.type, `Operands must have the same type`, at);
  }

  function checkVarDecTypeMatchesExpressionType(type, expType, at) {
    //TODO: review this later, type==ANY workaround is for empty lists
    check(type === expType || type === ANY, `Type mismatch in declaration. Expected ${expType} but got ${type}`, at);
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
    const isCompositeType = /ObjectType|FunctionType|ListType|OptionalType/.test(e?.kind);
    check(isBasicType || isCompositeType, "Type expected", at);
  }

  function includesAsField(objectType, type) {
    return objectType.fields.some(
      (field) => field.type === type || (field.type?.kind === "ObjectType" && includesAsField(field.type, type))
    );
  }

  function checkIfSelfContaining(objectType, at) {
    const selfContaining = includesAsField(objectType, objectType);
    check(!selfContaining, `Object type ${objectType.name} cannot contain itself`, at);
  }

  function equivalent(t1, t2) {
    return (
      t1 === t2 ||
      (t1?.kind === "OptionalType" && t2?.kind == "OptionalType" && equivalent(t1.type, t2.type)) ||
      (t1?.kind === "ListType" && t2?.kind === "ListType" && equivalent(t1.type, t2.type)) ||
      (t1?.kind === "FunctionType" &&
        t2?.kind === "FunctionType" &&
        equivalent(t1.returnType === t2.returnType) &&
        t1.paramTypes.length === t2.paramTypes.length &&
        t1.paramTypes.every((t, i) => equivalent(t, t2.paramTypes[i])))
    );
  }

  function assignable(fromType, toType) {
    return (
      toType === core.anyType ||
      equivalent(fromType, toType) ||
      (fromType?.kind === "FunctionType" &&
        toType?.kind === "FunctionType" &&
        assignable(fromType.returnType, toType.returnType) &&
        fromType.paramTypes.length === toType.paramTypes.length &&
        toType.paramTypes.every((t, i) => assignable(t, fromType.paramTypes[i])))
    );
  }

  function typeDescription(type) {
    if (typeof type === "string") return type;
    if (type.kind == "ObjectType") return type.name;
    if (type.kind == "FunctionType") {
      const paramTypes = type.paramTypes.map(typeDescription).join(", ");
      const returnType = typeDescription(type.returnType);
      return `(${paramTypes})->${returnType}`;
    }
    if (type.kind == "ArrayType") return `[${typeDescription(type.baseType)}]`;
    if (type.kind == "OptionalType") return `${typeDescription(type.baseType)}?`;
  }

  // TODO: still need to work on throwing error if missing arg name?
  function checkArgNameMatchesParam(e, { toName: name }, at) {
    check(assignable(e.name, name), `Cannot assign ${e.name} to ${name}`, at);
  }

  function checkIsAssignable(e, targetType, at) {
    const source = typeDescription(e.type);
    const target = typeDescription(targetType);
    const message = `Cannot assign a ${source} to a ${target}`;
    check(assignable(e.type, targetType), message, at);
  }

  function isMutable(e) {
    return (
      (e?.kind === "Variable" && e.mutable) ||
      (e?.kind == "SubscriptExpression" && isMutable(e?.list)) ||
      (e?.kind === "MemberExpression" && isMutable(e?.object))
    );
  }

  function checkIsMutable(e, at) {
    check(isMutable(e), `Cannot assign to immutable expression ${e.name}`, at);
  }

  function checkHasDistinctFields(type, at) {
    const fieldNames = new Set(type.fields.map((field) => field.name));
    check(fieldNames.size === type.fields.length, `Fields must be distinct from each other`, at);
  }

  function checkHasMember(object, field, at) {
    check(
      object.type.fields.map((field) => field.name).includes(field),
      `Object type ${object.name} does not have a field ${field}`,
      at
    );
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
    checkIsAssignable(e, f.type.returnType, at);
  }

  //TODO: the name of this var should be builder, and .addOperation("rep",
  const analyzer = grammar.createSemantics().addOperation("analyze", {
    Program(statements) {
      return core.program(statements.children.map((s) => s.analyze()));
    },

    VarDecl(qualifier, id, _colon, type, _eq, exp, _semi) {
      checkNotDeclared(id.sourceString, id);
      const mutable = qualifier.sourceString === "thine";
      const typeName = type.sourceString;
      const variable = core.variable(id.sourceString, typeName, mutable);
      const initializer = exp.analyze();
      checkVarDecTypeMatchesExpressionType(initializer.type, typeName, exp);
      context.add(id.sourceString, variable);
      if (mutable) {
        return core.variableDeclaration(variable, initializer);
      } else {
        return core.constantDeclaration(variable, initializer);
      }
    },

    FuncDecl(_func, id, parameters, _colons, type, block) {
      checkNotDeclared(id.sourceString, { at: id });
      // Add immediately so that we can have recursion
      const func = core.func(id.sourceString);
      context.add(id.sourceString, func);

      // Parameters are part of the child context
      context = context.newChildContext({ inLoop: false, function: func });
      func.params = parameters.analyze();

      // Now that the parameters are known, we compute the function's type.
      // This is fine; we did not need the type to analyze the parameters,
      // but we do need to set it before analyzing the body.
      const paramTypes = func.params.map((param) => param.type);
      const paramNames = func.params.map((param) => param.name);
      const returnType = type.children?.[0]?.analyze() ?? core.voidType;
      func.type = core.functionType(paramNames, paramTypes, returnType);

      // Analyze body while still in child context
      func.body = block.analyze();

      // Go back up to the outer context before returning
      context = context.parent;
      return core.functionDeclaration(func);
    },

    PrintStmt(_print, exp, _semi) {
      return core.printStatement(exp.analyze());
    },

    TypeDecl(_matter, id, _left, fields, _right) {
      console.log("TypeDecl called");
      checkNotDeclared(id.sourceString, { at: id });
      // To allow recursion, enter into context without any fields yet
      const type = core.objectType(id.sourceString, []);
      context.add(id.sourceString, type);
      // Now add the types as you parse and analyze. Since we already added
      // the struct type itself into the context, we can use it in fields.
      type.fields = fields.children.map((field) => field.analyze());
      checkHasDistinctFields(type, { at: id });
      checkIfSelfContaining(type, { at: id });
      return core.classDeclaration(type);
    },

    ClassDecl(_object, id, _left, classInit, classBlock, _right) {
      console.log("***classDecl called***");
      checkNotDeclared(id.sourceString, id);
      // To allow recursion, enter into context without any fields yet
      const type = core.objectType(id.sourceString, []);
      context.add(id.sourceString, type);
      const classInitRep = classInit.analyze();
      type.fields = classInitRep.fields;

      //console.log("fields", fields);

      type.initialValues = classInitRep.initialValues;

      // console.log("try to get type.methods");
      // console.log("classBlock", classBlock);
      // console.log("classBlock.children", classBlock.children);
      // console.log("methods.analyze", classBlock.analyze());
      //type.methods = classBlock.children.map((method) => method.analyze());
      // console.log("***type.methods***", type.methods);
      //type.methods = classBlock.children.map((method) => method.analyze());
      checkHasDistinctFields(type, id);
      checkIfSelfContaining(type, id);
      // checkHadDistinctMethods(type, id);
      // maybe just check if have distinct methods names since don't want to overload?
      return core.classDeclaration(type);
    },

    Methods(methods) {
      console.log("methods called", methods);
      console.log("methods.length", methods.length);
      return methods.asIteration().children.map((method) => method.analyze());
    },

    ClassInit(_init, fields, fieldInitBlock) {
      console.log("***classInit called***");
      const targetFields = fields.analyze();
      const classInit = core.classInitializer([], []);
      context = context.newChildContext({ inLoop: false, classInit: classInit });

      classInit.fields = targetFields;
      console.log("context.lookup");
      classInit.fields.map((field) => console.log(field.name, field.type));

      let fieldInits = fieldInitBlock.analyze();
      console.log("fieldInits", fieldInits);
      const initializations = [];
      //checkStatementsAreInitializers(initializations);
      //const initializations = block.children.map((initialization) => initialization.analyze());
      return classInit;
    },

    Field(id, _colon, type) {
      console.log("field called, id: ", id.sourceString);
      const field = core.field(id.sourceString, type.analyze());
      context.add(field.name, field);
      return field;
    },

    Fields(_open, fieldList, _close) {
      console.log("FIELDS CALLED");
      return fieldList.asIteration().children.map((field) => field.analyze());
    },

    FieldInit(_ye, _dot, id, _eq, exp, _semi) {
      console.log("in Field Init");
      const fieldName = id.sourceString;
      console.log("try to get initializer");
      const initializer = exp.analyze();
      console.log("fieldName", fieldName, "initializer: ", initializer);
      // checkHasBeenDeclared(fieldName, { at: id });
      // checkIsMutable(fieldName, { at: id });
      // checkIsAssignable(initializer, fieldName, { at: id });
      return core.assignmentStatement(fieldName, initializer);
    },

    FieldInitBlock(_open, fieldInits, _close) {
      console.log("in fieldInitBlock");
      const initializations = fieldInits.children.map((exp) => {
        console.log("fieldInit sourceString", exp.sourceString);
        const fieldInit = exp.analyze();
        console.log("**field init in field Init block**", fieldInit);
        checkHasBeenDeclared(fieldInit, fieldInit.name, { at: exp });
        // checkIsAssignable(fieldInit, { toType: fieldInit.type }, { at: exp });
        checkArgNameMatchesParam(fieldInit, { toName: fieldInit.name }, { at: exp });
        return fieldInit;
      });
      return initializations;
    },

    Statement_incdec(exp, incDec, _semi) {
      const variable = exp.analyze();
      checkHasNumericType(variable, exp);
      if (incDec.sourceString === "++") {
        return core.incrementStatement(variable);
      } else if (incDec.sourceString === "--") {
        return core.decrementStatement(variable);
      }
    },

    Statement_assign(variable, _eq, exp, _semi) {
      const target = variable.analyze();
      const source = exp.analyze();
      // console.log("TARGET: ", target);
      // console.log("SOURCE: ", source);
      checkBothSameType(target, source, variable);
      checkIsMutable(target, variable);
      checkIsAssignable(source, target.type, source);
      return core.assignmentStatement(target, source);
    },

    Statement_return(returnKeyword, exp, _semi) {
      checkInFunction({ at: returnKeyword });
      checkReturnsSomething(context.function, { at: returnKeyword });
      const returnExpression = exp.analyze();
      checkIfReturnable(returnExpression, { from: context.function }, returnKeyword);
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
      const test = exp.analyze();
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
      const count = exp.analyze();
      checkHasIntType(count, exp);
      context = context.newChildContext({ inLoop: true });
      const body = block.analyze();
      context = context.parent;
      return core.repeatStatement(count, body);
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
      // console.log("ITERATOR: ", iterator)
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

    Params(_open, paramList, _close) {
      return paramList.asIteration().children.map((p) => p.analyze());
    },

    Arg(id, _colon, exp) {
      const arg = core.argument(id.sourceString, exp.analyze().type);
      return arg;
    },

    Type_optional(baseType, _question) {
      return core.optionalType(baseType.analyze());
    },

    Type_list(_open, type, _close) {
      return core.listType(type.analyze());
    },

    Type_function(_open, types, _close, _arrow, type) {
      const paramTypes = types.asIteration().children.map((t) => t.analyze());
      const returnType = type.analyze();
      return core.functionType(paramTypes, returnType);
    },

    Type_id(id) {
      const entity = context.lookup(id.sourceString);
      checkHasBeenDeclared(entity, id.sourceString, { at: id });
      return entity;
    },

    Exp0_ternary(exp1, _questionMark, exp2, _colon, exp3) {
      const test = exp1.analyze();
      checkHasBoolenType(test, exp1);
      const [consequence, alternate] = [exp2.analyze(), exp3.analyze()];
      checkBothSameType(consequence, alternate, exp2);
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
      for (let e of exp2.children) {
        let right = e.analyze();
        checkHasBoolenType(right, e);
        left = core.binaryExpression("||", left, right, BOOLEAN);
      }
      return left;
    },
    Exp2_and(exp1, _and, exp2) {
      let left = exp1.analyze();
      checkHasBoolenType(left, exp1);
      for (let e of exp2.children) {
        let right = e.analyze();
        checkHasBoolenType(right, e);
        left = core.binaryExpression("&&", left, right, BOOLEAN);
      }
      return left;
    },
    Exp3_compare(exp1, relop, exp2) {
      const [left, op, right] = [exp1.analyze(), relop.sourceString, exp2.analyze()];
      checkBothSameType(left, right, exp1);
      if (["==", "!="].includes(op)) {
        return core.binaryExpression(op, left, right, BOOLEAN);
      } else if (["<", "<=", ">", ">="].includes(op)) {
        checkHasNumericType(left, exp1);
        return core.binaryExpression(op, left, right, BOOLEAN);
      }
    },

    Exp4_addsub(exp1, addOp, exp2) {
      const [left, op, right] = [exp1.analyze(), addOp.sourceString, exp2.analyze()];
      checkHasNumericType(left, exp1);
      checkHasNumericType(right, exp2);
      checkBothSameType(left, right, exp1);
      return core.binaryExpression(op, left, right, left.type);
    },

    Exp5_multiply(exp1, mulOp, exp2) {
      const [left, op, right] = [exp1.analyze(), mulOp.sourceString, exp2.analyze()];
      checkHasNumericType(left, exp1);
      checkBothSameType(left, right, exp1);
      return core.binaryExpression(op, left, right, left.type);
    },

    Exp6_power(exp1, powerOp, exp2) {
      const [left, op, right] = [exp1.analyze(), powerOp.sourceString, exp2.analyze()];
      checkHasNumericType(left, exp1);
      checkBothSameType(left, right, exp1);
      return core.binaryExpression(op, left, right, left.type);
    },

    Exp6_unary(unaryOp, exp) {
      const [op, operand] = [unaryOp.sourceString, exp.analyze()];
      let type;
      if (op === "ne") {
        checkHasBoolenType(operand, exp);
        type = BOOLEAN;
      } else if (op === "-") {
        checkHasNumericType(operand, exp);
        type = operand.type;
      }
      return core.unaryExpression(op, operand, type);
    },

    Exp7_call(exp, open, argList, _close) {
      const callee = exp.analyze();
      checkIsCallable(callee, { at: exp });
      const exps = argList.asIteration().children;
      // TODO: what to do when an objectType? Do we currently store the name of attribute for object?
      const targetParamNames =
        callee?.kind === "ObjectType" ? callee.fields.map((f) => f.type) : callee.type.paramNames;
      const targetTypes = callee?.kind === "ObjectType" ? callee.fields.map((f) => f.type) : callee.type.paramTypes;
      checkArgumentCount(exps.length, targetTypes.length, { at: open });
      const args = exps.map((exp, i) => {
        const arg = exp.analyze();
        checkIsAssignable(arg, { toType: targetTypes[i] }, { at: exp });
        checkArgNameMatchesParam(arg, { toName: targetParamNames[i] }, { at: exp });
        return arg;
      });
      return callee?.kind === "ObjectType" ? core.objectCall(callee, args) : core.functionCall(callee, args);
    },

    Exp7_subscript(exp1, _open, exp2, _close) {
      checkHasBeenDeclared(exp1, exp1.sourceString, exp1);
      const [e, subscript] = [exp1.analyze(), exp2.analyze()];
      // console.log("EXPRESSION IS: ", e);
      checkHasIntType(subscript, exp2);
      checkIsListOrString(e, exp1);
      return core.subscriptExpression(e, subscript);
    },
    Exp7_member(exp, dot, id) {
      //TODO: some error handling here
      console.log("call exp7_member");
      const object = exp.analyze();
      let objectType;
      if (dot.sourceString === "?.") {
        checkHasOptionalObjectType(object, exp);
        objectType = object.type.baseType;
      } else {
        console.log("check member has object type", object);
        checkHasObjectType(object, exp);
        objectType = object.type;
      }
      checkHasMember(objectType, id.sourceString, id);
      const field = objectType.fields.find((f) => f.name === id.sourceString);
      return core.memberExpression(object, dot.sourceString, field);
    },

    Exp7_id(id) {
      console.log("***in id***", id.sourceString);
      const entity = context.lookup(id.sourceString);
      checkHasBeenDeclared(entity, id.sourceString, { at: id });
      return entity;
    },

    Exp7_emptylist(_open, _close) {
      return core.emptyListExpression(core.anyType);
    },

    Exp7_listExp(_open, args, _close) {
      const elements = args.asIteration().children.map((e) => e.analyze());
      checkAllSameType(elements, args);
      const elementType = elements.length > 0 ? elements[0].type : "any";
      return core.listExpression(elements, `[${elementType}]`);
    },

    Exp7_parens(_open, exp, _close) {
      return exp.analyze();
    },

    shall(_) {
      return true;
    },

    shant(_) {
      return false;
    },

    floatLiteral(_whole, _point, _fraction, _e, _sign, _exponent) {
      return Number(this.sourceString);
    },

    intLiteral(_digits) {
      return BigInt(this.sourceString);
    },

    lit(_chars) {
      return this.sourceString;
    },

    String(_openQuote, firstLit, interps, restOfLits, _closeQuote) {
      const litText1 = firstLit.sourceString;
      const interpolations = interps.children.map((i) => i.children[1].analyze());
      const litText2 = restOfLits.children.map((lit) => lit.sourceString);
      let res = [litText1];
      for (let i = 0; i < interpolations.length; i++) {
        res.push(interpolations[i]);
        res.push(litText2[i]);
      }
      return core.stringExpression(res);
    },
  });

  return analyzer(match).analyze();
}
