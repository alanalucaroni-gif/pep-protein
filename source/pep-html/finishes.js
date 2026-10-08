import * as T from 'three';
import {applyPrint} from '../pep-pack-3d/label-material.js';
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
    m.metalness=1;m.color.set(m.name.includes('Scored')?'#777e80':'#c6cccf');
    m.roughness=m.name.includes('Polished')?.21:.34;m.envMapIntensity=.85;
    m.anisotropy=.38;m.anisotropyRotation=Math.PI*.5;grain(m,true);
   }else if(m.name.startsWith('Official front')||m.name.includes('LABEL')||m.name.toLowerCase().includes('paint')){
    m.metalness=.10;m.roughness=.40;m.clearcoat=.16;m.clearcoatRoughness=.3;m.envMapIntensity=.7;
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
  const original=object.material;
  if(!cache.has(original)){
   const m=physical(original);m.name=original.name;m.metalness=0;m.roughness=m.name.includes('lining')?.94:.84;m.clearcoat=0;m.envMapIntensity=.45;grain(m,false);cache.set(original,m);
  }object.material=cache.get(original);
 });
}
