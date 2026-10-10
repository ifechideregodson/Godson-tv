import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AdminControls from "./controls";

export default async function AdminPage(){
 const session=await auth();
 if(!session?.user?.email) redirect("/admin/login");
 const admins=(process.env.GODSOTV_ADMIN_EMAILS??"").split(",").map(x=>x.trim().toLowerCase());
 if(!admins.includes(session.user.email.toLowerCase())) redirect("/admin/login");
 return <main className="container" style={{paddingTop:36,paddingBottom:60}}><Link href="/" className="muted">← View public website</Link><div style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"start",flexWrap:"wrap",marginTop:25}}><div><p className="gold" style={{fontSize:12,fontWeight:800,letterSpacing:".15em"}}>GODSOTV OPERATIONS</p><h1 style={{fontSize:40,margin:"8px 0"}}>Broadcast Studio</h1><p className="muted">Signed in as {session.user.email}</p></div><form action={async()=>{"use server";await signOut({redirectTo:"/"});}}><button className="btn secondary">Sign out</button></form></div><div className="panel" style={{padding:18,display:"flex",gap:12,marginTop:20}}><ShieldCheck className="gold"/><p className="muted" style={{margin:0,lineHeight:1.65}}>Private operator tools. Stream keys are secrets; paste them only into OBS Studio or another trusted encoder. This first iteration creates provider inputs and upload sessions; publishing workflows and webhooks are the next implementation phase.</p></div><div style={{marginTop:22}}><AdminControls/></div><p className="muted" style={{marginTop:22,fontSize:13}}>Service health: <a className="gold" href="/api/health" target="_blank">/api/health</a></p></main>
}