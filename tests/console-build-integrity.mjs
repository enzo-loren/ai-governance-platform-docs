import {readFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import assert from "node:assert/strict";

const root=new URL("../",import.meta.url);
const read=async(path,binary=false)=>readFile(new URL(path,root),binary?undefined:"utf8");
const [js,css,manifestRaw,consoleHtml,index,roadmap,source]=await Promise.all([
 read("assets/console-build/app.js",true),
 read("assets/console-build/app.css",true),
 read("assets/console-build/version.json"),
 read("assets/console.html"),
 read("index.html"),
 read("assets/roadmap-cloudscape-v3.js"),
 read("src/console/main.jsx")
]);
const expected=createHash("sha256").update(js).update(css).digest("hex").slice(0,16);
const manifest=JSON.parse(manifestRaw);
assert.match(expected,/^[a-f0-9]{16}$/);
assert.equal(manifest.version,expected,"El manifiesto debe describir exactamente los bytes compilados");
assert(consoleHtml.includes('href="console-build/app.css?v='+expected+'"'),"El CSS de la consola no está versionado");
assert(consoleHtml.includes('src="console-build/app.js?v='+expected+'"'),"El JavaScript de la consola no está versionado");
assert(index.includes('<meta name="console-build-version" content="'+expected+'">'),"La portada debe contener la huella del bundle");
assert(index.includes('src="assets/roadmap-cloudscape-v3.js?v='+expected+'"'),"El roadmap no invalida su JS");
assert(index.includes('href="assets/roadmap-cloudscape-v3.css?v='+expected+'"'),"El roadmap no invalida su CSS");
assert(index.includes('screen=s0-connect&amp;v='+expected+'"'),"Los enlaces HTML iniciales no invalidan el caché");
assert(roadmap.includes('meta[name="console-build-version"]'),"Los enlaces dinámicos no heredan la versión");
assert(source.includes("<Toggle checked={showExplanations}"),"La fuente React no contiene el switch accesible");
assert(source.includes('{active.title}'),"El título de pantalla no se presenta como producto");
assert(source.includes('showExplanations?active.question:undefined'),"El subtítulo no está supeditado al modo de ayuda");
const bundle=js.toString("utf8");
assert(bundle.includes("Mostrar explicaciones"),"El bundle servido no incluye el control de ayuda");
assert(!bundle.includes("AI Governance · prototipo"),"El bundle todavía incluye la barra superior antigua");
console.log("Bundle HTML/CSS/JS consistente; fingerprint:",expected);
