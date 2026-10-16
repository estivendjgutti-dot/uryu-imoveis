import { compile, optimize } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { writeFile } from "node:fs/promises";
export async function buildStyles(destination = "dist/theme.css") {
  const scanner = new Scanner({ sources: [{ base: process.cwd(), pattern: "index.html", negated: false }] });
  const compiler = await compile('@import "tailwindcss";\n@config "./tailwind.config.cjs";', {
    base: process.cwd(), onDependency() {},
  });
  const result = optimize(compiler.build(scanner.scan()), { minify: true });
  await writeFile(destination, result.code);
}
