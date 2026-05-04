import React, { useState } from 'react';
import { Select } from 'antd';

interface Props {
  value?: string;
  onChange?: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const SuggestSelect: React.FC<Props> = ({ value, onChange, options, placeholder, disabled, style }) => {
  const [search, setSearch] = useState('');
  const filtered = options.filter((o) => o.toLowerCase().includes(search.toLowerCase()));
  const allOptions = [...filtered.map((o) => ({ label: o, value: o }))];
  if (search && !filtered.some((o) => o.toLowerCase() === search.toLowerCase())) {
    allOptions.push({ label: `添加 "${search}"`, value: search });
  }
  if (value && !allOptions.some((o) => o.value === value)) {
    allOptions.unshift({ label: value, value });
  }
  return (
    <Select
      showSearch
      value={value || undefined}
      onChange={onChange}
      onSearch={(v) => setSearch(v)}
      onBlur={() => setSearch('')}
      filterOption={false}
      placeholder={placeholder}
      disabled={disabled}
      style={style}
      options={allOptions}
    />
  );
};

export default SuggestSelect;
