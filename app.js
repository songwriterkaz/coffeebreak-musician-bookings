'use strict';
/* Coffeebreak Bookings engine (shared by School Bookings and Musician Bookings). © Karen (Coffeebreak). */
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
const W=CFG.words;
const pad=n=>String(n).padStart(2,'0');
const ds=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ds(d)};
const toMin=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
const fromMin=m=>pad(Math.floor(m/60))+':'+pad(m%60);
const uid=()=>Math.random().toString(36).slice(2,9);
const ref=()=>CFG.refPrefix+Math.random().toString(36).slice(2,7).toUpperCase();
const today=()=>ds(new Date());
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const fmtD=s=>parseD(s).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'});
const fmtT=t=>{const[h,m]=t.split(':').map(Number);return (h%12||12)+':'+pad(m)+(h<12?'am':'pm')};
const money=n=>'$'+(+n).toFixed(2);
const normPhone=p=>String(p||'').replace(/\D/g,'');
const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function toast(t){const e=$('#toast');e.textContent=t;e.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>e.style.display='none',3200)}
function download(name,text,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:type||'text/plain'}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),500)}
function copyText(t){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(t).then(()=>toast('Copied'),()=>fallbackCopy(t))}else fallbackCopy(t)}
function fallbackCopy(t){const x=document.createElement('textarea');x.value=t;document.body.appendChild(x);x.select();try{document.execCommand('copy');toast('Copied')}catch(e){toast('Copy failed')}x.remove()}
function twoStep(btn,label,fn){if(btn.dataset.armed){fn();return}btn.dataset.armed=1;const o=btn.textContent;btn.textContent=label;setTimeout(()=>{if(btn.isConnected){btn.textContent=o;delete btn.dataset.armed}},3000)}

let S;try{S=JSON.parse(localStorage.getItem(CFG.key))}catch(e){}
if(!S||!S.venues)S=CFG.sample();
function save(){try{localStorage.setItem(CFG.key,JSON.stringify(S))}catch(e){toast('Could not save (storage full?)')}$('#sampleBanner').classList.toggle('hide',!S.sample)}
const venue=id=>S.venues.find(v=>v.id===id);
const personOf=(v,id)=>v&&v.people.find(p=>p.id===id);
const typeOf=(v,id)=>v.types.find(t=>t.id===id)||v.types[0];
const canDo=(p,t)=>!t.roles||!p.role||t.roles.includes(p.role);
function venueOpts(sel,val){sel.innerHTML=S.venues.map(v=>'<option value="'+v.id+'">'+esc(v.name)+'</option>').join('');if(val&&venue(val))sel.value=val}

/* scheduling */
function busy(pid,date,start,mins,ignore){return S.appts.some(a=>a.personId===pid&&a.date===date&&a.status!=='cancelled'&&a.id!==ignore&&toMin(a.time)<start+mins&&start<toMin(a.time)+a.mins)}
function slotsFor(v,p,t,date,ignore){const h=p.hours[parseD(date).getDay()];if(!h||!canDo(p,t))return[];const out=[];const step=t.step||15;const st=toMin(h[0]),en=toMin(h[1]);
 const lim=date===today()?nowMin()+30:-1;for(let m=st;m+t.mins<=en;m+=step){if(m<lim)continue;if(!busy(p.id,date,m,t.mins,ignore))out.push({date,time:fromMin(m),personId:p.id})}return out}
function nextAvail(v,pid,tid,from,ignore){const t=typeOf(v,tid);for(let i=0;i<60;i++){const d=addDays(from||today(),i);const ps=pid==='any'?v.people:[personOf(v,pid)];let best=null;
  ps.forEach(p=>{const s=slotsFor(v,p,t,d,ignore)[0];if(s&&(!best||s.time<best.time))best=s});if(best)return best}return null}
