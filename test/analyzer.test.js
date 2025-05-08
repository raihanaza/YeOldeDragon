import { describe, it } from "node:test";
import assert from "node:assert/strict";
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
  ["function call", `don incNum(num: int) -> int { num++; return num; } incNum(num: 5);`],
  ["increment statement", "thine x: int = 1; x++;"],
  ["decrement statement", "thine x: float = 3.1; x--;"],
  ["assignment statement", "thine testvar: int = 2; testvar = 1;"],
  [
    "break statement",
    `don breakTest(num: int) -> void { whilst num > 5 { proclaim("num is right size"); perchance num == 13 { proclaim("num is unlucky!"); breaketh; } } } `,
  ],
  ["long return", "don funcName(num: int) -> int { proclaim(num); return num; }"],
  ["function call", "don printNum(num: int) -> int { proclaim(num); } printNum(num: 5);"],
  ["short if statement", "thine x: float = 3.45; thine y: float = 8.99; perchance x > y { proclaim(y); }"],
  ["else if statement", "perchance shall { proclaim(1); } else { proclaim(3);}"],
  [
    "long if statement",
    `thine x: int = 4; thine y: int = 2; perchance (y > 3) { proclaim("y is greater than 3"); } else perchance y == (x/2) { proclaim("y is half of x");}`,
  ],
  ["short loop", "thine num: int = 10; whilst num > 5 { num = num/2; }"],
  ["short for loop", "fortill 5 { proclaim(1); }"],
  [
    "for in loop",
    `thine coins: [string] = ["dollar", "fifty cents", "twenty cents"]; fortill coin in coins { proclaim("Thee hath the following coins"); proclaim(coin); } `,
  ],
  ["range loop", `fortill i in 3...10 { proclaim("writing"); }`],
  ["ternary with ints", `thine num: int = 5; proclaim(num == 5 ? "it is" : "it is not"); `],
  [
    "or operator",
    `thine num1: int = 2; thine num2: int = 6; perchance (num1 == 2 || num2 % 2 == 0) { proclaim("yipee"); } `,
  ],
  [
    "and operator",
    `thine num1: int = 2; thine num2: int = 6; perchance (num1 == 2 && num2 % 2 != 0) { proclaim("yipee"); } `,
  ],
  ["exponents", "thine num: float = 4.2; thine num_sqrd: float = num^2.0;"],
  ["negative numbers", "thine num: int = -23; num = num + 24;"],
  ["not value", `thine isNot: boolean = shall; perchance ne isNot { proclaim("It is!"); }`],
  //TODO: add ne operator tests with lists
  ["creating empty optional", "thine studentAge: int? = zilch int;"],
  ["declare empty list", "thine nums: [int] = [];"],
  ["declare list elements", "thine numList: [int] = [1, 2, 3];"],
  ["printing from subscript", "thine numList: [int] = [1, 2, 3]; proclaim(numList[1]);"],
  ["reassigning value at subscript in list", "thine numList: [int] = [1, 2, 3]; numList[1] = 5;"],
  ["struct declaration", `matter Person { name: string age: int }`],
  [
    "class declaration",
    `matter car { init (make: string, model: string, year: int) {
      ye.make: string = make;
      ye.model: string = model;
      ye.year: int = year; }
    }`,
  ],
  [
    "member check",
    `matter Car {
      init (color: string, model: string, year: int) {
        ye.color: string = color;
        ye.model: string = model;
        ye.year: int = year;
      }
    }
    thine car: Car = Car(color: "blue", model: "ford", year: 2025);
    proclaim("This car is a \${car.model} in the color \${car.color}.");
    `,
  ],
  [
    "member reassignment",
    `matter Car {
      init (color: string, model: string, year: int) {
        ye.color: string = color;
        ye.model: string = model;
        ye.year: int = year;
      }
    }
    thine car: Car = Car(color: "blue", model: "ford", year: 2025);
    car.color = "green";
    `,
  ],
  ["empty return", `don addNums(a: int, b: int) -> void { perchance (a + b) > 5 { return; }}`],
  [
    "string interpolation",
    `thine bankBalance: int = 5234; proclaim("Your current balance is \${bankBalance}. This is the end of your transaction.");`,
  ],
  ["nil-coalescing operator", `thine maybe: string? = zilch string; proclaim(maybe ?? "nil coalesced");`],
  [
    "checking if field exists",
    `matter Car {
      init (color: string, model: string, year: int) {
        ye.color: string = color;
        ye.model: string = model;
        ye.year: int = year;
      }

      don vroom() -> string {
        proclaim("\${ye.model} goes vroom");
      }
    }
    `,
  ],
  [
    "checking if optional member in class",
    `matter Coffee {
      init(roast: int, name: string, origin: string?, seasonal: boolean?) {
          ye.roast: int = roast + 2;
          ye.name: string = name;
          ye.origin: string? = zilch string;
          ye.seasonal: boolean? = seasonal;
      }

      don countryOfOrigin() -> string? {
          return ye?.origin ?? "unknown";
      }
    }`,
  ],
  [
    `optional member check`,
    `matter Car {
        init (color: string, model: string, year: int, yearsOwned: int?) {
          ye.color: string = color;
          ye.model: string = model;
          ye.year: int = year;
          ye.yearsOwned: int? = 0;
        }
      }
      thine car: Car? = Car(color: "blue", model: "ford", year: 2025, yearsOwned: zilch int);
      proclaim("This \${car?.model} in \${car?.color} has been owned for \${car?.yearsOwned} years.");`,
    //TO ADD: optional member check for classes when called
  ],
  [
    `class field as an ObjectType`,
    `
    matter Coffee {
      init() {
          ye.roast: int = 0;
      }
    }

    matter Drink {
        init(drink: Coffee) {
            ye.drink: Coffee = drink;
        }
    }
    `,
  ],
];

const semanticErrors = [
  //TODO: fix errorMessagePatterns
  ["calling an undeclared id", "proclaim(x);", /x not declared/],
  ["assigning zilch to non-optional", "thine x: int = 4; x = zilch int;"],
  [
    "returning something in void return function",
    "don fun() -> void { return(1); }",
  ],
  [
    "calling a function that does not exist in a class",
    `matter Car {
      init (color: string, model: string, year: int) {
        ye.color: string = color;
        ye.model: string = model;
        ye.year: int = year;
      }

      don vroom() -> string {
        proclaim("this car goes vroom");
      }
    }
    thine car: Car = Car(color: "blue", model: "ford", year: 2025);
    car.refuel();
    `,
    ///Object type car does not have a field refuel()/
  ],
  [
    "calling a member that does not exist in a class",
    `matter Car {
      init (color: string, model: string, year: int) {
        ye.color: string = color;
        ye.model: string = model;
        ye.year: int = year;
      }
    }
    thine car: Car = Car(color: "blue", model: "ford", year: 2025);
    proclaim("This car is of make \${car.make}.");
    `,
    ///Object type car does not have a field make/
  ],
  [
    "calling ye outside of a class",
    `matter Car {
      init (color: string, model: string, year: int) {
        ye.color: string = color;
        ye.model: string = model;
        ye.year: int = year;
      }
    }
    thine car: Car = Car(color: "blue", model: "ford", year: 2025);
    proclaim("This car is of make \${ye.make}.");
    `,
  ],
  ["assigning to a constant", "fact x: int = 1; x = 5;"],
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
    );
  });
});
