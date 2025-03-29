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
  ["true statement", `perchance shant { proclaim("It shan't be"); }`],
  ["empty function", "don addNums(num1: int, num2: int) -> int { return (num1 + num2); } "],
  ["function declaration", "don incrementFunction(num: int) -> int { num++; return num; }"],
//   //TODO: add function call 
  ["increment statement", "thine x: int = 1; x++;"],
  ["decrement statement", "thine x: float = 3.1; x--;"],
  ["assignment statement", "thine testvar: int = 2; testvar = 1;"],
  ["break statement", `don breakTest(num: int) -> void { whilst num > 5 { proclaim("num is right size"); perchance num == 13 { proclaim("num is unlucky!"); breaketh; } } } `],
  ["long return", "don funcName(num: int) -> int { proclaim(num); return num; }"],
  // ["function call", "don printNum(num: int) -> int { proclaim(num); } printNum(5);"],
  ["short if statement", "thine x: float = 3.45; thine y: float = 8.99; perchance x > y { proclaim(y); }"],
  ["else if statement", "perchance shall { proclaim(1); } else { proclaim(3);}"],
  ["long if statement", `thine x: int = 4; thine y: int = 2; perchance (y > 3) { proclaim("y is greater than 3"); } else perchance y == (x/2) { proclaim("y is half of x");}`],
// //   TODO: FIX LIST TYPES 
  ["short loop", "thine num: int = 10; whilst num > 5 { num = num/2; }"],
  ["short for loop", "fortill 5 { proclaim(1); }"],
  ["for in loop", `thine coins: [string] = ["dollar", "fifty cents", "twenty cents"]; fortill coin in coins { proclaim("Thee hath the following coins"); proclaim(coin); } `],
  ["ternary with ints", `thine num: int = 5; proclaim(num == 5 ? "it is" : "it is not"); `],
  ["or operator", `thine num1: int = 2; thine num2: int = 6; perchance (num1 == 2 || num2 % 2 == 0) { proclaim("yipee"); } `],
  ["and operator", `thine num1: int = 2; thine num2: int = 6; perchance (num1 == 2 && num2 % 2 != 0) { proclaim("yipee"); } `],
//   TODO: add objects, nilcoalescing, and membership tests
  ["exponents", "thine num: float = 4.2; thine num_sqrd: float = num^2.0;"],
  ["negative numbers", "thine num: int = -23; num = num + 24;"],
  ["not value", `thine isNot: boolean = shall; perchance ne isNot { proclaim("It is!"); }`],
  //TODO: add ne operator tests with lists
  // ["creating empty optional", "thine studentAge: float?"],
  ["declare empty list", "thine nums: [int] = [];"],
  ["declare list elements", "thine numList: [int] = [1, 2, 3];"],
  ["printing from subscript", "thine numList: [int] = [1, 2, 3]; proclaim(numList[1]);"],
  ["reassigning value at subscript in list", "thine numList: [int] = [1, 2, 3]; numList[1] = 5;"],
];

const semanticErrors = [
  //["variable declaration with mismatched types", "thine x: bool = 1;", /Type mismatch. Expected type bool but got int/],
  //["variable declaration with mismatched types", "thine x: bool = 1;",],
  //["don addNums(num1: int, yes: boolean) -> int { return num1 + yes; }",],
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
