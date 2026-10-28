const service = require('./service');
async function load(page, render) {
  try {
    const state = await service.load(), user = service.core.user(state);
    if (!user) { wx.reLaunch({ url: '/pages/login/index' }); return; }
    page.setData({ user, error: '', loading: false });
    await render(state, user);
  } catch (e) { page.setData({ loading: false, error: e.message || '加载失败，请重试' }); }
}
function form(kind, extra) { wx.navigateTo({ url: '/pages/form/index?kind=' + kind + (extra ? '&' + extra : '') }); }
module.exports = { service, load, form };
