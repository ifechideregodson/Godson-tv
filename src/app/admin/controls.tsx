"use client";
import { useState } from "react";

type LiveResult = { id?: string; title?: string; ingest?: {url?:string;streamKey?:string}|null; playback?:string; message?:string; error?:string };
type UploadResult = { uid?:string; uploadURL?:string; message?:string; error?:string };

export default function AdminControls(){
 const [title,setTitle]=useState("Godsotv Main Channel");
 const [busy,setBusy]=useState(false);
 const [live,setLive]=useState<LiveResult|null>(null);
 const [upload,setUpload]=useState<UploadResult|null>(null);
 const [uploadTitle,setUploadTitle]=useState("");
 const [category,setCategory]=useState("Entertainment");
 const [error,setError]=useState("");
 async function createLive(){
  setBusy(true);setError("");setLive(null);
  try{
   const r=await fetch("/api/admin/live-input",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Could not create live input");setLive(data);
  }catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}
 }
 async function createUpload(){
  setBusy(true);setError("");setUpload(null);
  try{
   const r=await fetch("/api/admin/media/direct-upload",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:uploadTitle,category})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||"Could not create upload");setUpload(data);
  }catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}
 }
 return <div style={{display:"grid",gap:20}}>
  <section className="card"><h2 style={{fontSize:22,marginTop:0}}>Create live input</h2><p className="muted" style={{lineHeight:1.65}}>Create a live channel in Cloudflare Stream. Then copy the RTMPS server and stream key into OBS Studio. Keep the key secret.</p><label className="muted" style={{fontSize:13}}>Broadcast title</label><input className="field" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/><button className="btn primary" disabled={busy||!title.trim()} onClick={createLive} style={{marginTop:12}}>{busy?"Working…":"Create live input"}</button>
  {live&&<div className="panel" style={{padding:15,marginTop:16,overflowWrap:"anywhere"}}><b>Live input created</b><p className="muted" style={{fontSize:13}}>ID: {live.id}</p>{live.ingest?.url&&<><label className="muted">RTMPS server</label><input className="field" readOnly value={live.ingest.url}/><label className="muted" style={{display:"block",marginTop:10}}>Private stream key</label><input className="field" readOnly value={live.ingest.streamKey||""}/><button className="btn secondary" style={{marginTop:10}} onClick={()=>navigator.clipboard.writeText(live.ingest?.streamKey||"")}>Copy stream key</button></>}{live.playback&&<p className="muted" style={{fontSize:12,overflowWrap:"anywhere"}}>Playback: {live.playback}</p>}<p className="muted" style={{fontSize:12}}>Do not screenshot, share, or commit the stream key. Rotate it if exposed.</p></div>}
  </section>
  <section className="card"><h2 style={{fontSize:22,marginTop:0}}>Prepare recorded-video upload</h2><p className="muted" style={{lineHeight:1.65}}>Creates a time-limited direct-upload URL and a private draft record. Large uploads should use Cloudflare's tus upload flow.</p><label className="muted" style={{fontSize:13}}>Video title</label><input className="field" value={uploadTitle} onChange={e=>setUploadTitle(e.target.value)} placeholder="Enter video title"/><label className="muted" style={{fontSize:13,display:"block",marginTop:10}}>Category</label><select className="field" value={category} onChange={e=>setCategory(e.target.value)}><option>News</option><option>Entertainment</option><option>Sports</option><option>Education</option><option>Gospel</option><option>General</option></select><button className="btn primary" disabled={busy||!uploadTitle.trim()} onClick={createUpload} style={{marginTop:12}}>{busy?"Working…":"Create upload URL"}</button>
  {upload&&<div className="panel" style={{padding:15,marginTop:16,overflowWrap:"anywhere"}}><b>Upload session created</b><p className="muted">Media ID: {upload.uid}</p><label className="muted">Temporary upload URL</label><textarea className="field" readOnly rows={3} value={upload.uploadURL||""}/><button className="btn secondary" style={{marginTop:10}} onClick={()=>navigator.clipboard.writeText(upload.uploadURL||"")}>Copy upload URL</button><p className="muted" style={{fontSize:12}}>This is a temporary upload URL, not the public playback URL. The next step is to connect a file uploader and provider webhook to mark media as ready.</p></div>}
  </section>
  {error&&<p role="alert" style={{color:"#ff8794"}}>{error}</p>}
 </div>
}
