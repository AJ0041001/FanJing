const { service, load } = require('../../lib/page');
const core = service.core;
const TYPES = ['巡园','施肥','灌溉','除草','遮阴','病虫害检查'];
const field = (key,label,type,extra) => Object.assign({key,label,type:type||'text'},extra||{});
Page({
  data: { title:'', subtitle:'', fields:[], values:{}, photos:[], photoViews:[], error:'', busy:false, kind:'' },
  onLoad(query) { this.query = query; this.initialize(); },
  initialize() {
    return load(this, s => {
      this.state = s; const q=this.query, gs=core.gardens(s); let values={gardenId:q.gardenId || (gs[0]||{}).id, date:core.today(), grade:'一级鲜叶', type:'巡园', orderId:q.orderId||''}, fields=[], title='', subtitle='';
      const gardenField=field('gardenId','茶园','select',{choices:gs.map(g=>({value:g.id,label:g.name}))});
      if(q.kind==='garden') {
        const g=q.id?s.gardens.find(g=>g.id===q.id):null; values=Object.assign({},g||{}); title=g?'编辑茶园档案':'新建茶园档案'; subtitle='记录种植基础信息，建立一园一档。';
        fields=[field('name','茶园名称'),field('location','所在地'),field('area','种植面积 / 亩','digit'),field('variety','茶树品种'),field('altitude','海拔 / m','digit'),field('note','备注','textarea')];
      } else if(q.kind==='farming') {
        title='农事打卡';subtitle='人工记录茶园情况，可附上现场照片。';fields=[gardenField,field('date','农事日期','date'),field('type','农事类型','select',{choices:TYPES.map(x=>({value:x,label:x}))}),field('note','农事情况','textarea')];
      } else if(q.kind==='harvest') {
        title='采收上报';subtitle='关联已接订单后，本次产量同步计入交付。';
        if(q.orderId) { const o=s.orders.find(o=>o.id===q.orderId); const c=o&&o.claims.find(c=>c.ownerId===core.user(s).id&&c.amount>c.delivered); if(c) values.gardenId=c.gardenId; }
        fields=[gardenField,field('date','采收日期','date'),field('amount','鲜叶采收量 / kg','digit'),field('grade','鲜叶等级'),field('orderId','关联订单','select',{choices:[]}),field('note','备注','textarea')];
      } else if(q.kind==='order') {
        title='发布收购订单';subtitle='填写需求，农户可按茶园接单。';values={deadline:core.dateShift(core.today(),7),grade:'一级鲜叶'};
        fields=[field('title','订单名称'),field('quantity','收购数量 / kg','digit'),field('price','收购单价 / 元每 kg','digit'),field('deadline','接单截止日期','date'),field('grade','品质要求'),field('note','收购说明','textarea')];
      } else if(q.kind==='accept') {
        const o=s.orders.find(o=>o.id===q.orderId); if(!o) throw new Error('订单不存在'); values.orderId=o.id;title='接取收购订单';subtitle=o.title+' · 剩余 '+core.remaining(o)+' kg';
        fields=[gardenField,field('amount','本次接单数量 / kg','digit')];
      } else throw new Error('页面不存在');
      this.setData({kind:q.kind,title,subtitle,fields,values,error:''});wx.setNavigationBarTitle({title});this.refreshFields();
    });
  },
  refreshFields() {
    const values=this.data.values, s=this.state;
    const fields=this.data.fields.map(f=>{
      if(f.key==='orderId') { const u=core.user(s); f.choices=[{value:'',label:'不关联订单，仅记录采收'}].concat(s.orders.filter(o=>o.claims.some(c=>c.ownerId===u.id&&c.gardenId===values.gardenId&&c.delivered<c.amount)).map(o=>({value:o.id,label:o.title}))); if(!f.choices.some(c=>c.value===values.orderId)) values.orderId=''; }
      if(f.type==='select') { f.index=Math.max(0,f.choices.findIndex(c=>c.value===values[f.key])); f.display=(f.choices[f.index]||{}).label||'请先建立茶园'; }
      return f;
    });this.setData({fields,values});
  },
  input(e) { const key=e.currentTarget.dataset.key;this.setData({['values.'+key]:e.detail.value}); },
  pick(e) { const key=e.currentTarget.dataset.key,f=this.data.fields.find(f=>f.key===key); const value=f.type==='select'?(f.choices[Number(e.detail.value)]||{}).value:e.detail.value;this.setData({['values.'+key]:value});this.refreshFields(); },
  async addPhoto() {
    if(this.data.photos.length>=3 || this.data.busy) return;
    this.setData({busy:true,error:''});
    try { const photo=await service.photo(),src=await service.imageUrl(photo);this.setData({photos:this.data.photos.concat(photo),photoViews:this.data.photoViews.concat(src)}); }
    catch(e) { if(!/cancel/.test(e.errMsg||''))this.setData({error:e.message||'图片保存失败，请重试'}); }
    finally { this.setData({busy:false}); }
  },
  removePhoto(e) { const i=Number(e.currentTarget.dataset.index);this.setData({photos:this.data.photos.filter((_,j)=>i!==j),photoViews:this.data.photoViews.filter((_,j)=>i!==j)}); },
  async submit() {
    if(this.data.busy) return;this.setData({busy:true,error:''});
    try {const types={garden:'saveGarden',farming:'addFarming',harvest:'addHarvest',order:'publishOrder',accept:'acceptOrder'};await service.run(types[this.data.kind],Object.assign({},this.data.values,{photos:this.data.photos}));wx.showToast({title:'已保存',icon:'success'});wx.navigateBack();}
    catch(e) {this.setData({error:e.message||'保存失败，请重试'});}
    finally {this.setData({busy:false});}
  }
});
