
import React from 'react';
import { X, FileText, Crosshair, BookOpen, Heart, Users, MessageCircle, AlertTriangle, Star } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  getHtml: (title: string) => string;
}

const TEMPLATES: Template[] = [
  {
    id: 'sermao',
    name: 'Esboço de Sermão',
    description: 'Texto, introdução, pontos, conclusão',
    icon: <Crosshair className="w-5 h-5 text-red-500" />,
    getHtml: (t) => `<h1>${t || 'Título do Sermão'}</h1>
<h2>Texto Base</h2>
<p>Insira a referência bíblica aqui...</p>
<h2>Introdução</h2>
<p>Contexto histórico e cultural da passagem...</p>
<h2>I. Primeiro Ponto</h2>
<p>Desenvolva o primeiro ponto...</p>
<h2>II. Segundo Ponto</h2>
<p>Desenvolva o segundo ponto...</p>
<h2>III. Terceiro Ponto</h2>
<p>Desenvolva o terceiro ponto...</p>
<h2>Conclusão</h2>
<p>Aplicação prática para os dias atuais...</p>
<h2>Perguntas para Reflexão</h2>
<ul><li>Pergunta 1</li><li>Pergunta 2</li><li>Pergunta 3</li></ul>`
  },
  {
    id: 'estudo',
    name: 'Estudo Bíblico',
    description: 'Passagem, contexto, análise, aplicação',
    icon: <BookOpen className="w-5 h-5 text-blue-500" />,
    getHtml: (t) => `<h1>${t || 'Estudo Bíblico'}</h1>
<h2>Passagem</h2>
<p>Insira a passagem bíblica...</p>
<h2>Contexto</h2>
<p>Quem escreveu? Para quem? Quando?</p>
<h2>Observação</h2>
<p>O que o texto diz?</p>
<h2>Interpretação</h2>
<p>O que o texto significa?</p>
<h2>Aplicação</h2>
<p>Como isso se aplica à minha vida?</p>`
  },
  {
    id: 'devocional',
    name: 'Devocional Diário',
    description: 'Versículo, reflexão, oração',
    icon: <Heart className="w-5 h-5 text-pink-500" />,
    getHtml: (t) => `<h1>${t || 'Devocional'}</h1>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:15px 0;font-style:italic;">
  <p>"Insira o versículo chave aqui"</p>
  <small style="color:#92400e;">— Referência</small>
</div>
<h2>Reflexão</h2>
<p>Escreva sua reflexão pessoal...</p>
<h2>Oração</h2>
<p>Senhor,...</p>`
  },
  {
    id: 'estudo-tematico',
    name: 'Estudo Temático',
    description: 'Tema, textos, comparação, conclusão',
    icon: <MessageCircle className="w-5 h-5 text-green-500" />,
    getHtml: (t) => `<h1>${t || 'Estudo Temático'}</h1>
<h2>Tema</h2>
<p>Defina o tema a ser estudado...</p>
<h2>Textos de Apoio</h2>
<ul><li>Texto 1 (referência)</li><li>Texto 2 (referência)</li><li>Texto 3 (referência)</li></ul>
<h2>O que a Bíblia diz?</h2>
<p>Análise dos textos...</p>
<h2>Comparação entre Versões</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
  <div style="background:#f8fafc;padding:10px;border-radius:8px;"><strong>Versão A</strong><p>Texto...</p></div>
  <div style="background:#f8fafc;padding:10px;border-radius:8px;"><strong>Versão B</strong><p>Texto...</p></div>
</div>
<h2>Conclusão</h2>
<p>Aplicação prática...</p>`
  },
  {
    id: 'palestra',
    name: 'Palestra / Ensino',
    description: 'Tópicos, ilustrações, aplicação',
    icon: <Users className="w-5 h-5 text-purple-500" />,
    getHtml: (t) => `<h1>${t || 'Palestra'}</h1>
<h2>Introdução</h2>
<p>Abertura e conexão com o público...</p>
<h2>Ponto 1</h2>
<p>Conceito principal...</p>
<div style="background:#dbeafe;border:1px solid #3b82f6;padding:15px;margin:15px 0;border-radius:8px;">
  <strong>💡 Ilustração:</strong><p>História ou exemplo...</p>
</div>
<h2>Ponto 2</h2>
<p>Conceito principal...</p>
<h2>Ponto 3</h2>
<p>Conceito principal...</p>
<h2>Aplicação Prática</h2>
<p>O que o público pode fazer...</p>
<h2>Oração Final</h2>
<p>...</p>`
  },
  {
    id: 'testemunho',
    name: 'Testemunho',
    description: 'Antes, encontro, depois',
    icon: <Star className="w-5 h-5 text-amber-500" />,
    getHtml: (t) => `<h1>${t || 'Meu Testemunho'}</h1>
<h2>Antes</h2>
<p>Como era minha vida antes...</p>
<h2>O Encontro</h2>
<p>Como Deus agiu na minha vida...</p>
<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:15px;margin:15px 0;">
  <strong>"Versículo que marcou"</strong>
</div>
<h2>Depois</h2>
<p>Como minha vida mudou...</p>
<h2>Mensagem Final</h2>
<p>O que Deus quer dizer através do meu testemunho...</p>`
  },
  {
    id: 'topico',
    name: 'Estudo de Personagem',
    description: 'Quem era, contexto, lições',
    icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    getHtml: (t) => `<h1>${t || 'Estudo de Personagem'}</h1>
<h2>Quem Era</h2>
<p>Nome, significado, família...</p>
<h2>Contexto Histórico</h2>
<p>Quando e onde viveu...</p>
<h2>História Principal</h2>
<p>Narrativa dos eventos...</p>
<h2>Pontos Fortes</h2>
<ul><li>Característica 1</li><li>Característica 2</li></ul>
<h2>Pontos Fracos</h2>
<ul><li>Característica 1</li><li>Característica 2</li></ul>
<h2>Lições para Nós</h2>
<p>O que aprender com este personagem...</p>`
  }
];

interface TemplatesModalProps {
  onSelect: (html: string) => void;
  onClose: () => void;
  currentTitle: string;
}

const TemplatesModal: React.FC<TemplatesModalProps> = ({ onSelect, onClose, currentTitle }) => {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-[#DEE3EA] dark:border-slate-700">
          <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#3B6FE0]" /> Modelos de Texto
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Escolha um modelo para começar a escrever mais rapidamente.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <button key={t.id} onClick={() => { onSelect(t.getHtml(currentTitle)); }}
                className="p-4 bg-[#F8FAFD] dark:bg-slate-700/50 rounded-md border border-[#DEE3EA] dark:border-slate-600 hover:border-[#3B6FE0] dark:hover:border-indigo-500 hover:shadow-sm transition-all text-left">
                <div className="flex items-center gap-3 mb-2">
                  {t.icon}
                  <span className="font-display font-semibold text-slate-900 dark:text-white text-sm">{t.name}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesModal;
