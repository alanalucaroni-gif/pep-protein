export function initSections(products,reduced){
 const media=document.querySelector('.pep-media'),showcase=document.querySelector('.flavor-showcase');
 const videos=[...media.querySelectorAll('video')];
 for(const video of videos){
  const figure=video.closest('figure'),button=figure.querySelector('.media-play'),error=figure.querySelector('.media-error');
  button.addEventListener('click',async()=>{
   videos.filter(v=>v!==video).forEach(v=>v.pause());
   if(!video.src)video.src=video.dataset.src;
   video.controls=true;error.hidden=true;button.disabled=true;
   try{await video.play();button.hidden=true;figure.classList.add('playing');}
   catch{button.disabled=false;error.hidden=false;}
  });
  video.addEventListener('pause',()=>figure.classList.remove('playing'));
  video.addEventListener('error',()=>{button.hidden=false;button.disabled=false;error.hidden=false;});
 }
 new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)target.pause();}),{threshold:.1}).observe(videos[0]);
 // Pause all offscreen media; loading only starts after an explicit play.
 const pauseObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{if(!isIntersecting)target.pause();}),{threshold:.1});videos.slice(1).forEach(v=>pauseObserver.observe(v));
 const revealObserver=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('section-visible',e.isIntersecting)),{threshold:.12});
 revealObserver.observe(media);revealObserver.observe(showcase);
 const panel=showcase.querySelector('.explore-product'),canvas=panel.querySelector('canvas'),stage=panel.querySelector('.explore-model');
 const fallback=panel.querySelector('img'),name=panel.querySelector('.explore-name'),choose=panel.querySelector('.explore-choose');
 const slugs=['limao','frutas','acai'],verbs=['limão','frutas','açaí'];let current=0,model=null,locked=false,pending=[],changeTimer;
 function change(dir){
  if(locked){pending.push(dir);return;}current=(current+dir+3)%3;const p=products[slugs[current]];
  panel.style.setProperty('--flavor-surface',p.color);
  panel.querySelector('.explore-count').textContent=`0${current+1} / 03`;
  name.textContent=p.name;choose.dataset.flavor=slugs[current];
  choose.innerHTML=`Escolher ${verbs[current]} <span aria-hidden="true">＋</span>`;
  fallback.src=p.image;fallback.alt=`Lata PEP ${p.short}`;canvas.setAttribute('aria-label',`Lata PEP ${p.short} em 3D`);
  model?.select(current,dir);
  if(!reduced.matches){locked=true;panel.classList.remove('flavor-changing');void name.offsetWidth;panel.classList.add('flavor-changing');clearTimeout(changeTimer);changeTimer=setTimeout(()=>{locked=false;panel.classList.remove('flavor-changing');if(pending.length)change(pending.shift());},1150);}
 }
 panel.querySelector('.explore-prev').addEventListener('click',()=>change(-1));
 panel.querySelector('.explore-next').addEventListener('click',()=>change(1));
 canvas.tabIndex=0;
 panel.addEventListener('keydown',event=>{if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();if(event.target===canvas)model?.rotate(event.key==='ArrowRight'?Math.PI/4:-Math.PI/4);else change(event.key==='ArrowRight'?1:-1);}});
 const loader=new IntersectionObserver(async entries=>{
  if(!entries.some(e=>e.isIntersecting)||reduced.matches)return;loader.disconnect();
  try{const {createFlavorCarousel}=await import('./flavor-carousel.js');model=await createFlavorCarousel(canvas,stage,reduced);model.select(current,1);panel.classList.add('explore-ready');}
  catch(error){console.warn('Using official PEP photo in flavor carousel.',error);}
 },{rootMargin:'500px'});loader.observe(showcase);
 let queued=false;
 function update(){queued=false;const r=showcase.getBoundingClientRect(),m=media.getBoundingClientRect();
  const entry=Math.min(1,Math.max(0,(innerHeight-r.top)/(innerHeight*.65)));
  showcase.style.setProperty('--section-enter',entry);model?.setEntry(entry);
  media.style.setProperty('--media-shift',reduced.matches?'0px':`${Math.min(35,Math.max(-35,(m.top-innerHeight*.2)*.035))}px`);
 }
 addEventListener('scroll',()=>{if(!queued){queued=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();
}
