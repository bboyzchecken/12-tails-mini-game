globalThis.self = globalThis;
import { readFileSync } from 'fs';
const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
const THREE = await import('three');
const files = process.argv.slice(2);
const loader = new GLTFLoader();
function loadGlb(path){
  const buf = readFileSync(path);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset+buf.byteLength);
  return new Promise((res,rej)=> loader.parse(ab, '', g=>res(g), e=>rej(e)));
}
const f3=v=>`[${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}]`;
for (const f of files){
  try{
    const g = await loadGlb(f);
    console.log('\n#### '+f.split('/').slice(-1)[0]);
    g.scene.traverse(o=>{
      const q=o.quaternion;
      console.log(`  ${o.type} "${o.name}" pos${f3(o.position)} quat[${q.x.toFixed(3)},${q.y.toFixed(3)},${q.z.toFixed(3)},${q.w.toFixed(3)}]`);
      if (o.isMesh && o.geometry){
        o.geometry.computeBoundingBox();
        const b=o.geometry.boundingBox;
        const raw={x:b.max.x-b.min.x,y:b.max.y-b.min.y,z:b.max.z-b.min.z};
        const rawAx=[['x',raw.x],['y',raw.y],['z',raw.z]].sort((a,c)=>c[1]-a[1])[0][0];
        console.log(`     RAW min${f3(b.min)} max${f3(b.max)} long=${rawAx}`);
        // orient into Group frame: apply node quaternion to bbox corners
        const bb2=new THREE.Box3(); bb2.makeEmpty();
        for(const xx of [b.min.x,b.max.x])for(const yy of [b.min.y,b.max.y])for(const zz of [b.min.z,b.max.z]){
          const p=new THREE.Vector3(xx,yy,zz).applyQuaternion(o.quaternion); bb2.expandByPoint(p);
        }
        const or={x:bb2.max.x-bb2.min.x,y:bb2.max.y-bb2.min.y,z:bb2.max.z-bb2.min.z};
        const orAx=[['x',or.x],['y',or.y],['z',or.z]].sort((a,c)=>c[1]-a[1])[0][0];
        console.log(`     ROT->group min${f3(bb2.min)} max${f3(bb2.max)} long=${orAx}`);
      }
    });
  }catch(e){ console.log('ERR '+f+': '+e.message); }
}
