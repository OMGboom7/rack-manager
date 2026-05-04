import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Tag, Row, Col } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import api from '@/api/client';
import type { DeviceTemplate } from '@/types';
import MultiEntry from '@/components/DeviceForm/MultiEntry';
import type { HwEntry } from '@/components/DeviceForm/MultiEntry';

const safeJson = (v: any) => typeof v === 'string' ? JSON.parse(v || '[]') : (v || []);

const TemplateList: React.FC = () => {
  const [data, setData] = useState<DeviceTemplate[]>([]);
  const [types, setTypes] = useState<{ id: number; name: string; color: string }[]>([]);
  const [hw, setHw] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeviceTemplate | null>(null);
  const [form] = Form.useForm();
  const cpuBrandId = Form.useWatch('cpuBrandId', form);
  const memBrandId = Form.useWatch('memBrandId', form);

  const load = async () => {
    setLoading(true);
    api.get('/devices/templates/all').then(({ data: res }) => setData(res.data || res)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      api.get('/devices/types/all'),
      api.get('/devices/metadata'),
    ]).then(([{ data: typesRes }, { data: meta }]) => {
      setTypes(typesRes.data || typesRes);
      setHw(meta);
    });
    load();
  }, []);

  const openCreate = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const openEdit = (t: DeviceTemplate) => {
    setEditing(t);
    const resolve = (json: string | undefined, models: any[]) => {
      const arr = safeJson(json);
      return arr.map((e: any) => {
        if (e.modelId && !e.brand) {
          const m = models.find((x: any) => x.id === e.modelId);
          return m ? { brand: m.brand, model: m.model, count: e.count, id: m.id, ...m } : e;
        }
        return e;
      });
    };
    form.setFieldsValue({
      name: t.name, brand: t.brand, model: t.model,
      heightU: t.heightU, deviceTypeId: t.deviceTypeId,
      cpuBrandId: t.cpuModel?.brand, cpuModelId: t.cpuModelId, cpuCount: t.cpuCount,
      memBrandId: t.memModel?.brand, memModelId: t.memModelId, memSize: t.memSize,
      storage: resolve(t.storage, hw.storageModels || []),
      nic: resolve(t.nic, hw.nicModels || []),
      description: t.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const simplify = (arr: any[]) => arr.map((e: any) => ({ modelId: e.id || e.modelId, model: e.model, count: e.count, speed: e.speed, capacity: e.capacity, capUnit: e.capUnit }));
    if (values.storage && Array.isArray(values.storage)) values.storage = JSON.stringify(simplify(values.storage));
    if (values.nic && Array.isArray(values.nic)) values.nic = JSON.stringify(simplify(values.nic));
    if (editing) {
      await api.put(`/devices/templates/${editing.id}`, values);
      message.success('模板已更新');
    } else {
      await api.post('/devices/templates', values);
      message.success('模板创建成功');
    }
    setModalOpen(false); form.resetFields(); load();
  };

  const handleDelete = async (id: number) => { await api.delete(`/devices/templates/${id}`); message.success('已删除'); load(); };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '品牌', dataIndex: 'brand', key: 'brand', render: (v: string) => v || '-' },
    { title: '型号', dataIndex: 'model', key: 'model', render: (v: string) => v || '-' },
    { title: 'U位', dataIndex: 'heightU', key: 'heightU', width: 60 },
    {
      title: 'CPU', key: 'cpu',
      render: (_: unknown, r: DeviceTemplate) =>
        r.cpuModel ? `${r.cpuModel.brand} ${r.cpuModel.model}${r.cpuCount ? ` x${r.cpuCount}` : ''}` : '-',
    },
    {
      title: '内存', key: 'mem',
      render: (_: unknown, r: DeviceTemplate) =>
        r.memModel ? `${r.memModel.brand} ${r.memModel.model}${r.memSize ? ` x${r.memSize}` : ''}` : '-',
    },
    {
      title: '类型', key: 'type',
      render: (_: unknown, r: DeviceTemplate) => r.deviceType ? <Tag color={r.deviceType.color}>{r.deviceType.name}</Tag> : '-',
    },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: unknown, r: DeviceTemplate) => (
        <Space>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(r.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title="设备模板管理" extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模板</Button>}>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" />

      <Modal title={editing ? '编辑模板' : '新建模板'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={620}>
        <Form form={form} layout="vertical" size="small">
          <Row gutter={16}>
            <Col span={10}><Form.Item name="name" label="模板名称" rules={[{ required: true }]}><Input placeholder="如: Dell R760" /></Form.Item></Col>
            <Col span={8}><Form.Item name="deviceTypeId" label="设备类型" rules={[{ required: true }]}>
              <Select placeholder="选择类型">{types.map(t => <Select.Option key={t.id} value={t.id}>{t.name}</Select.Option>)}</Select>
            </Form.Item></Col>
            <Col span={6}><Form.Item name="heightU" label="U位" rules={[{ required: true }]}><InputNumber min={1} max={60} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="brand" label="设备品牌"><Input placeholder="如: Dell" /></Form.Item></Col>
            <Col span={12}><Form.Item name="model" label="设备型号"><Input placeholder="如: PowerEdge R760" /></Form.Item></Col>
          </Row>

          <div style={{ borderTop: '1px solid #f0f0f0', margin: '4px 0 8px', paddingTop: 8, fontWeight: 600, fontSize: 13, color: '#1677ff' }}>硬件配置</div>

          <Row gutter={16}>
            <Col span={8}><Form.Item name="cpuBrandId" label="CPU品牌">
              <Select placeholder="品牌" allowClear showSearch
                onChange={() => form.setFieldValue('cpuModelId', undefined)}
                filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
                options={(hw.cpuBrands || []).map((b: string) => ({ value: b, label: b }))}
              />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="cpuModelId" label="CPU型号">
              <Select placeholder={cpuBrandId ? `${cpuBrandId} 型号` : '先选品牌'} showSearch allowClear disabled={!cpuBrandId}
                filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
                options={(hw.cpuModels || [])
                  .filter((m: any) => !cpuBrandId || m.brand === cpuBrandId)
                  .map((m: any) => ({ value: m.id, label: `${m.model} (${m.cores||'?'}C/${m.threads||'?'}T)` }))}
              />
            </Form.Item></Col>
            <Col span={4}><Form.Item name="cpuCount" label="数量"><InputNumber min={1} max={16} placeholder="颗" style={{ width: '100%' }} /></Form.Item></Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}><Form.Item name="memBrandId" label="内存品牌">
              <Select placeholder="品牌" allowClear showSearch
                onChange={() => form.setFieldValue('memModelId', undefined)}
                filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
                options={(hw.memBrands || []).map((b: string) => ({ value: b, label: b }))}
              />
            </Form.Item></Col>
            <Col span={12}><Form.Item name="memModelId" label="内存型号">
              <Select placeholder={memBrandId ? `${memBrandId} 型号` : '先选品牌'} showSearch allowClear disabled={!memBrandId}
                filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
                options={(hw.memModels || [])
                  .filter((m: any) => !memBrandId || m.brand === memBrandId)
                  .map((m: any) => ({ value: m.id, label: `${m.model}` }))}
              />
            </Form.Item></Col>
            <Col span={4}><Form.Item name="memSize" label="条数"><InputNumber min={1} max={128} placeholder="条" style={{ width: '100%' }} /></Form.Item></Col>
          </Row>

          <Form.Item name="storage" label="存储" valuePropName="value" getValueFromEvent={(v: HwEntry[]) => v}>
            <MultiEntry brandOptions={hw.storageBrands || []} modelsByBrand={hw.storageModelsByBrand || {}}
              modelOptions={hw.storageModel || []} fullModels={hw.storageModels || []}
              modelPlaceholder="存储型号" countPlaceholder="数量" />
          </Form.Item>

          <Form.Item name="nic" label="网卡" valuePropName="value" getValueFromEvent={(v: HwEntry[]) => v}>
            <MultiEntry brandOptions={hw.nicBrands || []} modelsByBrand={hw.nicModelsByBrand || {}}
              modelOptions={hw.nicModel || []} fullModels={hw.nicModels || []}
              modelPlaceholder="网卡型号" countPlaceholder="数量" />
          </Form.Item>

          <Form.Item name="description" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default TemplateList;
