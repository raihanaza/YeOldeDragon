import { describe, it } from "node:test";
import assert from "node:assert/strict"
import { ok, deepEqual, throws } from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import { program, variableDeclaration, variable, intType, floatType, binaryExpression } from "../src/core.js";

const semanticChecks = [
  ["int variable declaration", "thine x: int = 1;"],
  ["float variable declaration", "thine x: float = 1.0;"],
  ["string variable declaration", 'thine dessert: string = "cake";'],
  ["constant declaration", "fact x: int = 5;"],
  ["print statement", 'proclaim("This is a statement");'],
  //TODO: add function check 
  ["increment statement", "thine x: int = 1; x++;"],
  ["decrement statement", "thine x: float = 3.1; x--;"],
  //["assignment statement", "thine x: int = 2; x = 1;"],
  //TODO: add break statement check
  //["long return", "don funcName(num: int) : int { num++; proclaim(num); return num; }"],
  ["short if statement", "thine x: float = 3.45; thine y: float = 8.99; perchance x > y { proclaim(y); }"],
  ["else if statement", "perchance shall { proclaim(1); } else { proclaim(3);}"],
  ["long if statement", `thine x: int = 4; thine y: int = 2; perchance (y > 3) { proclaim("y is greater than 3"); } else perchance y == (x/2) { proclaim("y is half of x");}`],
];

const semanticErrors = [
  //["variable declaration with mismatched types", "thine x: bool = 1;", /Type mismatch. Expected type bool but got int/],
  //["variable declaration with mismatched types", "thine x: bool = 1;"],
];

describe("The analyzer", () => {
  for (const [scenario, source] of semanticChecks) {
    it(`recognizes ${scenario}`, () => {
      ok(analyze(parse(source)));
    });
  }

  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`throws on ${scenario}`, () => {
      throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }

  it("produces the expected representation for a trivial program", () => {
    assert.deepEqual(
      analyze(parse("thine x: float = 3.1 + 2.2;")),
      program([
        variableDeclaration(
          variable("x", floatType, true),
          binaryExpression("+", 3.1, 2.2, floatType)
        ),
      ])
    )
  })
});
