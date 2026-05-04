import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, theme } from 'antd';
import {
  DashboardOutlined,
  CloudServerOutlined,
  LogoutOutlined,
  OrderedListOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useStore } from '@/store';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '概览' },
  { key: '/datacenters', icon: <CloudServerOutlined />, label: '机房管理' },
  { key: '/racks', icon: <OrderedListOutlined />, label: '机柜列表' },
  { key: '/users', icon: <UserOutlined />, label: '用户管理' },
  {
    key: 'settings',
    icon: <SettingOutlined />,
    label: '系统配置',
    children: [
      { key: '/devicetypes', label: '设备类型' },
      { key: '/hwmodels', label: '硬件型号' },
      { key: '/audit', label: '审计日志' },
      { key: '/templates', label: '设备模板' },
    ],
  },
];

const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useStore();
  const { token: { colorBgContainer } } = theme.useToken();

  const currentKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1];

  const openKeys = ['settings'].filter(k => ['/devicetypes', '/hwmodels', '/audit', '/templates'].includes(currentKey));

  return (
    <Layout style={{ height: '100vh', overflow: 'hidden' }}>
      <Sider width={220} style={{ background: colorBgContainer, overflow: 'hidden' }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, borderBottom: '1px solid #f0f0f0' }}>
          机柜管理系统
        </div>
        <Menu
          mode="inline"
          selectedKeys={[currentKey]}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={({ key }) => { if (key !== 'settings') navigate(key); }}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ background: colorBgContainer, padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <span />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>{user?.realName || user?.username} ({user?.role === 'ADMIN' ? '管理员' : '查看者'})</span>
            <Button type="text" icon={<LogoutOutlined />} onClick={logout}>退出</Button>
          </div>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: colorBgContainer, borderRadius: 8, minHeight: 280, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
