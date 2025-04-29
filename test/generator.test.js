import { describe, it } from "node:test"
import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import generate from "../src/generator.js"
import * as core from "../src/core.js"

function dedent(s) {
    return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
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
    // {
    //     name: "",
    //     source: ``,
    //     expected: dedent``,
    // },
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
]

describe("The code generator", () => {
    for (const fixture of fixtures) {
        it(`produces expected js output for the ${fixture.name} progran`, () => {
            const actual = generate(optimize(analyze(parse(fixture.source))))
            assert.deepEqual(actual, fixture.expected)
        })
    }
})