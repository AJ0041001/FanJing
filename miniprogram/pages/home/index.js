const { service, load, form } = require('../../lib/page');
const core = service.core;
Page({
  data: { user: {}, summary: {}, records: [], error: '', mode: service.config.mode },
  onShow() { this.refresh(); },
  refresh() { return load(this, (s, user) => { const stats = core.summary(s); const names = {}; s.gardens.forEach(g => names[g.id] = g.name); this.setData({ summary: stats, records: stats.records.map(r => Object.assign({}, r, { gardenName: names[r.gardenId] })), date: core.today() }); }); },
  addFarming() { form('farming'); }, addHarvest() { form('harvest'); }, publishOrder() { form('order'); },
  toGardens() { wx.switchTab({ url: '/pages/gardens/index' }); },
  toForecast() { wx.switchTab({ url: '/pages/forecast/index' }); },
  toRecords() { wx.navigateTo({ url: '/pages/records/index' }); },
  switchUser() { wx.reLaunch({ url: '/pages/login/index' }); },
  reset() {
    wx.showModal({ title: '恢复演示数据', content: '会清除当前设备的新增填报和订单，并恢复初始模拟数据。', confirmText: '确认恢复', success: async r => { if (!r.confirm) return; try { await service.reset(); wx.reLaunch({ url: '/pages/login/index' }); } catch(e) { wx.showToast({ title: e.message, icon: 'none' }); } } });
  }
});