function book(o){const v=venue(o.venueId),t=typeOf(v,o.typeId);const a={id:uid(),ref:ref(),venueId:v.id,personId:o.personId,typeId:t.id,mins:t.mins,price:+t.price||0,date:o.date,time:o.time,client:o.client,extra:o.extra||{},note:o.note||'',status:'booked',paid:false,created:Date.now()};S.appts.push(a);save();return a}
function cancelAppt(a){a.status='cancelled';a.cancelledAt=Date.now();const f=fillFromWaitlist(a);save();return f}
function fillFromWaitlist(fr){if(fr.date<today())return null;const w=S.waitlist.find(x=>x.status==='waiting'&&x.venueId===fr.venueId&&x.typeId===fr.typeId&&(x.personId==='any'||x.personId===fr.personId)&&x.from<=fr.date&&x.to>=fr.date);
 if(!w)return null;const a=book({venueId:fr.venueId,personId:fr.personId,typeId:fr.typeId,date:fr.date,time:fr.time,client:{name:w.name,phone:w.phone,email:w.email}});a.fromWaitlist=true;w.status='booked';w.apptRef=a.ref;return a}
function apptLine(a){const v=venue(a.venueId),p=personOf(v,a.personId),t=typeOf(v,a.typeId);return t.name+' with '+(p?p.name:W.person)+' on '+fmtD(a.date)+' at '+fmtT(a.time)+(v?', '+v.name:'')}
function payText(a){const v=venue(a.venueId);return 'Pay '+money(a.price)+' by PayID to '+(v.payid||'the '+W.venue+"'s PayID")+' using reference '+a.ref+'. No card details are taken in this app.'}
function msgText(a,kind){const v=venue(a.venueId);const L=apptLine(a);const pay=a.price>0?' '+payText(a):'';
 return {confirm:'Hi '+a.client.name+', your booking is confirmed: '+L+'. Ref '+a.ref+'.'+pay+' To change it, contact '+v.name+' on '+v.phone+'.',
  remind:'Reminder: '+L+'. Ref '+a.ref+'. Reply or call '+v.phone+' if you can no longer make it.',
  cancel:'Your booking '+a.ref+' ('+L+') has been cancelled. Book again any time.'}[kind]}
function msgHTML(a,kind){const m=msgText(a,kind);const ph=normPhone(a.client.phone);const em=a.client.email||'';
 return '<div class="msgbox">'+esc(m)+'<div class="quick">'+(ph?'<a href="sms:'+ph+'?&body='+encodeURIComponent(m)+'"><button class="sm" type="button">Open in SMS</button></a>':'')+(em?'<a href="mailto:'+esc(em)+'?subject='+encodeURIComponent('Booking '+a.ref)+'&body='+encodeURIComponent(m)+'"><button class="sm" type="button">Open in email</button></a>':'')+'<button class="sm ghost" type="button" data-cfcopy="'+esc(m)+'">Copy</button></div></div>'}
