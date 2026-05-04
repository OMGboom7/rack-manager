import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, Space, Empty, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api from '@/api/client';

interface AuditRecord {
  id: number;
  userId: number;
  user?: { username: string; realName?: string };
  action: string;
  entity: string;
  entityId?: number;
  detail?: string;
  createdAt: string;
}

const actionColors: Record<string, string> = {
  CREATE: 'green', UPDATE: 'blue', DELETE: 'red',
  LOGIN: 'purple', REGISTER: 'cyan',
};

const AuditLog: React.FC = () => {
  const [data, setData] = useState<AuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });
  const [entityFilter, setEntityFilter] = useState<string>();

  const load = async (page: number, pageSize: number, entity?: string) => {
    setLoading(true);
    api.get('/audit', { params: { page, pageSize, entity } })
      .then(({ data: res }) => {
        setData(res.data || res);
        setPagination({ current: res.page || page, pageSize: res.pageSize || pageSize, total: res.total || 0 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(1, 50); }, []);

  const handleFilter = (e: string | undefined) => {
    setEntityFilter(e);
    load(1, pagination.pageSize, e);
  };

  const filtered = data;

  const entities = [...new Set(data.map((d) => d.entity))].sort();

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '用户',
      key: 'user',
      width: 100,
      render: (_: unknown, r: AuditRecord) => r.user?.realName || r.user?.username || '-',
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (v: string) => <Tag color={actionColors[v] || 'default'}>{v}</Tag>,
    },
    {
      title: '对象类型',
      dataIndex: 'entity',
      key: 'entity',
      width: 120,
      render: (v: string) => <Tag>{v}</Tag>,
    },
    { title: '详情', dataIndex: 'detail', key: 'detail' },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => v ? new Date(v).toLocaleString() : '-',
    },
  ];

  return (
    <Card
      title="操作审计日志"
      extra={
        <Space>
          <Select
            placeholder="按类型筛选"
            allowClear
            style={{ width: 150 }}
            value={entityFilter}
            onChange={handleFilter}
            options={entities.map((e) => ({ value: e, label: e }))}
          />
        </Space>
      }
    >
      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={pagination}
        locale={{ emptyText: <Empty description="暂无审计日志" /> }}
        onChange={(pag) => load(pag.current || 1, pag.pageSize || 50, entityFilter)}
      />
    </Card>
  );
};

export default AuditLog;
