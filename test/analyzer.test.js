import { describe, it } from "node:test"
import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import { program, variableDeclaration, variable, intType, floatType, binaryExpression } from "../src/core.js"

const semanticChecks = [
    ["variable declaration", 'thine x: int = 1;']
]

const semanticErrors = [
    []
]

describe("The analyzer", () => {
    for (const [scenario, source] of semanticChecks) {
        it(`recognizes ${scenario}`, () => {
            assert.ok(analyze(parse(source)));
        });
    }

    for (const [scenario, source, errorMessagePattern] of semanticErrors) {
        it(`throws on ${scenario}`, () => {
            assert.throws(() => analyze(parse(source)), errorMessagePattern);
        });
    }

    it("produces the expected representation for a trivial program", () => {
        assert.deepEqual(
            analyze(parse("thine x: int = 1 + 2;")),
            program([
                variableDeclaration(
                    variable("x", intType), 
                    binaryExpression("+", "1", "2", intType)
                ),
            ])
        );
    })
});