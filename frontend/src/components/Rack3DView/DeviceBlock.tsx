import React from 'react';
import { Html } from '@react-three/drei';
import type { Device } from '@/types';

const U_HEIGHT = 0.045;
const RACK_W = 0.6;
const RACK_D = 1.0;
const PAD = 0.02;

interface Props {
  device: Device;
  totalU: number;
  selected: boolean;
  hovered: boolean;
  onClick: (d: Device) => void;
  onHover: (id: number | null) => void;
}

const DeviceBlock: React.FC<Props> = ({ device, totalU, selected, hovered, onClick, onHover }) => {
  const y = ((device.startU + device.heightU / 2 - 0.5) - totalU / 2) * U_HEIGHT;
  const h = device.heightU * U_HEIGHT - PAD;
  const w = RACK_W - PAD * 2;
  const d = RACK_D - PAD * 2;
  const color = device.deviceType?.color || '#4A90D9';
  const active = hovered || selected;

  return (
    <group>
      <mesh
        position={[0, y, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(device); }}
        onPointerOver={(e) => { e.stopPropagation(); onHover(device.id); }}
        onPointerOut={() => onHover(null)}
      >
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial
          color={color}
          roughness={0.25}
          metalness={0.15}
          emissive={color}
          emissiveIntensity={active ? 0.7 : 0.2}
        />
      </mesh>

      {/* glow border when active */}
      {active && (
        <mesh position={[0, y, 0]}>
          <boxGeometry args={[w + 0.01, h + 0.01, d + 0.01]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
      )}

      {active && (
        <Html position={[0, y, RACK_D / 2 + 0.08]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(6,9,15,0.92)',
            border: '1px solid rgba(100,255,218,0.35)',
            color: '#e0f0ff', padding: '4px 12px',
            borderRadius: 4, fontSize: 11, whiteSpace: 'nowrap', textAlign: 'center',
            boxShadow: '0 0 16px rgba(100,255,218,0.2)',
          }}>
            <div style={{ fontWeight: 600, color: '#64ffda' }}>{device.name}</div>
            <div style={{ opacity: 0.7, fontSize: 10 }}>
              {device.brand && `${device.brand} `}{device.model}
            </div>
            <div style={{ opacity: 0.5, fontSize: 9 }}>
              U{device.startU}-U{device.startU + device.heightU - 1}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

export default DeviceBlock;
