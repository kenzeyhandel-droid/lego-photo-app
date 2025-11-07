import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const LEGO_COLORS = [
  { name: "Rood", hex: "#C91A09", bricklink_color_id: 5, bl_name: "Red" },
  { name: "Donkerrood", hex: "#9E0B0F", bricklink_color_id: 59, bl_name: "Dark Red" },
  { name: "Oranje", hex: "#F08E2B", bricklink_color_id: 167, bl_name: "Reddish Orange" },
  { name: "Geel", hex: "#F2CD37", bricklink_color_id: 3, bl_name: "Yellow" },
  { name: "Limoen", hex: "#C5E86C", bricklink_color_id: 35, bl_name: "Light Lime" },
  { name: "Groen", hex: "#067D3E", bricklink_color_id: 1109, bl_name: "Bright Green" },
  { name: "Donkergroen", hex: "#1F6F3D", bricklink_color_id: 22598, bl_name: "Dark Green" },
  { name: "Lichtblauw", hex: "#9AD0EC", bricklink_color_id: 1147, bl_name: "Bright Light Blue" },
  { name: "Blauw", hex: "#0055BF", bricklink_color_id: 4, bl_name: "Blue" },
  { name: "Donkerblauw", hex: "#0A3B7B", bricklink_color_id: 109, bl_name: "Dark Royal Blue" },
  { name: "Paars", hex: "#6A1B9A", bricklink_color_id: 43, bl_name: "Violet" },
  { name: "Roze", hex: "#FF8DAA", bricklink_color_id: 9187, bl_name: "Bright Pink" },
  { name: "Bruin", hex: "#6B4C3B", bricklink_color_id: 8019, bl_name: "Brown" },
  { name: "Zwart", hex: "#000000", bricklink_color_id: 11, bl_name: "Black" },
  { name: "Donkergrijs", hex: "#6D6E70", bricklink_color_id: 10, bl_name: "Dark Gray" },
  { name: "Lichtgrijs", hex: "#9EA3A8", bricklink_color_id: 49, bl_name: "Light Gray" },
  { name: "Wit", hex: "#FFFFFF", bricklink_color_id: 1, bl_name: "White" }
];

function hexToRgb(hex){ const parsed=hex.replace('#',''); const bigint=parseInt(parsed,16); return [(bigint>>16)&255,(bigint>>8)&255, bigint&255]; }
function colorDistanceSq(a,b){ const dr=a[0]-b[0]; const dg=a[1]-b[1]; const db=a[2]-b[2]; return dr*dr+dg*dg+db*db; }
function nearestLegoColor(rgb){ let best=null; let bestDist=Infinity; for(const c of LEGO_COLORS){ const cr=hexToRgb(c.hex); const d=colorDistanceSq(rgb,cr); if(d<bestDist){ bestDist=d; best=c; } } return best; }

