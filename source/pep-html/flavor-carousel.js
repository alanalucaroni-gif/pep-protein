import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

import {applyPrint} from '../pep-pack-3d/label-material.js';
import {refineCan,studioEnvironment} from './finishes.js';

const slugs=['limao','frutas','acai'];
const assets=[
 new URL('../pep-3d/pep-limao-foto-frontal.glb',import.meta.url).href,
 new URL('../pep-3d/pep-frutas-foto-frontal.glb',import.meta.url).href,
 new URL('../pep-3d/pep-acai-foto-frontal.glb',import.meta.url).href
];
// A separate lazy studio view; the box choreography keeps its own timeline.
export async function createFlavorCarousel(canvas,stage,reduced){
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.01,100);
 scene.environment=studioEnvironment(renderer);scene.environmentIntensity=.7;
 const key=new THREE.DirectionalLight('#fffaf1',2);key.position.set(-3,7,5);scene.add(key);
 const fill=new THREE.DirectionalLight('#edf3ff',1);fill.position.set(4,3,3);scene.add(fill);
 const rim=new THREE.DirectionalLight('#ffffff',1.2);rim.position.set(1,5,-4);scene.add(rim);
 const loader=new GLTFLoader();
 const cans=await Promise.all(slugs.map(async(slug,i)=>{
  const gltf=await loader.loadAsync(assets[i]),root=gltf.scene.getObjectByName('PEP_CAN_355ML');
  if(!root)throw new Error('Missing can geometry');
  root.removeFromParent();root.scale.setScalar(10);root.updateMatrixWorld(true);
  const b=new THREE.Box3().setFromObject(root),c=b.getCenter(new THREE.Vector3());
  root.position.sub(c);
  root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(m.name.startsWith('Official front'))applyPrint(m,slug);
   if(m.name.includes('aluminium')){m.metalness=1;m.roughness=.28;m.color.set('#c4c9c9');}
  }});
  refineCan(root,slug);
  const holder=new THREE.Group();holder.add(root);scene.add(holder);return holder;
 }));
 let active=0,previous=0,direction=1,start=0,moving=false,dirty=true,visible=false,entry=1,spin=0,spinFrom=0,spinTarget=0,spinStarted=0;
 const smooth=t=>t*t*t*(t*(t*6-15)+10);
 const resize=()=>{
  const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height,false);
  camera.aspect=width/height;camera.position.set(0,.18,Math.max(3.35,.78/(Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect)));
  camera.lookAt(0,0,0);camera.updateProjectionMatrix();dirty=true;
 };
 new ResizeObserver(resize).observe(stage);resize();
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;dirty=true;},{threshold:0}).observe(stage);
 renderer.setAnimationLoop(time=>{
  if(spin!==spinTarget){const s=smooth(Math.min(1,(time-spinStarted)/320));spin=TMath(spinFrom,spinTarget,s);dirty=true;}
  if(document.hidden||!visible||(!dirty&&!moving))return;
  const t=moving?smooth(Math.min(1,(time-start)/1150)):1;
  cans.forEach((can,i)=>{
   can.visible=i===active||(moving&&t<1&&i===previous);
   can.position.set(0,-.18*(1-entry),0);can.rotation.set(0,0,0);
   if(moving){
    const travel=camera.position.z*Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect+.7;
    if(i===previous){can.position.x=-direction*t*travel;can.position.z=-t*.8;can.rotation.y=-direction*t*Math.PI*.9;can.rotation.z=-direction*t*.16;}
    if(i===active){can.position.x=direction*(1-t)*travel;can.position.z=-(1-t)*.8;can.rotation.y=direction*(1-t)*Math.PI*.9;can.rotation.z=direction*(1-t)*.16;}
   }
   if(i===active)can.rotation.y+=spin;
  });
  renderer.render(scene,camera);dirty=false;
  if(t===1)moving=false;
 });
 document.addEventListener('visibilitychange',()=>{dirty=true;});
 canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();renderer.setAnimationLoop(null);stage.closest('.explore-product').classList.remove('explore-ready');});
 return {
  select(index,dir){spin=spinFrom=spinTarget=0;previous=active;active=index;direction=dir;start=performance.now();moving=!reduced.matches&&previous!==active;dirty=true;},
  rotate(delta,immediate=false){if(moving)return;spinFrom=spin;spinTarget=(immediate?spin:spinTarget)+delta;spinStarted=performance.now();if(immediate||reduced.matches)spin=spinTarget;dirty=true;},
  setEntry(value){if(entry!==value){entry=value;dirty=true;}}
 };
}
const TMath=THREE.MathUtils.lerp;

