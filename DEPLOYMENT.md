# ManifestHub 部署上线指南

> 单栈：**Vercel**（前端 + Serverless API）+ **Firebase**（Auth + Firestore）+ **Lemonsqueezy**（订阅支付）

---

## 总览：哪个变量在哪？

| 用在哪里 | 类型 | 变量 |
|---|---|---|
| 浏览器端（Vite 打包进 bundle） | `VITE_` 开头 | Firebase Web SDK 的 7 项 |
| Vercel Serverless（仅服务端） | **不带** `VITE_` 前缀 | LS 的 4 项 + Firebase Admin 的 3 项 |
| Firebase Console | — | Firestore Rules / Indexes（通过 `firebase deploy` 推送） |
| Lemonsqueezy Console | — | 商品 / 变体 / Webhook URL + 签名密钥 |

服务端变量**不要**加 `VITE_` 前缀 —— 否则会被 Vite 打包到浏览器，泄露 API key。

---

## 1. Lemonsqueezy 配置

### 1.1 拿到 API Key
进入 LS Dashboard → **Settings → API → Create API key**
- 命名 `manifest-hub-prod`
- 权限默认全选即可
- **立即复制**（页面只显示一次），保存为 `LEMON_SQUEEZY_API_KEY`

### 1.2 找到 Store ID
LS Dashboard 顶部 store 切换器旁，URL 形如 `app.lemonsqueezy.com/dashboard/<STORE_ID>`，那串数字就是 `LEMON_SQUEEZY_STORE_ID`（也可在 Settings → Stores 看到）。

### 1.3 确认 Variant ID
你已提供测试用的 `LEMON_SQUEEZY_VARIANT_ID = 1847625`。
> 上线前别忘了把这个换成生产 variant，并把测试订阅取消。

### 1.4 创建 Webhook（**最后一步做**，因为需要 Vercel 域名）
LS Dashboard → **Settings → Webhooks → + Webhook**
- **Callback URL**：`https://<你的-vercel-域名>/api/lemonsqueezy-webhook`
- **Signing secret**：随便生成一段长随机字符串（如用 `openssl rand -hex 32`），复制下来作为 `LEMON_SQUEEZY_SIGNATURE_SECRET`
- **Events**：勾选所有 `subscription_*` 事件：
  - `subscription_created`
  - `subscription_updated`
  - `subscription_cancelled`
  - `subscription_resumed`
  - `subscription_expired`
  - `subscription_paused`
  - `subscription_unpaused`
  - `subscription_payment_success`
  - `subscription_payment_failed`
  - `subscription_payment_recovered`
- 保存后用 LS 自带的 "Send test" 按钮先测一发，看 Vercel function logs 是否 200 OK。

---

## 2. Firebase Service Account（给 Serverless API 用的服务端凭证）

后端 API（`/api/create-checkout` 和 `/api/lemonsqueezy-webhook`）需要用 Firebase Admin SDK 直接写 Firestore，绕过前端 rules。

1. Firebase Console → **Project Settings → Service Accounts → Generate new private key**
2. 下载 JSON 文件（妥善保管，不要提交到 git）
3. 从 JSON 中提取 3 个值：
   - `project_id` → `FIREBASE_PROJECT_ID`（应是 `manifest-hub`）
   - `client_email` → `FIREBASE_CLIENT_EMAIL`（如 `firebase-adminsdk-xxxxx@manifest-hub.iam.gserviceaccount.com`）
   - `private_key` → `FIREBASE_PRIVATE_KEY`：这是一段 PEM 文本，多行。**粘到 Vercel 时把字面换行替换成 `\n`**，结果应该长这样（一长串）：
     ```
     -----BEGIN PRIVATE KEY-----\nMIIEvAI...\n...\n-----END PRIVATE KEY-----\n
     ```

---

## 3. Vercel 配置

### 3.1 关联仓库
Vercel Dashboard → **Add New Project** → 选你的 GitHub 仓库 → **Root Directory** 选 `frontend/`（如果项目根不是 frontend，改为对应路径）。

Framework Preset 应自动识别为 **Vite**：
- Build Command: `pnpm run build`
- Output Directory: `dist`
- Install Command: `pnpm install`

### 3.2 环境变量（**Settings → Environment Variables**）

把下面 12 个变量都加上，Environment 都勾 **Production / Preview / Development**：

| Name | Value | 来源 |
|---|---|---|
| `VITE_API_KEY` | `AIzaSyB4Notm…` | 你 `.env` 已有 |
| `VITE_AUTH_DOMAIN` | `manifest-hub.firebaseapp.com` | 同上 |
| `VITE_PROJECT_ID` | `manifest-hub` | 同上 |
| `VITE_STORAGE_BUCKET` | `manifest-hub.firebasestorage.app` | 同上 |
| `VITE_MESSAGING_SENDER_ID` | `941010687010` | 同上 |
| `VITE_APP_ID` | `1:941010687010:web:…` | 同上 |
| `VITE_MEASUREMENT_ID` | `G-DDVLV0FWE9` | 同上 |
| `LEMON_SQUEEZY_API_KEY` | （步骤 1.1 拿到） | LS API key |
| `LEMON_SQUEEZY_STORE_ID` | （步骤 1.2 数字） | LS store id |
| `LEMON_SQUEEZY_VARIANT_ID` | `1876398` | 你已提供 |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | （步骤 1.4 那段随机串） | webhook 签名 |
| `LEMON_SQUEEZY_HOST` | `https://api.lemonsqueezy.com` | 可选，留空也行 |
| `FIREBASE_PROJECT_ID` | `manifest-hub` | service account |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-…@manifest-hub.iam.gserviceaccount.com` | service account |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n` | service account |

