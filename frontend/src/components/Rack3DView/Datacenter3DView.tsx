import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Text } from '@react-three/drei';
import type { Datacenter } from '@/types';
import RackFrame from './RackFrame';
import DeviceBlock from './DeviceBlock';

const RACK_SPACING = 3.0;
const ROW_SPACING = 3.0;

interface Props {
  datacenter: Datacenter;
}

const GridFloor: React.FC = () => {
  const size = 30;
  const step = 1;
  const lines: number[] = [];
  for (let i = -size; i <= size; i += step) {
    lines.push(i, -1.5, -size, i, -1.5, size);
    lines.push(-size, -1.5, i, size, -1.5, i);
  }

  return (
    <group>
      <mesh position={[0, -1.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size * 2, size * 2]} />
        <meshStandardMaterial color="#1a2030" roughness={0.85} />
      </mesh>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(lines), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#30486a" transparent opacity={0.35} />
      </lineSegments>
    </group>
  );
};

const RackGroup: React.FC<{ rack: any; position: [number, number, number]; hoveredId: number | null; onHover: (id: number | null) => void }> = ({ rack, position, hoveredId, onHover }) => {
  const totalH = (rack.totalU || 42) * 0.045;
  const groundY = -1.52 + totalH / 2 + 0.07;
  return (
    <group position={[position[0], groundY, position[2]]}>
      <Text
        position={[0, -1.52 - groundY + 0.05, 0.65]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        outlineWidth={0.025}
        outlineColor="#b388ff"
        outlineOpacity={0.6}
      >
        {rack.name}
      </Text>
      <RackFrame rack={rack} />
      {rack.devices?.map((device: any) => (
        <DeviceBlock key={device.id} device={device} totalU={rack.totalU} selected={false} hovered={device.id === hoveredId} onClick={() => {}} onHover={onHover} />
      ))}
    </group>
  );
};

const DatacenterScene: React.FC<{ dc: Datacenter }> = ({ dc }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const rows: { row: any; racks: { rack: any; pos: [number, number, number] }[] }[] = [];

  dc.rows?.forEach((row, ri) => {
    const rc: { rack: any; pos: [number, number, number] }[] = [];
    row.racks?.forEach((rack, rj) => {
      rc.push({ rack, pos: [rj * RACK_SPACING, 0, ri * -ROW_SPACING] });
    });
    rows.push({ row, racks: rc });
  });

  return (
    <group>
      {/* Row background planes on ground */}
      {rows.map((rd, ri) => {
        const rackCount = rd.racks.length || 1;
        const rackEnd = (rackCount - 1) * RACK_SPACING;
        const backWidth = rackEnd + 7;
        const centerX = (rackEnd - 5) / 2;
        const colors = ['#2a5580', '#2a6044', '#553380', '#336666', '#555580'];
        const hue = colors[ri % colors.length];
        return (
          <mesh key={`row-bg-${ri}`} position={[centerX, -1.51, rd.racks[0]?.pos[2] || 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[backWidth, 2.5]} />
            <meshStandardMaterial color={hue} roughness={0.7} transparent opacity={0.85} />
          </mesh>
        );
      })}
      {rows.map((rd) => {
        const rowZ = rd.racks[0]?.pos[2] || 0;
        return (
          <group key={`row-${rd.row.id}`}>
            {/* Row label to the left of the first rack */}
            <Html position={[-5, 0, rowZ]}>
              <div style={{
                color: '#4fc3f7', fontSize: 14, fontWeight: 800, letterSpacing: 2,
                textShadow: '0 0 10px rgba(79,195,247,0.8)',
                whiteSpace: 'nowrap',
              }}>
                {rd.row.name}
              </div>
            </Html>
            {rd.racks.map((r) => (
              <RackGroup key={r.rack.id} rack={r.rack} position={r.pos} hoveredId={hoveredId} onHover={setHoveredId} />
            ))}
          </group>
        );
      })}
      {rows.length === 0 && (
        <RackGroup rack={{ name: '示例机柜', totalU: 42, devices: [] }} position={[0, 0, 0]} hoveredId={null} onHover={() => {}} />
      )}
    </group>
  );
};

const Datacenter3DView: React.FC<Props> = ({ datacenter }) => {
  const rowCount = datacenter.rows?.length || 1;
  const rackCount = Math.max(...(datacenter.rows?.map(r => r.racks?.length || 0) || [1]));
  const viewDist = Math.max(rackCount * 2.0, rowCount * 3.5, 6);

  const typeSet = new Map<string, string>();
  datacenter.rows?.forEach(row =>
    row.racks?.forEach(rack =>
      rack.devices?.forEach((d: any) => {
        if (d.deviceType) typeSet.set(d.deviceType.name, d.deviceType.color);
      }),
    ),
  );
  const types = Array.from(typeSet.entries());

  return (
    <div style={{
      width: '100%', height: 600,
      background: 'linear-gradient(180deg, #162035 0%, #1a2840 100%)',
      borderRadius: 8,
      position: 'relative',
    }}>
      {/* Device type legend */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        background: 'rgba(6,9,15,0.85)',
        border: '1px solid rgba(79,195,247,0.3)',
        borderRadius: 6, padding: '8px 12px',
        color: '#e0f0ff', fontSize: 11,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: '#4fc3f7' }}>设备图例</div>
        {types.map(([name, color]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 12, height: 12, background: color, borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
            <span>{name}</span>
          </div>
        ))}
      </div>
      <Canvas camera={{ position: [0, viewDist * 0.5, viewDist], fov: 45 }} style={{ cursor: 'grab' }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} color="#d0e0ff" />
          <directionalLight position={[8, 12, 8]} intensity={0.9} color="#ffffff" />
          <directionalLight position={[-4, 6, -6]} intensity={0.4} color="#90caf9" />

          <GridFloor />
          <DatacenterScene dc={datacenter} />

          <OrbitControls enablePan={true} minDistance={2} maxDistance={20} target={[0, 0, 0]} makeDefault />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Datacenter3DView;
