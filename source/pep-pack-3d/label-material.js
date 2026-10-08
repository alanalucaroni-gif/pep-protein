import * as THREE from 'three';
const flavors={limao:{color:'#e7edc5'},frutas:{color:'#fb4568'},acai:{color:'#a4ccef'}};
export function applyPrint(material,slug){
 // Native 3D material: source photo stays unchanged. Key its printed colors,
 // replacing photographed paint/reflections with the same PBR paint as the rear.
 material.onBeforeCompile=shader=>{
  shader.uniforms.pepPaint={value:new THREE.Color(flavors[slug].color)};
  const ink=slug==='limao'?
   `float ink = smoothstep(.16,.26,max(c.g-c.r,c.r-c.b));
    float infoBoxes=step(1080.0,p.y)*step(p.y,1203.0)*step(326.0,p.x)*step(p.x,720.0)*smoothstep(.84,.93,min(c.r,min(c.g,c.b)));
    ink=max(ink,infoBoxes);`:slug==='frutas'?
   `float whiteInk=smoothstep(.65,.83,min(c.r,min(c.g,c.b)));
    float darkInk=1.0-smoothstep(.55,.75,max(c.r,max(c.g,c.b)));
    float greenInk=smoothstep(.03,.12,c.g-c.r*.8)*smoothstep(.02,.12,c.g-c.b);
    float redFruit=(1.0-smoothstep(.13,.25,c.g))*smoothstep(.2,.5,c.r)*step(590.0,p.y)*step(p.y,930.0);
    float ink=max(max(whiteInk,darkInk),max(greenInk,redFruit));`:
   `float whiteInk=smoothstep(.70,.84,min(c.r,min(c.g,c.b)))*(1.0-smoothstep(.06,.15,max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b))));
    float purpleInk=smoothstep(.59,.69,(c.b-c.g)/max(c.b-c.r,.001))*smoothstep(.04,.10,c.b-c.r);
    float ink=max(whiteInk,purpleInk);`;
  shader.fragmentShader='uniform vec3 pepPaint;\nfloat pepInkMask;\nvec3 pepInkColor;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   vec4 photo=texture2D(map,vMapUv);
   vec3 c=pow(max(photo.rgb,vec3(0.0)),vec3(1.0/2.2));
   vec2 p=vMapUv*vec2(1040.0,1512.0);
   ${ink}
   float printArea=smoothstep(208.0,220.0,p.y)*(1.0-smoothstep(1300.0,1310.0,p.y));
   float edge=smoothstep(277.0,294.0,p.x)*(1.0-smoothstep(748.0,765.0,p.x));
   pepInkMask=ink*printArea*edge;pepInkColor=photo.rgb;
   diffuseColor.rgb=mix(pepPaint,photo.rgb,pepInkMask);
  `);
  // Keep print colors legible while the paint and metal retain studio lighting.
  shader.fragmentShader=shader.fragmentShader.replace('#include <tonemapping_fragment>',
   '#include <tonemapping_fragment>\ngl_FragColor.rgb=mix(gl_FragColor.rgb,pepInkColor*.96,pepInkMask);');
 };
 material.customProgramCacheKey=()=>`pep-uniform-print-${slug}`;
}

