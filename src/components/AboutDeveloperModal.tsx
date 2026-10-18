import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Target,
  Sparkles,
  ShieldCheck,
  Code2,
  Search,
  Copy,
  UserCheck,
  Clock,
  Layout,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { KoreaPostEmblem } from './KoreaPostEmblem';

export const DEV_PHOTO_STORAGE_KEY = 'kpost_khmer_developer_photo_v1';
export const DEFAULT_DEV_PHOTO_URL = '/logo.svg';

interface AboutDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
  developerPhotoUrl?: string;
}

const KEY_FEATURES = [
  {
    id: 'feat-search',
    icon: Search,
    title: 'ស្វែងរកអាសយដ្ឋាន៖',
    desc: 'ស្វែងរកអាសយដ្ឋានអតិថិជនបានយ៉ាងងាយស្រួល។'
  },
  {
    id: 'feat-copy',
    icon: Copy,
    title: 'ចម្លងអាសយដ្ឋានពេញលេញ៖',
    desc: 'ចម្លងព័ត៌មានអាសយដ្ឋានក្នុងពេលតែមួយ ដើម្បីយកទៅបិទភ្ជាប់ក្នុងប្រព័ន្ធផ្ញើឥវ៉ាន់។'
  },
  {
    id: 'feat-organize',
    icon: UserCheck,
    title: 'រៀបចំព័ត៌មានអតិថិជន៖',
    desc: 'បង្ហាញព័ត៌មានដែលចាំបាច់សម្រាប់ការដឹកជញ្ជូន ដូចជា ឈ្មោះអ្នកទទួល លេខទូរស័ព្ទ អាសយដ្ឋាន និងលេខកូដប្រៃសណីយ៍។'
  },
  {
    id: 'feat-time',
    icon: Clock,
    title: 'សន្សំពេលវេលា៖',
    desc: 'កាត់បន្ថយការវាយបញ្ចូលព័ត៌មានដោយដៃ និងជួយបង្កើនប្រសិទ្ធភាពការងារប្រចាំថ្ងៃ។'
  },
  {
    id: 'feat-ux',
    icon: Layout,
    title: 'ងាយស្រួលប្រើប្រាស់៖',
    desc: 'មានរចនាបថសាមញ្ញ ងាយយល់ និងស័ក្តិសមសម្រាប់ការប្រើប្រាស់ប្រចាំថ្ងៃ។'
  }
];