function ics(a){const v=venue(a.venueId);const st=a.date.replace(/-/g,'')+'T'+a.time.replace(':','')+'00';const e=fromMin(toMin(a.time)+a.mins);const en=a.date.replace(/-/g,'')+'T'+e.replace(':','')+'00';
 return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Coffeebreak//'+CFG.title+'//EN','BEGIN:VEVENT','UID:'+a.id+'@coffeebreak','DTSTAMP:'+st,'DTSTART:'+st,'DTEND:'+en,'SUMMARY:'+typeOf(v,a.typeId).name+' ('+a.ref+')','LOCATION:'+(v.address||v.name),'DESCRIPTION:'+apptLine(a),'BEGIN:VALARM','TRIGGER:-PT24H','ACTION:DISPLAY','DESCRIPTION:Reminder','END:VALARM','BEGIN:VALARM','TRIGGER:-PT2H','ACTION:DISPLAY','DESCRIPTION:Reminder','END:VALARM','END:VEVENT','END:VCALENDAR'].join('\r\n')}
let apptCard=function(a){const ex=CFG.extraFields.filter(f=>a.extra&&a.extra[f.id]).map(f=>esc(f.label)+': '+esc(a.extra[f.id])).join(' · ');
 return '<div class="card" data-appt="'+a.id+'"><b>'+esc(apptLine(a))+'</b><div class="muted">Ref '+a.ref+' · '+esc(a.client.name)+(ex?' · '+ex:'')+' · <span class="st-'+a.status+'">'+a.status+'</span>'+(a.price>0?' · <span class="pill">'+money(a.price)+(a.paid?' paid':' unpaid')+'</span>':' · <span class="pill">Free</span>')+(a.fromWaitlist?' · <span class="pill">From waitlist</span>':'')+'</div>'+
 (a.price>0&&a.status!=='cancelled'?'<div class="msgbox"><b>Pay by PayID:</b> '+esc(payText(a))+'</div>':'')+
 '<div class="quick">'+(a.status==='booked'?'<button class="sm" type="button" data-act="ics">Add to calendar (.ics)</button><button class="sm ghost" type="button" data-act="resched">Reschedule</button><button class="sm bad" type="button" data-act="cancel">Cancel</button>':'')+'<button class="sm ghost" type="button" data-act="msgs">Messages</button></div><div class="mbox"></div></div>'};
function wireApptCards(root,after){root.querySelectorAll('[data-appt]').forEach(el=>{const a=S.appts.find(x=>x.id===el.dataset.appt);if(!a)return;el.querySelectorAll('[data-act]').forEach(b=>b.onclick=()=>{const k=b.dataset.act;
 if(k==='ics')download('booking-'+a.ref+'.ics',ics(a),'text/calendar');
 if(k==='msgs')el.querySelector('.mbox').innerHTML=msgHTML(a,a.status==='cancelled'?'cancel':'confirm')+msgHTML(a,'remind');
 if(k==='cancel')twoStep(b,'Tap again to cancel',()=>{const f=cancelAppt(a);toast('Cancelled '+a.ref+(f?'; someone from the waitlist was booked into the time':''));after&&after()});
 if(k==='resched'){show('find');openBook(a.venueId,{resched:a.id})}})})}

/* navigation */
const RENDER={};
function show(p){$$('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.p===p));$$('.pane').forEach(x=>x.classList.toggle('on',x.id===p));const f=RENDER[p];if(f)f();window.scrollTo(0,0)}
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.p));

/* find & book */
function allTypes(){const m=new Map();S.venues.forEach(v=>v.types.forEach(t=>m.set(t.name,t.name)));return [...m.keys()]}
function renderVenues(){const ft=$('#ftype');const cur=ft.value;ft.innerHTML='<option value="">Any booking type</option>'+allTypes().map(n=>'<option>'+esc(n)+'</option>').join('');ft.value=cur||'';
 const q=$('#fq').value.trim().toLowerCase(),tn=ft.value;
 const L=S.venues.filter(v=>(!q||(v.name+' '+v.suburb+' '+v.people.map(p=>p.name).join(' ')).toLowerCase().includes(q))&&(!tn||v.types.some(t=>t.name===tn)));
 $('#venueList').innerHTML=L.length?L.map(v=>{const t=tn?v.types.find(x=>x.name===tn):v.types[0];const n=nextAvail(v,'any',t.id);
  return '<div class="card"><h3>'+esc(v.name)+'</h3><div class="muted">'+esc(v.suburb)+' · '+esc(v.address||'')+' · '+esc(v.phone||'')+'</div><div>'+v.types.map(t=>'<span class="pill">'+esc(t.name)+' · '+t.mins+' min · '+(t.price>0?money(t.price):'free')+'</span>').join('')+'</div>'+
  '<div class="muted">'+esc(W.peopleCap)+': '+v.people.map(p=>esc(p.name)).join(', ')+'</div><p>Next available '+esc(t.name.toLowerCase())+': <b>'+(n?fmtD(n.date)+' '+fmtT(n.time):'none in the next 60 days')+'</b></p><button type="button" data-book="'+v.id+'"'+(tn?' data-type="'+t.id+'"':'')+'>Book at '+esc(v.name)+'</button></div>'}).join(''):'<p class="muted">No '+W.venues+' match your search.</p>';
 $$('#venueList [data-book]').forEach(b=>b.onclick=()=>openBook(b.dataset.book,{typeId:b.dataset.type}))}
let B={};
function openBook(vid,opt){opt=opt||{};const v=venue(vid);const ra=opt.resched?S.appts.find(a=>a.id===opt.resched):null;
 B={venueId:vid,personId:ra?ra.personId:'any',typeId:ra?ra.typeId:(opt.typeId||v.types[0].id),day:today(),pick:null,resched:ra?ra.id:null};
 $('#bookCard').classList.remove('hide');$('#bookTitle').textContent=(ra?'Reschedule '+ra.ref+' at ':'Book at ')+v.name;
 $('#btype').innerHTML=v.types.map(t=>'<option value="'+t.id+'">'+esc(t.name)+' ('+t.mins+' min, '+(t.price>0?money(t.price):'free')+')</option>').join('');$('#btype').value=B.typeId;
 fillPersons();$('#bookForm').classList.add('hide');$('#bookDone').innerHTML='';
 const n=nextAvail(v,B.personId,B.typeId,today(),B.resched);if(n)B.day=n.date;renderAvail();$('#bookCard').scrollIntoView({behavior:'smooth',block:'start'})}
function fillPersons(){const v=venue(B.venueId),t=typeOf(v,B.typeId);const ps=v.people.filter(p=>canDo(p,t));if(B.personId!=='any'&&!ps.some(p=>p.id===B.personId))B.personId='any';
 $('#bperson').innerHTML='<option value="any">Any '+esc(W.person)+'</option>'+ps.map(p=>'<option value="'+p.id+'">'+esc(p.name)+(p.role?' ('+esc(p.role)+')':'')+'</option>').join('');$('#bperson').value=B.personId}
function renderAvail(){const v=venue(B.venueId),t=typeOf(v,B.typeId);const ps=(B.personId==='any'?v.people:[personOf(v,B.personId)]).filter(p=>canDo(p,t));
 $('#feeBox').innerHTML='<b>'+esc(t.name)+'</b>: '+t.mins+' minutes · '+(t.price>0?money(t.price)+' AUD, paid to '+esc(v.name)+' by PayID ('+esc(v.payid||'set in Setup')+')':'free')+(t.info?'<br>'+esc(t.info):'');
 let h='';for(let i=0;i<14;i++){const d=addDays(today(),i);const n=ps.reduce((s,p)=>s+slotsFor(v,p,t,d,B.resched).length,0);h+='<div class="day'+(d===B.day?' on':'')+(n?'':' none')+'" data-day="'+d+'">'+DAYS[parseD(d).getDay()]+'<b>'+parseD(d).getDate()+'</b><small>'+(n?n+' free':'full')+'</small></div>'}
 $('#days').innerHTML=h;$$('#days .day').forEach(e=>e.onclick=()=>{B.day=e.dataset.day;B.pick=null;$('#bookForm').classList.add('hide');renderAvail()});
 $('#slotArea').innerHTML=ps.map(p=>{const s=slotsFor(v,p,t,B.day,B.resched);return '<div class="doc"><b>'+esc(p.name)+'</b>'+(p.role?' <span class="muted">'+esc(p.role)+'</span>':'')+'<div class="slots">'+(s.length?s.map(x=>'<button type="button" class="slot'+(B.pick&&B.pick.personId===p.id&&B.pick.time===x.time&&B.pick.date===x.date?' on':'')+'" data-p="'+p.id+'" data-t="'+x.time+'">'+fmtT(x.time)+'</button>').join(''):'<span class="muted">No free times this day</span>')+'</div></div>'}).join('');
 $$('#slotArea .slot').forEach(b=>b.onclick=()=>pickSlot({date:B.day,time:b.dataset.t,personId:b.dataset.p}))}
function pickSlot(p){B.pick=p;B.day=p.date;renderAvail();const v=venue(B.venueId);$('#chosen').textContent=fmtD(p.date)+' '+fmtT(p.time)+' with '+personOf(v,p.personId).name;
 const ra=B.resched&&S.appts.find(a=>a.id===B.resched);if(ra){$('#pname').value=ra.client.name;$('#pphone').value=ra.client.phone;$('#pemail').value=ra.client.email||''}
 $('#bookForm').classList.remove('hide');$('#bookForm').scrollIntoView({behavior:'smooth',block:'center'})}
$('#btype').onchange=()=>{B.typeId=$('#btype').value;fillPersons();B.pick=null;$('#bookForm').classList.add('hide');renderAvail()};
$('#bperson').onchange=()=>{B.personId=$('#bperson').value;B.pick=null;$('#bookForm').classList.add('hide');renderAvail()};
$('#nextBtn').onclick=()=>{const n=nextAvail(venue(B.venueId),B.personId,B.typeId,today(),B.resched);if(!n){toast('No free times in the next 60 days');return}pickSlot(n)};
$('#cancelPick').onclick=()=>{B.pick=null;$('#bookForm').classList.add('hide');renderAvail()};
$('#confirmBook').onclick=()=>{if(!B.pick){toast('Pick a time first');return}const name=$('#pname').value.trim(),phone=$('#pphone').value.trim();
 if(!name||normPhone(phone).length<8){toast('Please enter your name and mobile');return}
 const extra={};for(const f of CFG.extraFields){extra[f.id]=$('#x_'+f.id).value.trim();if(f.req&&!extra[f.id]){toast('Please fill in '+f.label);return}}
 if(!$('#pconsent').checked){toast('Please tick the reminders and privacy box');return}
 const v=venue(B.venueId),t=typeOf(v,B.typeId);if(busy(B.pick.personId,B.pick.date,toMin(B.pick.time),t.mins,B.resched)){toast('Sorry, that time was just taken');renderAvail();return}
 let a,msg='Booked instantly ✓';
 if(B.resched){a=S.appts.find(x=>x.id===B.resched);const old={...a};Object.assign(a,{personId:B.pick.personId,date:B.pick.date,time:B.pick.time,typeId:t.id,mins:t.mins,price:+t.price||0});a.client={name,phone,email:$('#pemail').value.trim()};save();fillFromWaitlist(old);save();msg='Rescheduled ✓'}
 else a=book({venueId:v.id,personId:B.pick.personId,typeId:t.id,date:B.pick.date,time:B.pick.time,client:{name,phone,email:$('#pemail').value.trim()},extra,note:$('#pnote').value.trim()});
 $('#bookForm').classList.add('hide');B.pick=null;B.resched=null;renderAvail();
 $('#bookDone').innerHTML='<div class="card" style="border:2px solid var(--ok)"><h3>'+msg+'</h3>'+apptCard(a)+'</div>';wireApptCards($('#bookDone'));toast(msg+' Ref '+a.ref)};
$('#fq').oninput=renderVenues;$('#ftype').onchange=renderVenues;
RENDER.find=renderVenues;

/* my bookings */
function renderMine(){const q=$('#mq').value.trim().toLowerCase();if(!q){$('#mres').innerHTML='<p class="muted">Enter the mobile or email you booked with.</p>';return}
 const qp=normPhone(q);const L=S.appts.filter(a=>(qp.length>=8&&normPhone(a.client.phone)===qp)||(a.client.email&&a.client.email.toLowerCase()===q)||a.ref.toLowerCase()===q).sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time));
 $('#mres').innerHTML=L.length?L.map(apptCard).join(''):'<p class="muted">No bookings found.</p>';wireApptCards($('#mres'),renderMine)}
