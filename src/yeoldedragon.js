import * as fs from "fs";
import parse from "./parser.js";

if (process.argv.length !== 3) {
  console.error("Usage: node src/yeoldedragon.js FILENAME");
  process.exit(1);
}

const soureCode = fs.readFileSync(process.argv[2], "utf-8");
const match = parse(soureCode);
console.log("did parse")