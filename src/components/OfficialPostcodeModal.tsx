import React, { useEffect, useRef, useState } from 'react';
import { X, Search, MapPin, CheckCircle2 } from 'lucide-react';
import { KOREAN_ADDRESS_DIRECTORY, AddressRecord } from '../data/koreanAddresses';

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: DaumPostcodeData) => void;
        width?: string | number;
        height?: string | number;
      }) => {
        embed: (element: HTMLElement, options?: { autoClose?: boolean }) => void;
      };
    };
  }
}

export interface DaumPostcodeData {
  zonecode: string;
  address: string;
  addressType?: 'R' | 'J';
  userSelectedType?: 'R' | 'J';
  roadAddress: string;
  autoRoadAddress?: string;
  jibunAddress: string;
  autoJibunAddress?: string;
  sido: string;
  sigungu: string;
  bname: string;
  bname1?: string;
  bname2?: string;
  roadname: string;
  buildingName: string;
  apartment: string;
}

interface OfficialPostcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (data: {
    zonecode: string;
    roadAddress: string;
    jibunAddress: string;
    sido: string;
    sigungu: string;
    bname: string;
    roadName: string;
    buildingName: string;
    sampleDetail?: string;
  }) => void;
}

export const OfficialPostcodeModal: React.FC<OfficialPostcodeModalProps> = ({
  isOpen,
  onClose,
  onSelectAddress
}) => {
  const embedRef = useRef<HTMLDivElement>(null);
  const [sdkReady, setSdkReady] = useState<boolean>(false);
  const [fallbackQuery, setFallbackQuery] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (window.daum && window.daum.Postcode && embedRef.current) {
        try {
          embedRef.current.innerHTML = '';
          const postcode = new window.daum.Postcode({
            width: '100%',
            height: '100%',
            oncomplete: (data: DaumPostcodeData) => {
              const roadPart = data.roadAddress
                .replace(data.sido, '')
                .replace(data.sigungu, '')
                .trim();

              onSelectAddress({
                zonecode: data.zonecode,
                roadAddress: data.roadAddress || data.address,
                jibunAddress: data.jibunAddress || '',
                sido: data.sido,
                sigungu: data.sigungu,
                bname: data.bname,
                roadName: roadPart || data.roadname,
                buildingName: data.buildingName || ''
              });
              onClose();
            }
          });
          postcode.embed(embedRef.current, { autoClose: false });
          setSdkReady(true);
        } catch {
          setSdkReady(false);
        }
      } else {
        setSdkReady(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, onClose, onSelectAddress]);

  if (!isOpen) return null;

  const filteredDirectory = KOREAN_ADDRESS_DIRECTORY.filter((item) => {
    if (!fallbackQuery.trim()) return true;
    const q = fallbackQuery.toLowerCase();
    return (
      item.roadAddress.toLowerCase().includes(q) ||
      item.jibunAddress.toLowerCase().includes(q) ||
      item.zonecode.includes(q) ||
      item.sidoKhmer.toLowerCase().includes(q) ||
      item.sigunguKhmer.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  const handlePickRecord = (rec: AddressRecord) => {
    onSelectAddress({
      zonecode: rec.zonecode,
      roadAddress: rec.roadAddress,
      jibunAddress: rec.jibunAddress,
      sido: rec.sido,
      sigungu: rec.sigungu,
      bname: rec.bname,
      roadName: rec.roadName,
      buildingName: rec.buildingName,
      sampleDetail: rec.sampleDetail
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="postcode-modal-title"
    >
      <div className="w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 id="postcode-modal-title" className="text-base font-bold text-slate-900">
              ស្វែងរកអាសយដ្ឋានផ្លូវការតាមប្រៃសណីយ៍កូរ៉េ (우체국 도로명주소)
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              វាយឈ្មោះផ្លូវ (도로명) ឬឈ្មោះសង្កាត់ (동/읍/면) ជាអក្សរកូរ៉េ ឬជ្រើសរើសពីតំបន់ពេញនិយមខាងក្រោម
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
            aria-label="បិទផ្ទាំងស្វែងរក"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Khmer/Korean Region Presets */}
        <div className="px-5 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              ជ្រើសរើសរហ័សតាមតំបន់ពលករខ្មែររស់នៅច្រើន (អាចស្វែងរកជាភាសាខ្មែរ ឬកូរ៉េ)៖
            </span>
          </div>
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={fallbackQuery}
              onChange={(e) => setFallbackQuery(e.target.value)}
              placeholder="វាយឈ្មោះតំបន់ ឧ. អាន់សាន់, គីមហេ, ហ្វាសង់, 안산, 김해, 15380..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 focus:bg-white transition-colors"
            />
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-slate-50/50">
            {filteredDirectory.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePickRecord(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-red-50/70 transition-colors flex items-center justify-between gap-3 group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="font-mono font-bold text-red-700 tabular-nums">[{item.zonecode}]</span>
                    <span>·</span>
                    <span className="font-medium text-slate-900 truncate">{item.regionTagKhmer}</span>
                    <span>·</span>
                    <span className="truncate">{item.categoryKhmer}</span>
                  </div>
                  <div className="text-sm font-semibold text-slate-900 mt-0.5 truncate">
                    {item.roadAddress} <span className="text-slate-500 font-normal">({item.bname}, {item.buildingName})</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-red-700 group-hover:translate-x-0.5 transition-transform whitespace-nowrap shrink-0 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  ជ្រើសរើស
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Daum / Korea Post Embed Container */}
        <div className="flex-1 min-h-[340px] bg-slate-100 relative">
          <div ref={embedRef} className="w-full h-[360px]" />
          {!sdkReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-50">
              <MapPin className="w-8 h-8 text-red-600 mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                ប្រព័ន្ធទិន្នន័យកូដប្រៃសណីយ៍កូរ៉េ (우체국) រួចរាល់សម្រាប់ជ្រើសរើសខាងលើ
              </p>
              <p className="text-xs text-slate-600 mt-1 max-w-md">
                លោកអ្នកអាចចុចជ្រើសរើសអាសយដ្ឋានគំរូតាមតំបន់ខាងលើ ឬបិទផ្ទាំងនេះដើម្បីបិទភ្ជាប់ (Paste) អាសយដ្ឋានរបស់អតិថិជនដោយផ្ទាល់។
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
