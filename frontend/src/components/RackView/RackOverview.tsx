import React from 'react';
import type { Rack, Device } from '@/types';

const slotColors: Record<string, string> = {
  active: '#4A90D9',
  offline: '#909399',
  maintenance: '#E6A23C',
};

interface Props {
  rack: Rack;
  width?: number;
  slotHeight?: number;
}

const RackOverview: React.FC<Props> = ({ rack, width = 120, slotHeight = 6 }) => {
  const uSlots = Array.from({ length: rack.totalU }, (_, i) => rack.totalU - i);
  const deviceMap = new Map<number, Device>();
  rack.devices?.forEach((d) => {
    for (let u = d.startU; u < d.startU + d.heightU; u++) {
      deviceMap.set(u, d);
    }
  });

  const pad = 4;
  const innerW = width - pad * 2;

  return (
    <svg width={width} height={rack.totalU * slotHeight + pad * 2}>
      <rect x={0} y={0} width={width} height={rack.totalU * slotHeight + pad * 2} fill="#fafafa" stroke="#d9d9d9" rx={2} />
      {uSlots.map((u) => {
        const device = deviceMap.get(u);
        const y = (rack.totalU - u) * slotHeight + pad;
        if (device) {
          const isFirstSlot = u === device.startU;
          return (
            <rect
              key={u}
              x={pad}
              y={y}
              width={innerW}
              height={slotHeight}
              fill={device.deviceType?.color || slotColors[device.status] || '#4A90D9'}
              rx={1}
            />
          );
        }
        return (
          <rect
            key={u}
            x={pad}
            y={y}
            width={innerW}
            height={slotHeight}
            fill="#fff"
            stroke="#eee"
            strokeWidth={0.5}
          />
        );
      })}
    </svg>
  );
};

export default RackOverview;