$('#mfind').onclick=renderMine;RENDER.mine=renderMine;

/* waitlist */
function wFill(){const v=venue($('#wvenue').value)||S.venues[0];if(!v)return;const pv=$('#wperson').value,tv=$('#wtype').value;
 $('#wperson').innerHTML='<option value="any">Any '+esc(W.person)+'</option>'+v.people.map(p=>'<option value="'+p.id+'">'+esc(p.name)+'</option>').join('');if(pv)$('#wperson').value=pv;if(!$('#wperson').value)$('#wperson').value='any';
 $('#wtype').innerHTML=v.types.map(t=>'<option value="'+t.id+'">'+esc(t.name)+'</option>').join('');if(tv&&v.types.some(t=>t.id===tv))$('#wtype').value=tv}
function renderWait(){venueOpts($('#wvenue'),$('#wvenue').value);wFill();if(!$('#wfrom').value){$('#wfrom').value=today();$('#wto').value=addDays(today(),14)}
 const L=S.waitlist.slice().reverse();$('#wlist').innerHTML=L.length?'<table><tr><th>Name</th><th>'+esc(W.venueCap)+'</th><th>Type</th><th>Dates</th><th>Status</th><th></th></tr>'+L.map(w=>{const v=venue(w.venueId);return '<tr data-w="'+w.id+'"><td>'+esc(w.name)+'<div class="muted">'+esc(w.phone)+'</div></td><td>'+esc(v?v.name:'')+'</td><td>'+esc(v?typeOf(v,w.typeId).name:'')+'</td><td>'+fmtD(w.from)+' to '+fmtD(w.to)+'</td><td>'+esc(w.status)+(w.apptRef?' ('+esc(w.apptRef)+')':'')+'</td><td>'+(w.status==='waiting'?'<button class="sm bad" type="button" data-wx>Remove</button>':'')+'</td></tr>'}).join('')+'</table>':'<p class="muted">Nobody is waiting.</p>';
 $$('#wlist [data-wx]').forEach(b=>b.onclick=()=>{const w=S.waitlist.find(x=>x.id===b.closest('tr').dataset.w);w.status='removed';save();renderWait()})}