export const AboutDeveloperModal: React.FC<AboutDeveloperModalProps> = ({
  isOpen,
  onClose
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="about-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-50 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={onClose}
        >
          <motion.div
            key="about-modal-card"
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
          >
            {/* Top Modal Header Ribbon */}
            <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <KoreaPostEmblem className="w-10 h-10 bg-white rounded-xl p-1" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-red-400">
                    <span>KOREA POST (우체국) STANDARD</span>
                    <span>·</span>
                    <span>VERSION 1.0</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold tracking-tight truncate">
                    អំពីកម្មវិធី (About)
                  </h2>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-red-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="បិទផ្ទាំងអំពីកម្មវិធី"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Scrollable Body with Animated Card Items */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-[#FAF9F6]">
              {/* Overview Card Item */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.04, duration: 0.28 }}
                whileHover={{ y: -2 }}
                className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all"
              >
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  <strong className="font-bold text-slate-900">
                    ប្រព័ន្ធស្វែងរក និងចម្លងទម្រង់អាសយដ្ឋានសម្រាប់ផ្ញើឥវ៉ាន់ (택배 Address Search &amp; Copy System)
                  </strong>{' '}
                  គឺជាប្រព័ន្ធដែលបង្កើតឡើងដើម្បីជួយសម្រួលដល់ការស្វែងរក រៀបចំ និងចម្លងព័ត៌មានអាសយដ្ឋានរបស់អតិថិជន សម្រាប់ប្រើប្រាស់ក្នុងការផ្ញើឥវ៉ាន់តាមសេវាដឹកជញ្ជូននៅប្រទេសកូរ៉េខាងត្បូង។
                </p>
              </motion.div>

              {/* Purpose Card Item */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.28 }}
                whileHover={{ y: -2 }}
                className="bg-white border border-slate-200 hover:border-red-300 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-2"
              >
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <h3>🎯 គោលបំណង</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  កម្មវិធីនេះត្រូវបានបង្កើតឡើងដើម្បីកាត់បន្ថយពេលវេលាក្នុងការស្វែងរកអាសយដ្ឋាន ជួយរៀបចំព័ត៌មានអតិថិជនឱ្យមានរបៀបរៀបរយ និងធ្វើឱ្យការបំពេញព័ត៌មានសម្រាប់ផ្ញើឥវ៉ាន់កាន់តែងាយស្រួល និងមានប្រសិទ្ធភាព។
                </p>
              </motion.div>

              {/* Key Features Section with Animated Card Items */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base px-1">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3>✨ មុខងារសំខាន់ៗ</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {KEY_FEATURES.map((feat, idx) => {
                    const IconComp = feat.icon;
                    return (
                      <motion.div
                        key={feat.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 + idx * 0.05, duration: 0.25 }}
                        whileHover={{ y: -3, scale: 1.01 }}
                        className={`bg-white border border-slate-200 hover:border-red-300 rounded-xl p-4 shadow-2xs hover:shadow-md transition-all flex items-start gap-3 ${
                          idx === KEY_FEATURES.length - 1 ? 'sm:col-span-2' : ''
                        }`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center shrink-0 mt-0.5">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm">
                          <h4 className="font-bold text-slate-900">{feat.title}</h4>
                          <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Security & Privacy Card Item */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.28 }}
                whileHover={{ y: -2 }}
                className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-2"
              >
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm sm:text-base">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3>🔒 សុវត្ថិភាព និងឯកជនភាព</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  ព័ត៌មានផ្ទាល់ខ្លួនរបស់អតិថិជនគួរតែត្រូវបានប្រើប្រាស់តែក្នុងគោលបំណងចាំបាច់សម្រាប់ការដឹកជញ្ជូនប៉ុណ្ណោះ។ អ្នកប្រើប្រាស់គួររក្សាការសម្ងាត់នៃព័ត៌មានអតិថិជន និងជៀសវាងការចែករំលែកព័ត៌មានទៅកាន់អ្នកដែលគ្មានការអនុញ្ញាត។
                </p>
              </motion.div>

              {/* Developer Profile Card Item with Locked, Unchangeable Website Logo */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.28 }}
                whileHover={{ y: -3 }}
                className="bg-white border-2 border-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                  {/* Locked Website Logo Frame (Non-editable / Read-Only) */}
                  <div
                    onContextMenu={(e) => e.preventDefault()}
                    className="relative w-36 sm:w-40 aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 shrink-0 shadow-md bg-white flex flex-col items-center justify-center p-3 select-none"
                  >
                    <img
                      src="/logo.svg"
                      alt="K-Post Khmer Official Website Logo - Hout Dara"
                      draggable={false}
                      className="w-full h-full object-contain pointer-events-none select-none pb-5"
                    />

                    {/* Permanent Read-Only Caption Overlay */}
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/95 px-2.5 py-1.5 flex items-center justify-between gap-1 pointer-events-none select-none">
                      <span className="text-[11px] font-bold text-white truncate">
                        K-Post Khmer
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-400">
                        <Lock className="w-2.5 h-2.5" />
                        Official
                      </span>
                    </div>
                  </div>

                  {/* Developer Details & Specifications */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-red-700 text-white flex items-center justify-center shrink-0">
                          <Code2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900">
                            👨‍💻 អ្នកអភិវឌ្ឍន៍
                          </h3>
                          <p className="text-xs sm:text-sm font-bold text-red-700">
                            ឈ្មោះ៖ ហួត ដារ៉ា (Hout Dara)
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Official Developer
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      បង្កើតឡើងដោយមានគោលបំណងផ្តល់នូវឧបករណ៍ដែលមានភាពងាយស្រួល រហ័ស និងមានប្រសិទ្ធភាព សម្រាប់ការស្វែងរក និងចម្លងអាសយដ្ឋានអតិថិជនក្នុងការផ្ញើឥវ៉ាន់នៅប្រទេសកូរ៉េខាងត្បូង។
                    </p>

                    {/* Metadata Specs Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Version:
                        </span>
                        <span className="font-mono text-sm font-bold text-slate-900">1.0</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Developer:
                        </span>
                        <span className="text-sm font-bold text-red-700">Hout Dara</span>
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="p-3 rounded-xl bg-[#FAF9F6] border border-slate-200"
                      >
                        <span className="text-[11px] font-semibold text-slate-500 block">
                          Purpose:
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          Address Search, Organization &amp; Copy for Parcel Delivery (택배)
                        </span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <p className="text-xs font-medium text-slate-500">
                © 2026 Hout Dara. All rights reserved.
              </p>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[38px] px-5 py-2 rounded-xl bg-slate-900 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                បិទផ្ទាំងនេះ (Close)
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
