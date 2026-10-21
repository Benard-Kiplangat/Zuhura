const CFG={whatsapp:'254700000000',freeShip:5000,shipFee:300}; // <- put your WhatsApp number here
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KSh=n=>'KSh '+Number(n).toLocaleString();
let products=[],cart=JSON.parse(localStorage.zm_cart||'[]'),cat='all',q='',sort='featured',view='cart',done=null;
const save=()=>localStorage.zm_cart=JSON.stringify(cart);
const pic=p=>p.image?`<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">`:esc(p.emoji);
const byId=id=>products.find(p=>p.id===id);
$('#waHero').href=`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent('Hi Zuhura Mart, I need help choosing a gadget.')}`;

async function load(){
  try{products=await (await fetch('/api/products')).json()}
  catch{$('#grid').innerHTML='<p class="empty">Could not load products. Start the server with <b>node server.js</b>.</p>';return}
  cart=cart.filter(i=>byId(i.id)).map(i=>({id:i.id,qty:Math.min(i.qty,byId(i.id).stock)})).filter(i=>i.qty>0);save();
  renderSide();renderGrid();renderCart();
}
function renderSide(){
  $('#side').innerHTML=products.filter(p=>p.featured).slice(0,2).map(p=>`<button class="side-card" data-open="${p.id}"><h3>${esc(p.name)}</h3><div class="price-tag">${KSh(p.price)}</div><span class="big" aria-hidden="true">${esc(p.emoji)}</span></button>`).join('');
}
function renderGrid(){
  let list=products.filter(p=>(cat==='all'||p.cat===cat)&&(p.name+' '+p.brand).toLowerCase().includes(q.toLowerCase()));
  if(sort==='low')list.sort((a,b)=>a.price-b.price);if(sort==='high')list.sort((a,b)=>b.price-a.price);
  $('#info').textContent=`${list.length} product${list.length===1?'':'s'} • free delivery over ${KSh(CFG.freeShip)}`;
  $('#grid').innerHTML=list.map(p=>{
    const tag=p.stock<1?'<span class="tag out">Sold out</span>':p.old?`<span class="tag">-${Math.round((1-p.price/p.old)*100)}%</span>`:p.stock<=3?`<span class="tag">Only ${p.stock} left</span>`:'';
    return `<div class="card" data-open="${p.id}" tabindex="0" role="button" aria-label="View ${esc(p.name)}"><div class="card-img">${pic(p)}${tag}</div>
    <div class="card-info"><small>${esc(p.brand)}</small><h4>${esc(p.name)}</h4><div class="meta"><div><strong>${KSh(p.price)}</strong>${p.old?`<s>${p.old.toLocaleString()}</s>`:''}</div>
    <button class="add" data-add="${p.id}" aria-label="Add ${esc(p.name)} to cart" ${p.stock<1?'disabled':''}>+</button></div></div></div>`}).join('')||'<p class="empty">No products match your search. Try another word or category.</p>';
}
function openModal(id){
  const p=byId(id);if(!p)return;
  $('#modal').innerHTML=`<div class="modal"><div class="m-img">${pic(p)}</div><div class="m-info"><small class="muted">${esc(p.brand)}</small><h2>${esc(p.name)}</h2>
  <div><strong style="font-size:24px">${KSh(p.price)}</strong>${p.old?` <s class="muted">${p.old.toLocaleString()}</s>`:''}</div><p>${esc(p.desc)}</p>
  <span class="muted">${p.stock>0?p.stock+' in stock':'Sold out'}</span>
  <div class="btns" style="margin-top:auto"><button class="btn btn-primary" data-add="${p.id}" data-close ${p.stock<1?'disabled':''}>Add to cart</button><button class="btn btn-dark" data-close>Close</button></div></div></div>`;
  $('#modal').showModal();
}
function toast(t){const e=document.createElement('div');e.className='toast';e.textContent=t;e.setAttribute('role','status');document.body.append(e);setTimeout(()=>e.remove(),1800)}
function add(id){
  const p=byId(id),it=cart.find(i=>i.id===id);if(!p||p.stock<1)return;
  if(it){if(it.qty>=p.stock)return toast(`Only ${p.stock} available`);it.qty++}else cart.push({id,qty:1});
  save();renderCart();toast('Added to cart');
}
const totals=()=>{const sub=cart.reduce((a,i)=>a+byId(i.id).price*i.qty,0);const ship=sub&&sub<CFG.freeShip?CFG.shipFee:0;return{sub,ship,total:sub+ship}};
function renderCart(){
  $('#count').textContent=cart.reduce((a,i)=>a+i.qty,0);
  const b=$('#cartBody'),t=totals();
  if(view==='done'&&done){
    const wa=`https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(`Hi, I placed order ${done.id} (${KSh(done.total)}).`)}`;
    $('#drawerTitle').textContent='Order placed';
    b.innerHTML=`<h3 style="font-size:24px;margin:20px 0 8px">Thank you, ${esc(done.customer.name.split(' ')[0])}.</h3><p class="muted" style="line-height:1.6">Order <b style="color:#fff">${done.id}</b> · ${KSh(done.total)}<br>${esc(done.payment.message)}</p>
    <div class="btns" style="margin-top:20px"><a class="btn btn-primary" href="${wa}" target="_blank" rel="noopener">Confirm on WhatsApp</a><button class="btn btn-dark" data-act="shop">Keep shopping</button></div>`;return;
  }
  if(view==='form'&&cart.length){
    $('#drawerTitle').textContent='Delivery details';
    b.innerHTML=`<form id="checkout"><label for="f-name">Full name</label><input id="f-name" name="name" required autocomplete="name">
    <label for="f-phone">M-Pesa number</label><input id="f-phone" name="phone" required inputmode="tel" placeholder="0712345678" autocomplete="tel">
    <label for="f-city">Town or estate</label><input id="f-city" name="city" required>
    <label for="f-addr">Delivery address</label><textarea id="f-addr" name="address" rows="2" required></textarea>
    <div style="margin-top:16px"><div class="row"><span>Subtotal</span><span>${KSh(t.sub)}</span></div><div class="row"><span>Delivery</span><span>${t.ship?KSh(t.ship):'Free'}</span></div><div class="row total"><span>Total</span><span>${KSh(t.total)}</span></div></div>
    <p class="err" id="err" role="alert"></p><button class="btn btn-primary" style="width:100%;padding:16px" id="pay">Pay ${KSh(t.total)} with M-Pesa</button>
    <button type="button" class="btn btn-dark" style="width:100%;margin-top:10px" data-act="back">Back to cart</button></form>`;return;
  }
  view='cart';$('#drawerTitle').textContent=`Your cart (${cart.reduce((a,i)=>a+i.qty,0)})`;
  if(!cart.length){b.innerHTML='<p class="muted" style="margin-top:40px;text-align:center">Your cart is empty.<br>Add a gadget to get started.</p>';return}
  b.innerHTML=cart.map(i=>{const p=byId(i.id);return `<div class="line"><div class="thumb">${pic(p)}</div><div class="t">${esc(p.name)}<div class="qty"><button data-dec="${p.id}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button data-inc="${p.id}" aria-label="Increase quantity">+</button></div></div><strong style="font-size:13px">${KSh(p.price*i.qty)}</strong></div>`}).join('')+
  `<div style="padding-top:16px"><div class="row"><span>Subtotal</span><span>${KSh(t.sub)}</span></div><div class="row"><span>Delivery</span><span>${t.ship?KSh(t.ship):'Free'}</span></div><div class="row total"><span>Total</span><span>${KSh(t.total)}</span></div>
  <button class="btn btn-primary" style="width:100%;padding:16px;margin-top:14px" data-act="checkout">Checkout</button></div>`;
}
function drawer(open){$('#drawer').classList.toggle('open',open);$('#overlay').classList.toggle('show',open);if(open)$('#closeCart').focus();else if(view==='done'){view='cart';done=null;renderCart()}}
async function submit(e){
  e.preventDefault();const f=new FormData(e.target),btn=$('#pay');btn.disabled=true;$('#err').textContent='';
  try{
    const r=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:cart,customer:Object.fromEntries(f)})});
    const d=await r.json();if(!r.ok)throw new Error(d.error);
    done=d;cart=[];save();view='done';await load();renderCart();
  }catch(err){$('#err').textContent=err.message;btn.disabled=false}
}
document.addEventListener('click',e=>{
  const g=s=>e.target.closest(s);let x;
  if(x=g('[data-add]')){e.stopPropagation();add(+x.dataset.add);if(x.hasAttribute('data-close'))$('#modal').close();return}
  if(g('[data-close]'))return $('#modal').close();
  if(x=g('[data-open]'))return openModal(+x.dataset.open);
  if(x=g('[data-inc]'))return add(+x.dataset.inc);
  if(x=g('[data-dec]')){const it=cart.find(i=>i.id===+x.dataset.dec);if(--it.qty<1)cart=cart.filter(i=>i!==it);save();return renderCart()}
  if(x=g('[data-act]')){const a=x.dataset.act;view=a==='checkout'?'form':a==='shop'?'cart':a==='back'?'cart':view;if(a==='shop'){done=null;drawer(false)}return renderCart()}
  if(x=g('.cat')){cat=x.dataset.cat;document.querySelectorAll('.cat').forEach(c=>c.classList.toggle('active',c===x));$('#title').textContent=x.textContent;return renderGrid()}
  if(g('#cartBtn'))return drawer(true);
  if(g('#closeCart')||g('#overlay'))return drawer(false);
  if(e.target.id==='modal')$('#modal').close();
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')drawer(false);if((e.key==='Enter')&&e.target.matches('.card'))openModal(+e.target.dataset.open)});
document.addEventListener('submit',e=>{if(e.target.id==='checkout')submit(e)});
$('#q').oninput=e=>{q=e.target.value;renderGrid()};$('#sort').onchange=e=>{sort=e.target.value;renderGrid()};
load();
