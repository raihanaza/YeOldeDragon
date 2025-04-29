import { describe, it } from "node:test";
import assert from "node:assert/strict";
import optimize from "../src/optimizer.js";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import generate from "../src/generator.js";
import * as core from "../src/core.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

const fixtures = [
  {
    name: "basic strings",
    source: `
            proclaim("Hello, World!");
        `,
    expected: dedent`
            console.log("Hello, World!");
        `,
  },
  {
    name: "string interpolation",
    source: `
            thine dessert: string = "cake";
            proclaim("I like \${dessert}!");
        `,
    expected: dedent`
            let dessert_1 = "cake";
            console.log(\`I like \${dessert_1}!\`);
        `,
  },
  {
    name: "variables and constants",
    source: `
            thine x: int = 1;
            x = x + 2;
            fact y: int = 5;
            proclaim("x is \${x} and y is \${y}.");
        `,
    expected: dedent`
            let x_1 = 1;
            x_1 = x_1 + 2;
            const y_2 = 5;
            console.log(\`x is \${x_1} and y is \${y_2}.\`);
        `,
  },
  {
    name: "function declaration",
    source: `
        don incrementFunction(num: int) -> int {
            num++;
            return num;
        }
        `,
        expected: dedent`
            function incrementFunction_1(num_2) {
                num_2++;
                return num_2;
            }
        `,
  },
  {
    name: "unary and ternary",
    source: `
            thine isNot: boolean = shall;
            perchance ne isNot {
                proclaim("It is!");
            }

            thine x: int = 5;
            proclaim(x == 5 ? "x is 5" : "x is not 5");

            thine y: int? = zilch int;
        `,
    expected: dedent`
            let isNot_1 = true;
            if (!(isNot_1)) {
                console.log("It is!");
            }

            let x_2 = 5;
            console.log((x_2 === 5) ? ("x is 5") : ("x is not 5"));

            let y_3 = null;
        `,
  },
  // {
  //     name: "exponents",
  //     source: ``,
  //     expected: dedent``,
  // },
  // {
  //     name: "",
  //     source: ``,
  //     expected: dedent``,
  // },
  {
    name: "break statement",
    source: `
            don breakTest(num: int) -> void {
                whilst num > 5 {
                    proclaim("num is right size");
                    perchance num == 13 {
                        proclaim("num is unlucky!");
                        breaketh;
                    }
                }
            }
        `,
        expected: dedent`
            function breakTest_1(num_2) {
                while (num_2 > 5) {
                    console.log("num is right size");
                    if (num_2 === 13) {
                        console.log("num is unlucky!");
                        break;
                    }
                }
            }
        `,
  },
  {
    name: "increment and decrement",
    source: `
            thine x: int = 1;
            x++;
            thine y: int = x*2;
            y--;
        `,
    expected: dedent`
            let x_1 = 1;
            x_1++;
            let y_2 = x_1 * 2;
            y_2--;
        `,
  },
  {
    name: "ifStatement",
    source: `
            thine x: float = 3.45;
            thine y: float = 8.99;
            perchance x > y {
                proclaim(y);
            } else perchance x < y {
                proclaim(x);
            } else {
                proclaim("x and y are equal");
            }
        `,
    expected: dedent`
            let x_1 = 3.45;
            let y_2 = 8.99;
            if (x_1 > y_2) {
                console.log(y_2);
            } else if (x_1 < y_2) {
                console.log(x_1);
            } else {
                console.log("x and y are equal");
            }
        `,
  },
  {
    name: "normal loop",
    source: `
            thine num: int = 10;
            whilst num > 5 {
                num = num/2;
            }
            proclaim(num);
        `,
    expected: dedent`
            let num_1 = 10;
            while (num_1 > 5) {
                num_1 = num_1 / 2;
            }
            console.log(num_1);
        `,
  },
  {
    name: "range loop",
    source: `
            fortill i in 3...10 {
                proclaim("I am in the loop! Currently at \${i}");
            }
        `,
    expected: dedent`
            for (let i_1 = 3; i_1 <= 10; i_1++) {
                console.log(\`I am in the loop! Currently at \${i_1}\`);
            }
        `,
  },
  {
    name: "for in loop",
    source: `
            thine dragons: [string] = ["Night Fury", "Monstrous Nightmare", "Nadder", "Gronkle"];
            fortill dragon in dragons {
                proclaim("Thee hath trained the following dragon: \${dragon}");
            }
        `,
    expected: dedent`
            let dragons_1 = ["Night Fury", "Monstrous Nightmare", "Nadder", "Gronkle"];
            for (let dragon_2 of dragons_1) {
                console.log(\`Thee hath trained the following dragon: \${dragon_2}\`);
            }
        `,
  },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} progran`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
