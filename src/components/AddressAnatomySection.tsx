import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Check, BookOpen, CheckCircle2, AlertTriangle } from 'lucide-react';

interface AddressAnatomyProps {
  addressType: 'R' | 'J';
  onSwitchAddressType: (type: 'R' | 'J') => void;
  zonecode: string;
  sido: string;
  sidoKhmer: string;
  sigungu: string;
  sigunguKhmer: string;
  bname: string;
  roadName: string;
  jibunPart: string;
  detailAddress: string;
  buildingName: string;
  onCopySegment: (text: string, label: string) => void;
}

interface TermDictionaryItem {
  korean: string;
  pronunciation: string;
  khmerMeaning: string;
  example: string;
  courierRole: string;
}

const KOREAN_ADDRESS_TERMS: TermDictionaryItem[] = [
  {
    korean: '우편번호',
    pronunciation: 'អ៊ូ-ផ្យន់-បន-ហូ',
    khmerMeaning: 'លេខកូដប្រៃសណីយ៍ (៥ខ្ទង់)',
    example: '15380, 10040, 50918',
    courierRole: 'កំណត់មណ្ឌលបែងចែកឥវ៉ាន់របស់ប្រៃសណីយ៍កូរ៉េ (우체국 물류센터) ដោយស្វ័យប្រវត្តិ'
  },
  {
    korean: '시 / 도 (특별/광역시)',
    pronunciation: 'ស៊ី / ដូ',
    khmerMeaning: 'ទីក្រុងធំ ឬ ខេត្ត',
    example: '경기도 (ខេត្តខ្យងគី), 서울특별시 (សេអ៊ូល), 경상남도 (ខ្យងណាំ)',
    courierRole: 'កំណត់តំបន់ធំ ឬខេត្តគោលដៅនៅទូទាំងប្រទេសកូរ៉េ'
  },
  {
    korean: '시 / 군 / 구',
    pronunciation: 'ស៊ី / គុន / គូ',
    khmerMeaning: 'ក្រុង / ស្រុក / ខណ្ឌ',
    example: '안산시 단원구, 김포시, 달성군',
    courierRole: 'កំណត់សាខាប្រៃសណីយ៍ប្រចាំតំបន់ដែលទទួលបន្ទុកដឹកជញ្ជូន'
  },
  {
    korean: '읍 / 면 / 동 / 리 + 번지 (지번)',
    pronunciation: 'អ៊ឹប / ម្យ៉ន / ដុង / រី + បន-ជី',
    khmerMeaning: 'ទីប្រជុំជន / ឃុំ / សង្កាត់ / ភូមិ និងលេខដីឡូត៍ (지번주소)',
    example: '대곶면 송마리 38-2, 원곡동 785-1',
    courierRole: 'ជាទម្រង់អាសយដ្ឋានភូមិ/សង្កាត់ និងលេខដីឡូត៍ (지번주소) សម្រាប់សម្គាល់ទីតាំងដី និងអគារ'
  },
  {
    korean: '대로 / 로 / 길 / 번길 (도로명)',
    pronunciation: 'ដេរ៉ូ / រ៉ូ / គីល / បនគីល',
    khmerMeaning: 'មហាវិថី / ផ្លូវធំ / ផ្លូវតូច / ផ្លូវបំបែក (도로명주소)',
    example: '송마로 129-59, 발안공단로 92-12, 다문화길 24',
    courierRole: 'ជាទម្រង់អាសយដ្ឋានឈ្មោះផ្លូវ និងលេខអគារ (도로명주소) តាមប្រព័ន្ធផ្លូវការថ្មី'
  },
  {
    korean: '동 / 층 / 호',
    pronunciation: 'ដុង / ឈឹង / ហូ',
    khmerMeaning: 'លេខអគារ (ប្លុក) / ជាន់ទី / បន្ទប់លេខ',
    example: '102동 3층 304호 (អគារ 102 ជាន់ទី3 បន្ទប់ 304)',
    courierRole: 'សំខាន់បំផុត! បើគ្មានលេខបន្ទប់ (호) អ្នកដឹកជញ្ជូនមិនដឹងដាក់មុខបន្ទប់ណាឡើយ'
  },
  {
    korean: '지하 (B) / 옥탑',
    pronunciation: 'ជី-ហា / អុក-ថាប់',
    khmerMeaning: 'ជាន់ក្រោមដី (Basement) / បន្ទប់លើដំបូល',
    example: '지하 101호 (B01호), 옥탑방',
    courierRole: 'ប្រាប់អ្នកដឹកជញ្ជូនឱ្យចុះជណ្តើរក្រោមដី ឬឡើងទៅជាន់ដំបូល'
  },
  {
    korean: '기숙사 / (주) 회사 / 빌라',
    pronunciation: 'គីស៊ុកសា / ជូ-ហ្វេសា / វីឡា',
    khmerMeaning: 'អន្តេវាសិកដ្ឋានរោងចក្រ / ក្រុមហ៊ុន / វីឡាបន្ទប់ជួល',
    example: '(주) 다승, 태광기숙사 B동 204호, 한마음빌라 201호',
    courierRole: 'ជួយឱ្យអ្នកដឹកជញ្ជូនស្គាល់ប្រភេទអគារ រោងចក្រ និងទីតាំងទម្លាក់ឥវ៉ាន់បានរហ័ស'
  }
];

