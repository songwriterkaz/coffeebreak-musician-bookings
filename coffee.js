'use strict';
/* Coffeebreak Bookings: Coffee cart. Order a coffee for your booking; staff see the queue. © Karen (Coffeebreak). */
const CF_PAYID='darkokaz@gmx.com',CF_BANK='Teachers Mutual Bank';
const CF_MENU=[
 {id:'latte',name:'Latte',p:[4.5,5.2,5.9],milk:'Full cream'},
 {id:'cap',name:'Cappuccino',p:[4.5,5.2,5.9],milk:'Full cream'},
 {id:'fw',name:'Flat white',p:[4.5,5.2,5.9],milk:'Full cream'},
 {id:'lb',name:'Long black',p:[4.0,4.6,5.2],milk:'No milk'},
 {id:'mocha',name:'Mocha',p:[5.0,5.7,6.4],milk:'Full cream'},
 {id:'hc',name:'Hot chocolate',p:[4.8,5.5,6.2],milk:'Full cream'},
 {id:'tea',name:'Tea (English breakfast)',p:[3.8,4.3,4.8],milk:'No milk'}];
const CF_SIZES=['Small','Regular','Large'];
const CF_MILK=[['Full cream',0],['Skim',0],['Lactose free',0.5],['Oat',0.8],['Almond',0.8],['Soy',0.8],['No milk',0]];
const CF_SUGAR=['No sugar','1 sugar','2 sugars','3 sugars','1 sweetener','2 sweeteners'];
const CF_ST=['new','making','ready','collected','cancelled'];
const CF_ICON={latte:'&#9749;',cap:'&#9749;',fw:'&#9749;',lb:'&#9749;',mocha:'&#127851;',hc:'&#127851;',tea:'&#127861;'};
if(!S.coffee)S.coffee={cart:[],orders:[]};if(!S.coffee.cart)S.coffee.cart=[];if(!S.coffee.orders)S.coffee.orders=[];
const CF={appt:null};
const cfItem=id=>CF_MENU.find(m=>m.id===id);
const cfPrice=l=>{const m=cfItem(l.item);const mk=CF_MILK.find(x=>x[0]===l.milk);return Math.round((m.p[l.size]+(mk?mk[1]:0))*100)/100};
const cfLineTotal=l=>Math.round(cfPrice(l)*l.qty*100)/100;
const cfTotal=lines=>Math.round(lines.reduce((s,l)=>s+cfLineTotal(l),0)*100)/100;
const cfDesc=l=>CF_SIZES[l.size]+' '+cfItem(l.item).name.toLowerCase()+', '+l.milk.toLowerCase()+', '+l.sugar.toLowerCase();
const cfRef=()=>'COF-'+Math.random().toString(36).slice(2,6).toUpperCase();
const cfAddMin=(date,time,n)=>{const d=parseD(date);d.setMinutes(toMin(time)+n);return{date:ds(d),time:pad(d.getHours())+':'+pad(d.getMinutes())}};

function renderCoffeeMenu(){
 $('#cfMenu').innerHTML=CF_MENU.map(m=>'<div class="cfi" data-item="'+m.id+'"><div class="cfh"><span class="cfic">'+CF_ICON[m.id]+'</span><div><b>'+esc(m.name)+'</b><div class="muted">'+m.p.map((p,i)=>CF_SIZES[i]+' '+money(p)).join(' · ')+'</div></div></div>'+
  '<div class="row cfopts"><div><label>Size</label><select data-f="size">'+CF_SIZES.map((s,i)=>'<option value="'+i+'"'+(i===1?' selected':'')+'>'+s+' '+money(m.p[i])+'</option>').join('')+'</select></div>'+
  '<div><label>Milk</label><select data-f="milk">'+CF_MILK.map(x=>'<option'+(x[0]===m.milk?' selected':'')+' value="'+esc(x[0])+'">'+esc(x[0])+(x[1]?' +'+money(x[1]):'')+'</option>').join('')+'</select></div>'+
  '<div><label>Sugar</label><select data-f="sugar">'+CF_SUGAR.map(s=>'<option>'+s+'</option>').join('')+'</select></div>'+
  '<div><label>Qty</label><input data-f="qty" type="number" min="1" max="10" value="1"></div></div>'+
  '<div class="cfbuy"><b class="cfprice">'+money(m.p[1])+'</b><button class="cfadd" type="button">Add to cart</button></div></div>').join('');
 $$('#cfMenu .cfi').forEach(el=>{const read=()=>({item:el.dataset.item,size:+el.querySelector('[data-f=size]').value,milk:el.querySelector('[data-f=milk]').value,sugar:el.querySelector('[data-f=sugar]').value,qty:Math.max(1,Math.min(10,parseInt(el.querySelector('[data-f=qty]').value,10)||1))});
  const upd=()=>{el.querySelector('.cfprice').textContent=money(cfLineTotal(read()))};el.querySelectorAll('select,input').forEach(x=>x.oninput=upd);
  el.querySelector('.cfadd').onclick=()=>{const l=read();const same=S.coffee.cart.find(c=>c.item===l.item&&c.size===l.size&&c.milk===l.milk&&c.sugar===l.sugar);if(same)same.qty=Math.min(20,same.qty+l.qty);else S.coffee.cart.push(Object.assign({id:uid()},l));save();renderCart();toast('Added to cart: '+l.qty+' x '+cfDesc(l))}})}

