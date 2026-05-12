import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Row, Col, Tag, Button, Space, Modal, Popconfirm, message, Descriptions, Empty, Input, Select, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import api from '@/api/client';
import type { Rack, Device, DeviceType, DeviceTemplate } from '@/types';
import { parseTags } from '@/types';
import RackView from '@/components/RackView/RackView';
import DeviceForm from '@/components/DeviceForm';

const safeJsonParse = (val: any) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
};

const RackDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [rack, setRack] = useState<Rack | null>(null);
  const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandsByType, setBrandsByType] = useState<Record<number, string[]>>({});
  const [modelsByBrand, setModelsByBrand] = useState<Record<string, string[]>>({});
  const [modelsByBrandType, setModelsByBrandType] = useState<Record<string, Record<number, string[]>>>({});
  const [hwOptions, setHwOptions] = useState<Record<string, any>>({});
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [templates, setTemplates] = useState<DeviceTemplate[]>([]);
  const [addDefaults, setAddDefaults] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const formatMemTotal = (device: Device) => {
    if (!device.memModel?.capacity || !device.memSize) return '-';
    const total = device.memModel.capacity * device.memSize;
    if (total >= 1024) return (total / 1024).toFixed(1) + ' TB';
    return total + ' GB';
  };

  const formatNicMaxSpeed = (nicJson?: string) => {
    const n = safeJsonParse(nicJson);
    if (!n.length) return '-';
    let max = 0;
    for (const item of n) {
      if (item.speed) {
        const m = item.speed.match(/(\d+)\s*G/);
        if (m) max = Math.max(max, parseInt(m[1]));
      } else if (item.model) {
        const m = item.model.match(/(\d+)\s*G/);
        if (m) max = Math.max(max, parseInt(m[1]));
      }
    }
    if (!max) return '-';
    if (max >= 200) return max + 'GbE';
    return max + 'GbE';
  };

  const calcStorageGB = (item: any) => {
    if (item.capacity) {
      const gb = (item.capUnit === 'TB' ? item.capacity * 1024 : item.capacity) * (item.count || 0);
      return gb;
    }
    const m = (item.model || '').match(/([\d.]+)\s*(TB|GB)/i);
    if (m) return parseFloat(m[1]) * (m[2].toUpperCase() === 'TB' ? 1024 : 1) * (item.count || 0);
    return 0;
  };

  const formatStorageTotal = (storageJson?: string) => {
    const s = safeJsonParse(storageJson);
    if (!s.length) return '-';
    let totalGB = 0;
    for (const item of s) totalGB += calcStorageGB(item);
    if (!totalGB) return '-';
    if (totalGB >= 1024) return (totalGB / 1024).toFixed(1) + ' TB';
    return totalGB.toFixed(0) + ' GB';
  };
  const [editingName, setEditingName] = useState(false);
  const [rackName, setRackName] = useState('');
  const [editingPurpose, setEditingPurpose] = useState(false);
  const [rackPurpose, setRackPurpose] = useState('');
  const [editingTotalU, setEditingTotalU] = useState(false);
  const [rackTotalU, setRackTotalU] = useState(42);
  const nameInputRef = useRef<any>(null);
  const purposeInputRef = useRef<any>(null);
  const totalUInputRef = useRef<any>(null);

  const loadRack = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get(`/racks/${id}`);
    setRack(data);
    setRackName(data.name);
    setRackPurpose(data.purpose || '');
    setRackTotalU(data.totalU);
  }, [id]);

  const loadMeta = async () => {
    const [{ data: types }, { data: meta }, tplRes] = await Promise.all([
      api.get('/devices/types/all'),
      api.get('/devices/metadata'),
      api.get('/devices/templates/all').catch(() => ({ data: [] })),
    ]);
    setDeviceTypes(types);
    setTemplates(tplRes?.data?.data || tplRes?.data || []);
    setBrands(meta.brands);
    setBrandsByType(meta.brandsByType || {});
    setModelsByBrand(meta.modelsByBrand || {});
    setModelsByBrandType(meta.modelsByBrandType || {});
    setHwOptions({
      cpuBrands: meta.cpuBrands || [],
      cpuModelsByBrand: meta.cpuModelsByBrand || {},
      cpuModels: meta.cpuModels || [],
      memBrands: meta.memBrands || [],
      memModelsByBrand: meta.memModelsByBrand || {},
      memModels: meta.memModels || [],
      storageModel: meta.storageModel || [],
      storageBrands: meta.storageBrands || [],
      storageModelsByBrand: meta.storageModelsByBrand || {},
      storageModels: meta.storageModels || [],
      nicModel: meta.nicModel || [],
      nicBrands: meta.nicBrands || [],
      nicModelsByBrand: meta.nicModelsByBrand || {},
      nicModels: meta.nicModels || [],
    });
  };

  useEffect(() => {
    Promise.all([loadRack(), loadMeta()]).catch(() => {
      message.error('加载数据失败，请刷新重试');
    }).finally(() => setLoading(false));
  }, [loadRack]);

  const openAddForm = () => {
    setSelectedDevice(null);
    setAddDefaults({});
    setFormMode('add');
    setFormKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEditForm = (device: Device) => {
    setSelectedDevice(device);
    setFormMode('edit');
    setFormKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = { ...values };
      const simplify = (arr: any[]) => arr.map((e: any) => ({ modelId: e.id || e.modelId, model: e.model, count: e.count, speed: e.speed, capacity: e.capacity, capUnit: e.capUnit }));
      if (Array.isArray(payload.storage)) payload.storage = JSON.stringify(simplify(payload.storage));
      if (Array.isArray(payload.nic)) payload.nic = JSON.stringify(simplify(payload.nic));
      if (formMode === 'add') {
        await api.post('/devices', { ...payload, rackId: Number(id) });
        message.success('设备添加成功');
      } else if (selectedDevice) {
        await api.put(`/devices/${selectedDevice.id}`, payload);
        message.success('设备更新成功');
      }
      setModalOpen(false);
      await Promise.all([loadRack(), loadMeta()]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deviceId: number) => {
    await api.delete(`/devices/${deviceId}`);
    message.success('设备已删除');
    setModalOpen(false);
    loadRack();
  };

  const handleDeviceMove = async (deviceId: number, newStartU: number) => {
    try {
      await api.put(`/devices/${deviceId}`, { startU: newStartU });
      message.success('设备位置已更新');
      loadRack();
    } catch (e: any) {
      const msg = e?.response?.data?.message || '移动失败';
      message.error(msg);
      loadRack();
    }
  };

  if (loading || !rack) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const startEditName = () => {
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 0);
  };

  const saveName = async () => {
    const trimmed = rackName.trim();
    if (!trimmed || trimmed === rack.name) { setRackName(rack.name); setEditingName(false); return; }
    await updateRack({ name: trimmed });
  };

  const startEditPurpose = () => {
    setEditingPurpose(true);
    setTimeout(() => purposeInputRef.current?.focus(), 0);
  };

  const savePurpose = async () => {
    const trimmed = rackPurpose.trim();
    if (trimmed === (rack.purpose || '')) { setEditingPurpose(false); return; }
    await updateRack({ purpose: trimmed || undefined });
  };

  const startEditTotalU = () => {
    setEditingTotalU(true);
    setTimeout(() => totalUInputRef.current?.focus(), 0);
  };

  const saveTotalU = async () => {
    const val = rackTotalU;
    if (!val || val < 1 || val > 60) { setRackTotalU(rack.totalU); setEditingTotalU(false); return; }
    if (val === rack.totalU) { setEditingTotalU(false); return; }
    await updateRack({ totalU: val });
  };

  const updateRack = async (data: Record<string, any>) => {
    try {
      await api.put(`/racks/${rack.id}`, data);
      message.success('已更新');
      setEditingName(false);
      setEditingPurpose(false);
      loadRack();
    } catch {
      message.error('更新失败');
    }
  };

  const usedU = rack.devices?.reduce((sum, d) => sum + d.heightU, 0) || 0;
  const freeU = rack.totalU - usedU;
  const usagePercent = Math.round((usedU / rack.totalU) * 100);

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Descriptions
          title={
            editingName ? (
              <Space>
                <Input
                  ref={nameInputRef}
                  value={rackName}
                  onChange={(e) => setRackName(e.target.value)}
                  onPressEnter={saveName}
                  onBlur={saveName}
                  style={{ width: 180 }}
                  size="small"
                />
                <Button type="text" size="small" icon={<CheckOutlined />} onClick={saveName} />
              </Space>
            ) : (
              <span
                onClick={startEditName}
                style={{ cursor: 'pointer' }}
                title="点击修改名称"
              >
                {rackName} <EditOutlined style={{ fontSize: 12, color: '#999' }} />
              </span>
            )
          }           extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openAddForm}>添加设备</Button>
            <Select
              placeholder="从模板创建..."
              style={{ width: 160 }}
              value={undefined}
              allowClear
              disabled={templates.length === 0}
              onChange={(tplId: number) => {
                  const tpl = templates.find(t => t.id === tplId);
                  if (!tpl) return;
                  setSelectedDevice(null);
                  setFormMode('add');
                  setFormKey(k => k + 1);
                  setAddDefaults({
                    name: tpl.name,
                    brand: tpl.brand,
                    model: tpl.model,
                    heightU: tpl.heightU,
                    deviceTypeId: tpl.deviceTypeId,
                    cpuBrandId: tpl.cpuModel?.brand,
                    cpuModelId: tpl.cpuModelId,
                    cpuCount: tpl.cpuCount,
                    memBrandId: tpl.memModel?.brand,
                    memModelId: tpl.memModelId,
                    memSize: tpl.memSize,
                    storage: safeJsonParse(tpl.storage),
                    nic: safeJsonParse(tpl.nic),
                    description: tpl.description,
                    tags: safeJsonParse(tpl.tags),
                  });
                  setModalOpen(true);
                }}
                options={templates.map(t => ({ value: t.id, label: t.name }))}
              />
          </Space>
        } column={5} size="small">
          <Descriptions.Item label="总U位">
            {editingTotalU ? (
              <Space>
                <Input
                  ref={totalUInputRef}
                  type="number"
                  value={rackTotalU}
                  onChange={(e) => setRackTotalU(Number(e.target.value))}
                  onPressEnter={saveTotalU}
                  onBlur={saveTotalU}
                  style={{ width: 80 }}
                  size="small"
                  min={1}
                  max={60}
                />
                <Button type="text" size="small" icon={<CheckOutlined />} onClick={saveTotalU} />
              </Space>
            ) : (
              <span onClick={startEditTotalU} style={{ cursor: 'pointer' }}>
                {rack.totalU}U <EditOutlined style={{ fontSize: 11, color: '#999' }} />
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="已用U位"><Tag color="blue">{usedU}U</Tag></Descriptions.Item>
          <Descriptions.Item label="可用U位"><Tag color="green">{freeU}U</Tag></Descriptions.Item>
          <Descriptions.Item label="使用率">{usagePercent}%</Descriptions.Item>
          <Descriptions.Item label="设备数量">{rack.devices?.length || 0}</Descriptions.Item>
          <Descriptions.Item label="最大连续空闲U位">
            {(() => {
              if (!rack.devices?.length) return `${rack.totalU}U (全部)`;
              const slots = rack.devices.map(d => ({ s: d.startU, e: d.startU + d.heightU }));
              slots.sort((a, b) => a.s - b.s);
              let maxGap = slots[0].s - 1;
              for (let i = 1; i < slots.length; i++) {
                maxGap = Math.max(maxGap, slots[i].s - slots[i - 1].e);
              }
              maxGap = Math.max(maxGap, rack.totalU - slots[slots.length - 1].e);
              return `${maxGap}U`;
            })()}
          </Descriptions.Item>
          <Descriptions.Item label="业务类型">
            {editingPurpose ? (
              <Space>
                <Input
                  ref={purposeInputRef}
                  value={rackPurpose}
                  onChange={(e) => setRackPurpose(e.target.value)}
                  onPressEnter={savePurpose}
                  onBlur={savePurpose}
                  placeholder="如: 核心业务、虚拟化"
                  style={{ width: 150 }}
                  size="small"
                />
                <Button type="text" size="small" icon={<CheckOutlined />} onClick={savePurpose} />
              </Space>
            ) : (
              <span onClick={startEditPurpose} style={{ cursor: 'pointer' }}>
                {rackPurpose || '点击设置'} <EditOutlined style={{ fontSize: 11, color: '#999' }} />
              </span>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="硬件配置">
            <span>{rack.devices?.filter(d => d.cpuModelId || d.memModelId || d.storage || d.nic).length || 0}台已登记</span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16}>
        <Col flex="320px">
          <Card
            title="机柜视图"
            styles={{ body: { padding: 8, overflow: 'auto' } }}
          >
            {rack.devices?.length ? (
              <RackView rack={rack} selectedDeviceId={selectedDevice?.id} onDeviceClick={openEditForm} onDeviceMove={handleDeviceMove} />
            ) : (
              <Empty description="暂无设备" />
            )}
          </Card>
        </Col>
        <Col flex="auto">
          <Card title="设备列表" styles={{ body: { padding: 0 } }}>
            {rack.devices?.length ? (
              <table style={{ width: '100%', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>设备名</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>U位</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>IP地址</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>CPU</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>内存</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>存储</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>网卡</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>类型</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left' }}>状态</th>
                    <th style={{ width: 40 }} />
                  </tr>
                </thead>
                <tbody>
                  {rack.devices.map((d) => (
                    <tr key={d.id} style={{ cursor: 'pointer' }} onClick={() => openEditForm(d)}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ fontWeight: 500 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: '#999' }}>{d.brand} {d.model}</div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        U{d.startU}-U{d.startU + d.heightU - 1}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12, color: '#666' }}>
                        {d.ipAddress || '-'}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {d.cpuModel ? `${d.cpuModel.model}${d.cpuCount ? ` ×${d.cpuCount}` : ''}` : '-'}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {formatMemTotal(d)}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {formatStorageTotal(d.storage)}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {formatNicMaxSpeed(d.nic)}
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <Tag style={{ background: d.deviceType?.color, color: '#fff', border: 'none' }}>
                          {d.deviceType?.name}
                        </Tag>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        {d.status === 'planned' && <Tag color="gold">待上架</Tag>}
                        {d.status === 'active' && <Tag color="green">运行中</Tag>}
                        {d.status === 'offline' && <Tag color="default">已关机</Tag>}
                        {d.status === 'maintenance' && <Tag color="orange">维护中</Tag>}
                        {d.status === 'decommissioned' && <Tag color="red">已下架</Tag>}
                      </td>
                      <td style={{ padding: '8px 4px' }}>
                        <Popconfirm title="确认删除?" onConfirm={(e) => { e?.stopPropagation(); handleDelete(d.id); }} onCancel={(e) => e?.stopPropagation()}>
                          <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={(e) => e.stopPropagation()} />
                        </Popconfirm>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {rack.devices?.length ? (
                  <tfoot>
                    <tr style={{ background: '#fafafa', borderTop: '2px solid #d9d9d9', fontWeight: 500 }}>
                      <td style={{ padding: '8px 12px' }}>合计 {rack.devices.length} 台</td>
                      <td style={{ padding: '8px 12px' }} />
                      <td style={{ padding: '8px 12px' }} />
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {(() => {
                          let total = 0;
                          rack.devices.forEach((d) => { if (d.cpuModel?.cores) total += (d.cpuModel.cores * (d.cpuCount || 0)); else total += (d.cpuCount || 0); });
                          return total ? `${total} 核心` : '-';
                        })()}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {(() => {
                          let totalGB = 0;
                          rack.devices.forEach((d) => {
                            if (!d.memModel?.capacity || !d.memSize) return;
                            totalGB += d.memModel.capacity * d.memSize;
                          });
                          if (!totalGB) return '-';
                          return totalGB >= 1024 ? (totalGB / 1024).toFixed(1) + ' TB' : totalGB + ' GB';
                        })()}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {(() => {
                          let totalGB = 0;
                          rack.devices.forEach((d) => {
                            const s = safeJsonParse(d.storage);
                            s.forEach((item: any) => { totalGB += calcStorageGB(item); });
                          });
                          if (!totalGB) return '-';
                          return totalGB >= 1024 ? (totalGB / 1024).toFixed(1) + ' TB' : totalGB.toFixed(0) + ' GB';
                        })()}
                      </td>
                      <td style={{ padding: '8px 12px', fontSize: 12 }}>
                        {(() => {
                          let total = 0;
                          rack.devices.forEach((d) => {
                            const n = safeJsonParse(d.nic);
                            n.forEach((item: any) => { total += item.count || 0; });
                          });
                          return total ? `${total} 个` : '-';
                        })()}
                      </td>
                      <td style={{ padding: '8px 12px' }} />
                      <td style={{ padding: '8px 12px' }} />
                      <td style={{ padding: '8px 4px' }} />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            ) : (
              <Empty description="暂无设备" style={{ padding: 24 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <span>{formMode === 'add' ? '添加设备' : '编辑设备'}</span>
            {formMode === 'edit' && selectedDevice && (
              <Popconfirm title="确认删除该设备?" onConfirm={() => { handleDelete(selectedDevice.id); }}>
                <Button danger size="small">删除设备</Button>
              </Popconfirm>
            )}
          </Space>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={650}
        destroyOnClose
      >
        <DeviceForm
          deviceTypes={deviceTypes}
          brands={brands}
          brandsByType={brandsByType}
          modelsByBrand={modelsByBrand}
          modelsByBrandType={modelsByBrandType}
          hwOptions={hwOptions}
          resetKey={formKey}
          initialValues={formMode === 'edit' && selectedDevice ? {
            name: selectedDevice.name,
            brand: selectedDevice.brand,
            model: selectedDevice.model,
            startU: selectedDevice.startU,
            heightU: selectedDevice.heightU,
            deviceTypeId: selectedDevice.deviceTypeId,
            status: selectedDevice.status,
            ipAddress: selectedDevice.ipAddress,
            serialNumber: selectedDevice.serialNumber,
            assetTag: selectedDevice.assetTag,
            supplier: selectedDevice.supplier,
            purchaseDate: selectedDevice.purchaseDate,
            warrantyExpiry: selectedDevice.warrantyExpiry,
            subnet: selectedDevice.subnet,
            vlan: selectedDevice.vlan,
            cpuBrandId: selectedDevice.cpuModel?.brand,
            cpuModelId: selectedDevice.cpuModelId,
            cpuCount: selectedDevice.cpuCount,
            memBrandId: selectedDevice.memModel?.brand,
            memModelId: selectedDevice.memModelId,
            memSize: selectedDevice.memSize,
            storage: safeJsonParse(selectedDevice.storage).map((e: any) => {
              if (e.modelId && !e.brand) { const m: any = (hwOptions.storageModels || []).find((x: any) => x.id === e.modelId); if (m) { return { ...e, brand: m.brand, model: m.model, id: m.id }; } }
              return e;
            }),
            nic: safeJsonParse(selectedDevice.nic).map((e: any) => {
              if (e.modelId && !e.brand) { const m: any = (hwOptions.nicModels || []).find((x: any) => x.id === e.modelId); if (m) { return { ...e, brand: m.brand, model: m.model, id: m.id }; } }
              return e;
            }),
            description: selectedDevice.description,
          } : { startU: 1, heightU: 1, status: 'active', storage: [], nic: [], ...addDefaults }}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
          loading={saving}
        />
      </Modal>
    </div>
  );
};

export default RackDetail;
