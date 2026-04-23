import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Upload, FileText, Sparkles, AlertCircle, Loader2, Camera, FileArchive, Copy } from "lucide-react";
import { studyplanApi } from "@/api/studyplanClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getSchoolPdfImportCooldownForFree, markSchoolPdfImportedNow } from "@/lib/freePlanUtils";
import { useI18n } from '@/lib/I18nContext';
import { parseHomeworkFromSchoolText } from '@/lib/schoolHomeworkText';

let pdfJsPromise = null;
let tesseractPromise = null;

async function ensurePdfJs() {
  if (!pdfJsPromise) {
    pdfJsPromise = import('pdfjs-dist').then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString();
      return pdfjsLib;
    });
  }
  return pdfJsPromise;
}

async function ensureTesseract() {
  if (!tesseractPromise) {
    tesseractPromise = import('tesseract.js');
  }
  const mod = await tesseractPromise;
  return mod.default || mod;
}

export default function ImportTasksModal({
  open,
  onOpenChange,
  onImport,
  userPrefs,
  initialTab = 'photo',
  isPremium = false,
  schoolPdfSource = null,
}) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('photo');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedPdfName, setUploadedPdfName] = useState('');
  const [lastPdfRaw, setLastPdfRaw] = useState('');
  const [pdfCopyMsg, setPdfCopyMsg] = useState('');
  const fileInputRef = useRef(null);
  const fileInputPdfRef = useRef(null);

  React.useEffect(() => {
    if (!open) {
      setLastPdfRaw('');
      setPdfCopyMsg('');
    }
  }, [open]);
  
  const classLevel = userPrefs?.class_level || 'troisieme';
  const specialties = userPrefs?.specialties || [];
  const parseImport = (raw, sourceKind) => {
    const base = { classLevel, specialties };
    if (sourceKind === 'pdf' || sourceKind === 'photo') {
      let p = parseHomeworkFromSchoolText(raw, { ...base, mode: 'relaxed' });
      if (p.length === 0) p = parseHomeworkFromSchoolText(raw, { ...base, mode: 'strict' });
      return p;
    }
    let p = parseHomeworkFromSchoolText(raw, { ...base, mode: 'strict' });
    if (p.length === 0) p = parseHomeworkFromSchoolText(raw, { ...base, mode: 'relaxed' });
    return p;
  };

  React.useEffect(() => {
    if (!open) return;
    setActiveTab(initialTab === 'text' ? 'text' : initialTab === 'pdf' ? 'pdf' : 'photo');
  }, [open, initialTab]);

  /** Ordre de lecture correct (Y puis X) — important pour les PDF Pronote */
  const extractOrderedTextFromPage = async (page) => {
    const content = await page.getTextContent();
    const items = content.items
      .filter((item) => item && typeof item.str === 'string' && item.str.trim().length > 0)
      .map((item) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        h: Math.abs(item.height) || 10,
        hasEOL: Boolean(item.hasEOL),
      }));
    if (items.length === 0) return '';
    const avgH = items.reduce((s, it) => s + it.h, 0) / items.length;
    const lineTol = Math.max(4, avgH * 0.55);
    items.sort((a, b) => {
      if (Math.abs(a.y - b.y) > lineTol) return b.y - a.y;
      return a.x - b.x;
    });
    let out = '';
    let prevY = items[0].y;
    for (let i = 0; i < items.length; i += 1) {
      const it = items[i];
      if (i > 0) {
        const newLine = Math.abs(it.y - prevY) > lineTol;
        if (newLine) {
          out += '\n';
        } else if (!out.endsWith(' ') && !out.endsWith('\n') && it.str && !/^[,;.:!?)\]%»\-]/.test(it.str)) {
          out += ' ';
        }
      }
      out += it.str;
      if (it.hasEOL) out += '\n';
      prevY = it.y;
    }
    return out;
  };

  const extractFullTextFromPdfDocument = async (doc) => {
    let full = '';
    for (let pageNum = 1; pageNum <= doc.numPages; pageNum += 1) {
      const page = await doc.getPage(pageNum);
      full += `${await extractOrderedTextFromPage(page)}\n\n`;
    }
    return full.trim();
  };

  /** PDF « image » ou peu de texte extractible (souvent impression Pronote) */
  const ocrPdfFirstPages = async (doc, maxPages, Tesseract) => {
    const n = Math.min(maxPages, doc.numPages);
    let acc = '';
    for (let p = 1; p <= n; p += 1) {
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) continue;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const renderTask = page.render({ canvasContext: ctx, viewport });
      await renderTask.promise;
      const { data } = await Tesseract.recognize(canvas, 'fra+eng', { logger: () => {} });
      acc += `${data?.text || ''}\n\n`;
    }
    return acc.trim();
  };

  const extractTextFromPdf = async (file) => {
    const pdfjsLib = await ensurePdfJs();
    const buffer = await file.arrayBuffer();
    const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
    let text = await extractFullTextFromPdfDocument(doc);
    const compact = text.replace(/\s+/g, ' ').trim();
    const lineCount = text.split('\n').filter((l) => l.trim().length > 4).length;
    const needsOcr = compact.length < 200 || (lineCount < 8 && compact.length < 500);

    if (needsOcr) {
      try {
        const Tesseract = await ensureTesseract();
        const ocr = await ocrPdfFirstPages(doc, Math.min(3, doc.numPages), Tesseract);
        if (ocr.length > 50) {
          text = `${text}\n\n---\n\n${ocr}`;
        }
      } catch {
        /* ignore */
      }
    }
    return text;
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setError('');

    try {
      const { file_url } = await studyplanApi.integrations.Core.UploadFile({ file });
      setUploadedImage(file_url);

      const Tesseract = await ensureTesseract();
      const ocr = await Tesseract.recognize(file, 'fra+eng');
      const extractedText = ocr?.data?.text || '';
      let parsedTasks = parseImport(extractedText, 'photo');

      if (parsedTasks.length > 0) {
        const tasksWithDefaults = parsedTasks.map(task => ({
          ...task,
          source: 'photo',
          status: 'a_faire',
          priority: task.difficulty === 'difficile' ? 8 : task.difficulty === 'moyen' ? 5 : 3
        }));
        onImport(tasksWithDefaults);
        setUploadedImage(null);
        onOpenChange(false);
      } else {
        setError(t('errPhotoNoTasks'));
      }
    } catch (err) {
      setError(t('errPhotoOcr'));
    }
    
    setIsProcessing(false);
  };

  const handleTextImport = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    setError('');
    
    const parsedTasks = parseImport(textInput, 'text');
    
    if (parsedTasks.length > 0) {
      const tasksWithDefaults = parsedTasks.map(task => ({
        ...task,
        source: 'import',
        status: 'a_faire',
        priority: task.difficulty === 'difficile' ? 8 : task.difficulty === 'moyen' ? 5 : 3
      }));
      onImport(tasksWithDefaults);
      setTextInput('');
      onOpenChange(false);
    } else {
      setError(t('errTextNoTasks'));
    }
    
    setIsProcessing(false);
  };

  const handlePdfUpload = async (file) => {
    if (!file) return;
    setIsProcessing(true);
    setError('');
    setUploadedPdfName(file.name || 'document.pdf');
    try {
      if (!isPremium && schoolPdfSource) {
        const { ok, daysRemaining } = getSchoolPdfImportCooldownForFree();
        if (!ok) {
          setError(t('errSchoolPdfWait').replace('{days}', String(daysRemaining)));
          setIsProcessing(false);
          return;
        }
      }
      const text = await extractTextFromPdf(file);
      setLastPdfRaw(text);
      setPdfCopyMsg('');
      const parsedTasks = parseImport(text, 'pdf');
      if (parsedTasks.length > 0) {
        const tasksWithDefaults = parsedTasks.map((task) => ({
          ...task,
          source: 'pdf',
          status: 'a_faire',
          priority: task.difficulty === 'difficile' ? 8 : task.difficulty === 'moyen' ? 5 : 3
        }));
        onImport(tasksWithDefaults);
        if (!isPremium && schoolPdfSource) {
          markSchoolPdfImportedNow();
        }
        setUploadedPdfName('');
        setLastPdfRaw('');
        onOpenChange(false);
      } else {
        setError(t('errPdfNoTasks'));
      }
    } catch (err) {
      setLastPdfRaw('');
      setError(t('errPdfRead'));
    }
    setIsProcessing(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500">
              <Upload className="w-4 h-4 text-white" />
            </div>
            {t('importModalTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('importModalSubtitle')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="photo" className="gap-2">
              <Camera className="w-4 h-4" />
              {t('importTabPhoto')}
            </TabsTrigger>
            <TabsTrigger value="text" className="gap-2">
              <FileText className="w-4 h-4" />
              {t('importTabText')}
            </TabsTrigger>
            <TabsTrigger value="pdf" className="gap-2">
              <FileArchive className="w-4 h-4" />
              {t('importTabPdf')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="photo" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>{t('importPhotoLabel')}</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="hidden"
              />
              
              {uploadedImage ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img src={uploadedImage} alt="" className="w-full" />
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full min-h-[200px] rounded-xl border-2 border-dashed border-slate-300 hover:border-violet-400 bg-slate-50 hover:bg-violet-50/30 transition-all flex flex-col items-center justify-center gap-3 p-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-slate-700">{t('importPhotoCta')}</p>
                    <p className="text-sm text-slate-500 mt-1">{t('importPhotoHelp')}</p>
                  </div>
                </button>
              )}
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-violet-600 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('importAnalyzePhoto')}</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="text" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>{t('importTextLabel')}</Label>
              <Textarea
                placeholder={t('importTextPlaceholder')}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[200px] resize-none"
              />
            </div>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              onClick={handleTextImport}
              disabled={!textInput.trim() || isProcessing}
              className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('importAnalyzeRun')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('importAnalyzeBtn')}
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="pdf" className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label>{t('importPdfLabel')}</Label>
              {!isPremium && schoolPdfSource ? (
                <p className="text-xs text-amber-800 bg-amber-50/80 border border-amber-200 rounded-lg px-2 py-1.5">
                  {t('importPdfHint')}
                </p>
              ) : null}
              <input
                ref={fileInputPdfRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => e.target.files?.[0] && handlePdfUpload(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputPdfRef.current?.click()}
                disabled={isProcessing}
                className="w-full min-h-[180px] rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-3 p-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <FileArchive className="w-7 h-7 text-white" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700">{uploadedPdfName || t('importPdfPick')}</p>
                  <p className="text-sm text-slate-500 mt-1">{t('importPdfSub')}</p>
                </div>
              </button>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {error && lastPdfRaw.length > 20 && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full h-9"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(lastPdfRaw.slice(0, 12000));
                      setPdfCopyMsg(t('importCopyRawOk'));
                    } catch {
                      setPdfCopyMsg('');
                    }
                  }}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {t('importCopyRawBtn')}
                </Button>
                {pdfCopyMsg ? (
                  <p className="text-xs text-emerald-700">{pdfCopyMsg}</p>
                ) : null}
                <p className="text-xs text-slate-500 leading-snug">{t('importDebugHint')}</p>
              </div>
            )}

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-indigo-600 py-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>{t('importAnalyzePdf')}</span>
              </div>
            )}
          </TabsContent>
          
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}