function renderCart(){const c=S.coffee.cart;const n=c.reduce((s,l)=>s+l.qty,0);$('#cfCount').textContent=n;
 $('#cfCart').innerHTML=c.length?'<table><tr><th>Item</th><th>Qty</th><th>Each</th><th>Total</th><th></th></tr>'+c.map(l=>'<tr data-line="'+l.id+'"><td>'+esc(cfDesc(l))+'</td><td style="white-space:nowrap"><button class="sm ghost" data-q="-1" type="button">&minus;</button> '+l.qty+' <button class="sm ghost" data-q="1" type="button">+</button></td><td>'+money(cfPrice(l))+'</td><td><b>'+money(cfLineTotal(l))+'</b></td><td><button class="sm bad" data-q="x" type="button">Remove</button></td></tr>').join('')+
  '<tr><td colspan="3" style="text-align:right"><b>Total (AUD)</b></td><td colspan="2"><b id="cfTotal" style="font-size:18px;color:var(--pd)">'+money(cfTotal(c))+'</b></td></tr></table>':'<p class="muted">Your cart is empty. Pick a drink above and press Add to cart.</p>';
 $('#cfBuy').disabled=!c.length;
 $$('#cfCart [data-line]').forEach(tr=>tr.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const l=c.find(x=>x.id===tr.dataset.line);const q=b.dataset.q;if(q==='x'||l.qty+(+q)<1)S.coffee.cart=c.filter(x=>x!==l);else l.qty=Math.min(20,l.qty+(+q));save();renderCart()}));
 if(!c.length)$('#cfCheckout').classList.add('hide')}

function cfApptOpts(list){return list.map(a=>'<option value="'+a.id+'">'+esc(a.ref+' · '+apptLine(a))+'</option>').join('')}
function cfFindAppts(){const q=$('#cfq').value.trim().toLowerCase();const qp=normPhone(q);if(!q)return[];const t=today();
 return S.appts.filter(a=>a.status==='booked'&&a.date>=t&&(a.ref.toLowerCase()===q||(qp.length>=8&&normPhone(a.client.phone)===qp)||(a.client.email&&a.client.email.toLowerCase()===q))).sort((x,y)=>(x.date+x.time).localeCompare(y.date+y.time))}
function cfPickup(){const mode=$('#cfwhen').value;
 if($('#cflink').value==='appt'){const a=S.appts.find(x=>x.id===$('#cfappt').value);if(!a)return null;const off=mode==='before'?-10:mode==='at'?0:a.mins;const p=cfAddMin(a.date,a.time,off);return Object.assign(p,{appt:a,venueId:a.venueId})}
 const d=$('#cfdate').value,tm=$('#cftime').value;if(!d||!tm)return null;return{date:d,time:tm,appt:null,venueId:$('#cfvenue').value}}
function cfRenderLink(){const isA=$('#cflink').value==='appt';$('#cfApptBox').classList.toggle('hide',!isA);$('#cfOwnBox').classList.toggle('hide',isA);$('#cfwhenBox').classList.toggle('hide',!isA);
 if(isA){const L=CF.appt?[CF.appt]:cfFindAppts();$('#cfappt').innerHTML=L.length?cfApptOpts(L):'<option value="">No upcoming booking found</option>';
  if(L.length&&!$('#cfname').value)$('#cfname').value=L[0].client.name;if(L.length&&!$('#cfphone').value)$('#cfphone').value=L[0].client.phone}
 const p=cfPickup();$('#cfPickupLine').innerHTML=p?'Ready for pickup at the front desk: <b>'+fmtD(p.date)+' at '+fmtT(p.time)+'</b>'+(p.appt?' ('+({before:'10 minutes before',at:'at the time of',after:'straight after'})[$('#cfwhen').value]+' your booking)':''):'<span class="muted">Choose your booking or a pickup time.</span>';
 const pay=$('input[name=cfpay]:checked').value;$('#cfPayIdBox').classList.toggle('hide',pay!=='payid')}
