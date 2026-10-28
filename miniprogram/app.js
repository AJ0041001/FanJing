const config = require('./config');
App({
  onLaunch() {
    if (config.mode === 'cloud' && config.env) wx.cloud.init({ env: config.env, traceUser: true });
  }
});
