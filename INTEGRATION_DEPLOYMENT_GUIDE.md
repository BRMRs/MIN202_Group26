# 集成分支部署指南

## 分支信息

- **集成分支**: `feature/integration-v2`
- **远程仓库**: https://github.com/BRMRs/MIN202_Group26
- **PR 链接**: https://github.com/BRMRs/MIN202_Group26/pull/new/feature/integration-v2

---

## 一、我做了哪些工作

### 1. 代码集成
- 合并了 Module A、B、C、D、E 五个模块
- 统一了 JWT 认证（Module B、C 从自定义 headers 迁移到标准 JWT）
- 修复了前后端 API 调用（Module E 前端 API 改用 axios）
- 修复了若干编译错误（entity 字段映射、security 配置等）

### 2. 禁用了有问题的组件
- `ModuleDTestDataSeeder.java` - 该 seeder 会插入测试数据但引用了不存在的 user_id，导致外键约束错误启动失败

### 3. 修复了 admin 密码
- 原 `database/init.sql` 中的 BCrypt hash 与 `admin123` 不匹配
- 已更新为正确的 hash

---

## 二、团队成员操作步骤

### 步骤 1：拉取最新代码

```bash
git fetch origin
git checkout feature/integration-v2
git pull origin feature/integration-v2
```

### 步骤 2：重新初始化数据库（重要！）

⚠️ **必须执行**，否则会遇到外键约束错误和登录失败。

```bash
# 2.1 登录 MySQL
mysql -u root -p'Heritage@2026'

# 2.2 删除并重建数据库
DROP DATABASE IF EXISTS heritage_db;
CREATE DATABASE heritage_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;

# 2.3 初始化数据库结构
mysql -u root -p'Heritage@2026' heritage_db < database/init.sql
```

### 步骤 3：重新编译后端

```bash
cd backend
./mvnw clean compile
```

### 步骤 4：启动后端

```bash
cd backend
./mvnw spring-boot:run
```

后端运行在: **http://localhost:8080**

### 步骤 5：启动前端

```bash
cd frontend
npm install   # 首次运行需要
npm run dev
```

前端运行在: **http://localhost:5173**

### 步骤 6：登录测试

访问 http://localhost:5173/login

| 账号 | 用户名 | 密码 | 角色 |
|------|--------|------|------|
| 管理员 | `admin` | `admin123` | ADMIN |
| 贡献者 | `contributor_demo` | `（注册新账号或自行设置）` | CONTRIBUTOR |

---

## 三、各角色功能对应路由

| 路由 | 功能 | 所需角色 |
|------|------|----------|
| `/` | 首页 | 公开 |
| `/search` | 搜索 | 公开 |
| `/resources/:id` | 资源详情 | 公开 |
| `/login` | 登录 | 公开 |
| `/register` | 注册 | 公开 |
| `/profile` | 个人资料 | 登录用户 |
| `/apply-contributor` | 申请成为贡献者 | 登录用户 |
| `/module-b/submit` | 提交资源 | CONTRIBUTOR |
| `/module-b/drafts` | 草稿箱 | CONTRIBUTOR |
| `/module-b/review` | 资源审核 | ADMIN |
| `/reviews` | 审核面板 | ADMIN |
| `/reviews/:resourceId` | 资源审核详情 | ADMIN |
| `/admin/users` | 用户管理 | ADMIN |
| `/admin/categories` | 分类管理 | ADMIN |
| `/admin/tags` | 标签管理 | ADMIN |
| `/admin/resources` | 资源管理 | ADMIN |

---

## 四、已知问题和解决方案

### Q1: 启动时报外键约束错误

**原因**: `ModuleDTestDataSeeder` 尝试插入测试数据但引用了不存在的用户。

**解决**: 已在代码中禁用该组件（`@Component` 已注释），首次部署后不需要再启用。

### Q2: admin 账号登录失败

**原因**: 数据库中的密码 hash 与 `admin123` 不匹配。

**解决**: 重新执行步骤 2（数据库初始化），已包含正确的 hash。

### Q3: 前端构建失败

**解决**:

```bash
cd frontend
rm -rf node_modules
npm install
npm run build
```

---

## 五、注意事项

1. **不要合并到 main 分支** - 请先在 `feature/integration-v2` 分支测试所有功能，确认无误后再合并
2. **保持原始分支** - 所有模块的原始分支都保留在 remote
3. **数据库初始化是必须的** - 每次切换到新集成版本时都需要重新初始化数据库

---

## 六、后续测试建议

测试清单：
- [ ] 注册新用户并登录
- [ ] 申请成为 CONTRIBUTOR
- [ ] ADMIN 审核通过 CONTRIBUTOR 申请
- [ ] CONTRIBUTOR 提交资源
- [ ] ADMIN 审核资源
- [ ] 资源审核通过后在前端首页查看
- [ ] 搜索功能
- [ ] 分类/标签管理（ADMIN）
- [ ] 资源管理（ADMIN）
