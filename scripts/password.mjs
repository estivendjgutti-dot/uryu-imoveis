import { hashPassword } from "../server/auth.mjs";
process.stdout.write("Digite a senha administrativa (não será exibida): ");
process.stdin.setRawMode(true);
process.stdin.resume();
let value = "";
process.stdin.on("data", (chunk) => {
  for (const character of chunk.toString()) {
    if (character === "\r" || character === "\n") {
      process.stdin.setRawMode(false);
      if (value.length < 12) {
        console.error("\nUse pelo menos 12 caracteres.");
        process.exit(1);
      }
      console.log("\nADMIN_PASSWORD_HASH=" + hashPassword(value));
      process.exit(0);
    }
    if (character === "\u0003") process.exit(1);
    if (character === "\u007f" || character === "\b")
      value = value.slice(0, -1);
    else value += character;
  }
});
