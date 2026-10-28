const { service, load } = require('../../lib/page');
Page({
  data: {records:[],error:'',gardenName:'全部茶园'},
  onLoad(q){this.gardenId=q.gardenId||'';},
  onShow(){this.refresh();},
  refresh(){return load(this,async s=>{
    const ids=service.core.gardens(s).map(g=>g.id),filter=r=>ids.indexOf(r.gardenId)>=0&&(!this.gardenId||this.gardenId===r.gardenId),names={};s.gardens.forEach(g=>names[g.id]=g.name);
    const records=s.harvests.filter(filter).map(h=>Object.assign({},h,{kind:'采收',label:h.amount+' kg · '+h.grade+(h.orderId?' · 已登记订单交付':'')})).concat(s.farming.filter(filter).map(f=>Object.assign({},f,{kind:f.type,label:f.note}))).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
    for(const record of records){record.gardenName=names[record.gardenId];record.photoViews=[];for(const p of record.photos||[]){try{record.photoViews.push(await service.imageUrl(p));}catch(e){record.imageError='部分照片暂不可用';}}}
    this.setData({records,gardenName:names[this.gardenId]||'全部茶园'});
  });},
  preview(e){wx.previewImage({urls:[e.currentTarget.dataset.src]});}
});
