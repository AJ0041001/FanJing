const service = require('../../lib/service');
Page({
  data: { users: service.core.USERS, mode: service.config.mode, busy: false, error: '' },
  async choose(e) {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '' });
    try { await service.run('login', { userId: e.currentTarget.dataset.id }); wx.switchTab({ url: '/pages/home/index' }); }
    catch (e) { this.setData({ error: e.message || '进入失败' }); }
    finally { this.setData({ busy: false }); }
  },
  async cloudLogin() {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '' });
    try { await service.load(); wx.switchTab({ url: '/pages/home/index' }); }
    catch (e) { this.setData({ error: e.message || '云环境不可用，请检查配置' }); }
    finally { this.setData({ busy: false }); }
  }
});
