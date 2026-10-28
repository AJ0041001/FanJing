const { service, load } = require('../../lib/page');
Page({
  data: { gardens: [], selected: 0, result: null, error: '', modelError: '' },
  onShow() { this.refresh(); },
  refresh() { return load(this, s => { this.state = s; const gs = service.core.gardens(s), selected = Math.min(this.data.selected, Math.max(gs.length - 1, 0)); this.setData({ gardens: gs, selected }); this.compute(); }); },
  choose(e) { this.setData({ selected: Number(e.detail.value) }); this.compute(); },
  compute() {
    const g = this.data.gardens[this.data.selected];
    if (!g) { this.setData({ result: null, modelError: '请先建立茶园档案并录入历史采收数据' }); return; }
    try { const result = service.core.forecast(this.state, g.id); result.rows = result.futureMonths.map((month, i) => ({ month, amount: result.forecast[i] })); result.history = result.months.map((month, i) => ({ month, amount: result.values[i], fit: result.fitted[i] })); this.setData({ result, modelError: '' }, () => this.draw()); }
    catch (e) { this.setData({ result: null, modelError: e.message }); }
  },
  draw() {
    const r = this.data.result; if (!r) return;
    wx.createSelectorQuery().in(this).select('#forecastCanvas').boundingClientRect(rect => {
      if (!rect) return; const w = rect.width, h = rect.height, pad = { l: 38, r: 12, t: 20, b: 32 }, values = r.values.concat(r.forecast), max = Math.max.apply(null, values) * 1.18;
      const ctx = wx.createCanvasContext('forecastCanvas', this), px = i => pad.l + i / (values.length - 1) * (w - pad.l - pad.r), py = v => h - pad.b - v / max * (h - pad.t - pad.b);
      ctx.clearRect(0, 0, w, h); ctx.setFontSize(10); ctx.setStrokeStyle('#e9eee3'); ctx.setFillStyle('#8a9683'); ctx.setLineWidth(1);
      for(let i=0;i<4;i++){ const v=max*i/3,y=py(v); ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.fillText(String(Math.round(v)),0,y+3); }
      const line = (vs, offset, color, dash) => {ctx.beginPath();ctx.setStrokeStyle(color);ctx.setLineWidth(2);ctx.setLineDash(dash);vs.forEach((v,i)=>i?ctx.lineTo(px(i+offset),py(v)):ctx.moveTo(px(i+offset),py(v)));ctx.stroke();ctx.setLineDash([]);};
      line(r.values,0,'#35664d',[]);line([r.values[r.values.length-1]].concat(r.forecast),r.values.length-1,'#a3b776',[5,4]);
      values.forEach((v,i)=>{ctx.beginPath();ctx.setFillStyle(i<r.values.length?'#35664d':'#a3b776');ctx.arc(px(i),py(v),3,0,Math.PI*2);ctx.fill();});
      ctx.setFillStyle('#8a9683');ctx.setFontSize(10); r.months.concat(r.futureMonths).forEach((m,i)=>{if(i%2===0 || i===values.length-1)ctx.fillText(m.slice(5)+'月',px(i)-9,h-10);});ctx.draw();
    }).exec();
  }
});
