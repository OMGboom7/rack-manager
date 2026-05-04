import React, { useMemo, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { Rack, Device } from '@/types';

interface Props {
  rack: Rack;
  selectedDeviceId?: number;
  onDeviceClick?: (device: Device) => void;
  onDeviceMove?: (deviceId: number, newStartU: number) => void;
  uHeight?: number;
  width?: number;
}

const FULL_U_HEIGHT = 26;

interface DroppableSlotProps {
  u: number;
  totalU: number;
  uHeight: number;
  innerW: number;
  isHighlighted: boolean;
  isConflict: boolean;
}

const DroppableSlot: React.FC<DroppableSlotProps> = React.memo(({ u, totalU, uHeight, innerW, isHighlighted, isConflict }) => {
  const { setNodeRef } = useDroppable({ id: `slot-${u}` });
  const y = (totalU - u) * uHeight;

  let bg = 'transparent';
  if (isHighlighted) bg = isConflict ? 'rgba(255,77,79,0.25)' : 'rgba(82,196,26,0.2)';

  return (
    <div
      ref={setNodeRef}
      style={{
        position: 'absolute',
        left: 0, top: y,
        width: innerW, height: uHeight,
        background: bg,
        borderBottom: '1px solid #f0f0f0',
        zIndex: isHighlighted ? 10 : 0,
      }}
    />
  );
});

interface DraggableDeviceProps {
  device: Device;
  topY: number;
  deviceH: number;
  innerW: number;
  selected: boolean;
  onClick: (d: Device) => void;
  isDragging: boolean;
}

const DraggableDevice: React.FC<DraggableDeviceProps> = ({ device, topY, deviceH, innerW, selected, onClick, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: `device-${device.id}` });
  const style: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: topY,
    width: innerW,
    height: deviceH,
    background: device.deviceType?.color || '#4A90D9',
    borderRadius: 4,
    color: '#fff',
    fontSize: 11,
    padding: '2px 6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    cursor: 'grab',
    border: selected ? '2px solid #fff' : '2px solid transparent',
    boxShadow: selected ? '0 0 6px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    zIndex: isDragging ? 999 : 2,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} onClick={(e) => { e.stopPropagation(); onClick(device); }}>
      <div style={{ fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {device.name}
      </div>
      {deviceH >= 40 && (
        <div style={{ fontSize: 10, opacity: 0.85, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {device.brand && `${device.brand} `}{device.model}
        </div>
      )}
      {deviceH >= 55 && device.ipAddress && (
        <div style={{ fontSize: 9, opacity: 0.7 }}>{device.ipAddress}</div>
      )}
    </div>
  );
};

const RackView: React.FC<Props> = ({
  rack,
  selectedDeviceId,
  onDeviceClick,
  onDeviceMove,
  uHeight = FULL_U_HEIGHT,
  width = 280,
}) => {
  const total = rack.totalU || 42;
  const labelW = 36;
  const pad = 2;
  const innerW = width - labelW - pad * 2;
  const totalH = total * uHeight;
  const containerH = totalH + pad * 2;
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [overSlot, setOverSlot] = React.useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const sortedDevices = useMemo(() => {
    if (!rack.devices) return [];
    return [...rack.devices].sort((a, b) => b.startU - a.startU);
  }, [rack.devices]);

  const activeDevice = activeId ? rack.devices?.find((d) => `device-${d.id}` === activeId) : null;

  const highlightedSlots = useMemo(() => {
    if (!activeDevice || overSlot === null) return new Set<number>();
    const s = Math.max(1, Math.min(overSlot, total - activeDevice.heightU + 1));
    const set = new Set<number>();
    for (let u = s; u < s + activeDevice.heightU; u++) set.add(u);
    return set;
  }, [activeDevice, overSlot, total]);

  const findConflict = useCallback(
    (deviceId: number, targetU: number, heightU: number): Device | null => {
      if (!rack.devices) return null;
      return rack.devices.find(
        (d) => d.id !== deviceId && targetU < d.startU + d.heightU && targetU + heightU > d.startU,
      ) || null;
    },
    [rack.devices],
  );

  const hasConflict = useMemo(() => {
    if (!activeDevice || overSlot === null) return false;
    const targetU = Math.max(1, Math.min(overSlot, total - activeDevice.heightU + 1));
    return !!findConflict(activeDevice.id, targetU, activeDevice.heightU);
  }, [activeDevice, overSlot, findConflict, total]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (!event.over) { setOverSlot(null); return; }
    const slotMatch = String(event.over.id).match(/^slot-(\d+)$/);
    if (slotMatch) setOverSlot(parseInt(slotMatch[1]));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setOverSlot(null);
    const { active, over } = event;
    if (!over) return;
    const slotMatch = String(over.id).match(/^slot-(\d+)$/);
    if (!slotMatch) return;
    const newU = parseInt(slotMatch[1]);
    const deviceIdMatch = String(active.id).match(/^device-(\d+)$/);
    if (!deviceIdMatch) return;
    const deviceId = parseInt(deviceIdMatch[1]);
    const device = rack.devices?.find((d) => d.id === deviceId);
    if (!device) return;
    const targetU = Math.max(1, Math.min(newU, total - device.heightU + 1));
    if (targetU === device.startU) return;
    onDeviceMove?.(deviceId, targetU);
  };

  const getDeviceTopY = (device: Device) =>
    (total - (device.startU + device.heightU - 1)) * uHeight + pad;

  const getDeviceBlockH = (device: Device) =>
    device.heightU * uHeight - pad * 2;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div style={{
        position: 'relative',
        width,
        height: containerH,
        background: '#fafafa',
        border: '1px solid #bbb',
        borderRadius: 4,
        userSelect: 'none',
      }}>
        <div style={{
          position: 'absolute',
          left: labelW, top: 0,
          width: innerW, height: totalH,
        }}>
          {Array.from({ length: total }, (_, i) => i + 1).map((u) => (
            <DroppableSlot
              key={u}
              u={u}
              totalU={total}
              uHeight={uHeight}
              innerW={innerW}
              isHighlighted={highlightedSlots.has(u)}
              isConflict={hasConflict && highlightedSlots.has(u)}
            />
          ))}

          {sortedDevices.map((device) => (
            <DraggableDevice
              key={device.id}
              device={device}
              topY={getDeviceTopY(device)}
              deviceH={getDeviceBlockH(device)}
              innerW={innerW}
              selected={device.id === selectedDeviceId}
              onClick={(d) => onDeviceClick?.(d)}
              isDragging={activeId === `device-${device.id}`}
            />
          ))}
        </div>

        {Array.from({ length: total }, (_, i) => i + 1).map((u) => {
          const y = (total - u) * uHeight;
          return (
            <React.Fragment key={`label-${u}`}>
              <div style={{
                position: 'absolute',
                left: 0, top: y,
                width: labelW - 4, height: uHeight,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                fontSize: 10, color: '#999', paddingRight: 4,
              }}>
                {u}U
              </div>
              {u % 5 === 0 && (
                <div style={{
                  position: 'absolute',
                  left: labelW - 2, top: y,
                  width: innerW + 4, height: 0,
                  borderTop: '1px solid #d9d9d9',
                }} />
              )}
            </React.Fragment>
          );
        })}

        <DragOverlay dropAnimation={null}>
          {activeDevice ? (
            <div style={{
              width: innerW,
              background: activeDevice.deviceType?.color || '#4A90D9',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}>
              {activeDevice.name}
              <div style={{ fontSize: 10, opacity: 0.85, fontWeight: 400 }}>
                U{activeDevice.startU}-U{activeDevice.startU + activeDevice.heightU - 1}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default RackView;
