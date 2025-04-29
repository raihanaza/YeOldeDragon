// import { describe, it } from "node:test"
// import assert from "node:assert/strict"
// import optimize from "../serc/optimizer.js"
// import * as core from "../src/core.js"

// // Basic variables used in test cases
// const x = core.variable("x", core.intType, true)
// const x_list = core.variable("x_list", core.listType(core.intType), true)
// const x_inc = core.incrementStatement(x_inc)
// const x_dec = core.decrementStatement(x_dec)
// const return_add = core.returnStatement(core.binaryExpression("+", 1, 1, core.intType))
// const return_string = core.returnStatement("Hello, World!")
// const add_operation = core.binaryExpression("+", 1, 1, core.intType)
// const assign = (v, e) => core.assignmentStatement(v, e, core.intType)
// const empty_list = core.emptyListExpression(core.intType)
// const program = core.program

// const tests = [
//     ["folds +", core.binaryExpression("+", 2, 3, core.intType), 5],
//     ["folds -", core.binaryExpression("-", 5, 3, core.intType), 2],
//     ["folds *", core.binaryExpression("*", 2, 10, core.intType), 20],
//     ["folds /", core.binaryExpression("/", 10, 2, core.intType), 5],
// ]

// describe("The optimizer", () => {
//     for (const [scenario, before, after] of tests) {
//         it(`${scenario}`, () => {
//             assert.deepEqual(optimize(before), after)
//         })
//     }
// })