
import React, { useState } from 'react';
import { X, Grid } from 'lucide-react';

interface InsertTableModalProps {
  onInsert: (html: string) => void;
  onClose: () => void;
}

const InsertTableModal: React.FC<InsertTableModalProps> = ({ onInsert, onClose }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [headerRow, setHeaderRow] = useState(true);
  const [borderStyle, setBorderStyle] = useState('solid');
  const [borderColor, setBorderColor] = useState('#e2e8f0');

  const generateTable = () => {
    const border = `1px ${borderStyle} ${borderColor}`;
    let html = `<table style="width:100%;border-collapse:collapse;margin:10px 0;">`;
    if (headerRow) {
      html += '<thead><tr>';
      for (let j = 0; j < cols; j++) {
        html += `<th style="border:${border};padding:10px;background:#f8fafc;font-weight:600;text-align:left;">Cabeçalho ${j+1}</th>`;
      }
      html += '</tr></thead><tbody>';
    }
    for (let i = 0; i < (headerRow ? rows : rows); i++) {
      html += '<tr>';
      for (let j = 0; j < cols; j++) {
        html += `<td style="border:${border};padding:8px;">Célula ${i+1}-${j+1}</td>`;
      }
      html += '</tr>';
    }
    if (headerRow) html += '</tbody>';
    html += '</table><br/>';
    return html;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-600" /> Inserir Tabela
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Linhas</label>
              <input type="number" min="1" max="50" value={rows} onChange={e => setRows(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Colunas</label>
              <input type="number" min="1" max="20" value={cols} onChange={e => setCols(Math.max(1, Math.min(20, Number(e.target.value))))}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none" />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={headerRow} onChange={e => setHeaderRow(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">Linha de cabeçalho</span>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Estilo da borda</label>
              <select value={borderStyle} onChange={e => setBorderStyle(e.target.value)}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none">
                <option value="solid">Sólida</option>
                <option value="dashed">Tracejada</option>
                <option value="dotted">Pontilhada</option>
                <option value="double">Dupla</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Cor da borda</label>
              <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)}
                className="w-full h-9 p-1 border border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer" />
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900">
            <p className="text-xs text-slate-400 mb-2">Prévia ({rows}x{cols}):</p>
            <div className="overflow-x-auto text-xs" dangerouslySetInnerHTML={{ __html: generateTable() }} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
            <button onClick={() => onInsert(generateTable())}
              className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 flex items-center gap-2">
              <Grid className="w-4 h-4" /> Inserir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsertTableModal;
