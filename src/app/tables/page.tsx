'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import {
  Printer,
  QrCode,
  Download,
  Wifi,
  Phone,
  ShieldCheck,
  Rotate3d,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Box,
  FileText,
  Sparkles,
  Scissors,
  Palette,
} from 'lucide-react';
import { useTableSessions } from '@/hooks/useRestaurantData';
import { useAuthStore } from '@/lib/auth';
import { TableSession } from '@/types';

const DEFAULT_TABLES: TableSession[] = Array.from({ length: 12 }, (_, i) => {
  const num = i + 1;
  return {
    tableNumber: `Table ${num}`,
    guestCount: 4,
    status: 'available',
  };
});

type ViewMode = '3d_tabletop' | 'print_sheet';
type ThemeMode = 'obsidian' | 'ivory';

// Physical Card Dimensions in 3D Space (Tall, Elegant Minimalist Table Card)
const CARD_WIDTH = 300;
const CARD_HEIGHT = 560; // Taller slender proportion (similar to DL 1:1.87 hospitality format)
const CARD_THICKNESS = 14; // 14mm thick rigid board
const HALF_THICKNESS = CARD_THICKNESS / 2; // 7px

export default function TableStandeesPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();
  const { data: dbTables = [] } = useTableSessions();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/signin');
    }
  }, [user, isLoading, router]);

  const tables = useMemo(() => {
    const list = dbTables && dbTables.length > 0 ? dbTables : DEFAULT_TABLES;
    return [...list].sort((a, b) => {
      const numA = parseInt(a.tableNumber.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.tableNumber.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [dbTables]);

  const [viewMode, setViewMode] = useState<ViewMode>('3d_tabletop');
  const [themeMode, setThemeMode] = useState<ThemeMode>('obsidian');
  const [selectedTableNumber, setSelectedTableNumber] = useState<string>('Table 1');
  const [printMode, setPrintMode] = useState<'single' | 'all'>('single');

  // Wi-Fi network credentials
  const wifiSsid = 'Hasans-Guest';
  const wifiPassword = 'saffron2026';
  const [wifiQrUrl, setWifiQrUrl] = useState<string>('');

  // Table QR Code data URLs
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // 3D Orbit Camera State
  const [rotX, setRotX] = useState<number>(-4);
  const [rotY, setRotY] = useState<number>(22);
  const [zoom, setZoom] = useState<number>(1);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const viewportRef = useRef<HTMLDivElement>(null);

  const dragStartRef = useRef<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: -4,
    startRotY: 22,
  });

  // Track native browser fullscreen changes (e.g. user presses Esc)
  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (viewportRef.current?.requestFullscreen) {
        viewportRef.current.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  // Generate Wi-Fi 1-Tap Connection QR
  useEffect(() => {
    const wifiPayload = `WIFI:T:WPA;S:${wifiSsid};P:${wifiPassword};;`;
    QRCode.toDataURL(wifiPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 260,
      color: { dark: '#141210', light: '#FFFFFF' },
    })
      .then((url) => setWifiQrUrl(url))
      .catch((err) => console.error('Wi-Fi QR generation failed:', err));
  }, [wifiSsid, wifiPassword]);

  // Generate Table Ordering QR codes
  useEffect(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (!origin) return;

    let isMounted = true;
    setIsGenerating(true);

    const generateAll = async () => {
      const results: Record<string, string> = {};
      for (const t of tables) {
        const cleanTable = t.tableNumber.trim();
        const targetUrl = `${origin}/qr-scan?table=${encodeURIComponent(cleanTable)}`;
        try {
          const url = await QRCode.toDataURL(targetUrl, {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 500,
            color: { dark: '#141210', light: '#FFFFFF' },
          });
          results[cleanTable] = url;
        } catch (e) {
          console.error('QR code generation error:', e);
        }
      }
      if (isMounted) {
        setQrCodes(results);
        setIsGenerating(false);
      }
    };

    generateAll();
    return () => {
      isMounted = false;
    };
  }, [tables]);

  // Auto-rotation turntable loop
  useEffect(() => {
    if (!autoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.5) % 360);
    }, 24);
    return () => clearInterval(interval);
  }, [autoRotate, isDragging]);

  // Mouse & Touch Drag rotation handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextRotY = dragStartRef.current.startRotY + dx * 0.45;
    const nextRotX = Math.max(-50, Math.min(50, dragStartRef.current.startRotX - dy * 0.35));
    setRotY(nextRotY);
    setRotX(nextRotX);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startRotX: rotX,
        startRotY: rotY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const nextRotY = dragStartRef.current.startRotY + dx * 0.5;
    const nextRotX = Math.max(-50, Math.min(50, dragStartRef.current.startRotX - dy * 0.4));
    setRotY(nextRotY);
    setRotX(nextRotX);
  };

  const handleTouchEnd = () => setIsDragging(false);

  const activeTable = useMemo(() => {
    return tables.find((t) => t.tableNumber === selectedTableNumber) || tables[0] || DEFAULT_TABLES[0];
  }, [tables, selectedTableNumber]);

  const handlePrint = () => {
    if (viewMode !== 'print_sheet') {
      setViewMode('print_sheet');
      setTimeout(() => {
        if (typeof window !== 'undefined') window.print();
      }, 150);
    } else {
      if (typeof window !== 'undefined') window.print();
    }
  };

  const handleDownloadQR = () => {
    const qrUrl = qrCodes[activeTable.tableNumber];
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `HasansFlavors_QR_${activeTable.tableNumber.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Color Theme Variables
  const isDark = themeMode === 'obsidian';
  const cardBg = isDark ? 'bg-[#151311]' : 'bg-[#FAF8F5]';
  const cardBorder = isDark ? 'border-[#26221E]' : 'border-[#E7E2D9]';
  const textColor = isDark ? 'text-white' : 'text-[#181614]';
  const textMuted = isDark ? 'text-[#A19D98]' : 'text-[#726B63]';
  const panelSubBg = isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]';
  const panelSubBorder = isDark ? 'border-white/[0.08]' : 'border-black/[0.06]';

  // =========================================================================
  // SIDE 1: FRONT FACE — MINIMALIST HERO WITH BIGGER LOGO, FOOD & ORDER QR
  // =========================================================================
  const renderFrontFace = (tableItem: TableSession) => {
    const qrData = qrCodes[tableItem.tableNumber];

    return (
      <div className={`h-full w-full ${cardBg} ${textColor} p-6 flex flex-col justify-between relative select-none rounded-xl`}>
        {/* Top Slim Saffron Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#C25E00]" />

        {/* 1. Header: Clean Minimalist Brand Logo & Typography */}
        <div className="pt-2 text-center flex flex-col items-center">
          <div className="relative w-20 h-10 mb-1 flex items-center justify-center">
            <Image src="/logo.png" alt="Hasan's Logo" fill className="object-contain" priority />
          </div>
          <h2 className="text-lg font-black tracking-tight leading-none">
            Hasan&apos;s Flavors
          </h2>
          <p className="text-[9.5px] font-bold tracking-[0.2em] text-[#C25E00] uppercase mt-1">
            Authentic Halal Dining
          </p>
        </div>

        {/* 2. Hero Food Photograph with Clean Floating Table Tag */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden my-2 bg-[#221C18]">
          <Image
            src="/food/biryani.jpg"
            alt="Royal Dum Biryani"
            fill
            className="object-cover"
            sizes="300px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[#FFB74D] text-[10.5px] font-black uppercase tracking-wider border border-white/10">
              {tableItem.tableNumber}
            </span>
            <span className="text-[9.5px] font-semibold text-white/90">
              Dine-In
            </span>
          </div>
        </div>

        {/* 3. Center: Clean, Crisp QR Code */}
        <div className="flex flex-col items-center my-1">
          <div className="bg-white p-2.5 rounded-xl border border-[#E7E2D9] flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-lg overflow-hidden">
              {qrData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrData}
                  alt={`QR Code for ${tableItem.tableNumber}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 text-neutral-400">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#C25E00]" />
                  <span className="text-[9px]">Generating...</span>
                </div>
              )}
            </div>
          </div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider mt-1.5 flex items-center gap-1.5 opacity-90">
            <QrCode className="w-3.5 h-3.5 text-[#C25E00]" />
            <span>Scan with camera to order</span>
          </p>
        </div>

        {/* 4. Three Key Points: Clean Minimalist Bottom Block */}
        <div className={`pt-2.5 border-t ${panelSubBorder} text-left space-y-1.5 mt-auto`}>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#C25E00] text-white text-[9px] font-black flex items-center justify-center shrink-0">
              1
            </span>
            <span className={textMuted}>Scan to browse the live interactive menu</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#C25E00] text-white text-[9px] font-black flex items-center justify-center shrink-0">
              2
            </span>
            <span className={textMuted}>Select dishes &amp; customize your spice level</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#C25E00] text-white text-[9px] font-black flex items-center justify-center shrink-0">
              3
            </span>
            <span className={textMuted}>Cooked fresh &amp; served hot to this table</span>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // SIDE 2: BACK FACE — ZERO SHADOW OVERLAY, CLEAN HERO FOOD & WI-FI QR
  // =========================================================================
  const renderBackFace = (tableItem: TableSession) => {
    return (
      <div className={`h-full w-full ${cardBg} ${textColor} p-6 flex flex-col justify-between relative select-none rounded-xl`}>
        {/* Top Slim Accent Edge */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#C25E00]" />

        {/* 1. Header: 100% Halal Guarantee */}
        <div className="pt-2 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#16A34A]/15 text-[#16A34A] text-[10px] font-black tracking-wider uppercase mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Zabihah Halal Certified</span>
          </div>
          <p className="text-[9.5px] text-[#8C8780]">
            Fresh cuts • Strictly no alcohol • Prepared daily
          </p>
        </div>

        {/* 2. Food Image Spotlight (Flame-Grilled Kebabs) */}
        <div className="relative w-full h-36 rounded-xl overflow-hidden my-2 bg-[#221C18]">
          <Image
            src="/food/kabab.jpg"
            alt="Artisan Kebabs"
            fill
            className="object-cover"
            sizes="300px"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
          <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
            <span className="text-[10.5px] font-black text-[#FFB74D] uppercase tracking-wide">
              Flame-Grilled Daily
            </span>
            <span className="text-[9.5px] text-white/90 font-medium">
              Heirloom Ground Spices
            </span>
          </div>
        </div>

        {/* 3. Guest Wi-Fi Card with Small 1-Tap QR Code */}
        <div className={`${panelSubBg} rounded-xl p-3 my-1`}>
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[9.5px] font-extrabold text-[#0284C7] uppercase tracking-wider">
                <Wifi className="w-3.5 h-3.5" />
                <span>Complimentary Wi-Fi</span>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-[#8C8780]">Network (SSID)</p>
                <p className="text-xs font-black text-[#C25E00] truncate">{wifiSsid}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-[#8C8780]">Password</p>
                <p className="text-xs font-mono font-bold truncate">{wifiPassword}</p>
              </div>
            </div>

            {/* Small Wi-Fi QR Code for 1-Tap Join */}
            <div className="p-1.5 bg-white rounded-lg text-center shrink-0 border border-[#E7E2D9]">
              <div className="relative w-14 h-14 bg-white flex items-center justify-center">
                {wifiQrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={wifiQrUrl} alt="Wi-Fi QR" className="w-full h-full object-contain" />
                ) : (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0284C7]" />
                )}
              </div>
              <span className="text-[7.5px] font-black uppercase text-[#0284C7] tracking-wider block mt-0.5">
                1-Tap Join
              </span>
            </div>
          </div>
          <p className="text-[9px] text-[#8C8780] mt-2 pt-1.5 border-t border-black/5 text-center">
            Scan the small QR to join Wi-Fi immediately without manual typing.
          </p>
        </div>

        {/* 4. Floor Assistance & Hospitality Footer */}
        <div className={`pt-2.5 border-t ${panelSubBorder} flex items-center justify-between text-[10px] ${textMuted} mt-auto`}>
          <span className="flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#C25E00]" />
            <span>Floor Captain: <strong className={textColor}>+63 917 888 2345</strong></span>
          </span>
          <span className={`font-black ${textColor}`}>
            {tableItem.tableNumber}
          </span>
        </div>
      </div>
    );
  };

  // Guard unauthenticated visitors after all hooks have been called
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#FAFAFA] min-h-[calc(100vh-56px)]">
        <div className="w-6 h-6 border-2 border-[#BA1A20] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-56px)] bg-[#F8FAFC] pb-16">
      {/* ================= PRINT CSS INJECTION ================= */}
      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 8mm;
          }

          header,
          .no-print,
          nav,
          aside,
          button {
            display: none !important;
          }

          body,
          html,
          main {
            background: #ffffff !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            overflow: visible !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-area,
          .table-card-print-sheet,
          .table-card-print-sheet * {
            visibility: visible !important;
          }

          .print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .table-card-print-sheet {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
        }
      `}</style>

      {/* ================= TOP NAVIGATION BAR (NO PRINT) ================= */}
      <div className="no-print bg-white border-b border-[#E2E8F0] sticky top-14 z-30 shadow-2xs">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Title & Table Selector */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FC8019]/10 text-[#FC8019] flex items-center justify-center font-black">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-[#0F172A] tracking-tight leading-none">
                Double-Sided Table Card Studio
              </h1>
              <p className="text-[11px] text-[#64748B] mt-0.5 hidden sm:block">
                Minimalist Tabletop Card • Side 1 (Order QR) &amp; Side 2 (Wi-Fi QR)
              </p>
            </div>

            {/* Table Dropdown */}
            <div className="ml-2 flex items-center gap-1.5 bg-[#F1F5F9] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
              <span className="text-[11px] font-bold text-[#64748B]">Table:</span>
              <select
                value={selectedTableNumber}
                onChange={(e) => setSelectedTableNumber(e.target.value)}
                className="bg-transparent text-xs font-black text-[#0F172A] focus:outline-none cursor-pointer"
              >
                {tables.map((t) => (
                  <option key={t.tableNumber} value={t.tableNumber}>
                    {t.tableNumber} {t.status === 'occupied' ? '(Occupied)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* View Switcher: 3D Simulator vs 2D Print */}
          <div className="flex items-center gap-2">
            {/* Color Palette Toggle: Obsidian vs Ivory */}
            <div className="hidden md:flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0] text-xs">
              <button
                onClick={() => setThemeMode('obsidian')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${themeMode === 'obsidian'
                    ? 'bg-[#181614] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#181614] border border-white/20" />
                <span>Obsidian</span>
              </button>
              <button
                onClick={() => setThemeMode('ivory')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${themeMode === 'ivory'
                    ? 'bg-white text-[#181614] shadow-2xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#FAF8F5] border border-black/20" />
                <span>Ivory</span>
              </button>
            </div>

            <div className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#E2E8F0]">
              <button
                onClick={() => setViewMode('3d_tabletop')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === '3d_tabletop'
                    ? 'bg-white text-[#FC8019] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
              >
                <Rotate3d className="w-3.5 h-3.5" />
                <span>3D Card View</span>
              </button>
              <button
                onClick={() => setViewMode('print_sheet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === 'print_sheet'
                    ? 'bg-white text-[#0F172A] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Print Both Sides</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadQR}
              className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] text-xs font-bold text-[#0F172A] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download High-Res QR PNG"
            >
              <Download className="w-3.5 h-3.5 text-[#64748B]" />
              <span className="hidden md:inline">Download QR</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-[#FC8019] hover:bg-[#E57212] text-white text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-6">
        {viewMode === '3d_tabletop' ? (
          /* =========================================================================
             3D CLEAN MINIMALIST TABLETOP CARD (ZERO BLACK SHADOW OVERLAY)
             Pure, bright modern gallery studio backdrop with realistic 3D thickness
             ========================================================================= */
          <div className="space-y-4">
            {/* Camera Presets Toolbar */}
            <div className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#0F172A]">Camera Angles:</span>
                <button
                  onClick={() => {
                    setRotX(-4);
                    setRotY(0);
                  }}
                  className={`px-3 py-1 rounded-md font-bold text-[11px] border transition-colors cursor-pointer ${Math.round(rotY) % 360 === 0
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:bg-white'
                    }`}
                >
                  Side 1: Order QR
                </button>
                <button
                  onClick={() => {
                    setRotX(-4);
                    setRotY(180);
                  }}
                  className={`px-3 py-1 rounded-md font-bold text-[11px] border transition-colors cursor-pointer ${Math.round(rotY) % 360 === 180
                      ? 'bg-[#0F172A] text-white border-[#0F172A]'
                      : 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0] hover:bg-white'
                    }`}
                >
                  Side 2: Wi-Fi QR
                </button>
                <button
                  onClick={() => {
                    setRotX(-8);
                    setRotY(32);
                  }}
                  className="px-3 py-1 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-md font-bold text-[#0F172A] text-[11px] transition-colors cursor-pointer"
                >
                  3D Perspective
                </button>
                <button
                  onClick={() => {
                    setRotX(-4);
                    setRotY(90);
                  }}
                  className="px-3 py-1 bg-[#F8FAFC] hover:bg-white border border-[#E2E8F0] rounded-md font-bold text-[#0F172A] text-[11px] transition-colors cursor-pointer"
                >
                  Card Edge (14mm)
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Turntable Auto Spin */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${autoRotate
                      ? 'bg-[#FC8019] text-white border-[#FC8019]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:text-[#0F172A]'
                    }`}
                >
                  <RefreshCw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} />
                  <span>{autoRotate ? 'Auto-Rotating' : 'Auto-Spin 360°'}</span>
                </button>

                {/* Zoom Steppers */}
                <div className="flex items-center gap-1 pl-2 border-l border-[#E2E8F0]">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.65, z - 0.1))}
                    className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-mono text-[#64748B] w-9 text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.3, z + 0.1))}
                    className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setRotX(-4);
                      setRotY(22);
                      setZoom(1);
                    }}
                    className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    title="Reset Camera Angles"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D View'}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3D Scene Viewport: Clean Minimalist Studio Backdrop (ZERO BLACK SHADOW OVERLAYS) */}
            <div
              ref={viewportRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`relative w-full ${
                isFullscreen
                  ? 'fixed inset-0 z-50 w-screen h-screen rounded-none'
                  : 'h-[680px] rounded-2xl'
              } border border-[#E2E8F0] select-none transition-cursor ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                // Bright, clean modern gallery lighting (soft pure studio surface)
                background:
                  'radial-gradient(ellipse at 50% 35%, #FFFFFF 0%, #F1F5F9 60%, #E2E8F0 100%)',
              }}
            >
              {/* Floating Exit Fullscreen Button */}
              {isFullscreen && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md cursor-pointer pointer-events-auto transition-all"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen (Esc)</span>
                </button>
              )}
              {/* Natural Soft Ground Contact Shadow */}
              <div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[340px] h-[120px] rounded-full pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, rgba(15,23,42,0.1) 0%, rgba(15,23,42,0.02) 50%, transparent 70%)',
                  transform: 'rotateX(75deg)',
                }}
              />

              {/* 3D Perspective Root */}
              <div
                className="w-full h-full flex items-center justify-center pointer-events-none"
                style={{ perspective: 1200 }}
              >
                {/* 3D World Transformation Node */}
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                    width: `${CARD_WIDTH}px`,
                    height: `${CARD_HEIGHT}px`,
                    position: 'relative',
                  }}
                >
                  {/* Clean Minimalist White/Acrylic Card Slot Stand */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-8px',
                      left: '50%',
                      width: '180px',
                      height: '16px',
                      marginLeft: '-90px',
                      transformStyle: 'preserve-3d',
                      transform: 'translateZ(0px)',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: '#FFFFFF',
                        borderRadius: '6px',
                        border: '1px solid #CBD5E1',
                        boxShadow: '0 4px 12px rgba(15,23,42,0.06)',
                      }}
                    >
                      <div className="w-28 h-1 bg-[#CBD5E1] rounded-full mx-auto mt-1.5" />
                    </div>
                  </div>

                  {/* ==============================================================
                      FACE 1: FRONT FACE (Side 1: Dine-in Ordering QR)
                      translateZ(+HALF_THICKNESS) — Clean, NO OVERFLOW HIDDEN ON 3D PARENT
                      ============================================================== */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${CARD_WIDTH}px`,
                      height: `${CARD_HEIGHT}px`,
                      transform: `translateZ(${HALF_THICKNESS}px)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className={`rounded-xl border ${cardBorder} shadow-lg`}
                  >
                    {renderFrontFace(activeTable)}
                  </div>

                  {/* ==============================================================
                      FACE 2: BACK FACE (Side 2: Wi-Fi QR & Floor Service)
                      rotateY(180deg) translateZ(+HALF_THICKNESS) — NO SHADOW OVERLAY
                      ============================================================== */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${CARD_WIDTH}px`,
                      height: `${CARD_HEIGHT}px`,
                      transform: `rotateY(180deg) translateZ(${HALF_THICKNESS}px)`,
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className={`rounded-xl border ${cardBorder} shadow-lg`}
                  >
                    {renderBackFace(activeTable)}
                  </div>

                  {/* ==============================================================
                      EDGE 3: RIGHT SIDE EDGE (Thickness Wall)
                      ============================================================== */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      bottom: '6px',
                      right: `-${HALF_THICKNESS}px`,
                      width: `${CARD_THICKNESS}px`,
                      transform: 'rotateY(90deg)',
                      backgroundColor: isDark ? '#221D1A' : '#EDE8DF',
                      borderTop: '1px solid #C25E00',
                      borderBottom: isDark ? '1px solid #141210' : '1px solid #D4CEBF',
                    }}
                  />

                  {/* ==============================================================
                      EDGE 4: LEFT SIDE EDGE (Thickness Wall)
                      ============================================================== */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      bottom: '6px',
                      left: `-${HALF_THICKNESS}px`,
                      width: `${CARD_THICKNESS}px`,
                      transform: 'rotateY(-90deg)',
                      backgroundColor: isDark ? '#221D1A' : '#EDE8DF',
                      borderTop: '1px solid #C25E00',
                      borderBottom: isDark ? '1px solid #141210' : '1px solid #D4CEBF',
                    }}
                  />

                  {/* ==============================================================
                      EDGE 5: TOP EDGE (Thickness Wall with Saffron Accent)
                      ============================================================== */}
                  <div
                    style={{
                      position: 'absolute',
                      top: `-${HALF_THICKNESS}px`,
                      left: '6px',
                      right: '6px',
                      height: `${CARD_THICKNESS}px`,
                      transform: 'rotateX(90deg)',
                      backgroundColor: '#C25E00',
                    }}
                  />

                  {/* ==============================================================
                      EDGE 6: BOTTOM BASE EDGE
                      ============================================================== */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `-${HALF_THICKNESS}px`,
                      left: '6px',
                      right: '6px',
                      height: `${CARD_THICKNESS}px`,
                      transform: 'rotateX(-90deg)',
                      backgroundColor: isDark ? '#141210' : '#D4CEBF',
                    }}
                  />
                </div>
              </div>

              {/* Floating Instructions Tag */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md text-[#0F172A] text-[11px] font-mono flex items-center gap-2 border border-[#CBD5E1] shadow-xs">
                  <Rotate3d className="w-3.5 h-3.5 text-[#FC8019]" />
                  <span>
                    Click &amp; drag anywhere to rotate 360° • Both Sides &amp; 14mm Rigid Card
                  </span>
                </div>

                <button
                  onClick={() => setViewMode('print_sheet')}
                  className="pointer-events-auto px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#F8FAFC] text-[#0F172A] text-xs font-black shadow-md border border-[#E2E8F0] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-[#FC8019]" />
                  <span>Switch to 2D Print Layout</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             2D FLAT PRINT SHEET (BOTH SIDES: FRONT & BACK SIDE-BY-SIDE)
             Minimalist 2-sided print layout with cutting markers
             ========================================================================= */
          <div className="space-y-6">
            <div className="no-print bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Scissors className="w-4 h-4 text-[#FC8019] shrink-0" />
                <span className="text-[#475569]">
                  <strong>Print Instructions:</strong> Print both Side 1 (Front) and Side 2 (Back) on heavy cardstock or photo paper. Cut along the borders and place into your tabletop acrylic stands or wooden card holders.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintMode(printMode === 'single' ? 'all' : 'single')}
                  className="px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded-lg font-bold text-xs text-[#0F172A] cursor-pointer"
                >
                  Mode: {printMode === 'single' ? `Single (${activeTable.tableNumber})` : `All ${tables.length} Tables`}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 bg-[#FC8019] text-white rounded-lg font-black text-xs shadow-xs hover:bg-[#E57212] cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Both Sides</span>
                </button>
              </div>
            </div>

            {/* Clean Minimalist Print Sheet Container */}
            <div className="print-area space-y-8">
              {(printMode === 'single' ? [activeTable] : tables).map((tableItem) => (
                <div
                  key={tableItem.tableNumber}
                  className="table-card-print-sheet bg-white border border-[#E2E8F0] rounded-2xl shadow-xs p-6 mx-auto max-w-[680px] print:max-w-none print:border-none print:shadow-none print:p-0 print:m-0"
                  style={{
                    pageBreakAfter: 'always',
                    breakAfter: 'page',
                  }}
                >
                  {/* Subtle Clean Meta Header (Hidden in Print) */}
                  <div className="no-print flex items-center justify-between pb-3 mb-4 border-b border-[#F1F5F9] text-[11px] text-[#94A3B8] font-mono">
                    <span>Hasan&apos;s Flavors • Double-Sided Standee</span>
                    <span className="font-bold text-[#1E293B]">
                      {tableItem.tableNumber}
                    </span>
                    <span>Side 1 (Front) &amp; Side 2 (Back)</span>
                  </div>

                  {/* 2 Sides Side by Side with Clean Separation */}
                  <div className="grid grid-cols-2 gap-5 relative">
                    {/* Center Cut / Fold Dashed Line */}
                    <div className="hidden sm:block absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-[#CBD5E1] pointer-events-none z-10" />

                    {/* Side 1: Front Face */}
                    <div className="h-[540px] rounded-xl overflow-hidden border border-[#E5E5E5] shadow-xs print:shadow-none">
                      {renderFrontFace(tableItem)}
                    </div>

                    {/* Side 2: Back Face */}
                    <div className="h-[540px] rounded-xl overflow-hidden border border-[#E5E5E5] shadow-xs print:shadow-none">
                      {renderBackFace(tableItem)}
                    </div>
                  </div>

                  {/* Minimalist Cutting & Folding Guide */}
                  <div className="pt-3 mt-4 text-center text-[10px] text-[#94A3B8] font-mono flex items-center justify-center gap-2">
                    <Scissors className="w-3 h-3 text-[#CBD5E1]" />
                    <span>[ SIDE 1: FRONT (ORDER QR) ] &lt;--- CUT OR FOLD HERE ---&gt; [ SIDE 2: BACK (WI-FI QR) ]</span>
                    <Scissors className="w-3 h-3 text-[#CBD5E1] rotate-180" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