### 3.3 部署
推送到 main 分支，或在 Vercel UI 点 **Deploy**。第一次部署完成后记下你的域名（如 `manifest-hub.vercel.app`），回到步骤 1.4 把 webhook URL 配上。

---

## 4. Firebase Firestore（一次性）

```bash
cd frontend
firebase login                   # 第一次需要
firebase use manifest-hub        # 关联到正确项目
firebase deploy --only firestore:rules,firestore:indexes
```

> Firestore 索引部署后会自动开始构建，约 1–5 分钟可用。

---

## 5. 上线前自测清单

部署完成后，按顺序验证：

### 5.1 前端基础
- [ ] 访问根域名能看到 Landing 页（包含 pricing 区域）
- [ ] 注册新账号 → 自动跳到 `/foundation/onboard`
- [ ] 完成 Foundation 6 步后 → 跳回 Dashboard，顶部能看到自己的 Identity Statement

### 5.2 API 健康
打开 Vercel Dashboard → **Deployments → Functions** → 看 `lemonsqueezy-webhook` 和 `create-checkout` 是否都列出。

### 5.3 完整支付流程
1. 在 Profile 页或侧边栏点 **Upgrade**
2. 浏览器应弹出 LS overlay（或新开 tab）显示 $99.99/年
3. 用 Lemonsqueezy 测试卡 `4242 4242 4242 4242`，过期日填未来任意，CVC 任意 → 完成支付
4. 几秒内 Vercel logs 应看到 `✓ subscription_created → <uid> → active`
5. 应用页面（`useSubscription` 监听 user doc onSnapshot）应**自动**变化：
   - 侧边栏徽章从 "Upgrade to Annual" 变 "Annual Member"
   - Reset 入口的 "Full" 卡变成 "Start 1-Day Reset"
   - Foundation history、Weekly reflection history 全部解锁

### 5.4 Webhook 签名失败排查
若 Vercel logs 看到 `Invalid signature on Lemonsqueezy webhook`：
- 检查 `LEMON_SQUEEZY_SIGNATURE_SECRET` 在 Vercel 和 LS webhook 设置里**完全一致**（多复制一次粘贴一次最容易出错的地方）
- LS Dashboard → Webhooks → 该 webhook → **History** 可以看到每次请求的 body / response，把那次 raw body 拿出来本地用同样的 HMAC 跑一遍对比

### 5.5 取消 / 续期测试
1. LS Dashboard → Subscriptions → 找到你的测试订阅 → **Cancel**
2. 几秒后 user doc 的 `subscriptionStatus` 应变成 `cancelled`，`subscriptionExpiresAt` 仍是远期 → UI 仍显示为已付费但 willCancel=true
3. 让它过期或在 LS 后台手动 expire → status 变 `expired` → UI 自动锁回 free 功能

---

## 6. 上线后建议

1. **替换测试 variant 为生产 variant**：在 LS 创建生产 product，把 `LEMON_SQUEEZY_VARIANT_ID` 换成新 ID
2. **绑定自定义域名**：Vercel → Domains → 加 `manifest-hub.com`，再回 LS webhook 改 URL
3. **打开 Firebase 计费监控**：免费 Firestore 配额（50K reads/day）开始可能不够，准备升级到 Blaze 套餐
4. **观察前 50 笔订阅**：用 LS Dashboard 的 events log 和 Vercel function logs 对照，确认每一笔都正确写入 Firestore

---

## 7. 常用调试命令

```bash
# 本地 Vercel API 调试（需要 vercel CLI 登录）
vercel dev

# 看 Function logs（生产）
vercel logs <deployment-url> --follow

# 重新部署 Firestore rules
firebase deploy --only firestore:rules

# 触发一次 webhook 重发（LS Dashboard → Webhook → History → Resend）
```

---

## 出问题就看这里

| 现象 | 排查 |
|---|---|
| 点 Upgrade 没反应 | 浏览器 console 看是否报 401 → 是不是没登录 / ID token 过期；或 500 → Vercel logs 看 LS API 报错 |
| LS overlay 弹出后点 Pay 报错 | 确认 variant 状态是 published，`LEMON_SQUEEZY_STORE_ID` 和该 variant 同一个 store |
| 支付完成但 UI 还显示 Free | Vercel logs 找 `subscription_created` —— 没收到说明 webhook 配置错；收到但 status 没更新说明 firestore 写失败（看错误） |
| `Invalid signature` | 99% 是 SIGNATURE_SECRET 复制粘贴空格 / 换行；重新生成一遍 |
| `Missing custom_data.uid` | 用户没经过 `/api/create-checkout` 而是直接访问 LS 商品页的话会出现 —— 这是预期行为，会被忽略 |
