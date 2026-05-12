import React from 'react';
import type { Rack } from '@/types';

const U_HEIGHT = 0.045;
const RACK_W = 0.6;
const RACK_D = 1.0;
const FRAME_T = 0.022;

interface Props {
  rack: Rack;
}

const RackFrame: React.FC<Props> = ({ rack }) => {
  const totalU = rack.totalU || 42;
  const totalH = totalU * U_HEIGHT;

  const postPositions: [number, number, number][] = [
    [-RACK_W / 2, 0, -RACK_D / 2],
    [RACK_W / 2, 0, -RACK_D / 2],
    [-RACK_W / 2, 0, RACK_D / 2],
    [RACK_W / 2, 0, RACK_D / 2],
  ];

  return (
    <group>
      {/* 底座 — 发光边 */}
      <mesh position={[0, -totalH / 2 - 0.04, 0]}>
        <boxGeometry args={[RACK_W + 0.08, 0.06, RACK_D + 0.12]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.6} metalness={0.8} />
      </mesh>
      <mesh position={[0, -totalH / 2 - 0.04 + 0.03, 0]}>
        <boxGeometry args={[RACK_W + 0.09, 0.004, RACK_D + 0.14]} />
        <meshStandardMaterial color="#64ffda" roughness={0.3} metalness={0.2} emissive="#64ffda" emissiveIntensity={0.5} />
      </mesh>

      {/* 顶部 — 发光边 */}
      <mesh position={[0, totalH / 2 + 0.04, 0]}>
        <boxGeometry args={[RACK_W + 0.08, 0.05, RACK_D]} />
        <meshStandardMaterial color="#1a2a3a" roughness={0.6} metalness={0.8} />
      </mesh>
      <mesh position={[0, totalH / 2 + 0.04 - 0.025, 0]}>
        <boxGeometry args={[RACK_W + 0.09, 0.004, RACK_D + 0.02]} />
        <meshStandardMaterial color="#64ffda" roughness={0.3} metalness={0.2} emissive="#64ffda" emissiveIntensity={0.4} />
      </mesh>

      {/* 四角立柱 — 暗金属 */}
      {postPositions.map((pos, i) => (
        <mesh key={`post-${i}`} position={pos}>
          <boxGeometry args={[FRAME_T, totalH, FRAME_T]} />
          <meshStandardMaterial color="#2a3a4a" roughness={0.4} metalness={0.9} />
        </mesh>
      ))}

      {/* 前后横梁 */}
      {[-RACK_D / 2, RACK_D / 2].map((z, i) => (
        <React.Fragment key={`beam-${i}`}>
          <mesh position={[0, -totalH / 2, z]}>
            <boxGeometry args={[RACK_W, FRAME_T, FRAME_T]} />
            <meshStandardMaterial color="#2a3a4a" roughness={0.4} metalness={0.9} />
          </mesh>
          <mesh position={[0, totalH / 2, z]}>
            <boxGeometry args={[RACK_W, FRAME_T, FRAME_T]} />
            <meshStandardMaterial color="#2a3a4a" roughness={0.4} metalness={0.9} />
          </mesh>
        </React.Fragment>
      ))}

      {/* 前面板半透明玻璃 */}
      <mesh position={[0, 0, RACK_D / 2 + 0.006]}>
        <boxGeometry args={[RACK_W - FRAME_T * 2, totalH - FRAME_T * 2, 0.008]} />
        <meshStandardMaterial
          color="#0a1a2a"
          roughness={0.2}
          metalness={0.1}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* 前面板网格线 — 5U加亮 */}
      {Array.from({ length: totalU + 1 }, (_, i) => {
        const y = ((i - 0.5) - totalU / 2) * U_HEIGHT;
        const isMajor = i % 5 === 0;
        return (
          <mesh key={`line-${i}`} position={[0, y, RACK_D / 2 + 0.012]}>
            <boxGeometry args={[RACK_W - FRAME_T * 2, isMajor ? 0.003 : 0.0012, 0.002]} />
            <meshStandardMaterial
              color={isMajor ? '#4fc3f7' : '#1a3048'}
              roughness={0.6}
              transparent
              opacity={isMajor ? 0.7 : 0.4}
              emissive={isMajor ? '#4fc3f7' : '#000'}
              emissiveIntensity={isMajor ? 0.6 : 0}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default RackFrame;
