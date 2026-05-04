import React from 'react';
import { Button, Space, InputNumber } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import SuggestSelect from './SuggestSelect';

export interface HwEntry {
  brand?: string;
  model: string;
  count: number;
  [key: string]: any;
}

interface Props {
  value?: HwEntry[];
  onChange?: (entries: HwEntry[]) => void;
  brandOptions?: string[];
  modelsByBrand?: Record<string, string[]>;
  modelOptions: string[];
  modelPlaceholder: string;
  countPlaceholder: string;
  fullModels?: Record<string, any>[];
}

const MultiEntry: React.FC<Props> = ({
  value = [],
  onChange,
  brandOptions,
  modelsByBrand,
  modelOptions,
  modelPlaceholder,
  countPlaceholder,
  fullModels,
}) => {
  const add = () => {
    onChange?.([...value, { brand: '', model: '', count: 1 }]);
  };

  const remove = (index: number) => {
    onChange?.(value.filter((_, i) => i !== index));
  };

  const update = (index: number, field: string, val: string | number | null) => {
    const next = value.map((item, i) => {
      if (i !== index) return item;
      const updated = { ...item, [field]: val ?? (field === 'count' ? 1 : '') };
      if (field === 'brand') updated.model = '';
      if (field === 'model' && fullModels && typeof val === 'string') {
        const full = fullModels.find((m: any) => m.model === val && m.brand === (updated.brand || item.brand));
        if (full) Object.assign(updated, full);
      }
      return updated;
    });
    onChange?.(next);
  };

  const getModelOpts = (brand?: string) => {
    if (brand && modelsByBrand?.[brand]) return modelsByBrand[brand];
    if (brand) return [];
    return modelOptions;
  };

  return (
    <div>
      {value.map((entry, i) => (
        <Space key={i} style={{ marginBottom: 6 }} align="start">
          {brandOptions && (
            <SuggestSelect
              options={brandOptions}
              value={entry.brand || ''}
              onChange={(v) => update(i, 'brand', v)}
              placeholder="品牌"
              style={{ width: 100 }}
            />
          )}
          <SuggestSelect
            options={getModelOpts(entry.brand)}
            value={entry.model}
            onChange={(v) => update(i, 'model', v)}
            placeholder={modelPlaceholder}
            disabled={brandOptions && !entry.brand}
            style={{ flex: 1, minWidth: 180 }}
          />
          <InputNumber
            value={entry.count}
            onChange={(v) => update(i, 'count', v)}
            placeholder={countPlaceholder}
            min={1}
            style={{ width: 80 }}
          />
          <Button type="text" danger size="small" icon={<DeleteOutlined />}
            onClick={() => remove(i)} style={{ marginTop: 4 }} />
        </Space>
      ))}
      <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={add} block>
        添加
      </Button>
    </div>
  );
};

export default MultiEntry;
