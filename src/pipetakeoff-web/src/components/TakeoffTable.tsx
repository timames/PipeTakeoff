import { useState, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { MaterialItem, MaterialCategory, ConfidenceLevel } from '../types';

interface TakeoffTableProps {
  materials: MaterialItem[];
  onUpdate: (id: string, updates: Partial<MaterialItem>) => void;
  onDelete: (id: string) => void;
  onAdd: (item: Omit<MaterialItem, 'id'>) => void;
}

const categories: MaterialCategory[] = ['Pipe', 'Fitting', 'Valve', 'Equipment', 'Specialty'];
const confidenceLevels: ConfidenceLevel[] = ['High', 'Medium', 'Low'];
const units = ['LF', 'EA', 'SF', 'CY', 'GAL', 'SET'];

const columnHelper = createColumnHelper<MaterialItem>();

export function TakeoffTable({ materials, onUpdate, onDelete, onAdd }: TakeoffTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<MaterialItem>>({});
  const [showAddRow, setShowAddRow] = useState(false);
  const [newItem, setNewItem] = useState<Partial<MaterialItem>>({
    category: 'Pipe',
    description: '',
    size: '',
    material: '',
    quantity: 1,
    unit: 'EA',
    confidence: 'High',
    notes: '',
    isManualEntry: true,
  });

  const startEditing = useCallback((item: MaterialItem) => {
    setEditingId(item.id);
    setEditValues({ ...item });
  }, []);

  const cancelEditing = useCallback(() => {
    setEditingId(null);
    setEditValues({});
  }, []);

  const saveEditing = useCallback(() => {
    if (editingId && editValues) {
      onUpdate(editingId, editValues);
      setEditingId(null);
      setEditValues({});
    }
  }, [editingId, editValues, onUpdate]);

  const columns = useMemo(() => [
    columnHelper.accessor('category', {
      header: 'Category',
      size: 100,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <select
              value={(editValues.category ?? getValue()) as string}
              onChange={e => setEditValues(v => ({ ...v, category: e.target.value as MaterialCategory }))}
              className="w-full p-1 border rounded text-sm"
            >
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          );
        }
        return <span className="text-sm">{getValue() as string}</span>;
      },
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      size: 250,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <input
              type="text"
              value={(editValues.description ?? getValue()) as string}
              onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))}
              className="w-full p-1 border rounded text-sm"
            />
          );
        }
        return <span className="text-sm">{getValue() as string}</span>;
      },
    }),
    columnHelper.accessor('size', {
      header: 'Size',
      size: 80,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <input
              type="text"
              value={(editValues.size ?? getValue()) as string}
              onChange={e => setEditValues(v => ({ ...v, size: e.target.value }))}
              className="w-full p-1 border rounded text-sm"
            />
          );
        }
        return <span className="text-sm">{getValue() as string}</span>;
      },
    }),
    columnHelper.accessor('material', {
      header: 'Material',
      size: 100,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <input
              type="text"
              value={(editValues.material ?? getValue()) as string}
              onChange={e => setEditValues(v => ({ ...v, material: e.target.value }))}
              className="w-full p-1 border rounded text-sm"
            />
          );
        }
        return <span className="text-sm">{getValue() as string}</span>;
      },
    }),
    columnHelper.accessor('quantity', {
      header: 'Qty',
      size: 80,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <input
              type="number"
              min="0"
              step="0.01"
              value={editValues.quantity ?? getValue()}
              onChange={e => setEditValues(v => ({ ...v, quantity: parseFloat(e.target.value) || 0 }))}
              className="w-full p-1 border rounded text-sm"
            />
          );
        }
        return <span className="text-sm font-medium">{getValue() as number}</span>;
      },
    }),
    columnHelper.accessor('unit', {
      header: 'Unit',
      size: 60,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <select
              value={(editValues.unit ?? getValue()) as string}
              onChange={e => setEditValues(v => ({ ...v, unit: e.target.value }))}
              className="w-full p-1 border rounded text-sm"
            >
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          );
        }
        return <span className="text-sm">{getValue() as string}</span>;
      },
    }),
    columnHelper.accessor('confidence', {
      header: 'Confidence',
      size: 100,
      cell: ({ row, getValue }) => {
        if (editingId === row.original.id) {
          return (
            <select
              value={(editValues.confidence ?? getValue()) as string}
              onChange={e => setEditValues(v => ({ ...v, confidence: e.target.value as ConfidenceLevel }))}
              className="w-full p-1 border rounded text-sm"
            >
              {confidenceLevels.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          );
        }
        const value = getValue() as string;
        const colors: Record<string, string> = {
          High: 'bg-green-100 text-green-800',
          Medium: 'bg-yellow-100 text-yellow-800',
          Low: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[value] || 'bg-gray-100'}`}>
            {value}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ row }) => {
        if (editingId === row.original.id) {
          return (
            <div className="flex gap-1">
              <button
                onClick={saveEditing}
                className="p-1 text-green-600 hover:bg-green-100 rounded"
                title="Save"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={cancelEditing}
                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        }
        return (
          <div className="flex gap-1">
            <button
              onClick={() => startEditing(row.original)}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded"
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDelete(row.original.id)}
              className="p-1 text-red-600 hover:bg-red-100 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      },
    }),
  ], [editingId, editValues, onDelete, saveEditing, cancelEditing, startEditing]);

  const table = useReactTable({
    data: materials,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Category subtotals
  const subtotals = useMemo(() => {
    return categories.reduce((acc, cat) => {
      const items = materials.filter(m => m.category === cat);
      acc[cat] = {
        count: items.length,
        total: items.reduce((sum, m) => sum + m.quantity, 0)
      };
      return acc;
    }, {} as Record<string, { count: number; total: number }>);
  }, [materials]);

  const handleAddItem = () => {
    if (newItem.description) {
      onAdd({
        category: newItem.category || 'Pipe',
        description: newItem.description || '',
        size: newItem.size || '',
        material: newItem.material || '',
        quantity: newItem.quantity || 1,
        unit: newItem.unit || 'EA',
        confidence: newItem.confidence || 'High',
        notes: newItem.notes || null,
        isManualEntry: true,
      });
      setNewItem({
        category: 'Pipe',
        description: '',
        size: '',
        material: '',
        quantity: 1,
        unit: 'EA',
        confidence: 'High',
        notes: '',
        isManualEntry: true,
      });
      setShowAddRow(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 border-b">
        <div className="flex flex-wrap gap-4">
          {categories.map(cat => (
            subtotals[cat]?.count > 0 && (
              <div key={cat} className="text-sm">
                <span className="font-medium text-gray-700">{cat}:</span>{' '}
                <span className="text-gray-600">{subtotals[cat].count} items ({subtotals[cat].total.toFixed(1)})</span>
              </div>
            )
          ))}
        </div>
        <button
          onClick={() => setShowAddRow(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Add new item row */}
      {showAddRow && (
        <div className="p-4 bg-blue-50 border-b">
          <div className="flex flex-wrap gap-2 items-end">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Category</label>
              <select
                value={newItem.category}
                onChange={e => setNewItem(v => ({ ...v, category: e.target.value as MaterialCategory }))}
                className="p-1.5 border rounded text-sm"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-600 mb-1">Description *</label>
              <input
                type="text"
                value={newItem.description}
                onChange={e => setNewItem(v => ({ ...v, description: e.target.value }))}
                placeholder="e.g., 4&quot; PVC SCH40 Pipe"
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-600 mb-1">Size</label>
              <input
                type="text"
                value={newItem.size}
                onChange={e => setNewItem(v => ({ ...v, size: e.target.value }))}
                placeholder='4"'
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-600 mb-1">Material</label>
              <input
                type="text"
                value={newItem.material}
                onChange={e => setNewItem(v => ({ ...v, material: e.target.value }))}
                placeholder="PVC"
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-600 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newItem.quantity}
                onChange={e => setNewItem(v => ({ ...v, quantity: parseFloat(e.target.value) || 0 }))}
                className="w-full p-1.5 border rounded text-sm"
              />
            </div>
            <div className="w-16">
              <label className="block text-xs text-gray-600 mb-1">Unit</label>
              <select
                value={newItem.unit}
                onChange={e => setNewItem(v => ({ ...v, unit: e.target.value }))}
                className="w-full p-1.5 border rounded text-sm"
              >
                {units.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddItem}
                disabled={!newItem.description}
                className="p-1.5 text-green-600 hover:bg-green-100 rounded disabled:opacity-50"
                title="Add"
              >
                <Check className="h-5 w-5" />
              </button>
              <button
                onClick={() => setShowAddRow(false)}
                className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                title="Cancel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500">
                  No materials yet. Upload and analyze a drawing, or add items manually.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className={`hover:bg-gray-50 ${row.original.isManualEntry ? 'bg-blue-50/50' : ''}`}
                >
                  {row.getVisibleCells().map(cell => (
                    <td key={cell.id} className="px-3 py-2">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      {materials.length > 0 && (
        <div className="p-3 bg-gray-50 border-t text-right">
          <span className="text-sm font-medium text-gray-700">
            Total Items: {materials.length} |
            Total Quantity: {materials.reduce((sum, m) => sum + m.quantity, 0).toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
