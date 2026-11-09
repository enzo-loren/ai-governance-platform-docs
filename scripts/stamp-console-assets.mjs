/**
 * Huella determinista de la compilación Cloudscape.
 * Vite genera app.js/app.css con nombres estables; asociamos sus recursos a su
 * contenido para que GitHub Pages y el navegador no reutilicen código anterior.
 *
 * Se ejecuta inmediatamente después de "vite build". El deploy estático
 * publica los HTML estampados y los recursos del mismo commit.
 */
import {readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";

const root=new URL("../",import.meta.url);
const path=name=>new URL(name,root);
const js=await readFile(path("assets/console-build/app.js"));
const css=await readFile(path("assets/console-build/app.css"));
const version=createHash("sha256").update(js).update(css).digest("hex").slice(0,16);

async function rewrite(file,transform){
 const existing=await readFile(path(file),"utf8");
 const next=transform(existing);
 if(next!==existing)await writeFile(path(file),next);
}
function requireCount(text,pattern,expected,label){
 const matches=[...text.matchAll(pattern)];
 if(matches.length!==expected)throw Error(label+": se esperaban "+expected+" coincidencias y se encontraron "+matches.length);
}
await rewrite("assets/console.html",html=>{
 const cssRef=/href="console-build\/app\.css(?:\?v=[a-f0-9]{16})?"/g;
 const jsRef=/src="console-build\/app\.js(?:\?v=[a-f0-9]{16})?"/g;
 requireCount(html,cssRef,1,"Enlace CSS Cloudscape");
 requireCount(html,jsRef,1,"Enlace JS Cloudscape");
 return html.replace(cssRef,'href="console-build/app.css?v='+version+'"')
            .replace(jsRef,'src="console-build/app.js?v='+version+'"');
});
await rewrite("index.html",html=>{
 const script=/src="assets\/roadmap-cloudscape-v3\.js(?:\?v=[a-f0-9]{16})?"/g;
 const stylesheet=/href="assets\/roadmap-cloudscape-v3\.css(?:\?v=[a-f0-9]{16})?"/g;
 const link=/href="assets\/console\.html\?[^"]+"/g;
 requireCount(html,script,1,"Script de roadmap");
 requireCount(html,stylesheet,1,"Estilo de roadmap");
 const links=[...html.matchAll(link)];
 if(links.length<1)throw Error("La portada debe conservar enlaces directos a la consola");
 html=html.replace(/<meta name="console-build-version" content="[a-f0-9]{16}">\s*/g,"");
 const title='<meta name="theme-color" content="#101e36">';
 if(!html.includes(title))throw Error("No se encontró el punto de inserción del sello");
 html=html.replace(title,title+'\n<meta name="console-build-version" content="'+version+'">');
 html=html.replace(script,'src="assets/roadmap-cloudscape-v3.js?v='+version+'"')
          .replace(stylesheet,'href="assets/roadmap-cloudscape-v3.css?v='+version+'"');
 html=html.replace(link,match=>match.replace(/&amp;v=[a-f0-9]{16}/g,"").replace(/"$/,'&amp;v='+version+'"'));
 return html;
});
await writeFile(path("assets/console-build/version.json"),JSON.stringify({version,algorithm:"sha256",inputs:["app.js","app.css"]},null,2)+"\n");
console.log("Cloudscape static assets version: "+version);