export default function App(){
  const [imageSrc,setImageSrc]=useState(null);
  const [gridSize,setGridSize]=useState(48);
  const [pixelSize,setPixelSize]=useState(12);
  const [legoMap,setLegoMap]=useState(null);
  const [partsList,setPartsList]=useState([]);
  const [stepHeight,setStepHeight]=useState(8);
  const [selectedPart,setSelectedPart]=useState("4073"); // default
  const inputRef=useRef();
  const previewRef=useRef();

  useEffect(()=>{ if(!imageSrc){ setLegoMap(null); setPartsList([]); } },[imageSrc]);

  async function onFileChange(e){ const f=e.target.files&&e.target.files[0]; if(!f) return; const url=URL.createObjectURL(f); setImageSrc(url); }

  async function loadImage(src){ return new Promise((res,rej)=>{ const i=new Image(); i.crossOrigin='anonymous'; i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }

  async function generateLego(){
    if(!imageSrc) return;
    const img = await loadImage(imageSrc);
    const w = gridSize;
    const h = Math.max(1, Math.round((img.height/img.width)*w));
    const canvas = document.createElement('canvas'); canvas.width=w; canvas.height=h;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0,w,h);
    const data = ctx.getImageData(0,0,w,h).data;
    const map=[]; const counts={};
    for(let y=0;y<h;y++){ const row=[]; for(let x=0;x<w;x++){ const i=(y*w+x)*4; const rgb=[data[i],data[i+1],data[i+2]]; const n=nearestLegoColor(rgb); row.push(n); counts[n.name]=(counts[n.name]||0)+1; } map.push(row); }
    setLegoMap({map,width:w,height:h}); const parts = Object.keys(counts).map(name=>{ const c=LEGO_COLORS.find(cc=>cc.name===name); return { name:c.name, bl_name:c.bl_name, hex:c.hex, count:counts[name], bricklink_color_id:c.bricklink_color_id }; }).sort((a,b)=>b.count-a.count);
    setPartsList(parts); renderPreview({map,w,h});
  }

  function renderPreview({map,w,h}){ const canvas=previewRef.current; if(!canvas) return; canvas.width = w*pixelSize; canvas.height = h*pixelSize; const ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); for(let y=0;y<h;y++){ for(let x=0;x<w;x++){ const c=map[y][x]; ctx.fillStyle=c.hex; ctx.fillRect(x*pixelSize,y*pixelSize,pixelSize,pixelSize); const cx=x*pixelSize+pixelSize/2; const cy=y*pixelSize+pixelSize/2; const r = Math.max(1, pixelSize*0.18); ctx.beginPath(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.arc(cx,cy,r,0,Math.PI*2); ctx.fill(); } } }

  function downloadPNG(){ const canvas=previewRef.current; const a=document.createElement('a'); a.href=canvas.toDataURL('image/png'); a.download='lego_mosaic.png'; a.click(); }

  function downloadCSV(){ if(!partsList.length) return; let csv='color_name,color_hex,bricklink_color_id,part_id,qty\n'; for(const p of partsList) csv+=`${p.name},${p.hex},${p.bricklink_color_id},${selectedPart},${p.count}\n`; const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='parts.csv'; a.click(); URL.revokeObjectURL(url); }

  async function downloadPDF(){ if(!legoMap) return alert('Generate mosaic first'); // send data to backend
    const payload = { legoMap, partsList, part_id: selectedPart, stepHeight };
    try{
      const resp = await axios.post(`${BACKEND}/api/generate_pdf`, payload, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([resp.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = 'lego_instructions.pdf'; a.click();
      window.URL.revokeObjectURL(url);
    }catch(e){ alert('PDF generation failed: '+(e.message||e)); }
  }

  async function downloadBrickLinkXML(type){
    if(!partsList.length) return;
    const payload = { partsList, part_id: selectedPart };
    try{
      const resp = await axios.post(`${BACKEND}/api/generate_bricklink_xml`, payload, { params: { type }, responseType: 'blob' });
      const url = window.URL.createObjectURL(resp.data);
      const a = document.createElement('a'); a.href = url; a.download = `bricklink_${type}.xml`; a.click();
      window.URL.revokeObjectURL(url);
    }catch(e){ alert('XML export failed: '+(e.message||e)); }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Lego Photo Webapp</h1>
      <div className="bg-white p-4 rounded shadow mb-6">
        <label className="block mb-2">Upload foto</label>
        <input ref={inputRef} type="file" accept="image/*" onChange={(e)=>onFileChange(e)} className="mb-3" />
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Breedte in steentjes</label>
            <input type="range" min={12} max={140} value={gridSize} onChange={e=>setGridSize(parseInt(e.target.value))} />
            <div>{gridSize} steentjes breed</div>
          </div>
          <div>
            <label>Weergave grootte per steentje (px)</label>
            <input type="range" min={6} max={28} value={pixelSize} onChange={e=>setPixelSize(parseInt(e.target.value))} />
            <div>{pixelSize} px</div>
          </div>
        </div>
        <div className="mt-4">
          <button onClick={generateLego} className="px-4 py-2 bg-blue-600 text-white rounded mr-2">Genereer LEGO</button>
          <button onClick={()=>{ setImageSrc(null); inputRef.current.value=null; setLegoMap(null); setPartsList([]); }} className="px-4 py-2 border rounded">Reset</button>
        </div>
      </div>

      {legoMap && (
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Preview</h2>
              <div className="overflow-auto border rounded" style={{maxHeight:600}}>
                <canvas ref={previewRef} style={{display:'block'}} />
              </div>
              <div className="mt-3">
                <button onClick={downloadPNG} className="px-3 py-2 bg-green-600 text-white rounded mr-2">Download PNG</button>
                <button onClick={downloadCSV} className="px-3 py-2 bg-yellow-600 text-white rounded mr-2">Download CSV</button>
                <button onClick={()=>downloadBrickLinkXML('round')} className="px-3 py-2 bg-indigo-600 text-white rounded mr-2">BrickLink XML (round)</button>
                <button onClick={()=>downloadBrickLinkXML('tile')} className="px-3 py-2 bg-indigo-600 text-white rounded mr-2">BrickLink XML (tile)</button>
                <button onClick={downloadPDF} className="px-3 py-2 bg-gray-700 text-white rounded">Download PDF</button>
              </div>
            </div>
          </div>
          <div>
            <div className="bg-white p-4 rounded shadow">
              <h2 className="font-semibold mb-2">Parts list</h2>
              <label className="block mb-2">Kies onderdeel (part ID)</label>
              <select value={selectedPart} onChange={e=>setSelectedPart(e.target.value)} className="mb-3">
                <option value="4073">4073 (1x1 round plate)</option>
                <option value="3070b">3070b (1x1 tile)</option>
                <option value="35381">35381 (1x1 plate newer)</option>
              </select>
              <div className="space-y-2">
                {partsList.map(p=>(
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div style={{width:22,height:22,background:p.hex,border:'1px solid #ccc'}} />
                      <div>{p.name} / {p.bl_name}</div>
                    </div>
                    <div className="font-medium">{p.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}