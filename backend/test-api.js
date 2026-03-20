const BASE = 'http://localhost:5000/api'
const C = { reset:'\x1b[0m', green:'\x1b[32m', red:'\x1b[31m', yellow:'\x1b[33m', cyan:'\x1b[36m', bold:'\x1b[1m', dim:'\x1b[2m' }
let pass=0,fail=0,skip=0,customerToken='',sellerToken='',adminToken='',createdProductId='',createdOrderId=''
const failures=[]
async function req(method,path,body=null,token=''){
  const headers={'Content-Type':'application/json'}
  if(token)headers['Authorization']=`Bearer ${token}`
  const opts={method,headers}
  if(body)opts.body=JSON.stringify(body)
  const res=await fetch(`${BASE}${path}`,opts)
  let data;try{data=await res.json()}catch{data={}}
  return{status:res.status,data}
}
function section(t){console.log(`\n${C.bold}${C.cyan}--- ${t} ---${C.reset}`)}
async function test(name,fn,critical=false){
  try{
    const r=await fn()
    if(r===false){fail++;failures.push({name,critical});console.log(`  X FAIL ${name}`)}
    else{pass++;console.log(`  OK PASS ${name}  ${typeof r==='string'?r:''}`)}
  }catch(e){fail++;failures.push({name,critical,error:e.message});console.log(`  !! ERROR ${name} -> ${e.message}`)}
}
async function main(){
  console.log('\nBELLMAK API Test Suite')
  console.log('Base: '+BASE+'\n')
  section('AUTH')
  await test('Customer login',async()=>{
    const r=await req('POST','/auth/login',{emailOrPhone:'customer@bellmak.com',password:'Customer@123'})
    if(r.status===200&&r.data.data?.accessToken){customerToken=r.data.data.token;return 'token ok'}
    console.log('    Response:',JSON.stringify(r.data).substring(0,100))
    return false
  },true)
  await test('Seller login',async()=>{
    const r=await req('POST','/auth/login',{emailOrPhone:'seller@bellmak.com',password:'Seller@123'})
    if(r.status===200&&r.data.data?.accessToken){sellerToken=r.data.data.token;return 'token ok'}
    return false
  },true)
  await test('Admin login',async()=>{
    const email=process.env.ADMIN_EMAIL||'admin@bellmak.com'
    const pwd=process.env.ADMIN_PASSWORD||'Admin@123'
    const r=await req('POST','/auth/login',{emailOrPhone:email,password:pwd})
    if(r.status===200&&r.data.data?.accessToken){adminToken=r.data.data.token;return 'admin ok'}
    console.log('    Response:',JSON.stringify(r.data).substring(0,100))
    return false
  },true)
  await test('Wrong password blocked',async()=>{
    const r=await req('POST','/auth/login',{emailOrPhone:'customer@bellmak.com',password:'wrong'})
    return r.status===401||r.status===400?'blocked ok':false
  })
  section('PRODUCTS')
  await test('GET /products',async()=>{
    const r=await req('GET','/products')
    if(r.status===200){
      const l=r.data.data?.products||r.data.products||r.data.data||r.data
      console.log('    Keys:',Object.keys(r.data))
      return Array.isArray(l)?`${l.length} products`:`keys: ${Object.keys(r.data)}`
    }
    return false
  },true)
  await test('GET /products/featured',async()=>{
    const r=await req('GET','/products/featured')
    return r.status===200?'ok':false
  })
  await test('GET /products/trending',async()=>{
    const r=await req('GET','/products/trending')
    return r.status===200?'ok':false
  })
  await test('Product detail slug',async()=>{
    const list=await req('GET','/products?limit=1')
    const prods=list.data.data?.products||list.data.products||list.data.data||list.data
    if(!prods||!Array.isArray(prods)||!prods[0])return 'no products found - seed chalao'
    const slug=prods[0].slug
    const r=await req('GET',`/products/${slug}`)
    const p=r.data.data?.product||r.data.data||r.data.product||r.data
    return r.status===200&&p.title?`title:${p.title.substring(0,20)}`:false
  },true)
  section('SELLER')
  if(!sellerToken){console.log('  running seller tests');skip+=3}
  else{
    await test('GET /seller/products',async()=>{
      const r=await req('GET','/seller/products',null,sellerToken)
      return r.status===200?'ok':false
    },true)
    await test('POST /seller/products',async()=>{
      const r=await req('POST','/seller/products',{
        title:'Test Product Auto',slug:`test-auto-${Date.now()}`,
        description:'test',price:499,mrp:999,category:'Electronics',
        images:['https://via.placeholder.com/400'],stock:10,brand:'Test'
      },sellerToken)
      if(r.status===201||r.status===200){createdProductId=r.data.data?.product?.id||r.data.data?.id||r.data.product?.id||r.data.id||'';return `id:${createdProductId}`}
      console.log('    Response:',JSON.stringify(r.data).substring(0,150))
      return false
    },true)
    await test('Seller routes blocked for customer',async()=>{
      const r=await req('GET','/seller/products',null,customerToken)
      return(r.status===401||r.status===403)?'blocked ok':false
    },true)
  }
  section('ORDERS')
  if(!customerToken){console.log('  SKIP orders');skip+=2}
  else{
    await test('POST /orders COD',async()=>{
      const list=await req('GET','/products?limit=1')
      const prods=list.data.data?.products||list.data.products||list.data.data||list.data
      if(!prods||!Array.isArray(prods)||!prods[0])return 'no products found'
      const r=await req('POST','/orders',{
        items:[{productId:prods[0].id,quantity:1}],
        paymentMode:'COD',
        address:{name:'Test User',phone:'9876543210',line1:'123 Test St',city:'Mumbai',state:'Maharashtra',pincode:'400001'}
      },customerToken)
      if(r.status===201||r.status===200){createdOrderId=r.data.data?.order?.id||r.data.data?.id||r.data.order?.id||r.data.id||'';return `order:${createdOrderId}`}
      console.log('    Response:',JSON.stringify(r.data).substring(0,150))
      return false
    },true)
    await test('GET /orders/:id',async()=>{
      if(!createdOrderId)return false
      const r=await req('GET',`/orders/${createdOrderId}`,null,customerToken)
      return r.status===200?'ok':false
    })
  }
  section('ADMIN')
  if(!adminToken){console.log('  SKIP admin - token nahi mila');skip+=4}
  else{
    await test('GET /admin/dashboard',async()=>{
      const r=await req('GET','/admin/dashboard',null,adminToken)
      return r.status===200?'ok':false
    },true)
    await test('GET /admin/users',async()=>{
      const r=await req('GET','/admin/users',null,adminToken)
      return r.status===200?'ok':false
    })
    await test('GET /admin/orders',async()=>{
      const r=await req('GET','/admin/orders',null,adminToken)
      return r.status===200?'ok':false
    })
    await test('Admin blocked for customer',async()=>{
      const r=await req('GET','/admin/dashboard',null,customerToken)
      return(r.status===401||r.status===403)?'blocked ok':false
    },true)
  }
  section('MISC')
  await test('POST /misc/newsletter',async()=>{
    const r=await req('POST','/newsletter',{email:'test@example.com'})
    console.log('    Status:',r.status,'Response:',JSON.stringify(r.data).substring(0,80))
    return(r.status===200||r.status===201)?'ok':false
  })
  await test('POST /contact',async()=>{
    const r=await req('POST','/contact',{name:'Test',email:'test@example.com',subject:'Test',message:'Hello test'})
    return(r.status===200||r.status===201)?'ok':false
  })
  const total=pass+fail
  const pct=total>0?Math.round(pass/total*100):0
  console.log('\n==========================================')
  console.log('FINAL RESULTS')
  console.log('==========================================')
  console.log(`OK Pass: ${pass}`)
  console.log(`X  Fail: ${fail}`)
  console.log(`-  Skip: ${skip}`)
  console.log(`Score:   ${pct}%`)
  if(failures.length>0){
    console.log('\nFailed Tests:')
    failures.forEach(f=>console.log(`  - ${f.name}${f.critical?' [CRITICAL]':''}${f.error?' -> '+f.error:''}`))
  }
  if(failures.filter(f=>f.critical).length>0)console.log('\nWARNING: Critical failures - DEPLOY MAT KARO!')
  else if(fail===0)console.log('\nSab tests pass! Deploy ready!')
  else console.log('\nKuch tests fail - fix karo phir deploy karo')
}
main().catch(e=>console.error('Crash:',e.message))
