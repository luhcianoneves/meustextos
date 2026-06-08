
import React, { useState } from 'react';
import { Markdown, Code } from 'lucide-react';

interface MarkdownEditorProps {
  html: string;
  onChange: (html: string) => void;
}

const simpleMarkdownToHtml = (md: string): string => {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
  return '<p>' + html + '</p>';
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ html, onChange }) => {
  const [mode, setMode] = useState<'visual' | 'markdown'>('visual');
  const [mdText, setMdText] = useState('');

  const toggleMode = () => {
    if (mode === 'visual') {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const text = temp.innerText;
      setMdText(text);
      setMode('markdown');
    } else {
      const newHtml = simpleMarkdownToHtml(mdText);
      onChange(newHtml);
      setMode('visual');
    }
  };

  if (mode === 'markdown') {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-400">Markdown</span>
          <button onClick={toggleMode}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 font-medium">
            <Code className="w-3 h-3" /> Visual
          </button>
        </div>
        <textarea
          value={mdText}
          onChange={e => setMdText(e.target.value)}
          className="w-full min-h-[300px] p-4 font-mono text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Escreva em Markdown..."
        />
      </div>
    );
  }

  return (
    <div className="flex justify-end mb-1">
      <button onClick={toggleMode}
        className="flex items-center gap-1 px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 font-medium">
        <Code className="w-3 h-3" /> Markdown
      </button>
    </div>
  );
};

export default MarkdownEditor;
