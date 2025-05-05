import { describe, it } from "node:test"
import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

// Basic variables used in test cases
const x_int = core.variable("x", core.intType, true)
const x_list = core.variable("x_list", core.listType(core.intType), true)
const x_inc = core.incrementStatement(x_int)
const add_operation = core.binaryExpression("+", 1, 1, core.intType)
const assign = (v, e) => core.assignmentStatement(v, e, core.intType)
const empty_list = core.emptyListExpression(core.intType)
const and = (...c) => c.reduce((a, b) => core.binaryExpression("&&", a, b, core.boolType))
const or = (...d) => d.reduce((a, b) => core.binaryExpression("||", a, b, core.boolType))
const list_statement = (...elements) => core.listExpression(elements, core.anyType)
const sub = (l, i) => core.subscriptExpression(l, i)
const less = (x, y) => core.binaryExpression("<", x, y, core.boolType)
const class_dec = core.classDeclaration(core.objectType("Coffee", [core.field("seasonal", core.optionalType(core.booleanType), core.fieldArg("seasonal", core.optionalType(core.booleanType)))]))
const program = core.program

const tests = [
    ["folds +", core.binaryExpression("+", 2, 3, core.intType), 5],
    ["folds -", core.binaryExpression("-", 5, 3, core.intType), 2],
    ["folds *", core.binaryExpression("*", 2, 10, core.intType), 20],
    ["folds /", core.binaryExpression("/", 10, 2, core.intType), 5],
    ["folds %", core.binaryExpression("%", 10, 3, core.intType), 1],
    ["folds **", core.binaryExpression("^", 2, 3, core.intType), 8],
    ["folds <", core.binaryExpression("<", 2, 3, core.boolType), true],
    ["folds <=", core.binaryExpression("<=", 2, 2, core.boolType), true],
    ["folds >", core.binaryExpression(">", 3, 2, core.boolType), true],
    ["folds >=", core.binaryExpression(">=", 2, 2, core.boolType), true],
    ["folds ==", core.binaryExpression("==", 2, 2, core.boolType), true],
    ["folds !=", core.binaryExpression("!=", 2, 3, core.boolType), true],
    ["optimizes +0 for ints", core.binaryExpression("+", 5, 0, core.intType), 5],
    ["optimizes -0 for ints", core.binaryExpression("-", 5, 0, core.intType), 5],
    ["optimizes 0+ for floats", core.binaryExpression("+", 0.0, 2.4, core.floatType), 2.4],
    ["optimizes 0- for floats", core.binaryExpression("-", 0.0, 2.4, core.floatType), -2.4],
    ["optimizes 0* for ints", core.binaryExpression("*", 0, 2, core.intType), 0],
    ["optimizes *0 for ints", core.binaryExpression("*", 2, 0, core.intType), 0],
    ["optimizes 1* for ints", core.binaryExpression("*", 1, 2, core.intType), 2],
    ["optimizes /1 for ints", core.binaryExpression("/", 3, 1, core.intType), 3],
    ["optimizes *1 for ints", core.binaryExpression("*", 3, 1, core.intType), 3],
    ["optimizes *1.0 for floats", core.binaryExpression("*", 3.0, 1.1, core.floatType), 3.3000000000000003],
    ["optimizes +0 for floats", core.binaryExpression("+", 5.0, 0.0, core.floatType), 5.0],
    ["optimizes -0 for floats", core.binaryExpression("-", 5.0, 0.0, core.floatType), 5.0],
    ["optimizes 0/", core.binaryExpression("/", 0, 1, core.intType), 0],
    ["optimizes 0.0/", core.binaryExpression("/", 0.0, 1.1, core.floatType), 0.0],
    ["folds negation", core.unaryExpression("-", 5, core.intType), -5],
    ["optimizes 1** for ints", core.binaryExpression("^", 1, 2, core.intType), 1],
    ["optimizes 1** for floats", core.binaryExpression("^", 1.0, 2.0, core.floatType), 1.0],
    ["optimizes **0 for ints", core.binaryExpression("^", 2, 0, core.intType), 1],
    ["optimizes **0", core.binaryExpression("^", 2, 0, core.intType), 1],
    ["removes left false from ||", or(false, less(1, 2)), true],
    ["removes right false from ||", or(less(1, 2), false), true],
    ["removes left true from &&", and(true, less(1, 2)), true],
    ["removes right true from &&", and(less(1, 2), true), true],
    ["folds and w true", and(true, true), true],
    ["folds and w right true", and(false, true), false],
    ["folds and w false", and(false, false), false],
    ["folds or w true", or(true, false), true],
    ["folds or w false", or(false, false), false],
    ["folds or w right true", or(false, true), true],
    ["folds or w true true", or(true, true), true],
    ["removes x=x at beginning", program([assign(x_int, x_int), x_inc]), program([x_inc])],
    ["removes x=x at end", program([x_inc, assign(x_int, x_int)]), program([x_inc])],
    ["removes x=x in middle", program([x_inc, assign(x_int, x_int), x_inc]), program([x_inc, x_inc])],
    ["optimizes if true", core.ifStatement(true, [x_inc], []), [x_inc]],
    ["optimizes if false", core.ifStatement(false, [], [x_inc]), [x_inc]],
    ["optimizes short if true", core.shortIfStatement(true, [x_inc]), [x_inc]],
    ["optimizes short if false", core.shortIfStatement(false, [x_inc]), []],
    ["optimizes while false", program([core.whileStatement(false, [x_inc])]), program([])],
    ["optimizes repeat 0", program([core.repeatStatement(0, [x_inc])]), program([])],
    ["optimizes for range when end > start", core.forRangeStatement(x_int, 5, "...", 0, [x_inc]), []],
    ["optimizes left conditional true", core.ternaryExpression(core.binaryExpression("<", 54, 234), 54, 234), 54],
    ["optimizes left conditional false", core.ternaryExpression(core.binaryExpression(">", 54, 234), 54, 234), 234],
    ["optimizes in subscript", sub(x_list, add_operation), sub(x_list, 2)],
    ["optimizes in list literals", list_statement(add_operation, 4, 2), list_statement(2, 4, 2)],
    ["optimizes in arguments", core.functionCall("foo", [add_operation], core.intType), core.functionCall("foo", [2], core.intType)],
    ["optimizes in return statement", core.returnStatement(add_operation), core.returnStatement(2)],
    ["does not optimize short return", core.shortReturnStatement, core.shortReturnStatement],
    ["does not optimize empty list", core.emptyListExpression(core.intType), core.emptyListExpression(core.intType)],
    ["does not optimize normal variable declaration", core.variableDeclaration("x", 5, core.intType), core.variableDeclaration("x", 5, core.intType)],
    ["does not optimize normal assignment", core.assignmentStatement("x", 8, core.intType), core.assignmentStatement("x", 8, core.intType)],
    ["optimizes for each loop with empty list", core.forEachStatement(core.variableDeclaration("coin", core.anyType, false), empty_list, [core.printStatement(core.stringExpression('Thee hath no coins'))]), []],
    ["does not optimize break statement", core.breakStatement, core.breakStatement],
    ["does not optimize member expression", program([class_dec, core.memberExpression(class_dec.name, "?.", "seasonal", true)]), program([class_dec, core.memberExpression(class_dec.name, "?.", "seasonal", true)])],
    ["folds nil coalescing with empty optional", core.nilCoalescingExpression("??", core.emptyOptional(core.stringType), core.stringExpression("fallback string")), core.stringExpression("fallback string")],
    ["folds nil coalescing with non-empty optional", program([core.nilCoalescingExpression("??", core.variable("maybe", core.optionalType(core.stringType), true), core.stringExpression("fallback string"))]), program([core.variable("maybe", core.optionalType(core.stringType), true)])],
    ["does not optimize field argument", core.fieldArg("seasonal", core.optionalType(core.booleanType), core.stringExpression("fallback string")), core.fieldArg("seasonal", core.optionalType(core.booleanType), core.stringExpression("fallback string"))],
]

describe("The optimizer", () => {
    for (const [scenario, before, after] of tests) {
        it(`${scenario}`, () => {
            assert.deepEqual(optimize(before), after)
        })
    }
})