import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Printer,
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  Check,
  X,
  Eye,
  Loader2,
  Package,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  Download,
  ExternalLink,
  Sparkles,
  Usb,
  Radio,
  Unplug,
  Zap
} from 'lucide-react';

export type ThermalPaperWidth = 58 | 70 | 80;

export interface BluetoothWaybillPrinterProps {
  addressType: 'R' | 'J';
  recipientName: string;
  phone: string;
  zonecode: string;
  primaryAddress: string;
  secondaryReferenceAddress?: string;
  detailAddress: string;
  bname: string;
  deliveryMemo: string;
  onNotify: (msg: string) => void;
}

// Dot width for standard 203 DPI (8 dots/mm) thermal printers
const PAPER_SPEC: Record<
  ThermalPaperWidth,
  {
    widthMm: ThermalPaperWidth;
    dotsWidth: number;
    previewWidthPx: number;
    labelKhmer: string;
    descKhmer: string;
  }
> = {
  58: {
    widthMm: 58,
    dotsWidth: 384,
    previewWidthPx: 290,
    labelKhmer: '58mm',
    descKhmer: 'ខ្នាតតូច (384 dots · ម៉ាស៊ីនព្រីនចល័តខ្នាតតូច)'
  },
  70: {
    widthMm: 70,
    dotsWidth: 512,
    previewWidthPx: 350,
    labelKhmer: '70mm',
    descKhmer: 'ខ្នាតកណ្តាល (512 dots · ស្លាកបិទកញ្ចប់ឥវ៉ាន់ 택배)'
  },
  80: {
    widthMm: 80,
    dotsWidth: 576,
    previewWidthPx: 400,
    labelKhmer: '80mm',
    descKhmer: 'ខ្នាតធំស្តង់ដារ (576 dots · ស្លាកវិក្កយបត្រ 우체국 ពេញ)'
  }
};

// Comprehensive list of real-world Bluetooth Thermal Printer GATT Service UUIDs
// Covers Xprinter, Rongta, Gprinter, HPRT, Deli, Sewoo, Bixolon, Star, Epson, Goojprt, MTP-II/III, PT-210, NiiMbot, Phomemo, Cat/GB01
const REAL_PRINTER_SERVICE_UUIDS: Array<string | number> = [
  0x18f0,
  0xff00,
  0xffe0,
  0xfee7,
  0xae30,
  0xff01,
  0xff02,
  0xff10,
  0xfff0,
  0x1800,
  0x1801,
  0x180a,
  0x180f,
  0x1101,
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ffe0-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000fff0-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '6e400001-b5a3-f393-e0a9-e50e24dcca9e', // Nordic UART Service (used by many BLE printers)
  '00001101-0000-1000-8000-00805f9b34fb', // SPP UUID over BLE
  '0000af30-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f'
];

interface WebBluetoothCharacteristic {
  uuid?: string;
  properties?: {
    write?: boolean;
    writeWithoutResponse?: boolean;
  };
  writeValue?: (value: BufferSource) => Promise<void>;
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
}

interface WebBluetoothDevice {
  id?: string;
  name?: string;
  addEventListener?: (type: string, listener: () => void) => void;
  gatt?: {
    connected?: boolean;
    connect: () => Promise<{
      getPrimaryServices: () => Promise<
        Array<{
          uuid?: string;
          getCharacteristics: () => Promise<WebBluetoothCharacteristic[]>;
        }>
      >;
    }>;
    disconnect?: () => void;
  };
}

interface WebSerialPort {
  open: (options: { baudRate: number }) => Promise<void>;
  close?: () => Promise<void>;
  writable?: {
    getWriter: () => {
      write: (chunk: Uint8Array) => Promise<void>;
      releaseLock: () => void;
    };
  };
}

interface WebUsbDevice {
  productName?: string;
  manufacturerName?: string;
  configuration?: {
    interfaces: Array<{
      interfaceNumber: number;
      alternates: Array<{
        endpoints: Array<{
          direction: string;
          endpointNumber: number;
        }>;
      }>;
    }>;
  };
  open: () => Promise<void>;
  selectConfiguration: (configValue: number) => Promise<void>;
  claimInterface: (interfaceNumber: number) => Promise<void>;
  transferOut: (endpointNumber: number, data: BufferSource) => Promise<unknown>;
  close?: () => Promise<void>;
}

interface RealHardwareConnection {
  type: 'ble' | 'serial' | 'usb';
  name: string;
  details: string;
}

/**
 * Renders the Korea Post waybill onto an HTML5 Canvas at exact 203-DPI thermal width (384 / 512 / 576 dots)
 * and builds a Banded ESC/POS Raster Bitmap (`GS v 0` in 24-dot horizontal slices).
 * Slicing into 24-dot bands prevents receive buffer overflow on real 58mm/70mm/80mm Bluetooth thermal printers!
 */
