const core = require('./core');
const config = require('../config');
const KEY = 'fanjing-matcha-v1';
let cached = null;
async function remote(type, payload) {
  const response = await wx.cloud.callFunction({ name: 'matchaApi', data: { type, payload: payload || {} } });
  const result = response.result;
  if (!result || !result.ok) throw new Error(result && result.error || '云服务暂不可用');
  cached = result.state;
  return cached;
}
module.exports = {
  core, config,
  async load() {
    if (config.mode === 'cloud') return remote('snapshot');
    const stored = wx.getStorageSync(KEY);
    cached = stored && stored.version === core.VERSION ? stored : core.seed();
    if (!stored || stored.version !== core.VERSION) wx.setStorageSync(KEY, cached);
    return cached;
  },
  async run(type, payload) {
    if (config.mode === 'cloud') return remote(type, payload);
    const source = wx.getStorageSync(KEY) || core.seed();
    const next = core.action(source, type, payload);
    wx.setStorageSync(KEY, next); cached = next;
    return next;
  },
  async reset() {
    if (config.mode === 'cloud') throw new Error('云模式请由管理员在数据库管理演示数据');
    const next = core.seed(); wx.setStorageSync(KEY, next); cached = next; return next;
  },
  async photo() {
    const selected = await new Promise((resolve, reject) => wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], sizeType: ['compressed'], success: resolve, fail: reject }));
    const path = selected.tempFiles[0].tempFilePath;
    if (config.mode === 'cloud') {
      const ext = /\.(png|webp)$/i.test(path) ? path.split('.').pop() : 'jpg';
      if (!cached || !cached.session) throw new Error('请先进入工作台');
      const result = await wx.cloud.uploadFile({ cloudPath: 'farming/' + cached.session.userId + '/' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext, filePath: path });
      return result.fileID;
    }
    const saved = await new Promise((resolve, reject) => wx.getFileSystemManager().saveFile({ tempFilePath: path, success: resolve, fail: reject }));
    return saved.savedFilePath;
  },
  async imageUrl(path) {
    if (path.indexOf('cloud://') !== 0) return path;
    if (cached && cached.imageUrls && cached.imageUrls[path]) return cached.imageUrls[path];
    const r = await wx.cloud.getTempFileURL({ fileList: [path] });
    if (!r.fileList[0] || r.fileList[0].status !== 0) throw new Error('图片暂不可用');
    return r.fileList[0].tempFileURL;
  }
};