export const AddressAnatomySection: React.FC<AddressAnatomyProps> = ({
  addressType,
  onSwitchAddressType,
  zonecode,
  sido,
  sidoKhmer,
  sigungu,
  sigunguKhmer,
  bname,
  roadName,
  jibunPart,
  detailAddress,
  buildingName,
  onCopySegment
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string, label: string) => {
    if (!text) return;
    onCopySegment(text, label);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const refRoadMode = [bname, buildingName && !detailAddress.includes(buildingName) ? buildingName : '']
    .filter(Boolean)
    .join(', ');

  const refJibunMode = [roadName, buildingName && !detailAddress.includes(buildingName) ? buildingName : '']
    .filter(Boolean)
    .join(', ');

  const effectiveJibunCore = jibunPart.trim() || bname.trim();

  const segments = [
    {
      id: 'seg-zonecode',
      index: '01',
      koreanLabel: '우편번호 (Zonecode)',
      khmerTitle: 'កូដប្រៃសណីយ៍ ៥ខ្ទង់',
      rawValue: zonecode.trim(),
      value: zonecode.trim() || 'មិនទាន់មានទិន្នន័យ',
      isMono: true,
      explanationKhmer:
        'លេខកូដ ៥ខ្ទង់ផ្លូវការរបស់ប្រៃសណីយ៍កូរ៉េ (우체국)។ រាល់ពេលផ្ញើឥវ៉ាន់តាមប្រៃសណីយ៍ ឬម៉ាស៊ីនក្នុងម៉ាត (CU/GS25) ប្រព័ន្ធនឹងទាមទារលេខ ៥ខ្ទង់នេះមុនគេ។',
      pronunciationTip: 'អានថា៖ អ៊ូ-ផ្យន់-បន-ហូ (៥ខ្ទង់ជំនួសឱ្យទម្រង់ចាស់ ៦ខ្ទង់)',
      isComplete: /^\d{5}$/.test(zonecode.trim())
    },
    {
      id: 'seg-sido',
      index: '02',
      koreanLabel: '시/도 (Province / Metro City)',
      khmerTitle: 'ទីក្រុងធំ ឬ ខេត្ត',
      rawValue: sido.trim(),
      value: sido.trim() || 'មិនទាន់មានទិន្នន័យ',
      subValueKhmer: sido.trim() ? sidoKhmer : '',
      isMono: false,
      explanationKhmer:
        'បង្ហាញពីខេត្ត (도) ឬទីក្រុងពិសេស (특별시/광역시)។ ឧទាហរណ៍៖ 경기도 (ខេត្តខ្យងគី), 경상남도 (ខេត្តខ្យងសាំងខាងត្បូង), 서울특별시 (ទីក្រុងសេអ៊ូល)។',
      pronunciationTip: 'ពាក្យបញ្ចប់ដោយ -도 គឺខេត្ត / បញ្ចប់ដោយ -시 គឺទីក្រុង',
      isComplete: Boolean(sido.trim())
    },
    {
      id: 'seg-sigungu',
      index: '03',
      koreanLabel: '시/군/구 (City / County / District)',
      khmerTitle: 'ក្រុង / ស្រុក / ខណ្ឌ',
      rawValue: sigungu.trim(),
      value: sigungu.trim() || 'មិនទាន់មានទិន្នន័យ',
      subValueKhmer: sigungu.trim() ? sigunguKhmer : '',
      isMono: false,
      explanationKhmer:
        'បញ្ជាក់ក្រុង (시), ស្រុក (군), និងខណ្ឌ (구)។ ទីក្រុងធំៗក្នុងខេត្តតែងមានទាំងឈ្មោះក្រុង និងឈ្មោះខណ្ឌបន្តគ្នា ដូចជា 안산시 단원구 ឬ 김포시។',
      pronunciationTip: '-시 (ក្រុង) · -군 (ស្រុក) · -구 (ខណ្ឌ)',
      isComplete: Boolean(sigungu.trim())
    },
    addressType === 'R'
      ? {
          id: 'seg-road',
          index: '04',
          koreanLabel: '도로명 + 건물번호 (Road & Building No.)',
          khmerTitle: 'ឈ្មោះផ្លូវ និងលេខអគារ (ទម្រង់ 도로명주소)',
          rawValue: roadName.trim(),
          value: roadName.trim() || 'មិនទាន់មានទិន្នន័យ',
          isMono: false,
          explanationKhmer:
            'ជាផ្នែកស្នូលនៃអាសយដ្ឋានឈ្មោះផ្លូវ (도로명주소)។ ផ្សំឡើងពីឈ្មោះផ្លូវ (បញ្ចប់ដោយ 대로, 로, ឬ 길) បូកនឹងលេខសម្គាល់អគារនៅតាមបណ្តោយផ្លូវនោះ។',
          pronunciationTip: '-대로 (មហាវិថីធំ) · -로 (ផ្លូវកណ្តាល) · -길 (ផ្លូវតូច/ឌឿងហែម)',
          isComplete: Boolean(roadName.trim())
        }
      : {
          id: 'seg-jibun',
          index: '04',
          koreanLabel: '읍/면/동/리 + 번지 (Jibun Lot No.)',
          khmerTitle: 'ឈ្មោះឃុំ/សង្កាត់/ភូមិ និងលេខដីឡូត៍ (ទម្រង់ 지번주소)',
          rawValue: effectiveJibunCore,
          value: effectiveJibunCore || 'មិនទាន់មានទិន្នន័យ',
          isMono: false,
          explanationKhmer:
            'ជាផ្នែកស្នូលនៃអាសយដ្ឋានភូមិ/សង្កាត់ និងលេខដីឡូត៍ (지번주소)។ ផ្សំឡើងពីឈ្មោះទីប្រជុំជន (읍), ឃុំ (면), សង្កាត់ (동), ភូមិ (리) បូកនឹងលេខដីឡូត៍ (번지 ឧ. 38-2 ឬ 785-1)។',
          pronunciationTip: '-읍 (ទីប្រជុំជន) · -면 (ឃុំ) · -동 (សង្កាត់) · -리 (ភូមិ) + លេខដី',
          isComplete: Boolean(effectiveJibunCore)
        },
    {
      id: 'seg-detail',
      index: '05',
      koreanLabel: '상세주소 (Detailed Unit: 동/층/호)',
      khmerTitle: 'អាសយដ្ឋានលម្អិត (ក្រុមហ៊ុន / អគារ / ជាន់ / បន្ទប់)',
      rawValue: detailAddress.trim(),
      value: detailAddress.trim() || 'មិនទាន់មានទិន្នន័យ',
      isMono: false,
      explanationKhmer:
        'សំខាន់បំផុតសម្រាប់អ្នកដឹកជញ្ជូន (택배 기사님)! ត្រូវបញ្ជាក់ឈ្មោះក្រុមហ៊ុន/រោងចក្រ ឈ្មោះវីឡា/អន្តេវាសិកដ្ឋាន លេខអគារ (동) ជាន់ (층) និងលេខបន្ទប់ (호) ឱ្យច្បាស់។',
      pronunciationTip: '(주) (ក្រុមហ៊ុន) · 동 (អគារ/ប្លុក) · 층 (ជាន់) · 호 (លេខបន្ទប់)',
      isComplete: Boolean(detailAddress.trim())
    },
    addressType === 'R'
      ? {
          id: 'seg-ref',
          index: '06',
          koreanLabel: '참고항목 (Reference Dong & Building)',
          khmerTitle: 'សង្កាត់/ភូមិ និងឈ្មោះអគារយោង (ក្នុងវង់ក្រចក)',
          rawValue: refRoadMode ? `(${refRoadMode})` : '',
          value: refRoadMode ? `(${refRoadMode})` : 'មិនទាន់មានទិន្នន័យ',
          isMono: false,
          explanationKhmer:
            'នៅពេលប្រើទម្រង់ឈ្មោះផ្លូវ (도로명주소) ប្រៃសណីយ៍កូរ៉េតែងដាក់ឈ្មោះសង្កាត់/ឃុំ (동/읍/면) នៅក្នុងវង់ក្រចកខាងចុងអាសយដ្ឋាន ដើម្បីងាយស្រួលផ្ទៀងផ្ទាត់។',
          pronunciationTip: 'ដាក់ក្នុងវង់ក្រចកខាងចុង ឧ. (대곶면) ឬ (원곡동)',
          isComplete: Boolean(refRoadMode)
        }
      : {
          id: 'seg-ref-road',
          index: '06',
          koreanLabel: '참고 도로명 (Reference Road Name)',
          khmerTitle: 'អាសយដ្ឋានឈ្មោះផ្លូវយោង (도로명 참고)',
          rawValue: refJibunMode ? `(${refJibunMode})` : '',
          value: refJibunMode ? `(${refJibunMode})` : 'មិនទាន់មានទិន្នន័យ',
          isMono: false,
          explanationKhmer:
            'នៅពេលជ្រើសរើសប្រើទម្រង់ 지번주소 (ភូមិ/សង្កាត់ + លេខដីឡូត៍) ឈ្មោះផ្លូវ (도로명) ត្រូវបានរក្សាទុកជាព័ត៌មានយោងជំនួយដល់អ្នកដឹកជញ្ជូន។',
          pronunciationTip: 'ឈ្មោះផ្លូវយោង ឧ. (송마로 129-59) ឬ (다문화길 24)',
          isComplete: Boolean(refJibunMode)
        }
  ];

  return (
    <section id="anatomy-section" className="space-y-8">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-red-700 tracking-wide">
            មគ្គុទ្ទេសក៍ពន្យល់រចនាសម្ព័ន្ធផ្លូវការ · KOREA POST (우체국) STANDARD
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            ការពន្យល់លម្អិតជាភាសាខ្មែរពីរចនាសម្ព័ន្ធអាសយដ្ឋានកូរ៉េ (
            {addressType === 'R' ? '도로명주소' : '지번주소'})
          </h2>
        </div>

        {/* Interactive Animated Mode Switcher between 도로명 and 지번 */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onSwitchAddressType('R')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              addressType === 'R'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ទម្រង់ 도로명 (ឈ្មោះផ្លូវ)
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={() => onSwitchAddressType('J')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
              addressType === 'J'
                ? 'bg-red-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ទម្រង់ 지번 (ភូមិ/សង្កាត់)
          </motion.button>
        </div>
      </div>

      {/* Visual Formula Strip with Animated Segment Card Items */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-600 shrink-0" />
            {addressType === 'R'
              ? 'រូបមន្តទម្រង់អាសយដ្ឋានឈ្មោះផ្លូវ 도로명주소 (우편번호 + 시/도 + 시/군/구 + 도로명 + 상세주소)'
              : 'រូបមន្តទម្រង់អាសយដ្ឋានភូមិ/សង្កាត់ 지번주소 (우편번호 + 시/도 + 시/군/구 + 읍/면/동/리 번지 + 상세주소)'}
          </h3>
          <span className="text-xs text-slate-500 hidden md:inline">
            ចុចលើប្រអប់នីមួយៗខាងក្រោមដើម្បីចម្លងផ្នែកនោះដាច់ដោយឡែក
          </span>
        </div>

        {/* Formula Sequence Animated Card Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {segments.map((seg, idx) => (
              <motion.div
                layout
                key={seg.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                whileHover={{ y: -3 }}
                className="border border-slate-200 rounded-xl p-4 bg-[#FAF9F6] hover:bg-white hover:border-red-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-mono font-bold text-slate-900">
                      {seg.index}. {seg.koreanLabel}
                    </span>
                    {seg.isComplete ? (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        គ្រប់គ្រាន់
                      </span>
                    ) : (
                      <span className="text-amber-700 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        មិនទាន់បញ្ចូល
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">{seg.khmerTitle}</h4>

                  <div className="mt-2.5 p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div
                        className={`text-sm font-bold truncate ${
                          !seg.rawValue
                            ? 'text-slate-400 font-normal'
                            : seg.isMono
                            ? 'font-mono text-red-700 tabular-nums text-base'
                            : 'text-slate-900'
                        }`}
                      >
                        {seg.value}
                      </div>
                      {seg.subValueKhmer && (
                        <div className="text-xs text-slate-500 truncate mt-0.5">{seg.subValueKhmer}</div>
                      )}
                    </div>
                    <motion.button
                      whileHover={seg.rawValue ? { scale: 1.05 } : undefined}
                      whileTap={seg.rawValue ? { scale: 0.95 } : undefined}
                      type="button"
                      disabled={!seg.rawValue}
                      onClick={() => handleCopy(seg.id, seg.rawValue, seg.khmerTitle)}
                      className={`min-h-[36px] min-w-[36px] px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shrink-0 ${
                        !seg.rawValue
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'bg-slate-100 hover:bg-red-700 hover:text-white text-slate-700 cursor-pointer'
                      }`}
                      title={`ចម្លង ${seg.khmerTitle}`}
                    >
                      {copiedId === seg.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">បានចម្លង</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>ចម្លង</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{seg.explanationKhmer}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/80 text-[11px] text-slate-500 font-medium">
                  ចំណាំ៖ {seg.pronunciationTip}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Dictionary Table of Korean Address Terms */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              តារាងពាក្យគន្លឹះសម្គាល់អាសយដ្ឋានកូរ៉េ សម្រាប់អ្នកលក់ និងអ្នកផ្ញើឥវ៉ាន់ (택배)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              របៀបអាន និងអត្ថន័យនៃពាក្យកូរ៉េនីមួយៗដែលតែងជួបប្រទះនៅលើវិក្កយបត្រប្រៃសណីយ៍ 우체국
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                <th className="py-3 px-4 whitespace-nowrap">ពាក្យកូរ៉េ (한글)</th>
                <th className="py-3 px-4 whitespace-nowrap">សូរសៀងអានជាខ្មែរ</th>
                <th className="py-3 px-4 whitespace-nowrap">អត្ថន័យជាភាសាខ្មែរ</th>
                <th className="py-3 px-4 whitespace-nowrap">ឧទាហរណ៍ប្រើប្រាស់</th>
                <th className="py-3 px-4">តួនាទីក្នុងការដឹកជញ្ជូន (택배)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm">
              {KOREAN_ADDRESS_TERMS.map((item, idx) => (
                <tr key={idx} className="hover:bg-red-50/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{item.korean}</td>
                  <td className="py-3 px-4 text-red-700 font-medium whitespace-nowrap">{item.pronunciation}</td>
                  <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">{item.khmerMeaning}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums whitespace-nowrap">
                    {item.example}
                  </td>
                  <td className="py-3 px-4 text-slate-600 text-xs leading-relaxed min-w-[240px]">
                    {item.courierRole}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
