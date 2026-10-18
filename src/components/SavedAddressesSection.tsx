import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Star,
  Copy,
  Check,
  Trash2,
  ArrowUpRight,
  BookmarkCheck,
  Plus,
  AlertTriangle,
  X
} from 'lucide-react';
import { SavedCustomerAddress } from '../data/koreanAddresses';

interface SavedAddressesSectionProps {
  savedAddresses: SavedCustomerAddress[];
  onLoadAddress: (addr: SavedCustomerAddress) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteAddress: (id: string) => void;
  onCopyFullFromHistory: (addr: SavedCustomerAddress) => void;
  onScrollToBuilder: () => void;
}

const TAG_LABELS: Record<SavedCustomerAddress['labelTag'], string> = {
  vip: 'អតិថិជនប្រចាំ (VIP)',
  customer: 'អតិថិជនទូទៅ',
  dormitory: 'អន្តេវាសិកដ្ឋាន / រោងចក្រ',
  home: 'អាសយដ្ឋានផ្ទាល់ខ្លួន'
};

export const SavedAddressesSection: React.FC<SavedAddressesSectionProps> = ({
  savedAddresses,
  onLoadAddress,
  onToggleFavorite,
  onDeleteAddress,
  onCopyFullFromHistory,
  onScrollToBuilder
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'frequent' | 'favorite' | 'dormitory'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingDeleteItem, setPendingDeleteItem] = useState<SavedCustomerAddress | null>(null);

  const filteredList = savedAddresses
    .filter((item) => {
      if (activeFilter === 'favorite' && !item.isFavorite) return false;
      if (activeFilter === 'dormitory' && item.labelTag !== 'dormitory') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.recipientName.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.zonecode.includes(q) ||
        item.roadAddress.toLowerCase().includes(q) ||
        item.detailAddress.toLowerCase().includes(q) ||
        (item.noteKhmer && item.noteKhmer.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (activeFilter === 'frequent') {
        return b.useCount - a.useCount;
      }
      if (a.isFavorite !== b.isFavorite) {
        return a.isFavorite ? -1 : 1;
      }
      return b.useCount - a.useCount;
    });

  const handleQuickCopy = (addr: SavedCustomerAddress) => {
    onCopyFullFromHistory(addr);
    setCopiedId(addr.id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const confirmPermanentDelete = () => {
    if (!pendingDeleteItem) return;
    onDeleteAddress(pendingDeleteItem.id);
    setPendingDeleteItem(null);
  };

  return (
    <section id="history-section" className="space-y-6">
      {/* Permanent Delete Confirmation Modal */}
      <AnimatePresence>
        {pendingDeleteItem && (
          <motion.div
            key="delete-confirm-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setPendingDeleteItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              transition={{ duration: 0.22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      បញ្ជាក់ការលុបអាសយដ្ឋានជាអចិន្ត្រៃយ៍
                    </h3>
                    <p className="text-xs text-red-700 font-medium">
                      ទិន្នន័យដែលលុបហើយមិនអាចត្រឡប់មកវិញបានទេ!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDeleteItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-slate-200 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">
                    {pendingDeleteItem.recipientName}
                  </span>
                  <span className="font-mono font-semibold text-slate-700 tabular-nums">
                    {pendingDeleteItem.phone}
                  </span>
                </div>
                <p className="text-slate-700 font-medium">
                  [{pendingDeleteItem.zonecode}] {pendingDeleteItem.roadAddress}{' '}
                  {pendingDeleteItem.detailAddress}
                </p>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                តើអ្នកពិតជាចង់លុបអាសយដ្ឋាននេះចេញពីប្រវត្តិរក្សាទុកមែនទេ? នៅពេលចុចបញ្ជាក់ការលុប ទិន្នន័យនេះនឹងត្រូវលុបចោលទាំងស្រុង ហើយមិនអាចទាញយកមកវិញបានឡើយ។
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setPendingDeleteItem(null)}
                  className="min-h-[42px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
                >
                  បោះបង់
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={confirmPermanentDelete}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  បញ្ជាក់ការលុបជាអចិន្ត្រៃយ៍
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-red-700 tracking-wide">
            សៀវភៅអាសយដ្ឋានអតិថិជន · FREQUENT RECIPIENT HISTORY
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            ប្រវត្តិអាសយដ្ឋានដែលបានរក្សាទុក ({savedAddresses.length})
          </h2>
        </div>

        {/* Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-xl overflow-x-auto">
          {[
            { id: 'all', label: `ទាំងអស់ (${savedAddresses.length})` },
            { id: 'frequent', label: 'ប្រើញឹកញាប់បំផុត' },
            { id: 'favorite', label: `ចំណាំផ្កាយ (${savedAddresses.filter((a) => a.isFavorite).length})` },
            { id: 'dormitory', label: 'រោងចក្រ / 기숙사' }
          ].map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 min-h-[38px] cursor-pointer ${
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

      {/* Search Bar (only shown when there are saved addresses) */}
      {savedAddresses.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ស្វែងរកក្នុងប្រវត្តិរក្សាទុក៖ ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ (010), លេខកូដប្រៃសណីយ៍ ឬឈ្មោះផ្លូវ..."
            className="w-full pl-11 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 shadow-2xs transition-all"
          />
        </div>
      )}

      {/* Animated Grid of Saved Address Card Items */}
      {filteredList.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-8 text-center"
        >
          <BookmarkCheck className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {savedAddresses.length === 0
              ? 'មិនទាន់មានអាសយដ្ឋានត្រូវបានរក្សាទុកនៅឡើយទេ'
              : 'មិនមានអាសយដ្ឋានត្រូវនឹងការស្វែងរកនេះទេ'}
          </h3>
          <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
            {savedAddresses.length === 0
              ? 'អាសយដ្ឋាននឹងត្រូវបានរក្សាទុកនៅទីនេះ លុះត្រាតែលោកអ្នកបញ្ចូលព័ត៌មានរួចចុចប៊ូតុង «រក្សាទុកអាសយដ្ឋាននេះទុកប្រើលើកក្រោយ»។'
              : 'សូមសាកល្បងស្វែងរកដោយប្រើឈ្មោះ ឬលេខទូរស័ព្ទផ្សេង។'}
          </p>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onScrollToBuilder}
            className="mt-4 min-h-[44px] px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            បញ្ចូល និងរក្សាទុកអាសយដ្ឋានអតិថិជនថ្មី
          </motion.button>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredList.map((item, idx) => {
              const fullRoadLine = `[${item.zonecode}] ${item.roadAddress}${
                item.detailAddress ? `, ${item.detailAddress}` : ''
              }${item.bname ? ` (${item.bname})` : ''}`;

              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  transition={{ duration: 0.25, delay: idx * 0.03 }}
                  whileHover={{ y: -4 }}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-red-300 shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <div>
                    {/* Metadata Line */}
                    <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-2">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-red-700">{TAG_LABELS[item.labelTag]}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">ប្រើ {item.useCount} ដង</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{item.lastUsedAt}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <motion.button
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          onClick={() => onToggleFavorite(item.id)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                          title={item.isFavorite ? 'ដកចេញពីចំណាំផ្កាយ' : 'ដាក់ជាចំណាំផ្កាយ'}
                        >
                          <Star
                            className={`w-4 h-4 transition-transform ${
                              item.isFavorite ? 'fill-amber-400 text-amber-500 scale-110' : 'text-slate-400'
                            }`}
                          />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.88 }}
                          type="button"
                          onClick={() => setPendingDeleteItem(item)}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="លុបអាសយដ្ឋាននេះជាអចិន្ត្រៃយ៍"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Recipient & Phone */}
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900 truncate">{item.recipientName}</h3>
                      <span className="font-mono text-xs font-semibold text-slate-700 tabular-nums shrink-0">
                        {item.phone}
                      </span>
                    </div>

                    {/* Official Korea Post Address Block */}
                    <div className="mt-3 p-3 rounded-xl bg-[#FAF9F6] border border-slate-200/80 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-700 tabular-nums">
                          우편번호 {item.zonecode}
                        </span>
                        {item.entranceCode && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="text-xs text-slate-600 font-mono tabular-nums">
                              현관: {item.entranceCode}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug break-keep">
                        {fullRoadLine}
                      </p>
                      {item.jibunAddress && (
                        <p className="text-xs text-slate-500">지번: {item.jibunAddress}</p>
                      )}
                      {item.deliveryMemo && (
                        <p className="text-xs text-slate-700 pt-1 border-t border-slate-200/70 mt-1.5">
                          메모: {item.deliveryMemo}
                        </p>
                      )}
                    </div>

                    {item.noteKhmer && (
                      <p className="text-xs text-slate-500 mt-2.5">ចំណាំ៖ {item.noteKhmer}</p>
                    )}
                  </div>

                  {/* Animated Action Buttons */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => onLoadAddress(item)}
                      className="flex-1 min-h-[42px] px-3 py-2 rounded-xl bg-slate-900 hover:bg-red-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      យកមកប្រើក្នុងតារាង
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={() => handleQuickCopy(item)}
                      className="min-h-[42px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-700" />
                          <span className="text-emerald-700">បានចម្លង</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>ចម្លងភ្លាម</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
};
