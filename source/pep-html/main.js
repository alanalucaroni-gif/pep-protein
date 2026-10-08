import {initSections} from './sections.js';
const story=document.querySelector('.story'),header=document.querySelector('.header');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const products={
 limao:{name:'LIMÃO TAITI',short:'Limão Taiti',color:'#e0edb5',image:new URL('./assets/limao.webp',import.meta.url).href,description:'Seu próximo gole, com sabor de limão Taiti.',url:'https://pepprotein.com.br/products/limao-taiti'},
 frutas:{name:'FRUTAS VERMELHAS',short:'Frutas Vermelhas',color:'#f5c0ce',image:new URL('./assets/frutas.webp',import.meta.url).href,description:'Frutas vermelhas. Uma escolha cheia de sabor.',url:'https://pepprotein.com.br/products/frutas-vermelhas'},
 acai:{name:'AÇAÍ COM GUARANÁ',short:'Açaí com Guaraná',color:'#c1d9eb',image:new URL('./assets/acai.webp',import.meta.url).href,description:'Açaí encontra guaraná. O seu ritmo encontra PEP.',url:'https://pepprotein.com.br/products/acai-com-guarana'}
};
let scene=null,queued=false,lastProgress=-1,selected=null,quantity=1,returnFocus=null,pendingFocus=null;
let packAnimation=0;
const ease=(a,b,p)=>{const t=Math.min(1,Math.max(0,(p-a)/(b-a)));return t*t*(3-2*t);};
const choices=document.querySelector('.can-choices'),detail=document.querySelector('.product-detail');
const picks=[...document.querySelectorAll('.can-pick')];
function closeProduct(restore=true){
 const staticView=document.body.classList.contains('static-product');
 const previous=selected;selected=null;detail.hidden=true;document.body.classList.remove('product-open');scene?.selectFlavor(null);
 document.querySelector('.product-spin-controls').hidden=true;
 if(previous&&scene&&!staticView&&!reduced.matches){document.body.classList.add('product-returning');scene.setProgress(1);}
 document.querySelector('#pep-scene').setAttribute('aria-label','Latas PEP em 3D. Role para apresentar o produto e escolha um dos três sabores.');
 pendingFocus=restore&&previous?(staticView?returnFocus:document.querySelector(`.can-pick[data-flavor="${previous}"]`)):null;
 if(staticView||!previous||reduced.matches)finishReturn();
 updateChoices();
}
function finishReturn(){
 const returning=document.body.classList.contains('product-returning');
 if(returning)scrollTo({top:story.offsetTop+story.offsetHeight-innerHeight,behavior:'instant'});
 document.body.classList.remove('product-returning');lastProgress=-1;update();pendingFocus?.focus({preventScroll:true});pendingFocus=null;
}
function updateChoices(){choices.hidden=lastProgress<.999||selected!==null||!scene||reduced.matches||document.body.classList.contains('no-webgl')||document.body.classList.contains('product-returning')||story.getBoundingClientRect().bottom<80;}
function stopPack(){cancelAnimationFrame(packAnimation);packAnimation=0;document.body.classList.remove('pack-playing');}
function playPack(){
 if(packAnimation||selected||reduced.matches||!scene)return;
 const span=story.offsetHeight-innerHeight,start=Math.max(.69,lastProgress),started=performance.now();
 document.body.classList.add('pack-playing');document.querySelector('.pack-trigger').hidden=true;
 function frame(time){
  const t=Math.min(1,(time-started)/3200),travel=t*t*(3-2*t);
  scrollTo({top:story.offsetTop+span*(start+(1-start)*travel),behavior:'instant'});
  lastProgress=-1;update();
  if(t<1)packAnimation=requestAnimationFrame(frame);else stopPack();
 }
 packAnimation=requestAnimationFrame(frame);
}
document.querySelector('.pack-trigger').addEventListener('click',playPack);
addEventListener('wheel',event=>{
 if(event.deltaY<0){stopPack();return;}
 if(packAnimation){event.preventDefault();return;}
 if(event.deltaY>0&&lastProgress>=.68&&lastProgress<.90&&!selected&&!reduced.matches){event.preventDefault();playPack();}
},{passive:false});
let touchY=0;
addEventListener('touchstart',event=>{touchY=event.touches[0]?.clientY||0;},{passive:true});
addEventListener('touchmove',event=>{
 const delta=touchY-(event.touches[0]?.clientY||touchY);
 if(delta< -12){stopPack();return;}
 if(delta>12&&lastProgress>=.68&&lastProgress<.90&&!selected&&!reduced.matches){event.preventDefault();playPack();}
},{passive:false});
addEventListener('keydown',event=>{
 if(event.target.closest('button,a,input,textarea,select,dialog'))return;
 if(event.key==='ArrowUp'||event.key==='PageUp')stopPack();
 if(['ArrowDown','PageDown',' '].includes(event.key)&&lastProgress>=.68&&lastProgress<.9&&!selected){event.preventDefault();playPack();}
});
function goToFlavors(){
 const staticView=reduced.matches||document.body.classList.contains('no-webgl');
 const target=staticView?document.querySelector('.static-flavors').offsetTop-90:story.offsetTop+story.offsetHeight-innerHeight;
 scrollTo({top:target,behavior:'instant'});lastProgress=-1;update();
}
function navigateTo(hash){
 stopPack();
 menu.close();cartDialog.close();
 if(selected)closeProduct(false);
 document.body.classList.remove('product-open','product-returning','static-product');pendingFocus=null;
 scene?.selectFlavor(null);
 history.replaceState(null,'',hash);
 if(hash==='#sabores'){goToFlavors();return;}
 const target=document.querySelector(hash);if(!target)return;
 scrollTo({top:Math.max(0,target.offsetTop-header.offsetHeight),behavior:'instant'});lastProgress=-1;update();
}
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();navigateTo(link.getAttribute('href'));}));
document.querySelector('.scroll-cue').addEventListener('click',()=>{
 scrollTo({top:story.offsetTop+(story.offsetHeight-innerHeight)*.18,behavior:reduced.matches?'instant':'smooth'});
});
function update(){
 queued=false;header.classList.toggle('scrolled',scrollY>30);
 const rect=story.getBoundingClientRect();const held=(selected&&!document.body.classList.contains('static-product'))||document.body.classList.contains('product-returning');const p=held?1:reduced.matches||document.body.classList.contains('no-webgl')?0:Math.min(1,Math.max(0,-rect.top/Math.max(1,rect.height-innerHeight)));
 updateChoices();
 document.querySelector('.pack-trigger').hidden=!(scene&&p>=.68&&p<.79&&!packAnimation&&!held);
 if(p===lastProgress)return;lastProgress=p;document.body.dataset.progress=p.toFixed(3);
 if(selected&&p<.95&&!document.body.classList.contains('static-product'))closeProduct(false);
 document.querySelector('.scroll-cue').style.opacity=String(1-ease(.01,.07,p));
 document.querySelector('.hero-rays').style.opacity=String(.75*(1-ease(.06,.17,p)));
 story.style.setProperty('--science-title',ease(.145,.17,p));
 story.style.setProperty('--science-exit',1-ease(.33,.385,p));
 story.style.setProperty('--pack-title',ease(.42,.46,p));
 story.style.setProperty('--surprise-title',ease(.71,.745,p));
 story.style.setProperty('--reveal-title',ease(.875,.9,p));
 story.style.setProperty('--reveal-copy',ease(.895,.93,p));
 const packBeat=p>=.39&&p<.895&&!selected&&!document.body.classList.contains('product-returning');
 const packProgress=document.querySelector('.pack-progress');packProgress.hidden=!packBeat;
 const completion=Math.round(100*Math.min(1,Math.max(0,(p-.69)/.18)));
 packProgress.querySelector('.pack-progress-value').textContent=String(completion).padStart(3,'0')+'%';
 packProgress.querySelector('.pack-progress-label').textContent=p<.69?'SUA PEP':p<.79?'EM MOVIMENTO':'ABRINDO SUA PEP';
 packProgress.style.setProperty('--completion',completion/100);
 document.body.classList.toggle('pack-beat',packBeat);
 // Each benefit arrives while the can presents its rear, using the same progress.
 document.querySelectorAll('[data-fact]').forEach((fact,i)=>{
  const enter=ease(.145+i*.025,.20+i*.025,p);fact.style.setProperty('--enter',enter);
 });
 if(scene)scene.setProgress(p);updateChoices();
}
function queueUpdate(){if(!queued){queued=true;requestAnimationFrame(update);}}
addEventListener('scroll',queueUpdate,{passive:true});addEventListener('resize',()=>{lastProgress=-1;queueUpdate();});
reduced.addEventListener('change',()=>{closeProduct(false);lastProgress=-1;queueUpdate();});
function selectProduct(slug,source){
 if(!products[slug])return;
 stopPack();
 returnFocus=source;selected=slug;quantity=1;
 const p=products[slug];document.querySelector('#product-title').textContent=p.name;
 document.querySelector('#pep-scene').setAttribute('aria-label',`Lata PEP ${p.short} selecionada, em destaque.`);
 document.querySelector('.product-description').textContent=p.description;
 document.querySelector('.quantity-value').value='1';
 document.querySelector('.quantity-less').disabled=true;
 document.querySelector('.quantity-more').disabled=false;
 document.querySelector('.product-official').href=p.url;
 document.querySelector('.product-feedback').textContent='';
 detail.style.setProperty('--product-color',p.color);detail.hidden=false;document.body.classList.add('product-open');
 const staticView=!scene||reduced.matches||document.body.classList.contains('no-webgl');document.body.classList.toggle('static-product',staticView);
 document.querySelector('.product-spin-controls').hidden=staticView;
 if(!staticView){
  // Selection and return use the settled three-can pose, independent of scroll.
  const target=story.offsetTop+story.offsetHeight-innerHeight;
  scrollTo({top:target,behavior:'instant'});
  scene?.setProgress(1);scene?.selectFlavor(slug);
 }
 updateChoices();document.querySelector('#product-title').focus({preventScroll:true});
}
function positionChoices(bounds){
 for(const pick of picks){const r=bounds[pick.dataset.flavor];if(!r)continue;
  Object.assign(pick.style,{left:`${r.x}px`,top:`${r.y}px`,width:`${r.width}px`,height:`${r.height+42}px`});
 }
}
for(const button of document.querySelectorAll('[data-flavor]'))button.addEventListener('click',()=>selectProduct(button.dataset.flavor,button));
function changeQuantity(delta){quantity=Math.max(1,Math.min(24,quantity+delta));document.querySelector('.quantity-value').value=String(quantity);document.querySelector('.quantity-less').disabled=quantity===1;document.querySelector('.quantity-more').disabled=quantity===24;}
 document.querySelector('.quantity-less').addEventListener('click',()=>changeQuantity(-1));document.querySelector('.quantity-more').addEventListener('click',()=>changeQuantity(1));
 document.querySelector('.product-close').addEventListener('click',()=>{closeProduct();document.body.classList.remove('static-product');});
