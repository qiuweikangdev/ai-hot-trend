# 登录态首屏同步与登录检查优化技术方案报告

## 1. 背景

本次优化主要解决了两个连续出现的登录体验问题：

1. 每次点击登录弹窗，都会长时间显示“正在检查会话”。
2. 用户已经处于登录状态时，刷新页面首屏会先显示“未登录”，过一会才切换为“已登录”。

这两个问题虽然表现不同，但都和登录态获取时机有关。

## 2. 现象与根因

### 2.1 问题一：每次打开登录弹窗都重新检查会话

#### 现象

- 用户点击“登录”按钮后，弹窗中反复出现“正在检查会话”。
- 即使用户刚刚打开过弹窗，再次打开时仍然会重新等待。

#### 根因

登录弹窗内部组件 `LoginPanel` 在挂载时也调用了一次 `authClient.useSession()`。

而页面外层 `useTrendDashboard()` 已经在维护一次登录态。  
结果就是：

- 页面外层有一份 session 请求。
- 弹窗内层又发起一份新的 session 请求。
- 每次打开弹窗时，`LoginPanel` 重新挂载，重新进入 pending。

这属于重复请求和重复状态检查。

### 2.2 问题二：刷新页面后先显示未登录，再变成已登录

#### 现象

- 用户明明已经登录。
- 刷新页面后，首屏先按“未登录”渲染。
- 等客户端请求 session 完成后，界面才修正成“已登录”。

#### 根因

首页最初是纯客户端判断登录态：

- 首页渲染 `TrendDashboard`
- `TrendDashboard` 调用 `useTrendDashboard()`
- `useTrendDashboard()` 内部通过 `authClient.useSession()` 在浏览器端异步获取 session

这意味着首屏 HTML 输出时并不知道用户是否已登录。  
服务端先输出了一个“默认未登录”的界面，浏览器 hydration 后再异步请求 session，最终才切换为“已登录”。

本质上，这是一个典型的“首屏缺少服务端登录态快照”问题。

## 3. 当前登录链路说明

### 3.1 从点击 GitHub 登录到变成已登录的过程

1. 前端点击 GitHub 登录。
2. `src/lib/auth-social.ts` 中调用 `authClient.signIn.social()`。
3. 用户跳转到 GitHub OAuth 授权页。
4. GitHub 授权成功后，回调到 Better Auth 的 `/api/auth/callback/github`。
5. 项目中的 Hono 路由把 `/api/auth/*` 转发给 Better Auth 处理。
6. Better Auth 使用 GitHub 返回的授权结果换取用户信息，并创建站内 session。
7. Better Auth 将 session 写入 cookie。
8. 后续请求通过 cookie 携带 session，服务端或客户端再通过 `getSession` / `useSession` 识别当前用户。

### 3.2 登录态真正是如何判断的

不是通过“是否刚从 GitHub 回调回来”判断，而是通过“当前请求里的 cookie 能否解析成有效 session”判断。

项目里有两种判断方式：

- 服务端判断：`getAuth().api.getSession({ headers })`
- 客户端判断：`authClient.useSession()`

说明：

- 单纯在前端读取 cookie 并不可靠。
- 原因是 session cookie 通常是 `httpOnly`，前端未必能直接读取。
- 即使读到了 cookie，也只能说明“存在 cookie”，不能保证“session 仍然有效”。
- 因此正确做法是让服务端基于请求头解析 session，客户端再用 Better Auth 的会话接口接管后续同步。

## 4. 解决方案

### 4.1 方案一：去掉弹窗内的重复会话检查

优化目标：

- 登录弹窗只负责展示登录入口。
- 会话状态只由页面外层统一维护。

具体做法：

- `LoginPanel` 不再自己调用 `useSession()`。
- 弹窗 `LoginModal` 直接复用页面外层已经拿到的 `session.isPending`。
- 如果外层会话仍在加载，则弹窗显示一次统一的 loading 卡片。
- 如果外层会话已经明确完成，则直接展示登录按钮。

