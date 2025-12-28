import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Table } from '../types';
import { KeyIcon, ColumnsIcon } from './icons';
import styled from '@emotion/styled';

interface TableNodeData {
  table: Table;
}

const NodeContainer = styled.div`
  background: #1e293b;
  border: 2px solid #475569;
  border-radius: 8px;
  min-width: 250px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  
  &:hover {
    border-color: #06b6d4;
    box-shadow: 0 10px 15px -3px rgba(6, 182, 212, 0.2);
  }
`;

const NodeHeader = styled.div`
  padding: 12px;
  background: rgba(71, 85, 105, 0.3);
  border-bottom: 1px solid #475569;
  font-weight: bold;
  color: #e2e8f0;
`;

const ColumnList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const ColumnItem = styled.li`
  padding: 10px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #334155;
  font-size: 0.875rem;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
`;

const ColumnName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ColumnType = styled.span`
  font-family: monospace;
  color: #22d3ee;
  font-size: 0.75rem;
`;

const ColumnNameText = styled.span<{ isPk: boolean }>`
  font-family: monospace;
  color: ${props => props.isPk ? '#fde047' : '#cbd5e1'};
`;

const StyledHandle = styled(Handle)`
  background: #06b6d4;
  width: 10px;
  height: 10px;
  border: 2px solid #1e293b;
`;

export const TableNode = memo(({ data }: NodeProps<TableNodeData>) => {
  const { table } = data;

  return (
    <NodeContainer>
      <NodeHeader>{table.name}</NodeHeader>
      <ColumnList>
        {table.columns.map((column) => {
          const isPk = column.attributes.includes('pk');
          const columnId = `${table.name}-${column.name}`;
          return (
            <ColumnItem key={column.name}>
              <StyledHandle 
                type="target" 
                position={Position.Left} 
                id={`${columnId}-target`}
                style={{ left: -6 }}
              />
              <ColumnName>
                {isPk ? (
                  <KeyIcon className="w-4 h-4 text-yellow-400" />
                ) : (
                  <ColumnsIcon className="w-4 h-4 text-slate-500" />
                )}
                <ColumnNameText isPk={isPk}>{column.name}</ColumnNameText>
              </ColumnName>
              <ColumnType>{column.type}</ColumnType>
              <StyledHandle 
                type="source" 
                position={Position.Right} 
                id={`${columnId}-source`}
                style={{ right: -6 }}
              />
            </ColumnItem>
          );
        })}
      </ColumnList>
    </NodeContainer>
  );
});

TableNode.displayName = 'TableNode';