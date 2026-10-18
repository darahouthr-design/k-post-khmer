import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MapPin,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import {
  AddressRecord,
  validateAndCorrectKoreanAddress,
  AddressValidationDiagnosis
} from '../data/koreanAddresses';
import { DaumPostcodeData } from './OfficialPostcodeModal';

interface DaumThemeConfig {
  bgColor?: string;
  searchBgColor?: string;
  contentBgColor?: string;
  pageBgColor?: string;
  textColor?: string;
  queryTextColor?: string;
  postcodeTextColor?: string;
  emphTextColor?: string;
  outlineColor?: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        width?: string | number;
        height?: string | number;
        theme?: DaumThemeConfig;
      }) => {
        embed: (element: HTMLElement, options?: { q?: string; autoClose?: boolean }) => void;
      };
    };
  }
}

export interface OfficialAddressSelectionPayload {
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  sido: string;
  sigungu: string;
  bname: string;
  roadName: string;
  jibunPart: string;
  buildingName: string;
  preservedDetail?: string;
  selectedType: 'R' | 'J';
}

interface InlineOfficialPostcodeProps {
  isDarkMode?: boolean;
  addressType: 'R' | 'J';
  onSwitchAddressType: (type: 'R' | 'J') => void;
  onSelectOfficialAddress: (data: OfficialAddressSelectionPayload) => void;
  onSelectDirectoryRecord: (rec: AddressRecord, selectedType?: 'R' | 'J') => void;
  externalSearchTrigger?: { query: string; detail?: string; timestamp: number } | null;
  resetTrigger?: number;
}

const DARK_DAUM_THEME: DaumThemeConfig = {
  bgColor: '#0F172A',
  searchBgColor: '#1E293B',
  contentBgColor: '#131C31',
  pageBgColor: '#0F172A',
  textColor: '#F8FAFC',
  queryTextColor: '#F8FAFC',
  postcodeTextColor: '#F87171',
  emphTextColor: '#60A5FA',
  outlineColor: '#334155'
};

