import React, { useEffect, useRef } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, Row, Col } from 'antd';
import type { DeviceType } from '@/types';
import SuggestSelect from './SuggestSelect';
import MultiEntry from './MultiEntry';
import type { HwEntry } from './MultiEntry';

interface Props {
  deviceTypes: DeviceType[];
  brands: string[];
  brandsByType: Record<number, string[]>;
  modelsByBrand: Record<string, string[]>;
  modelsByBrandType: Record<string, Record<number, string[]>>;
  hwOptions: Record<string, any>;
  initialValues?: any;
  resetKey: number;
  onSubmit: (values: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const DeviceForm: React.FC<Props> = ({
  deviceTypes, brands, brandsByType, modelsByBrand, modelsByBrandType,
  hwOptions, resetKey, initialValues, onSubmit, onCancel, loading,
}) => {
  const [form] = Form.useForm();
  const watchedType: number | undefined = Form.useWatch('deviceTypeId', form);
  const watchedBrand: string | undefined = Form.useWatch('brand', form);
  const watchedCpuBrandId: string | undefined = Form.useWatch('cpuBrandId', form);
  const watchedMemBrandId: string | undefined = Form.useWatch('memBrandId', form);
  const isInit = useRef(true);

  useEffect(() => {
    isInit.current = true;
    form.setFieldsValue({
      name: '', brand: undefined, model: undefined,
      startU: 1, heightU: 1, deviceTypeId: undefined, status: 'active',
      ipAddress: undefined, serialNumber: undefined,
      cpuModelId: undefined, cpuCount: undefined, cpuBrandId: undefined,
      memBrandId: undefined, memModelId: undefined, memSize: undefined,
      storage: [], nic: [],
      description: undefined,
      ...initialValues,
    });
    isInit.current = false;
  }, [resetKey]);

  const handleValuesChange = (_changed: any) => {
    if (isInit.current) return;
    if ('deviceTypeId' in _changed) {
      form.setFieldValue('brand', undefined);
      form.setFieldValue('model', undefined);
    } else if ('brand' in _changed) {
      form.setFieldValue('model', undefined);
    } else if ('cpuBrandId' in _changed) {
      form.setFieldValue('cpuModelId', undefined);
    } else if ('memBrandId' in _changed) {
      form.setFieldValue('memModelId', undefined);
    }
  };

  const filteredBrands = watchedType ? brandsByType[watchedType] || [] : brands;

  const modelOptions = (() => {
    if (watchedBrand && watchedType) return modelsByBrandType[watchedBrand]?.[watchedType] || [];
    if (watchedBrand) return modelsByBrand[watchedBrand] || [];
    if (watchedType) {
      const all: string[] = [];
      for (const b of brandsByType[watchedType] || [])
        all.push(...(modelsByBrandType[b]?.[watchedType] || []));
      return [...new Set(all)].sort();
    }
    return Object.values(modelsByBrand).flat();
  })();

  const cpuModelOptions = watchedCpuBrandId
    ? (hwOptions.cpuModelsByBrand?.[watchedCpuBrandId] || [])
    : Object.values(hwOptions.cpuModelsByBrand || {}).flat();

  const memModelOptions = watchedMemBrandId
    ? (hwOptions.memModelsByBrand?.[watchedMemBrandId] || [])
    : Object.values(hwOptions.memModelsByBrand || {}).flat();

  return (
    <Form layout="vertical" size="small" initialValues={initialValues} onFinish={onSubmit} form={form} onValuesChange={handleValuesChange}>
      <Form.Item name="name" label="设备名称" rules={[{ required: true }]}>
        <Input placeholder="如: Web-01" />
      </Form.Item>

      <Form.Item name="deviceTypeId" label="设备类型" rules={[{ required: true }]}>
        <Select placeholder="选择类型">
          {deviceTypes.map((t) => (
            <Select.Option key={t.id} value={t.id}>
              <span style={{ display:'inline-block',width:12,height:12,background:t.color,borderRadius:2,marginRight:6,verticalAlign:'middle' }} />
              {t.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Row gutter={12}>
        <Col flex="auto">
          <Form.Item name="brand" label="品牌">
            <SuggestSelect options={filteredBrands} placeholder={watchedType?'选择品牌':'先选设备类型'} disabled={!watchedType} />
          </Form.Item>
        </Col>
        <Col flex="auto">
          <Form.Item name="model" label="型号">
            <SuggestSelect options={modelOptions} placeholder={watchedBrand?`${watchedBrand} 型号`:'先选品牌'} disabled={!watchedBrand} />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="startU" label="起始U位" rules={[{ required:true }]}>
            <InputNumber min={1} max={60} style={{ width:'100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="heightU" label="占用U数" rules={[{ required:true }]}>
            <InputNumber min={1} max={60} style={{ width:'100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="status" label="状态">
            <Select>
              <Select.Option value="planned">待上架</Select.Option>
              <Select.Option value="active">运行中</Select.Option>
              <Select.Option value="offline">已关机</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
              <Select.Option value="decommissioned">已下架</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={12}>
          <Form.Item name="ipAddress" label="IP地址"><Input placeholder="10.0.0.1" /></Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="serialNumber" label="序列号"><Input placeholder="设备序列号" /></Form.Item>
        </Col>
      </Row>

      <div style={{ borderTop:'1px solid #f0f0f0', margin:'12px 0 8px', paddingTop:8, fontWeight:600, fontSize:13, color:'#1677ff' }}>资产信息</div>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="assetTag" label="资产编号"><Input placeholder="IT-2024-001" /></Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="supplier" label="供应商"><Input placeholder="供应商名称" /></Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="purchaseDate" label="采购日期"><Input placeholder="2024-01-15" /></Form.Item>
        </Col>
      </Row>
      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="warrantyExpiry" label="维保到期"><Input placeholder="2027-01-15" /></Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="subnet" label="子网"><Input placeholder="10.0.1.0/24" /></Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="vlan" label="VLAN"><InputNumber min={1} max={4094} placeholder="100" style={{width:'100%'}} /></Form.Item>
        </Col>
      </Row>

      <div style={{ borderTop:'1px solid #f0f0f0', margin:'12px 0 8px', paddingTop:8, fontWeight:600, fontSize:13, color:'#1677ff' }}>硬件配置</div>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="cpuBrandId" label="CPU品牌">
            <Select placeholder="品牌" allowClear showSearch onChange={() => form.setFieldValue('cpuModelId', undefined)}
              filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
              options={(hwOptions.cpuBrands || []).map((b: string) => ({ value: b, label: b }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="cpuModelId" label="CPU型号">
            <Select placeholder={watchedCpuBrandId ? `${watchedCpuBrandId} 型号` : '先选品牌'} showSearch allowClear disabled={!watchedCpuBrandId}
              onChange={() => { const v = form.getFieldValue('cpuCount'); if (!v) form.setFieldValue('cpuCount', 1); }}
              filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
              options={(hwOptions.cpuModels || [])
                .filter((m: any) => !watchedCpuBrandId || m.brand === watchedCpuBrandId)
                .map((m: any) => ({ value: m.id, label: `${m.model} (${m.cores||'?'}C/${m.threads||'?'}T)` }))} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="cpuCount" label="数量"><InputNumber min={1} max={16} placeholder="颗" style={{ width: '100%' }} /></Form.Item>
        </Col>
      </Row>

      <Row gutter={12}>
        <Col span={8}>
          <Form.Item name="memBrandId" label="内存品牌">
            <Select placeholder="品牌" allowClear showSearch onChange={() => form.setFieldValue('memModelId', undefined)}
              filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
              options={(hwOptions.memBrands || []).map((b: string) => ({ value: b, label: b }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="memModelId" label="内存型号">
            <Select placeholder={watchedMemBrandId ? `${watchedMemBrandId} 型号` : '先选品牌'} showSearch allowClear disabled={!watchedMemBrandId}
              onChange={() => { const v = form.getFieldValue('memSize'); if (!v) form.setFieldValue('memSize', 1); }}
              filterOption={(i, o) => (o?.label as string||'').includes(i.toLowerCase())}
              options={(hwOptions.memModels || [])
                .filter((m: any) => !watchedMemBrandId || m.brand === watchedMemBrandId)
                .map((m: any) => ({ value: m.id, label: m.model }))} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="memSize" label="条数"><InputNumber min={1} max={128} placeholder="条" style={{ width: '100%' }} /></Form.Item>
        </Col>
      </Row>

      <Form.Item name="storage" label="存储" valuePropName="value" getValueFromEvent={(v:HwEntry[])=>v}
        rules={[{ validator: (_, v: HwEntry[]) => {
          if (!v?.length) return Promise.resolve();
          for (const e of v) {
            if (!e.model && e.count) return Promise.reject('请填写存储型号');
            if (e.model && !e.count) return Promise.reject('请填写存储数量');
            if (!e.model && !e.count) return Promise.reject('请填写完整或删除空行');
          }
          return Promise.resolve();
        }}]}
      >
        <MultiEntry
          brandOptions={hwOptions.storageBrands || []}
          modelsByBrand={hwOptions.storageModelsByBrand || {}}
          modelOptions={hwOptions.storageModel || []}
          fullModels={hwOptions.storageModels || []}
          modelPlaceholder="480GB SSD" countPlaceholder="数量" />
      </Form.Item>

      <Form.Item name="nic" label="网卡" valuePropName="value" getValueFromEvent={(v:HwEntry[])=>v}
        rules={[{ validator: (_, v: HwEntry[]) => {
          if (!v?.length) return Promise.resolve();
          for (const e of v) {
            if (!e.model && e.count) return Promise.reject('请填写网卡型号');
            if (e.model && !e.count) return Promise.reject('请填写网卡数量');
            if (!e.model && !e.count) return Promise.reject('请填写完整或删除空行');
          }
          return Promise.resolve();
        }}]}
      >
        <MultiEntry
          brandOptions={hwOptions.nicBrands || []}
          modelsByBrand={hwOptions.nicModelsByBrand || {}}
          modelOptions={hwOptions.nicModel || []}
          fullModels={hwOptions.nicModels || []}
          modelPlaceholder="25GbE SFP28" countPlaceholder="数量" />
      </Form.Item>

      <Form.Item name="description" label="备注"><Input.TextArea rows={2} /></Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={loading}>{initialValues?.id?'更新':'添加'}</Button>
          {onCancel && <Button onClick={onCancel}>取消</Button>}
        </Space>
      </Form.Item>
    </Form>
  );
};

export default DeviceForm;
