import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import compile from "../src/compiler.js";

const sampleProgram = [
    [
    `
    thine x: string = "hello";
    proclaim("Good morrow, \${x} fair world!");

    don factorial(num: int) -> int {
        perchance ((num == 0) || (num == 1)) {
            return 1;
        }
        return num * factorial(num: num - 1);
    }

    proclaim(factorial(num: 5));
    `
    ],
]
    
describe ('The compiler', () => {
    it("throws when the output type is missing", () => {
        assert.throws(() => compile(sampleProgram), /Unknown output type/)
    })
    it ("throws when the output type is unknown", () => {
        assert.throws(() => compile(sampleProgram, "no such type"), /Unknown output type/)
    })
    it ("accepts the parsed option", () => {
        const compiled = compile(sampleProgram, "parsed");
        assert(compiled.startsWith("Syntax is ok"))
    })
    it ("accepts the analyzed option", () => {
        const compiled = compile(sampleProgram, "analyzed");
        assert(compiled.kind === "Program")
    })
    it ("accepts the optimized option", () => {
        const compiled = compile(sampleProgram, "optimized");
        assert(compiled.kind === "Program")
    })
    it ("generates js code when given the js option", () => {
        const compiled = compile(sampleProgram, "js");
        assert(compiled.startsWith("let x_1 = \"hello\";"))
    })
});