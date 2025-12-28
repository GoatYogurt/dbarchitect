
import { ParsedSchema, Table, Column, Ref } from '../types';

export function parseDBML(dbml: string): ParsedSchema {
  if (!dbml.trim()) {
    return { tables: [], refs: [] };
  }

  const tables: Table[] = [];
  const refs: Ref[] = [];

  // Regex to find all Table blocks
  const tableRegex = /Table\s+(\w+)\s*\{([\s\S]*?)\}/g;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(dbml)) !== null) {
    const tableName = tableMatch[1];
    const tableContent = tableMatch[2];
    const columns: Column[] = [];
    const columnMap: Record<string, Column> = {};

    const lines = tableContent.split('\n');
    let inIndexes = false;

    for (let raw of lines) {
      let line = raw.trim();
      if (!line || line.startsWith('//')) continue;

      // Enter indexes block
      if (/^indexes\s*\{/i.test(line)) {
        inIndexes = true;
        continue;
      }

      // Exit indexes block
      if (inIndexes) {
        if (/^\}/.test(line)) {
          inIndexes = false;
          continue;
        }
        // Parse composite PK definition like: (col1, col2) [pk]
        const attrMatch = line.match(/\[(.*?)\]/);
        const hasPk = !!attrMatch && attrMatch[1].split(',').map(s => s.trim().toLowerCase()).includes('pk');
        if (hasPk) {
          const colsMatch = line.match(/\((.*?)\)/);
          if (colsMatch) {
            const pkCols = colsMatch[1].split(',').map(s => s.trim());
            pkCols.forEach(colName => {
              const col = columnMap[colName];
              if (col) {
                if (!col.attributes.includes('pk')) col.attributes.push('pk');
              }
            });
          }
        }
        // ignore other indexes content as columns
        continue;
      }

      // Skip closing braces if any stray
      if (/^\}/.test(line)) continue;

      // Parse column definition: name type [attributes]
      const parts = line.split(/\s+/);
      if (parts.length < 2) continue; // guard
      const name = parts[0];
      const type = parts[1];
      const attributes: string[] = [];

      const attributeRegex = /\[(.*?)\]/;
      const attrMatch = line.match(attributeRegex);
      if (attrMatch) {
        attributes.push(...attrMatch[1].split(',').map(attr => attr.trim()));
      }

      const col: Column = { name, type, attributes };
      columns.push(col);
      columnMap[name] = col;
    }

    tables.push({ name: tableName, columns });
  }

  // Regex to find all Ref definitions
  const refRegex = /Ref:\s*(\w+)\.(\w+)\s*([-><])\s*(\w+)\.(\w+)/g;
  let refMatch;
  while ((refMatch = refRegex.exec(dbml)) !== null) {
    refs.push({
      fromTable: refMatch[1],
      fromColumn: refMatch[2],
      relation: refMatch[3],
      toTable: refMatch[4],
      toColumn: refMatch[5],
    });
  }

  return { tables, refs };
}
