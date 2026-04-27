import { useState, useEffect, useRef } from "react";

// ── DATA ────────────────────────────────────────────────────────────
const EXP_CAT = [
  { id:"food",          label:"Makanan",      icon:"🍜", color:"#F87171" },
  { id:"transport",     label:"Transportasi", icon:"🚗", color:"#38BDF8" },
  { id:"shopping",      label:"Belanja",      icon:"🛍️", color:"#FBBF24" },
  { id:"health",        label:"Kesehatan",    icon:"💊", color:"#86EFAC" },
  { id:"entertainment", label:"Hiburan",      icon:"🎮", color:"#C084FC" },
  { id:"bills",         label:"Tagihan",      icon:"⚡", color:"#FB923C" },
  { id:"cafe",          label:"Kopi & Snack", icon:"☕", color:"#D97706" },
  { id:"other",         label:"Lainnya",      icon:"📦", color:"#94A3B8" },
];
const INC_CAT = [
  { id:"salary",     label:"Gaji",      icon:"💼", color:"#34D399" },
  { id:"freelance",  label:"Freelance", icon:"💻", color:"#60A5FA" },
  { id:"business",   label:"Bisnis",    icon:"🏪", color:"#FBBF24" },
  { id:"investment", label:"Investasi", icon:"📈", color:"#A78BFA" },
  { id:"gift",       label:"Hadiah",    icon:"🎁", color:"#F472B6" },
  { id:"other_inc",  label:"Lainnya",   icon:"💰", color:"#6EE7B7" },
];
const ALL_CAT = [...EXP_CAT, ...INC_CAT];
const METHODS  = ["PayPay","Cash","Transfer Bank","Kartu Kredit","GoPay","OVO","Dana"];
const JPY_RATE = 107;
const CURRENCIES = {
  IDR:{ code:"IDR", sym:"Rp", flag:"🇮🇩", label:"Rupiah" },
  JPY:{ code:"JPY", sym:"¥",  flag:"🇯🇵", label:"Yen"    },
};

const fmtMoney = (n, c) => c === "JPY"
  ? new Intl.NumberFormat("ja-JP",{style:"currency",currency:"JPY",maximumFractionDigits:0}).format(Math.round(n/JPY_RATE))
  : new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);

const todayStr = () => new Date().toISOString().split("T")[0];
const LS = { EXP:"pt_exp_v5", INC:"pt_inc_v4", CUR:"pt_cur_v1" };
const lsGet = (k,f) => { try{ const r=localStorage.getItem(k); if(r) return JSON.parse(r); }catch(_){} return f; };

const DEMO_EXP = [
  {id:1, amount:85000,  category:"food",      method:"PayPay",        date:todayStr(), note:"", tax:0,  type:"expense"},
  {id:2, amount:35000,  category:"transport", method:"GoPay",         date:todayStr(), note:"", tax:0,  type:"expense"},
  {id:3, amount:52000,  category:"health",    method:"Cash",          date:todayStr(), note:"", tax:0,  type:"expense"},
  {id:4, amount:150000, category:"bills",     method:"Transfer Bank", date:todayStr(), note:"", tax:11, type:"expense"},
];
const DEMO_INC = [
  {id:1001, desc:"Gaji Mei",     amount:5000000, category:"salary",    method:"Transfer Bank", date:todayStr(), note:"", tax:0, type:"income"},
  {id:1002, desc:"Freelance Web",amount:1200000, category:"freelance", method:"Transfer Bank", date:todayStr(), note:"", tax:0, type:"income"},
];

// ── PIE / DONUT CHART ───────────────────────────────────────────────
function DonutChart({ slices, size=230 }) {
  const [hov, setHov] = useState(null);
  const total = slices.reduce((s,x) => s+x.value, 0);
  if (!total) return <p style={{textAlign:"center",color:"#475569",padding:"40px 0",fontSize:13,fontFamily:"Sora,sans-serif"}}>Belum ada data</p>;

  const cx = size/2, cy = size/2;
  const Ro = size/2 - 10; // outer radius
  const Ri = Ro * 0.52;   // inner radius (donut hole)
  const GAP = 0.018;      // gap in radians between slices

  let cum = 0;
  const arcs = slices.filter(x=>x.value>0).map((x,i) => {
    const p   = x.value / total;
    const a0  = cum * 2*Math.PI - Math.PI/2 + GAP/2;
    cum += p;
    const a1  = cum * 2*Math.PI - Math.PI/2 - GAP/2;
    const am  = (a0+a1)/2;
    const lg  = (a1-a0) > Math.PI ? 1 : 0;

    // Outer arc points
    const ox1 = cx + Ro*Math.cos(a0), oy1 = cy + Ro*Math.sin(a0);
    const ox2 = cx + Ro*Math.cos(a1), oy2 = cy + Ro*Math.sin(a1);
    // Inner arc points
    const ix1 = cx + Ri*Math.cos(a1), iy1 = cy + Ri*Math.sin(a1);
    const ix2 = cx + Ri*Math.cos(a0), iy2 = cy + Ri*Math.sin(a0);

    // Proper donut ring path: outer arc CW, inner arc CCW
    const d = [
      `M ${ox1} ${oy1}`,
      `A ${Ro} ${Ro} 0 ${lg} 1 ${ox2} ${oy2}`,
      `L ${ix1} ${iy1}`,
      `A ${Ri} ${Ri} 0 ${lg} 0 ${ix2} ${iy2}`,
      `Z`
    ].join(" ");

    // Label position — midpoint between inner and outer radius
    const lmid = (Ri + Ro) / 2;
    return { ...x, i, p, d, am,
      lx: cx + lmid*Math.cos(am),
      ly: cy + lmid*Math.sin(am) };
  });

  const active = hov != null ? arcs.find(a=>a.i===hov) : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{display:"block",margin:"0 auto",overflow:"visible"}}>
      <defs>
        <filter id="glow-ring">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {arcs.map(a => {
        const isHov = hov === a.i;
        const push  = isHov ? 9 : 0;
        const tx = push*Math.cos(a.am), ty = push*Math.sin(a.am);
        return (
          <g key={a.i} transform={`translate(${tx},${ty})`}
            style={{cursor:"pointer",transition:"transform .22s cubic-bezier(.34,1.56,.64,1)"}}>
            <path
              d={a.d}
              fill={a.color}
              stroke="#0D1117"
              strokeWidth={2}
              opacity={hov===null ? 1 : isHov ? 1 : 0.3}
              filter={isHov ? "url(#glow-ring)" : "none"}
              style={{transition:"opacity .2s, filter .2s"}}
              onMouseEnter={()=>setHov(a.i)}
              onMouseLeave={()=>setHov(null)}
              onTouchStart={e=>{e.preventDefault(); setHov(hov===a.i?null:a.i);}}
            />
            {a.p > 0.07 && (
              <text
                x={a.lx + tx} y={a.ly + ty}
                textAnchor="middle" dominantBaseline="middle"
                style={{fontSize:10,fontWeight:800,fill:"#fff",
                  fontFamily:"DM Mono,monospace",pointerEvents:"none",
                  textShadow:"0 1px 3px rgba(0,0,0,0.8)"}}>
                {Math.round(a.p*100)}%
              </text>
            )}
          </g>
        );
      })}

      {/* Center circle */}
      <circle cx={cx} cy={cy} r={Ri-1} fill="#111827" stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>

      {/* Center content */}
      {active ? (
        <>
          <text x={cx} y={cy-14} textAnchor="middle"
            style={{fontSize:22,fontFamily:"Sora,sans-serif"}}>{active.icon}</text>
          <text x={cx} y={cy+5} textAnchor="middle"
            style={{fontSize:9,fontWeight:700,fill:active.color,
              fontFamily:"Sora,sans-serif",letterSpacing:"0.5px"}}>
            {active.label}
          </text>
          <text x={cx} y={cy+19} textAnchor="middle"
            style={{fontSize:13,fontWeight:800,fill:"#fff",fontFamily:"DM Mono,monospace"}}>
            {Math.round(active.p*100)}%
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy-5} textAnchor="middle"
            style={{fontSize:10,fill:"#334155",fontFamily:"Sora,sans-serif"}}>tap</text>
          <text x={cx} y={cy+9} textAnchor="middle"
            style={{fontSize:10,fill:"#334155",fontFamily:"Sora,sans-serif"}}>detail</text>
        </>
      )}
    </svg>
  );
}