$('#wvenue').onchange=()=>{$('#wperson').value='';wFill()};
$('#wadd').onclick=()=>{const n=$('#wname').value.trim(),ph=$('#wphone').value.trim();if(!n||normPhone(ph).length<8){toast('Please enter a name and mobile');return}
 S.waitlist.push({id:uid(),venueId:$('#wvenue').value,personId:$('#wperson').value,typeId:$('#wtype').value,from:$('#wfrom').value||today(),to:$('#wto').value||addDays(today(),14),name:n,phone:ph,email:$('#wemail').value.trim(),status:'waiting',created:Date.now()});save();$('#wname').value='';$('#wphone').value='';$('#wemail').value='';toast('Added to the waitlist');renderWait()};
RENDER.wait=renderWait;

/* staff dashboard */
function renderDash(){venueOpts($('#dvenue'),$('#dvenue').value);if(!$('#dday').value)$('#dday').value=today();const v=venue($('#dvenue').value);if(!v){$('#dlist').innerHTML='';return}const d=$('#dday').value;
 const L=S.appts.filter(a=>a.venueId===v.id&&a.date===d).sort((x,y)=>x.time.localeCompare(y.time));const c=s=>L.filter(a=>a.status===s).length;
 $('#dstats').innerHTML=['booked','arrived','done','no-show','cancelled'].map(s=>'<span class="stat"><b>'+c(s)+'</b>'+s+'</span>').join('')+'<span class="stat"><b>'+money(L.filter(a=>a.paid).reduce((s,a)=>s+a.price,0))+'</b>paid</span>';
 $('#dlist').innerHTML=L.length?'<table><tr><th>Time</th><th>'+esc(W.personCap)+'</th><th>Booking</th><th>Status</th><th>Actions</th></tr>'+L.map(a=>{const p=personOf(v,a.personId),t=typeOf(v,a.typeId);const ex=CFG.extraFields.filter(f=>a.extra&&a.extra[f.id]).map(f=>esc(f.label)+': '+esc(a.extra[f.id])).join('<br>');
  return '<tr data-a="'+a.id+'"><td><b>'+fmtT(a.time)+'</b><div class="muted">'+a.mins+' min</div></td><td>'+esc(p?p.name:'')+'</td><td>'+esc(t.name)+' · '+esc(a.client.name)+' · '+esc(a.client.phone)+'<div class="muted">Ref '+a.ref+(ex?'<br>'+ex:'')+(a.note?'<br>Note: '+esc(a.note):'')+'</div>'+(a.price>0?'<span class="pill">'+money(a.price)+(a.paid?' paid':' unpaid')+'</span>':'')+'</td><td class="st-'+a.status+'">'+a.status+'</td><td class="quick">'+
  (a.status==='booked'?'<button class="sm ok" type="button" data-k="arrived">Arrived</button><button class="sm warn" type="button" data-k="no-show">No-show</button>':'')+(a.status==='arrived'?'<button class="sm" type="button" data-k="done">Done</button>':'')+(a.price>0&&!a.paid&&a.status!=='cancelled'?'<button class="sm ghost" type="button" data-k="paid">Mark paid</button>':'')+(a.status==='booked'?'<button class="sm bad" type="button" data-k="cancelled">Cancel</button>':'')+'</td></tr>'}).join('')+'</table>':'<p class="muted">No bookings on this day.</p>';
 $$('#dlist [data-a]').forEach(tr=>tr.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const a=S.appts.find(x=>x.id===tr.dataset.a);const k=b.dataset.k;
  const go=()=>{if(k==='paid')a.paid=true;else if(k==='cancelled'){const f=cancelAppt(a);if(f)toast('Waitlist: '+f.client.name+' booked into '+fmtT(f.time))}else a.status=k;save();renderDash()};if(k==='cancelled')twoStep(b,'Tap again',go);else go()}))}