function openCheckout(){if(!S.coffee.cart.length){toast('Your cart is empty');return}$('#cfCheckout').classList.remove('hide');venueOpts($('#cfvenue'),$('#cfvenue').value);
 if(!$('#cfdate').value)$('#cfdate').value=today();if(!$('#cftime').value){const m=Math.ceil((nowMin()+15)/5)*5;$('#cftime').value=m<1440?fromMin(m):'09:00'}
 if(CF.appt){$('#cflink').value='appt';$('#cfq').value=CF.appt.ref}
 $('#cfCoTotal').textContent=money(cfTotal(S.coffee.cart));cfRenderLink();$('#cfDone').innerHTML='';$('#cfCheckout').scrollIntoView({behavior:'smooth',block:'start'})}
function placeOrder(){const c=S.coffee.cart;if(!c.length){toast('Your cart is empty');return}
 const p=cfPickup();if(!p){toast($('#cflink').value==='appt'?'Find your booking first (mobile, email or booking ref)':'Choose a pickup date and time');return}
 const name=$('#cfname').value.trim(),phone=$('#cfphone').value.trim();if(!name){toast('Please enter a name for the order');return}
 const pay=$('input[name=cfpay]:checked').value;
 const o={id:uid(),ref:cfRef(),venueId:p.venueId,apptId:p.appt?p.appt.id:null,apptRef:p.appt?p.appt.ref:'',name,phone,date:p.date,time:p.time,lines:c.map(l=>({item:l.item,size:l.size,milk:l.milk,sugar:l.sugar,qty:l.qty,each:cfPrice(l)})),total:cfTotal(c),pay,paid:false,status:'new',note:$('#cfnote').value.trim(),created:Date.now()};
 S.coffee.orders.push(o);S.coffee.cart=[];CF.appt=null;save();renderCart();$('#cfCheckout').classList.remove('hide');
 const cl=venue(o.venueId);
 $('#cfDone').innerHTML='<div class="card" style="border:2px solid var(--ok)"><h3>Coffee ordered ✓</h3><p>Order <b>'+o.ref+'</b> for '+esc(o.name)+'. Pick it up at the front desk'+(cl?' at '+esc(cl.name):'')+' on <b>'+fmtD(o.date)+' at '+fmtT(o.time)+'</b>'+(o.apptRef?' (booking '+esc(o.apptRef)+')':'')+'.</p>'+
  '<ul>'+o.lines.map(l=>'<li>'+l.qty+' x '+esc(cfDesc(l))+' '+money(l.each*l.qty)+'</li>').join('')+'</ul><p><b>Total '+money(o.total)+' AUD</b></p>'+
  (pay==='payid'?'<div class="msgbox"><b>Pay by PayID ('+CF_BANK+')</b><br>PayID: <b>'+CF_PAYID+'</b> <button class="sm ghost" type="button" data-cfcopy="'+CF_PAYID+'">Copy PayID</button><br>Amount: <b>'+money(o.total)+'</b><br>Reference: <b>'+o.ref+'</b> <button class="sm ghost" type="button" data-cfcopy="'+o.ref+'">Copy reference</button><br>Open your banking app, choose Pay to PayID, enter the email above, check the name shown, and use the reference so the front desk can match your payment. You can also pay at the counter instead.</div>':'<div class="msgbox"><b>Pay at the counter</b> when you collect your coffee. Total '+money(o.total)+'.</div>')+
  '<div class="quick"><button class="sm ghost" type="button" id="cfAgain">Order another</button></div></div>';
 $('#cfAgain').onclick=()=>{$('#cfCheckout').classList.add('hide');$('#cfDone').innerHTML='';window.scrollTo(0,0)};
 $('#cfCheckout').classList.add('hide');$('#cfDoneWrap').scrollIntoView({behavior:'smooth',block:'start'});renderQueue();toast('Coffee ordered. Ref '+o.ref)}

