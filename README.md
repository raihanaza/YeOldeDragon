# Ye Olde Dragon

## Introduction 
Ye Olde Dragon is a statically-typed, object-oriented scripting language whose name was inspired by its parent languages, Python🐉, Javascript 📜, and Swift (like a dragon 🏃‍♂️💨). We intend to bring together the best of all three worlds to create a highly effective and readable language that combines our favorite features and strengths from each. Ye Olde Dragon’s easily understandable syntax makes it an accessible language for beginners and experienced programmers alike, due to its powerful and versatile functionalities.

Ye Olde Dragon is brought to you by [Raihana Zahra](https://github.com/raihanaza), [Lauren Campbell](https://github.com/laurenindira), [Cecilia Zaragoza](https://github.com/ceciliazaragoza), and [Z Anderson](https://github.com/alexanderson22). 

## Features
- .yod File Extension
- Static and strong typing
- Manifest typing 
- Ternary Conditional Statement
- Truthy/Falsy types
- Switch statements without fall-through


## Types
| Name          | Type           |
|--------------|-----------------|
| YeOldeDragon | JavaScript      |
| String       | String          |
| Int          | Number          |
| Float        | Number          |
| Boolean      | Boolean         |
| Zilch        | null, undefined |


## Data Structures
| Structure  | JavaScript Syntax       | dragonCafe Syntax                  |
|------------|------------------------|-------------------------------------|
| Lists      | `[a, b, c, d]`          | `[dragon, dragin, dragen]`         |
| Objects    | `{ 'a': 'b', 'c': 'd' }` | `{ "dragon": "a", "drugon": "b" }` |


## Operators
| Operator                 | Symbol  | Type Compliance                   |
|--------------------------|--------|-----------------------------------|
| Optional Chaining        | `?.`   | Object                            |
| Optional Type            | `?`    | All                               |
| Ternary Operator         | `??`   | All                               |
| Addition                 | `+`    | Int, Float, String                |
| Subtraction              | `-`    | Int, Float                        |
| Multiplication           | `*`    | Int, Float, String, List          |
| Division                 | `/`    | Int, Float                        |
| Increment                | `++`   | Int, Float                        |
| Decrement                | `--`   | Int, Float                        |
| Exponentiation           | `^`    | Int, Float                        |
| Modulus                  | `%`    | Int, Float                        |
| Greater Than             | `>`    | Int, Float                        |
| Greater Than or Equal To | `>=`   | Int, Float                        |
| Less Than                | `<`    | Int, Float                        |
| Less Than or Equal To    | `<=`   | Int, Float                        |
| Equal To                 | `==`   | All                               |
| NOT Equal To             | `!=`   | All                               |
| Boolean OR               | `||`   | Boolean                           |
| Boolean AND              | `&&`   | Boolean                           |
| Boolean NOT              | `!`    | Boolean, List                     |
| Attributor               | `.`    | Object                            |
| List Indexer             | `[]`   | List                              |
| Assignment               | `=`    | All                               |

## Code Examples
Here are some examples, Ye Olde Dragon on the left, JavaScript on the right.

### Comments
| YeOldeDragon   | JavaScript                   |
|---------------|------------------------------|
| `~ This is a comment` | `// This is a comment` |
| `~ This is a multiline comment` <br> `That takes up multiple lines` | `/* This is a multiline comment` <br> `That takes up multiple lines */` |


### Hello World
| YeOldeDragon                           | JavaScript                      |
|----------------------------------------|--------------------------------|
| `proclaim("Hello, dragons!!!!");`     | `console.log("Hello, world");` |


### Variable Binding
| YeOldeDragon                           | JavaScript                     |
|----------------------------------------|--------------------------------|
| `thine gold_cups: int = 8;`           | `let goldCups = 8;`           |
| `fact pi: float = 3.14159;`           | `const pi = 3.14159;`         |


### Type Conversions 
| YeOldeDragon                                      | JavaScript                               |
|--------------------------------------------------|------------------------------------------|
| `thine beverages = 5;`                           | `let beverages = 5;`                     |
| `thine beveragesButAString = toString(beverages);` | `let beveragesButAString = String(beverages);` |


### Loops
| YeOldeDragon                                              | JavaScript                                             |
|----------------------------------------------------------|--------------------------------------------------------|
| `thine coins: [string] = ["gold", "silver", "bronze"];`  | `let coins = ["gold", "silver", "bronze"];`           |
|                                                          |                                                        |
| `fortill (coin in coins) {`                              | `for (coin in coins) {`                                |
| `    proclaim("We have a " + coin.length + " today!");`  | `    console.log("We have a " + coins.length + " today!");` |
| `}`                                                      | `}`                                                    |
|                                                          |                                                        |
| `thine dragons = 10`                                     | `let dragons = 10;`                                    |
|                                                          |                                                        |
| `whilst (dragons > 0) {`                                 | `while (dragons > 0) {`                                |
| `    proclaim("There are " + toString(dragons) + " left in the café");` | `    console.log("There are " + dragons + " left in the café");` |
| `    dragons--;`                                         | `    dragons--;`                                       |
| `}`                                                      | `}`                                                    |

### Conditionals
| YeOldeDragon                                          | JavaScript                                         |
|------------------------------------------------------|--------------------------------------------------|
| `doth (caféIsOpen == shall) {`                       | `if (caféIsOpen == true) {`                     |
| `    proclaim("It is open!");`                       | `    console.log("It is open!");`               |
| `} doth not (caféIsOpen == shant) {`                 | `} else if (caféIsOpen == false) {`             |
| `    proclaim("It is closed!");`                     | `    console.log("It is closed!");`             |
| `} not {`                                           | `} else {`                                      |
| `    proclaim("Lowkey, we don’t know what happened here…");` | `    console.log("Lowkey, we don’t know what happened here…");` |
| `}`                                                 | `}`                                              |


### Functions
| YeOldeDragon                                              | JavaScript                                     |
|----------------------------------------------------------|----------------------------------------------|
| `don addNums(num1: int, num2: int) -> int {`             | `function addNums(num1, num2) {`             |
| `    return (num1 + num2);`                              | `    return num1 + num2;`                    |
| `}`                                                      | `}`                                          |
|                                                          |                                              |
| `proclaim(addNums(num1: 22, num2: 3));`                  | `console.log(addNums(22, 3));`               |
| `~ Expected output: 25`                                  | `// Expected output: 25`                     |

