import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Select, Popconfirm, message, Tag, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '@/api/client';
import type { User } from '@/types';

const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    api.get('/users').then(({ data }) => {
      setUsers(data.data || data);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    form.resetFields();
    form.setFieldValue('role', 'VIEWER');
    setModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({ realName: user.realName, role: user.role });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingUser) {
      await api.put(`/users/${editingUser.id}`, {
        realName: values.realName,
        role: values.role,
        password: values.password || undefined,
      });
      message.success('用户已更新');
    } else {
      await api.post('/users', values);
      message.success('用户创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/users/${id}`);
    message.success('用户已删除');
    load();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '姓名', dataIndex: 'realName', key: 'realName', render: (v: string) => v || '-' },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>{role === 'ADMIN' ? '管理员' : '查看者'}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: User) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="用户管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建用户
        </Button>
      }
    >
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} locale={{ emptyText: <Empty description="暂无用户" /> }} />

      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          {!editingUser && (
            <Form.Item name="username" label="用户名" rules={[{ required: true, min: 2, max: 32 }]}>
              <Input />
            </Form.Item>
          )}
          <Form.Item
            name="password"
            label="密码"
            rules={editingUser ? undefined : [{ required: true, min: 4, max: 64 }]}
          >
            <Input.Password placeholder={editingUser ? '留空则不修改' : ''} />
          </Form.Item>
          <Form.Item name="realName" label="姓名">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="VIEWER">
            <Select>
              <Select.Option value="ADMIN">管理员</Select.Option>
              <Select.Option value="VIEWER">查看者</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default UserList;
