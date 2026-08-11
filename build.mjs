import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const root = process.cwd();
const dist = join(root, "dist");
const client = join(dist, "client");

await rm(dist, { recursive: true, force: true });
await mkdir(join(dist, "server"), { recursive: true });
await mkdir(client, { recursive: true });

for (const file of ["index.html", "styles.css", "script.js"]) {
  await cp(join(root, file), join(client, file));
}
await cp(join(root, "assets"), join(client, "assets"), { recursive: true });

const worker = `export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && !url.pathname.includes('.')) {
      response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    }
    return response;
  }
};\n`;

await writeFile(join(dist, "server", "index.js"), worker, "utf8");

const html = await readFile(join(client, "index.html"), "utf8");
const normalizedHtml = html.toLocaleLowerCase("pt-BR");
if (!normalizedHtml.includes("workshop") || !normalizedHtml.includes("construindo propósito")) {
  throw new Error("A página compilada não contém o conteúdo principal esperado.");
}

console.log("Build concluído: dist/client + dist/server/index.js");
