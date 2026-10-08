import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {applyPrint} from '../pep-pack-3d/label-material.js';
import {refineCan} from './finishes.js';
const slugs=['acai','limao','frutas'];
const models={frutas:new URL('../pep-3d/pep-frutas-foto-frontal.glb',import.meta.url).href,limao:new URL('../pep-3d/pep-limao-foto-frontal.glb',import.meta.url).href,acai:new URL('../pep-3d/pep-acai-foto-frontal.glb',import.meta.url).href};
export async function createExperience(canvas,stage,onBounds=()=>{},onReturn=()=>{}){
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
const smooth=(a,b,p)=>{const t=THREE.MathUtils.clamp((p-a)/(b-a),0,1);return t*t*(3-2*t);};
let renderer,scene,camera,box,lid,holders,floor,boxContact,cans=[],canContacts=[],dirty=true,progress=0,ready=false;
let selected=null,lastSelected=null,selection=0,animationFrom=0,animationStarted=0,returnPending=false;
let spin=0,spinFrom=0,spinTarget=0,spinStarted=0;
function fail(){document.body.classList.add('no-webgl');document.body.classList.remove('render-ready');document.body.dataset.model='fallback';}
function pose(p){
 const arrive=smooth(.39,.49,p),descend=smooth(.49,.61,p),close=smooth(.61,.69,p),reopen=smooth(.79,.87,p);
 // Clear the box rim before travelling forward; then settle in front of it.
 // Every pose is a pure function of scroll progress, including reverse scroll.
 const lift=smooth(.87,.93,p),advance=smooth(.93,.967,p),settle=smooth(.967,1,p);
 box.position.set(0,THREE.MathUtils.lerp(-2.65,0,arrive),-.55*advance);
 box.visible=true;
 for(const part of box.children)if(part.name!=='Three_Can_Slots')part.visible=p>.385;
 const wobble=(!reduced.matches&&p>.70&&p<.79)?Math.sin((p-.70)/.09*Math.PI*6)*Math.sin((p-.70)/.09*Math.PI)*.045:0;
 box.rotation.set(0,0,wobble);box.position.x=wobble*.12;
 lid.rotation.x=-Math.PI*102/180*(1-close+reopen);
 cans[0].visible=cans[2].visible=p>.385;
 // A visible downward flight crosses the hero into the next section. The
 // subsequent settling still moves forward through the document as it scrolls.
 const flight=smooth(.015,.14,p),landing=smooth(.14,.25,p);
 const loneY=1.85-.80*flight+.65*landing;
 const insideY=.34;
 const exitHeight=lift*1.67-settle*(1.67+insideY-.028),forward=.724*(1-lift)+advance*2.0;
 cans[1].position.set(0,THREE.MathUtils.lerp(loneY,insideY,descend)+exitHeight-box.position.y,forward*descend);
 cans[1].rotation.x=-Math.PI/2*descend*(1-lift);
 // While below the frame, box motion must not drag the introductory can.
 const turn=smooth(.16,.27,p)+smooth(.33,.43,p);
 cans[1].rotation.y=turn*Math.PI;
 cans[1].rotation.z=Math.sin(Math.PI*flight)*.15*(1-landing);
 for(const [index,x] of [[0,-.64],[2,.64]]){
  cans[index].position.set(x+Math.sign(x)*advance*.31,insideY+exitHeight,forward);
  cans[index].rotation.y=-Math.sign(x)*advance*.11;
  cans[index].rotation.x=-Math.PI/2*(1-lift);
 }
 // Side cans exist inside the box, in the two empty slots. The center can enters.
 const mobile=stage.clientWidth<800,aspect=camera.aspect;
 const reveal=smooth(.39,.95,p),framing=smooth(.36,.48,p);
 const distance=mobile?THREE.MathUtils.lerp(7.7,Math.max(11,2.8/(2*Math.tan(THREE.MathUtils.degToRad(15))*aspect)),framing)+advance*1.6:THREE.MathUtils.lerp(4.9,9.6,framing)-advance;
 camera.position.set(mobile?0:advance*.65,mobile?THREE.MathUtils.lerp(3.1,4.6,framing):THREE.MathUtils.lerp(3.1,3.3,reveal),distance);
 const focusY=2.38-.8*smooth(.39,.51,p)-.65*smooth(.61,.70,p)+.80*smooth(.81,.94,p)-.73*settle;
 camera.lookAt(0,mobile?focusY+THREE.MathUtils.lerp(.194,.55,framing):focusY,0);
 floor.material.opacity=.065*arrive;
 boxContact.visible=p>.385;boxContact.position.set(box.position.x,-.011,box.position.z);boxContact.material.opacity=.30*arrive;
 box.updateMatrixWorld(true);
 cans.forEach((can,i)=>{
  const position=can.getWorldPosition(new THREE.Vector3()),contact=canContacts[i];
  const height=Math.max(0,position.y),spread=.73+height*.35;
  contact.visible=p>.93;contact.position.set(position.x,-.009,position.z);
  contact.scale.set(spread,spread,1);contact.material.opacity=.36*Math.exp(-height*2.3);
 });
 // Selection is a short, interruptible approach from the actual revealed can.
 // The unselected products recede while specifications occupy the clear right side.
 const activeSlug=selected||lastSelected;
 if(activeSlug!==null){
  const t=selection*selection*selection*(selection*(selection*6-15)+10),index=slugs.indexOf(activeSlug);
  const target=new THREE.Vector3(mobile?0:-.95,mobile?2.9:1.3,mobile?1.7:2.3);
  holders.updateWorldMatrix(true,false);holders.worldToLocal(target);
  cans[index].position.lerp(target,t);
  const restingYaw=index===1?0:index===0?.11:-.11;
  // Normalize the center's completed scroll turn before the deliberate full turn.
  cans[index].rotation.y=restingYaw*(1-t)+(Math.PI*2+spin)*t;
  cans[index].rotation.z=Math.sin(Math.PI*t)*-.035;
  for(let i=0;i<3;i++)if(i!==index)cans[i].visible=!selected&&selection<.12;
  for(const part of box.children)if(part!==holders)part.visible=!selected&&selection<.08;
  camera.position.lerp(new THREE.Vector3(0,mobile?3.8:3,mobile?10:7.8),t);
  const selectionFocus=new THREE.Vector3(0,mobile?2.6:1.65,0);
  const baseFocus=new THREE.Vector3(0,mobile?focusY+THREE.MathUtils.lerp(.194,.55,framing):focusY,0);
  camera.lookAt(baseFocus.lerp(selectionFocus,t));floor.material.opacity=0;boxContact.visible=false;
  canContacts.forEach(contact=>{contact.visible=false;});
 }
 scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);
 if(p>.94&&selection===0){
  const bounds={};
  cans.forEach((can,i)=>{
   const b=new THREE.Box3().setFromObject(can),points=[];
   for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])points.push(new THREE.Vector3(x,y,z).project(camera));
   const xs=points.map(v=>(v.x+1)*stage.clientWidth/2),ys=points.map(v=>(1-v.y)*stage.clientHeight/2);
   bounds[slugs[i]]={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
  });onBounds(bounds);
 }
}

  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.VSMShadowMap;
  scene=new THREE.Scene();scene.background=null;renderer.setClearColor(0x000000,0);
  const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.035).texture;scene.environmentIntensity=.85;room.dispose();pmrem.dispose();
  camera=new THREE.PerspectiveCamera(30,1,.01,100);
  floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.065}));floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;scene.add(floor);
  const key=new THREE.DirectionalLight('#fffbea',2.6);key.position.set(-3,8,3);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-3,right:3,top:4,bottom:-3,near:.1,far:20});key.shadow.bias=-.00008;key.shadow.normalBias=.004;key.shadow.radius=8;key.shadow.blurSamples=10;scene.add(key);
  const fill=new THREE.DirectionalLight('#edf3ff',.8);fill.position.set(4,4,-3);scene.add(fill);
  // Soft contact beneath each product complements the diffuse studio shadow.
  const stamp=document.createElement('canvas');stamp.width=stamp.height=128;const ctx=stamp.getContext('2d');
  const radial=ctx.createRadialGradient(64,64,4,64,64,64);radial.addColorStop(0,'rgba(28,40,28,.45)');radial.addColorStop(.3,'rgba(28,40,28,.25)');radial.addColorStop(.65,'rgba(28,40,28,.06)');radial.addColorStop(1,'rgba(28,40,28,0)');ctx.fillStyle=radial;ctx.fillRect(0,0,128,128);
  const contactMap=new THREE.CanvasTexture(stamp);contactMap.colorSpace=THREE.SRGBColorSpace;
  const contact=()=>{const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:contactMap,transparent:true,depthWrite:false,toneMapped:false}));mesh.rotation.x=-Math.PI/2;scene.add(mesh);return mesh;};
  boxContact=contact();boxContact.scale.set(2.3,1.85,1);canContacts=slugs.map(contact);
  const packageAsset=await new GLTFLoader().loadAsync(new URL('../pep-official-box-3d/pep-caixa-preta.glb',import.meta.url).href);
  box=packageAsset.scene.getObjectByName('PEP_OFFICIAL_BOX');lid=packageAsset.scene.getObjectByName('Lid_Hinge');
  if(!box||!lid)throw new Error('Missing official box geometry');
  box.removeFromParent();box.scale.setScalar(10);scene.add(box);
  box.traverse(o=>{if(o.isMesh){o.castShadow=!/Copy|Reminder|Logo|Icon|Panel/i.test(o.name);o.receiveShadow=true;}});
  // Keep separate centimetre-scaled can wrappers as children of a metres-scaled box.
  holders=new THREE.Group();holders.name='Three_Can_Slots';holders.scale.setScalar(.1);box.add(holders);
  const loader=new GLTFLoader();
  cans=await Promise.all(slugs.map(async slug=>{
   const gltf=await loader.loadAsync(models[slug]);const root=gltf.scene.getObjectByName('PEP_CAN_355ML');if(!root)throw new Error('Missing can geometry');
   root.removeFromParent();root.scale.setScalar(10);root.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(root),center=bounds.getCenter(new THREE.Vector3());root.position.x-=center.x;root.position.z-=center.z;root.position.y-=bounds.min.y;
   root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material]){
    if(m.name.startsWith('Official front'))applyPrint(m,slug);
    if(m.name.includes('aluminium')){m.metalness=1;m.roughness=.28;m.color.set('#c4c9c9');}
   }}});
   refineCan(root,slug);
   const holder=new THREE.Group();holder.name='Can_'+slug;holder.add(root);holders.add(holder);return holder;
  }));
  // The box group uses metres with scale 10. Its animated translation must be
  // compensated in the introductory can wrapper, whose coordinates are x10.
  const resize=()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();dirty=true;};new ResizeObserver(resize).observe(stage);resize();
  ready=true;
  renderer.setAnimationLoop(time=>{
   if(spin!==spinTarget){const t=smooth(0,1,Math.min(1,(time-spinStarted)/320));spin=THREE.MathUtils.lerp(spinFrom,spinTarget,t);dirty=true;}
   const target=selected?1:0;
   if(selection!==target){const elapsed=THREE.MathUtils.clamp((time-animationStarted)/1150,0,1);selection=THREE.MathUtils.lerp(animationFrom,target,elapsed);dirty=true;}
   const returned=!selected&&selection===0&&returnPending;
   if(!selected&&selection===0)lastSelected=null;
   if(document.hidden||!dirty||!ready)return;
   pose(selected||returnPending?1:progress);
   renderer.render(scene,camera);dirty=false;
   if(returned){returnPending=false;onReturn();}
  });
  document.addEventListener('visibilitychange',()=>{dirty=true;});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderer.setAnimationLoop(null);fail('A prévia 3D foi interrompida. Recarregue para continuar.');});
return {
setProgress(p){progress=THREE.MathUtils.clamp(p,0,1);dirty=true;},
selectFlavor(slug){if(slug&&slug!==selected)spin=spinFrom=spinTarget=0;animationFrom=selection;animationStarted=performance.now();lastSelected=selected||lastSelected;selected=slugs.includes(slug)?slug:null;returnPending=!selected&&lastSelected!==null;if(reduced.matches)selection=selected?1:0;dirty=true;},
rotateSelected(delta,immediate=false){if(!selected||selection<.99)return;spinFrom=spin;spinTarget=(immediate?spin:spinTarget)+delta;spinStarted=performance.now();if(immediate||reduced.matches)spin=spinTarget;dirty=true;},
resetSelected(){if(!selected)return;spinFrom=spin;spinTarget=Math.round(spin/(Math.PI*2))*Math.PI*2;spinStarted=performance.now();if(reduced.matches)spin=spinTarget;dirty=true;}
};
}
