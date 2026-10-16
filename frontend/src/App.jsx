import {useCallback,useEffect,useMemo,useState} from 'react'
import {Activity,AlertTriangle,ArrowUpRight,CheckCircle2,Clock3,CreditCard,RefreshCw,Search,Server,ShieldCheck,Zap,X} from 'lucide-react'
import './App.css'

const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(n||0))
const date = d => d ? new Date(d).toLocaleString() : '—'

export default function App(){
 const [services,setServices]=useState([]),[traces,setTraces]=useState([]),[incidents,setIncidents]=useState([])
 const [selected,setSelected]=useState(null),[amount,setAmount]=useState('500'),[fail,setFail]=useState(false)
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('')
 const [updated,setUpdated]=useState(null),[tab,setTab]=useState('Overview'),[search,setSearch]=useState('')

 const refresh=useCallback(async()=>{
  try{
   const rs=await Promise.all([fetch('/api/v1/services/status'),fetch('/api/v1/traces'),fetch('/api/v1/incidents')])
   if(rs.some(r=>!r.ok)) throw new Error('API error. Check that all backend services are running.')
   const [s,t,i]=await Promise.all(rs.map(r=>r.json()))
   setServices(s.services||[]);setTraces(t.traces||[]);setIncidents(i.incidents||[])
   setUpdated(new Date());setError('')
  }catch(e){setError(e.message||'Cannot connect to the backend.')}
 },[])
 useEffect(()=>{refresh();const id=setInterval(refresh,5000);return()=>clearInterval(id)},[refresh])

 async function runCheckout(e){
  e.preventDefault();if(!Number.isFinite(Number(amount))||Number(amount)<=0){setMessage('Enter an amount greater than zero.');return}
  setBusy(true);setMessage('')
  try{
   const r=await fetch('/api/v1/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({amount:Number(amount),simulate_payment_failure:fail})})
   const data=await r.json();if(!r.ok)throw new Error(data.detail||'Checkout request failed.')
   setMessage(data.message);setSelected(data.trace);await refresh()
  }catch(err){setMessage(err.message)}finally{setBusy(false)}
 }
 async function openTrace(id){
  try{const r=await fetch(`/api/v1/traces/${encodeURIComponent(id)}`);if(!r.ok)throw new Error('Trace not found');setSelected(await r.json());setTab('Traces')}
  catch(e){setError(e.message)}
 }
 const successful=traces.filter(t=>t.status==='success').length
 const avg=traces.length?traces.reduce((n,t)=>n+Number(t.total_duration_ms||0),0)/traces.length:0
 const slow=useMemo(()=>[...traces].sort((a,b)=>b.total_duration_ms-a.total_duration_ms).slice(0,5),[traces])
 const filtered=traces.filter(t=>`${t.trace_id} ${t.status}`.toLowerCase().includes(search.toLowerCase()))
 const nav=['Overview','Traces','Incidents']
 return <div className="shell">
  <aside className="sidebar"><div className="brand"><div className="logo"><Activity/></div><div><b>PulseMesh</b><small>OBSERVABILITY</small></div></div>
   <div className="side-label">WORKSPACE</div><div className="workspace"><span>P</span><div><b>PulseMesh Demo</b><small>Local environment</small></div></div>
   <div className="side-label">MONITOR</div>{nav.map(n=><button key={n} className={`nav ${tab===n?'active':''}`} onClick={()=>setTab(n)}>{n==='Overview'?<Activity size={17}/>:n==='Traces'?<Clock3 size={17}/>:<AlertTriangle size={17}/>} {n}{n==='Incidents'&&incidents.length>0&&<em>{incidents.length}</em>}</button>)}
   <div className="side-bottom"><span className="green-dot"/> All systems monitored<small>PulseMesh v1.0.0 · Demo</small></div>
  </aside>
  <main><header><div>Workspace <span>/</span> <b>{tab}</b></div><div className="top-right"><label><i/> LOCAL</label><button className="refresh" onClick={refresh} title="Refresh"><RefreshCw size={16}/></button><span className="avatar">PM</span></div></header>
   <div className="page"><div className="heading"><div><small className="eyebrow">SYSTEM OVERVIEW</small><h1>{tab==='Overview'?'Observability Dashboard':tab}</h1><p>Monitor services, follow request traces, and investigate incidents.</p></div><span className="updated"><i/> Live refresh · {updated?updated.toLocaleTimeString():'Connecting...'}</span></div>
   {error&&<div className="error"><AlertTriangle size={16}/>{error}</div>}
   {tab==='Overview'&&<>
    <section className="metrics">
     <Metric label="Services healthy" value={`${services.filter(s=>s.status==='healthy').length}/${services.length||3}`} note="Current service status" icon={<Server/>}/>
     <Metric label="Total requests" value={traces.length} note="Recorded checkout traces" icon={<Activity/>}/>
     <Metric label="Success rate" value={`${traces.length?(successful/traces.length*100).toFixed(1):'0.0'}%`} note={`${successful} successful requests`} icon={<CheckCircle2/>}/>
     <Metric label="Average latency" value={`${avg.toFixed(1)} ms`} note="Across recorded traces" icon={<Clock3/>}/>
    </section>
    <section className="panel"><PanelTitle title="Service health" sub="Availability of connected PulseMesh services"/><div className="services">{services.map(s=><div className="service" key={s.name}><div className="service-top"><Server size={18}/><Status value={s.status}/></div><b>{s.name}</b><small>{s.status==='healthy'?'Responding normally':'Unable to reach service'}</small><div className="latency">Response time <b>{s.response_time_ms==null?'—':`${s.response_time_ms} ms`}</b></div></div>)}{!services.length&&<p className="empty">Waiting for service status…</p>}</div></section>
    <div className="columns"><section className="panel"><PanelTitle title="Checkout simulator" sub="Generate a sample distributed request"/><form onSubmit={runCheckout} className="form"><label htmlFor="amount">Transaction amount</label><div className="amount"><span>₹</span><input id="amount" type="number" min="1" max="1000000" step=".01" value={amount} onChange={e=>setAmount(e.target.value)}/></div><label className="check"><input type="checkbox" checked={fail} onChange={e=>setFail(e.target.checked)}/> Simulate payment failure</label><button className="primary" disabled={busy}>{busy?<RefreshCw className="spin" size={16}/>:<Zap size={16}/>} {busy?'Running…':'Run checkout'}</button>{message&&<p className="message">{message}</p>}</form><div className="note"><ShieldCheck size={14}/> Demo only. No real payment is collected.</div></section>
    <section className="panel"><PanelTitle title="Incident overview" sub="Automatically recorded service issues"/><div className="incident-count">{incidents.length}<small> recorded incidents</small></div>{incidents.slice(0,3).map(i=><IncidentMini key={i.incident_id} item={i}/>)}{!incidents.length&&<p className="empty left">No incidents recorded.</p>}<button className="link" onClick={()=>setTab('Incidents')}>View all incidents <ArrowUpRight size={14}/></button></section></div>
    <section className="panel"><PanelTitle title="Slowest checkout traces" sub="Requests with the highest end-to-end duration"/><TraceTable traces={slow} open={openTrace}/></section>
   </>}
   {tab==='Traces'&&<section className="panel"><div className="panel-head"><PanelTitle title="Request traces" sub="Inspect the path and timing of each checkout request"/><div className="search"><Search size={15}/><input placeholder="Search trace ID or status" value={search} onChange={e=>setSearch(e.target.value)}/></div></div><TraceTable traces={filtered} open={openTrace}/>{selected&&<TraceDetails trace={selected} close={()=>setSelected(null)}/>}</section>}
   {tab==='Incidents'&&<section className="panel"><PanelTitle title="Incident timeline" sub="Issues detected during demo checkout requests"/>{incidents.length?incidents.map(i=><div className="incident-row" key={i.incident_id}><div className={`incident-symbol ${i.severity}`}><AlertTriangle size={17}/></div><div className="incident-info"><b>{i.incident_type.replaceAll('_',' ')} <span className={i.severity}>{i.severity}</span></b><p>{i.description}</p><small>{i.service_name} · {date(i.created_at)}</small></div><Status value={i.status}/></div>):<div className="empty large"><CheckCircle2 size={28}/><b>No incidents yet</b><span>Simulated service failures will appear here.</span></div>}</section>}
   <footer>© 2026 PulseMesh <span><i/> Operational demo environment</span></footer>
   </div>
  </main>
 </div>
}
function Metric({label,value,note,icon}){return <div className="metric"><div>{label}<span>{icon}</span></div><strong>{value}</strong><small>{note}</small></div>}
function PanelTitle({title,sub}){return <div className="panel-title"><div><h2>{title}</h2><p>{sub}</p></div></div>}
function Status({value}){return <span className={`status ${value}`}>{value}</span>}
function IncidentMini({item}){return <div className="incident-mini"><i className={item.severity}/><div><b>{item.service_name}</b><small>{item.description}</small></div><time>{date(item.created_at)}</time></div>}
function TraceTable({traces,open}){return !traces.length?<div className="empty">No traces yet. Run a checkout to create your first trace.</div>:<div className="table-wrap"><table><thead><tr><th>TRACE ID</th><th>STATUS</th><th>AMOUNT</th><th>DURATION</th><th>CREATED</th><th/></tr></thead><tbody>{traces.map(t=><tr key={t.trace_id}><td><button className="trace-link" onClick={()=>open(t.trace_id)}>{t.trace_id.slice(0,8)}…</button></td><td><Status value={t.status}/></td><td>{money(t.amount)}</td><td>{Number(t.total_duration_ms).toFixed(2)} ms</td><td>{date(t.created_at)}</td><td><button className="link" onClick={()=>open(t.trace_id)}>View <ArrowUpRight size={13}/></button></td></tr>)}</tbody></table></div>}
function TraceDetails({trace,close}){return <div className="details"><div className="detail-head"><div><b>Trace explorer</b><small>{trace.trace_id}</small></div><button onClick={close}><X size={17}/></button></div><div className="trace-meta"><Status value={trace.status}/><b>{money(trace.amount)}</b><span>{Number(trace.total_duration_ms).toFixed(2)} ms total</span><span>{date(trace.created_at)}</span></div>{(trace.events||[]).map((e,i)=><div className="event" key={i}><i className={e.status}/><div><b>{e.name}</b><small>{e.service}</small><p>{e.message}</p></div><strong>{Number(e.duration_ms).toFixed(2)} ms</strong></div>)}</div>}
