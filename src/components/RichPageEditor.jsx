import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle, FontSize } from '@tiptap/extension-text-style';
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
  Upload,
  Video,
  X,
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

const FONT_SIZE_OPTIONS = ['12', '14', '16', '18', '22'];

export default function RichPageEditor({ value, onChange, onUploadImage, onDeleteManagedImage, pageId = 0 }) {
  const [uploading, setUploading] = useState(false);
  const [activeFontSize, setActiveFontSize] = useState('16');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageMode, setImageMode] = useState('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoError, setVideoError] = useState('');
  const fileInputRef = useRef(null);
  const managedImagesRef = useRef(extractManagedImages(value));

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      TextStyle,
      FontSize,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
      Image.configure({ allowBase64: false, HTMLAttributes: { loading: 'lazy' } }),
      Youtube.configure({
        controls: true,
        nocookie: false,
        modestBranding: true,
        HTMLAttributes: { class: 'ok-youtube-embed' },
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
      setActiveFontSize(String(currentEditor.getAttributes('textStyle').fontSize || '').replace('px', '') || '16');
      const previous = managedImagesRef.current;
      const next = extractManagedImages(html);
      const removed = previous.filter((url) => !next.includes(url));
      managedImagesRef.current = next;
      removed.forEach((url) => onDeleteManagedImage?.(url, pageId));
    },
    onSelectionUpdate: ({ editor: currentEditor }) => {
      setActiveFontSize(String(currentEditor.getAttributes('textStyle').fontSize || '').replace('px', '') || '16');
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

  const applyFontSize = (size) => {
    const nextSize = FONT_SIZE_OPTIONS.includes(size) ? size : '16';
    editor.chain().focus().setFontSize(`${nextSize}px`).run();
    setActiveFontSize(nextSize);
  };

  const resetImageForm = () => {
    setImageMode('upload');
    setImageUrl('');
    setImageAlt('');
    setSelectedImageFile(null);
  };

  const openImageModal = () => {
    resetImageForm();
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    resetImageForm();
  };

  const addImageFromModal = async () => {
    if (imageMode === 'url') {
      if (!imageUrl.trim()) return;
      editor.chain().focus().setImage({ src: imageUrl.trim(), alt: imageAlt.trim() }).run();
      closeImageModal();
      return;
    }

    if (!selectedImageFile || !onUploadImage) return;
    setUploading(true);
    try {
      const url = await onUploadImage(selectedImageFile);
      editor.chain().focus().setImage({ src: url, alt: imageAlt.trim() || selectedImageFile.name.replace(/\.[^.]+$/, '') }).run();
      closeImageModal();
    } catch (error) {
      window.alert(error.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
    }
  };

  const openVideoModal = () => {
    setVideoUrl('');
    setVideoError('');
    setVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setVideoModalOpen(false);
    setVideoUrl('');
    setVideoError('');
  };

  const addYoutubeFromModal = () => {
    const embedUrl = youtubeEmbedUrl(videoUrl);
    if (!embedUrl) {
      setVideoError('Geçerli bir YouTube bağlantısı girin.');
      return;
    }
    editor.chain().focus().setYoutubeVideo({ src: embedUrl, width: 960, height: 540 }).run();
    closeVideoModal();
  };

  const imageSubmitDisabled = uploading || (imageMode === 'upload' ? !selectedImageFile : !imageUrl.trim());
  const previewVideoUrl = youtubeEmbedUrl(videoUrl);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-900/80">
        <ToolbarButton title="Geri al" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo2 size={16} /></ToolbarButton>
        <ToolbarButton title="İleri al" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo2 size={16} /></ToolbarButton>
        <span className="mx-1 h-8 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton title="Paragraf" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()}><Pilcrow size={16} /></ToolbarButton>
        <select
          value={activeFontSize}
          onChange={(event) => applyFontSize(event.target.value)}
          title="Metin boyutu"
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm font-black text-slate-700 outline-none transition hover:border-violet-200 focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {FONT_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
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
        <ToolbarButton title="Görsel ekle" onClick={openImageModal} disabled={uploading}><ImagePlus size={16} /></ToolbarButton>
        <ToolbarButton title="YouTube video ekle" onClick={openVideoModal}><Video size={16} /></ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            setSelectedImageFile(file);
            if (file && !imageAlt) setImageAlt(file.name.replace(/\.[^.]+$/, ''));
            event.target.value = '';
          }}
          className="hidden"
        />
        {uploading ? <span className="ml-1 text-xs font-bold text-violet-600 dark:text-violet-300">Görsel yükleniyor...</span> : null}
      </div>
      <EditorContent editor={editor} />

      {imageModalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">Görsel Ekle</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Dosya yükle veya görsel bağlantısı kullan.</p>
              </div>
              <button type="button" onClick={closeImageModal} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900">
                {[
                  ['upload', 'Dosya Seç'],
                  ['url', 'URL ile Ekle'],
                ].map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setImageMode(mode)}
                    className={`rounded-xl px-3 py-2 text-sm font-black transition ${
                      imageMode === mode
                        ? 'bg-white text-violet-700 shadow-sm dark:bg-slate-800 dark:text-violet-300'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {imageMode === 'upload' ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-violet-300 bg-violet-50/70 px-5 py-8 text-center transition hover:border-violet-500 hover:bg-violet-50 dark:border-violet-500/40 dark:bg-violet-500/10"
                >
                  <Upload size={24} className="mb-2 text-violet-600 dark:text-violet-300" />
                  <span className="text-sm font-black text-slate-800 dark:text-white">{selectedImageFile ? selectedImageFile.name : 'Görsel dosyası seç'}</span>
                  <span className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">Yüklenen görsel WebP %80 kaliteyle kaydedilir.</span>
                </button>
              ) : (
                <div>
                  <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Görsel URL</label>
                  <input
                    value={imageUrl}
                    onChange={(event) => setImageUrl(event.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">Alt Metin</label>
                <input
                  value={imageAlt}
                  onChange={(event) => setImageAlt(event.target.value)}
                  placeholder="Görsel açıklaması"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-violet-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
              <button type="button" onClick={closeImageModal} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={addImageFromModal}
                disabled={imageSubmitDisabled}
                className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Yükleniyor...' : 'Görseli Ekle'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {videoModalOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-950 dark:text-white">YouTube Video Ekle</h3>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">YouTube bağlantısı otomatik video bloğuna dönüşür.</p>
              </div>
              <button type="button" onClick={closeVideoModal} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-900 dark:hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-xs font-bold text-cyan-800 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200">
                Desteklenen formatlar: youtube.com/watch, youtu.be, shorts veya embed bağlantısı.
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">YouTube URL</label>
                <input
                  value={videoUrl}
                  onChange={(event) => {
                    setVideoUrl(event.target.value);
                    setVideoError('');
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-cyan-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
                {videoError ? <div className="mt-2 text-xs font-bold text-red-500">{videoError}</div> : null}
              </div>
              {previewVideoUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 dark:border-slate-700">
                  <iframe
                    src={previewVideoUrl}
                    title="Video önizleme"
                    className="aspect-video w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                </div>
              ) : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-900/70">
              <button type="button" onClick={closeVideoModal} className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={addYoutubeFromModal}
                disabled={!videoUrl.trim()}
                className="rounded-2xl bg-gradient-to-r from-cyan-600 to-violet-600 px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Videoyu Ekle
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
