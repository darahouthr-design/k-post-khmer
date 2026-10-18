/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Copy,
  Check,
  Sparkles,
  BookmarkPlus,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  User,
  Building,
  FileText,
  KeyRound,
  RotateCcw,
  ClipboardPaste,
  Package,
  BookOpen,
  History,
  Sun,
  Moon
} from 'lucide-react';
import {
  DELIVERY_MEMO_PRESETS,
  AddressRecord,
  SavedCustomerAddress,
  formatKoreanPhone,
  resolvePostalCodeFromAddress,
  parseKoreanAddressText
} from './data/koreanAddresses';
import { InlineOfficialPostcode } from './components/InlineOfficialPostcode';
import { OfficialAddressGoogleMap } from './components/OfficialAddressGoogleMap';
import { AddressAnatomySection } from './components/AddressAnatomySection';
import { SavedAddressesSection } from './components/SavedAddressesSection';
import { KoreaPostGuideSection } from './components/KoreaPostGuideSection';
import { KoreaPostEmblem } from './components/KoreaPostEmblem';
import {
  AboutDeveloperModal,
  DEFAULT_DEV_PHOTO_URL
} from './components/AboutDeveloperModal';
import { BluetoothWaybillPrinter } from './components/BluetoothWaybillPrinter';

// Dedicated storage key that stores ONLY addresses explicitly saved by the user (zero sample data)
const STORAGE_KEY = 'kpost_khmer_user_saved_only_v2';
const ACTIVE_DRAFT_KEY = 'kpost_khmer_active_waybill_draft_v1';

