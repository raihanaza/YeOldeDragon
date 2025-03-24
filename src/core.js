// TODO for HW 3
// define what are the important parts of your language

// this says that program is series of statements
// sketch out lang and see what kind of "things" you have
// look at How to Write a Compilers Notes and Carlos notes
export function program(statements) {
    return { kind: "Program", statements };
}

// since there is only ONE break statement, don't really need to write a func for, can make a const

// intrinsic functions are built into the lang. like print, cos, sin, etc.

// make func declaration more like cassowary since funcs not first-class in our lang

// don't really need to do covariant or contravariant stuff

//need to use isMutable func. recursiviely searches if expression is mutable or not