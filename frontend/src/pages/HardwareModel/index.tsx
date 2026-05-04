import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, Table, Button, Space, Modal, Form, Input, InputNumber, Select, Popconfirm, message, Tabs, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import api from '@/api/client';

interface HwModel {
  id: number;
  brand: string;
  model: string;
  cores?: number;
  threads?: number;
  architecture?: string;
  capacity?: number;
  type?: string;
  speed?: number | string;
  ecc?: boolean;
  portType?: string;
  ports?: number;
  capUnit?: string;
  interface?: string;
  formFactor?: string;
}

const typeConfig = {
  cpu: { label: 'CPU', api: 'cpu', brandHint: '如: Intel、AMD、Ampere', modelHint: '如: Xeon 6430、EPYC 9654' },
  memory: { label: '内存', api: 'memory', brandHint: '如: Samsung、SK Hynix、Micron', modelHint: '如: M393A4K40DB3-CWE、HMAA8GR7AJR4N-XN' },
  nic: { label: '网卡', api: 'nic', brandHint: '如: Intel、Mellanox、Broadcom', modelHint: '如: ConnectX-7、E810-XXVDA2' },
  storage: { label: '存储', api: 'storage', brandHint: '如: Samsung、Kioxia、Seagate', modelHint: '如: PM9A3、Exos X24' },
} as const;

type HwType = keyof typeof typeConfig;

