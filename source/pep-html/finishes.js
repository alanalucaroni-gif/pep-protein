import * as T from 'three';
import {applyPrint} from '../pep-pack-3d/label-material.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
export function studioEnvironment(renderer){
 const room=new RoomEnvironment();
 // Tall diffused reflection cards outline the curved metal without bleaching the ink.
 for(const [x,y,z,w,h,power] of [[-4,3,2,2,5,2],[4,2,-1,1,4,1.3],[0,6,0,4,3,1.3]]){
  const card=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:new T.Color(power,power,power),side:T.DoubleSide}));
  card.position.set(x,y,z);card.lookAt(0,1,0);room.add(card);
 }
 const pmrem=new T.PMREMGenerator(renderer),texture=pmrem.fromScene(room,.06).texture;
 room.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});pmrem.dispose();return texture;
}
function physical(original){const m=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(m,original);return m;}

// Small physical surface variations retain the official uniform paint color.
function grain(material,metal){
 const previous=material.onBeforeCompile;
 material.onBeforeCompile=shader=>{
  previous(shader);
  shader.vertexShader='varying vec3 pepSurfacePosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\npepSurfacePosition=position;');
  shader.fragmentShader='varying vec3 pepSurfacePosition;\n'+shader.fragmentShader;
  const pattern=metal?'sin(pepSurfacePosition.x*18000.0+pepSurfacePosition.z*1000.0)':'sin(dot(pepSurfacePosition,vec3(12000.0,17300.0,9100.0)))*sin(dot(pepSurfacePosition,vec3(21100.0,8000.0,14100.0)))';
  shader.fragmentShader=shader.fragmentShader.replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor+${metal?.028:.045}*${pattern},.1,1.0);`);
  if(!metal)shader.fragmentShader=shader.fragmentShader.replace('pepInkMask);','pepInkMask*.28);');
 };
 const key=material.customProgramCacheKey();material.customProgramCacheKey=()=>key+(metal?'-brushed-v1':'-grain-v1');
 material.needsUpdate=true;
}
export function refineCan(root,slug){
 const cache=new Map();
 root.traverse(object=>{
  if(!object.isMesh)return;object.castShadow=true;object.receiveShadow=true;
  const refine=original=>{
   if(cache.has(original))return cache.get(original);
   const m=physical(original);m.name=original.name;
   if(m.name.includes('aluminium')){
    m.metalness=1;m.color.set(m.name.includes('Scored')?'#777e80':'#aeb5b9');
    m.roughness=m.name.includes('Polished')?.18:.27;m.envMapIntensity=1;
    m.anisotropy=.55;m.anisotropyRotation=Math.PI*.5;grain(m,true);
   }else if(m.name.startsWith('Official front')||m.name.includes('LABEL')||m.name.toLowerCase().includes('paint')){
    m.metalness=.08;m.roughness=.36;m.clearcoat=.24;m.clearcoatRoughness=.32;m.envMapIntensity=.65;
    if(m.name.startsWith('Official front'))applyPrint(m,slug);grain(m,false);
   }
   cache.set(original,m);return m;
  };
  object.material=Array.isArray(object.material)?object.material.map(refine):refine(object.material);
 });
}
export function refineBox(root){
 const cache=new Map();root.traverse(object=>{
  if(!object.isMesh)return;
  const refine=original=>{
   if(cache.has(original))return cache.get(original);
   const m=physical(original);m.name=original.name;m.metalness=0;m.clearcoat=0;
   const print=/ink|print|white|yellow|pink|purple/i.test(m.name);
   m.roughness=print?.8:.91;m.envMapIntensity=.55;
   if(!print){m.color.multiplyScalar(1.25);grain(m,false);}
   cache.set(original,m);return m;
  };object.material=Array.isArray(object.material)?object.material.map(refine):refine(object.material);
 });
}