export const InlineOfficialPostcode: React.FC<InlineOfficialPostcodeProps> = ({
  isDarkMode = false,
  addressType,
  onSwitchAddressType,
  onSelectOfficialAddress,
  onSelectDirectoryRecord,
  externalSearchTrigger,
  resetTrigger
}) => {
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const [pendingDetail, setPendingDetail] = useState<string>('');
  const [sdkLoaded, setSdkLoaded] = useState<boolean>(false);
  const [activeQueryLabel, setActiveQueryLabel] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<AddressValidationDiagnosis | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isReloading, setIsReloading] = useState<boolean>(false);

  const pendingDetailRef = useRef<string>('');
  useEffect(() => {
    pendingDetailRef.current = pendingDetail;
  }, [pendingDetail]);

  const activeQueryRef = useRef<string>('');
  useEffect(() => {
    activeQueryRef.current = activeQueryLabel;
  }, [activeQueryLabel]);

  // Keep latest callback in a ref so parent re-renders never recreate or detach the embedded iframe
  const onSelectOfficialRef = useRef(onSelectOfficialAddress);
  useEffect(() => {
    onSelectOfficialRef.current = onSelectOfficialAddress;
  }, [onSelectOfficialAddress]);

  const isDarkRef = useRef(isDarkMode);
  useEffect(() => {
    isDarkRef.current = isDarkMode;
  }, [isDarkMode]);

  const embedOfficialSearch = useCallback((queryText: string, forceDark?: boolean) => {
    if (!embedContainerRef.current) return;
    const trimmedQuery = queryText.trim();
    setActiveQueryLabel(trimmedQuery);
    activeQueryRef.current = trimmedQuery;

    const useDarkTheme = forceDark !== undefined ? forceDark : isDarkRef.current;

    if (window.daum && window.daum.Postcode) {
      try {
        embedContainerRef.current.innerHTML = '';
        const postcode = new window.daum.Postcode({
          width: '100%',
          height: '100%',
          theme: useDarkTheme ? DARK_DAUM_THEME : undefined,
          oncomplete: (data: DaumPostcodeData) => {
            const chosenType: 'R' | 'J' = data.userSelectedType === 'J' ? 'J' : 'R';
            const fullRoad = data.roadAddress || data.autoRoadAddress || data.address || '';
            const fullJibun = data.jibunAddress || data.autoJibunAddress || data.address || '';

            const roadPart = fullRoad
              .replace(data.sido, '')
              .replace(data.sigungu, '')
              .trim();

            const jibunPart = fullJibun
              .replace(data.sido, '')
              .replace(data.sigungu, '')
              .trim();

            const combinedBname = [data.bname1, data.bname2 || data.bname]
              .filter(Boolean)
              .join(' ')
              .trim();

            // Defer React state update until Daum's internal postMessage event handler completes
            setTimeout(() => {
              onSelectOfficialRef.current({
                zonecode: data.zonecode,
                roadAddress: fullRoad,
                jibunAddress: fullJibun,
                sido: data.sido,
                sigungu: data.sigungu,
                bname: combinedBname || data.bname,
                roadName: roadPart || data.roadname,
                jibunPart: jibunPart || combinedBname || data.bname,
                buildingName: data.buildingName || '',
                preservedDetail: pendingDetailRef.current || undefined,
                selectedType: chosenType
              });
            }, 0);
          }
        });
        postcode.embed(embedContainerRef.current, {
          q: trimmedQuery || undefined,
          autoClose: false
        });
        setSdkLoaded(true);
      } catch {
        setSdkLoaded(false);
      }
    } else {
      setSdkLoaded(false);
    }
  }, []);

  // Initial mount: embed the official Korea Post search once on page load
  useEffect(() => {
    let attempts = 0;
    let timerId: number | undefined;
    const tryInit = () => {
      if (window.daum && window.daum.Postcode && embedContainerRef.current) {
        embedOfficialSearch('', isDarkRef.current);
      } else if (attempts < 15) {
        attempts += 1;
        timerId = window.setTimeout(tryInit, 200);
      }
    };
    tryInit();
    return () => {
      if (timerId !== undefined) {
        window.clearTimeout(timerId);
      }
    };
  }, [embedOfficialSearch]);

  // Re-apply Daum Postcode theme when Dark Mode is toggled
  const didMountRef = useRef(false);
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    if (sdkLoaded) {
      embedOfficialSearch(activeQueryRef.current, isDarkMode);
    }
  }, [isDarkMode, sdkLoaded, embedOfficialSearch]);

  // Listen to external search triggers (e.g. when user pastes customer message below)
  useEffect(() => {
    if (externalSearchTrigger && externalSearchTrigger.query) {
      if (externalSearchTrigger.detail !== undefined) {
        setPendingDetail(externalSearchTrigger.detail);
        pendingDetailRef.current = externalSearchTrigger.detail;
      }
      const diag = validateAndCorrectKoreanAddress(externalSearchTrigger.query);
      setDiagnosis(diag);
      embedOfficialSearch(diag.correctedQuery || externalSearchTrigger.query);
    }
  }, [externalSearchTrigger, embedOfficialSearch]);

  // Listen to resetTrigger to wipe all search state clean
  useEffect(() => {
    if (resetTrigger && resetTrigger > 0) {
      setPendingDetail('');
      pendingDetailRef.current = '';
      setActiveQueryLabel('');
      setDiagnosis(null);
      embedOfficialSearch('');
    }
  }, [resetTrigger, embedOfficialSearch]);

  const handleReloadTable = () => {
    setIsReloading(true);
    setDiagnosis(null);
    setActiveQueryLabel('');
    embedOfficialSearch('');
    setTimeout(() => setIsReloading(false), 450);
  };

  return (
    <motion.div
      id="official-postcode-table"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow duration-300"
    >
      {/* Top Header & UI Action Buttons Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block truncate">
              តារាងស្វែងរកអាសយដ្ឋាន 우체국 ផ្លូវការផ្ទាល់
            </span>
            {activeQueryLabel && (
              <span className="block text-[11px] font-medium text-red-700 truncate">
                កំពុងបង្ហាញលទ្ធផល៖ &ldquo;{activeQueryLabel}&rdquo;
              </span>
            )}
          </div>
        </div>

        {/* Interactive UI Buttons inside Official Table Header */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Mode Switcher Buttons (도로명 vs 지번) */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onSwitchAddressType('R')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                addressType === 'R'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              도로명 (ឈ្មោះផ្លូវ)
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => onSwitchAddressType('J')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                addressType === 'J'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              지번 (ភូមិ/សង្កាត់)
            </motion.button>
          </div>

          {/* Expand / Collapse Table Height Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="min-h-[32px] px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title={isExpanded ? 'បង្រួមតារាង' : 'ពង្រីកតារាងឱ្យធំ'}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">បង្រួម</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">ពង្រីក</span>
              </>
            )}
          </motion.button>

          {/* Reload / Reset Official Table Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleReloadTable}
            className="min-h-[32px] px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-700 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin text-red-700' : ''}`} />
            <span>ផ្ទុកឡើងវិញ</span>
          </motion.button>
        </div>
      </div>

      {/* Animated Address Error Detection & Auto-Correction Banner */}
      <AnimatePresence mode="wait">
        {diagnosis && diagnosis.hasIssue && (
          <motion.div
            key="diagnosis-error-banner"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="p-3.5 bg-amber-50/90 border-b border-amber-200 space-y-2.5 overflow-hidden"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-950">
                  បញ្ជាក់កំហុសអាសយដ្ឋាន និងការកែតម្រូវតាមស្តង់ដារ 우체국៖
                </p>
                <p className="text-amber-900">
                  អាសយដ្ឋានដែលបានស្វែងរក៖{' '}
                  <span className="font-mono line-through text-red-700 font-semibold">
                    {diagnosis.originalInput}
                  </span>
                </p>
                <ul className="list-disc list-inside text-amber-900 space-y-0.5">
                  {diagnosis.issueMessagesKhmer.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
                {diagnosis.correctedQuery && !diagnosis.isUnrecognized && (
                  <p className="text-emerald-900 font-semibold pt-1">
                    អាសយដ្ឋានគោលដែលត្រឹមត្រូវសម្រាប់ស្វែងរក៖{' '}
                    <span className="font-mono font-bold underline">
                      {diagnosis.correctedQuery}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Animated Quick Selectable Official Address Result Card Items */}
      <AnimatePresence>
        {diagnosis && diagnosis.matchedRecords.length > 0 && (
          <motion.div
            key="diagnosis-matched-records"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="p-3.5 bg-[#FAF9F6] border-b border-slate-200 space-y-2.5"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                អាសយដ្ឋានផ្លូវការដែលត្រឹមត្រូវ (សូមចុចជ្រើសរើសទម្រង់ 도로명 ឬ 지번)៖
              </span>
            </div>

            <div className="space-y-2">
              {diagnosis.matchedRecords.map((rec, idx) => (
                <motion.div
                  key={rec.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.25 }}
                  whileHover={{ y: -2 }}
                  className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 shadow-2xs hover:shadow-xs transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono font-bold text-red-700 text-sm tabular-nums">
                        {rec.zonecode}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-semibold text-slate-800">{rec.regionTagKhmer}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-600">{rec.buildingName}</span>
                    </div>
                  </div>

                  {/* Option 1: Select Road Name Address (도로명주소) */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-xs sm:text-sm text-slate-900 min-w-0">
                      <span className="inline-block font-mono text-[11px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded mr-2">
                        도로명
                      </span>
                      <span className="font-semibold">{rec.roadAddress}</span>
                      <span className="text-slate-500 text-xs ml-1">({rec.bname})</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => onSelectDirectoryRecord(rec, 'R')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        addressType === 'R'
                          ? 'bg-red-700 hover:bg-red-800 text-white shadow-xs'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      ជ្រើសរើស 도로명
                    </motion.button>
                  </div>

                  {/* Option 2: Select Jibun Address (지번주소) */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="text-xs sm:text-sm text-slate-800 min-w-0">
                      <span className="inline-block font-mono text-[11px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mr-2">
                        지번
                      </span>
                      <span className="font-semibold">{rec.jibunAddress}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      type="button"
                      onClick={() => onSelectDirectoryRecord(rec, 'J')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        addressType === 'J'
                          ? 'bg-red-700 hover:bg-red-800 text-white shadow-xs'
                          : 'border border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      ជ្រើសរើស 지번
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Embedded Korea Post / Daum Postcode Container */}
      <motion.div
        animate={{ height: isExpanded ? 560 : 420 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative w-full bg-slate-50"
      >
        <div ref={embedContainerRef} className="w-full h-full" />
        {!sdkLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
            <MapPin className="w-7 h-7 text-red-600 mb-2 animate-bounce" />
            <p className="text-xs sm:text-sm font-semibold text-slate-800">
              កំពុងផ្ទុកតារាងស្វែងរកអាសយដ្ឋាន 우체국 ផ្លូវការផ្ទាល់...
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