export default function App() {
  // Active Address Format Mode ('R' = 도로명주소 Road Name, 'J' = 지번주소 Jibun Lot)
  const [addressType, setAddressType] = useState<'R' | 'J'>('R');

  // Active Address Builder State — Initialized completely empty (no sample data)
  const [recipientName, setRecipientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [zonecode, setZonecode] = useState<string>('');
  const [zonecodeAutoBadge, setZonecodeAutoBadge] = useState<boolean>(false);
  const [sido, setSido] = useState<string>('');
  const [sidoKhmer, setSidoKhmer] = useState<string>('');
  const [sigungu, setSigungu] = useState<string>('');
  const [sigunguKhmer, setSigunguKhmer] = useState<string>('');
  const [bname, setBname] = useState<string>('');
  const [roadName, setRoadName] = useState<string>('');
  const [jibunPart, setJibunPart] = useState<string>('');
  const [roadAddress, setRoadAddress] = useState<string>('');
  const [jibunAddress, setJibunAddress] = useState<string>('');
  const [buildingName, setBuildingName] = useState<string>('');
  const [detailAddress, setDetailAddress] = useState<string>('');

  // Delivery Memo & Passcode State — Initialized empty
  const [selectedMemoKorean, setSelectedMemoKorean] = useState<string>('');
  const [entranceCode, setEntranceCode] = useState<string>('');
  const [memoCategoryTab, setMemoCategoryTab] = useState<'location' | 'contact' | 'care'>('location');

  // Smart Parser & Inline Official Search Trigger State
  const [rawPasteText, setRawPasteText] = useState<string>('');
  const [externalSearchTrigger, setExternalSearchTrigger] = useState<{
    query: string;
    detail?: string;
    timestamp: number;
  } | null>(null);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  // Save to History State — Strictly user-saved addresses only (no sample fallback)
  const [saveLabelTag, setSaveLabelTag] = useState<SavedCustomerAddress['labelTag']>('customer');
  const [saveNoteKhmer, setSaveNoteKhmer] = useState<string>('');
  const [savedAddresses, setSavedAddresses] = useState<SavedCustomerAddress[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore parse error
    }
    return [];
  });

  // Toast / Copy Feedback, About Modal, Dark Mode & Maps Quota State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedButtonKey, setCopiedButtonKey] = useState<string | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState<boolean>(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState<boolean>(false);
  const developerPhotoUrl = DEFAULT_DEV_PHOTO_URL;
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('kpost_khmer_dark_mode') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  useEffect(() => {
    const rootEl = document.documentElement;
    if (isDarkMode) {
      rootEl.classList.add('dark');
    } else {
      rootEl.classList.remove('dark');
    }
    try {
      localStorage.setItem('kpost_khmer_dark_mode', String(isDarkMode));
    } catch {
      // Ignore storage errors
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedAddresses));
    } catch {
      // Ignore storage quota errors
    }
  }, [savedAddresses]);

  // Hydrate active waybill draft if opened in standalone Bluetooth print tab (?bt_mode=1)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('bt_mode=1')) {
      try {
        const rawDraft = localStorage.getItem(ACTIVE_DRAFT_KEY);
        if (rawDraft) {
          const d = JSON.parse(rawDraft);
          if (d.addressType) setAddressType(d.addressType);
          if (d.recipientName) setRecipientName(d.recipientName);
          if (d.phone) setPhone(d.phone);
          if (d.zonecode) setZonecode(d.zonecode);
          if (d.sido) setSido(d.sido);
          if (d.sidoKhmer) setSidoKhmer(d.sidoKhmer);
          if (d.sigungu) setSigungu(d.sigungu);
          if (d.sigunguKhmer) setSigunguKhmer(d.sigunguKhmer);
          if (d.bname) setBname(d.bname);
          if (d.roadName) setRoadName(d.roadName);
          if (d.jibunPart) setJibunPart(d.jibunPart);
          if (d.roadAddress) setRoadAddress(d.roadAddress);
          if (d.jibunAddress) setJibunAddress(d.jibunAddress);
          if (d.buildingName) setBuildingName(d.buildingName);
          if (d.detailAddress) setDetailAddress(d.detailAddress);
          if (d.selectedMemoKorean) setSelectedMemoKorean(d.selectedMemoKorean);
          if (d.entranceCode) setEntranceCode(d.entranceCode);
        }
      } catch {
        // Ignore parse error
      }
    }
  }, []);

  // Sync active waybill fields to draft storage for seamless standalone Bluetooth tab handoff
  useEffect(() => {
    try {
      localStorage.setItem(
        ACTIVE_DRAFT_KEY,
        JSON.stringify({
          addressType,
          recipientName,
          phone,
          zonecode,
          sido,
          sidoKhmer,
          sigungu,
          sigunguKhmer,
          bname,
          roadName,
          jibunPart,
          roadAddress,
          jibunAddress,
          buildingName,
          detailAddress,
          selectedMemoKorean,
          entranceCode
        })
      );
    } catch {
      // Ignore storage error
    }
  }, [
    addressType,
    recipientName,
    phone,
    zonecode,
    sido,
    sidoKhmer,
    sigungu,
    sigunguKhmer,
    bname,
    roadName,
    jibunPart,
    roadAddress,
    jibunAddress,
    buildingName,
    detailAddress,
    selectedMemoKorean,
    entranceCode
  ]);

  const triggerToast = (msg: string, key?: string) => {
    setToastMessage(msg);
    if (key) {
      setCopiedButtonKey(key);
    }
    setTimeout(() => {
      setToastMessage(null);
      setCopiedButtonKey(null);
    }, 2200);
  };

  const copyToClipboard = async (text: string, labelKhmer: string, buttonKey?: string) => {
    if (!text.trim()) {
      triggerToast('មិនទាន់មានទិន្នន័យសម្រាប់ចម្លងទេ សូមបញ្ចូលព័ត៌មានជាមុនសិន');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      triggerToast(`បានចម្លង៖ ${labelKhmer}`, buttonKey);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      triggerToast(`បានចម្លង៖ ${labelKhmer}`, buttonKey);
    }
  };

  // Auto-resolve postal code when primary address field changes manually
  const handlePrimaryAddressChange = (newAddrVal: string) => {
    if (addressType === 'R') {
      setRoadAddress(newAddrVal);
    } else {
      setJibunAddress(newAddrVal);
    }

    if (!newAddrVal.trim()) {
      setSido('');
      setSidoKhmer('');
      setSigungu('');
      setSigunguKhmer('');
      setRoadName('');
      setJibunPart('');
      return;
    }

    const resolved = resolvePostalCodeFromAddress(newAddrVal);
    if (resolved.zonecode) {
      setZonecode(resolved.zonecode);
      setSidoKhmer(resolved.sidoKhmer);
      setSigunguKhmer(resolved.sigunguKhmer);
      setZonecodeAutoBadge(true);
    }

    const parsed = parseKoreanAddressText(newAddrVal);
    setSido(parsed.sido || '');
    setSigungu(parsed.sigungu || '');
    if (addressType === 'R') {
      setRoadName(parsed.roadName || '');
    } else {
      setJibunPart(parsed.jibunPart || '');
    }
    if (parsed.bname) setBname(parsed.bname);
  };

  // Select from directory record (supports choosing either 'R' 도로명 or 'J' 지번)
  const handleSelectDirectoryRecord = (rec: AddressRecord, chosenType: 'R' | 'J' = 'R') => {
    setAddressType(chosenType);
    setZonecode(rec.zonecode);
    setZonecodeAutoBadge(true);
    setSido(rec.sido);
    setSidoKhmer(rec.sidoKhmer);
    setSigungu(rec.sigungu);
    setSigunguKhmer(rec.sigunguKhmer);
    setBname(rec.bname);
    setRoadName(rec.roadName);
    const extractedJibun = rec.jibunAddress
      .replace(rec.sido, '')
      .replace(rec.sigungu, '')
      .trim();
    setJibunPart(extractedJibun || rec.bname);
    setRoadAddress(rec.roadAddress);
    setJibunAddress(rec.jibunAddress);
    setBuildingName(rec.buildingName);
    setDetailAddress(
      rec.buildingName === rec.sampleDetail
        ? rec.sampleDetail
        : `${rec.buildingName} ${rec.sampleDetail}`.trim()
    );
    triggerToast(
      `បានជ្រើសរើសទម្រង់ ${chosenType === 'J' ? '지번주소' : '도로명주소'} តំបន់ ${rec.regionTagKhmer} ([${rec.zonecode}])`
    );
  };

  // Parse raw customer message and sync with Inline Official 우체국 Search
  const handleParseCustomerMessage = (inputToParse?: string) => {
    const source = (inputToParse ?? rawPasteText).trim();
    if (!source) {
      triggerToast('សូមបិទភ្ជាប់ (Paste) អាសយដ្ឋានអតិថិជនជាមុនសិន');
      return;
    }
    const result = parseKoreanAddressText(source);
    setAddressType(result.detectedType);
    if (result.recipientName) setRecipientName(result.recipientName);
    if (result.phone) setPhone(result.phone);
    if (result.zonecode) {
      setZonecode(result.zonecode);
      setZonecodeAutoBadge(result.zonecodeAutoDetected);
    }
    setSido(result.sido || '');
    setSidoKhmer(result.sidoKhmer || '');
    setSigungu(result.sigungu || '');
    setSigunguKhmer(result.sigunguKhmer || '');
    setBname(result.bname || '');
    setRoadName(result.roadName || '');
    setJibunPart(result.jibunPart || '');
    setRoadAddress(result.roadAddress || '');
    setJibunAddress(result.jibunAddress || '');
    setDetailAddress(result.detailAddress || '');
    setBuildingName(result.detailAddress || '');

    // Trigger the inline official 우체국 search directly with the cleaned query
    if (result.cleanSearchQuery) {
      setExternalSearchTrigger({
        query: result.cleanSearchQuery,
        detail: result.detailAddress,
        timestamp: Date.now()
      });
    }

    triggerToast(
      `បំបែកទម្រង់អាសយដ្ឋាន (${result.detectedType === 'J' ? '지번주소' : '도로명주소'}) និងភ្ជាប់ទៅតារាង 우체국 ដោយជោគជ័យ!`
    );
  };

  // Active Primary Base Address depending on whether user chose 도로명 ('R') or 지번 ('J')
  const activeBaseAddress = useMemo(() => {
    if (addressType === 'J') {
      return jibunAddress.trim() || roadAddress.trim();
    }
    return roadAddress.trim() || jibunAddress.trim();
  }, [addressType, roadAddress, jibunAddress]);

  // Reference bracket at the end of address
  const referenceBracket = useMemo(() => {
    if (addressType === 'J') {
      const bldg = buildingName && !detailAddress.includes(buildingName) ? buildingName : '';
      return bldg ? `(${bldg})` : '';
    }
    const items = [bname, buildingName && !detailAddress.includes(buildingName) ? buildingName : '']
      .filter(Boolean)
      .join(', ');
    return items ? `(${items})` : '';
  }, [addressType, bname, buildingName, detailAddress]);

  const fullCombinedMemo = useMemo(() => {
    const base = selectedMemoKorean.trim();
    const code = entranceCode.trim();
    if (base && code) {
      return `${base} (공동현관: ${code})`;
    }
    if (code) {
      return `공동현관 출입번호: ${code}`;
    }
    return base;
  }, [selectedMemoKorean, entranceCode]);

  const singleLineKoreaPostAddress = useMemo(() => {
    if (!zonecode.trim() && !activeBaseAddress && !detailAddress.trim()) {
      return '';
    }
    const zipPart = zonecode.trim() ? `[${zonecode.trim()}] ` : '';
    const detailPart = detailAddress.trim()
      ? activeBaseAddress
        ? `, ${detailAddress.trim()}`
        : detailAddress.trim()
      : '';
    const refPart = referenceBracket ? ` ${referenceBracket}` : '';
    return `${zipPart}${activeBaseAddress}${detailPart}${refPart}`.trim();
  }, [zonecode, activeBaseAddress, detailAddress, referenceBracket]);

  const fullWaybillCopyText = useMemo(() => {
    if (!singleLineKoreaPostAddress && !recipientName.trim() && !phone.trim()) {
      return '';
    }
    const primaryLabel =
      addressType === 'J'
        ? '• 지번주소 (អាសយដ្ឋានភូមិ/សង្កាត់)'
        : '• 도로명주소 (អាសយដ្ឋានឈ្មោះផ្លូវ)';
    const secondaryLine =
      addressType === 'J'
        ? roadAddress.trim()
          ? `• 참고 도로명주소 (ផ្លូវយោង): ${roadAddress.trim()}`
          : ''
        : jibunAddress.trim()
        ? `• 참고 지번주소 (ភូមិ/សង្កាត់យោង): ${jibunAddress.trim()}`
        : '';

    const lines = [
      `[우체국 택배 배송지 정보]`,
      `• 받는분 (អ្នកទទួល): ${recipientName || '미입력'}`,
      `• 연락처 (ទូរស័ព្ទ): ${phone || '미입력'}`,
      `• 우편번호 (កូដប្រៃសណីយ៍): ${zonecode || '미입력'}`,
      `${primaryLabel}: ${activeBaseAddress}${detailAddress.trim() ? `, ${detailAddress.trim()}` : ''}${referenceBracket ? ` ${referenceBracket}` : ''}`,
      secondaryLine,
      fullCombinedMemo ? `• 배송메모 (ចំណាំដឹកជញ្ជូន): ${fullCombinedMemo}` : ''
    ].filter(Boolean);
    return lines.join('\n');
  }, [
    singleLineKoreaPostAddress,
    addressType,
    recipientName,
    phone,
    zonecode,
    activeBaseAddress,
    roadAddress,
    jibunAddress,
    detailAddress,
    referenceBracket,
    fullCombinedMemo
  ]);

  const customerVerificationChatText = useMemo(() => {
    if (!singleLineKoreaPostAddress && !recipientName.trim() && !phone.trim()) {
      return '';
    }
    const typeName = addressType === 'J' ? '지번주소' : '도로명주소';
    return [
      `សូមពិនិត្យផ្ទៀងផ្ទាត់អាសយដ្ឋានទទួលឥវ៉ាន់ (택배) របស់បង៖`,
      `• ឈ្មោះអ្នកទទួល (받는분): ${recipientName || '-'}`,
      `• លេខទូរស័ព្ទ (연락처): ${phone || '-'}`,
      `• កូដប្រៃសណីយ៍ (우편번호): ${zonecode || '-'}`,
      `• អាសយដ្ឋានពេញ (${typeName}): ${activeBaseAddress}${detailAddress.trim() ? `, ${detailAddress.trim()}` : ''}${referenceBracket ? ` ${referenceBracket}` : ''}`,
      `• ចំណាំដឹកជញ្ជូន (배송메모): ${fullCombinedMemo || '-'}`
    ].join('\n');
  }, [
    singleLineKoreaPostAddress,
    addressType,
    recipientName,
    phone,
    zonecode,
    activeBaseAddress,
    detailAddress,
    referenceBracket,
    fullCombinedMemo
  ]);

  // Delivery Efficiency Validation Checks
  const validationChecks = useMemo(() => {
    const hasValidZonecode = /^\d{5}$/.test(zonecode.trim());
    const hasPrimaryAddress =
      activeBaseAddress.length >= 6 && /(로|길|번길|동|읍|면|리|\d)/.test(activeBaseAddress);
    const hasDetailUnit =
      detailAddress.trim().length >= 2 &&
      /(호|층|동|기숙사|빌라|단독|매장|가게|집|\(주\)|주식회사|공장|회사)/.test(detailAddress);
    const hasValidPhone = /^01[016789]-\d{3,4}-\d{4}$|^0\d{1,3}-\d{3,4}-\d{4}$/.test(phone.trim());

    return {
      hasValidZonecode,
      hasPrimaryAddress,
      hasDetailUnit,
      hasValidPhone,
      allPassed: hasValidZonecode && hasPrimaryAddress && hasDetailUnit && hasValidPhone
    };
  }, [zonecode, activeBaseAddress, detailAddress, phone]);

  // Save current address to frequent history (ONLY when user clicks the button)
  const handleSaveToHistory = () => {
    if (!activeBaseAddress) {
      triggerToast('សូមបញ្ចូលអាសយដ្ឋានមុនពេលរក្សាទុក');
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    const newEntry: SavedCustomerAddress = {
      id: `saved-${Date.now()}`,
      recipientName: recipientName.trim() || 'អតិថិជនទូទៅ',
      phone: phone.trim() || '010-0000-0000',
      zonecode: zonecode.trim() || '00000',
      roadAddress: roadAddress.trim() || activeBaseAddress,
      jibunAddress: jibunAddress.trim() || activeBaseAddress,
      detailAddress: detailAddress.trim(),
      buildingName: buildingName.trim(),
      bname: bname.trim(),
      deliveryMemo: fullCombinedMemo,
      entranceCode: entranceCode.trim(),
      labelTag: saveLabelTag,
      isFavorite: saveLabelTag === 'vip',
      useCount: 1,
      lastUsedAt: today,
      noteKhmer: saveNoteKhmer.trim() || undefined
    };

    setSavedAddresses((prev) => [newEntry, ...prev]);
    setSaveNoteKhmer('');
    triggerToast('បានរក្សាទុកក្នុងប្រវត្តិអាសយដ្ឋានអតិថិជនរួចរាល់!');
  };

  const handleLoadFromHistory = (addr: SavedCustomerAddress) => {
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setZonecode(addr.zonecode);
    setRoadAddress(addr.roadAddress);
    setJibunAddress(addr.jibunAddress);
    setDetailAddress(addr.detailAddress);
    setBuildingName(addr.buildingName);
    setBname(addr.bname);
    setEntranceCode(addr.entranceCode);

    const cleanMemo = addr.deliveryMemo.replace(/\s*\(공동현관:.*?\)/, '').trim();
    setSelectedMemoKorean(cleanMemo);

    const parsed = parseKoreanAddressText(addr.roadAddress || addr.jibunAddress);
    setSido(parsed.sido || '');
    setSidoKhmer(parsed.sidoKhmer || '');
    setSigungu(parsed.sigungu || '');
    setSigunguKhmer(parsed.sigunguKhmer || '');
    setRoadName(parsed.roadName || '');
    const extractedJibun = (addr.jibunAddress || '')
      .replace(parsed.sido || '', '')
      .replace(parsed.sigungu || '', '')
      .trim();
    setJibunPart(extractedJibun || parsed.jibunPart || addr.bname);

    const today = new Date().toISOString().slice(0, 10);
    setSavedAddresses((prev) =>
      prev.map((item) =>
        item.id === addr.id
          ? { ...item, useCount: item.useCount + 1, lastUsedAt: today }
          : item
      )
    );

    window.scrollTo({ top: 0, behavior: 'smooth' });
    triggerToast(`បានទាញយកអាសយដ្ឋានរបស់ ${addr.recipientName}`);
  };

  const handleToggleFavorite = (id: string) => {
    setSavedAddresses((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const handleDeleteAddress = (id: string) => {
    setSavedAddresses((prev) => prev.filter((item) => item.id !== id));
    triggerToast('បានលុបអាសយដ្ឋានចេញពីប្រវត្តិរក្សាទុកជាអចិន្ត្រៃយ៍');
  };

  const handleCopyFullFromHistory = (addr: SavedCustomerAddress) => {
    const ref = addr.bname ? ` (${addr.bname})` : '';
    const detail = addr.detailAddress ? `, ${addr.detailAddress}` : '';
    const text = [
      `[우체국 택배 배송지 정보]`,
      `• 받는분: ${addr.recipientName}`,
      `• 연락처: ${addr.phone}`,
      `• 우편번호: ${addr.zonecode}`,
      `• 주소: ${addr.roadAddress}${detail}${ref}`,
      addr.deliveryMemo ? `• 배송메모: ${addr.deliveryMemo}` : ''
    ]
      .filter(Boolean)
      .join('\n');

    const today = new Date().toISOString().slice(0, 10);
    setSavedAddresses((prev) =>
      prev.map((item) =>
        item.id === addr.id
          ? { ...item, useCount: item.useCount + 1, lastUsedAt: today }
          : item
      )
    );

    copyToClipboard(text, `អាសយដ្ឋានពេញរបស់ ${addr.recipientName}`);
  };

  // Complete Reset: Wipes ALL active form, search, anatomy, memo, and preview fields clean (keeps only savedAddresses history)
  const handleResetForm = () => {
    setRecipientName('');
    setPhone('');
    setZonecode('');
    setZonecodeAutoBadge(false);
    setSido('');
    setSidoKhmer('');
    setSigungu('');
    setSigunguKhmer('');
    setBname('');
    setRoadName('');
    setJibunPart('');
    setRoadAddress('');
    setJibunAddress('');
    setDetailAddress('');
    setBuildingName('');
    setSelectedMemoKorean('');
    setEntranceCode('');
    setRawPasteText('');
    setSaveNoteKhmer('');
    setSaveLabelTag('customer');
    setExternalSearchTrigger(null);
    setResetTrigger((prev) => prev + 1);
    try {
      localStorage.removeItem(ACTIVE_DRAFT_KEY);
    } catch {
      // Ignore storage error
    }
    triggerToast('បានសម្អាតព័ត៌មានចាស់ទាំងអស់រួចរាល់ (រក្សាទុកតែប្រវត្តិអាសយដ្ឋានប៉ុណ្ណោះ)');
  };

  const focusOfficialSearchInput = () => {
    const el = document.getElementById('official-postcode-table');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col bg-[#FAF9F6] text-slate-900 pb-20 md:pb-12 transition-colors duration-250 ${
        isDarkMode ? 'dark' : ''
      }`}
    >
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}
      {/* Animated Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            key="global-toast"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-medium"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated About Application & Developer Modal */}
      <AboutDeveloperModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        developerPhotoUrl={developerPhotoUrl}
      />

      {/* Top Navigation Bar with Clean Modern Animations */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 relative">
        {/* Clean Standard Animated Developer Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="bg-slate-900 text-white px-4 sm:px-8 py-1.5 border-b border-slate-800 relative overflow-hidden"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-[11px] sm:text-xs relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
              className="hidden sm:flex items-center gap-2 text-slate-200 font-medium"
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              <span>
                ប្រព័ន្ធស្វែងរក និងរៀបចំអាសយដ្ឋានផ្ញើឥវ៉ាន់កូរ៉េផ្លូវការ (우체국 택배)
              </span>
            </motion.div>

            <motion.button
              type="button"
              onClick={() => setIsAboutModalOpen(true)}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12, ease: 'easeOut' }}
              whileHover={{ scale: 1.03, y: -0.5 }}
              whileTap={{ scale: 0.96 }}
              className="mx-auto sm:mx-0 flex items-center gap-2 font-display tracking-wide cursor-pointer px-2.5 py-0.5 rounded-lg hover:bg-slate-800/90 transition-colors group"
              title="ចុចដើម្បីមើលព័ត៌មានអំពីកម្មវិធី និងអ្នកអភិវឌ្ឍន៍"
            >
              <motion.img
                src={developerPhotoUrl}
                alt="Hout Dara"
                referrerPolicy="no-referrer"
                animate={{ rotate: [0, 4, -4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-4 h-4 rounded-full object-contain bg-white border border-red-400 shrink-0 shadow-xs"
              />
              <span className="text-slate-300 font-medium group-hover:text-white transition-colors">
                Website created by:
              </span>
              <motion.span
                initial={{ opacity: 0.9 }}
                animate={{ opacity: [0.88, 1, 0.88] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                className="font-bold text-white tracking-wider border-b border-red-500/80 pb-0.5"
              >
                Hout Dara
              </motion.span>
            </motion.button>
          </div>
        </motion.div>

        {/* Main 3-Zone Navigation Bar */}
        <div className="px-4 sm:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 lg:gap-8">
            {/* Zone 1: Brand Emblem Logo, Wordmark & Clickable Developer Subtitle */}
            <motion.div
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3 shrink-0"
            >
              <a
                href="#builder-workspace"
                className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap group"
              >
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                  whileHover={{ scale: 1.08, rotate: -4 }}
                  className="shrink-0"
                >
                  <KoreaPostEmblem className="w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-300" />
                </motion.div>
                <div>
                  <span className="block leading-tight group-hover:text-red-700 transition-colors">
                    K-Post Khmer · 우체국 택배
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-500 tracking-normal">
                    우편주소 표준화 시스템 · Korea Post Address System
                  </span>
                </div>
              </a>
              <span className="hidden xl:inline-block text-slate-300">|</span>
              <motion.button
                type="button"
                onClick={() => setIsAboutModalOpen(true)}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.14 }}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="hidden xl:inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 whitespace-nowrap cursor-pointer px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                title="ចុចដើម្បីមើលព័ត៌មានអំពីកម្មវិធី (About)"
              >
                <span>Website created by:</span>
                <span className="font-bold developer-shimmer">Hout Dara</span>
              </motion.button>
            </motion.div>

            {/* Zone 2: 4 concise single-line navigation links with clean gliding underline animation */}
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
              <motion.a
                href="#builder-workspace"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.08 }}
                whileHover={{ y: -1.5 }}
                className="nav-link-animated hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-0.5"
              >
                ស្វែងរក 우체국 ផ្លូវការ
              </motion.a>
              <motion.a
                href="#anatomy-section"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.14 }}
                whileHover={{ y: -1.5 }}
                className="nav-link-animated hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-0.5"
              >
                រចនាសម្ព័ន្ធអាសយដ្ឋាន
              </motion.a>
              <motion.a
                href="#history-section"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2 }}
                whileHover={{ y: -1.5 }}
                className="nav-link-animated hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-0.5 flex items-center gap-1"
              >
                <span>ប្រវត្តិរក្សាទុក</span>
                <motion.span
                  key={savedAddresses.length}
                  initial={{ scale: 0.8, opacity: 0.6 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 18 }}
                  className="font-mono font-bold text-red-700"
                >
                  ({savedAddresses.length})
                </motion.span>
              </motion.a>
              <motion.a
                href="#guide-section"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.26 }}
                whileHover={{ y: -1.5 }}
                className="nav-link-animated hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 py-0.5"
              >
                មគ្គុទ្ទេសក៍ 우체국
              </motion.a>
            </nav>

            {/* Zone 3: Standard Dark Mode Toggle & Primary Action Button */}
            <motion.div
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-2 sm:gap-2.5 shrink-0"
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -1 }}
                whileTap={{ scale: 0.94 }}
                type="button"
                onClick={() => setIsDarkMode((prev) => !prev)}
                aria-label={isDarkMode ? 'ប្តូរទៅ Light Mode' : 'ប្តូរទៅ Dark Mode'}
                title={isDarkMode ? 'ប្តូរទៅផ្ទៃភ្លឺ (Light Mode)' : 'ប្តូរទៅផ្ទៃងងឹត (Dark Mode)'}
                className="min-h-[40px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isDarkMode ? (
                    <motion.span
                      key="sun-icon"
                      initial={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5 text-amber-400"
                    >
                      <Sun className="w-4 h-4 fill-amber-400/20" />
                      <span className="hidden sm:inline text-slate-900">Light Mode</span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="moon-icon"
                      initial={{ rotate: 90, opacity: 0, scale: 0.7 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.7 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-1.5 text-slate-700"
                    >
                      <Moon className="w-4 h-4" />
                      <span className="hidden sm:inline text-slate-900">Dark Mode</span>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() =>
                  copyToClipboard(
                    fullWaybillCopyText,
                    'ទម្រង់អាសយដ្ឋានពេញលេញសម្រាប់ផ្ញើឥវ៉ាន់ (우체국 택배)',
                    'header-copy'
                  )
                }
                className="btn-shine-effect min-h-[40px] px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copiedButtonKey === 'header-copy' ? 'បានចម្លងរួចរាល់' : 'ចម្លងអាសយដ្ឋានពេញ'}
              </motion.button>
            </motion.div>
          </div>
        </div>

        {/* Subtle Clean Animated Bottom Accent Line */}
        <div className="h-[2px] w-full header-beam-line" aria-hidden="true" />
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 pt-6 sm:pt-8 space-y-14">
        {/* Hero & Primary Workspace */}
        <section id="builder-workspace" className="space-y-6">
          {/* Clean Animated Editorial Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-6"
          >
            <div className="max-w-3xl space-y-2">
              {/* Animated Kicker Row */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="flex flex-wrap items-center gap-2 text-xs font-semibold text-red-700"
              >
                <motion.span
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 24, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.18, ease: 'easeOut' }}
                  className="hidden sm:inline-block h-[2px] bg-red-600 rounded-full shrink-0"
                  aria-hidden="true"
                />
                <span>ប្រព័ន្ធរៀបចំអាសយដ្ឋានស្តង់ដារប្រៃសណីយ៍កូរ៉េ</span>
                <span aria-hidden="true">·</span>
                <span className="tracking-wide">KOREA POST (우체국) & COURIER READY</span>
              </motion.div>

              {/* Animated Main Hero Title */}
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight leading-[1.42] py-0.5"
                style={{ textWrap: 'balance' }}
              >
                <motion.span
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.2 }}
                  className="hero-title-shimmer"
                >
                  ស្វែងរក និងចម្លងទម្រង់អាសយដ្ឋានពេញលេញរបស់អតិថិជនសម្រាប់ផ្ញើឥវ៉ាន់{' '}
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, scale: 0.9, y: 6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 18,
                    delay: 0.34
                  }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  className="relative inline-block text-red-700 font-extrabold whitespace-nowrap"
                >
                  (택배)
                  <motion.svg
                    viewBox="0 0 120 10"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute -bottom-1 left-0 w-full h-2 text-red-600/85 pointer-events-none"
                    aria-hidden="true"
                  >
                    <motion.path
                      d="M3 7C32 2.5 88 2.5 117 7"
                      stroke="currentColor"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{
                        duration: 0.75,
                        delay: 0.5,
                        ease: 'easeOut'
                      }}
                    />
                  </motion.svg>
                </motion.span>
              </motion.h1>
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28, ease: 'easeOut' }}
              className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed"
            >
              ស្វែងរកតាមប្រព័ន្ធ 우체국 ផ្លូវការផ្ទាល់ គាំទ្រទាំងទម្រង់ 도로명주소 (ឈ្មោះផ្លូវ) និង 지번주소 (ភូមិ/សង្កាត់) អមដោយការត្រួតពិនិត្យកែតម្រូវអាសយដ្ឋានខុសដោយស្វ័យប្រវត្តិ។
            </motion.p>

            {/* Animated Hero Section Bottom Highlight Bar */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'left center' }}
              className="absolute bottom-[-1px] left-0 h-[2px] w-36 sm:w-52 bg-gradient-to-r from-red-600 via-amber-500 to-transparent rounded-full pointer-events-none"
              aria-hidden="true"
            />
          </motion.div>

          {/* 2-Column Interactive Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN (7 cols): Direct Inline 우체국 Search Table, Smart Paste, Address Form & Memo Selector */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card 1: Direct Inline Official 우체국 Search Table & Smart Customer Message Parser */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs hover:shadow-md transition-shadow duration-300"
              >
                {/* Direct Inline Official Korea Post Search Component */}
                <InlineOfficialPostcode
                  isDarkMode={isDarkMode}
                  addressType={addressType}
                  onSwitchAddressType={setAddressType}
                  externalSearchTrigger={externalSearchTrigger}
                  resetTrigger={resetTrigger}
                  onSelectDirectoryRecord={handleSelectDirectoryRecord}
                  onSelectOfficialAddress={(data) => {
                    setAddressType(data.selectedType);
                    setZonecode(data.zonecode);
                    setZonecodeAutoBadge(true);
                    setRoadAddress(data.roadAddress);
                    setJibunAddress(data.jibunAddress);
                    setSido(data.sido);
                    setSigungu(data.sigungu);
                    setBname(data.bname);
                    setRoadName(data.roadName);
                    setJibunPart(data.jibunPart);
                    setBuildingName(data.buildingName);

                    if (data.preservedDetail) {
                      setDetailAddress(data.preservedDetail);
                    } else if (data.buildingName && !detailAddress.includes(data.buildingName)) {
                      setDetailAddress(data.buildingName);
                    }

                    const resolved = resolvePostalCodeFromAddress(
                      data.roadAddress || data.jibunAddress
                    );
                    setSidoKhmer(resolved.sidoKhmer);
                    setSigunguKhmer(resolved.sigunguKhmer);
                    triggerToast(
                      `បានជ្រើសរើសទម្រង់ ${data.selectedType === 'J' ? '지번주소' : '도로명주소'} [${data.zonecode}] ដោយជោគជ័យ`
                    );
                  }}
                />

                {/* Real-Time Standard Google Maps Component directly below the Official Korea Post Search Table */}
                <OfficialAddressGoogleMap
                  isDarkMode={isDarkMode}
                  addressType={addressType}
                  zonecode={zonecode}
                  roadAddress={roadAddress}
                  jibunAddress={jibunAddress}
                  detailAddress={detailAddress}
                  buildingName={buildingName}
                  externalQuery={externalSearchTrigger?.query || ''}
                />

                {/* Smart Customer Raw Message Parser (No sample buttons) */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="raw-paste-box"
                      className="text-xs font-semibold text-slate-800 flex items-center gap-1.5"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-red-600" />
                      បិទភ្ជាប់ (Paste) សារអាសយដ្ឋានពីអតិថិជន ដើម្បីបំបែកទម្រង់ និងរកកូដប្រៃសណីយ៍ស្វ័យប្រវត្តិ៖
                    </label>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="raw-paste-box"
                      type="text"
                      value={rawPasteText}
                      onChange={(e) => setRawPasteText(e.target.value)}
                      placeholder="បិទភ្ជាប់សារអាសយដ្ឋានអតិថិជននៅទីនេះ..."
                      className="flex-1 px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => handleParseCustomerMessage()}
                      className="min-h-[42px] px-4 py-2.5 bg-slate-900 hover:bg-red-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      បំបែកទម្រង់ស្វ័យប្រវត្តិ
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Detailed Korea Post Recipient & Address Fields */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      02. ព័ត៌មានអ្នកទទួល និងអាសយដ្ឋានលម្អិត (받는분 및 상세주소)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      បង្ហាញទម្រង់អាសយដ្ឋានតាមការជ្រើសរើសរបស់អ្នក ({addressType === 'R' ? '도로명주소 - ឈ្មោះផ្លូវ' : '지번주소 - ភូមិ/សង្កាត់'})
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {/* Address Format Switcher (도로명 vs 지번) */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setAddressType('R')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          addressType === 'R'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        도로명 (ឈ្មោះផ្លូវ)
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() => setAddressType('J')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                          addressType === 'J'
                            ? 'bg-red-700 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        지번 (ភូមិ/សង្កាត់)
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={handleResetForm}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl border border-red-200 bg-red-50/60 hover:bg-red-100 text-red-800 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      សម្អាតបញ្ចូលថ្មី
                    </motion.button>
                  </div>
                </div>

                {/* Row 1: Recipient Name & Phone Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="recipient-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ឈ្មោះអ្នកទទួលឥវ៉ាន់ (받는분 성함)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="recipient-name"
                        type="text"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="បញ្ចូលឈ្មោះអ្នកទទួលឥវ៉ាន់..."
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="recipient-phone" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      លេខទូរស័ព្ទនៅកូរ៉េ (연락처 · 010-XXXX-XXXX)
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="recipient-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
                        placeholder="010-XXXX-XXXX"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 2: 5-Digit Postal Code & Primary Selected Address (도로명주소 or 지번주소) */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="zonecode-input" className="text-xs font-semibold text-slate-700">
                        កូដប្រៃសណីយ៍ (우편번호)
                      </label>
                      {zonecodeAutoBadge && (
                        <span className="text-[11px] font-semibold text-emerald-700">ស្វ័យប្រវត្តិ</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="zonecode-input"
                        type="text"
                        maxLength={5}
                        value={zonecode}
                        onChange={(e) => {
                          setZonecode(e.target.value.replace(/\D/g, '').slice(0, 5));
                          setZonecodeAutoBadge(false);
                        }}
                        placeholder="-----"
                        className="w-full px-3.5 py-2.5 text-base font-mono font-bold text-red-700 tabular-nums bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-8">
                    <label htmlFor="primary-address-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      {addressType === 'R'
                        ? 'អាសយដ្ឋានឈ្មោះផ្លូវផ្លូវការ (도로명주소 · 시/도 + 시/군/구 + 도로명)'
                        : 'អាសយដ្ឋានភូមិ/សង្កាត់ និងលេខដីឡូត៍ (지번주소 · 시/도 + 시/군/구 + 읍/면/동/리 + 번지)'}
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="primary-address-input"
                        type="text"
                        value={addressType === 'R' ? roadAddress : jibunAddress}
                        onChange={(e) => handlePrimaryAddressChange(e.target.value)}
                        placeholder={
                          addressType === 'R'
                            ? 'ជ្រើសរើសពីតារាង 우체국 ខាងលើ ឬវាយបញ្ចូល 도로명주소...'
                            : 'ជ្រើសរើសពីតារាង 우체국 ខាងលើ ឬវាយបញ្ចូល 지번주소...'
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Detailed Address (Dong / Floor / Ho) & Reference */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-7">
                    <label htmlFor="detail-address-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      អាសយដ្ឋានលម្អិត៖ ឈ្មោះអគារ/ក្រុមហ៊ុន / ប្លុក (동) / ជាន់ (층) / បន្ទប់ (호) *
                    </label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="detail-address-input"
                        type="text"
                        value={detailAddress}
                        onChange={(e) => setDetailAddress(e.target.value)}
                        placeholder="បញ្ចូលលេខបន្ទប់ (호), ជាន់ (층), អគារ (동) ឬឈ្មោះក្រុមហ៊ុន..."
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-semibold bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                    {/* Quick unit suffix append buttons */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-500">បន្ថែមពាក្យកូរ៉េរហ័ស៖</span>
                      {[
                        { label: '+ 동 (អគារ)', text: '동 ' },
                        { label: '+ 층 (ជាន់)', text: '층 ' },
                        { label: '+ 호 (បន្ទប់)', text: '호' },
                        { label: '+ 기숙사 (អន្តេវាសិកដ្ឋាន)', text: ' 기숙사 ' },
                        { label: '+ 빌라 (វីឡា)', text: '빌라 ' },
                        { label: '+ 단독주택 (ផ្ទះទោល)', text: '단독주택' }
                      ].map((btn, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => setDetailAddress((prev) => `${prev}${btn.text}`)}
                          className="px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {btn.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <label htmlFor="bname-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      សង្កាត់/ភូមិយោង (법정동/읍/면)
                    </label>
                    <input
                      id="bname-input"
                      type="text"
                      value={bname}
                      onChange={(e) => setBname(e.target.value)}
                      placeholder="បញ្ចូលឈ្មោះសង្កាត់/ឃុំ (동/읍/면)..."
                      className="w-full px-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      {addressType === 'R'
                        ? `បង្ហាញក្នុងវង់ក្រចកខាងចុងអាសយដ្ឋាន ${bname ? `(${bname})` : '(ប្រសិនបើមាន)'}`
                        : `សង្កាត់/ឃុំរបស់អាសយដ្ឋាន 지번 ${bname ? `(${bname})` : ''}`}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Card 3: Courier Delivery Memo (택배 배송메모) & Door Passcode */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 shadow-xs hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      03. មុខងារចំណាំសម្រាប់ការផ្ញើឥវ៉ាន់ (택배 배송메시지 / 공동현관)
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      ជ្រើសរើសពាក្យផ្តាំផ្ញើទៅកាន់អ្នកដឹកជញ្ជូន (택배 기사님) ជាភាសាកូរ៉េ អមដោយការបកប្រែខ្មែរ
                    </p>
                  </div>

                  {/* Segmented Category Filter */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
                    {[
                      { id: 'location', label: 'ទីតាំងទុកឥវ៉ាន់' },
                      { id: 'contact', label: 'ការទាក់ទង' },
                      { id: 'care', label: 'ប្រុងប្រយ័ត្នទំនិញ' }
                    ].map((tab) => {
                      const isActive = memoCategoryTab === tab.id;
                      return (
                        <motion.button
                          key={tab.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          onClick={() => setMemoCategoryTab(tab.id as typeof memoCategoryTab)}
                          className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                            isActive
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {tab.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Animated Preset Memo Card Items Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <AnimatePresence mode="popLayout">
                    {DELIVERY_MEMO_PRESETS.filter((m) => m.category === memoCategoryTab).map((memo, idx) => {
                      const isSelected = selectedMemoKorean === memo.korean;
                      return (
                        <motion.button
                          layout
                          key={memo.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.2, delay: idx * 0.03 }}
                          whileHover={{ y: -2, scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() =>
                            setSelectedMemoKorean((prev) => (prev === memo.korean ? '' : memo.korean))
                          }
                          className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-red-50/70 border-red-600 text-slate-900 shadow-xs'
                              : 'bg-[#FAF9F6] border-slate-200 hover:border-red-300 hover:bg-white text-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-slate-900">{memo.korean}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-red-700 shrink-0" />}
                            </div>
                            <p className="text-xs font-semibold text-red-800 mt-1">{memo.khmer}</p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
                            អានថា៖ {memo.pronunciationKhmer}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Custom Memo & Building Entrance Code */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-2">
                  <div className="sm:col-span-7">
                    <label htmlFor="custom-memo-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      ចំណាំដឹកជញ្ជូនជាភាសាកូរ៉េ (배송메시지 직접 입력)
                    </label>
                    <div className="relative">
                      <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="custom-memo-input"
                        type="text"
                        value={selectedMemoKorean}
                        onChange={(e) => setSelectedMemoKorean(e.target.value)}
                        placeholder="ជ្រើសរើសខាងលើ ឬវាយចំណាំដឹកជញ្ជូន..."
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-5">
                    <label htmlFor="entrance-code-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                      លេខកូដទ្វារធំខាងក្រោម (공동현관 비밀번호)
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        id="entrance-code-input"
                        type="text"
                        value={entranceCode}
                        onChange={(e) => setEntranceCode(e.target.value)}
                        placeholder="បញ្ចូលលេខកូដទ្វារ (ប្រសិនបើមាន)..."
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm font-mono tabular-nums bg-[#FAF9F6] border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN (5 cols): Live Official Korea Post Waybill & 1-Click Copy Center */}
            <div className="lg:col-span-5 lg:sticky lg:top-20 space-y-5">
              {/* Official Korea Post Waybill Card Item */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 }}
                className="bg-white border-2 border-slate-900 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                {/* Korea Post Top Ribbon */}
                <div className="bg-red-700 text-white px-5 py-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 shrink-0" />
                    <div>
                      <span className="text-sm font-bold tracking-tight block leading-none">
                        우체국 택배 · KOREA POST
                      </span>
                      <span className="text-[11px] text-red-100 block mt-1">
                        ទម្រង់អាសយដ្ឋានពេញលេញសម្រាប់ចម្លងផ្ញើឥវ៉ាន់
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-red-100 block">우편번호 (Zonecode)</span>
                    <span className="font-mono text-lg font-bold tracking-wider tabular-nums">
                      {zonecode || '-----'}
                    </span>
                  </div>
                </div>

                {/* Waybill Body */}
                <div className="p-5 space-y-4">
                  {/* Recipient & Phone Strip */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-500 block">받는분 (ឈ្មោះអ្នកទទួល)</span>
                      <p
                        className={`text-base font-bold truncate ${
                          recipientName ? 'text-slate-900' : 'text-slate-400 font-normal text-sm'
                        }`}
                      >
                        {recipientName || 'មិនទាន់បញ្ចូលឈ្មោះ'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] text-slate-500 block">연락처 (លេខទូរស័ព្ទ)</span>
                      <p
                        className={`font-mono text-sm font-bold tabular-nums ${
                          phone ? 'text-slate-900' : 'text-slate-400 font-normal text-xs'
                        }`}
                      >
                        {phone || 'មិនទាន់បញ្ចូលលេខទូរស័ព្ទ'}
                      </p>
                    </div>
                  </div>

                  {/* Animated Full Formatted Address Box */}
                  <motion.div
                    key={`waybill-addr-${addressType}`}
                    initial={{ opacity: 0.7, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-red-700">
                        {addressType === 'R'
                          ? '도로명주소 (អាសយដ្ឋានឈ្មោះផ្លូវពេញលេញ)'
                          : '지번주소 (អាសយដ្ឋានភូមិ/សង្កាត់ពេញលេញ)'}
                      </span>
                      {zonecode && <span className="font-mono tabular-nums">[{zonecode}]</span>}
                    </div>
                    {singleLineKoreaPostAddress ? (
                      <p className="text-base font-bold text-slate-900 leading-snug select-all break-keep">
                        {singleLineKoreaPostAddress}
                      </p>
                    ) : (
                      <p className="text-sm text-slate-400 py-1">
                        មិនទាន់មានទិន្នន័យអាសយដ្ឋាន (សូមស្វែងរកក្នុងតារាង 우체국 ឬបញ្ចូលថ្មី)
                      </p>
                    )}

                    {/* Reference Secondary Address */}
                    {addressType === 'R' && jibunAddress && (
                      <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/80 select-all">
                        지번 (អាសយដ្ឋានភូមិ/សង្កាត់យោង): {jibunAddress} {detailAddress}
                      </p>
                    )}
                    {addressType === 'J' && roadAddress && (
                      <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/80 select-all">
                        도로명 (អាសយដ្ឋានឈ្មោះផ្លូវយោង): {roadAddress} {detailAddress}
                      </p>
                    )}
                  </motion.div>

                  {/* Delivery Memo Box */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-500 block">
                      배송메시지 (ចំណាំសម្រាប់អ្នកដឹកជញ្ជូន 택배)
                    </span>
                    <p
                      className={`text-sm mt-0.5 select-all ${
                        fullCombinedMemo ? 'font-bold text-slate-900' : 'text-slate-400'
                      }`}
                    >
                      {fullCombinedMemo || 'មិនទាន់ជ្រើសរើសចំណាំដឹកជញ្ជូន'}
                    </p>
                  </div>

                  {/* Delivery Efficiency Checklist (우체국 Validation) */}
                  <div className="pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        ការត្រួតពិនិត្យប្រសិទ្ធភាពដឹកជញ្ជូន (우체국 기준)៖
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          validationChecks.allPassed ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {validationChecks.allPassed ? 'ត្រឹមត្រូវ ១០០% រួចរាល់ផ្ញើ' : 'សូមពិនិត្យចំណុចខ្វះខាត'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        {validationChecks.hasValidZonecode ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>កូដប្រៃសណីយ៍ ៥ខ្ទង់</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        {validationChecks.hasPrimaryAddress ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>
                          {addressType === 'R' ? 'អាសយដ្ឋាន 도로명' : 'អាសយដ្ឋាន 지번'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        {validationChecks.hasDetailUnit ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>លេខបន្ទប់/អគារ (동/호)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        {validationChecks.hasValidPhone ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        )}
                        <span>លេខទូរស័ព្ទកូរ៉េ (010)</span>
                      </div>
                    </div>
                  </div>

                  {/* Animated Primary & Secondary Copy Buttons */}
                  <div className="space-y-2.5 pt-2">
                    <motion.button
                      whileHover={{ scale: 1.015, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() =>
                        copyToClipboard(
                          fullWaybillCopyText,
                          `ទម្រង់អាសយដ្ឋានពេញលេញ (${addressType === 'R' ? '도로명' : '지번'})`,
                          'copy-full-waybill'
                        )
                      }
                      className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-red-700 hover:bg-red-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      {copiedButtonKey === 'copy-full-waybill' ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>បានចម្លងទម្រង់ពេញលេញរួចរាល់!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>
                            ចម្លងទម្រង់ពេញលេញ ({addressType === 'R' ? '도로명' : '지번'}) សម្រាប់ផ្ញើឥវ៉ាន់
                          </span>
                        </>
                      )}
                    </motion.button>

                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            singleLineKoreaPostAddress,
                            `អាសយដ្ឋានពេញ ១ជួរ (${addressType === 'R' ? '도로명' : '지번'})`,
                            'copy-single-line'
                          )
                        }
                        className="min-h-[42px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {copiedButtonKey === 'copy-single-line' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>បានចម្លង ១ជួរ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>ចម្លងតែអាសយដ្ឋាន ១ជួរ</span>
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            customerVerificationChatText,
                            'សារផ្ញើឱ្យអតិថិជនផ្ទៀងផ្ទាត់',
                            'copy-chat-verify'
                          )
                        }
                        className="min-h-[42px] px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {copiedButtonKey === 'copy-chat-verify' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>បានចម្លងសារឆាត</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>ចម្លងផ្ញើឱ្យភ្ញៀវពិនិត្យ</span>
                          </>
                        )}
                      </motion.button>
                    </div>

                    {/* Individual Field Copy Strip for Courier Apps */}
                    <div className="pt-2">
                      <span className="text-[11px] font-medium text-slate-500 block mb-1.5">
                        ចម្លងតាមប្រអប់នីមួយៗ (សម្រាប់ដាក់ក្នុងកម្មវិធី 우체국 / Coupang)៖
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => copyToClipboard(zonecode, 'កូដប្រៃសណីយ៍ ៥ខ្ទង់', 'cp-zip')}
                          className="min-h-[36px] px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-red-700 hover:text-white text-slate-800 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedButtonKey === 'cp-zip' ? 'បានចម្លង' : '우편번호'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              activeBaseAddress,
                              `អាសយដ្ឋានគោល (${addressType === 'R' ? '도로명' : '지번'})`,
                              'cp-road'
                            )
                          }
                          className="min-h-[36px] px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-red-700 hover:text-white text-slate-800 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedButtonKey === 'cp-road'
                            ? 'បានចម្លង'
                            : addressType === 'R'
                            ? '도로명주소'
                            : '지번주소'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => copyToClipboard(detailAddress, 'លេខបន្ទប់លម្អិត', 'cp-detail')}
                          className="min-h-[36px] px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-red-700 hover:text-white text-slate-800 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedButtonKey === 'cp-detail' ? 'បានចម្លង' : '상세주소'}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={() => copyToClipboard(fullCombinedMemo, 'ចំណាំដឹកជញ្ជូន', 'cp-memo')}
                          className="min-h-[36px] px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-red-700 hover:text-white text-slate-800 text-[11px] font-semibold transition-colors whitespace-nowrap cursor-pointer"
                        >
                          {copiedButtonKey === 'cp-memo' ? 'បានចម្លង' : '배송메모'}
                        </motion.button>
                      </div>
                    </div>

                    {/* Standard Bluetooth Thermal Waybill Printer (58mm / 70mm / 80mm) */}
                    <BluetoothWaybillPrinter
                      addressType={addressType}
                      recipientName={recipientName}
                      phone={phone}
                      zonecode={zonecode}
                      primaryAddress={activeBaseAddress}
                      secondaryReferenceAddress={
                        addressType === 'R'
                          ? jibunAddress
                            ? `${jibunAddress} ${detailAddress}`.trim()
                            : undefined
                          : roadAddress
                          ? `${roadAddress} ${detailAddress}`.trim()
                          : undefined
                      }
                      detailAddress={detailAddress}
                      bname={bname}
                      deliveryMemo={fullCombinedMemo}
                      onNotify={triggerToast}
                    />
                  </div>
                </div>

                {/* Save to Frequent History Footer */}
                <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      រក្សាទុកក្នុងប្រវត្តិអាសយដ្ឋានអតិថិជន (주소록 저장)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <select
                      aria-label="ប្រភេទអាសយដ្ឋាន"
                      value={saveLabelTag}
                      onChange={(e) =>
                        setSaveLabelTag(e.target.value as SavedCustomerAddress['labelTag'])
                      }
                      className="sm:col-span-5 px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-600"
                    >
                      <option value="customer">អតិថិជនទូទៅ</option>
                      <option value="vip">អតិថិជនប្រចាំ (VIP)</option>
                      <option value="dormitory">រោងចក្រ / 기숙사</option>
                      <option value="home">ផ្ទះផ្ទាល់ខ្លួន</option>
                    </select>
                    <input
                      type="text"
                      value={saveNoteKhmer}
                      onChange={(e) => setSaveNoteKhmer(e.target.value)}
                      placeholder="ចំណាំខ្លី (ប្រសិនបើមាន)..."
                      className="sm:col-span-7 px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.015, y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={handleSaveToHistory}
                    className="w-full min-h-[42px] py-2 px-4 rounded-xl bg-white hover:bg-red-50 hover:border-red-300 text-slate-900 border border-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <BookmarkPlus className="w-4 h-4 text-red-700" />
                    រក្សាទុកអាសយដ្ឋាននេះទុកប្រើលើកក្រោយ
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Detailed Khmer Explanation of Korean Address Anatomy (Synchronized with 도로명 or 지번!) */}
        <AddressAnatomySection
          addressType={addressType}
          onSwitchAddressType={setAddressType}
          zonecode={zonecode}
          sido={sido}
          sidoKhmer={sidoKhmer}
          sigungu={sigungu}
          sigunguKhmer={sigunguKhmer}
          bname={bname}
          roadName={roadName}
          jibunPart={jibunPart}
          detailAddress={detailAddress}
          buildingName={buildingName}
          onCopySegment={(text, label) => copyToClipboard(text, label)}
        />

        {/* Saved Frequent Customer Addresses History */}
        <SavedAddressesSection
          savedAddresses={savedAddresses}
          onLoadAddress={handleLoadFromHistory}
          onToggleFavorite={handleToggleFavorite}
          onDeleteAddress={handleDeleteAddress}
          onCopyFullFromHistory={handleCopyFullFromHistory}
          onScrollToBuilder={focusOfficialSearchInput}
        />

        {/* Korea Post Delivery Efficiency Guide */}
        <KoreaPostGuideSection />
      </main>

      {/* Clean Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2.5">
            <KoreaPostEmblem className="w-8 h-8" />
            <div>
              <span className="font-bold text-slate-900">K-Post Khmer · 우편주소 표준화 시스템</span>
              <span className="mx-2">·</span>
              <span>ប្រព័ន្ធស្វែងរក និងរៀបចំអាសយដ្ឋានផ្ញើឥវ៉ាន់តាមស្តង់ដារប្រៃសណីយ៍កូរ៉េ</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="#builder-workspace" className="hover:text-slate-900">
              ស្វែងរក 우체국 ផ្លូវការ
            </a>
            <span>·</span>
            <a href="#anatomy-section" className="hover:text-slate-900">
              រចនាសម្ព័ន្ធអាសយដ្ឋាន
            </a>
            <span>·</span>
            <a href="#history-section" className="hover:text-slate-900">
              ប្រវត្តិអាសយដ្ឋាន
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar (Ergonomic Thumb Zone for Android & iOS) */}
      <nav
        aria-label="ម៉ឺនុយទូរស័ព្ទ"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-3 items-center h-14 px-2"
      >
        <button
          type="button"
          onClick={focusOfficialSearchInput}
          className="flex flex-col items-center justify-center h-full text-red-700 cursor-pointer"
        >
          <Search className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5">ស្វែងរក 우체국 ផ្លូវការ</span>
        </button>
        <a
          href="#anatomy-section"
          className="flex flex-col items-center justify-center h-full text-slate-700 hover:text-red-700"
        >
          <BookOpen className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5">ការពន្យល់ខ្មែរ</span>
        </a>
        <a
          href="#history-section"
          className="flex flex-col items-center justify-center h-full text-slate-700 hover:text-red-700"
        >
          <History className="w-4 h-4" />
          <span className="text-[10px] font-semibold mt-0.5">ប្រវត្តិ ({savedAddresses.length})</span>
        </a>
      </nav>
    </div>
  );
}
