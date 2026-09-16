import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Undo2,
  Redo2,
  Printer,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Baseline,
  Highlighter,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  ListChecks,
  Outdent,
  Indent,
  RemoveFormatting,
  Table as TableIcon,
  Video,
  Paperclip,
  Minus,
  Sparkles,
  Calendar,
  Smile,
  Search,
  Check,
  ChevronDown,
  X,
  Upload,
  Eye,
  FileText,
  Lock,
  Share2,
  Maximize2,
  Minimize2,
  Type,
  CloudCheck,
  FolderOpen,
  Copy,
  Trash2,
  AlertCircle,
  Download,
  Plus
} from 'lucide-react';

export interface CustomFont {
  name: string;
  url?: string;
  source: 'google' | 'custom';
}

const DEFAULT_FONTS: CustomFont[] = [
  { name: 'Pretendard', source: 'google' },
  { name: 'Noto Sans KR', source: 'google' },
  { name: 'Noto Serif KR', source: 'google' },
  { name: 'Nanum Gothic', source: 'google' },
  { name: 'Nanum Myeongjo', source: 'google' },
  { name: 'Black Han Sans', source: 'google' },
  { name: 'Do Hyeon', source: 'google' },
  { name: 'Jua', source: 'google' },
  { name: 'Gaegu', source: 'google' },
  { name: 'Gowun Batang', source: 'google' },
  { name: 'Gowun Dodum', source: 'google' },
  { name: 'Dongle', source: 'google' },
  { name: 'Sunflower', source: 'google' },
  { name: 'Arial', source: 'google' },
  { name: 'Roboto', source: 'google' },
  { name: 'Montserrat', source: 'google' },
  { name: 'Playfair Display', source: 'google' },
  { name: 'Times New Roman', source: 'google' },
  { name: 'Georgia', source: 'google' },
  { name: 'Courier New', source: 'google' }
];

const TEXT_STYLES = [
  { label: '일반 텍스트', tag: 'p', className: 'text-base font-normal leading-relaxed' },
  { label: '제목 1 (H1)', tag: 'h1', className: 'text-2xl font-black text-slate-900 dark:text-white mt-4 mb-2' },
  { label: '제목 2 (H2)', tag: 'h2', className: 'text-xl font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1.5' },
  { label: '제목 3 (H3)', tag: 'h3', className: 'text-lg font-bold text-slate-800 dark:text-slate-200 mt-2 mb-1' },
  { label: '제목 4 (H4)', tag: 'h4', className: 'text-base font-semibold text-slate-700 dark:text-slate-300' },
  { label: '부제목', tag: 'h5', className: 'text-sm font-medium text-slate-500 dark:text-slate-400 italic' },
  { label: '인용구 (Blockquote)', tag: 'blockquote', className: 'border-l-4 border-slate-300 pl-4 py-1 italic text-slate-600 dark:text-slate-300' }
];

const COLOR_PALETTE = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c1c', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79'
];

interface GoogleDocsEditorProps {
  initialTitle?: string;
  initialContentHtml?: string;
  onSave?: (data: { title: string; contentHtml: string; plainText: string }) => void;
  onClose?: () => void;
  readOnly?: boolean;
  documentCategory?: string;
}

