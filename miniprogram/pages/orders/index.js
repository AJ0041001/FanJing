const { service, load, form } = require('../../lib/page');
Page({
  data: { user: {}, orders: [], error: '' },
  onShow() { this.refresh(); },
  refresh() { return load(this, s => this.setData({ orders: service.core.orderViews(s).map(o => Object.assign({}, o, { progress: Math.round((o.quantity - o.remaining) / o.quantity * 100) })) })); },
  publish() { form('order'); },
  accept(e) { form('accept', 'orderId=' + e.currentTarget.dataset.id); },
  harvest(e) { form('harvest', 'orderId=' + e.currentTarget.dataset.id); },
  close(e) { const id = e.currentTarget.dataset.id; wx.showModal({ title: '关闭收购订单', content: '关闭后停止接单，已有接单仍可上报采收交付。', success: async r => { if (r.confirm) { try { await service.run('closeOrder', { orderId: id }); this.refresh(); } catch (e) { wx.showToast({ title: e.message, icon: 'none' }); } } } }); }
});
