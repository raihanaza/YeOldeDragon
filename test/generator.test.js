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
            thine dragons: [string] = [];
        `,
    expected: dedent`
            let x_1 = 1;
            x_1 = x_1 + 2;
            let y_2 = 5;
            console.log(\`x is \${x_1} and y is \${y_2}.\`);
            let dragons_3 = [];
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
            proclaim(x == -5 ? "x is 5" : "x is not 5");

            thine y: int? = zilch int;
        `,
    expected: dedent`
            let isNot_1 = true;
            if (!(isNot_1)) {
                console.log("It is!");
            }

            let x_2 = 5;
            console.log((x_2 === -(5)) ? ("x is 5") : ("x is not 5"));

            let y_3 = null;
        `,
  },
  {
    name: "exponents",
    source: `
            thine dragon_scales: int = 2;
            thine dragon_scales_sqrd: int = dragon_scales^2;
      `,
    expected: dedent`
            let dragon_scales_1 = 2;
            let dragon_scales_sqrd_2 = dragon_scales_1 ** 2;
      `,
  },
  {
    name: "non void function",
    source: `
            don add(num1: int, num2: int) -> int {
                thine result: int = num1 + num2;
                return result;
            }

            add(num1: 2, num2: 3);
    `,
    expected: dedent`
            function add_1(num1_2, num2_3) {
                let result_4 = num1_2 + num2_3;
                return result_4;
            }

            add_1(2, 3);
    `,
  },
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

            breakTest(num: 89);
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

            breakTest_1(89);
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

            perchance x == 9.99 {
                proclaim("x is 9.99");
            } else {
                proclaim("x is not 9.99");
            }
        `,
    expected: dedent`
            let x_1 = 3.45;
            let y_2 = 8.99;
            if (x_1 > y_2) {
              console.log(y_2);
            } else
              if (x_1 < y_2) {
                console.log(x_1);
              } else {
                console.log("x and y are equal");
              }

            if (x_1 === 9.99) {
              console.log("x is 9.99");
            } else {
              console.log("x is not 9.99");
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
            proclaim(dragons[0]);
        `,
    expected: dedent`
            let dragons_1 = ["Night Fury", "Monstrous Nightmare", "Nadder", "Gronkle"];
            for (let dragon_2 of dragons_1) {
                console.log(\`Thee hath trained the following dragon: \${dragon_2}\`);
            }
            console.log(dragons_1[0]);
        `,
  },
  {
    name: "repeat loop",
    source: `
            fortill 5 {
                proclaim("Hello!");}
      `,
    expected: dedent`
            for (let i_1 = 0; i_1 < 5; i_1++) {
                console.log("Hello!");
            }
      `,
  },
  {
    name: "object declaration",
    source: `
            matter Coffee {
                name: string
                roast: string
                seasonal: boolean
            }
      `,
    expected: dedent`
            class Coffee_1 {
                constructor(name_2,roast_3,seasonal_4) {
                    this["name_2"] = name_2;
                    this["roast_3"] = roast_3;
                    this["seasonal_4"] = seasonal_4;
                }
            }
      `,
  },
  {
    name: "class declaration",
    source: `
            matter Car {
                init (color: string, model: string, year: int) {
                    ye.color = color;
                    ye.model = model;
                    ye.year = year;
                }

                don vroom() -> void {
                    proclaim("vroom vroom");
                }
            }
            thine car: Car = Car(color: "blue", model: "ford", year: 2025);
            proclaim("This \${car.model} in \${car.color} is a \${car.year} model.");

            thine car2: Car? = Car(color: "blue", model: "ford", year: 2025);
            proclaim("This \${car?.model} in \${car?.color} is a \${car?.year} model.");
      `,
    expected: dedent`
            class Car_1 {
                constructor(color_2,model_3,year_4) {
                    this["color_2"] = color_2;
                    this["model_3"] = model_3;
                    this["year_4"] = year_4;
                }
                vroom_5() {
                    console.log("vroom vroom");
                }
            }
            let car_6 = new Car_1(color_7, model_8, year_9);
            console.log("This \${car.model} in \${car.color} is a \${car.year} model.");
            let car2_10 = new Car_1(color_11, model_12, year_13);
            console.log("This \${car?.model} in \${car?.color} is a \${car?.year} model.");
      `,
  },
  {
    name: "short return statement",
    source: `
            don hello(name: string) -> void {
                perchance name == "" { return; }
                proclaim(name);
            }
    `,
    expected: dedent`
            function hello_1(name_2) {
                if (name_2 === "") {
                    return;
                }
                console.log(name_2);
            }
      `,
  },
  //   {
  //     name: "unary expression",
  //     source: `proclaim(-1);`,
  //     expected: dedent`console.log(-(1));`,
  //   },
  {
    name: "nil coalescing",
    source: `
        don hello(name: string?) -> void {
            proclaim(name ?? "no name");
        }
    `,
    expected: dedent`
            function hello_1(name_2) {
                console.log((name_2 ?? "no name"));
            }
    `,
  },
  //   {
  //       name: "",
  //       source: ``,
  //       expected: dedent``,
  //   },
  // {
  //     name: "",
  //     source: ``,
  //     expected: dedent``,
  // },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} progran`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
