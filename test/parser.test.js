import { describe, it } from "node:test";
import { ok, deepEqual, throws } from "node:assert/strict";
import parse from "../src/parser.js";
import { error } from "node:console";

const syntaxChecks = [
    ["simplest syntactically correct program", `proclaim("Hello World!");`],
    ["simplest syntactically correct program2", "whilst true { breaketh; }"],
    ["variable declaration", `thine x: num = 42;`],
    ["constant declaration", `fact name: string = "romeo";`],
    ["print statement", `proclaim "Hello, world!";`],
    ["function declaration", `don add(a: num, b: num): num { return a + b; }`],
    ["function call", `fact result: num = add(1, 2);`],
    ["if statement", `perchance shall { proclaim "It's true!"; } else { proclaim "It's false!"; }`],
    ["loop statement", `thine x: num = 1; whilst x < 10 { x = x + 1; }`],
    ["for each loop", `fortill item in [1, 2, 3] { proclaim item; }`],
    ["object constructor", `matter Person {name: string, age: num}`],
    ["object instantiation", `fact romeo: Person = Person("Romeo", 16);`],
    ["array declaration", `thine numbers: [num] = [1, 2, 3];`],
    ["addsub expression", `thine result: num = (4 + 2) * 2 - 1;`],
    ["muldiv expression", `thine result: num = 4 + (2 * 2) / 2;`],
    ["comparison expression", `thine result: bool = 4 < 2;`],
    ["break expression", `perchance x == 4 { proclaim("X is 4"); } else { breaketh; }`],
    ["optional type", `thine isDriving: bool? = shall;`],
    ["relative and operators", `perchance (x > 7) && (z < 7) { proclaim("I used AND!"); }`],
    ["relative or operators", `perchance (x > 7) || (z < 7) { proclaim("I used OR!"); }`],
    ["exponential operator", `thine result: num = 2 ^ 3;`],
    ["empty array", `thine empty: [num] = [];`],
];

const syntaxErrors = [
    ["non-letter in an identifier", "thine ab😭c = 2;", /Line 1, col 9:/],
    ["missing semicolon", "thine x: num = 10", /Line 1, col 18/],
    ["missing type", "thine x = 10;", /Line 1, col 9/],
    ["missing expression", "thine x: num = ;", /Line 1, col 16/],
    ["missing identifier", "thine : num = 10;", /Line 1, col 7/],
    ["unterminated string", 'thine msg: string = "Hello;', /Line 1, col 28/],
    ["missing closing parenthesis", "thine result: num = (4 + 2 * 2 - 1;", /Line 1, col 35/],
    ["missing condition in if", "perchance { proclaim 'It's true!'; } else { proclaim 'It's false!'; }", /Line 1, col 11/],
    ["invalid function call", "add(1 2 3);", /Line 1, col 5/],
    ["incomplete number", "thine x: num = 10.", /Line 1, col 19/],
    ["number with incomplete floating point", "thine x: num = 5E * 3;", /Line 1, col 17/],
    ["bad array literal", "proclaim([1, 2,];", /Line 1, col 16/],
    ["shall is not assignable", "shall = 1;", /Line 1, col 6/],
    ["shant is not assignable", "shant = 1;", /Line 1, col 6/],
];

describe("The parser", () => {
    for (const [scenario, source] of syntaxChecks) {
        it(`matches ${scenario}`, () => {
            ok(parse(source).succeeded());
        });
    }
    for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
        it(`throws error on ${scenario}`, () => {
            throws(() => parse(source), errorMessagePattern)
        })
    }
});
