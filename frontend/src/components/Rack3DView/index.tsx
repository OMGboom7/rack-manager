import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { Device, Rack } from '@/types';
import RackFrame from './RackFrame';
import DeviceBlock from './DeviceBlock';

interface Props {
  rack: Rack;
  selectedDeviceId?: number;
  onDeviceClick?: (device: Device) => void;
}

const RackScene: React.FC<{ rack: Rack; selectedDeviceId?: number; onDeviceClick?: (d: Device) => void }> = ({ rack, selectedDeviceId, onDeviceClick }) => {
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  return (
    <group>
      <RackFrame rack={rack} />
      {rack.devices?.map((device) => (
        <DeviceBlock
          key={device.id}
          device={device}
          totalU={rack.totalU}
          selected={device.id === selectedDeviceId}
          hovered={device.id === hoveredId}
          onClick={(d) => onDeviceClick?.(d)}
          onHover={setHoveredId}
        />
      ))}
    </group>
  );
};

const Rack3DView: React.FC<Props> = ({ rack, selectedDeviceId, onDeviceClick }) => {
  return (
    <div style={{ width: '100%', height: 500, background: '#1a1a2e', borderRadius: 4 }}>
      <Canvas
        camera={{ position: [1.5, 0.3, 1.8], fov: 50 }}
        style={{ cursor: 'grab' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[2, 3, 2]} intensity={0.8} />
          <pointLight position={[0, 0.5, 0]} intensity={0.3} />
          <pointLight position={[0, -0.5, 0]} intensity={0.2} color="#3366ff" />

          <RackScene rack={rack} selectedDeviceId={selectedDeviceId} onDeviceClick={onDeviceClick} />

          {/* 地面 */}
          <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[4, 4]} />
            <meshStandardMaterial color="#222" roughness={0.9} />
          </mesh>

          <OrbitControls
            enablePan={false}
            minDistance={1}
            maxDistance={4}
            target={[0, 0, 0]}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Rack3DView;
