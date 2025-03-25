import { describe, it } from "node:test";
import { ok, deepEqual, throws } from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import { program, variableDeclaration, variable, intType, floatType, binaryExpression } from "../src/core.js";

const semanticChecks = [
  ["int variable declaration", "thine x: int = 1;"],
  ["string variable declaration", "thine x: float = 1.0;"],
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

  //   it("produces the expected representation for a trivial program", () => {
  //     deepEqual(
  //       analyze(parse("let x = π + 2.2;")),
  //       program([
  //         variableDeclaration(
  //           variable("x", true, floatType),
  //           binary("+", variable("π", false, floatType), 2.2, floatType)
  //         ),
  //       ])
  //     );
  //   });
});
