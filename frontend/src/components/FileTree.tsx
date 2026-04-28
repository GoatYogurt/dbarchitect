import React, { Fragment, useMemo, useState } from 'react';
import { GeneratedFile } from '../types';

export interface File {
  id: string;
  name: string;
  path: string;
  parentId: string;
  depth: number;
  content: string;
}

export interface Directory {
  id: string;
  name: string;
  path: string;
  parentId: string;
  depth: number;
  dirs: Directory[];
  files: File[];
}

interface FileTreeProps {
  rootDir: Directory;
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
}

interface SubTreeProps {
  directory: Directory;
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
}

export function buildDirectoryTree(files: GeneratedFile[]): Directory {
  const root: Directory = {
    id: '0',
    name: 'generated',
    path: '',
    parentId: '',
    depth: 0,
    dirs: [],
    files: [],
  };

  const dirMap = new Map<string, Directory>();
  dirMap.set('', root);

  for (const generated of files) {
    const normalizedPath = generated.fileName.replace(/\\/g, '/').replace(/^\/+/, '');
    if (!normalizedPath) {
      continue;
    }

    const segments = normalizedPath.split('/');
    const fileName = segments[segments.length - 1];
    const parentSegments = segments.slice(0, -1);

    let currentPath = '';
    let parentPath = '';

    for (let i = 0; i < parentSegments.length; i += 1) {
      const segment = parentSegments[i];
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      if (!dirMap.has(currentPath)) {
        const parentDir = dirMap.get(parentPath);
        if (!parentDir) {
          break;
        }

        const nextDir: Directory = {
          id: `dir:${currentPath}`,
          name: segment,
          path: currentPath,
          parentId: parentDir.id,
          depth: i + 1,
          dirs: [],
          files: [],
        };

        parentDir.dirs.push(nextDir);
        dirMap.set(currentPath, nextDir);
      }

      parentPath = currentPath;
    }

    const parentDir = dirMap.get(parentPath);
    if (!parentDir) {
      continue;
    }

    parentDir.files.push({
      id: `file:${normalizedPath}`,
      name: fileName,
      path: normalizedPath,
      parentId: parentDir.id,
      depth: parentDir.depth + 1,
      content: generated.content,
    });
  }

  return root;
}

export const FileTree = (props: FileTreeProps) => {
  return <SubTree directory={props.rootDir} {...props} />;
};

const SubTree = (props: SubTreeProps) => {
  const sortedDirs = useMemo(() => [...props.directory.dirs].sort(sortDir), [props.directory.dirs]);
  const sortedFiles = useMemo(() => [...props.directory.files].sort(sortFile), [props.directory.files]);

  return (
    <div>
      {sortedDirs.map((dir) => (
        <Fragment key={dir.id}>
          <DirDiv directory={dir} selectedFile={props.selectedFile} onSelect={props.onSelect} />
        </Fragment>
      ))}
      {sortedFiles.map((file) => (
        <Fragment key={file.id}>
          <FileDiv file={file} selectedFile={props.selectedFile} onClick={() => props.onSelect(file)} />
        </Fragment>
      ))}
    </div>
  );
};

const FileDiv = ({
  file,
  icon,
  selectedFile,
  onClick,
}: {
  file: File | Directory;
  icon?: 'openDirectory' | 'closedDirectory';
  selectedFile: File | undefined;
  onClick: () => void;
}) => {
  const isSelected = !!selectedFile && selectedFile.id === file.id;
  const isDirectory = isDirectoryNode(file);

  return (
    <button
      type="button"
      className={`w-full flex items-center justify-start h-8 px-2 text-xs font-normal rounded-md transition-colors ${
        isSelected ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-300 hover:bg-slate-700/60'
      }`}
      style={{ paddingLeft: `${Math.max(file.depth * 14, 8)}px` }}
      onClick={onClick}
    >
      {icon === 'openDirectory' && (
        <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
      {icon === 'closedDirectory' && (
        <svg className="w-3 h-3 mr-1 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )}
      {!icon && <span className="w-4 mr-1" />}
      <FileIcon isDirectory={isDirectory} extension={getExtension(file.name)} />
      <span className="ml-2 truncate text-left">{file.name}</span>
    </button>
  );
};

const DirDiv = ({
  directory,
  selectedFile,
  onSelect,
}: {
  directory: Directory;
  selectedFile: File | undefined;
  onSelect: (file: File) => void;
}) => {
  const [open, setOpen] = useState(() => !!selectedFile && isChildSelected(directory, selectedFile));

  return (
    <>
      <FileDiv
        file={directory}
        icon={open ? 'openDirectory' : 'closedDirectory'}
        selectedFile={selectedFile}
        onClick={() => setOpen((prev: boolean) => !prev)}
      />
      {open ? <SubTree directory={directory} selectedFile={selectedFile} onSelect={onSelect} /> : null}
    </>
  );
};

const isChildSelected = (directory: Directory, selectedFile: File): boolean => {
  if (selectedFile.parentId === directory.id) {
    return true;
  }

  return directory.dirs.some((dir) => isChildSelected(dir, selectedFile));
};

const sortDir = (a: Directory, b: Directory) => a.name.localeCompare(b.name);
const sortFile = (a: File, b: File) => a.name.localeCompare(b.name);

const isDirectoryNode = (node: File | Directory): node is Directory =>
  (node as Directory).dirs !== undefined;

const getExtension = (name: string) => {
  const idx = name.lastIndexOf('.');
  if (idx === -1 || idx === name.length - 1) {
    return '';
  }
  return name.slice(idx + 1).toLowerCase();
};

const FileIcon = ({ isDirectory, extension }: { isDirectory: boolean; extension: string }) => {
  if (isDirectory) {
    return (
      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
      </svg>
    );
  }

  const colorClass =
    extension === 'java'
      ? 'text-emerald-300'
      : extension === 'xml'
        ? 'text-orange-300'
        : extension === 'yml' || extension === 'yaml'
          ? 'text-violet-300'
          : extension === 'md'
            ? 'text-cyan-300'
            : 'text-slate-300';

  return (
    <svg className={`w-4 h-4 ${colorClass}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7.5L12.5 3H5zm7 1.5L15.5 8H12V4.5z" />
    </svg>
  );
};