addEventListener('keydown',e=>{if(e.key==='Escape'&&selected&&!document.querySelector('dialog[open]')){closeProduct();document.body.classList.remove('static-product');}});
let cart={};try{const saved=JSON.parse(localStorage.getItem('pep-preview-cart')||'{}');for(const slug of Object.keys(products))if(Number.isInteger(saved[slug])&&saved[slug]>0)cart[slug]=Math.min(saved[slug],99);}catch{}
const cartDialog=document.querySelector('#cart'),cartItems=document.querySelector('.cart-items');
function renderCart(){
 const count=Object.values(cart).reduce((a,b)=>a+b,0),badge=document.querySelector('.cart-count');badge.textContent=String(count);badge.hidden=!count;
 cartItems.replaceChildren();
 if(!count){const empty=document.createElement('p');empty.className='cart-empty';empty.textContent='Seu carrinho ainda está vazio. Escolha a lata que combina com seu próximo gole.';cartItems.append(empty);}
 for(const [slug,n]of Object.entries(cart)){
  const row=document.createElement('article');row.className='cart-row';
  const img=document.createElement('img');img.src=products[slug].image;img.alt='';img.width=32;img.height=80;
  const name=document.createElement('h3');name.textContent=products[slug].short;
  const volume=document.createElement('p');volume.textContent='355 ml';
  const info=document.createElement('div');info.append(name,volume);
  const controls=document.createElement('div');controls.className='quantity';
  for(const [label,text,delta]of [[`Remover uma lata de ${products[slug].short}`,'−',-1],[null,String(n),0],[`Adicionar uma lata de ${products[slug].short}`,'＋',1]]){
   const el=document.createElement(delta?'button':'output');el.textContent=text;
   if(delta){el.setAttribute('aria-label',label);el.addEventListener('click',()=>{cart[slug]=Math.max(0,Math.min(99,cart[slug]+delta));if(!cart[slug])delete cart[slug];saveCart();document.querySelector('.cart-status').textContent='Quantidade atualizada.';});}controls.append(el);
  }
  row.append(img,info,controls);cartItems.append(row);
 }
}
function saveCart(){try{localStorage.setItem('pep-preview-cart',JSON.stringify(cart));}catch{}renderCart();}
 document.querySelector('.add-cart').addEventListener('click',()=>{if(!selected)return;cart[selected]=Math.min(99,(cart[selected]||0)+quantity);saveCart();document.querySelector('.product-feedback').textContent=`${quantity} ${quantity===1?'lata adicionada':'latas adicionadas'} ao carrinho.`;});
 document.querySelector('.cart-toggle').addEventListener('click',()=>{cartDialog.showModal();document.body.classList.add('menu-open');});
 document.querySelector('.cart-close').addEventListener('click',()=>cartDialog.close());cartDialog.addEventListener('close',()=>document.body.classList.remove('menu-open'));
