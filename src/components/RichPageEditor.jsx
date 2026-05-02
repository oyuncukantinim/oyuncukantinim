import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ImagePlus,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Quote,
  Redo2,
  Rows3,
  Table as TableIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Video,
} from 'lucide-react';

function extractManagedImages(html = '') {
  const matches = String(html).match(/https?:\/\/[^"']+\/uploads\/pages\/pg_[A-Za-z0-9_.-]+\.webp|\/uploads\/pages\/pg_[A-Za-z0-9_.-]+\.webp/gi);
  return [...new Set(matches || [])];
}

function youtubeEmbedUrl(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  const match = text.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);
  return match ? `https://www.youtube.com/embed/${match[1]}` : '';
}

function ToolbarButton({ active = false, disabled = false, title, onClick, children }) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition ${
        active
          ? 'border-violet-400 bg-violet-600 text-white shadow-[0_0_18px_rgba(139,92,246,0.28)]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700'
      } disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-violet-500/60 dark:hover:bg-violet-500/10`}
    >
      {children}
    </button>
  );
}

export default function RichPageEditor({ value, onChange, onUploadImage, onDeleteManagedImage, pageId = 0 }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const managedImagesRef = useRef(extractManagedImages(value));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          loading: 'lazy',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: false,
        modestBranding: true,
        HTMLAttributes: {
          class: 'ok-youtube-embed',
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'page-editor-content page-content min-h-[460px] focus:outline-none',
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      onChange(html);
      const previous = managedImagesRef.current;
      const next = extractManagedImages(html);
      const removed = previous.filter((url) => !next.includes(url));
      managedImagesRef.current = next;
      removed.forEach((url) => onDeleteManagedImage?.(url, pageId));
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
      managedImagesRef.current = extractManagedImages(value);
    }
  }, [editor, value]);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Bağlantı adresi', previousUrl);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim(), target: '_blank' }).run();
  };

  const addImageUrl = () => {
    const url = window.prompt('Görsel bağlantısı');
    if (!url?.trim()) return;
    const alt = window.prompt('Görsel alt metni', '') || '';
    editor.chain().focus().setImage({ src: url.trim(), alt }).run();
  };

  const addYoutube = () => {
    const url = window.prompt('YouTube bağlantısı');
    const embedUrl = youtubeEmbedUrl(url);
    if (!embedUrl) {
      window.alert('Geçerli bir YouTube bağlantısı girin.');
      return;
    }
    editor.chain().focus().setYoutubeVideo({ src: embedUrl, width: 960, height: 540 }).run();
  };

  const uploadImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !onUploadImage) return;
    setUploading(true);
    try {
      const url = await onUploadImage(file);
      const alt = window.prompt('Görsel alt metni', file.name.replace(/\.[^.]+$/, '')) || '';
      editor.chain().focus().setImage({ src: url, alt }).run();
    } catch (error) {
      window.alert(error.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/80">
        <ToolbarButton title="Geri al" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={16} /></ToolbarButton>
        <ToolbarButton title="İleri al" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={16} /></ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Paragraf" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow size={16} /></ToolbarButton>
        <ToolbarButton title="Başlık H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
        <ToolbarButton title="Başlık H3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Kalın" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
        <ToolbarButton title="İtalik" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolbarButton>
        <ToolbarButton title="Altı çizili" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon size={16} /></ToolbarButton>
        <ToolbarButton title="Bağlantı" active={editor.isActive('link')} onClick={setLink}><LinkIcon size={16} /></ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Madde listesi" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
        <ToolbarButton title="Numaralı liste" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></ToolbarButton>
        <ToolbarButton title="Alıntı" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolbarButton>
        <ToolbarButton title="Ayraç" onClick={() => editor.chain().focus().setHorizontalRule().run()}><Minus size={16} /></ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Sola hizala" onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft size={16} /></ToolbarButton>
        <ToolbarButton title="Ortala" onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter size={16} /></ToolbarButton>
        <ToolbarButton title="Sağa hizala" onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight size={16} /></ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Tablo ekle" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><TableIcon size={16} /></ToolbarButton>
        <ToolbarButton title="Satır ekle" onClick={() => editor.chain().focus().addRowAfter().run()} disabled={!editor.can().addRowAfter()}><Rows3 size={16} /></ToolbarButton>
        <ToolbarButton title="Tablo sil" onClick={() => editor.chain().focus().deleteTable().run()} disabled={!editor.can().deleteTable()}><Trash2 size={16} /></ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Dosyadan görsel ekle" onClick={() => fileInputRef.current?.click()} disabled={uploading}><ImagePlus size={16} /></ToolbarButton>
        <ToolbarButton title="Link ile görsel ekle" onClick={addImageUrl}>URL</ToolbarButton>
        <ToolbarButton title="YouTube video ekle" onClick={addYoutube}><Video size={16} /></ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadImage} className="hidden" />
        {uploading ? <span className="ml-1 text-xs font-bold text-violet-600 dark:text-violet-300">Görsel yükleniyor...</span> : null}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
