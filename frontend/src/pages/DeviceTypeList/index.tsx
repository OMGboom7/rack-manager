import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, Popconfirm, message, ColorPicker } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '@/api/client';
import type { DeviceType } from '@/types';

const DeviceTypeList: React.FC = () => {
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<DeviceType | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    api.get('/devices/types/all').then(({ data }) => {
      setTypes(data.data || data);
    }).catch(() => {})
    .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingType(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (type: DeviceType) => {
    setEditingType(type);
    form.setFieldsValue({ name: type.name, color: type.color });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const color = typeof values.color === 'string' ? values.color : values.color?.toHexString?.() || '#4A90D9';
    const payload = { ...values, color };
    if (editingType) {
      await api.put(`/devices/types/${editingType.id}`, payload);
      message.success('设备类型已更新');
    } else {
      await api.post('/devices/types', payload);
      message.success('设备类型创建成功');
    }
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/devices/types/${id}`);
    message.success('已删除');
    load();
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '颜色',
      dataIndex: 'color',
      key: 'color',
      width: 80,
      render: (color: string) => (
        <div style={{ width: 24, height: 24, borderRadius: 4, background: color, border: '1px solid #d9d9d9' }} />
      ),
    },
    { title: '名称', dataIndex: 'name', key: 'name' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: DeviceType) => (
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
      title="设备类型管理"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新建类型
        </Button>
      }
    >
      <Table dataSource={types} columns={columns} rowKey="id" loading={loading} />

      <Modal
        title={editingType ? '编辑设备类型' : '创建设备类型'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="类型名称" rules={[{ required: true }]}>
            <Input placeholder="如: 服务器、交换机、防火墙" />
          </Form.Item>
          <Form.Item name="color" label="颜色" rules={[{ required: true }]}>
            <ColorPicker format="hex" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DeviceTypeList;