function renderQueue(){const sel=$('#cfqvenue');const v=sel.value;sel.innerHTML='<option value="all">All '+esc(W.venues)+'</option>'+S.venues.map(c=>'<option value="'+c.id+'">'+esc(c.name)+'</option>').join('');sel.value=v&&(v==='all'||venue(v))?v:'all';
 if(!$('#cfqday').value)$('#cfqday').value=today();const day=$('#cfqday').value,show=$('#cfqshow').value,cid=sel.value;
 const L=S.coffee.orders.filter(o=>o.date===day&&(cid==='all'||o.venueId===cid)&&(show==='all'||(show==='open'?['new','making','ready'].includes(o.status):o.status===show))).sort((a,b)=>a.time.localeCompare(b.time));
 const cnt=s=>S.coffee.orders.filter(o=>o.date===day&&(cid==='all'||o.venueId===cid)&&o.status===s).length;
 $('#cfqstats').innerHTML=['new','making','ready','collected'].map(s=>'<span class="stat"><b>'+cnt(s)+'</b>'+s[0].toUpperCase()+s.slice(1)+'</span>').join('');
 $('#cfqlist').innerHTML=L.length?'<table><tr><th>Pickup</th><th>Order</th><th>Drinks</th><th>Payment</th><th>Status</th><th>Actions</th></tr>'+L.map(o=>'<tr data-cfo="'+o.id+'"><td><b>'+fmtT(o.time)+'</b></td><td>'+o.ref+'<div class="muted">'+esc(o.name)+(o.apptRef?' · booking '+esc(o.apptRef):'')+'</div>'+(o.note?'<div class="muted">Note: '+esc(o.note)+'</div>':'')+'</td><td>'+o.lines.map(l=>l.qty+' x '+esc(cfDesc(l))).join('<br>')+'</td><td>'+money(o.total)+'<br><span class="pill">'+(o.pay==='payid'?'PayID':'At counter')+(o.paid?' paid':' unpaid')+'</span></td><td><span class="cfst cfst-'+o.status+'">'+o.status+'</span></td><td class="quick">'+
  (o.status==='new'?'<button class="sm warn" data-k="making" type="button">Start making</button>':'')+(['new','making'].includes(o.status)?'<button class="sm ok" data-k="ready" type="button">Mark ready</button>':'')+(o.status==='ready'?'<button class="sm" data-k="collected" type="button">Collected</button>':'')+
  (!o.paid&&o.status!=='cancelled'?'<button class="sm ghost" data-k="paid" type="button">Mark paid</button>':'')+(['new','making','ready'].includes(o.status)?'<button class="sm bad" data-k="cancelled" type="button">Cancel</button>':'')+'</td></tr>').join('')+'</table>':'<p class="muted">No coffee orders for this day.</p>';
 $$('#cfqlist [data-cfo]').forEach(tr=>tr.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const o=S.coffee.orders.find(x=>x.id===tr.dataset.cfo);const k=b.dataset.k;
  const go=()=>{if(k==='paid')o.paid=true;else o.status=k;save();renderQueue();toast(o.ref+': '+(k==='paid'?'marked paid':k==='ready'?'ready for pickup':k))};if(k==='cancelled')twoStep(b,'Tap again',go);else go()}))}

function renderCoffee(){renderCoffeeMenu();renderCart();renderQueue()}
function openCoffee(apptId){const a=apptId?S.appts.find(x=>x.id===apptId):null;CF.appt=a||null;show('coffee');renderCoffee();
 if(a){const n=$('#cfLinkNote');n.innerHTML='Ordering for booking <b>'+esc(a.ref)+'</b>: '+esc(apptLine(a))+'. Add drinks to the cart, then press Buy it now.';n.classList.remove('hide')}else $('#cfLinkNote').classList.add('hide')}

/* wire up */
$('#nav [data-p=coffee]').addEventListener('click',()=>{CF.appt=null;$('#cfLinkNote').classList.add('hide');renderCoffee()});
$('#cfBuy').onclick=openCheckout;$('#cfPlace').onclick=placeOrder;
['#cflink','#cfappt','#cfwhen','#cfdate','#cftime','#cfvenue'].forEach(s=>$(s).addEventListener('change',cfRenderLink));
$$('input[name=cfpay]').forEach(r=>r.onchange=cfRenderLink);
$('#cffind').onclick=()=>{CF.appt=null;$('#cfname').value='';$('#cfphone').value='';cfRenderLink();if(!cfFindAppts().length)toast('No upcoming booking found for that mobile, email or ref')};
['#cfqvenue','#cfqday','#cfqshow'].forEach(s=>$(s).onchange=renderQueue);
$('#cfqtoday').onclick=()=>{$('#cfqday').value=today();renderQueue()};
document.addEventListener('click',e=>{const b=e.target.closest('[data-coffee]');if(b){e.preventDefault();openCoffee(b.dataset.coffee)}const cp=e.target.closest('[data-cfcopy]');if(cp)copyText(cp.dataset.cfcopy)});
/* coffee link on every booked in-person appointment card, including the booking confirmation */
const _cfApptCard=apptCard;
apptCard=function(a){const h=_cfApptCard(a);if(a.status!=='booked')return h;const i=h.lastIndexOf('<div class="mbox"></div></div>');
 const link='<div class="cflink">&#9749; <b>Want a coffee with that?</b> <button class="sm" type="button" data-coffee="'+a.id+'">Order a coffee for this booking</button></div>';return i<0?h+link:h.slice(0,i)+link+h.slice(i)};
renderCart();if(location.hash==='#coffee')openCoffee();
