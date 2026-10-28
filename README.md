# 梵净抹茶茶园管理小程序

一个面向茶园农户和加工厂的微信小程序演示工程，包含茶园档案、农事记录、采收上报、收购订单和产量趋势预测。初始数据为模拟数据。

## 工程内容

- `miniprogram/`：微信原生小程序页面和业务代码。
- `cloudfunctions/matchaApi/`：可选 CloudBase 云函数示例。
- `web/`、`server.js`：浏览器演示。
- `docs/`：演示、云开发和验证说明。
- `data/`：示例数据。

## 导入微信开发者工具

1. 安装并打开[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 选择“导入项目”，项目目录选择仓库根目录。`project.config.json` 已将小程序代码目录设为 `miniprogram/`。
3. 使用你有权限的小程序 AppID 登录并导入。
4. 点“编译”运行。默认 `miniprogram/config.js` 为本地演示模式，数据保存在当前设备。

## 浏览器演示

需要 Node.js 18 或更高版本，在仓库根目录运行：

```sh
node server.js
```

然后访问 `http://127.0.0.1:4173`。

在线演示：[梵净抹茶](https://fanjing-matcha-demo.decentknoll2.chatgpt.site/)

## 多人共享数据

工程包含 CloudBase 接口示例，但尚未部署到实际云环境。接入步骤和账号映射说明见 [`docs/CLOUD_SETUP.md`](docs/CLOUD_SETUP.md)。不要把 `AppSecret`、云函数身份映射或本地私有配置提交到仓库。