const HwTab: React.FC<{ hwType: HwType }> = ({ hwType }) => {
  const [data, setData] = useState<HwModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HwModel | null>(null);
  const [brandFilter, setBrandFilter] = useState<string | undefined>();
  const [modelSearch, setModelSearch] = useState('');
  const [form] = Form.useForm();
  const cfg = typeConfig[hwType];

  const load = useCallback(async () => {
    setLoading(true);
    api.get(`/devices/hw/${cfg.api}`)
      .then(({ data: list }) => {
        const items = (list.data || list) as HwModel[];
        items.sort((a, b) => a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model));
        setData(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [cfg.api]);

  useEffect(() => { load(); }, [load]);

  const brands = useMemo(() => {
    const set = new Set(data.map((d) => d.brand));
    return Array.from(set).sort();
  }, [data]);

  const filtered = (brandFilter ? data.filter((d) => d.brand === brandFilter) : data)
    .filter((d) => !modelSearch || d.model.toLowerCase().includes(modelSearch.toLowerCase()));

  const openCreate = () => {
    setEditingItem(null);
    form.resetFields();
    form.setFieldValue('brand', brandFilter);
    setModalOpen(true);
  };

  const openEdit = (item: HwModel) => {
    setEditingItem(item);
    const vals: Record<string, unknown> = { brand: item.brand, model: item.model };
    if (hwType === 'cpu') {
      vals.cores = item.cores;
      vals.threads = item.threads;
      vals.architecture = item.architecture;
    }
    if (hwType === 'memory') {
      vals.capacity = item.capacity;
      vals.type = item.type;
      vals.speed = item.speed;
      vals.ecc = item.ecc;
    }
    if (hwType === 'nic') {
      vals.speed = item.speed;
      vals.portType = item.portType;
      vals.ports = item.ports;
    }
    if (hwType === 'storage') {
      vals.capacity = item.capacity;
      vals.capUnit = item.capUnit || 'GB';
      vals.interface = item.interface;
      vals.formFactor = item.formFactor;
    }
    form.setFieldsValue(vals);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editingItem) {
      await api.put(`/devices/hw/${cfg.api}/${editingItem.id}`, values);
      message.success('已更新');
    } else {
      await api.post(`/devices/hw/${cfg.api}`, values);
      message.success('添加成功');
    }
    setModalOpen(false);
    form.resetFields();
    load();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/devices/hw/${cfg.api}/${id}`);
    message.success('已删除');
    load();
  };

  const columns = [
    {
      title: '品牌',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand: string) => <Tag color="blue">{brand}</Tag>,
    },
    { title: '型号', dataIndex: 'model', key: 'model', ellipsis: true },
    ...(hwType === 'cpu' ? [
      { title: '核心', dataIndex: 'cores', key: 'cores', render: (v: number) => v || '-' },
      { title: '线程', dataIndex: 'threads', key: 'threads', render: (v: number) => v || '-' },
      { title: '架构', dataIndex: 'architecture', key: 'architecture', ellipsis: true, render: (v: string) => <span style={{fontSize:12,color:'#666'}}>{v || '-'}</span> },
    ] : []),
    ...(hwType === 'memory' ? [
      { title: '容量', dataIndex: 'capacity', key: 'capacity', render: (v: number) => v ? `${v}GB` : '-' },
      { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => v ? <Tag color="purple">{v}</Tag> : '-' },
      { title: '频率', dataIndex: 'speed', key: 'speed', render: (v: number) => v ? `${v} MT/s` : '-' },
      { title: 'ECC', dataIndex: 'ecc', key: 'ecc', render: (v: boolean) => v == null ? '-' : <Tag color={v ? 'green' : 'default'}>{v ? '是' : '否'}</Tag> },
    ] : []),
    ...(hwType === 'nic' ? [
      { title: '速率', dataIndex: 'speed', key: 'speed', render: (v: string) => v ? <Tag color="cyan">{v}</Tag> : '-' },
      { title: '接口', dataIndex: 'portType', key: 'portType', render: (v: string) => v ? <Tag color="geekblue">{v}</Tag> : '-' },
      { title: '端口', dataIndex: 'ports', key: 'ports', render: (v: number) => v || '-' },
    ] : []),
    ...(hwType === 'storage' ? [
      { title: '容量', dataIndex: 'capacity', key: 'capacity', render: (v: number, r: HwModel) => v ? `${v}${r.capUnit || 'GB'}` : '-' },
      { title: '接口/介质', dataIndex: 'interface', key: 'interface', render: (v: string) => v ? <Tag color="orange">{v}</Tag> : '-' },
      { title: '规格', dataIndex: 'formFactor', key: 'formFactor', render: (v: string) => v ? <Tag color="gold">{v}</Tag> : '-' },
    ] : []),
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: HwModel) => (
        <Space size={0}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 12 }} wrap>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加{cfg.label}型号
        </Button>
        <Input
          prefix={<SearchOutlined />}
          placeholder="搜索型号..."
          value={modelSearch}
          onChange={(e) => setModelSearch(e.target.value)}
          allowClear
          style={{ width: 200 }}
        />
        <Select
          placeholder="按品牌筛选"
          allowClear
          style={{ minWidth: 160 }}
          value={brandFilter}
          onChange={setBrandFilter}
          options={brands.map((b) => ({ value: b, label: b }))}
        />
        {brandFilter && (
          <Tag closable onClose={() => setBrandFilter(undefined)}>
            {brandFilter} ({filtered.length})
          </Tag>
        )}
      </Space>
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 50, showTotal: (t) => `共 ${t} 条` }}
      />

      <Modal
        title={editingItem ? `编辑${cfg.label}型号` : `添加${cfg.label}型号`}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          preserve={false}
        >
          <Form.Item name="brand" label="品牌" rules={[{ required: true }]}>
            <Input placeholder={cfg.brandHint} />
          </Form.Item>
          <Form.Item name="model" label="型号" rules={[{ required: true }]}>
            <Input placeholder={cfg.modelHint} />
          </Form.Item>
          {hwType === 'cpu' && (
            <>
              <Form.Item name="cores" label="核心数" rules={[{ required: true, message: '请输入核心数' }]}>
                <InputNumber min={1} max={512} placeholder="如: 96" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="threads" label="线程数" rules={[{ required: true, message: '请输入线程数' }]}>
                <InputNumber min={1} max={1024} placeholder="如: 192" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="architecture" label="架构" rules={[{ required: true, message: '请输入架构' }]}>
                <Input placeholder="如: Zen 4 (Genoa)、Intel 7 (Sapphire Rapids)" />
              </Form.Item>
            </>
          )}
          {hwType === 'memory' && (
            <>
              <Form.Item name="capacity" label="容量 (GB)" rules={[{ required: true, message: '请输入容量' }]}>
                <InputNumber min={1} max={1024} placeholder="如: 64" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="type" label="内存类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="选择 DDR 类型">
                  <Select.Option value="DDR3">DDR3</Select.Option>
                  <Select.Option value="DDR4">DDR4</Select.Option>
                  <Select.Option value="DDR5">DDR5</Select.Option>
                  <Select.Option value="LPDDR5">LPDDR5</Select.Option>
                  <Select.Option value="HBM2e">HBM2e</Select.Option>
                  <Select.Option value="HBM3">HBM3</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="speed" label="频率 (MT/s)" rules={[{ required: true, message: '请输入频率' }]}>
                <InputNumber min={1333} max={8000} step={100} placeholder="如: 4800" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="ecc" label="ECC" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="是否支持 ECC">
                  <Select.Option value={true}>是 (ECC)</Select.Option>
                  <Select.Option value={false}>否 (Non-ECC)</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
          {hwType === 'nic' && (
            <>
              <Form.Item name="speed" label="速率" rules={[{ required: true, message: '请选择速率' }]}>
                <Select placeholder="选择速率">
                  <Select.Option value="1GbE">1GbE</Select.Option>
                  <Select.Option value="2.5GbE">2.5GbE</Select.Option>
                  <Select.Option value="10GbE">10GbE</Select.Option>
                  <Select.Option value="25GbE">25GbE</Select.Option>
                  <Select.Option value="40GbE">40GbE</Select.Option>
                  <Select.Option value="100GbE">100GbE</Select.Option>
                  <Select.Option value="200GbE">200GbE</Select.Option>
                  <Select.Option value="400GbE">400GbE</Select.Option>
                  <Select.Option value="800GbE">800GbE</Select.Option>
                  <Select.Option value="32Gb">32Gb FC</Select.Option>
                  <Select.Option value="64Gb">64Gb FC</Select.Option>
                  <Select.Option value="HDR 200Gb">HDR 200Gb IB</Select.Option>
                  <Select.Option value="NDR 400Gb">NDR 400Gb IB</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="portType" label="接口类型" rules={[{ required: true, message: '请选择接口' }]}>
                <Select placeholder="选择接口类型">
                  <Select.Option value="RJ45">RJ45</Select.Option>
                  <Select.Option value="SFP">SFP</Select.Option>
                  <Select.Option value="SFP+">SFP+</Select.Option>
                  <Select.Option value="SFP28">SFP28</Select.Option>
                  <Select.Option value="QSFP+">QSFP+</Select.Option>
                  <Select.Option value="QSFP28">QSFP28</Select.Option>
                  <Select.Option value="QSFP56">QSFP56</Select.Option>
                  <Select.Option value="QSFP-DD">QSFP-DD</Select.Option>
                  <Select.Option value="OSFP">OSFP</Select.Option>
                  <Select.Option value="FC">FC (Fibre Channel)</Select.Option>
                  <Select.Option value="IB">IB (InfiniBand)</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="ports" label="端口数" rules={[{ required: true, message: '请输入端口数' }]}>
                <InputNumber min={1} max={8} placeholder="如: 2" style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          {hwType === 'storage' && (
            <>
              <Form.Item name="capacity" label="容量" rules={[{ required: true, message: '请输入容量' }]}>
                <InputNumber min={0} step={0.01} placeholder="如: 3.84" style={{ width: 'calc(100% - 80px)' }} />
                <Form.Item name="capUnit" noStyle rules={[{ required: true }]}>
                  <Select style={{ width: 72, marginLeft: 8 }}>
                    <Select.Option value="GB">GB</Select.Option>
                    <Select.Option value="TB">TB</Select.Option>
                  </Select>
                </Form.Item>
              </Form.Item>
              <Form.Item name="interface" label="接口/介质" rules={[{ required: true, message: '请选择' }]}>
                <Select placeholder="选择接口和介质类型">
                  <Select.Option value="SATA SSD">SATA SSD</Select.Option>
                  <Select.Option value="SATA HDD">SATA HDD</Select.Option>
                  <Select.Option value="SAS SSD">SAS SSD</Select.Option>
                  <Select.Option value="SAS HDD">SAS HDD</Select.Option>
                  <Select.Option value="NVMe SSD">NVMe SSD</Select.Option>
                  <Select.Option value="NVMe Optane">NVMe Optane</Select.Option>
                  <Select.Option value="Optane PMem">Optane PMem</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="formFactor" label="规格尺寸" rules={[{ required: true, message: '请选择规格' }]}>
                <Select placeholder="选择规格">
                  <Select.Option value="2.5&quot;">2.5"</Select.Option>
                  <Select.Option value="3.5&quot;">3.5"</Select.Option>
                  <Select.Option value="U.2">U.2</Select.Option>
                  <Select.Option value="U.3">U.3</Select.Option>
                  <Select.Option value="E3.S">E3.S</Select.Option>
                  <Select.Option value="M.2">M.2</Select.Option>
                  <Select.Option value="DIMM">DIMM</Select.Option>
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </>
  );
};

const HardwareModel: React.FC = () => {
  const items = Object.entries(typeConfig).map(([key, cfg]) => ({
    key,
    label: cfg.label,
    children: <HwTab hwType={key as HwType} />,
  }));

  return (
    <Card title="硬件型号管理">
      <Tabs items={items} />
    </Card>
  );
};

export default HardwareModel;
