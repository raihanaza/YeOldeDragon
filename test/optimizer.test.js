import { describe, it } from "node:test"
import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

// Basic variables used in test cases
const x_int = core.variable("x", core.intType, true)
const x_float = core.variable("x_float", core.floatType, true)
const x_list = core.variable("x_list", core.listType(core.intType), true)
const x_inc = core.incrementStatement(x_int)
const x_dec = core.decrementStatement(x_int)
const return_add = core.returnStatement(core.binaryExpression("+", 1, 1, core.intType))
const return_string = core.returnStatement("Hello, World!")
const add_operation = core.binaryExpression("+", 1, 1, core.intType)
const assign = (v, e) => core.assignmentStatement(v, e, core.intType)
const empty_list = core.emptyListExpression(core.intType)
const and = (...c) => c.reduce((a, b) => core.binaryExpression("&&", a, b, core.boolType))
const or = (...d) => d.reduce((a, b) => core.binaryExpression("||", a, b, core.boolType))
const not = c => core.unaryExpression("ne", c, core.boolType)
const neg_int = x => core.unaryExpression("-", x, core.intType)
const list_statement = (...elements) => core.listExpression(elements, core.anyType)
const sub = (l, i) => core.subscriptExpression(l, i)
const less = (x, y) => core.binaryExpression("<", x, y, core.boolType)
const eq = (x, y) => core.binaryExpression("==", x, y, core.boolType)
const program = core.program

const tests = [
    ["folds +", core.binaryExpression("+", 2, 3, core.intType), 5],
    ["folds -", core.binaryExpression("-", 5, 3, core.intType), 2],
    ["folds *", core.binaryExpression("*", 2, 10, core.intType), 20],
    ["folds /", core.binaryExpression("/", 10, 2, core.intType), 5],
    ["folds %", core.binaryExpression("%", 10, 3, core.intType), 1],
    ["folds **", core.binaryExpression("**", 2, 3, core.intType), 8],
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
    ["optimizes 1* for ints", core.binaryExpression("*", 1, 2, core.intType), 2],
    ["optimizes /1 for ints", core.binaryExpression("/", 3, 1, core.intType), 3],
    ["optimizes *1 for ints", core.binaryExpression("*", 3, 1, core.intType), 3],
    ["optimizes *1.0 for floats", core.binaryExpression("*", 3.0, 1.1, core.floatType), 3.0],
    ["optimizes +0 for floats", core.binaryExpression("+", 5.0, 0.0, core.floatType), 5.0],
    ["optimizes -0 for floats", core.binaryExpression("-", 5.0, 0.0, core.floatType), 5.0],
    ["optimizes 0/", core.binaryExpression("/", 0, 1, core.intType), 0],
    ["optimizes 0.0/", core.binaryExpression("/", 0.0, 1.1, core.floatType), 0.0],
    ["folds negation", core.unaryExpression("-", 5, core.intType), -5],
    ["optimizes 1** for ints", core.binaryExpression("**", 1, 2, core.intType), 1],
    ["optimizes 1** for floats", core.binaryExpression("**", 1.0, 2.0, core.floatType), 1.0],
    ["optimizes **0", core.binaryExpression("**", 2, 0, core.intType), 1],
    ["removes left false from ||", or(false, less(1, 2)), less(1, 2)],
    ["removes right false from ||", or(less(1, 2), false), less(1, 2)],
    ["removes left true from &&", and(true, less(1, 2)), less(1, 2)],
    ["removes right true from &&", and(less(1, 2), true), less(1, 2)],
    ["folds and", and(true, true), true],
    ["folds or", or(true, false), true],
    ["folds and", and(false, false), false],
    ["folds or", or(false, false), false],
    ["removes x=x at beginning", program([assign(x_int, x_int), x_inc]), program([x_inc])],
    ["removes x=x at end", program([x_inc, assign(x_int, x_int)]), program([x_inc])],
    ["removes x=x in middle", program([x_inc, assign(x_int, x_int), x_inc]), program([x_inc, x_inc])],
    ["optimizes if true", core.ifStatement(true, [x_inc], []), [x_inc]],
    ["optimizes if false", core.ifStatement(false, [], [x_inc]), [x_inc]],
    ["optimizes short if true", core.shortIfStatement(true, [x_inc]), [x_inc]],
    ["optimizes short if false", core.shortIfStatement(false, [x_inc]), []],
    ["optimizes while false", program([core.whileStatement(false, [x_inc])]), program([])],
    ["optimizes repeat 0", program([core.repeatStatement(0, [x_inc])]), program([])],
    ["optimizes for range", core.forRangeStatement(x_int, 0, "...", 5, [x_inc]), []],
    ["optimizes left conditional true", core.ternaryExpression("?", true, 54, 234), 54],
    ["optimizes left conditional false", core.ternaryExpression("?", false, 54, 234), 234],
    ["optimizes in subscript", sub(x_list, add_operation), sub(x_list, 2)],
    ["optimizes in list literals", list_statement(add_operation, 4, 2), list_statement(2, 4, 2)],
    ["optimizes in arguments", core.functionCall("foo", [add_operation], core.intType), core.functionCall("foo", [2], core.intType)],
    // ["passes through non-optimizable constructs",
    //     ...Array(2).fill([
    //         core.program([core.shortReturnStatement]),
    //         core.variableDeclaration("x", 5, core.intType),
    //         core.assignmentStatement("x", 5, core.intType),
    //     ])
    // ]
]

describe("The optimizer", () => {
    for (const [scenario, before, after] of tests) {
        it(`${scenario}`, () => {
            assert.deepEqual(optimize(before), after)
        })
    }
})