['#dvenue','#dday'].forEach(s=>$(s).onchange=renderDash);$('#dtoday').onclick=()=>{$('#dday').value=today();renderDash()};
RENDER.dash=()=>{renderDash();if(window.renderExtraStaff)renderExtraStaff()};

/* setup */
function renderSetup(){venueOpts($('#svenue'),$('#svenue').value);const v=venue($('#svenue').value);if(!v){$('#sform').innerHTML='<p class="muted">Add your first '+esc(W.venue)+'.</p>';return}
 const hrs=p=>[1,2,3,4,5,6,0].map(w=>'<div><label>'+DAYS[w]+'</label><input data-h="'+w+'" placeholder="closed" value="'+(p.hours[w]?p.hours[w].join('-'):'')+'"></div>').join('');
 $('#sform').innerHTML='<div class="row"><div><label>Name</label><input data-v="name" value="'+esc(v.name)+'"></div><div><label>Suburb</label><input data-v="suburb" value="'+esc(v.suburb)+'"></div><div><label>Address</label><input data-v="address" value="'+esc(v.address)+'"></div><div><label>Phone</label><input data-v="phone" value="'+esc(v.phone)+'"></div><div><label>Email</label><input data-v="email" value="'+esc(v.email)+'"></div><div><label>PayID for bookings</label><input data-v="payid" value="'+esc(v.payid)+'"></div></div>'+
 '<h3>Booking types</h3><table><tr><th>Name</th><th>Minutes</th><th>Price AUD</th><th></th></tr>'+v.types.map(t=>'<tr data-t="'+t.id+'"><td><input data-f="name" value="'+esc(t.name)+'"></td><td><input data-f="mins" type="number" min="5" step="5" value="'+t.mins+'"></td><td><input data-f="price" type="number" min="0" step="0.5" value="'+(t.price||0)+'"></td><td><button class="sm bad" type="button" data-tx>Remove</button></td></tr>').join('')+'</table><button class="sm ghost" type="button" id="taddT">Add booking type</button>'+
 '<h3>'+esc(W.peopleCap)+'</h3>'+v.people.map(p=>'<div class="ex" data-pp="'+p.id+'"><div class="row"><div><label>Name</label><input data-f="name" value="'+esc(p.name)+'"></div><div><label>Role</label><input data-f="role" value="'+esc(p.role||'')+'"></div>'+(CFG.hasRate?'<div><label>Gig rate per hour AUD</label><input data-f="rate" type="number" min="0" value="'+(p.rate||0)+'"></div>':'')+'</div><label>Hours (e.g. 09:00-15:00)</label><div class="row">'+hrs(p)+'</div><button class="sm bad" type="button" data-px>Remove</button></div>').join('')+
 '<button class="sm ghost" type="button" id="taddP">Add '+esc(W.person)+'</button><p><button type="button" id="ssave">Save changes</button> <button class="bad" type="button" id="sdel">Delete this '+esc(W.venue)+'</button></p>';
 $('#taddT').onclick=()=>{v.types.push({id:uid(),name:'New booking type',mins:30,price:0});save();renderSetup()};
 $('#taddP').onclick=()=>{v.people.push({id:uid(),name:'New '+W.person,role:'',hours:{1:['09:00','15:00']}});save();renderSetup()};
 $$('#sform [data-tx]').forEach(b=>b.onclick=()=>{if(v.types.length<2){toast('Keep at least one booking type');return}v.types=v.types.filter(t=>t.id!==b.closest('tr').dataset.t);save();renderSetup()});
 $$('#sform [data-px]').forEach(b=>b.onclick=()=>twoStep(b,'Tap again',()=>{if(v.people.length<2){toast('Keep at least one');return}v.people=v.people.filter(p=>p.id!==b.closest('[data-pp]').dataset.pp);save();renderSetup()}));
 $('#ssave').onclick=()=>{$$('#sform [data-v]').forEach(i=>v[i.dataset.v]=i.value.trim());
  $$('#sform tr[data-t]').forEach(tr=>{const t=v.types.find(x=>x.id===tr.dataset.t);t.name=tr.querySelector('[data-f=name]').value.trim()||t.name;t.mins=Math.max(5,+tr.querySelector('[data-f=mins]').value||30);t.price=Math.max(0,+tr.querySelector('[data-f=price]').value||0)});
  $$('#sform [data-pp]').forEach(el=>{const p=v.people.find(x=>x.id===el.dataset.pp);p.name=el.querySelector('[data-f=name]').value.trim()||p.name;p.role=el.querySelector('[data-f=role]').value.trim();const r=el.querySelector('[data-f=rate]');if(r)p.rate=+r.value||0;
   p.hours={};el.querySelectorAll('[data-h]').forEach(i=>{const m=i.value.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);if(m)p.hours[i.dataset.h]=[m[1].padStart(5,'0'),m[2].padStart(5,'0')]})});save();toast('Saved');renderSetup()};
 $('#sdel').onclick=function(){twoStep(this,'Tap again to delete',()=>{S.venues=S.venues.filter(x=>x.id!==v.id);save();$('#svenue').value='';renderSetup()})}}
