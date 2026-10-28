/* Shared domain logic. Native WeChat, browser preview and cloud function use this file. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Matcha = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = 1;
  const USERS = [
    { id: 'farmer-1', role: 'farmer', name: '张秀英', subtitle: '江口县 · 太平镇', initials: '张' },
    { id: 'farmer-2', role: 'farmer', name: '陈国华', subtitle: '印江县 · 缠溪镇', initials: '陈' },
    { id: 'farmer-3', role: 'farmer', name: '杨春兰', subtitle: '石阡县 · 龙塘镇', initials: '杨' },
    { id: 'factory-1', role: 'factory', name: '梵净抹茶加工中心', subtitle: '生产与收购管理', initials: '梵' }
  ];
  const clone = x => JSON.parse(JSON.stringify(x));
  function today() { return new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10); }
  function monthShift(month, delta) { const d = new Date(month + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + delta); return d.toISOString().slice(0, 7); }
  function dateShift(date, delta) { const d = new Date(date + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + delta); return d.toISOString().slice(0, 10); }
  function id(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9); }
  function ensure(test, message) { if (!test) throw new Error(message); }
  function num(v, label, max) { const n = Number(v), rounded = Math.round(n * 100) / 100; ensure(String(v).trim() !== '' && Number.isFinite(n) && rounded > 0 && n <= (max || 1e8), label + '须为至少 0.01 的有效数字'); return rounded; }
  function str(v, label, max) { const s = String(v == null ? '' : v).trim(); ensure(s && s.length <= (max || 100), label + '不能为空且不能超过 ' + (max || 100) + ' 字'); return s; }
  function validDate(v) { ensure(/^\d{4}-\d{2}-\d{2}$/.test(v || ''), '请选择有效日期'); const d = new Date(v + 'T00:00:00Z'); ensure(Number.isFinite(+d) && d.toISOString().slice(0, 10) === v, '日期不存在'); return v; }
  function round(n) { return Math.round(n * 100) / 100; }
  function user(s) { return USERS.find(x => x.id === (s.session && s.session.userId)) || null; }
  function requireUser(s, role) { const u = user(s); ensure(u, '请先选择演示身份'); if (role) ensure(u.role === role, '当前身份没有此操作权限'); return u; }
  function gardens(s) { const u = requireUser(s); return s.gardens.filter(g => u.role === 'factory' || g.ownerId === u.id); }
  function gardenFor(s, gardenId, u) { const g = s.gardens.find(x => x.id === gardenId); ensure(g && (u.role === 'factory' || g.ownerId === u.id), '茶园不存在或无权访问'); return g; }
  function seed(baseDate) {
    const day = baseDate || today(), month = day.slice(0, 7), stamp = day + 'T08:00:00+08:00';
    const gs = [
      { id: 'garden-1', ownerId: 'farmer-1', name: '云雾一号茶园', location: '铜仁市江口县太平镇', area: 86, variety: '龙井43', altitude: 860, note: '春夏遮阴管理，人工采收。', status: '生长良好' },
      { id: 'garden-2', ownerId: 'farmer-2', name: '缠溪生态茶园', location: '铜仁市印江县缠溪镇', area: 65, variety: '福鼎大白', altitude: 720, note: '坡地茶园，重点管理土壤水分。', status: '生长良好' },
      { id: 'garden-3', ownerId: 'farmer-3', name: '龙塘春山茶园', location: '铜仁市石阡县龙塘镇', area: 42, variety: '中茶108', altitude: 980, note: '高海拔示范茶园。', status: '待巡园' }
    ];
    const series = [[980, 1020, 1085, 1120, 1180, 1230, 1290, 1340], [740, 780, 805, 850, 880, 925, 960, 1000], [520, 540, 565, 580, 610, 630, 665, 690]];
    const harvests = [];
    gs.forEach((g, j) => series[j].forEach((amount, i) => harvests.push({ id: 'history-' + j + '-' + i, gardenId: g.id, ownerId: g.ownerId, date: monthShift(month, i - 8) + '-18', amount, grade: '一级鲜叶', note: '模拟月度采收记录', orderId: '', createdAt: stamp })));
    return { version: VERSION, revision: 0, demo: true, seededAt: stamp, session: null, gardens: gs, harvests,
      farming: [
        { id: 'farming-1', gardenId: 'garden-1', ownerId: 'farmer-1', date: dateShift(day, -1), type: '巡园', note: '叶色均匀，未发现明显病虫害。', photos: [], createdAt: stamp },
        { id: 'farming-2', gardenId: 'garden-2', ownerId: 'farmer-2', date: dateShift(day, -2), type: '灌溉', note: '完成东侧地块补水，记录为人工填报。', photos: [], createdAt: stamp }
      ],
      orders: [
        { id: 'order-1', title: '秋季优质鲜叶收购', quantity: 2000, price: 8.6, deadline: dateShift(day, 5), grade: '一级鲜叶', note: '一芽二叶，采后及时送达加工中心。', status: 'open', createdAt: stamp, claims: [] },
        { id: 'order-2', title: '生态茶园定向采购', quantity: 1500, price: 9.2, deadline: dateShift(day, 9), grade: '特级鲜叶', note: '要求叶片完整，无明显机械损伤。', status: 'open', createdAt: stamp, claims: [{ id: 'claim-seed', ownerId: 'farmer-2', gardenId: 'garden-2', amount: 500, delivered: 0, createdAt: stamp }] }
      ]
    };
  }
  function gm11(values, steps) {
    const x = values.map(Number), n = x.length, horizon = steps == null ? 3 : steps;
    ensure(n >= 5 && n <= 24, 'GM(1,1) 需要 5–24 期连续、完整的历史月度数据');
    ensure(Number.isInteger(horizon) && horizon >= 1 && horizon <= 12, '预测期数应为 1–12');
    ensure(x.every(v => Number.isFinite(v) && v > 0), 'GM(1,1) 要求每期产量大于 0，缺失月份不能当作零产量');
    let sum = x[0], sz = 0, szz = 0, sy = 0, szy = 0;
    for (let i = 1; i < n; i++) { const z = -(sum + x[i] / 2); sum += x[i]; sz += z; szz += z * z; sy += x[i]; szy += z * x[i]; }
    const m = n - 1, det = szz * m - sz * sz;
    ensure(Math.abs(det) > 1e-10, '历史数据无法拟合，请检查采收数据');
    const a = (szy * m - sz * sy) / det, b = (szz * sy - sz * szy) / det;
    const predict = k => k === 1 ? x[0] : (Math.abs(a) < 1e-10 ? b : (x[0] - b / a) * Math.exp(-a * (k - 2)) * Math.expm1(-a));
    const fitted = x.map((_, i) => predict(i + 1)), forecast = Array.from({ length: horizon }, (_, i) => predict(n + i + 1));
    ensure(forecast.every(v => Number.isFinite(v) && v > 0 && v < 1e10), '模型输出不稳定，请检查数据趋势');
    const mape = fitted.slice(1).reduce((s, v, i) => s + Math.abs(v - x[i + 1]) / x[i + 1], 0) / m * 100;
    const lo = Math.exp(-2 / (n + 1)), hi = Math.exp(2 / (n + 1));
    const ratioPassed = x.slice(1).every((v, i) => x[i] / v > lo && x[i] / v < hi);
    const warnings = ['趋势外推未考虑季节、天气与病虫害，不作为收购承诺。'];
    if (!ratioPassed) warnings.unshift('级比检验未通过，模型适配性有限。');
    if (mape > 20) warnings.unshift('历史拟合误差较大，建议补充数据或更换模型。');
    return { a, b, fitted: fitted.map(round), forecast: forecast.map(round), mape: round(mape), ratioPassed, warnings };
  }
  function forecast(s, gardenId, now) {
    const u = requireUser(s); gardenFor(s, gardenId, u);
    const current = (now || today()).slice(0, 7), byMonth = {};
    s.harvests.filter(h => h.gardenId === gardenId && h.date.slice(0, 7) < current).forEach(h => { const key = h.date.slice(0, 7); byMonth[key] = round((byMonth[key] || 0) + h.amount); });
    const keys = Object.keys(byMonth).sort().slice(-8);
    ensure(keys.length >= 5, '至少需要 5 个月已结束月份的采收数据；当月数据不参与拟合');
    keys.forEach((key, i) => { if (i) ensure(key === monthShift(keys[i - 1], 1), '历史月份不连续，请补齐实际采收数据'); });
    ensure(keys[keys.length - 1] === monthShift(current, -1), '上月数据缺失，请先补齐再预测');
    const result = gm11(keys.map(k => byMonth[k]), 3);
    return Object.assign(result, { months: keys, values: keys.map(k => byMonth[k]), futureMonths: [1, 2, 3].map(i => monthShift(keys[keys.length - 1], i)), gardenId });
  }
  function summary(s) {
    const gs = gardens(s), ids = gs.map(g => g.id), u = requireUser(s), month = today().slice(0, 7);
    const hs = s.harvests.filter(h => ids.indexOf(h.gardenId) >= 0), fs = s.farming.filter(f => ids.indexOf(f.gardenId) >= 0);
    return { gardenCount: gs.length, area: round(gs.reduce((a, g) => a + g.area, 0)), monthAmount: round(hs.filter(h => h.date.slice(0, 7) === month).reduce((a, h) => a + h.amount, 0)),
      openOrders: s.orders.filter(o => o.status === 'open' && o.deadline >= today() && remaining(o) > 0).length,
      pendingDelivery: round(s.orders.reduce((sum, o) => sum + o.claims.filter(c => u.role === 'factory' || c.ownerId === u.id).reduce((a, c) => a + c.amount - c.delivered, 0), 0)),
      records: hs.map(h => Object.assign({ kind: '采收', label: h.amount + ' kg · ' + h.grade }, h)).concat(fs.map(f => Object.assign({ kind: f.type, label: f.note }, f))).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 8) };
  }
  function remaining(o) { return round(o.quantity - o.claims.reduce((a, c) => a + c.amount, 0)); }
  function orderViews(s) {
    const u = requireUser(s);
    return s.orders.slice().reverse().map(o => Object.assign({}, o, { remaining: remaining(o), expired: o.deadline < today(),
      delivered: round(o.claims.reduce((a, c) => a + c.delivered, 0)),
      mine: round(o.claims.filter(c => c.ownerId === u.id).reduce((a, c) => a + c.amount, 0)),
      myPending: round(o.claims.filter(c => c.ownerId === u.id).reduce((a, c) => a + c.amount - c.delivered, 0)),
      claims: o.claims.map(c => Object.assign({}, c, { ownerName: (USERS.find(x => x.id === c.ownerId) || {}).name || '农户', gardenName: (s.gardens.find(g => g.id === c.gardenId) || {}).name || '茶园' })) }));
  }
  function action(state, type, payload) {
    const s = clone(state), p = payload || {};
    if (type === 'login') { ensure(USERS.some(x => x.id === p.userId), '演示身份不存在'); s.session = { userId: p.userId }; return s; }
    if (type === 'logout') { s.session = null; return s; }
    const u = requireUser(s);
    if (type === 'saveGarden') {
      requireUser(s, 'farmer');
      const existing = p.id ? gardenFor(s, p.id, u) : null;
      const values = { name: str(p.name, '茶园名称', 40), location: str(p.location, '所在地', 100), area: num(p.area, '茶园面积', 100000), variety: str(p.variety, '茶树品种', 30), altitude: num(p.altitude, '海拔', 6000), note: String(p.note || '').slice(0, 300) };
      if (existing) Object.assign(existing, values); else s.gardens.push(Object.assign({ id: id('garden'), ownerId: u.id, status: '待巡园' }, values));
    } else if (type === 'addFarming') {
      requireUser(s, 'farmer'); const g = gardenFor(s, p.gardenId, u), date = validDate(p.date);
      ensure(date <= today(), '农事日期不能晚于今天');
      ensure(['巡园', '施肥', '灌溉', '除草', '遮阴', '病虫害检查'].indexOf(p.type) >= 0, '请选择农事类型');
      const photos = p.photos || [];
      ensure(Array.isArray(photos) && photos.length <= 3 && photos.every(x => typeof x === 'string' && x.length < 1400000 && /^(data:image\/(jpeg|png|webp);base64,|wxfile:|https?:|cloud:)/.test(x)), '图片格式无效，最多上传 3 张');
      s.farming.push({ id: id('farming'), gardenId: g.id, ownerId: u.id, date, type: p.type, note: str(p.note, '农事情况', 300), photos: photos.slice(), createdAt: new Date().toISOString() });
      g.status = p.type === '病虫害检查' ? '已检查' : '已记录农事';
    } else if (type === 'publishOrder') {
      requireUser(s, 'factory'); const deadline = validDate(p.deadline); ensure(deadline >= today(), '截止日期不能早于今天');
      s.orders.push({ id: id('order'), title: str(p.title, '订单名称', 40), quantity: num(p.quantity, '收购数量', 1e7), price: num(p.price, '收购单价', 10000), deadline, grade: str(p.grade, '品质要求', 30), note: str(p.note, '收购说明', 300), status: 'open', createdAt: new Date().toISOString(), claims: [] });
    } else if (type === 'acceptOrder') {
      requireUser(s, 'farmer'); const o = s.orders.find(x => x.id === p.orderId); ensure(o, '订单不存在');
      ensure(o.status === 'open' && o.deadline >= today(), '该订单已关闭或过期');
      const g = gardenFor(s, p.gardenId, u), amount = num(p.amount, '接单数量', 1e7);
      ensure(amount <= remaining(o), '接单数量超过剩余需求，请刷新订单');
      o.claims.push({ id: id('claim'), ownerId: u.id, gardenId: g.id, amount, delivered: 0, createdAt: new Date().toISOString() });
    } else if (type === 'closeOrder') {
      requireUser(s, 'factory'); const o = s.orders.find(x => x.id === p.orderId); ensure(o, '订单不存在'); o.status = 'closed';
    } else if (type === 'addHarvest') {
      requireUser(s, 'farmer'); const g = gardenFor(s, p.gardenId, u), date = validDate(p.date), amount = num(p.amount, '采收量', 1e7);
      ensure(date <= today(), '采收日期不能晚于今天');
      if (p.orderId) {
        const o = s.orders.find(x => x.id === p.orderId); ensure(o, '关联订单不存在');
        const claims = o.claims.filter(c => c.ownerId === u.id && c.gardenId === g.id);
        ensure(amount <= round(claims.reduce((a, c) => a + c.amount - c.delivered, 0)), '上报量超过该茶园在此订单的待交付量');
        let rest = amount; claims.forEach(c => { const n = Math.min(rest, round(c.amount - c.delivered)); c.delivered = round(c.delivered + n); rest = round(rest - n); });
      }
      s.harvests.push({ id: id('harvest'), gardenId: g.id, ownerId: u.id, date, amount, grade: str(p.grade, '鲜叶等级', 30), note: String(p.note || '').slice(0, 300), orderId: p.orderId || '', createdAt: new Date().toISOString() });
    } else throw new Error('不支持的操作：' + type);
    s.revision += 1;
    return s;
  }
  function project(s) {
    const out = clone(s), u = requireUser(s);
    if (u.role === 'farmer') { out.gardens = out.gardens.filter(x => x.ownerId === u.id); out.farming = out.farming.filter(x => x.ownerId === u.id); out.harvests = out.harvests.filter(x => x.ownerId === u.id); out.orders.forEach(o => { o.claims = o.claims.map(c => c.ownerId === u.id ? c : Object.assign({}, c, { ownerId: 'other', gardenId: 'other' })); }); }
    return out;
  }
  return { VERSION, USERS, clone, today, dateShift, monthShift, seed, user, gardens, summary, remaining, orderViews, gm11, forecast, action, project, round };
});
