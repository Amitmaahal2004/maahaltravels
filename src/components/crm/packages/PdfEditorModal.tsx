"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Save,
  Type,
  Square,
  Image as ImageIcon,
  RotateCw,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Highlighter,
  Stamp,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  MousePointer,
  Circle,
  Minus,
  StickyNote,
  Palette,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Download,
} from "lucide-react";
import {
  PdfEditPayload,
  PageModification,
  TextOverlayItem,
  WhiteoutBoxItem,
  ShapeItem,
  ImageItem,
  AnnotationItem,
} from "@/services/pdf-editor.service";

interface PdfEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    _id: string;
    displayName: string;
    fileUrl: string;
    version: number;
    fileSize: number;
  } | null;
  packageId: string;
  packageName: string;
  onSaved: (updatedDoc: any) => void;
}

export default function PdfEditorModal({
  isOpen,
  onClose,
  document,
  packageId,
  packageName,
  onSaved,
}: PdfEditorModalProps) {
  // Page structure state
  const [pages, setPages] = useState<number[]>([0, 1]); // Page indices
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [pageRotations, setPageRotations] = useState<{ [pageIdx: number]: number }>({});

  // Tool selection
  const [activeTool, setActiveTool] = useState<
    "select" | "text" | "whiteout" | "image" | "shape" | "watermark" | "highlight" | "note"
  >("select");

  // Per-page vector elements
  const [textOverlays, setTextOverlays] = useState<{ [pageIdx: number]: TextOverlayItem[] }>({});
  const [whiteoutBoxes, setWhiteoutBoxes] = useState<{ [pageIdx: number]: WhiteoutBoxItem[] }>({});
  const [shapes, setShapes] = useState<{ [pageIdx: number]: ShapeItem[] }>({});
  const [images, setImages] = useState<{ [pageIdx: number]: ImageItem[] }>({});
  const [annotations, setAnnotations] = useState<{ [pageIdx: number]: AnnotationItem[] }>({});

  // Global settings
  const [watermarkText, setWatermarkText] = useState("EXPLORE MY PACKAGES");
  const [enableWatermark, setEnableWatermark] = useState(false);
  const [headerText, setHeaderText] = useState("");
  const [footerText, setFooterText] = useState("Explore My Packages • Official Brochure");

  // Selection & Properties
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [selectedElementType, setSelectedElementType] = useState<string | null>(null);

  // Property controls
  const [fontFamily, setFontFamily] = useState<"Helvetica" | "HelveticaBold" | "TimesRoman" | "Courier">("HelveticaBold");
  const [fontSize, setFontSize] = useState<number>(14);
  const [textColor, setTextColor] = useState<string>("#0F172A");
  const [fillColor, setFillColor] = useState<string>("#FFFFFF");
  const [borderColor, setBorderColor] = useState<string>("#2563EB");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveAsNewVersion, setSaveAsNewVersion] = useState(true);
  const [changeDescription, setChangeDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !document) return null;

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const publicViewUrl = document.fileUrl.startsWith("http")
    ? document.fileUrl
    : `${appUrl}/api/public/documents/${document._id}/view`;

  // Page Management Functions
  const handleAddBlankPage = () => {
    const nextIdx = pages.length;
    setPages([...pages, nextIdx]);
    setCurrentPageIndex(pages.length);
  };

  const handleDuplicatePage = () => {
    const current = pages[currentPageIndex];
    const newPages = [...pages];
    newPages.splice(currentPageIndex + 1, 0, current);
    setPages(newPages);
    setCurrentPageIndex(currentPageIndex + 1);
  };

  const handleRotatePage = () => {
    const currentRot = pageRotations[currentPageIndex] || 0;
    const nextRot = (currentRot + 90) % 360;
    setPageRotations({ ...pageRotations, [currentPageIndex]: nextRot });
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) {
      alert("A document must have at least one page.");
      return;
    }
    const newPages = pages.filter((_, idx) => idx !== currentPageIndex);
    setPages(newPages);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
  };

  const handleMovePageUp = () => {
    if (currentPageIndex === 0) return;
    const newPages = [...pages];
    const temp = newPages[currentPageIndex];
    newPages[currentPageIndex] = newPages[currentPageIndex - 1];
    newPages[currentPageIndex - 1] = temp;
    setPages(newPages);
    setCurrentPageIndex(currentPageIndex - 1);
  };

  const handleMovePageDown = () => {
    if (currentPageIndex >= pages.length - 1) return;
    const newPages = [...pages];
    const temp = newPages[currentPageIndex];
    newPages[currentPageIndex] = newPages[currentPageIndex + 1];
    newPages[currentPageIndex + 1] = temp;
    setPages(newPages);
    setCurrentPageIndex(currentPageIndex + 1);
  };

  // Canvas Click: Place items
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert pixel to A4 points (595.28 x 841.89)
    const scaleX = 595.28 / rect.width;
    const scaleY = 841.89 / rect.height;

    // In PDF coordinates, origin (0,0) is bottom-left
    const pdfX = Math.round(clickX * scaleX);
    const pdfY = Math.round((rect.height - clickY) * scaleY);

    const elemId = `elem_${Date.now()}`;

    if (activeTool === "text") {
      const textItem: TextOverlayItem = {
        id: elemId,
        text: "New Text / Pricing Note",
        x: pdfX,
        y: pdfY,
        fontSize,
        fontFamily,
        color: textColor,
      };
      const existing = textOverlays[currentPageIndex] || [];
      setTextOverlays({ ...textOverlays, [currentPageIndex]: [...existing, textItem] });
      setSelectedElementId(elemId);
      setSelectedElementType("text");
      setActiveTool("select");
    } else if (activeTool === "whiteout") {
      // Cover existing flattened text
      const boxItem: WhiteoutBoxItem = {
        id: elemId,
        x: pdfX,
        y: pdfY - 20,
        width: 140,
        height: 25,
        color: fillColor,
      };
      const existing = whiteoutBoxes[currentPageIndex] || [];
      setWhiteoutBoxes({ ...whiteoutBoxes, [currentPageIndex]: [...existing, boxItem] });
      setSelectedElementId(elemId);
      setSelectedElementType("whiteout");
      setActiveTool("select");
    } else if (activeTool === "shape") {
      const shapeItem: ShapeItem = {
        id: elemId,
        type: "rectangle",
        x: pdfX,
        y: pdfY - 30,
        width: 120,
        height: 35,
        fillColor,
        borderColor,
        borderWidth: 1.5,
      };
      const existing = shapes[currentPageIndex] || [];
      setShapes({ ...shapes, [currentPageIndex]: [...existing, shapeItem] });
      setSelectedElementId(elemId);
      setSelectedElementType("shape");
      setActiveTool("select");
    } else if (activeTool === "highlight") {
      const annItem: AnnotationItem = {
        id: elemId,
        type: "highlight",
        x: pdfX,
        y: pdfY - 14,
        width: 100,
        height: 16,
        color: "#FEF08A",
      };
      const existing = annotations[currentPageIndex] || [];
      setAnnotations({ ...annotations, [currentPageIndex]: [...existing, annItem] });
      setSelectedElementId(elemId);
      setSelectedElementType("annotation");
      setActiveTool("select");
    } else if (activeTool === "note") {
      const noteItem: AnnotationItem = {
        id: elemId,
        type: "note",
        x: pdfX,
        y: pdfY - 40,
        width: 120,
        height: 40,
        text: "Special booking condition applies.",
      };
      const existing = annotations[currentPageIndex] || [];
      setAnnotations({ ...annotations, [currentPageIndex]: [...existing, noteItem] });
      setSelectedElementId(elemId);
      setSelectedElementType("annotation");
      setActiveTool("select");
    }
  };

  // Image Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const elemId = `img_${Date.now()}`;
      const imgItem: ImageItem = {
        id: elemId,
        imageBase64: base64,
        mimeType: file.type === "image/jpeg" ? "image/jpeg" : "image/png",
        x: 60,
        y: 650,
        width: 140,
        height: 90,
      };
      const existing = images[currentPageIndex] || [];
      setImages({ ...images, [currentPageIndex]: [...existing, imgItem] });
      setSelectedElementId(elemId);
      setSelectedElementType("image");
      setActiveTool("select");
    };
    reader.readAsDataURL(file);
  };

  // Delete Selected Element
  const handleDeleteSelected = () => {
    if (!selectedElementId) return;
    if (selectedElementType === "text") {
      const list = (textOverlays[currentPageIndex] || []).filter((i) => i.id !== selectedElementId);
      setTextOverlays({ ...textOverlays, [currentPageIndex]: list });
    } else if (selectedElementType === "whiteout") {
      const list = (whiteoutBoxes[currentPageIndex] || []).filter((i) => i.id !== selectedElementId);
      setWhiteoutBoxes({ ...whiteoutBoxes, [currentPageIndex]: list });
    } else if (selectedElementType === "shape") {
      const list = (shapes[currentPageIndex] || []).filter((i) => i.id !== selectedElementId);
      setShapes({ ...shapes, [currentPageIndex]: list });
    } else if (selectedElementType === "image") {
      const list = (images[currentPageIndex] || []).filter((i) => i.id !== selectedElementId);
      setImages({ ...images, [currentPageIndex]: list });
    } else if (selectedElementType === "annotation") {
      const list = (annotations[currentPageIndex] || []).filter((i) => i.id !== selectedElementId);
      setAnnotations({ ...annotations, [currentPageIndex]: list });
    }
    setSelectedElementId(null);
    setSelectedElementType(null);
  };

  // Save Document
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Build PageModification list
      const modifications: PageModification[] = [];

      for (let i = 0; i < pages.length; i++) {
        const mod: PageModification = {
          pageIndex: i,
          rotation: pageRotations[i] || 0,
          textOverlays: textOverlays[i] || [],
          whiteoutBoxes: whiteoutBoxes[i] || [],
          shapes: shapes[i] || [],
          images: images[i] || [],
          annotations: annotations[i] || [],
        };
        modifications.push(mod);
      }

      const payload: PdfEditPayload = {
        pageOrder: pages,
        modifications,
        watermark: enableWatermark
          ? {
              text: watermarkText,
              opacity: 0.14,
              color: "#3B82F6",
            }
          : undefined,
        headerText: headerText.trim() || undefined,
        footerText: footerText.trim() || undefined,
      };

      const res = await fetch(`/api/crm/packages/${packageId}/documents/${document._id}/process-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editPayload: payload,
          changeDescription: changeDescription || `Updated brochure in PDF Studio (v${document.version + 1})`,
          saveAsNewVersion,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to process PDF changes");
      }

      onSaved(data.data);
      alert(`Document saved successfully as Version ${data.data.version}!`);
      onClose();
    } catch (err: any) {
      setError(err.message || "Save error");
    } finally {
      setSaving(false);
    }
  };

  // Current page elements
  const currentTexts = textOverlays[currentPageIndex] || [];
  const currentWhiteouts = whiteoutBoxes[currentPageIndex] || [];
  const currentShapes = shapes[currentPageIndex] || [];
  const currentImgs = images[currentPageIndex] || [];
  const currentAnnotations = annotations[currentPageIndex] || [];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900 text-white animate-fadeIn">
      {/* Hidden file input for image insertion */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg"
        className="hidden"
      />

      {/* Top Main Studio Header */}
      <div className="h-14 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs">
            PDF STUDIO
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold truncate max-w-sm">{document.displayName}</h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v{document.version}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">{packageName}</p>
          </div>
        </div>

        {/* Studio Save Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 mr-2">
            <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveAsNewVersion}
                onChange={(e) => setSaveAsNewVersion(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Save as v{document.version + 1}</span>
            </label>
            <input
              type="text"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Version change notes..."
              className="px-2.5 py-1 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-200 w-44 outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{saving ? "Saving Changes..." : "Save PDF"}</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Secondary Tool Selection & Formatting Toolbar */}
      <div className="h-12 px-4 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between gap-4 shrink-0 overflow-x-auto">
        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTool("select")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "select" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
            title="Select & Move tool"
          >
            <MousePointer className="h-3.5 w-3.5" />
            <span>Select</span>
          </button>

          <button
            onClick={() => setActiveTool("text")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "text" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
            title="Click canvas to place text"
          >
            <Type className="h-3.5 w-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => setActiveTool("whiteout")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "whiteout" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
            title="Cover existing flattened text with opaque rectangle"
          >
            <Square className="h-3.5 w-3.5" />
            <span>Cover Box / Whiteout</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            title="Upload Logo or Travel Photograph"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Insert Image</span>
          </button>

          <button
            onClick={() => setActiveTool("shape")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "shape" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
            title="Draw shape banner or border"
          >
            <Circle className="h-3.5 w-3.5" />
            <span>Shape</span>
          </button>

          <button
            onClick={() => setActiveTool("highlight")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "highlight" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
            title="Highlight text"
          >
            <Highlighter className="h-3.5 w-3.5" />
            <span>Highlight</span>
          </button>

          <button
            onClick={() => setActiveTool("note")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              activeTool === "note" ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
            }`}
            title="Sticky Note annotation"
          >
            <StickyNote className="h-3.5 w-3.5" />
            <span>Note</span>
          </button>
        </div>

        {/* Contextual Properties (Font, Size, Color, Delete) */}
        <div className="flex items-center gap-3">
          {/* Typography options */}
          <select
            value={fontFamily}
            onChange={(e: any) => setFontFamily(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 outline-none"
          >
            <option value="HelveticaBold">Helvetica Bold</option>
            <option value="Helvetica">Helvetica</option>
            <option value="TimesRoman">Times Roman</option>
            <option value="Courier">Courier Mono</option>
          </select>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Size:</span>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              min={8}
              max={48}
              className="w-12 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-1.5 py-1 text-center outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Text:</span>
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent"
              title="Text Color"
            />
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400">Box:</span>
            <input
              type="color"
              value={fillColor}
              onChange={(e) => setFillColor(e.target.value)}
              className="w-6 h-6 rounded border border-slate-700 cursor-pointer bg-transparent"
              title="Fill / Whiteout Color"
            />
          </div>

          {/* Watermark toggle */}
          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <label className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={enableWatermark}
                onChange={(e) => setEnableWatermark(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Watermark</span>
            </label>
            {enableWatermark && (
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded px-2 py-0.5 outline-none"
              />
            )}
          </div>

          {selectedElementId && (
            <button
              onClick={handleDeleteSelected}
              className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition"
              title="Delete Selected Element"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Page Thumbnails Sidebar */}
        <div className="w-56 bg-slate-950 border-r border-slate-800 p-3 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Pages ({pages.length})
              </span>
              <button
                onClick={handleAddBlankPage}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
                title="Add Blank Page"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Thumbnails list */}
            <div className="space-y-2">
              {pages.map((originalPageIdx, idx) => {
                const isActive = idx === currentPageIndex;
                const rot = pageRotations[idx] || 0;
                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentPageIndex(idx)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isActive
                        ? "border-blue-500 bg-blue-600/20 text-white ring-1 ring-blue-500/30"
                        : "border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-8 bg-slate-800 rounded border border-slate-700 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-semibold block">Page {idx + 1}</span>
                        <span className="text-[10px] text-slate-500 block">
                          {rot ? `${rot}° rotated` : "Standard A4"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Page Actions Toolbar */}
          <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Page Tools</span>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={handleRotatePage}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center"
                title="Rotate 90°"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDuplicatePage}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center"
                title="Duplicate Page"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleMovePageUp}
                disabled={currentPageIndex === 0}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center disabled:opacity-30"
                title="Move Up"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleMovePageDown}
                disabled={currentPageIndex >= pages.length - 1}
                className="p-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition flex items-center justify-center disabled:opacity-30"
                title="Move Down"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={handleDeletePage}
              className="w-full py-1.5 rounded bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="h-3 w-3" />
              <span>Delete Page {currentPageIndex + 1}</span>
            </button>
          </div>
        </div>

        {/* Center Canvas Stage */}
        <div className="flex-1 bg-slate-950/80 p-4 md:p-8 overflow-auto flex items-center justify-center relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 z-40 p-3 bg-rose-900/80 border border-rose-700 text-rose-200 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Interactive Document Stage (A4 Aspect Ratio: 595.28 x 841.89) */}
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-[595px] h-[842px] bg-white text-slate-900 rounded-lg shadow-2xl relative overflow-hidden select-none transition-transform"
            style={{
              transform: `scale(${zoom / 100}) rotate(${pageRotations[currentPageIndex] || 0}deg)`,
              transformOrigin: "center center",
            }}
          >
            {/* Background PDF Page Preview */}
            <iframe
              src={`${publicViewUrl}#page=${pages[currentPageIndex] + 1}&view=FitH&toolbar=0&navpanes=0`}
              className="w-full h-full border-none pointer-events-none absolute inset-0 opacity-80"
              title="Page Preview"
            />

            {/* Interactive Overlay Layer */}
            <div className="absolute inset-0 z-10 pointer-events-auto">
              {/* Whiteout Boxes (Cover existing flattened text) */}
              {currentWhiteouts.map((box) => (
                <div
                  key={box.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(box.id!);
                    setSelectedElementType("whiteout");
                  }}
                  className={`absolute rounded border cursor-move transition ${
                    selectedElementId === box.id
                      ? "ring-2 ring-blue-500 border-blue-600 shadow"
                      : "border-slate-300"
                  }`}
                  style={{
                    left: `${box.x}px`,
                    top: `${842 - box.y - box.height}px`,
                    width: `${box.width}px`,
                    height: `${box.height}px`,
                    backgroundColor: box.color || "#FFFFFF",
                  }}
                >
                  <span className="text-[9px] text-slate-400 block px-1 truncate select-none">
                    [Cover Box]
                  </span>
                </div>
              ))}

              {/* Shapes */}
              {currentShapes.map((shape) => (
                <div
                  key={shape.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(shape.id!);
                    setSelectedElementType("shape");
                  }}
                  className={`absolute transition cursor-move ${
                    selectedElementId === shape.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{
                    left: `${shape.x}px`,
                    top: `${842 - shape.y - shape.height}px`,
                    width: `${shape.width}px`,
                    height: `${shape.height}px`,
                    backgroundColor: shape.fillColor || "#FFFFFF",
                    borderColor: shape.borderColor || "#2563EB",
                    borderWidth: `${shape.borderWidth || 1}px`,
                    borderStyle: "solid",
                    borderRadius: shape.type === "circle" ? "9999px" : "4px",
                  }}
                />
              ))}

              {/* Images */}
              {currentImgs.map((img) => (
                <div
                  key={img.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(img.id!);
                    setSelectedElementType("image");
                  }}
                  className={`absolute transition cursor-move ${
                    selectedElementId === img.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{
                    left: `${img.x}px`,
                    top: `${842 - img.y - img.height}px`,
                    width: `${img.width}px`,
                    height: `${img.height}px`,
                  }}
                >
                  <img
                    src={img.imageBase64}
                    alt="Embedded"
                    className="w-full h-full object-contain rounded"
                  />
                </div>
              ))}

              {/* Text Overlays */}
              {currentTexts.map((textItem) => (
                <div
                  key={textItem.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(textItem.id!);
                    setSelectedElementType("text");
                  }}
                  className={`absolute cursor-move px-1 py-0.5 rounded transition ${
                    selectedElementId === textItem.id
                      ? "ring-2 ring-blue-500 bg-blue-50/50"
                      : "hover:bg-slate-100/40"
                  }`}
                  style={{
                    left: `${textItem.x}px`,
                    top: `${842 - textItem.y - (textItem.fontSize || 14)}px`,
                    color: textItem.color || "#0F172A",
                    fontSize: `${textItem.fontSize || 14}px`,
                    fontWeight: textItem.fontFamily === "HelveticaBold" ? "bold" : "normal",
                    fontFamily: textItem.fontFamily === "Courier" ? "monospace" : "sans-serif",
                  }}
                >
                  {selectedElementId === textItem.id ? (
                    <input
                      type="text"
                      value={textItem.text}
                      onChange={(e) => {
                        const updated = currentTexts.map((t) =>
                          t.id === textItem.id ? { ...t, text: e.target.value } : t
                        );
                        setTextOverlays({ ...textOverlays, [currentPageIndex]: updated });
                      }}
                      className="bg-transparent border-b border-blue-500 outline-none text-inherit text-xs"
                      autoFocus
                    />
                  ) : (
                    <span>{textItem.text}</span>
                  )}
                </div>
              ))}

              {/* Annotations (Highlights & Notes) */}
              {currentAnnotations.map((ann) => (
                <div
                  key={ann.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedElementId(ann.id!);
                    setSelectedElementType("annotation");
                  }}
                  className={`absolute rounded transition cursor-move ${
                    selectedElementId === ann.id ? "ring-2 ring-blue-500" : ""
                  }`}
                  style={{
                    left: `${ann.x}px`,
                    top: `${842 - ann.y - (ann.height || 16)}px`,
                    width: `${ann.width || 80}px`,
                    height: `${ann.height || 16}px`,
                    backgroundColor: ann.color || "#FEF08A",
                    opacity: ann.type === "highlight" ? 0.45 : 1,
                  }}
                >
                  {ann.type === "note" && (
                    <span className="text-[10px] text-amber-900 block p-1 font-medium truncate">
                      {ann.text || "Sticky Note"}
                    </span>
                  )}
                </div>
              ))}

              {/* Watermark overlay preview */}
              {enableWatermark && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-5xl font-black text-blue-500/15 uppercase tracking-widest -rotate-45 select-none">
                    {watermarkText}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

