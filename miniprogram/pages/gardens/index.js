const { service, load, form } = require('../../lib/page');
Page({
  data: { user: {}, gardens: [], error: '' },
  onShow() { this.refresh(); },
  refresh() { return load(this, s => { this.setData({ gardens: service.core.gardens(s).map(g => Object.assign({}, g, { ownerName: (service.core.USERS.find(u => u.id === g.ownerId) || {}).name })) }); }); },
  add() { form('garden'); },
  edit(e) { form('garden', 'id=' + e.currentTarget.dataset.id); },
  farming(e) { form('farming', 'gardenId=' + e.currentTarget.dataset.id); },
  harvest(e) { form('harvest', 'gardenId=' + e.currentTarget.dataset.id); },
  records(e) { wx.navigateTo({ url: '/pages/records/index?gardenId=' + e.currentTarget.dataset.id }); }
});