const menu=document.querySelector('#menu'),menuButton=document.querySelector('.menu-button');
menuButton.addEventListener('click',()=>{menu.showModal();menuButton.setAttribute('aria-expanded','true');document.body.classList.add('menu-open');});
menu.addEventListener('close',()=>{menuButton.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');});
 document.querySelector('.menu-close').addEventListener('click',()=>menu.close());menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.close()));
for(const dialog of [menu,cartDialog])dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
renderCart();update();initSections(products,reduced);
const spinCanvas=document.querySelector('#pep-scene');let spinPointer=null,spinX=0;
spinCanvas.addEventListener('pointerdown',event=>{if(!selected||document.body.classList.contains('static-product'))return;spinPointer=event.pointerId;spinX=event.clientX;spinCanvas.setPointerCapture(event.pointerId);spinCanvas.classList.add('dragging');});
spinCanvas.addEventListener('pointermove',event=>{if(spinPointer!==event.pointerId)return;scene?.rotateSelected((event.clientX-spinX)*.009,true);spinX=event.clientX;});
function releaseSpin(){spinPointer=null;spinCanvas.classList.remove('dragging');}
spinCanvas.addEventListener('pointerup',releaseSpin);spinCanvas.addEventListener('pointercancel',releaseSpin);
document.querySelector('.spin-left').addEventListener('click',()=>scene?.rotateSelected(-Math.PI/4));
document.querySelector('.spin-right').addEventListener('click',()=>scene?.rotateSelected(Math.PI/4));
document.querySelector('.spin-reset').addEventListener('click',()=>scene?.resetSelected());
import('./scene.js').then(async({createExperience})=>{
 scene=await createExperience(document.querySelector('#pep-scene'),document.querySelector('.scene-stage'),positionChoices,finishReturn);
 document.body.classList.add('render-ready');document.body.dataset.model='ready';document.querySelector('.scene-loading').hidden=true;
 lastProgress=-1;update();if(location.hash==='#sabores')goToFlavors();
}).catch(error=>{console.error(error);document.body.classList.add('no-webgl');document.body.dataset.model='fallback';document.querySelector('.scene-loading').hidden=true;lastProgress=-1;update();});
