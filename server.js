// Zuhura Mart - zero-dependency Node server (storefront + JSON API + admin API)
const http=require('http'),fs=require('fs'),path=require('path');
const PORT=process.env.PORT||3000, ADMIN=process.env.ADMIN_PASSWORD||'zuhura123';
const SHIP={free:5000,fee:300};
const F=n=>path.join(__dirname,'data',n+'.json');
const read=n=>{try{return JSON.parse(fs.readFileSync(F(n)))}catch{return[]}};
const write=(n,d)=>fs.writeFileSync(F(n),JSON.stringify(d,null,2));
const MIME={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const json=(r,c,o)=>{r.writeHead(c,{'Content-Type':'application/json'});r.end(JSON.stringify(o))};
const body=q=>new Promise(ok=>{let b='';q.on('data',c=>{b+=c;if(b.length>1e6)q.destroy()});q.on('end',()=>{try{ok(JSON.parse(b||'{}'))}catch{ok({})}})});
const str=(v,n=120)=>String(v||'').trim().slice(0,n);

// Replace with a real Safaricom Daraja STK Push call when you go live.
async function stkPush(phone,amount,ref){
  console.log(`[mpesa:simulated] STK push ${phone} KSh ${amount} ref ${ref}`);
  return {status:'simulated',message:'M-Pesa prompt is simulated in this demo. Connect Daraja to take real payments.'};
}

async function api(req,res,url){
  const m=req.method, p=url.pathname, b=['POST','PUT','PATCH'].includes(m)?await body(req):{};
  if(m==='GET'&&p==='/api/products') return json(res,200,read('products'));

  if(m==='POST'&&p==='/api/orders'){
    const c=b.customer||{}, ph=str(c.phone,20).replace(/[\s-]/g,'').replace(/^\+/,'');
    if(!/^(254|0)?[71]\d{8}$/.test(ph)) return json(res,400,{error:'Enter a valid Safaricom number, e.g. 0712345678.'});
    const phone=ph.startsWith('254')?ph:'254'+ph.replace(/^0/,'');
    if(str(c.name).length<2||str(c.address).length<4) return json(res,400,{error:'Name and delivery address are required.'});
    const products=read('products'), lines=[];
    for(const it of Array.isArray(b.items)?b.items:[]){
      const pr=products.find(x=>x.id===it.id), qty=Math.floor(it.qty);
      if(!pr||!(qty>0)) return json(res,400,{error:'An item in your cart is no longer available.'});
      if(qty>pr.stock) return json(res,409,{error:`Only ${pr.stock} left of ${pr.name}.`});
      lines.push({id:pr.id,name:pr.name,price:pr.price,qty});
    }
    if(!lines.length) return json(res,400,{error:'Your cart is empty.'});
    lines.forEach(l=>products.find(x=>x.id===l.id).stock-=l.qty);
    const subtotal=lines.reduce((a,l)=>a+l.price*l.qty,0), shipping=subtotal>=SHIP.free?0:SHIP.fee;
    const orders=read('orders');
    const order={id:'ZM-'+String(1000+orders.length+1),created:new Date().toISOString(),status:'pending',
      customer:{name:str(c.name),phone,address:str(c.address,200),city:str(c.city)},items:lines,subtotal,shipping,total:subtotal+shipping};
    order.payment=await stkPush(phone,order.total,order.id);
    orders.push(order); write('orders',orders); write('products',products);
    return json(res,201,order);
  }

  if(p.startsWith('/api/admin/')){
    if(req.headers['x-admin']!==ADMIN) return json(res,401,{error:'Wrong admin password.'});
    const [,, , kind, id]=p.split('/'), ID=Number(id);
    if(kind==='orders'){
      const orders=read('orders');
      if(m==='GET') return json(res,200,orders.slice().reverse());
      if(m==='PATCH'){const o=orders.find(x=>x.id===id);if(!o)return json(res,404,{error:'Not found'});
        if(['pending','paid','shipped','delivered','cancelled'].includes(b.status)) o.status=b.status;
        write('orders',orders);return json(res,200,o);}
    }
    if(kind==='products'){
      const products=read('products');
      if(m==='POST'){
        const pr={id:Math.max(0,...products.map(x=>x.id))+1,name:str(b.name),brand:str(b.brand,40),price:Math.max(0,+b.price||0),
          cat:str(b.cat,20)||'phones',emoji:str(b.emoji,4)||'📦',image:str(b.image,300),stock:Math.max(0,+b.stock||0),desc:str(b.desc,400)};
        if(!pr.name||!pr.price) return json(res,400,{error:'Name and price are required.'});
        products.push(pr);write('products',products);return json(res,201,pr);
      }
      const i=products.findIndex(x=>x.id===ID);
      if(i<0) return json(res,404,{error:'Not found'});
      if(m==='PUT'){const pr=products[i];
        if(b.price!=null)pr.price=Math.max(0,+b.price||0); if(b.stock!=null)pr.stock=Math.max(0,+b.stock||0);
        write('products',products);return json(res,200,pr);}
      if(m==='DELETE'){products.splice(i,1);write('products',products);return json(res,200,{ok:true});}
    }
  }
  json(res,404,{error:'Not found'});
}

http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://x');
  try{
    if(url.pathname.startsWith('/api/')) return await api(req,res,url);
    let f=url.pathname==='/'?'/index.html':url.pathname==='/admin'?'/admin.html':url.pathname;
    f=path.join(__dirname,'public',path.normalize(f));
    if(!f.startsWith(path.join(__dirname,'public'))||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);return res.end('Not found');}
    res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(res);
  }catch(e){console.error(e);json(res,500,{error:'Server error'})}
}).listen(PORT,()=>console.log(`Zuhura Mart running: http://localhost:${PORT}  (admin: /admin, password: ${ADMIN})`));