$('#svenue').onchange=renderSetup;
$('#snew').onclick=()=>{const v={id:uid(),name:'My '+W.venue,suburb:'',address:'',phone:'',email:'',payid:'',people:[{id:uid(),name:'New '+W.person,role:'',hours:{1:['09:00','15:00'],2:['09:00','15:00'],3:['09:00','15:00'],4:['09:00','15:00'],5:['09:00','15:00']}}],types:JSON.parse(JSON.stringify(CFG.defaultTypes))};S.venues.push(v);save();venueOpts($('#svenue'),v.id);renderSetup()};
$('#bexp').onclick=()=>download(CFG.key+'-backup-'+today()+'.json',JSON.stringify(S,null,1),'application/json');
$('#bimp').onchange=e=>{const f=e.target.files[0];if(!f)return;f.text().then(t=>{try{const d=JSON.parse(t);if(!d.venues)throw 0;S=d;save();toast('Backup restored');location.reload()}catch(x){toast('That file is not a valid backup')}})};
$('#bclear').onclick=function(){twoStep(this,'Tap again to clear',()=>{S=CFG.empty();save();toast('Sample data cleared');show('setup')})};
$('#breset').onclick=function(){twoStep(this,'Tap again to reload samples',()=>{S=CFG.sample();save();toast('Sample data loaded');show('find')})};
RENDER.setup=()=>{renderSetup();if(window.CB_DEMO)$('#sform').insertAdjacentHTML('afterbegin','<div class="sample">FREE SAMPLE: you can try everything with the sample data. Adding your own '+esc(W.venues)+' is in the full version.</div>')};
if(window.CB_DEMO){$('#snew').onclick=()=>toast('Adding your own '+W.venue+' is in the full version');}
save();renderVenues();
