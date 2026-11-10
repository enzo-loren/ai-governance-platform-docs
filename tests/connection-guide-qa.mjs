import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
const index=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const html=readFileSync(new URL("../assets/guias-conexion.html",import.meta.url),"utf8");
const doc=readFileSync(new URL("../docs/guia-conexiones-identidad.md",import.meta.url),"utf8");
assert.match(index,/<nav class="header-nav"[^>]*>[\s\S]*?href="assets\/guias-conexion\.html"/);
assert.match(index,/assets\/console\.html\?slice=S0/);
assert.match(index,/href="assets\/arquitectura\.html"/);
assert.match(index,/agentic-ai-governance-platform\/tree\/main\/insumo/);
for(const text of ["Guías de conexión","Tools por MCP","GUÍA DISPONIBLE · ABRIR","Identidad del usuario","CONEXIÓN C","X-Gov-User-Token","agent_token","solo_workload","aud","client_id","RFC 9068","On-Behalf-Of","resource binding"]){
  assert.ok(html.includes(text),"Missing content: "+text);
}
for(const source of ["docs.aws.amazon.com","learn.microsoft.com","firebase.google.com","docs.cloud.google.com","rfc-editor.org"]){
  assert.ok(html.includes(source),"Missing source: "+source);
}
const cards=[...html.matchAll(/<article class="scenario" data-cloud="(aws|azure|gcp|hybrid)">/g)];
assert.equal(cards.length,8,"Expected eight scenario cards");
for(const cloud of ["aws","azure","gcp","hybrid"])assert.ok(cards.some(x=>x[1]===cloud),"Missing cloud "+cloud);
assert.equal((html.match(/<details><summary>Pasos de integración<\/summary>/g)||[]).length,8);
assert.equal((html.match(/class="source"/g)||[]).length,8);
for(const key of ["all","aws","azure","gcp","hybrid"])assert.match(html,new RegExp('data-filter="'+key+'"'));
assert.match(html,/card\.hidden=!show/);
assert.match(html,/b\.setAttribute\("aria-pressed",String\(b===button\)\)/);
assert.match(html,/aria-live="polite"/);
assert.match(html,/prefers-reduced-motion/);
assert.match(html,/screen=s4-guide/);
assert.match(html,/href="guia-conexion-b.html"/);
assert.match(html,/href="#c-title"/);
assert.doesNotMatch(html,/screen=s4-connect/);
assert.match(doc,/decisión de arquitectura pendiente/i);
assert.ok(existsSync(new URL("../assets/arquitectura.html",import.meta.url)));
console.log("connection-guide-qa: OK (8 casos, navegación, accesibilidad, fuentes y contrato)");
