# Rack Manager - 机柜资产管理系统

机房机柜设备资产管理与可视化系统。

## 技术栈

- **后端**: NestJS 10 + Prisma ORM + SQLite
- **前端**: React 18 + TypeScript + Vite + Ant Design
- **认证**: JWT

## 快速开始

### 1. 配置环境变量

```bash
cd backend
cp .env.example .env
# 编辑 .env 修改 JWT_SECRET
```

### 2. 初始化数据库

```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
```

### 3. 启动后端

```bash
npm run dev
# 运行在 http://localhost:3000
# Swagger 文档: http://localhost:3000/api/docs
```

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
# 运行在 http://localhost:5173
```

### 5. 登录

使用种子数据中的管理员账号登录。

## 功能

- 机房/排/机柜层级管理
- 设备 CRUD 与 U 位可视化
- 设备硬件信息管理（CPU、内存、存储、网卡）
- 拖拽调整设备 U 位位置
- 用户管理与角色权限（管理员/查看者）
- 操作审计日志
- JWT 身份认证

## API 文档

启动后端后访问 `http://localhost:3000/api/docs` 查看 Swagger API 文档。
