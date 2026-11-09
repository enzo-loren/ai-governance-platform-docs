/* Roadmap ejecutivo · Las vistas son HTML Cloudscape real (iframes de vista previa).
 * Un mismo catálogo JSON determina qué pantalla existe en cada slice y cuál sustituye a cuál.
 */
(async function(){
 "use strict";
 const $=id=>document.getElementById(id);
 try{
  const response=await fetch("assets/console-data.json");
  if(!response.ok)throw Error("No se pudieron cargar las pantallas");
  const data=await response.json();
  const stages=data.stages, screens=data.screens;
  const index=id=>stages.findIndex(s=>s.id===id);
  let selected=stages.some(s=>s.id===location.hash.slice(1).toUpperCase())?location.hash.slice(1).toUpperCase():"S0";
  let mode="delta";
  function items(slice,format="delta"){
   const eligible=screens.filter(s=>index(s.slice)<=index(slice));
   if(format==="delta")return eligible.filter(s=>s.slice===slice);
   const bySurface=new Map();
   eligible.forEach(s=>bySurface.set(s.surface,s));
   return [...bySurface.values()].sort((a,b)=>index(a.slice)-index(b.slice));
  }
  function stats(slice){
   const current=items(slice),active=items(slice,"all");
   return {fresh:current.filter(s=>s.type==="new").length,update:current.filter(s=>s.type==="update").length,total:active.length};
  }
  function text(x){
   return String(x).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
  }
  function route(slice,screen,preview=false){
   return "assets/console.html?slice="+encodeURIComponent(slice)+"&screen="+encodeURIComponent(screen)+(preview?"&preview=1":"");
  }
  function render(){
   const stage=stages.find(s=>s.id===selected),count=stats(selected),visible=items(selected,mode);
   $("steps").innerHTML=stages.map(s=>{
     const n=stats(s.id),active=s.id===selected;
     return '<button type="button" class="step" data-stage="'+s.id+'" aria-pressed="'+active+'"><span class="step-num">'+s.id+'</span><span class="step-name">'+text(s.name)+'</span>'+
     '<span class="step-foot">+'+n.fresh+' nueva'+(n.fresh!==1?'s':'')+(n.update?' · '+n.update+' cambio'+(n.update!==1?'s':''):'')+'</span></button>';
   }).join("");
   $("stage-code").textContent="SLICE "+index(selected)+" · "+stage.name.toUpperCase();
   $("section-title").textContent=stage.name;
   $("stage-promise").textContent=stage.headline;
   $("stage-metrics").innerHTML='<span><strong>'+count.fresh+'</strong> nuevas</span>'+
    (count.update?'<span><strong>'+count.update+'</strong> modificadas</span>':'')+
    '<span class="metric-divider"></span><span><strong>'+count.total+'</strong> en producto</span>';
   for(const m of ["delta","all"]){
    $("mode-"+m).classList.toggle("is-active",mode===m);
    $("mode-"+m).setAttribute("aria-pressed",String(mode===m));
   }
   $("gallery-label").textContent=mode==="delta"?"Solo novedades de "+selected:"Producto acumulado al cerrar "+selected;
   $("gallery-count").textContent=visible.length+" pantalla"+(visible.length===1?"":"s");
   $("gallery").innerHTML=visible.map(s=>{
     const past=mode==="all"&&s.slice!==selected;
     const badge=past?"Ya disponible":s.type==="update"?"Actualizada":"Nueva";
     return '<article class="screen-card"><div class="screen-meta"><span class="screen-eyebrow">'+text(s.slice+" · "+s.title)+'</span>'+
      '<span class="'+(past?"delta-existing":s.type==="update"?"delta-update":"delta-new")+'">'+badge+'</span></div>'+
      '<div class="shot"><div class="screen-canvas"><iframe class="cloudscape-preview" loading="lazy" tabindex="-1" aria-hidden="true" title="Vista HTML de '+text(s.title)+'" src="'+route(selected,s.id,true)+'"></iframe></div></div>'+
      '<div class="card-bottom"><div><h3>'+text(s.title)+'</h3><p>'+text(s.question)+'</p></div>'+
      '<a class="open-screen" href="'+route(selected,s.id)+'" aria-label="Navegar por '+text(s.title)+'">Navegar <span aria-hidden="true">↗</span></a></div></article>';
   }).join("");
   $("prev-slice").disabled=index(selected)===0;
   $("next-slice").disabled=index(selected)===stages.length-1;
   $("prev-slice").textContent=index(selected)>0?"← "+stages[index(selected)-1].id+" · "+stages[index(selected)-1].name:"← Inicio";
   $("next-slice").textContent=index(selected)<stages.length-1?stages[index(selected)+1].id+" · "+stages[index(selected)+1].name+" →":"Último slice";
   requestAnimationFrame(rescale);
  }
  function rescale(){
   document.querySelectorAll(".shot").forEach(shot=>{
    const canvas=shot.querySelector(".screen-canvas");
    if(canvas)canvas.style.transform="scale("+Math.max(.1,shot.clientWidth/1200)+")";
   });
  }
  function choose(id,hash=true){
   if(!stages.some(x=>x.id===id))return;
   selected=id;render();
   if(hash)history.replaceState(null,"","#"+id.toLowerCase());
  }
  $("steps").addEventListener("click",e=>{
   const button=e.target.closest("[data-stage]");
   if(button)choose(button.dataset.stage);
  });
  $("mode-delta").addEventListener("click",()=>{mode="delta";render()});
  $("mode-all").addEventListener("click",()=>{mode="all";render()});
  $("prev-slice").addEventListener("click",()=>choose(stages[index(selected)-1]?.id||selected));
  $("next-slice").addEventListener("click",()=>choose(stages[index(selected)+1]?.id||selected));
  window.addEventListener("resize",rescale);
  window.addEventListener("hashchange",()=>{const id=location.hash.slice(1).toUpperCase();if(stages.some(x=>x.id===id))choose(id,false)});
  render();
 }catch(error){
  $("gallery").textContent="No se pudo cargar el recorrido interactivo: "+error.message+".";
 }
})();