export const GoogleDocsEditor: React.FC<GoogleDocsEditorProps> = ({
  initialTitle = '제목 없는 문서',
  initialContentHtml = '',
  onSave,
  onClose,
  readOnly = false,
  documentCategory = '지식백과'
}) => {
  const [docTitle, setDocTitle] = useState(initialTitle);
  const [isSaved, setIsSaved] = useState(true);
  const [fonts, setFonts] = useState<CustomFont[]>(DEFAULT_FONTS);
  const [currentFont, setCurrentFont] = useState('Noto Sans KR');
  const [fontSize, setFontSize] = useState<number>(11);
  const [currentStyle, setCurrentStyle] = useState('일반 텍스트');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showRuler, setShowRuler] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wordCount, setWordCount] = useState({ chars: 0, words: 0 });

  // Modals & Popovers
  const [fontUploadModalOpen, setFontUploadModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [textColorPickerOpen, setTextColorPickerOpen] = useState(false);
  const [highlightColorPickerOpen, setHighlightColorPickerOpen] = useState(false);
  const [lineSpacingOpen, setLineSpacingOpen] = useState(false);
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [outlineHeadings, setOutlineHeadings] = useState<{ id: string; text: string; level: number }[]>([]);

  // Format Painter state
  const [formatPainterActive, setFormatPainterActive] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<{
    fontFamily: string;
    fontSize: string;
    color: string;
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
  } | null>(null);

  // Search in doc
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const editorRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fontFileInputRef = useRef<HTMLInputElement>(null);

  // Restore custom fonts from localStorage if available
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('sangsan_custom_fonts');
      if (savedCustom) {
        const parsed: { name: string; base64: string }[] = JSON.parse(savedCustom);
        parsed.forEach(async (f) => {
          try {
            const fontFace = new FontFace(f.name, `url(${f.base64})`);
            await fontFace.load();
            document.fonts.add(fontFace);
            setFonts(prev => prev.some(item => item.name === f.name) ? prev : [...prev, { name: f.name, source: 'custom' }]);
          } catch (e) {
            console.error('Failed to load saved font:', f.name, e);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && initialContentHtml) {
      editorRef.current.innerHTML = initialContentHtml;
      updateMetricsAndOutline();
    }
  }, [initialContentHtml]);

  // Track selection and save range
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedRangeRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  };

  const executeCommand = (command: string, value: string = '') => {
    if (readOnly) return;
    restoreSelection();
    document.execCommand(command, false, value);
    setIsSaved(false);
    updateMetricsAndOutline();
    editorRef.current?.focus();
  };

  const updateMetricsAndOutline = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    setWordCount({ chars, words });

    // Extract headings for outline
    const headings = Array.from(editorRef.current.querySelectorAll('h1, h2, h3, h4')) as HTMLElement[];
    const outline = headings.map((el, i) => {
      if (!el.id) el.id = `heading-${i}-${Date.now()}`;
      return {
        id: el.id,
        text: el.textContent || `제목 ${i + 1}`,
        level: parseInt(el.tagName.replace('H', ''), 10)
      };
    });
    setOutlineHeadings(outline);
  };

  // Format Painter handlers
  const handleFormatPainterClick = () => {
    if (formatPainterActive) {
      setFormatPainterActive(false);
      setCopiedFormat(null);
      return;
    }
    const sel = window.getSelection();
    if (sel && sel.anchorNode) {
      const parent = sel.anchorNode.parentElement;
      if (parent) {
        const computed = window.getComputedStyle(parent);
        setCopiedFormat({
          fontFamily: computed.fontFamily,
          fontSize: computed.fontSize,
          color: computed.color,
          fontWeight: computed.fontWeight,
          fontStyle: computed.fontStyle,
          textDecoration: computed.textDecoration
        });
        setFormatPainterActive(true);
      }
    }
  };

  const handleEditorMouseUp = () => {
    saveSelection();
    updateMetricsAndOutline();

    // Apply format painter if active
    if (formatPainterActive && copiedFormat) {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        const span = document.createElement('span');
        span.style.fontFamily = copiedFormat.fontFamily;
        span.style.fontSize = copiedFormat.fontSize;
        span.style.color = copiedFormat.color;
        span.style.fontWeight = copiedFormat.fontWeight;
        span.style.fontStyle = copiedFormat.fontStyle;
        span.style.textDecoration = copiedFormat.textDecoration;

        const range = sel.getRangeAt(0);
        try {
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        } catch (e) {
          console.warn('Format painter insert error:', e);
        }
        setFormatPainterActive(false);
        setCopiedFormat(null);
      }
    }
  };

  // Font Upload Handler (TTF, OTF, WOFF, WOFF2)
  const handleFontFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fontName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9가-힣_-]/g, '_');
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const result = reader.result as string;
        const fontFace = new FontFace(fontName, `url(${result})`);
        await fontFace.load();
        document.fonts.add(fontFace);

        const newFont: CustomFont = { name: fontName, url: result, source: 'custom' };
        setFonts(prev => [...prev, newFont]);
        setCurrentFont(fontName);
        executeCommand('fontName', fontName);

        // Save to localStorage
        try {
          const saved = JSON.parse(localStorage.getItem('sangsan_custom_fonts') || '[]');
          saved.push({ name: fontName, base64: result });
          localStorage.setItem('sangsan_custom_fonts', JSON.stringify(saved.slice(-5))); // keep up to 5
        } catch (err) {
          console.warn('Font storage quota limit:', err);
        }

        setFontUploadModalOpen(false);
        alert(`성공! "${fontName}" 폰트가 설치되어 에디터에 적용되었습니다.`);
      } catch (err) {
        alert('폰트 파일을 로드하지 못했습니다. 유효한 TTF, OTF, WOFF 파일인지 확인해주세요.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Insert Image via upload or URL
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      insertImageHtml(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const insertImageHtml = (url: string, alt: string = '이미지') => {
    restoreSelection();
    const html = `
      <div class="my-4 inline-block max-w-full group relative" contenteditable="false">
        <img src="${url}" alt="${alt}" class="rounded-xl border border-slate-200 dark:border-slate-700 max-h-[500px] object-contain shadow-xs" />
        <div class="text-[11px] text-slate-400 mt-1 text-center">${alt}</div>
      </div>
      <p><br></p>
    `;
    executeCommand('insertHTML', html);
  };

  // Insert Hyperlink
  const handleInsertLink = () => {
    if (!linkUrl) return;
    restoreSelection();
    const textToDisplay = linkText || linkUrl;
    const html = `<a href="${linkUrl.startsWith('http') ? linkUrl : 'https://' + linkUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-medium hover:text-blue-800 transition">${textToDisplay}</a>&nbsp;`;
    executeCommand('insertHTML', html);
    setLinkModalOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Insert Video Embed
  const handleInsertVideo = () => {
    if (!videoUrl) return;
    restoreSelection();
    let embedSrc = videoUrl;

    // Handle YouTube URLs
    if (videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      embedSrc = `https://www.youtube.com/embed/${videoId}`;
    } else if (videoUrl.includes('youtu.be/')) {
      const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0];
      embedSrc = `https://www.youtube.com/embed/${videoId}`;
    }

    const html = `
      <div class="my-6 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 shadow-md" contenteditable="false">
        <div class="aspect-video w-full">
          <iframe src="${embedSrc}" class="w-full h-full border-0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div class="p-2 bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 text-center">동영상 링크: ${videoUrl}</div>
      </div>
      <p><br></p>
    `;
    executeCommand('insertHTML', html);
    setVideoModalOpen(false);
    setVideoUrl('');
  };

  // Insert Table
  const handleInsertTable = (rows: number, cols: number) => {
    restoreSelection();
    let tableHtml = `
      <div class="my-4 overflow-x-auto" contenteditable="false">
        <table class="w-full border-collapse border border-slate-300 dark:border-slate-700 text-sm rounded-lg">
          <tbody>
    `;
    for (let r = 0; r < rows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < cols; c++) {
        const isHeader = r === 0;
        tableHtml += `
          <${isHeader ? 'th' : 'td'} class="border border-slate-300 dark:border-slate-700 p-2.5 ${isHeader ? 'bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-white text-left' : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200'}" contenteditable="true">
            ${isHeader ? `항목 ${c + 1}` : `내용`}
          </${isHeader ? 'th' : 'td'}>
        `;
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `
          </tbody>
        </table>
      </div>
      <p><br></p>
    `;
    executeCommand('insertHTML', tableHtml);
    setTablePickerOpen(false);
  };

  // Insert Attached File Widget
  const handleInsertFileCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = Math.round(file.size / 1024);
    const sizeStr = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    restoreSelection();
    const html = `
      <div class="my-4 inline-flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 max-w-md shadow-xs" contenteditable="false">
        <div class="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
          FILE
        </div>
        <div class="truncate text-left flex-1 min-w-0">
          <div class="font-bold text-xs text-slate-900 dark:text-white truncate">${file.name}</div>
          <div class="text-[10px] text-slate-500">${sizeStr} · 첨부 문서</div>
        </div>
        <span class="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs">다운로드</span>
      </div>
      <p><br></p>
    `;
    executeCommand('insertHTML', html);
  };

  // Insert Quick Starter Chips
  const insertTemplate = (type: 'meeting' | 'email' | 'injury' | 'notice') => {
    let html = '';
    if (type === 'meeting') {
      html = `
        <h1 class="text-2xl font-black text-slate-900 mb-2">상산고 체육대회 운영 회의록</h1>
        <p class="text-sm text-slate-500 mb-4">일시: <strong>${new Date().toLocaleDateString('ko-KR')}</strong> | 장소: 본관 회의실</p>
        <h2 class="text-xl font-bold text-slate-800 mt-4 mb-2">1. 회의 안건</h2>
        <ul class="list-disc pl-5 space-y-1 text-slate-700">
          <li>각 종목 심판 배정 및 경기 시간표 최종 조율</li>
          <li>보건실 구급약품 배치 및 부상자 긴급 이송 동선 점검</li>
          <li>학생회 방송실 실시간 해설 시스템 사전 테스트</li>
        </ul>
        <h2 class="text-xl font-bold text-slate-800 mt-4 mb-2">2. 결정 사항</h2>
        <table class="w-full border-collapse border border-slate-300 text-sm my-3">
          <thead><tr class="bg-slate-100 font-bold"><th class="border border-slate-300 p-2 text-left">담당 부서</th><th class="border border-slate-300 p-2 text-left">실행 과제</th><th class="border border-slate-300 p-2 text-left">완료 목표</th></tr></thead>
          <tbody>
            <tr><td class="border border-slate-300 p-2 font-semibold">총괄본부</td><td class="border border-slate-300 p-2">대운동장 라인 마킹 및 골대 안전망 점검</td><td class="border border-slate-300 p-2">D-1 16:00</td></tr>
            <tr><td class="border border-slate-300 p-2 font-semibold">보건담당</td><td class="border border-slate-300 p-2">얼음주머니, 압박붕대, 스프레이 추가 구비</td><td class="border border-slate-300 p-2">D-1 14:00</td></tr>
          </tbody>
        </table>
        <p><br></p>
      `;
    } else if (type === 'injury') {
      html = `
        <h1 class="text-2xl font-black text-slate-900 mb-2">스포츠 부상 대처 표준 가이드</h1>
        <div class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 mb-4 font-medium">
          ⚠️ 심한 골절 의심 또는 의식 저하 시 즉시 119 및 보건실로 긴급 후송 조치하세요.
        </div>
        <h2 class="text-xl font-bold text-slate-800 mt-4 mb-2">1. RICE 4단계 기본 응급처치</h2>
        <ol class="list-decimal pl-5 space-y-2 text-slate-700">
          <li><strong>Rest (안정):</strong> 부상 발생 즉시 경기를 중단하고 환자를 안전한 그늘로 이동시킵니다.</li>
          <li><strong>Ice (냉찜질):</strong> 얼음팩을 수건에 감싸 15~20분간 환부에 대어 부종을 억제합니다.</li>
          <li><strong>Compression (압박):</strong> 탄력붕대로 환부를 균일하게 감싸 혈종 형성을 방지합니다.</li>
          <li><strong>Elevation (거상):</strong> 손상 부위를 심장보다 높게 올려 붓기를 줄입니다.</li>
        </ol>
        <h2 class="text-xl font-bold text-slate-800 mt-4 mb-2">2. 복귀 및 주의사항</h2>
        <p class="text-slate-700 leading-relaxed">체중 지지 시 통증이 없으며 관절 가동 범위가 80% 이상 회복될 때까지 무리한 복귀를 금지합니다.</p>
        <p><br></p>
      `;
    } else if (type === 'notice') {
      html = `
        <h1 class="text-2xl font-black text-slate-900 mb-2">[공지] 상산 체육대회 경기 진행 수칙</h1>
        <p class="text-sm text-slate-500 mb-4">발행: 학생회 체육부 | 대상: 전교생 및 교직원</p>
        <hr class="my-4 border-slate-200" />
        <h2 class="text-xl font-bold text-slate-800 mt-3 mb-2">📌 주요 공지 사항</h2>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>모든 경기 라인업은 <strong>경기 시작 5분 전</strong>에 전산으로 자동 공개됩니다.</li>
          <li>심판 판정에 대한 불복은 반장(주장)을 통해서만 본부석에 이의 제기 가능합니다.</li>
          <li>대운동장 내 유리병 및 위험 물품 반입을 전면 금지합니다.</li>
        </ul>
        <p><br></p>
      `;
    } else {
      html = `
        <h1 class="text-2xl font-black text-slate-900 mb-2">이메일 공지 초안</h1>
        <p class="text-slate-700 mb-2">받는 사람: 전교생 및 학부모님</p>
        <p class="text-slate-700 mb-4">제목: [상산고] 2026학년도 교내 체육대회 및 축제 안내의 건</p>
        <p class="text-slate-700 leading-relaxed mb-4">안녕하십니까. 상산고등학교 학생회입니다. 학생들의 건강한 체력 증진과 화합을 위하여 다음과 같이 교내 체육대회를 개최하오니 많은 성원 부탁드립니다.</p>
        <p><br></p>
      `;
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = html;
      updateMetricsAndOutline();
      setIsSaved(false);
    }
  };

  const handleSave = () => {
    const contentHtml = editorRef.current?.innerHTML || '';
    const plainText = editorRef.current?.innerText || '';
    onSave?.({
      title: docTitle,
      contentHtml,
      plainText
    });
    setIsSaved(true);
  };

  // Print Document
  const handlePrint = () => {
    window.print();
  };

  // Download as HTML
  const handleDownload = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${docTitle}</title>
        <style>
          body { font-family: 'Noto Sans KR', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; color: #1e293b; }
          h1 { font-size: 28px; font-weight: 800; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          h2 { font-size: 22px; font-weight: 700; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          th { background: #f1f5f9; }
        </style>
      </head>
      <body>
        ${editorRef.current?.innerHTML || ''}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-[#f8fafd] dark:bg-slate-950 select-none ${isFullscreen ? 'fixed inset-0 z-50' : 'relative rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden'}`}>
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
      <input
        type="file"
        ref={fontFileInputRef}
        accept=".ttf,.otf,.woff,.woff2"
        className="hidden"
        onChange={handleFontFileUpload}
      />

      {/* TOP HEADER: Clean Editor Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Edit Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-emerald-600 flex items-center justify-center text-white shadow-2xs shrink-0">
            <FileText className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={docTitle}
                onChange={(e) => {
                  setDocTitle(e.target.value);
                  setIsSaved(false);
                }}
                disabled={readOnly}
                placeholder="제목 없는 문서"
                className="font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 px-1.5 py-0.5 rounded outline-none transition text-sm max-w-[280px] sm:max-w-md truncate"
              />
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400">
                <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{isSaved ? '저장 완료' : '수정 중...'}</span>
              </span>
            </div>

            {/* Menu Bar: 파일, 수정, 보기, 삽입, 서식 */}
            <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium text-[11px] mt-0.5">
              {[
                {
                  key: 'file',
                  label: '파일',
                  items: [
                    { label: '저장하기 (Ctrl+S)', action: handleSave },
                    { label: 'HTML 파일로 다운로드', action: handleDownload },
                    { label: '인쇄 (Ctrl+P)', action: handlePrint },
                    { label: '문서 초기화', action: () => { if (confirm('정말 문서를 비우시겠습니까?')) { if (editorRef.current) editorRef.current.innerHTML = '<p><br></p>'; updateMetricsAndOutline(); } } }
                  ]
                },
                {
                  key: 'edit',
                  label: '수정',
                  items: [
                    { label: '실행 취소 (Undo)', action: () => executeCommand('undo') },
                    { label: '다시 실행 (Redo)', action: () => executeCommand('redo') },
                    { label: '모두 선택 (Select All)', action: () => executeCommand('selectAll') },
                    { label: '서식 지우기', action: () => executeCommand('removeFormat') }
                  ]
                },
                {
                  key: 'view',
                  label: '보기',
                  items: [
                    { label: showRuler ? '눈금자 숨기기' : '눈금자 표시', action: () => setShowRuler(!showRuler) },
                    { label: showSidebar ? '문서 개요 숨기기' : '문서 개요 표시', action: () => setShowSidebar(!showSidebar) },
                    { label: isFullscreen ? '전체화면 종료' : '전체화면 모드', action: () => setIsFullscreen(!isFullscreen) }
                  ]
                },
                {
                  key: 'insert',
                  label: '삽입',
                  items: [
                    { label: '이미지 업로드 (PC)', action: () => fileInputRef.current?.click() },
                    { label: '하이퍼링크 삽입', action: () => setLinkModalOpen(true) },
                    { label: '동영상 삽입 (YouTube)', action: () => setVideoModalOpen(true) },
                    { label: '표 (Table) 삽입', action: () => setTablePickerOpen(true) },
                    { label: '구분선 (가로줄)', action: () => executeCommand('insertHorizontalRule') },
                    { label: '현재 날짜 스탬프', action: () => executeCommand('insertText', new Date().toLocaleDateString('ko-KR')) }
                  ]
                },
                {
                  key: 'format',
                  label: '서식',
                  items: [
                    { label: '굵게 (Bold)', action: () => executeCommand('bold') },
                    { label: '기울임꼴 (Italic)', action: () => executeCommand('italic') },
                    { label: '밑줄 (Underline)', action: () => executeCommand('underline') },
                    { label: '취소선 (Strikethrough)', action: () => executeCommand('strikeThrough') },
                    { label: '양쪽 정렬 (Justify)', action: () => executeCommand('justifyFull') }
                  ]
                }
              ].map((menu) => (
                <div key={menu.key} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveMenu(activeMenu === menu.key ? null : menu.key)}
                    className="px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    {menu.label}
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === menu.key && (
                    <div className="absolute top-full left-0 mt-1 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 text-slate-800 dark:text-slate-200">
                      {menu.items.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            item.action();
                            setActiveMenu(null);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-emerald-600 transition flex items-center justify-between cursor-pointer"
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={isFullscreen ? '창 모드' : '전체화면'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Save Button */}
          {!readOnly && (
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>저장</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* TOOLBAR: Complete Google Docs Toolbar */}
      <div className="bg-[#edf2fa] dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center gap-1 overflow-x-auto text-slate-700 dark:text-slate-300 text-xs">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => executeCommand('undo')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="실행 취소 (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('redo')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="다시 실행 (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handlePrint}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="인쇄 (Ctrl+P)"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Format Painter */}
        <button
          type="button"
          onClick={handleFormatPainterClick}
          className={`p-1.5 rounded transition cursor-pointer ${
            formatPainterActive
              ? 'bg-blue-600 text-white shadow-xs'
              : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
          }`}
          title="서식 복사 (Format Painter)"
        >
          <Paintbrush className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Zoom dropdown */}
        <select
          value={zoomLevel}
          onChange={(e) => setZoomLevel(Number(e.target.value))}
          className="bg-transparent hover:bg-white dark:hover:bg-slate-800 px-1.5 py-1 rounded text-xs outline-none cursor-pointer"
        >
          <option value={75}>75%</option>
          <option value={90}>90%</option>
          <option value={100}>100%</option>
          <option value={125}>125%</option>
          <option value={150}>150%</option>
        </select>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Style Dropdown (일반 텍스트, 제목 1, 2, 3...) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setStyleDropdownOpen(!styleDropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-white dark:hover:bg-slate-800 text-xs font-medium cursor-pointer"
          >
            <span>{currentStyle}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          {styleDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50">
              {TEXT_STYLES.map((style) => (
                <button
                  key={style.label}
                  type="button"
                  onClick={() => {
                    executeCommand('formatBlock', style.tag);
                    setCurrentStyle(style.label);
                    setStyleDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs transition cursor-pointer"
                >
                  <span className={style.className}>{style.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Basic Text Formats (B, I, U, S) */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="굵게 (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="기울임꼴 (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="밑줄 (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('strikeThrough')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="취소선"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Insert Link */}
        <button
          type="button"
          onClick={() => {
            saveSelection();
            setLinkModalOpen(true);
          }}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="링크 삽입 (Ctrl+K)"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* Insert Image */}
        <button
          type="button"
          onClick={() => {
            saveSelection();
            fileInputRef.current?.click();
          }}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="이미지 삽입"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        {/* Insert Video */}
        <button
          type="button"
          onClick={() => {
            saveSelection();
            setVideoModalOpen(true);
          }}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="동영상 삽입 (YouTube)"
        >
          <Video className="w-4 h-4" />
        </button>

        {/* Insert Table */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setTablePickerOpen(!tablePickerOpen)}
            className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
            title="표 (Table) 삽입"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          {tablePickerOpen && (
            <div className="absolute top-full left-0 mt-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 space-y-2">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                표 크기 선택 ({tableRows}행 x {tableCols}열)
              </div>
              <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                {[1, 2, 3, 4, 5].map((r) => (
                  <React.Fragment key={r}>
                    {[1, 2, 3, 4, 5].map((c) => (
                      <div
                        key={`${r}-${c}`}
                        onMouseEnter={() => {
                          setTableRows(r);
                          setTableCols(c);
                        }}
                        onClick={() => handleInsertTable(r, c)}
                        className={`w-5 h-5 rounded-xs border transition cursor-pointer ${
                          r <= tableRows && c <= tableCols
                            ? 'bg-blue-200 border-blue-500'
                            : 'bg-white dark:bg-slate-700 border-slate-200'
                        }`}
                      />
                    ))}
                  </React.Fragment>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleInsertTable(tableRows, tableCols)}
                className="w-full py-1 bg-blue-600 text-white rounded text-xs font-bold hover:bg-blue-700 transition"
              >
                표 삽입
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Alignments */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="왼쪽 정렬"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="가운데 정렬"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="오른쪽 정렬"
        >
          <AlignRight className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="양쪽 정렬"
        >
          <AlignJustify className="w-4 h-4" />
        </button>

        {/* Line Spacing Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLineSpacingOpen(!lineSpacingOpen)}
            className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition flex items-center gap-0.5 cursor-pointer"
            title="줄 간격 (Line Spacing)"
          >
            <span className="font-bold text-[11px] leading-none">↕</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>
          {lineSpacingOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-50 text-xs">
              {[
                { label: '단일 (1.0)', val: '1.0' },
                { label: '1.15', val: '1.15' },
                { label: '1.5', val: '1.5' },
                { label: '이중 (2.0)', val: '2.0' },
                { label: '2.5', val: '2.5' }
              ].map((spacing) => (
                <button
                  key={spacing.val}
                  type="button"
                  onClick={() => {
                    if (editorRef.current) {
                      editorRef.current.style.lineHeight = spacing.val;
                    }
                    setLineSpacingOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs transition cursor-pointer"
                >
                  {spacing.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-slate-300 dark:bg-slate-700 mx-1 shrink-0" />

        {/* Lists & Indents */}
        <button
          type="button"
          onClick={() => executeCommand('insertUnorderedList')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="글머리 기호 목록"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('insertOrderedList')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="번호 매기기 목록"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('outdent')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="내어쓰기 (Shift+Tab)"
        >
          <Outdent className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('indent')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="들여쓰기 (Tab)"
        >
          <Indent className="w-4 h-4" />
        </button>

        {/* Clear formatting */}
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
          title="서식 지우기 (Clear Formatting)"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* HORIZONTAL RULER (눈금자) */}
      {showRuler && (
        <div className="bg-[#f0f4f9] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-1 flex items-center justify-center select-none overflow-hidden">
          <div className="w-full max-w-[850px] flex items-center justify-between text-[9px] font-mono text-slate-400 relative h-3 border-x border-slate-300">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map((num) => (
              <span key={num} className="relative">
                <span className="absolute -top-1 left-1/2 -translate-x-1/2">{num}</span>
                <span className="block w-px h-1.5 bg-slate-300 mt-2" />
              </span>
            ))}
            {/* Ruler Left/Right Marker Triangles */}
            <div className="absolute left-0 top-0 w-2 h-2.5 bg-blue-600 rounded-b-xs" title="왼쪽 여백" />
            <div className="absolute right-0 top-0 w-2 h-2.5 bg-blue-600 rounded-b-xs" title="오른쪽 여백" />
          </div>
        </div>
      )}

      {/* MAIN BODY AREA: Sidebar + Google Docs Page Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar: Document Tabs & Headings Outline */}
        {showSidebar && (
          <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hidden md:flex shrink-0 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                  <span>문서 개요 (Outline)</span>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {outlineHeadings.length}개 제목
                  </span>
                </div>
                {outlineHeadings.length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic py-2">
                    제목 1, 2, 3 서식을 추가하면 여기에 실시간 목차가 자동 생성됩니다.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {outlineHeadings.map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(h.id);
                          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`w-full text-left text-xs py-1 px-2 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 truncate transition cursor-pointer ${
                          h.level === 1 ? 'font-bold text-slate-900 dark:text-white' : h.level === 2 ? 'pl-4 text-slate-700 dark:text-slate-300' : 'pl-6 text-slate-500'
                        }`}
                      >
                        {h.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Template Quick Inserts */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 mb-2">원클릭 템플릿</div>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => insertTemplate('injury')}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🩹</span> <span>부상 대처 가이드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTemplate('meeting')}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📋</span> <span>체육대회 회의록</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTemplate('notice')}
                    className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs text-left transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>📑</span> <span>대회 공지사항 양식</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom word count info */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div>글자 수: <strong className="text-slate-700 dark:text-slate-300">{wordCount.chars}</strong>자</div>
              <div>단어 수: <strong className="text-slate-700 dark:text-slate-300">{wordCount.words}</strong>단어</div>
              <div className="text-[10px] text-slate-400 pt-1">Google Docs Cloud Sync</div>
            </div>
          </aside>
        )}

        {/* Main Document Canvas: Centered Realistic Google Docs Page */}
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-[#f8fafd] dark:bg-slate-950"
          style={{
            transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: 'top center'
          }}
        >
          <div className="w-full max-w-[850px] min-h-[1056px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-[0_1px_3px_1px_rgba(60,64,67,0.15)] dark:shadow-2xl rounded-xs p-10 sm:p-16 flex flex-col relative transition-all">
            {/* Quick Starter Pills (as seen in Google Docs screenshot) */}
            {(!initialContentHtml || wordCount.chars === 0) && (
              <div className="flex flex-wrap items-center gap-2 mb-6 select-none animate-in fade-in">
                <button
                  type="button"
                  onClick={() => insertTemplate('meeting')}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/60"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>회의록</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate('email')}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/60"
                >
                  <span>✉️</span>
                  <span>이메일 초안</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate('injury')}
                  className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-red-200/60"
                >
                  <span>🩹</span>
                  <span>부상 대처 가이드</span>
                </button>
                <button
                  type="button"
                  onClick={() => insertTemplate('notice')}
                  className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200/60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>대회 공지 양식</span>
                </button>
              </div>
            )}

            {/* REAL CONTENT EDITABLE AREA */}
            <div
              ref={editorRef}
              contentEditable={!readOnly}
              suppressContentEditableWarning
              onMouseUp={handleEditorMouseUp}
              onKeyUp={handleEditorMouseUp}
              onInput={() => {
                setIsSaved(false);
                updateMetricsAndOutline();
              }}
              className="flex-1 outline-none text-slate-900 dark:text-slate-100 font-normal text-base leading-relaxed break-words min-h-[700px] select-text"
              style={{
                fontFamily: currentFont,
                lineHeight: 1.6
              }}
              placeholder="내용을 입력하거나 서식을 적용하세요..."
            />
          </div>
        </main>
      </div>

      {/* INSERT LINK MODAL */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                하이퍼링크 삽입
              </h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">표시할 텍스트</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="예: 상산고 공식 홈페이지"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">링크 주소 (URL)</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleInsertLink}
                className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSERT VIDEO MODAL */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Video className="w-4 h-4 text-red-600" />
                동영상 삽입 (YouTube)
              </h3>
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">YouTube 동영상 URL</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-slate-400">
                입력하신 유튜브 링크가 반응형 플레이어 위젯으로 본문에 자동 삽입됩니다.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setVideoModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleInsertVideo}
                className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700"
              >
                동영상 삽입
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
