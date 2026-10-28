# 微信云开发配置

本地模式已经可以演示完整流程。以下配置用于让多个真实微信账号共享同一份演示数据。需要自己拥有的小程序 AppID 和微信云开发环境；本工程目前没有绑定任何云账号。

## 准备工程

1. 在微信开发者工具导入项目，填写自己的 AppID。
2. 开通云开发并创建环境，记下环境 ID。
3. 在 `miniprogram/config.js` 配置：

```javascript
module.exports = { mode: 'cloud', env: '你的云环境ID' };
```

4. 运行 `node scripts/prepare-cloud.js`，确保云函数中的 `core.js` 与小程序一致。
5. 确认 `cloudfunctions/` 已选择相同云环境，然后上传并部署 `matchaApi`，选择云端安装依赖。

云函数依赖在自己的 `package.json` 中，浏览器预览和本地小程序不需要安装该依赖。

## 配置身份

在云函数环境变量中添加 `MATCHA_IDENTITIES`，值为一个 JSON 对象：

```json
{
  "加工厂管理员的真实OPENID": "factory-1",
  "农户甲的真实OPENID": "farmer-1",
  "农户乙的真实OPENID": "farmer-2",
  "农户丙的真实OPENID": "farmer-3"
}
```

OPENID 由同一小程序环境中的微信账号产生，请通过你自己的账号管理流程获取。不要将该映射加入客户端代码或公开仓库。多个微信账号可以映射到同一演示身份，但演示时最好一人一个身份。

云函数使用 `cloud.getWXContext().OPENID` 识别调用者。没有映射的微信账号会收到“尚未分配身份”。客户端传入的 `userId` 不决定云端权限。云模式不提供本地演示身份切换或重置。

## 建库与访问控制

1. 在云数据库中手动创建集合 `matcha_state`。
2. 集合权限设置为客户端读写均禁止。所有数据访问通过云函数执行，服务端按角色返回可见信息。
3. 云存储使用仅创建者可直接读写的规则。农户上传自己的照片；加工厂通过云函数为其有权限查看的台账照片生成临时 URL。

本 Demo 将业务聚合存储在 `matcha_state/demo`，字段对应原方案中的表：

| 字段 | 对应业务表 | 主要字段 |
| --- | --- | --- |
| gardens | 茶园信息 | id、ownerId、name、area、variety、altitude |
| farming | 农事记录 | gardenId、ownerId、date、type、note、photos |
| orders | 收购订单 | quantity、price、deadline、status、claims |
| harvests | 采收记录 | gardenId、ownerId、date、amount、orderId |

采用单个聚合文档是为了让这个小规模 Demo 的接单额度和交付登记在同一事务里更新。它适合几位演示账号，数据量较大时需拆分为集合、增加分页和独立账号管理。请通过页面操作业务数据，避免直接在控制台修改内部字段。

## 初始化

完成配置并部署后，用映射为 `factory-1` 的微信账号在开发者工具调试器调用：

```javascript
wx.cloud.callFunction({
  name: 'matchaApi',
  data: { type: 'bootstrap' }
}).then(console.log)
```

仅管理员可以初始化；如果数据已经存在，调用会拒绝覆盖。初始化返回 `result.ok: true` 后重新编译或进入工作台。

本地测试云函数时要提供真实账号上下文，否则 `getWXContext()` 无法得到有映射的 OPENID。请用开发者工具或真机从小程序调用。

## 云模式验收

1. 管理员可看到三个茶园；每位农户只能看到自己的茶园和记录。
2. 管理员发布订单，农户刷新订单页后可见。
3. 两位农户接同一笔订单，接单总量不能超过需求量。
4. 农户上报关联订单的采收后，管理员能看到已报交付量。
5. 农户上传照片，关闭页面后重新进入仍可查看；管理员也可查看对应台账照片。
6. 未映射微信账号无法获得数据，直接调用客户端数据库 API 无法访问集合。

事务、身份和图片 URL 代码已提供；由于尚无你的 AppID、云环境与真实账号，以上云端验收还需在接入后完成。

## 接口

统一调用 `wx.cloud.callFunction({name:'matchaApi',data:{type,payload}})`。

| type | 身份 | 用途 |
| --- | --- | --- |
| snapshot | 已映射账号 | 读取当前身份可见数据 |
| bootstrap | factory | 首次初始化模拟数据 |
| saveGarden | farmer | 新建、编辑自己的茶园 |
| addFarming | farmer | 保存农事和云图片引用 |
| publishOrder | factory | 发布收购需求 |
| acceptOrder | farmer | 按数量接单 |
| addHarvest | farmer | 记录采收并登记交付 |
| closeOrder | factory | 停止新增接单 |

每次响应形如 `{ok:true,state:{...}}` 或 `{ok:false,error:'说明'}`。云照片存储路径含身份 ID，服务端只接受当前身份路径下的图片，且只为已授权查看的农事记录生成临时 URL。

参考入口：[微信开发者文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)、[腾讯云开发文档](https://docs.cloudbase.net/)。
