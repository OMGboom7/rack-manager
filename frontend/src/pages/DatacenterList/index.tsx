import React, { useEffect, useState, useRef } from 'react';
import { Card, Button, Space, Modal, Form, Input, InputNumber, Popconfirm, message, Select, Collapse, Segmented, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, CheckOutlined, RightOutlined, DownOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '@/api/client';
import type { Datacenter, Row, Rack } from '@/types';
import Datacenter3DView from '@/components/Rack3DView/Datacenter3DView';

const InlineEdit: React.FC<{
  value: string; onSave: (val: string) => Promise<void>;
  style?: React.CSSProperties; placeholder?: string;
}> = ({ value, onSave, style, placeholder }) => {
  const [edit, setEdit] = useState(false);
  const [text, setText] = useState(value);
  const ref = useRef<any>(null);
  useEffect(() => { setText(value); }, [value]);
  const save = async () => {
    const t = text.trim();
    if (!t || t === value) { setText(value); setEdit(false); return; }
    try { await onSave(t); setEdit(false); } catch { message.error('保存失败'); }
  };
  return edit ? (
    <Space><Input ref={ref} value={text} onChange={e => setText(e.target.value)} onPressEnter={save} onBlur={save} size="small" style={style} placeholder={placeholder} /><Button type="text" size="small" icon={<CheckOutlined />} onMouseDown={e => { e.preventDefault(); save(); }} /></Space>
  ) : (
    <span onClick={() => { setEdit(true); setTimeout(() => ref.current?.focus(), 0); }} style={{ cursor: 'pointer', ...style }}>
      {value || <span style={{ color: '#ccc' }}>{placeholder || '点击设置'}</span>}<EditOutlined style={{ fontSize: 11, color: '#999', marginLeft: 4 }} />
    </span>
  );
};

const DatacenterList: React.FC = () => {
  const [datacenters, setDatacenters] = useState<Datacenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [view3D, setView3D] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [modal, setModal] = useState<{ open: boolean; type: 'dc' | 'row' | 'rack'; parentId?: number }>({ open: false, type: 'dc' });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/datacenters');
      const list = res.data?.data || res.data;
      setDatacenters(Array.isArray(list) ? list : []);
    } catch {
      setDatacenters([]);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleOk = async () => {
    const values = await form.validateFields();
    try {
      if (modal.type === 'dc') await api.post('/datacenters', values);
      else if (modal.type === 'row' && modal.parentId) await api.post('/racks/rows', { ...values, datacenterId: modal.parentId });
      else if (modal.type === 'rack' && modal.parentId) await api.post('/racks', { ...values, rowId: modal.parentId });
      message.success('创建成功'); setModal({ open: false, type: 'dc' }); form.resetFields(); load();
    } catch { message.error('操作失败'); }
  };

  const updateDcName = (dc: Datacenter) => async (name: string) => { await api.put(`/datacenters/${dc.id}`, { name }); load(); };
  const updateDcLocation = (dc: Datacenter) => async (location: string) => { await api.put(`/datacenters/${dc.id}`, { location }); load(); };
  const updateRackName = (rack: Rack) => async (name: string) => { await api.put(`/racks/${rack.id}`, { name }); load(); };

  const toggleRow = (id: number) => { setExpandedRows(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; }); };

  return (
    <Card title="机房管理" extra={
      <Space>
        <Segmented size="small" value={view3D ? '3d' : '2d'} onChange={v => setView3D(v === '3d')}
          options={[{ label: '表格', value: '2d' }, { label: '3D 视图', value: '3d' }]} />
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setModal({ open: true, type: 'dc' }); form.resetFields(); }}>新建机房</Button>
      </Space>
    }>
      {view3D ? (
        datacenters.length ? <Datacenter3DView datacenter={datacenters[0]} /> : <Empty description="暂无机房" />
      ) : (
        <Collapse defaultActiveKey={datacenters.map(d => d.id)} bordered={false} expandIconPosition="start" style={{ background: 'transparent' }}>
          {datacenters.map((dc) => (
            <Collapse.Panel key={dc.id}
              header={<span onClick={e => e.stopPropagation()}><InlineEdit value={dc.name} onSave={updateDcName(dc)} /></span>}
              extra={
                <Space onClick={e => e.stopPropagation()}>
                  <InlineEdit value={dc.location || ''} onSave={updateDcLocation(dc)} placeholder="设置位置" />
                  <Button size="small" onClick={e => { e.stopPropagation(); setModal({ open: true, type: 'row', parentId: dc.id }); form.resetFields(); }}>添加排</Button>
                  <Popconfirm title="确认删除?" onConfirm={async () => { await api.delete(`/datacenters/${dc.id}`); load(); }}>
                    <Button size="small" danger icon={<DeleteOutlined />} onClick={e => e.stopPropagation()} />
                  </Popconfirm>
                </Space>
              }
            >
              {dc.rows?.map((row) => (
                <div key={row.id} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, padding: '6px 8px', marginBottom: 4, borderRadius: 4, background: '#f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => toggleRow(row.id)}>
                    <Space>
                      {expandedRows.has(row.id) ? <DownOutlined style={{ fontSize: 10, color: '#999' }} /> : <RightOutlined style={{ fontSize: 10, color: '#999' }} />}
                      <span>{row.name}</span>
                      <span style={{ fontSize: 11, color: '#999' }}>({(row.racks || []).length} 机柜)</span>
                    </Space>
                    <Space onClick={e => e.stopPropagation()}>
                      <Button size="small" onClick={() => { setModal({ open: true, type: 'rack', parentId: row.id }); form.resetFields(); }}>添加机柜</Button>
                      <Popconfirm title="确认删除?" onConfirm={async () => { await api.delete(`/racks/rows/${row.id}`); load(); }}><Button size="small" danger icon={<DeleteOutlined />} /></Popconfirm>
                    </Space>
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateRows: expandedRows.has(row.id) ? '1fr' : '0fr',
                  transition: 'grid-template-rows 0.3s ease',
                }}>
                  <div style={{ overflow: 'hidden', minHeight: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 4 }}>
                      {row.racks?.map((rack) => (
                        <Card key={rack.id} size="small" hoverable style={{ width: 200 }} onClick={() => navigate(`/racks/${rack.id}`)}>
                          <div style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <span onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1677ff', flexShrink: 0 }} />
                              <InlineEdit value={rack.name} onSave={updateRackName(rack)} style={{ fontWeight: 600 }} />
                            </span>
                          </div>
                          {rack.purpose && <div style={{ fontSize: 11, color: '#1677ff', marginBottom: 2 }}>{rack.purpose}</div>}
                          <div style={{ fontSize: 12, color: '#999' }}>{rack.totalU}U · {rack.devices?.length || 0} 设备</div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </Collapse.Panel>
          ))}
        </Collapse>
      )}

      <Modal title={modal.type === 'dc' ? '新建机房' : modal.type === 'row' ? '新建排/列' : '新建机柜'} open={modal.open} onOk={handleOk} onCancel={() => setModal({ open: false, type: 'dc' })}>
        <Form form={form} layout="vertical">
          {modal.type === 'dc' && (<><Form.Item name="name" label="机房名称" rules={[{ required: true }]}><Input /></Form.Item><Form.Item name="location" label="位置"><Input placeholder="如: 上海浦东" /></Form.Item></>)}
          {modal.type === 'row' && (<Form.Item name="name" label="排名称" rules={[{ required: true }]}><Input placeholder="如: A排、B排" /></Form.Item>)}
          {modal.type === 'rack' && (<><Form.Item name="name" label="机柜名称" rules={[{ required: true }]}><Input placeholder="如: A-01" /></Form.Item>
            <Form.Item name="purpose" label="业务类型"><Select placeholder="选择业务类型" allowClear><Select.Option value="核心业务">核心业务</Select.Option><Select.Option value="大数据/AI">大数据/AI</Select.Option><Select.Option value="虚拟化">虚拟化</Select.Option><Select.Option value="容器/K8S">容器/K8S</Select.Option><Select.Option value="安全防护">安全防护</Select.Option><Select.Option value="网络核心">网络核心</Select.Option><Select.Option value="开发测试">开发测试</Select.Option><Select.Option value="办公网">办公网</Select.Option><Select.Option value="灾备">灾备</Select.Option><Select.Option value="高性能网络">高性能网络</Select.Option></Select></Form.Item>
            <Form.Item name="totalU" label="U位数" initialValue={42}><InputNumber min={12} max={60} /></Form.Item></>)}
        </Form>
      </Modal>
    </Card>
  );
};

export default DatacenterList;
