import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const b=readFileSync(new URL("../assets/guia-conexion-b.html",import.meta.url),"utf8");
const hub=readFileSync(new URL("../assets/guias-conexion.html",import.meta.url),"utf8");
const memo=readFileSync(new URL("../docs/guia-conexion-b-tools.md",import.meta.url),"utf8");
assert.match(hub,/href="guia-conexion-b\.html"/);
assert.match(hub,/href="#c-title"/);
assert.match(hub,/GUÍA DISPONIBLE · ABRIR/);
assert.match(b,/href="guias-conexion\.html#c-title"/);
assert.match(b,/screen=s4-mcp/);
for(const term of ["Lambda y OpenAPI","MCP remoto","CTRL-25","D-03","SP-04","SP-05","tools/list","tools/call","isError: true","solo_workload","2026-07-28","DynamoDB","agent_token"]){
 assert.ok(b.includes(term),"Missing B requirement: "+term);
}
const cards=[...b.matchAll(/<article class="case" data-cloud="(aws|azure|gcp|hybrid)">/g)];
assert.equal(cards.length,8,"B must have 8 scenario cards");
for(const cloud of ["aws","azure","gcp","hybrid"])assert.ok(cards.some(x=>x[1]===cloud),"Missing cloud "+cloud);
assert.equal((b.match(/<details><summary>Pasos concretos<\/summary>/g)||[]).length,8);
assert.equal((b.match(/class="source"/g)||[]).length,8);
for(const filter of ["all","aws","azure","gcp","hybrid"])assert.match(b,new RegExp('data-filter="'+filter+'"'));
assert.match(b,/card.hidden=!show/);
assert.match(b,/button.setAttribute\("aria-pressed",String\(button===b\)\)/);
assert.match(b,/aria-live="polite"/);
assert.match(b,/prefers-reduced-motion/);
assert.match(b,/role="region"/);
for(const domain of ["docs.aws.amazon.com","learn.microsoft.com","docs.cloud.google.com"])assert.ok(b.includes(domain),domain);
assert.match(memo,/no una métrica empírica/);
console.log("connection-b-guide-qa: OK (8 escenarios, filtros, fuentes, contrato, navegación)");
