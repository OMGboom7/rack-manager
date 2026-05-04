import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Space, Input, Empty, message } from 'antd';
import { SearchOutlined, ArrowRightOutlined } from '@ant-design/icons';
import api from '@/api/client';
import type { Rack } from '@/types';

const RackList: React.FC = () => {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const navigate = useNavigate();

  const loadRacks = async (page: number, pageSize: number, searchTerm?: string) => {
    setLoading(true);
    api.get('/racks', { params: { page, pageSize, search: searchTerm || undefined } })
      .then(({ data: res }) => {
        setRacks(res.data || res);
        setPagination({ current: res.page || page, pageSize: res.pageSize || pageSize, total: res.total || 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRacks(1, 20); }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    loadRacks(1, pagination.pageSize, val);
  };

  const columns = [
    { title: '机柜名称', dataIndex: 'name', key: 'name', render: (n: string) => <Tag color="blue">{n}</Tag> },
    { title: '所属机房', key: 'dc', render: (_: unknown, r: Rack) => `${r.row?.datacenter?.name || '-'} / ${r.row?.name || '-'}` },
    { title: 'U位', key: 'U', render: (_: unknown, r: Rack) => { const used = r.devices?.reduce((s, d) => s + d.heightU, 0) || 0; return `${used} / ${r.totalU}U`; } },
    { title: '设备数', key: 'devices', render: (_: unknown, r: Rack) => r.devices?.length || 0 },
    { title: '使用率', key: 'usage', render: (_: unknown, r: Rack) => { const used = r.devices?.reduce((s, d) => s + d.heightU, 0) || 0; const pct = Math.round((used / r.totalU) * 100); return <Tag color={pct > 80 ? 'red' : pct > 50 ? 'orange' : 'green'}>{pct}%</Tag>; } },
    { title: '操作', key: 'action', render: (_: unknown, r: Rack) => <ArrowRightOutlined style={{ cursor:'pointer', color:'#1677ff' }} onClick={() => navigate(`/racks/${r.id}`)} /> },
  ];

  return (
    <Card
      title="机柜列表"
      extra={<Input prefix={<SearchOutlined />} placeholder="搜索机柜/机房" value={search} onChange={e => handleSearch(e.target.value)} style={{ width: 200 }} allowClear />}
    >
      <Table
        dataSource={racks} columns={columns} rowKey="id" loading={loading}
        locale={{ emptyText: <Empty description="暂无数据" /> }}
        onRow={(r) => ({ onClick: () => navigate(`/racks/${r.id}`), style: { cursor: 'pointer' } })}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        onChange={(pag) => loadRacks(pag.current!, pag.pageSize!, search)}
      />
    </Card>
  );
};

export default RackList;
