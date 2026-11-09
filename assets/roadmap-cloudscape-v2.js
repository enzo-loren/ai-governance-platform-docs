/* Roadmap ejecutivo · Las vistas son HTML Cloudscape real (iframes de vista previa).
 * Un mismo catálogo JSON determina qué pantalla existe en cada slice y cuál sustituye a cuál.
 */
(async function(){
 "use strict";
 const $=id=>document.getElementById(id);
 try{
  const response=await fetch("assets/console-data.json",{cache:"no-store"});
  if(!response.ok)throw Error("No se pudieron cargar las pantallas");
  const data=await response.json();
  const stages=data.stages, screens=data.screens;
  const index=id=>stages.findIndex(s=>s.id===id);
  let selected=stages.some(s=>s.id===location.hash.slice(1).toUpperCase())?location.hash.slice(1).toUpperCase():"S0";
  let mode="delta";
  let previewObserver=null;
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
     return '<button type="button" class="step" data-stage="'+s.id+'" aria-current="'+(active?"step":"false")+'" aria-pressed="'+active+'"><span class="step-num">'+s.id+'</span><span class="step-name">'+text(s.name)+'</span>'+
     '<span class="step-foot">+'+n.fresh+' nueva'+(n.fresh!==1?'s':'')+(n.update?' · '+n.update+' cambio'+(n.update!==1?'s':''):'')+'</span></button>';
   }).join("");
   $("stage-code").textContent="SLICE "+index(selected)+" · "+stage.name.toUpperCase();
   $("section-title").textContent=stage.name;
   $("stage-promise").textContent=stage.headline;
   $("stage-metrics").innerHTML='<span><strong>'+count.fresh+'</strong> '+(count.fresh===1?"nueva":"nuevas")+'</span>'+
    (count.update?'<span><strong>'+count.update+'</strong> '+(count.update===1?"modificada":"modificadas")+'</span>':'')+
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
    const path=route(selected,s.id);
    return '<article class="screen-card"><div class="screen-meta"><span class="screen-eyebrow">'+text(s.slice+" · "+s.title)+'</span>'+
      '<span class="'+(past?"delta-existing":s.type==="update"?"delta-update":"delta-new")+'">'+badge+'</span></div>'+
      '<div class="shot"><div class="preview-skeleton" aria-hidden="true"><span>Vista previa de Cloudscape</span></div>'+
      '<div class="screen-canvas"><iframe class="cloudscape-preview" loading="lazy" tabindex="-1" aria-hidden="true" title="Vista previa de '+text(s.title)+'" data-preview-src="'+route(selected,s.id,true)+'"></iframe></div>'+
      '<a class="preview-link" href="'+path+'" aria-label="Explorar '+text(s.title)+' en la consola navegable"></a></div>'+
      '<div class="card-bottom"><div><h3>'+text(s.title)+'</h3><p>'+text(s.question)+'</p></div>'+
      '<a class="open-screen" href="'+path+'" aria-label="Explorar '+text(s.title)+'">Explorar <span aria-hidden="true">↗</span></a></div></article>';
   }).join("");
   $("prev-slice").disabled=index(selected)===0;
   $("next-slice").disabled=index(selected)===stages.length-1;
   $("prev-slice").textContent=index(selected)>0?"← "+stages[index(selected)-1].id+" · "+stages[index(selected)-1].name:"← Inicio";
   $("next-slice").textContent=index(selected)<stages.length-1?stages[index(selected)+1].id+" · "+stages[index(selected)+1].name+" →":"Último slice";
   requestAnimationFrame(()=>{rescale();loadVisiblePreviews()});
  }
  function rescale(){
   document.querySelectorAll(".shot").forEach(shot=>{
    const canvas=shot.querySelector(".screen-canvas");
    if(canvas)canvas.style.transform="scale("+Math.max(.1,shot.clientWidth/1200)+")";
   });
  }
  function loadVisiblePreviews(){
    if(previewObserver){previewObserver.disconnect();previewObserver=null;}
    const frames=[...document.querySelectorAll("iframe[data-preview-src]")];
    const load=iframe=>{
      if(!iframe.isConnected||!iframe.dataset.previewSrc)return;
      const shot=iframe.closest(".shot");
      iframe.addEventListener("load",()=>{if(iframe.isConnected)shot?.classList.add("is-loaded")},{once:true});
      iframe.src=iframe.dataset.previewSrc;
      iframe.removeAttribute("data-preview-src");
    };
    if(!("IntersectionObserver" in window)){frames.forEach(load);return;}
    previewObserver=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){load(entry.target);previewObserver?.unobserve(entry.target);}
      });
    },{rootMargin:"400px 0px"});
    frames.forEach(frame=>previewObserver.observe(frame));
  }
  function choose(id,hash=true){
   if(!stages.some(x=>x.id===id))return;
   selected=id;render();
   if(hash)history.replaceState(null,"","#"+id.toLowerCase());
  }
  $("steps").addEventListener("click",e=>{
   const button=e.target.closest("[data-stage]");
   if(button){
     const id=button.dataset.stage;
     choose(id);
     $("steps").querySelector('[data-stage="'+id+'"]')?.focus({preventScroll:true});
   }
  });
  $("mode-delta").addEventListener("click",()=>{mode="delta";render()});
  $("mode-all").addEventListener("click",()=>{mode="all";render()});
  $("prev-slice").addEventListener("click",()=>choose(stages[index(selected)-1]?.id||selected));
  $("next-slice").addEventListener("click",()=>choose(stages[index(selected)+1]?.id||selected));
  window.addEventListener("resize",rescale);
  window.addEventListener("hashchange",()=>{const id=location.hash.slice(1).toUpperCase();if(stages.some(x=>x.id===id))choose(id,false)});
  render();
 }catch(error){
  console.error("Error del roadmap:",error);
  const gallery=$("gallery");
  if(gallery){
    const notice=document.createElement("p");notice.className="fallback-message";notice.setAttribute("role","alert");
    notice.textContent="No se pudieron cargar los slices. Puedes explorar las pantallas iniciales o recargar la página.";
    gallery.prepend(notice);
  }
 }
})();
