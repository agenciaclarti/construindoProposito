import { readFile } from "node:fs/promises";

const html = await readFile("index.html", "utf8");
const css = await readFile("styles.css", "utf8");
const script = await readFile("script.js", "utf8");
const failures = [];

const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
if (duplicateIds.length) failures.push("IDs duplicados: " + [...new Set(duplicateIds)].join(", "));

const hashTargets = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
const missingTargets = [...new Set(hashTargets.filter((target) => !ids.includes(target)))];
if (missingTargets.length) failures.push("Âncoras sem destino: " + missingTargets.join(", "));

const h1Count = (html.match(/<h1\b/g) || []).length;
if (h1Count !== 1) failures.push("A página deve conter exatamente um H1.");

for (const sectionId of ["inicio", "experiencia", "proposito", "imersao", "programacao", "ingressos"]) {
  if (!ids.includes(sectionId)) failures.push("Seção obrigatória ausente: #" + sectionId);
}

if (!html.includes('lang="pt-BR"')) failures.push("Idioma principal não definido.");
if (!html.includes('type="application/ld+json"')) failures.push("Schema Event ausente.");
if (!html.includes('name="description"')) failures.push("Meta description ausente.");
if (!css.includes("@media (prefers-reduced-motion: reduce)")) failures.push("Tratamento de movimento reduzido ausente.");
if (!script.includes('masterCheckoutUrl: ""') || !script.includes('vipCheckoutUrl: ""')) {
  failures.push("Configuração de checkout não está segura para URLs vazias.");
}

const openBraces = (css.match(/{/g) || []).length;
const closeBraces = (css.match(/}/g) || []).length;
if (openBraces !== closeBraces) failures.push("Blocos CSS desbalanceados.");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Validação concluída: estrutura, navegação, SEO, acessibilidade e configuração de ingressos.");