function renderThermalWaybillAndBandedEscPos(
  dotsWidth: number,
  widthMm: ThermalPaperWidth,
  data: {
    addressType: 'R' | 'J';
    recipientName: string;
    phone: string;
    zonecode: string;
    primaryAddress: string;
    secondaryReferenceAddress?: string;
    detailAddress: string;
    bname: string;
    deliveryMemo: string;
  }
): { pngDataUrl: string; escPosBands: Uint8Array[]; totalBytes: number } {
  const canvas = document.createElement('canvas');
  const scaleFactor = dotsWidth / 384;
  const padding = Math.round(16 * scaleFactor);
  const contentWidth = dotsWidth - padding * 2;

  canvas.width = dotsWidth;
  canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      pngDataUrl: '',
      escPosBands: [new Uint8Array([0x1b, 0x40])],
      totalBytes: 2
    };
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#000000';
  ctx.strokeStyle = '#000000';
  ctx.textBaseline = 'top';

  const wrapText = (text: string, font: string, maxWidth: number): string[] => {
    ctx.font = font;
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines.length > 0 ? lines : [''];
  };

  let y = padding;

  // Top thick border
  ctx.lineWidth = Math.max(2, Math.round(3 * scaleFactor));
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(dotsWidth - padding, y);
  ctx.stroke();
  y += Math.round(10 * scaleFactor);

  // Header: 우체국 택배 · KOREA POST + Paper Width
  ctx.font = `900 ${Math.round(19 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
  ctx.fillText(`우체국 택배 · ${widthMm}mm`, padding, y);

  // Right-aligned 5-digit Zonecode
  const zipStr = data.zonecode || '-----';
  ctx.font = `900 ${Math.round(23 * scaleFactor)}px monospace`;
  const zipWidth = ctx.measureText(zipStr).width;
  ctx.fillText(zipStr, dotsWidth - padding - zipWidth, y - Math.round(2 * scaleFactor));
  y += Math.round(28 * scaleFactor);

  // Header solid divider
  ctx.lineWidth = Math.max(2, Math.round(2.5 * scaleFactor));
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(dotsWidth - padding, y);
  ctx.stroke();
  y += Math.round(10 * scaleFactor);

  // Recipient Section Label
  ctx.font = `700 ${Math.round(12 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
  ctx.fillText('받는분 / 연락처 (អ្នកទទួលឥវ៉ាន់)', padding, y);
  y += Math.round(18 * scaleFactor);

  // Recipient Name
  const recFont = `800 ${Math.round(18 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
  const recLines = wrapText(data.recipientName || 'មិនទាន់បញ្ចូលឈ្មោះ', recFont, contentWidth);
  ctx.font = recFont;
  for (const line of recLines) {
    ctx.fillText(line, padding, y);
    y += Math.round(23 * scaleFactor);
  }

  // Phone Number
  ctx.font = `700 ${Math.round(16 * scaleFactor)}px monospace`;
  ctx.fillText(data.phone || '010-XXXX-XXXX', padding, y);
  y += Math.round(24 * scaleFactor);

  // Dashed Divider
  ctx.save();
  ctx.setLineDash([Math.round(5 * scaleFactor), Math.round(4 * scaleFactor)]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(dotsWidth - padding, y);
  ctx.stroke();
  ctx.restore();
  y += Math.round(10 * scaleFactor);

  // Address Section Label
  ctx.font = `700 ${Math.round(12 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
  ctx.fillText(
    data.addressType === 'R'
      ? '도로명주소 (អាសយដ្ឋានឈ្មោះផ្លូវ)'
      : '지번주소 (អាសយដ្ឋានភូមិ/សង្កាត់)',
    padding,
    y
  );
  y += Math.round(18 * scaleFactor);

  // Full Address + Detail
  const fullAddrText = [
    data.primaryAddress,
    data.detailAddress,
    data.addressType === 'R' && data.bname ? `(${data.bname})` : ''
  ]
    .filter(Boolean)
    .join(' ');

  const addrFont = `800 ${Math.round(18 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
  const addrLines = wrapText(
    fullAddrText || 'មិនទាន់ជ្រើសរើសអាសយដ្ឋាន',
    addrFont,
    contentWidth
  );
  ctx.font = addrFont;
  for (const line of addrLines) {
    ctx.fillText(line, padding, y);
    y += Math.round(24 * scaleFactor);
  }

  // Secondary Reference Address
  if (data.secondaryReferenceAddress) {
    y += Math.round(2 * scaleFactor);
    const refFont = `600 ${Math.round(12.5 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
    const refLines = wrapText(`참고: ${data.secondaryReferenceAddress}`, refFont, contentWidth);
    ctx.font = refFont;
    for (const line of refLines) {
      ctx.fillText(line, padding, y);
      y += Math.round(17 * scaleFactor);
    }
  }
  y += Math.round(6 * scaleFactor);

  // Delivery Memo if present
  if (data.deliveryMemo) {
    ctx.save();
    ctx.setLineDash([Math.round(5 * scaleFactor), Math.round(4 * scaleFactor)]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(dotsWidth - padding, y);
    ctx.stroke();
    ctx.restore();
    y += Math.round(10 * scaleFactor);

    ctx.font = `700 ${Math.round(12 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
    ctx.fillText('배송메시지 (ចំណាំដឹកជញ្ជូន)', padding, y);
    y += Math.round(17 * scaleFactor);

    const memoFont = `700 ${Math.round(14.5 * scaleFactor)}px "Noto Sans KR", "Kantumruy Pro", sans-serif`;
    const memoLines = wrapText(data.deliveryMemo, memoFont, contentWidth);
    ctx.font = memoFont;
    for (const line of memoLines) {
      ctx.fillText(line, padding, y);
      y += Math.round(20 * scaleFactor);
    }
    y += Math.round(4 * scaleFactor);
  }

  // Dashed Divider before Barcode
  ctx.save();
  ctx.setLineDash([Math.round(5 * scaleFactor), Math.round(4 * scaleFactor)]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(dotsWidth - padding, y);
  ctx.stroke();
  ctx.restore();
  y += Math.round(12 * scaleFactor);

  // Barcode Bars
  const barHeight = Math.round(36 * scaleFactor);
  const seedStr = `KPOST${data.zonecode || '00000'}${widthMm}`;
  let barX = padding + Math.round(12 * scaleFactor);
  const maxBarX = dotsWidth - padding - Math.round(12 * scaleFactor);
  let idxBar = 0;
  while (barX < maxBarX) {
    const code = seedStr.charCodeAt(idxBar % seedStr.length);
    const barW = Math.max(2, Math.round((((idxBar + code) % 3) + 1.5) * scaleFactor));
    const gapW = Math.max(2, Math.round((((idxBar * 3 + code) % 2) + 1.5) * scaleFactor));
    if (barX + barW <= maxBarX) {
      ctx.fillRect(barX, y, barW, barHeight);
    }
    barX += barW + gapW;
    idxBar++;
  }
  y += barHeight + Math.round(8 * scaleFactor);

  // Barcode Text
  const barcodeCodeText = `KPOST-${data.zonecode || '00000'}-${widthMm}MM`;
  ctx.font = `700 ${Math.round(12 * scaleFactor)}px monospace`;
  const bcTextWidth = ctx.measureText(barcodeCodeText).width;
  ctx.fillText(barcodeCodeText, (dotsWidth - bcTextWidth) / 2, y);
  y += Math.round(20 * scaleFactor);

  // Bottom thick border
  ctx.lineWidth = Math.max(2, Math.round(3 * scaleFactor));
  ctx.beginPath();
  ctx.moveTo(padding, y);
  ctx.lineTo(dotsWidth - padding, y);
  ctx.stroke();
  y += padding;

  const finalHeight = Math.min(canvas.height, y);

  // Crop canvas to exact content height
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = dotsWidth;
  croppedCanvas.height = finalHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (croppedCtx) {
    croppedCtx.drawImage(canvas, 0, 0, dotsWidth, finalHeight, 0, 0, dotsWidth, finalHeight);
  }

  const pngDataUrl = croppedCanvas.toDataURL('image/png');
  const imgData = (croppedCtx || ctx).getImageData(0, 0, dotsWidth, finalHeight);
  const pixels = imgData.data;

  // Convert RGBA to 1-bit monochrome bytes
  const bytesPerRow = Math.ceil(dotsWidth / 8);
  const fullBitmap = new Uint8Array(bytesPerRow * finalHeight);

  for (let row = 0; row < finalHeight; row++) {
    for (let col = 0; col < dotsWidth; col++) {
      const idx = (row * dotsWidth + col) * 4;
      const luminance = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
      if (luminance < 165) {
        const byteIndex = row * bytesPerRow + (col >> 3);
        const bitOffset = 7 - (col & 7);
        fullBitmap[byteIndex] |= 1 << bitOffset;
      }
    }
  }

  // Build Banded ESC/POS Commands (24 rows per GS v 0 band to avoid printer buffer overflow)
  const escPosBands: Uint8Array[] = [];
  let totalBytes = 0;

  // 1. Initialize Printer (ESC @) + Left Align (ESC a 0)
  const initCmd = new Uint8Array([0x1b, 0x40, 0x1b, 0x61, 0x00]);
  escPosBands.push(initCmd);
  totalBytes += initCmd.length;

  const bandRows = 24;
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;

  for (let startRow = 0; startRow < finalHeight; startRow += bandRows) {
    const rowsInBand = Math.min(bandRows, finalHeight - startRow);
    const yL = rowsInBand & 0xff;
    const yH = (rowsInBand >> 8) & 0xff;

    const bandHeader = new Uint8Array([0x1d, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
    const bandSlice = fullBitmap.slice(
      startRow * bytesPerRow,
      (startRow + rowsInBand) * bytesPerRow
    );

    const bandPacket = new Uint8Array(bandHeader.length + bandSlice.length);
    bandPacket.set(bandHeader, 0);
    bandPacket.set(bandSlice, bandHeader.length);

    escPosBands.push(bandPacket);
    totalBytes += bandPacket.length;
  }

  // 3. Feed 4 lines (ESC d 4) + Partial Cut (GS V 66 0)
  const footerCmd = new Uint8Array([0x1b, 0x64, 0x04, 0x1d, 0x56, 0x42, 0x00]);
  escPosBands.push(footerCmd);
  totalBytes += footerCmd.length;

  return { pngDataUrl, escPosBands, totalBytes };
}

export const BluetoothWaybillPrinter: React.FC<BluetoothWaybillPrinterProps> = ({
  addressType,
  recipientName,
  phone,
  zonecode,
  primaryAddress,
  secondaryReferenceAddress,
  detailAddress,
  bname,
  deliveryMemo,
  onNotify
}) => {
  const [paperWidth, setPaperWidth] = useState<ThermalPaperWidth>(() => {
    try {
      const saved = Number(localStorage.getItem('kpost_khmer_print_width_mm'));
      if (saved === 58 || saved === 70 || saved === 80) return saved;
    } catch {
      // Ignore storage error
    }
    return 70;
  });

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('bt_mode=1')) {
      return true;
    }
    return false;
  });

  // Real Connected Hardware State (Strictly real physical connection — zero mock devices)
  const [hardwareConn, setHardwareConn] = useState<RealHardwareConnection | null>(null);
  const [isScanningHardware, setIsScanningHardware] = useState<boolean>(false);
  const [serialBaudRate, setSerialBaudRate] = useState<number>(9600);
  const [iframeBlockedNotice, setIframeBlockedNotice] = useState<boolean>(false);
  const [hardwareErrorMsg, setHardwareErrorMsg] = useState<string | null>(null);

  const [isPrintingBt, setIsPrintingBt] = useState<boolean>(false);
  const [printProgress, setPrintProgress] = useState<number>(0);
  const [lastPrintSuccess, setLastPrintSuccess] = useState<{
    printerName: string;
    widthMm: ThermalPaperWidth;
    printedAt: string;
  } | null>(null);

  // References to Real Browser Hardware Objects
  const bleDeviceRef = useRef<WebBluetoothDevice | null>(null);
  const bleCharRef = useRef<WebBluetoothCharacteristic | null>(null);
  const serialPortRef = useRef<WebSerialPort | null>(null);
  const usbDeviceRef = useRef<{ device: WebUsbDevice; endpointNumber: number } | null>(null);

  const isRunningInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const handleSelectPaperWidth = (width: ThermalPaperWidth) => {
    setPaperWidth(width);
    try {
      localStorage.setItem('kpost_khmer_print_width_mm', String(width));
    } catch {
      // Ignore storage error
    }
  };

  // Disconnect active real hardware printer
  const handleDisconnectHardware = useCallback(async () => {
    try {
      if (bleDeviceRef.current?.gatt?.connected && bleDeviceRef.current.gatt.disconnect) {
        bleDeviceRef.current.gatt.disconnect();
      }
      if (serialPortRef.current?.close) {
        await serialPortRef.current.close();
      }
      if (usbDeviceRef.current?.device.close) {
        await usbDeviceRef.current.device.close();
      }
    } catch {
      // Ignore disconnect errors
    } finally {
      bleDeviceRef.current = null;
      bleCharRef.current = null;
      serialPortRef.current = null;
      usbDeviceRef.current = null;
      setHardwareConn(null);
      onNotify('បានផ្តាច់ការភ្ជាប់ម៉ាស៊ីនព្រីនរួចរាល់');
    }
  }, [onNotify]);

  // 1. REAL Web Bluetooth API (BLE) Scanner (`navigator.bluetooth.requestDevice`)
  const scanAndConnectRealBlePrinter = useCallback(async (): Promise<boolean> => {
    setHardwareErrorMsg(null);
    setIframeBlockedNotice(false);

    const nav = navigator as unknown as {
      bluetooth?: {
        requestDevice: (options: Record<string, unknown>) => Promise<WebBluetoothDevice>;
      };
    };

    if (!nav.bluetooth) {
      setHardwareErrorMsg(
        'កម្មវិធីរុករក (Browser) នេះមិនគាំទ្រ Web Bluetooth ទេ។ សូមប្រើ Google Chrome ឬ Microsoft Edge ឬភ្ជាប់តាម Bluetooth Serial (COM/SPP)។'
      );
      return false;
    }

    setIsScanningHardware(true);
    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: REAL_PRINTER_SERVICE_UUIDS
      });

      if (!device.gatt) {
        throw new Error('ឧបករណ៍ Bluetooth នេះមិនគាំទ្រ GATT Server ទេ។');
      }

      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();

      let writableChar: WebBluetoothCharacteristic | null = null;
      let matchedServiceUuid = '';

      // Prefer writeWithoutResponse for fast thermal raster streaming, fallback to write
      for (const service of services) {
        try {
          const characteristics = await service.getCharacteristics();
          for (const char of characteristics) {
            if (char.properties?.writeWithoutResponse || char.properties?.write) {
              writableChar = char;
              matchedServiceUuid = service.uuid || 'GATT';
              if (char.properties?.writeWithoutResponse) break;
            }
          }
          if (writableChar?.properties?.writeWithoutResponse) break;
        } catch {
          // Continue checking next service
        }
      }

      if (!writableChar) {
        throw new Error(
          'បានភ្ជាប់ឧបករណ៍ ប៉ុន្តែរកមិនឃើញ Characteristic សម្រាប់បញ្ជូនទិន្នន័យព្រីន (Write) ទេ។ ប្រសិនបើម៉ាស៊ីនព្រីនជាប្រភេទ Bluetooth Classic សូមចុច «ស្កេន Bluetooth SPP (COM Port)»។'
        );
      }

      // Listen for physical printer disconnect
      device.addEventListener?.('gattserverdisconnected', () => {
        bleCharRef.current = null;
        setHardwareConn(null);
      });

      bleDeviceRef.current = device;
      bleCharRef.current = writableChar;
      serialPortRef.current = null;
      usbDeviceRef.current = null;

      const realName = device.name || `BLE Printer (${device.id?.slice(0, 6) || 'Connected'})`;
      setHardwareConn({
        type: 'ble',
        name: realName,
        details: `Web Bluetooth BLE · Service: ${matchedServiceUuid.slice(0, 8)}`
      });

      onNotify(`បានស្កេន និងភ្ជាប់ម៉ាស៊ីនព្រីនពិតប្រាកដ "${realName}" ដោយជោគជ័យ!`);
      return true;
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : String(err);

      // Ignore user closing the native chooser without picking
      if (
        errName === 'NotFoundError' ||
        errMsg.toLowerCase().includes('cancelled') ||
        errMsg.toLowerCase().includes('canceled')
      ) {
        return false;
      }

      // Detect iframe Permissions Policy restriction in AI Studio Preview
      if (
        errName === 'SecurityError' ||
        errMsg.toLowerCase().includes('permissions policy') ||
        errMsg.toLowerCase().includes('cross-origin') ||
        errMsg.toLowerCase().includes('disallowed') ||
        isRunningInIframe
      ) {
        setIframeBlockedNotice(true);
        setHardwareErrorMsg(
          'ផ្ទាំង Preview Iframe ត្រូវបានរាំងស្ទះសិទ្ធិ Hardware Bluetooth ដោយ Browser។ សូមចុចប៊ូតុង «បើកផ្ទាំងពេញអេក្រង់ដើម្បីស្កេន Bluetooth ពិតប្រាកដ» ខាងក្រោម ដើម្បីឱ្យ Chrome បង្ហាញបញ្ជីឈ្មោះម៉ាស៊ីនព្រីន Bluetooth ពិតប្រាកដរបស់អ្នកភ្លាមៗ!'
        );
        return false;
      }

      setHardwareErrorMsg(`បញ្ហាភ្ជាប់ Bluetooth: ${errMsg}`);
      return false;
    } finally {
      setIsScanningHardware(false);
    }
  }, [isRunningInIframe, onNotify]);

  // 2. REAL Web Serial API Scanner (`navigator.serial.requestPort`) for Bluetooth Classic SPP / COM Port Printers
  const scanAndConnectRealSerialPrinter = useCallback(async (): Promise<boolean> => {
    setHardwareErrorMsg(null);
    setIframeBlockedNotice(false);

    const nav = navigator as unknown as {
      serial?: {
        requestPort: () => Promise<WebSerialPort>;
      };
    };

    if (!nav.serial) {
      setHardwareErrorMsg(
        'Browser នេះមិនគាំទ្រ Web Serial (SPP/COM) ទេ។ សូមប្រើ Chrome ឬ Edge នៅលើកុំព្យូទ័រ។'
      );
      return false;
    }

    setIsScanningHardware(true);
    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: serialBaudRate });

      serialPortRef.current = port;
      bleDeviceRef.current = null;
      bleCharRef.current = null;
      usbDeviceRef.current = null;

      const realName = `Bluetooth SPP / Serial Printer (${serialBaudRate} baud)`;
      setHardwareConn({
        type: 'serial',
        name: realName,
        details: `Web Serial COM Port · Baud ${serialBaudRate}`
      });

      onNotify(`បានភ្ជាប់ម៉ាស៊ីនព្រីនពិតប្រាកដតាម Bluetooth Serial (${serialBaudRate} baud) ជោគជ័យ!`);
      return true;
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : String(err);

      if (
        errName === 'NotFoundError' ||
        errMsg.toLowerCase().includes('no port selected') ||
        errMsg.toLowerCase().includes('cancelled')
      ) {
        return false;
      }

      if (
        errName === 'SecurityError' ||
        errMsg.toLowerCase().includes('permissions policy') ||
        errMsg.toLowerCase().includes('disallowed') ||
        isRunningInIframe
      ) {
        setIframeBlockedNotice(true);
        setHardwareErrorMsg(
          'ផ្ទាំង Preview Iframe ត្រូវបានរាំងស្ទះសិទ្ធិ Serial Port ដោយ Browser។ សូមចុចប៊ូតុង «បើកផ្ទាំងពេញអេក្រង់ដើម្បីស្កេន Bluetooth ពិតប្រាកដ» ខាងក្រោម!'
        );
        return false;
      }

      setHardwareErrorMsg(`មិនអាចបើក Serial Port បានទេ៖ ${errMsg}`);
      return false;
    } finally {
      setIsScanningHardware(false);
    }
  }, [isRunningInIframe, onNotify, serialBaudRate]);

  // 3. REAL WebUSB Thermal Printer Scanner (`navigator.usb.requestDevice`)
  const scanAndConnectRealUsbPrinter = useCallback(async (): Promise<boolean> => {
    setHardwareErrorMsg(null);
    setIframeBlockedNotice(false);

    const nav = navigator as unknown as {
      usb?: {
        requestDevice: (options: { filters: unknown[] }) => Promise<WebUsbDevice>;
      };
    };

    if (!nav.usb) {
      setHardwareErrorMsg('Browser នេះមិនគាំទ្រ WebUSB ទេ។');
      return false;
    }

    setIsScanningHardware(true);
    try {
      const device = await nav.usb.requestDevice({ filters: [] });
      await device.open();
      if (!device.configuration) {
        await device.selectConfiguration(1);
      }

      let targetInterface = 0;
      let outEndpoint = 1;

      const interfaces = device.configuration?.interfaces || [];
      for (const iface of interfaces) {
        for (const alt of iface.alternates) {
          const ep = alt.endpoints.find((e) => e.direction === 'out');
          if (ep) {
            targetInterface = iface.interfaceNumber;
            outEndpoint = ep.endpointNumber;
            break;
          }
        }
      }

      await device.claimInterface(targetInterface);
      usbDeviceRef.current = { device, endpointNumber: outEndpoint };
      bleDeviceRef.current = null;
      bleCharRef.current = null;
      serialPortRef.current = null;

      const realName = device.productName || device.manufacturerName || 'USB Thermal Printer';
      setHardwareConn({
        type: 'usb',
        name: realName,
        details: `WebUSB Direct · Endpoint #${outEndpoint}`
      });

      onNotify(`បានភ្ជាប់ម៉ាស៊ីនព្រីន USB "${realName}" ដោយជោគជ័យ!`);
      return true;
    } catch (err: unknown) {
      const errName = err instanceof Error ? err.name : '';
      const errMsg = err instanceof Error ? err.message : String(err);

      if (errName === 'NotFoundError' || errMsg.toLowerCase().includes('cancelled')) {
        return false;
      }

      if (errName === 'SecurityError' || isRunningInIframe) {
        setIframeBlockedNotice(true);
        setHardwareErrorMsg(
          'សូមចុចប៊ូតុង «បើកផ្ទាំងពេញអេក្រង់ដើម្បីស្កេន Bluetooth ពិតប្រាកដ» ខាងក្រោមដើម្បីប្រើសិទ្ធិ Hardware ពេញលេញ!'
        );
        return false;
      }

      setHardwareErrorMsg(`បញ្ហាភ្ជាប់ USB: ${errMsg}`);
      return false;
    } finally {
      setIsScanningHardware(false);
    }
  }, [isRunningInIframe, onNotify]);

  // Transmit raw ESC/POS bands to the connected real physical printer
  const streamEscPosBandsToHardware = useCallback(
    async (bands: Uint8Array[], totalBytes: number): Promise<boolean> => {
      let sentBytes = 0;

      // Case A: Connected via Real Web Bluetooth BLE GATT
      if (bleCharRef.current) {
        // Reconnect GATT if disconnected
        if (bleDeviceRef.current?.gatt && !bleDeviceRef.current.gatt.connected) {
          await bleDeviceRef.current.gatt.connect();
        }

        const char = bleCharRef.current;
        const bleChunkSize = 100; // Safe MTU chunk size for all BLE thermal printers

        for (const band of bands) {
          for (let offset = 0; offset < band.length; offset += bleChunkSize) {
            const chunk = band.slice(offset, offset + bleChunkSize);
            if (char.writeValueWithoutResponse) {
              await char.writeValueWithoutResponse(chunk);
            } else if (char.writeValue) {
              await char.writeValue(chunk);
            }
            sentBytes += chunk.length;
            setPrintProgress(Math.min(99, Math.round((sentBytes / totalBytes) * 100)));
            // 8ms flow-control delay so the printer's thermal buffer never overflows
            await new Promise((r) => setTimeout(r, 8));
          }
          // 18ms pause between 24-dot bands for stepper motor feed
          await new Promise((r) => setTimeout(r, 18));
        }
        return true;
      }

      // Case B: Connected via Real Bluetooth Classic SPP / Serial Port
      if (serialPortRef.current?.writable) {
        const writer = serialPortRef.current.writable.getWriter();
        try {
          for (const band of bands) {
            await writer.write(band);
            sentBytes += band.length;
            setPrintProgress(Math.min(99, Math.round((sentBytes / totalBytes) * 100)));
            await new Promise((r) => setTimeout(r, 15));
          }
        } finally {
          writer.releaseLock();
        }
        return true;
      }

      // Case C: Connected via Real WebUSB
      if (usbDeviceRef.current) {
        const { device, endpointNumber } = usbDeviceRef.current;
        for (const band of bands) {
          await device.transferOut(endpointNumber, band);
          sentBytes += band.length;
          setPrintProgress(Math.min(99, Math.round((sentBytes / totalBytes) * 100)));
        }
        return true;
      }

      return false;
    },
    []
  );

  // Direct Real Hardware Bluetooth Print Handler
  const handleDirectBluetoothPrint = useCallback(async () => {
    setIsPreviewModalOpen(true);
    setHardwareErrorMsg(null);
    setLastPrintSuccess(null);

    // If no real hardware printer is connected yet, immediately trigger the real Web Bluetooth scanner!
    if (!bleCharRef.current && !serialPortRef.current && !usbDeviceRef.current) {
      const connectedNow = await scanAndConnectRealBlePrinter();
      if (!connectedNow) {
        return;
      }
    }

    setIsPrintingBt(true);
    setPrintProgress(5);

    const spec = PAPER_SPEC[paperWidth];
    const { escPosBands, totalBytes } = renderThermalWaybillAndBandedEscPos(
      spec.dotsWidth,
      paperWidth,
      {
        addressType,
        recipientName,
        phone,
        zonecode,
        primaryAddress,
        secondaryReferenceAddress,
        detailAddress,
        bname,
        deliveryMemo
      }
    );

    try {
      const ok = await streamEscPosBandsToHardware(escPosBands, totalBytes);
      if (!ok) {
        throw new Error('មិនមានការភ្ជាប់ទៅកាន់ម៉ាស៊ីនព្រីនពិតប្រាកដទេ។');
      }

      setPrintProgress(100);
      const activeName = hardwareConn?.name || 'Bluetooth Thermal Printer';
      const nowTime = new Date().toLocaleTimeString('km-KH', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setLastPrintSuccess({
        printerName: activeName,
        widthMm: paperWidth,
        printedAt: nowTime
      });

      onNotify(`បានព្រីនស្លាក 우체국 택배 (${paperWidth}mm) ចេញពីម៉ាស៊ីន "${activeName}" ដោយជោគជ័យ!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setHardwareErrorMsg(`បញ្ហាពេលកំពុងព្រីន៖ ${msg}`);
    } finally {
      setTimeout(() => {
        setIsPrintingBt(false);
      }, 200);
    }
  }, [
    addressType,
    bname,
    deliveryMemo,
    detailAddress,
    hardwareConn?.name,
    onNotify,
    paperWidth,
    phone,
    primaryAddress,
    recipientName,
    scanAndConnectRealBlePrinter,
    secondaryReferenceAddress,
    streamEscPosBandsToHardware,
    zonecode
  ]);

  // Quick Hardware Test Print (Sends a small real ESC/POS test slip to verify physical printer)
  const handleHardwareTestPrint = useCallback(async () => {
    if (!bleCharRef.current && !serialPortRef.current && !usbDeviceRef.current) {
      await scanAndConnectRealBlePrinter();
      return;
    }

    setIsPrintingBt(true);
    setPrintProgress(15);
    setHardwareErrorMsg(null);

    const spec = PAPER_SPEC[paperWidth];
    const { escPosBands, totalBytes } = renderThermalWaybillAndBandedEscPos(
      spec.dotsWidth,
      paperWidth,
      {
        addressType: 'R',
        recipientName: recipientName || 'TEST PRINT · ហួត ដារ៉ា',
        phone: phone || '010-1234-5678',
        zonecode: zonecode || '12345',
        primaryAddress: primaryAddress || '서울특별시 종로구 세종대로 175 (우체국 테스트)',
        detailAddress: detailAddress || '101동 202호',
        bname: bname || '세종로',
        deliveryMemo: deliveryMemo || '문 앞에 놓아주세요 (ស្លាកព្រីនសាកល្បង)'
      }
    );

    try {
      await streamEscPosBandsToHardware(escPosBands, totalBytes);
      setPrintProgress(100);
      onNotify(`ព្រីនសាកល្បង (${paperWidth}mm) តាម Bluetooth ជោគជ័យ!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setHardwareErrorMsg(`មិនអាចព្រីនសាកល្បងបានទេ៖ ${msg}`);
    } finally {
      setTimeout(() => {
        setIsPrintingBt(false);
      }, 200);
    }
  }, [
    bname,
    deliveryMemo,
    detailAddress,
    onNotify,
    paperWidth,
    phone,
    primaryAddress,
    recipientName,
    scanAndConnectRealBlePrinter,
    streamEscPosBandsToHardware,
    zonecode
  ]);

  // Synchronous System / OS Print (Preserves user activation gesture)
  const triggerSystemThermalPrint = useCallback(() => {
    try {
      window.print();
      onNotify(`បានបើកផ្ទាំងព្រីនស្លាកទំហំ ${paperWidth}mm រួចរាល់!`);
    } catch {
      onNotify(`បានរៀបចំស្លាកទំហំ ${paperWidth}mm រួចរាល់!`);
    }
  }, [onNotify, paperWidth]);

  // Download High-Resolution 203-DPI Thermal Label PNG
  const handleDownloadLabelPng = useCallback(() => {
    const spec = PAPER_SPEC[paperWidth];
    const { pngDataUrl } = renderThermalWaybillAndBandedEscPos(spec.dotsWidth, paperWidth, {
      addressType,
      recipientName,
      phone,
      zonecode,
      primaryAddress,
      secondaryReferenceAddress,
      detailAddress,
      bname,
      deliveryMemo
    });

    if (!pngDataUrl) return;
    const link = document.createElement('a');
    link.href = pngDataUrl;
    link.download = `KPost-Waybill-${zonecode || '00000'}-${paperWidth}mm.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify(`បានទាញយករូបស្លាកព្រីនទំហំ ${paperWidth}mm (PNG) រួចរាល់!`);
  }, [
    addressType,
    bname,
    deliveryMemo,
    detailAddress,
    onNotify,
    paperWidth,
    phone,
    primaryAddress,
    recipientName,
    secondaryReferenceAddress,
    zonecode
  ]);

  useEffect(() => {
    setLastPrintSuccess(null);
  }, [addressType, recipientName, phone, zonecode, primaryAddress, detailAddress, deliveryMemo]);

  const activeSpec = PAPER_SPEC[paperWidth];
  const fullPreviewAddress = [
    primaryAddress,
    detailAddress,
    addressType === 'R' && bname ? `(${bname})` : ''
  ]
    .filter(Boolean)
    .join(' ');

  const standaloneBluetoothTabUrl = (() => {
    if (typeof window === 'undefined') return '?bt_mode=1';
    const url = new URL(window.location.href);
    url.searchParams.set('bt_mode', '1');
    return url.toString();
  })();

  // Dedicated Print Sheet rendered into document.body for synchronous @media print (`window.print()`)
  const printPortal =
    typeof document !== 'undefined'
      ? createPortal(
          <div
            id="kpost-thermal-print-sheet"
            style={{ width: `${paperWidth}mm` }}
            className="hidden print:block bg-white text-black font-sans"
          >
            <div className="border-2 border-black p-2.5 space-y-2">
              <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                <span className="font-black text-sm">우체국 택배 · {paperWidth}mm</span>
                <span className="font-mono font-black text-lg">{zonecode || '-----'}</span>
              </div>
              <div className="border-b border-dashed border-black pb-1.5">
                <div className="text-[10px] font-bold">받는분 / 연락처 (អ្នកទទួលឥវ៉ាន់)</div>
                <div className="font-extrabold text-sm">{recipientName || '-'}</div>
                <div className="font-mono font-bold text-xs">{phone || '-'}</div>
              </div>
              <div className="border-b border-dashed border-black pb-1.5">
                <div className="text-[10px] font-bold">
                  {addressType === 'R' ? '도로명주소 (Road Address)' : '지번주소 (Jibun Address)'}
                </div>
                <div className="font-extrabold text-sm leading-snug break-keep">
                  {fullPreviewAddress || '-'}
                </div>
                {secondaryReferenceAddress && (
                  <div className="text-[10px] mt-0.5">참고: {secondaryReferenceAddress}</div>
                )}
              </div>
              {deliveryMemo && (
                <div className="border-b border-dashed border-black pb-1.5">
                  <div className="text-[10px] font-bold">배송메시지 (ចំណាំដឹកជញ្ជូន)</div>
                  <div className="font-bold text-xs">{deliveryMemo}</div>
                </div>
              )}
              <div className="pt-1 text-center font-mono text-[10px] font-bold tracking-widest">
                ||| |||| || ||| |||| ||| || ||||
                <br />
                KPOST-{zonecode || '00000'}-{paperWidth}MM
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {printPortal}

      {/* Inline Bluetooth Print & Paper Size (58mm / 70mm / 80mm) Control Block inside Waybill Form */}
      <div className="pt-3 mt-1 border-t border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Bluetooth className="w-4 h-4 text-blue-600 shrink-0" />
            <span>មុខងារព្រីនស្លាក Bluetooth ពិតប្រាកដ (우체국 송장 출력)៖</span>
          </div>

          {hardwareConn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
              <BluetoothConnected className="w-3 h-3" />
              <span className="truncate max-w-[180px]">{hardwareConn.name}</span>
            </span>
          ) : (
            <span className="text-[11px] font-medium text-slate-500">
              ទំហំក្រដាសស្តង់ដារ៖ {paperWidth}mm
            </span>
          )}
        </div>

        {/* Selectable Paper Width Pills: 58mm | 70mm | 80mm */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {([58, 70, 80] as ThermalPaperWidth[]).map((sizeMm) => {
            const isSelected = paperWidth === sizeMm;
            return (
              <motion.button
                key={sizeMm}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => handleSelectPaperWidth(sizeMm)}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-red-700 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                <span className="font-mono">{sizeMm}mm</span>
              </motion.button>
            );
          })}
        </div>

        {/* Primary Bluetooth Print & Label Preview Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            disabled={isPrintingBt || isScanningHardware}
            onClick={() => void handleDirectBluetoothPrint()}
            className="min-h-[42px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {isPrintingBt ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>កំពុងព្រីន ({printProgress}%)...</span>
              </>
            ) : (
              <>
                <Bluetooth className="w-4 h-4 text-sky-400" />
                <span>Bluetooth Print ({paperWidth}mm)</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-4 h-4 text-red-700" />
            <span>ស្កេនម៉ាស៊ីនព្រីន &amp; កំណត់ ({paperWidth}mm)</span>
          </motion.button>
        </div>
      </div>

      {/* Real Hardware Bluetooth Thermal Label Scanner & Print Modal */}
      <AnimatePresence>
        {isPreviewModalOpen && (
          <motion.div
            key="bt-print-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
            onClick={() => setIsPreviewModalOpen(false)}
          >
            <motion.div
              key="bt-print-modal-card"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-slate-800 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-red-400 block">
                      REAL HARDWARE BLUETOOTH PRINTER · 58MM / 70MM / 80MM
                    </span>
                    <h3 className="text-sm sm:text-base font-bold truncate">
                      ប្រព័ន្ធស្កេន និងព្រីនស្លាក 우체국 택배 តាមម៉ាស៊ីនព្រីនពិតប្រាកដ
                    </h3>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 bg-[#FAF9F6]">
                {/* Real Physical Bluetooth Scanner Section */}
                <div className="bg-white border-2 border-blue-600 rounded-2xl p-4 space-y-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          hardwareConn
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {hardwareConn ? (
                          <BluetoothConnected className="w-5 h-5" />
                        ) : (
                          <BluetoothSearching className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          ស្ថានភាពឧបករណ៍ម៉ាស៊ីនព្រីនពិតប្រាកដ (Real Hardware Status)៖
                        </span>
                        {hardwareConn ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs sm:text-sm font-bold text-emerald-700">
                              បានភ្ជាប់៖ {hardwareConn.name}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              ({hardwareConn.details})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs sm:text-sm font-bold text-slate-900">
                            មិនទាន់បានភ្ជាប់ម៉ាស៊ីនព្រីន (សូមបើកកុងតាក់ Bluetooth ម៉ាស៊ីនព្រីន រួចចុចស្កេនខាងក្រោម)
                          </span>
                        )}
                      </div>
                    </div>

                    {hardwareConn && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isPrintingBt}
                          onClick={() => void handleHardwareTestPrint()}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>ព្រីនសាកល្បង</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDisconnectHardware()}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-red-100 text-slate-700 hover:text-red-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Unplug className="w-3.5 h-3.5" />
                          <span>ផ្តាច់</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3 Real Hardware Scan Buttons (BLE + Bluetooth Classic SPP + USB) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      disabled={isScanningHardware}
                      onClick={() => void scanAndConnectRealBlePrinter()}
                      className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Bluetooth className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-mono bg-blue-800/80 text-white px-1.5 py-0.5 rounded">
                          BLE 4.0 / 5.0
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          ១. ស្កេន Bluetooth ផ្ទាល់ (BLE)
                        </span>
                        <span className="text-[10px] text-blue-100 block mt-0.5">
                          ស្វែងរកម៉ាស៊ីនព្រីន Bluetooth ពិតប្រាកដនៅជិត
                        </span>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      disabled={isScanningHardware}
                      onClick={() => void scanAndConnectRealSerialPrinter()}
                      className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Radio className="w-4 h-4 text-sky-400" />
                        <span className="text-[10px] font-mono bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">
                          SPP / COM Port
                        </span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">
                          ២. ស្កេន Bluetooth SPP (COM)
                        </span>
                        <span className="text-[10px] text-slate-300 block mt-0.5">
                          សម្រាប់ម៉ាស៊ីនព្រីនភ្ជាប់ក្នុង Settings កុំព្យូទ័រ
                        </span>
                      </div>
                    </motion.button>

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      disabled={isScanningHardware}
                      onClick={() => void scanAndConnectRealUsbPrinter()}
                      className="p-3 rounded-xl border border-slate-300 bg-[#FAF9F6] hover:bg-white text-slate-900 text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <Usb className="w-4 h-4 text-red-700" />
                        <span className="text-[10px] font-mono text-slate-500">WebUSB</span>
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">
                          ៣. ស្កេនតាមខ្សែ USB ផ្ទាល់
                        </span>
                        <span className="text-[10px] text-slate-500 block mt-0.5">
                          សម្រាប់ម៉ាស៊ីនព្រីនដោតខ្សែ USB
                        </span>
                      </div>
                    </motion.button>
                  </div>

                  {/* Serial Baud Rate Selector & Standalone Full Tab Launcher */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-slate-500">
                        ល្បឿន SPP Baud Rate៖
                      </span>
                      <select
                        aria-label="Baud Rate"
                        value={serialBaudRate}
                        onChange={(e) => setSerialBaudRate(Number(e.target.value))}
                        className="px-2 py-1 text-xs font-mono font-bold bg-[#FAF9F6] border border-slate-300 rounded-lg"
                      >
                        <option value={9600}>9600 (ស្តង់ដារ)</option>
                        <option value={19200}>19200</option>
                        <option value={38400}>38400</option>
                        <option value={57600}>57600</option>
                        <option value={115200}>115200 (ល្បឿនលឿន)</option>
                      </select>
                    </div>

                    {isRunningInIframe && (
                      <a
                        href={standaloneBluetoothTabUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>បើកផ្ទាំងពេញអេក្រង់ដើម្បីស្កេន Bluetooth ពិតប្រាកដ</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Iframe Hardware Permission Notice or Error Alert */}
                {hardwareErrorMsg && (
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold text-amber-950 leading-relaxed">
                          {hardwareErrorMsg}
                        </p>
                      </div>
                    </div>

                    {iframeBlockedNotice && (
                      <div className="pt-1 flex flex-wrap items-center gap-2">
                        <a
                          href={standaloneBluetoothTabUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>ចុចទីនេះដើម្បីបើកផ្ទាំងពេញ និងស្កេនម៉ាស៊ីនព្រីន Bluetooth ពិតប្រាកដភ្លាមៗ</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Paper Size Configuration Card (58mm / 70mm / 80mm) — High-Contrast in both Light & Dark Mode */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-red-700" />
                      ជ្រើសរើសទំហំក្រដាសម៉ាស៊ីនព្រីន (Paper Roll Width)៖
                    </span>
                    <span className="text-xs font-mono font-bold text-red-700">
                      {activeSpec.widthMm}mm ({activeSpec.dotsWidth} dots)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    {([58, 70, 80] as ThermalPaperWidth[]).map((w) => {
                      const spec = PAPER_SPEC[w];
                      const active = paperWidth === w;
                      return (
                        <motion.button
                          key={w}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          type="button"
                          onClick={() => handleSelectPaperWidth(w)}
                          className={`p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            active
                              ? 'bg-red-700 border-red-600 text-white shadow-sm'
                              : 'bg-[#FAF9F6] border-slate-200 hover:border-red-400 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-mono text-base font-bold ${
                                active ? 'text-white' : 'text-slate-900'
                              }`}
                            >
                              {spec.labelKhmer}
                            </span>
                            {active && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <p
                            className={`text-[11px] mt-1 leading-snug ${
                              active ? 'text-red-100' : 'text-slate-600'
                            }`}
                          >
                            {spec.descKhmer}
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Transmission Progress or Printed Thermal Output Banner */}
                <AnimatePresence mode="wait">
                  {isPrintingBt && (
                    <motion.div
                      key="bt-printing-progress"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          កំពុងបញ្ជូនទិន្នន័យព្រីន ESC/POS ទៅកាន់ម៉ាស៊ីនព្រីន ({paperWidth}mm)...
                        </span>
                        <span className="font-mono">{printProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${printProgress}%` }}
                          className="h-full bg-blue-600 transition-all duration-150"
                        />
                      </div>
                    </motion.div>
                  )}

                  {!isPrintingBt && lastPrintSuccess && (
                    <motion.div
                      key="bt-printed-success"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                            បានព្រីនស្លាក 우체국 택배 ({lastPrintSuccess.widthMm}mm) ជោគជ័យ!
                          </h4>
                          <p className="text-[11px] text-slate-600">
                            ឧបករណ៍៖ {lastPrintSuccess.printerName} · ម៉ោង៖ {lastPrintSuccess.printedAt}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Live Scaled Waybill Thermal Label Preview */}
                <div className="flex flex-col items-center">
                  <span className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-red-700" />
                    គំរូស្លាកផ្ញើឥវ៉ាន់ជាក់ស្តែងលើក្រដាសទំហំ {paperWidth}mm៖
                  </span>

                  <motion.div
                    key={`ticket-preview-${paperWidth}`}
                    initial={{ opacity: 0.8, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ width: '100%', maxWidth: `${activeSpec.previewWidthPx}px` }}
                    className="bg-white text-slate-950 border-2 border-slate-900 rounded-xl p-4 shadow-md font-sans space-y-3"
                  >
                    {/* Ticket Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2.5">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-red-700 shrink-0" />
                        <span className="font-extrabold text-sm tracking-tight">
                          우체국 택배 · {paperWidth}mm
                        </span>
                      </div>
                      <span className="font-mono text-lg font-black tracking-wider text-red-700 tabular-nums">
                        {zonecode || '-----'}
                      </span>
                    </div>

                    {/* Recipient Block */}
                    <div className="border-b border-dashed border-slate-400 pb-2.5 space-y-0.5">
                      <span className="text-[10px] font-bold text-slate-500 block">
                        받는분 / 연락처 (អ្នកទទួលឥវ៉ាន់)
                      </span>
                      <p className="text-sm font-extrabold text-slate-900">
                        {recipientName || 'មិនទាន់បញ្ចូលឈ្មោះ'}
                      </p>
                      <p className="font-mono text-xs font-bold text-slate-800 tabular-nums">
                        {phone || '010-XXXX-XXXX'}
                      </p>
                    </div>

                    {/* Address Block */}
                    <div className="border-b border-dashed border-slate-400 pb-2.5 space-y-1">
                      <span className="text-[10px] font-bold text-red-700 block">
                        {addressType === 'R'
                          ? '도로명주소 (អាសយដ្ឋានឈ្មោះផ្លូវ)'
                          : '지번주소 (អាសយដ្ឋានភូមិ/សង្កាត់)'}
                      </span>
                      <p className="text-sm font-extrabold text-slate-900 leading-snug break-keep">
                        {fullPreviewAddress || 'មិនទាន់ជ្រើសរើសអាសយដ្ឋាន'}
                      </p>
                      {secondaryReferenceAddress && (
                        <p className="text-[11px] text-slate-600">
                          참고: {secondaryReferenceAddress}
                        </p>
                      )}
                    </div>

                    {/* Delivery Memo Block */}
                    {deliveryMemo && (
                      <div className="border-b border-dashed border-slate-400 pb-2.5 space-y-0.5">
                        <span className="text-[10px] font-bold text-slate-500 block">
                          배송메시지 (ចំណាំដឹកជញ្ជូន)
                        </span>
                        <p className="text-xs font-bold text-slate-900">{deliveryMemo}</p>
                      </div>
                    )}

                    {/* Simulated Barcode Footer */}
                    <div className="pt-1 text-center space-y-1">
                      <div
                        aria-hidden="true"
                        className="h-7 w-full bg-[repeating-linear-gradient(90deg,#0f172a,#0f172a_2px,transparent_2px,transparent_5px,#0f172a_5px,#0f172a_8px,transparent_8px,transparent_10px)] opacity-90"
                      />
                      <span className="font-mono text-[10px] font-bold tracking-widest text-slate-600 block">
                        KPOST-{zonecode || '00000'}-{paperWidth}MM
                      </span>
                    </div>
                  </motion.div>
                </div>
              </div>

              {/* Modal Footer with Real Bluetooth Scan, PNG Download, System Print & Direct Bluetooth Print */}
              <div className="px-5 py-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    disabled={isScanningHardware}
                    onClick={() => void scanAndConnectRealBlePrinter()}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isScanningHardware ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <Bluetooth className="w-4 h-4 text-blue-600" />
                    )}
                    <span>
                      {hardwareConn ? 'ស្កេនប្តូរម៉ាស៊ីនព្រីន Bluetooth' : 'ស្វែងរកភ្ជាប់ Bluetooth ពិត'}
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={handleDownloadLabelPng}
                    className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-700" />
                    <span>ទាញយកស្លាក PNG ({paperWidth}mm)</span>
                  </motion.button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    onClick={triggerSystemThermalPrint}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>ព្រីនតាមប្រព័ន្ធឧបករណ៍ ({paperWidth}mm)</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    type="button"
                    disabled={isPrintingBt || isScanningHardware}
                    onClick={() => void handleDirectBluetoothPrint()}
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    {isPrintingBt ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bluetooth className="w-4 h-4" />
                    )}
                    <span>ព្រីនតាម Bluetooth ផ្ទាល់ ({paperWidth}mm)</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