优化后效果：

- 打开弹窗不会再额外触发一次 session 请求。
- 重复打开弹窗不会反复进入“正在检查会话”。

### 4.2 方案二：为首页注入服务端登录态快照

优化目标：

- 页面第一次渲染时就知道用户是否已登录。
- 刷新页面时不再先闪成未登录。

具体做法：

1. 新增服务端 session 读取模块 `src/server/auth/session.ts`
   - 在服务端通过 `getAuth().api.getSession()` 读取当前请求的 session
   - 只提取首页需要的最小用户信息快照

2. 首页 `src/app/page.tsx`
   - 在服务端渲染阶段先调用 `getServerSessionSnapshot()`
   - 将结果作为 `initialSession` 传给 `TrendDashboard`

3. `TrendDashboard`
   - 接收 `initialSession`
   - 继续传给 `useTrendDashboard(initialSession)`

4. `useTrendDashboard`
   - 仍保留 `authClient.useSession()` 作为客户端真实会话来源
   - 但在客户端 session 尚未解析完成前，优先使用服务端传入的 `initialSession`
   - 等客户端 session ready 后，再完全切换为 Better Auth 的实时会话结果

这样实现了“两段式接管”：

- 首屏：服务端快照兜底
- 后续：客户端会话实时接管

## 5. 关键改动点

### 5.1 新增文件

- `src/lib/auth-session.ts`
  - 定义登录态快照类型

- `src/server/auth/session.ts`
  - 提供服务端读取当前会话的能力

### 5.2 修改文件

- `src/app/page.tsx`
  - 首页改为服务端先读取 session，再把快照传入 dashboard

- `src/components/trends/trend-dashboard.tsx`
  - 接收 `initialSession`

- `src/components/trends/dashboard/use-trend-dashboard.ts`
  - 融合服务端快照和客户端 `useSession()`
  - 收藏依赖也改为基于稳定的 `userId`

- `src/components/trends/dashboard/login-modal.tsx`
  - 改为复用页面外层的 session pending 状态

- `src/components/auth/login-panel.tsx`
  - 去掉内部重复 `useSession()`
  - 只保留登录入口和 provider 状态读取逻辑

## 6. 优化后的页面行为

### 6.1 登录弹窗

优化前：

- 每次打开弹窗都可能重新检查 session

优化后：

- 外层 session 已经明确时，打开弹窗直接显示登录入口
- 不再因为弹窗重复挂载而触发新的会话检查

### 6.2 刷新页面

优化前：

- 首屏先显示未登录
- 客户端请求完成后再切换为已登录

优化后：

- 服务端首屏就能读取当前登录态
- 刷新页面时直接按已登录状态渲染
- 客户端再无缝接管后续会话同步

## 7. 技术收益

本次方案带来的收益主要有：

- 减少重复的 session 请求
- 缩短登录弹窗等待时间
- 消除刷新后的登录态闪烁
- 让登录态判断职责更清晰
- 为后续接入更多需要用户态的功能提供稳定基础

## 8. 代价与取舍

本次修复有一个明确 tradeoff：

- 首页 `/` 不再是纯静态首屏，而是动态渲染页面

原因：

- 需要在服务端根据当前请求的 cookie 读取 session
- 这样才能保证首屏登录态正确

这是一个合理取舍，因为首页登录态正确性比静态化更重要。

## 9. 验证结果

已完成以下验证：

- `pnpm.cmd exec eslint ...` 通过
- `pnpm.cmd build` 通过

构建结果中首页 `/` 已按预期变为动态渲染页面。

## 10. 结论

本次问题的本质不是“登录失效”，而是“登录态判断时机不对”。

最终方案分为两层：

1. 去掉弹窗内部的重复 session 检查，避免多次 pending。
2. 在首页首屏注入服务端 session 快照，避免刷新后先显示未登录。

这样既保留了 Better Auth 的标准会话机制，又把登录体验从“异步修正”改成了“首屏即正确”。