// ── APP ─────────────────────────────────────────────────────────────
export default function App() {
  const [exp,  setExp]  = useState(()=>lsGet(LS.EXP, DEMO_EXP));
  const [inc,  setInc]  = useState(()=>lsGet(LS.INC, DEMO_INC));
  const [cur,  setCur]  = useState(()=>{ const c=lsGet(LS.CUR,"IDR"); return CURRENCIES[c]?c:"IDR"; });
  const [view, setView] = useState("home");
  const [type, setType] = useState("expense");
  const [hf,   setHf]   = useState("all");
  const [q,    setQ]    = useState("");
  const [toast,setToast]= useState(null);
  const [curModal, setCurModal] = useState(false);
  const [editRec,  setEditRec]  = useState(null);
  const [pieMode,  setPieMode]  = useState("expense");

  const blankForm = (t="expense") => ({
    desc:"", amount:"", category:t==="expense"?"food":"salary",
    method:"Cash", date:todayStr(), note:"", tax:0, type:t
  });
  const [form, setForm] = useState(()=>blankForm("expense"));

  const nextId = useRef(Math.max(5000, ...[...lsGet(LS.EXP,DEMO_EXP),...lsGet(LS.INC,DEMO_INC)].map(x=>x.id))+1);

  useEffect(()=>{ try{localStorage.setItem(LS.EXP,JSON.stringify(exp));}catch(_){} },[exp]);
  useEffect(()=>{ try{localStorage.setItem(LS.INC,JSON.stringify(inc));}catch(_){} },[inc]);
  useEffect(()=>{ try{localStorage.setItem(LS.CUR,cur);}catch(_){} },[cur]);

  const $f = n => fmtMoney(n, cur);
  const showToast = (msg, ok=true) => { setToast({msg,ok}); setTimeout(()=>setToast(null),2400); };

  // Totals
  const tExp = exp.reduce((s,x)=>s+x.amount, 0);
  const tInc = inc.reduce((s,x)=>s+x.amount, 0);
  const bal  = tInc - tExp;
  const dExp = exp.filter(x=>x.date===todayStr()).reduce((s,x)=>s+x.amount, 0);
  const dInc = inc.filter(x=>x.date===todayStr()).reduce((s,x)=>s+x.amount, 0);

  // Submit
  const handleSubmit = () => {
    if (!form.amount) return showToast("Isi nominal!", false);
    let base = parseFloat(String(form.amount).replace(/[^0-9.]/g,""));
    if (!base) return showToast("Nominal tidak valid!", false);
    if (cur==="JPY") base *= JPY_RATE;
    const taxAmt = base*(parseFloat(form.tax)||0)/100;
    const final  = Math.round(base+taxAmt);
    const rec    = { ...form, amount:final, id:editRec?editRec.id:nextId.current++ };
    delete rec.ic;
    if (!rec.desc) {
      rec.desc = ALL_CAT.find(c=>c.id===rec.category)?.label || rec.type==="income"?"Pemasukan":"Pengeluaran";
    }
    if (rec.type==="expense") setExp(p=>editRec?p.map(x=>x.id===editRec.id?rec:x):[...p,rec]);
    else                       setInc(p=>editRec?p.map(x=>x.id===editRec.id?rec:x):[...p,rec]);
    showToast(editRec?"Diperbarui ✓":"Tersimpan ✓");
    setEditRec(null); setForm(blankForm(form.type)); setView("home");
  };

  const handleDelete = (id,t) => {
    if(t==="expense") setExp(p=>p.filter(x=>x.id!==id));
    else              setInc(p=>p.filter(x=>x.id!==id));
    showToast("Dihapus", false);
  };

  const handleEdit = r => {
    setForm({...r, tax:r.tax||0, amount:String(r.amount)});
    setEditRec(r); setType(r.type); setView("add");
  };

  const getCat = id => ALL_CAT.find(c=>c.id===id) || EXP_CAT[7];
  const all      = [...exp,...inc].sort((a,b)=>new Date(b.date)-new Date(a.date));
  const filtered = all
    .filter(x=>hf==="all"||(hf==="expense"&&x.type==="expense")||(hf==="income"&&x.type==="income"))
    .filter(x=>(x.desc||"").toLowerCase().includes(q.toLowerCase())||(x.note||"").toLowerCase().includes(q.toLowerCase()));

  // Pie data
  const expPie = EXP_CAT.map(c=>({label:c.label,icon:c.icon,color:c.color,value:exp.filter(x=>x.category===c.id).reduce((s,x)=>s+x.amount,0)})).filter(x=>x.value>0);
  const incPie = INC_CAT.map(c=>({label:c.label,icon:c.icon,color:c.color,value:inc.filter(x=>x.category===c.id).reduce((s,x)=>s+x.amount,0)})).filter(x=>x.value>0);
  const netPie = [...expPie.map(x=>({...x,label:"↓ "+x.label})),...incPie.map(x=>({...x,label:"↑ "+x.label}))];
  const pieSlices = pieMode==="expense"?expPie:pieMode==="income"?incPie:netPie;
  const pieTotal  = pieSlices.reduce((s,x)=>s+x.value,0);

  // Live tax preview — uses global currency (cur) not per-form
  const liveBase = parseFloat(String(form.amount).replace(/[^0-9.]/g,""))||0;
  const liveIDR  = cur==="JPY" ? liveBase*JPY_RATE : liveBase;
  const liveTax  = liveIDR*(parseFloat(form.tax)||0)/100;
  const liveTotal= liveIDR+liveTax;

  const NAV = [
    {id:"home",    label:"Home",    icon:"◆"},
    {id:"add",     label:"Tambah",  icon:"+"},
    {id:"history", label:"Riwayat", icon:"≡"},
    {id:"chart",   label:"Analitik",icon:"◉"},
  ];

  return (
    <div style={S.app}>
      <style>{CSS}</style>

      {/* TOAST */}
      {toast && (
        <div className="toast" style={{
          background:toast.ok?"rgba(20,83,45,0.95)":"rgba(127,29,29,0.95)",
          borderColor:toast.ok?"rgba(74,222,128,0.4)":"rgba(248,113,113,0.4)",
          color:toast.ok?"#86EFAC":"#FCA5A5"
        }}>
          <span style={{marginRight:8}}>{toast.ok?"✓":"✕"}</span>{toast.msg}
        </div>
      )}

      {/* CURRENCY BOTTOM SHEET */}
      {curModal && (
        <div onClick={()=>setCurModal(false)} style={S.overlay}>
          <div onClick={e=>e.stopPropagation()} style={S.sheet}>
            <div style={S.sheetHandle}/>
            <div style={S.sheetTitle}>Pilih Mata Uang</div>
            {Object.values(CURRENCIES).map(c=>(
              <button key={c.code} className="cur-opt"
                onClick={()=>{setCur(c.code);setCurModal(false);showToast(`${c.flag} ${c.label}`);}}
                style={{...S.curOpt, borderColor:cur===c.code?"#6366F1":"rgba(255,255,255,0.06)", background:cur===c.code?"rgba(99,102,241,0.1)":"transparent"}}>
                <span style={{fontSize:26,lineHeight:1}}>{c.flag}</span>
                <div>
                  <div style={{color:"#F1F5F9",fontWeight:600,fontSize:14}}>{c.label}</div>
                  <div style={{color:"#475569",fontSize:11,marginTop:2}}>{c.sym} · {c.code}</div>
                </div>
                {cur===c.code && <span style={{marginLeft:"auto",color:"#818CF8",fontSize:20}}>✓</span>}
              </button>
            ))}
            <div style={{textAlign:"center",fontSize:11,color:"#1E293B",marginTop:4,fontFamily:"DM Mono,monospace"}}>1 JPY ≈ {JPY_RATE} IDR</div>
          </div>
        </div>
      )}

      {/* STICKY HEADER */}
      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={S.logoMark}>PT</div>
          <div>
            <div style={S.logo}>PAYTRACK</div>
            <div style={S.logoSub}>💾 auto-saved</div>
          </div>
        </div>
        <button onClick={()=>setCurModal(true)} className="pill-btn">
          {CURRENCIES[cur].flag} <strong style={{marginLeft:4}}>{cur}</strong> ▾
        </button>
      </div>

      {/* CONTENT */}
      <div style={S.content}>

        {/* ══ HOME ══ */}
        {view==="home" && (
          <div>
            {/* Balance Card */}
            <div className="fade-up" style={S.balCard}>
              <div style={S.balEyebrow}>SALDO BERSIH</div>
              <div style={{...S.balAmt, color:bal>=0?"#4ADE80":"#F87171"}}>
                {bal<0&&<span style={{opacity:.6}}>−</span>}{$f(Math.abs(bal))}
              </div>
              <span style={{...S.balTag, background:bal>=0?"rgba(74,222,128,0.08)":"rgba(248,113,113,0.08)", color:bal>=0?"#4ADE80":"#F87171", borderColor:bal>=0?"rgba(74,222,128,0.18)":"rgba(248,113,113,0.18)"}}>
                {bal>=0?"↑ Surplus":"↓ Defisit"} · {all.length} transaksi
              </span>
              <div style={S.balDivider}/>
              <div style={S.balRow}>
                <div style={S.balCol}>
                  <div style={S.balColLabel}>▲ MASUK</div>
                  <div style={{...S.balColAmt,color:"#4ADE80"}}>{$f(tInc)}</div>
                  <div style={S.balColSub}>{inc.length} item</div>
                </div>
                <div style={{width:1,alignSelf:"stretch",background:"rgba(255,255,255,0.06)"}}/>
                <div style={S.balCol}>
                  <div style={S.balColLabel}>▼ KELUAR</div>
                  <div style={{...S.balColAmt,color:"#F87171"}}>{$f(tExp)}</div>
                  <div style={S.balColSub}>{exp.length} item</div>
                </div>
              </div>
            </div>

            {/* Today pills */}
            <div style={{display:"flex",gap:10,marginBottom:26}}>
              {[
                {label:"MASUK HARI INI",  val:dInc, color:"#4ADE80", bg:"rgba(74,222,128,0.07)",  border:"rgba(74,222,128,0.14)"},
                {label:"KELUAR HARI INI", val:dExp, color:"#F87171", bg:"rgba(248,113,113,0.07)", border:"rgba(248,113,113,0.14)"},
              ].map((s,i)=>(
                <div key={i} className="fade-up" style={{flex:1,background:s.bg,border:`1px solid ${s.border}`,borderRadius:16,padding:"15px 14px",animationDelay:`${i*.05}s`}}>
                  <div style={{color:s.color,fontSize:9.5,letterSpacing:"1.2px",marginBottom:7,opacity:.8}}>{s.label}</div>
                  <div style={{color:s.color,fontFamily:"DM Mono,monospace",fontSize:16,fontWeight:700}}>{$f(s.val)}</div>
                </div>
              ))}
            </div>

            {/* Recent */}
            <div style={S.secLabel}>TERBARU</div>
            {all.slice(0,5).map((x,i)=>{
              const cat=getCat(x.category), isInc=x.type==="income";
              return (
                <div key={x.id} className="fade-up row-hover" style={{...S.row,animationDelay:`${i*.04}s`}}>
                  <div style={{...S.catBubble,background:cat.color+"18",border:`1px solid ${cat.color}28`}}>
                    <span style={{fontSize:17}}>{cat.icon}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={S.rowTitle}>{isInc?x.desc:cat.label}</div>
                    <div style={S.rowSub}>{x.method} · {x.date}</div>
                  </div>
                  <div style={{...S.rowAmt,color:isInc?"#4ADE80":"#F87171"}}>{isInc?"+":"−"}{$f(x.amount)}</div>
                </div>
              );
            })}

            {/* CTA Buttons */}
            <div style={{display:"flex",gap:10,marginTop:22}}>
              <button className="cta-green" onClick={()=>{setType("income");setForm(blankForm("income"));setView("add");}}>
                <span style={S.ctaIcon}>↑</span> Pemasukan
              </button>
              <button className="cta-red" onClick={()=>{setType("expense");setForm(blankForm("expense"));setView("add");}}>
                <span style={S.ctaIcon}>↓</span> Pengeluaran
              </button>
            </div>
          </div>
        )}

        {/* ══ ADD / EDIT ══ */}
        {view==="add" && (
          <div className="fade-up">
            {/* Type toggle — pill style */}
            <div style={S.typeToggleWrap}>
              {["income","expense"].map(t=>(
                <button key={t} onClick={()=>{setType(t);setForm(blankForm(t));setEditRec(null);}}
                  className={`type-btn ${type===t?(t==="income"?"type-inc":"type-exp"):""}`}>
                  {t==="income"?"▲ Pemasukan":"▼ Pengeluaran"}
                </button>
              ))}
            </div>

            <div style={S.formCard}>
              {/* Category — no desc/name for both income and expense */}
              <label style={S.lbl}>KATEGORI</label>
              <div style={S.catGrid}>
                {(type==="income"?INC_CAT:EXP_CAT).map(c=>(
                  <button key={c.id} onClick={()=>setForm(f=>({...f,category:c.id}))}
                    style={{...S.catChip, borderColor:form.category===c.id?c.color:"transparent",
                      background:form.category===c.id?c.color+"18":"rgba(255,255,255,0.03)",
                      boxShadow:form.category===c.id?`0 0 0 1px ${c.color}44,0 4px 16px ${c.color}22`:"none"}}>
                    <span style={{fontSize:20}}>{c.icon}</span>
                    <span style={{fontSize:10,color:form.category===c.id?c.color:"#475569",marginTop:3,fontWeight:form.category===c.id?700:400}}>{c.label}</span>
                  </button>
                ))}
              </div>

              {/* Amount — right after category, uses global cur from header */}
              <label style={S.lbl}>NOMINAL ({cur==="JPY"?"¥ Yen":"Rp Rupiah"})</label>
              <input className="inp" type="number" placeholder={cur==="JPY"?"800":"85000"}
                value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                style={{fontSize:20,fontFamily:"DM Mono,monospace",fontWeight:700,letterSpacing:"-0.5px"}}/>
              {liveBase>0 && (
                <div style={S.hint}>
                  {cur==="JPY"
                    ? `≈ ${fmtMoney(liveBase*JPY_RATE,"IDR")} IDR`
                    : `≈ ¥${Math.round(liveBase/JPY_RATE).toLocaleString()} JPY`}
                </div>
              )}

              {/* Tax */}
              <label style={S.lbl}>PAJAK</label>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {[0,5,8,10,11,12].map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,tax:t}))}
                    className={`tax-btn ${Number(form.tax)===t?"tax-active":""}`}>
                    {t===0?"Tanpa":`${t}%`}
                  </button>
                ))}
              </div>
              {/* Custom tax */}
              <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                <span style={{color:"#334155",fontSize:12,whiteSpace:"nowrap"}}>Custom:</span>
                <div style={{position:"relative",flex:1}}>
                  <input className="inp" type="number" placeholder="0" min="0" max="100"
                    value={[0,5,8,10,11,12].includes(Number(form.tax))?"":form.tax||""}
                    onChange={e=>setForm(f=>({...f,tax:e.target.value}))}
                    style={{paddingRight:28}}/>
                  <span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:"#334155",fontSize:12,pointerEvents:"none"}}>%</span>
                </div>
              </div>

              {/* Tax preview */}
              {liveBase>0 && Number(form.tax)>0 && (
                <div style={S.taxPreview}>
                  <div style={S.taxRow}><span style={{color:"#64748B"}}>Nominal dasar</span><span style={{color:"#CBD5E1",fontFamily:"DM Mono,monospace"}}>{$f(liveIDR)}</span></div>
                  <div style={S.taxRow}><span style={{color:"#FBBF24"}}>+ Pajak {form.tax}%</span><span style={{color:"#FBBF24",fontFamily:"DM Mono,monospace"}}>+{$f(liveTax)}</span></div>
                  <div style={{height:1,background:"rgba(255,255,255,0.07)",margin:"8px 0"}}/>
                  <div style={{...S.taxRow,fontWeight:700}}><span style={{color:"#F1F5F9",fontSize:14}}>Total</span><span style={{color:type==="income"?"#4ADE80":"#F87171",fontFamily:"DM Mono,monospace",fontSize:16}}>{$f(liveTotal)}</span></div>
                </div>
              )}

              {/* Method */}
              <label style={S.lbl}>METODE</label>
              <select className="inp" value={form.method} onChange={e=>setForm(f=>({...f,method:e.target.value}))}>
                {METHODS.map(m=><option key={m}>{m}</option>)}
              </select>

              {/* Date */}
              <label style={S.lbl}>TANGGAL</label>
              <input className="inp" type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>

              {/* Note */}
              <label style={S.lbl}>CATATAN <span style={{color:"#1E293B",letterSpacing:0,textTransform:"none",fontSize:10}}>(opsional)</span></label>
              <textarea className="inp" style={{height:60,resize:"none"}} placeholder="Tambahkan catatan..."
                value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}/>

              {/* Actions */}
              <div style={{display:"flex",gap:8,marginTop:22}}>
                <button onClick={handleSubmit} className={`submit-btn ${type==="income"?"submit-inc":"submit-exp"}`}>
                  {editRec?"Simpan Perubahan":"Simpan"}
                </button>
                <button onClick={()=>{setView("home");setEditRec(null);setForm(blankForm(type));}} className="cancel-btn">
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ HISTORY ══ */}
        {view==="history" && (
          <div>
            <div style={{position:"relative",marginBottom:14}}>
              <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"#334155",fontSize:15}}>⌕</span>
              <input className="inp" style={{paddingLeft:38}} placeholder="Cari transaksi..."
                value={q} onChange={e=>setQ(e.target.value)}/>
            </div>

            <div style={{display:"flex",gap:6,marginBottom:20}}>
              {[{id:"all",l:"Semua"},{id:"income",l:"↑ Masuk"},{id:"expense",l:"↓ Keluar"}].map(f=>(
                <button key={f.id} onClick={()=>setHf(f.id)}
                  className={`filter-btn ${hf===f.id?(f.id==="income"?"filter-inc":f.id==="expense"?"filter-exp":"filter-all"):""}`}>
                  {f.l}
                </button>
              ))}
            </div>

            {filtered.length===0 && <p style={{textAlign:"center",color:"#334155",padding:"40px 0",fontSize:13}}>Tidak ada transaksi</p>}

            {filtered.map((x,i)=>{
              const cat=getCat(x.category), isInc=x.type==="income";
              return (
                <div key={x.id} className="fade-up row-hover" style={{...S.row,borderLeft:`2px solid ${isInc?"#4ADE80":"#F87171"}28`,animationDelay:`${i*.03}s`}}>
                  <div style={{...S.catBubble,background:cat.color+"18",border:`1px solid ${cat.color}28`}}>
                    <span style={{fontSize:17}}>{cat.icon}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={S.rowTitle}>{isInc?x.desc:cat.label}</div>
                    <div style={S.rowSub}>
                      {x.method} · {x.date}
                      {x.tax>0 && <span style={{color:"#CA8A04",marginLeft:5}}>· {x.tax}% pajak</span>}
                    </div>
                    {x.note && <div style={{...S.rowSub,color:"#334155",marginTop:2}}>📝 {x.note}</div>}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
                    <div style={{...S.rowAmt,color:isInc?"#4ADE80":"#F87171"}}>{isInc?"+":"−"}{$f(x.amount)}</div>
                    <div style={{display:"flex",gap:5}}>
                      <button onClick={()=>handleEdit(x)} className="icon-btn">✏</button>
                      <button onClick={()=>handleDelete(x.id,x.type)} className="icon-btn icon-del">✕</button>
                    </div>
                  </div>
                </div>
              );
            })}

            <button onClick={()=>{if(window.confirm("Reset semua data?")){{setExp(DEMO_EXP);setInc(DEMO_INC);showToast("Data direset",false);}}}}
              style={{width:"100%",marginTop:28,padding:"12px",border:"1px solid rgba(239,68,68,0.12)",borderRadius:12,background:"rgba(239,68,68,0.04)",color:"rgba(239,68,68,0.5)",cursor:"pointer",fontFamily:"Sora,sans-serif",fontSize:12,letterSpacing:"0.3px"}}>
              🗑 Reset Semua Data
            </button>
          </div>
        )}

        {/* ══ ANALYTICS ══ */}
        {view==="chart" && (
          <div>
            {/* Mode tabs */}
            <div style={{display:"flex",gap:6,marginBottom:22,background:"rgba(255,255,255,0.025)",padding:4,borderRadius:14}}>
              {[{id:"expense",l:"Pengeluaran",c:"#F87171"},{id:"income",l:"Pemasukan",c:"#4ADE80"},{id:"net",l:"Gabungan",c:"#818CF8"}].map(m=>(
                <button key={m.id} onClick={()=>setPieMode(m.id)}
                  style={{flex:1,padding:"10px 4px",borderRadius:10,border:"none",cursor:"pointer",
                    background:pieMode===m.id?`${m.c}15`:"transparent",
                    color:pieMode===m.id?m.c:"#334155",
                    fontFamily:"Sora,sans-serif",fontWeight:700,fontSize:12,
                    boxShadow:pieMode===m.id?`inset 0 0 0 1px ${m.c}30`:"none",
                    transition:"all .18s"}}>
                  {m.l}
                </button>
              ))}
            </div>

            {/* Pie card */}
            <div style={S.pieCard}>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:10,letterSpacing:"2px",color:"#334155"}}>
                  {pieMode==="expense"?"DISTRIBUSI PENGELUARAN":pieMode==="income"?"DISTRIBUSI PEMASUKAN":"PEMASUKAN VS PENGELUARAN"}
                </div>
              </div>
              <DonutChart slices={pieSlices} size={230}/>
              <div style={{display:"flex",justifyContent:"center",gap:28,marginTop:20,paddingTop:16,borderTop:"1px solid rgba(255,255,255,0.05)"}}>
                {pieMode!=="expense"&&<div style={{textAlign:"center"}}><div style={{color:"#4ADE80",fontSize:9.5,letterSpacing:"1px",marginBottom:5}}>▲ MASUK</div><div style={{color:"#4ADE80",fontFamily:"DM Mono,monospace",fontWeight:700,fontSize:13}}>{$f(tInc)}</div></div>}
                {pieMode!=="income"&&<div style={{textAlign:"center"}}><div style={{color:"#F87171",fontSize:9.5,letterSpacing:"1px",marginBottom:5}}>▼ KELUAR</div><div style={{color:"#F87171",fontFamily:"DM Mono,monospace",fontWeight:700,fontSize:13}}>{$f(tExp)}</div></div>}
                {pieMode==="net"&&<div style={{textAlign:"center"}}><div style={{color:"#94A3B8",fontSize:9.5,letterSpacing:"1px",marginBottom:5}}>⚖ SALDO</div><div style={{color:bal>=0?"#4ADE80":"#F87171",fontFamily:"DM Mono,monospace",fontWeight:700,fontSize:13}}>{$f(Math.abs(bal))}</div></div>}
              </div>
            </div>

            {/* Legend */}
            <div style={{...S.secLabel,marginTop:24}}>DETAIL KATEGORI</div>
            {pieSlices.length===0 && <p style={{textAlign:"center",color:"#334155",padding:30,fontSize:13}}>Belum ada data</p>}
            {pieSlices.map((sl,i)=>{
              const pct = pieTotal>0?Math.round(sl.value/pieTotal*100):0;
              return (
                <div key={i} className="fade-up" style={{...S.row,gap:12,animationDelay:`${i*.04}s`}}>
                  <div style={{width:10,height:10,borderRadius:3,background:sl.color,flexShrink:0,marginTop:4}}/>
                  <span style={{fontSize:18,flexShrink:0}}>{sl.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                      <span style={{color:"#CBD5E1",fontWeight:600,fontSize:13}}>{sl.label}</span>
                      <div>
                        <span style={{color:sl.color,fontFamily:"DM Mono,monospace",fontSize:12,fontWeight:700,marginRight:8}}>{pct}%</span>
                        <span style={{color:"#334155",fontFamily:"DM Mono,monospace",fontSize:11}}>{$f(sl.value)}</span>
                      </div>
                    </div>
                    <div style={{height:4,background:"rgba(255,255,255,0.05)",borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(90deg,${sl.color}88,${sl.color})`,borderRadius:99,transition:"width .6s ease"}}/>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Summary */}
            <div style={{...S.pieCard,marginTop:16,background:"rgba(99,102,241,0.05)",borderColor:"rgba(99,102,241,0.15)"}}>
              <div style={{fontSize:10,letterSpacing:"2px",color:"#334155",marginBottom:14}}>RINGKASAN KEUANGAN</div>
              {[{l:"▲ Total Pemasukan",v:tInc,c:"#4ADE80"},{l:"▼ Total Pengeluaran",v:tExp,c:"#F87171"}].map(r=>(
                <div key={r.l} style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
                  <span style={{color:r.c,fontSize:13}}>{r.l}</span>
                  <span style={{color:r.c,fontFamily:"DM Mono,monospace",fontSize:13,fontWeight:700}}>{$f(r.v)}</span>
                </div>
              ))}
              <div style={{height:1,background:"rgba(255,255,255,0.06)",margin:"8px 0 12px"}}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{color:"#F1F5F9",fontWeight:700,fontSize:15}}>Saldo Bersih</span>
                <span style={{color:bal>=0?"#4ADE80":"#F87171",fontFamily:"DM Mono,monospace",fontSize:18,fontWeight:800}}>
                  {bal>=0?"+":"−"}{$f(Math.abs(bal))}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <div style={S.nav}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>{ setView(n.id); if(n.id!=="add"){setEditRec(null);setForm(blankForm(type));} }}
            className={`nav-btn ${view===n.id?"nav-active":""}`}>
            <span style={{fontSize:n.id==="add"?22:16,lineHeight:1}}>{n.icon}</span>
            <span style={{fontSize:9.5,marginTop:2,letterSpacing:"0.3px"}}>{n.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CSS ─────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:#1E293B;border-radius:4px;}
body{background:#0D1117;}
input,select,textarea{font-family:'Sora',sans-serif;color:#CBD5E1;background:transparent;}
option{background:#111827;}
input[type=number]::-webkit-inner-spin-button{opacity:.25;}
input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.35) brightness(1.2);}

@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes toastIn{from{opacity:0;transform:translateX(50px) scale(.95)}to{opacity:1;transform:translateX(0) scale(1)}}
@keyframes dropIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

.fade-up{animation:fadeUp .28s ease forwards;}
.toast{
  position:fixed;top:18px;right:18px;
  padding:11px 18px;border-radius:12px;border:1px solid;
  font-family:'Sora',sans-serif;font-weight:700;font-size:13px;
  z-index:9999;animation:toastIn .22s ease;
  display:flex;align-items:center;letter-spacing:.2px;
  backdrop-filter:blur(8px);
}

/* Input */
.inp{
  display:block;width:100%;
  background:rgba(255,255,255,0.03);
  border:1px solid rgba(255,255,255,0.08);
  color:#CBD5E1;padding:12px 14px;border-radius:12px;
  font-family:'Sora',sans-serif;font-size:14px;
  transition:border-color .18s,box-shadow .18s;
  margin-bottom:0;
}
.inp:focus{outline:none;border-color:rgba(99,102,241,0.6);box-shadow:0 0 0 3px rgba(99,102,241,0.1);}

/* Row hover */
.row-hover{transition:background .15s;}
.row-hover:hover{background:rgba(255,255,255,0.03)!important;}

/* CTA buttons */
.cta-green,.cta-red{
  flex:1;padding:15px;border:1px solid;border-radius:16px;
  cursor:pointer;font-family:'Sora',sans-serif;font-weight:700;font-size:14px;
  display:flex;align-items:center;justify-content:center;gap:9px;
  transition:all .22s cubic-bezier(.34,1.56,.64,1);
  letter-spacing:.3px;
}
.cta-green{background:rgba(74,222,128,0.07);border-color:rgba(74,222,128,0.2);color:#4ADE80;}
.cta-green:hover{background:rgba(74,222,128,0.15);border-color:rgba(74,222,128,0.35);transform:translateY(-2px);box-shadow:0 8px 28px rgba(74,222,128,0.18);}
.cta-green:active{transform:translateY(0) scale(.98);box-shadow:none;}
.cta-red{background:rgba(248,113,113,0.07);border-color:rgba(248,113,113,0.2);color:#F87171;}
.cta-red:hover{background:rgba(248,113,113,0.15);border-color:rgba(248,113,113,0.35);transform:translateY(-2px);box-shadow:0 8px 28px rgba(248,113,113,0.18);}
.cta-red:active{transform:translateY(0) scale(.98);box-shadow:none;}

/* Header pill */
.pill-btn{
  background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);
  border-radius:20px;padding:8px 16px;color:#818CF8;
  font-size:13px;cursor:pointer;font-family:'Sora',sans-serif;
  transition:all .18s;letter-spacing:.2px;
}
.pill-btn:hover{background:rgba(99,102,241,0.18);border-color:rgba(99,102,241,0.35);transform:scale(1.02);}
.pill-btn:active{transform:scale(.97);}

/* Type toggle */
.type-btn{
  flex:1;padding:11px;border:none;border-radius:11px;cursor:pointer;
  font-family:'Sora',sans-serif;font-weight:700;font-size:13px;
  transition:all .2s;background:transparent;color:#334155;
}
.type-inc{background:rgba(74,222,128,0.15)!important;color:#4ADE80!important;box-shadow:inset 0 0 0 1px rgba(74,222,128,0.25)!important;}
.type-exp{background:rgba(248,113,113,0.15)!important;color:#F87171!important;box-shadow:inset 0 0 0 1px rgba(248,113,113,0.25)!important;}

/* Currency/segment btns */
.seg-btn{flex:1;padding:11px;border-radius:11px;border:1.5px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;cursor:pointer;font-family:'Sora',sans-serif;font-weight:600;font-size:13px;transition:all .18s;}
.seg-active{border-color:#6366F1!important;background:rgba(99,102,241,0.14)!important;color:#A5B4FC!important;box-shadow:0 2px 12px rgba(99,102,241,0.15)!important;}
.seg-btn:hover{border-color:rgba(255,255,255,0.14);color:#64748B;}

/* Tax quick btns */
.tax-btn{padding:8px 14px;border-radius:9px;border:1px solid rgba(255,255,255,0.07);background:rgba(255,255,255,0.03);color:#475569;cursor:pointer;font-family:'DM Mono',monospace;font-size:12px;font-weight:500;transition:all .15s;letter-spacing:.3px;}
.tax-active{border-color:#6366F1!important;background:rgba(99,102,241,0.16)!important;color:#A5B4FC!important;}
.tax-btn:hover{border-color:rgba(99,102,241,0.3);color:#64748B;}

/* Submit btns */
.submit-btn{flex:1;padding:15px;border:none;border-radius:13px;cursor:pointer;font-family:'Sora',sans-serif;font-weight:800;font-size:15px;letter-spacing:.3px;transition:all .22s cubic-bezier(.34,1.56,.64,1);}
.submit-inc{background:linear-gradient(135deg,#34D399,#059669);color:#fff;box-shadow:0 4px 20px rgba(52,211,153,0.3);}
.submit-inc:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(52,211,153,0.4);}
.submit-exp{background:linear-gradient(135deg,#F87171,#DC2626);color:#fff;box-shadow:0 4px 20px rgba(248,113,113,0.3);}
.submit-exp:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(248,113,113,0.4);}
.submit-btn:active{transform:translateY(0) scale(.98);}
.cancel-btn{padding:15px 18px;border:1px solid rgba(255,255,255,0.07);border-radius:13px;cursor:pointer;background:rgba(255,255,255,0.03);color:#334155;font-family:'Sora',sans-serif;font-size:14px;transition:all .18s;}
.cancel-btn:hover{border-color:rgba(255,255,255,0.14);color:#475569;}

/* Filter btns */
.filter-btn{padding:8px 16px;border-radius:20px;border:1px solid rgba(255,255,255,0.07);background:transparent;color:#475569;cursor:pointer;font-family:'Sora',sans-serif;font-weight:600;font-size:12px;transition:all .15s;letter-spacing:.2px;}
.filter-all{border-color:rgba(99,102,241,0.35)!important;background:rgba(99,102,241,0.1)!important;color:#A5B4FC!important;}
.filter-inc{border-color:rgba(74,222,128,0.35)!important;background:rgba(74,222,128,0.1)!important;color:#4ADE80!important;}
.filter-exp{border-color:rgba(248,113,113,0.35)!important;background:rgba(248,113,113,0.1)!important;color:#F87171!important;}
.filter-btn:hover{border-color:rgba(255,255,255,0.15);color:#64748B;}

/* Icon btns */
.icon-btn{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:6px 9px;cursor:pointer;color:#475569;font-size:12px;transition:all .15s;}
.icon-btn:hover{background:rgba(255,255,255,0.08);color:#94A3B8;}
.icon-del{background:rgba(239,68,68,0.07)!important;border-color:rgba(239,68,68,0.18)!important;color:#F87171!important;}
.icon-del:hover{background:rgba(239,68,68,0.16)!important;}

/* Currency options */
.cur-opt{background:transparent;cursor:pointer;transition:all .18s;font-family:'Sora',sans-serif;}
.cur-opt:hover{filter:brightness(1.12);}

/* Nav */
.nav-btn{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px 4px;border-radius:12px;border:none;background:transparent;color:#334155;cursor:pointer;font-family:'Sora',sans-serif;transition:all .18s;}
.nav-btn:hover{background:rgba(255,255,255,0.05);color:#475569;}
.nav-btn:active{transform:scale(.92);}
.nav-active{background:rgba(99,102,241,0.1)!important;color:#818CF8!important;}

/* Cat chip */
.cat-chip-hover:hover{opacity:.85;}
`;

// ── STYLES ───────────────────────────────────────────────────────────
const S = {
  app:       {fontFamily:"Sora,sans-serif",background:"#0D1117",minHeight:"100vh",color:"#CBD5E1",maxWidth:480,margin:"0 auto",paddingBottom:76,position:"relative"},
  header:    {padding:"16px 18px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid rgba(255,255,255,0.05)",background:"rgba(13,17,23,0.97)",position:"sticky",top:0,zIndex:50,backdropFilter:"blur(16px)"},
  logoMark:  {width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#6366F1,#4F46E5)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff",letterSpacing:"0.5px",flexShrink:0},
  logo:      {fontSize:14,fontWeight:800,color:"#F1F5F9",letterSpacing:"3px",lineHeight:1},
  logoSub:   {fontSize:9.5,color:"#22C55E",marginTop:3,letterSpacing:"0.5px"},
  content:   {padding:"18px 16px 16px"},

  balCard:   {background:"linear-gradient(160deg,#111827 60%,#0D1117)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:22,padding:"22px 20px",marginBottom:12},
  balEyebrow:{fontSize:9.5,letterSpacing:"2.5px",color:"#1E293B",marginBottom:10},
  balAmt:    {fontFamily:"DM Mono,monospace",fontSize:30,fontWeight:700,letterSpacing:"-1.5px",marginBottom:12,lineHeight:1},
  balTag:    {display:"inline-flex",alignItems:"center",padding:"5px 13px",borderRadius:20,border:"1px solid",fontSize:11,fontWeight:600,letterSpacing:"0.2px",marginBottom:18},
  balDivider:{height:1,background:"rgba(255,255,255,0.05)",marginBottom:16},
  balRow:    {display:"flex",gap:20},
  balCol:    {flex:1,display:"flex",flexDirection:"column",gap:4},
  balColLabel:{fontSize:9.5,color:"#1E293B",letterSpacing:"1px"},
  balColAmt: {fontFamily:"DM Mono,monospace",fontSize:15,fontWeight:700,letterSpacing:"-0.5px"},
  balColSub: {fontSize:10,color:"#1E293B"},

  secLabel:  {fontSize:9.5,letterSpacing:"2px",color:"#1E293B",marginBottom:12},
  row:       {display:"flex",alignItems:"center",gap:11,padding:"13px 14px",borderRadius:14,marginBottom:7,background:"rgba(255,255,255,0.018)",border:"1px solid rgba(255,255,255,0.045)"},
  catBubble: {width:40,height:40,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},
  rowTitle:  {fontSize:13,fontWeight:600,color:"#E2E8F0",marginBottom:2},
  rowSub:    {fontSize:11,color:"#334155"},
  rowAmt:    {fontFamily:"DM Mono,monospace",fontWeight:700,fontSize:13,whiteSpace:"nowrap"},

  typeToggleWrap:{display:"flex",gap:6,marginBottom:14,background:"rgba(255,255,255,0.035)",padding:4,borderRadius:16},
  formCard:  {background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:"20px 18px"},
  lbl:       {display:"block",fontSize:9.5,color:"#1E293B",letterSpacing:"2px",marginBottom:9,marginTop:18},
  catGrid:   {display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7},
  catChip:   {display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"11px 4px",borderRadius:12,cursor:"pointer",border:"1.5px solid transparent",transition:"all .18s"},
  hint:      {fontSize:11,color:"#6366F1",marginTop:5,paddingLeft:2},
  taxPreview:{background:"rgba(251,191,36,0.05)",border:"1px solid rgba(251,191,36,0.12)",borderRadius:13,padding:"13px 15px",marginTop:10},
  taxRow:    {display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13,alignItems:"center"},
  ctaIcon:   {fontSize:18,fontWeight:800,lineHeight:1},

  nav:       {position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(9,13,19,0.97)",borderTop:"1px solid rgba(255,255,255,0.045)",display:"flex",padding:"8px 14px 12px",gap:4,backdropFilter:"blur(20px)",zIndex:100},

  overlay:   {position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  sheet:     {background:"#111827",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"24px 24px 0 0",padding:"16px 20px 36px",width:"100%",maxWidth:480,animation:"dropIn .28s cubic-bezier(.34,1.56,.64,1)"},
  sheetHandle:{width:40,height:4,borderRadius:2,background:"rgba(255,255,255,0.1)",margin:"0 auto 20px"},
  sheetTitle:{fontSize:14,fontWeight:700,color:"#F1F5F9",marginBottom:16,letterSpacing:".3px"},
  curOpt:    {width:"100%",display:"flex",alignItems:"center",gap:14,padding:"14px",borderRadius:14,cursor:"pointer",border:"1px solid",marginBottom:8,fontFamily:"Sora,sans-serif",transition:"all .18s"},
  rateNote:  {textAlign:"center",fontSize:11,color:"#1E293B",marginTop:4},

  pieCard:   {background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,padding:"20px 18px"},
};
