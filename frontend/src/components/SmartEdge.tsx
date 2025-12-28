import React, { useMemo } from 'react';
import { EdgeProps, getSmoothStepPath, Position, useStore } from 'reactflow';

// Helper to determine which side of a node to use based on relative positions
function getSmartPositions(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceNode: any,
  targetNode: any
): { sourcePos: Position; targetPos: Position } {
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  
  // Determine primary direction (horizontal or vertical)
  const isMoreHorizontal = Math.abs(dx) > Math.abs(dy);
  
  if (isMoreHorizontal) {
    // Horizontal layout
    if (dx > 0) {
      // Target is to the right of source
      return { sourcePos: Position.Right, targetPos: Position.Left };
    } else {
      // Target is to the left of source
      return { sourcePos: Position.Left, targetPos: Position.Right };
    }
  } else {
    // Vertical layout
    if (dy > 0) {
      // Target is below source
      return { sourcePos: Position.Bottom, targetPos: Position.Top };
    } else {
      // Target is above source
      return { sourcePos: Position.Top, targetPos: Position.Bottom };
    }
  }
}

export function SmartEdge({
  id,
  source,
  target,
  sourceX: defaultSourceX,
  sourceY: defaultSourceY,
  targetX: defaultTargetX,
  targetY: defaultTargetY,
  data,
  style,
  label,
  labelStyle,
  labelBgStyle,
  markerStart,
  markerEnd,
}: EdgeProps) {
  // Get node positions from the store
  const sourceNode = useStore((store) => store.nodeInternals.get(source));
  const targetNode = useStore((store) => store.nodeInternals.get(target));

  const { edgePath, labelX, labelY, positions } = useMemo(() => {
    if (!sourceNode || !targetNode) {
      return {
        edgePath: '',
        labelX: 0,
        labelY: 0,
        positions: { sourcePos: Position.Right, targetPos: Position.Left }
      };
    }

    // Calculate center positions of nodes
    const sourceCenterX = sourceNode.position.x + (sourceNode.width || 280) / 2;
    const sourceCenterY = sourceNode.position.y + (sourceNode.height || 200) / 2;
    const targetCenterX = targetNode.position.x + (targetNode.width || 280) / 2;
    const targetCenterY = targetNode.position.y + (targetNode.height || 200) / 2;

    // Get smart positions based on node locations
    const positions = getSmartPositions(
      sourceCenterX,
      sourceCenterY,
      targetCenterX,
      targetCenterY,
      sourceNode,
      targetNode
    );

    // Calculate actual connection points based on smart positions
    let sourceX = sourceCenterX;
    let sourceY = sourceCenterY;
    let targetX = targetCenterX;
    let targetY = targetCenterY;

    const sourceWidth = sourceNode.width || 280;
    const sourceHeight = sourceNode.height || 200;
    const targetWidth = targetNode.width || 280;
    const targetHeight = targetNode.height || 200;

    // Adjust source position
    switch (positions.sourcePos) {
      case Position.Right:
        sourceX = sourceNode.position.x + sourceWidth;
        break;
      case Position.Left:
        sourceX = sourceNode.position.x;
        break;
      case Position.Bottom:
        sourceY = sourceNode.position.y + sourceHeight;
        break;
      case Position.Top:
        sourceY = sourceNode.position.y;
        break;
    }

    // Adjust target position
    switch (positions.targetPos) {
      case Position.Right:
        targetX = targetNode.position.x + targetWidth;
        break;
      case Position.Left:
        targetX = targetNode.position.x;
        break;
      case Position.Bottom:
        targetY = targetNode.position.y + targetHeight;
        break;
      case Position.Top:
        targetY = targetNode.position.y;
        break;
    }

    // Generate smooth step path
    const [path, lx, ly] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition: positions.sourcePos,
      targetX,
      targetY,
      targetPosition: positions.targetPos,
    });

    return {
      edgePath: path,
      labelX: lx,
      labelY: ly,
      positions
    };
  }, [sourceNode, targetNode]);

  if (!sourceNode || !targetNode) {
    return null;
  }

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={style}
        markerStart={markerStart}
        markerEnd={markerEnd}
      />
      {label && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x={-20}
            y={-10}
            width={40}
            height={20}
            rx={labelBgStyle?.rx || 4}
            fill={labelBgStyle?.fill || '#1e293b'}
            fillOpacity={labelBgStyle?.fillOpacity || 0.95}
          />
          <text
            x={0}
            y={0}
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: labelStyle?.fontSize || 11,
              fontWeight: labelStyle?.fontWeight || 600,
              fill: labelStyle?.fill || '#22d3ee',
            }}
          >
            {label}
          </text>
        </g>
      )}
    </>
  );
}
