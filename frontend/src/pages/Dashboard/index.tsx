import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Col, Row, Statistic, Spin, Empty, Tag, message } from 'antd';
import {
  CloudServerOutlined,
  HddOutlined,
  ApartmentOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import api from '@/api/client';
import type { Datacenter, Rack, Device } from '@/types';
import RackOverview from '@/components/RackView/RackOverview';

const Dashboard: React.FC = () => {
  const [datacenters, setDatacenters] = useState<Datacenter[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/datacenters').then(({ data }) => {
      if (data.data) {
        setDatacenters(data.data);
      } else {
        setDatacenters(data);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!datacenters.length) return <Empty description="暂无数据，请先创建机房" />;

  const allRacks: Rack[] = datacenters.flatMap((dc) =>
    dc.rows?.flatMap((row) => row.racks || []) || [],
  );
  const allDevices: Device[] = allRacks.flatMap((r) => r.devices || []);
  const activeDevices = allDevices.filter((d) => d.status === 'active');
  const plannedDevices = allDevices.filter((d) => d.status === 'planned');
  const totalUsedU = allDevices.reduce((s, d) => s + d.heightU, 0);
  const totalU = allRacks.reduce((s, r) => s + r.totalU, 0);

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card><Statistic title="机房数" value={datacenters.length} prefix={<CloudServerOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="机柜数" value={allRacks.length} prefix={<AppstoreOutlined />} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="设备总数" value={allDevices.length} prefix={<HddOutlined />} valueStyle={{ color: '#1677ff' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="运行中" value={activeDevices.length} prefix={<ApartmentOutlined />} valueStyle={{ color: '#52c41a' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="待上架" value={plannedDevices.length} prefix={<ApartmentOutlined />} valueStyle={{ color: '#faad14' }} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title="空闲U位" value={totalU - totalUsedU} suffix={`/ ${totalU}U`} prefix={<AppstoreOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Card>
        </Col>
      </Row>

      {datacenters.map((dc) => (
        <Card key={dc.id} title={`${dc.name}${dc.location ? ` (${dc.location})` : ''}`} style={{ marginBottom: 16 }}>
          {dc.rows?.map((row) => (
            <div key={row.id} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>{row.name}</div>
              <Row gutter={[16, 16]}>
                {row.racks?.map((rack) => (
                  <Col key={rack.id} span={6} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => navigate(`/racks/${rack.id}`)}
                      title={rack.name}
                      extra={<Tag color="blue">{rack.devices?.length || 0} 设备</Tag>}
                    >
                      <RackOverview rack={rack} />
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
};

export default Dashboard;
