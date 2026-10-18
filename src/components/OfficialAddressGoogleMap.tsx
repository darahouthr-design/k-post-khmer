import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useMap,
  useMapsLibrary,
  ColorScheme
} from '@vis.gl/react-google-maps';
import {
  MapPin,
  Search,
  Compass,
  Layers,
  Maximize2,
  Minimize2,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// Default initial view: South Korea center
const SOUTH_KOREA_DEFAULT_CENTER = { lat: 36.5, lng: 127.8 };
const SOUTH_KOREA_DEFAULT_ZOOM = 7;

export interface ResolvedMapPlace {
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
}

interface MapPlaceLookupConrollerProps {
  searchQuery: string;
  searchTriggerCounter: number;
  onPlaceResolved: (place: ResolvedMapPlace | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (err: string | null) => void;
}

/**
 * Uses the modern Google Maps Places API (New) `Place.searchByText` via `useMapsLibrary('places')`
 * (See https://developers.google.com/maps/documentation/javascript/place-search?utm_campaign=gmp_mcp_codeassist_v1_aistudio)
 */
const MapPlaceLookupController: React.FC<MapPlaceLookupConrollerProps> = ({
  searchQuery,
  searchTriggerCounter,
  onPlaceResolved,
  onLoadingChange,
  onErrorChange
}) => {
  const map = useMap();
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      onPlaceResolved(null);
      onErrorChange(null);
      if (map) {
        map.panTo(SOUTH_KOREA_DEFAULT_CENTER);
        map.setZoom(SOUTH_KOREA_DEFAULT_ZOOM);
      }
      return;
    }

    if (!placesLib || !map) return;

    let isCancelled = false;

    const lookupAddressOnMap = async () => {
      onLoadingChange(true);
      onErrorChange(null);

      try {
        const request: google.maps.places.SearchByTextRequest = {
          textQuery: trimmed,
          fields: ['displayName', 'location', 'formattedAddress'],
          language: 'ko',
          region: 'kr',
          maxResultCount: 1
        };

        const response = await placesLib.Place.searchByText(request);
        if (isCancelled) return;

        const firstPlace = response?.places?.[0];
        if (firstPlace && firstPlace.location) {
          const lat =
            typeof firstPlace.location.lat === 'function'
              ? firstPlace.location.lat()
              : Number(firstPlace.location.lat);
          const lng =
            typeof firstPlace.location.lng === 'function'
              ? firstPlace.location.lng()
              : Number(firstPlace.location.lng);

          const resolved: ResolvedMapPlace = {
            displayName: String(firstPlace.displayName || trimmed),
            formattedAddress: String(firstPlace.formattedAddress || trimmed),
            location: { lat, lng }
          };

          onPlaceResolved(resolved);
          map.panTo({ lat, lng });
          map.setZoom(17);
        } else {
          onPlaceResolved(null);
          onErrorChange(
            'រកមិនឃើញទីតាំងអាសយដ្ឋាននេះនៅលើផែនទីទេ សូមពិនិត្យឈ្មោះផ្លូវ ឬភូមិ/សង្កាត់ម្តងទៀត។'
          );
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        const errMsg = err instanceof Error ? err.message : String(err);
        if (
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('OVER_QUERY_LIMIT') ||
          errMsg.includes('429') ||
          errMsg.includes('QuotaExceeded')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onErrorChange('មិនអាចទាញយកទិន្នន័យទីតាំងលើផែនទីបានទេ នាពេលនេះ។');
      } finally {
        if (!isCancelled) {
          onLoadingChange(false);
        }
      }
    };

    const timer = window.setTimeout(() => {
      void lookupAddressOnMap();
    }, 280);

    return () => {
      isCancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    placesLib,
    map,
    searchQuery,
    searchTriggerCounter,
    onPlaceResolved,
    onLoadingChange,
    onErrorChange
  ]);

  return null;
};

interface OfficialAddressGoogleMapProps {
  isDarkMode?: boolean;
  addressType: 'R' | 'J';
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  buildingName: string;
  externalQuery?: string;
}

export const OfficialAddressGoogleMap: React.FC<OfficialAddressGoogleMapProps> = ({
  isDarkMode = false,
  addressType,
  zonecode,
  roadAddress,
  jibunAddress,
  detailAddress,
  buildingName,
  externalQuery = ''
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Active address query derived from selected Korea Post address or external search
  const activeKoreanAddress =
    (addressType === 'J' ? jibunAddress || roadAddress : roadAddress || jibunAddress).trim() ||
    externalQuery.trim();

  const [manualSearchInput, setManualSearchInput] = useState<string>('');
  const [effectiveSearchQuery, setEffectiveSearchQuery] = useState<string>('');
  const [searchTriggerCounter, setSearchTriggerCounter] = useState<number>(0);

  const [resolvedPlace, setResolvedPlace] = useState<ResolvedMapPlace | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [infoWindowOpen, setInfoWindowOpen] = useState<boolean>(true);

  const [markerRef, marker] = useAdvancedMarkerRef();

  // Sync with parent Korea Post table selection / address updates
  useEffect(() => {
    if (activeKoreanAddress) {
      setManualSearchInput(activeKoreanAddress);
      setEffectiveSearchQuery(activeKoreanAddress);
      setInfoWindowOpen(true);
    } else {
      setManualSearchInput('');
      setEffectiveSearchQuery('');
      setResolvedPlace(null);
    }
  }, [activeKoreanAddress]);

  const handleManualMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchInput.trim()) return;
    setEffectiveSearchQuery(manualSearchInput.trim());
    setSearchTriggerCounter((c) => c + 1);
    setInfoWindowOpen(true);
  };

  const handleRecenter = useCallback(() => {
    if (effectiveSearchQuery.trim()) {
      setSearchTriggerCounter((c) => c + 1);
      setInfoWindowOpen(true);
    }
  }, [effectiveSearchQuery]);

  if (!apiKey) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow duration-300"
    >
      {/* Top Header & Map Controls Bar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-900 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-red-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block truncate">
              ផែនទីស្តង់ដារជាក់ស្ដែង Google Maps (ទីតាំងអាសយដ្ឋាន 우체국)
            </span>
            <span className="block text-[11px] font-medium text-slate-500 truncate">
              {resolvedPlace
                ? `ទីតាំងជាក់ស្តែង៖ ${resolvedPlace.formattedAddress}`
                : 'ជ្រើសរើសអាសយដ្ឋានក្នុងតារាង 우체국 ខាងលើ ឬវាយស្វែងរកដើម្បីមើលទីតាំងលើផែនទីផ្ទាល់'}
            </span>
          </div>
        </div>

        {/* Map Type & Size Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Map Type Switcher: Roadmap vs Satellite Hybrid */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                mapTypeId === 'roadmap'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>ផែនទីផ្លូវ</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => setMapTypeId('hybrid')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                mapTypeId === 'hybrid'
                  ? 'bg-red-700 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              ផ្កាយរណប (Satellite)
            </motion.button>
          </div>

          {/* Re-center on Pin Button */}
          {resolvedPlace && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={handleRecenter}
              className="min-h-[32px] px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="ត្រឡប់ទៅចំណុចកណ្តាលនៃអាសយដ្ឋាន"
            >
              <MapPin className="w-3.5 h-3.5 text-red-700" />
              <span className="hidden sm:inline">ទីតាំងដើម</span>
            </motion.button>
          )}

          {/* Expand / Collapse Map Height Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="min-h-[32px] px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            title={isExpanded ? 'បង្រួមផែនទី' : 'ពង្រីកផែនទីឱ្យធំ'}
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
        </div>
      </div>

      {/* Direct Search Input Strip for the Map */}
      <form
        onSubmit={handleManualMapSearch}
        className="px-4 py-2.5 bg-[#FAF9F6] border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={manualSearchInput}
            onChange={(e) => setManualSearchInput(e.target.value)}
            placeholder="បង្ហាញស្វ័យប្រវត្តិពីតារាង 우체국 ឬវាយអាសយដ្ឋានកូរ៉េដើម្បីស្វែងរកលើផែនទី..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-red-600 transition-colors"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          type="submit"
          disabled={isLoading || !manualSearchInput.trim()}
          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>កំពុងស្វែងរកទីតាំង...</span>
            </>
          ) : (
            <>
              <Search className="w-3.5 h-3.5" />
              <span>ស្វែងរកលើផែនទី</span>
            </>
          )}
        </motion.button>
      </form>

      {/* Error / Status Strip */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-xs text-amber-900"
          >
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Google Map Viewport (Explicit height per CF2) */}
      <motion.div
        animate={{ height: isExpanded ? 500 : 350 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="relative w-full bg-slate-100"
      >
        <APIProvider
          apiKey={apiKey}
          language="ko"
          region="KR"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        >
          <Map
            defaultCenter={SOUTH_KOREA_DEFAULT_CENTER}
            defaultZoom={SOUTH_KOREA_DEFAULT_ZOOM}
            mapId="DEMO_MAP_ID"
            mapTypeId={mapTypeId}
            colorScheme={isDarkMode ? ColorScheme.DARK : ColorScheme.LIGHT}
            gestureHandling="cooperative"
            streetViewControl={true}
            fullscreenControl={true}
            mapTypeControl={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            <MapPlaceLookupController
              searchQuery={effectiveSearchQuery}
              searchTriggerCounter={searchTriggerCounter}
              onPlaceResolved={setResolvedPlace}
              onLoadingChange={setIsLoading}
              onErrorChange={setErrorMsg}
            />

            {resolvedPlace && (
              <>
                <AdvancedMarker
                  ref={markerRef}
                  position={resolvedPlace.location}
                  onClick={() => setInfoWindowOpen(true)}
                  title={resolvedPlace.formattedAddress}
                >
                  <Pin
                    background="#B91C1C"
                    borderColor="#7F1D1D"
                    glyphColor="#FFFFFF"
                    scale={1.25}
                  />
                </AdvancedMarker>

                {infoWindowOpen && marker && (
                  <InfoWindow
                    anchor={marker}
                    maxWidth={300}
                    onCloseClick={() => setInfoWindowOpen(false)}
                  >
                    <div className="p-1 space-y-1.5 text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-red-700 text-white font-mono text-[11px] font-bold">
                          {zonecode ? `우편번호 ${zonecode}` : '우체국 위치'}
                        </span>
                        <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" />
                          {addressType === 'J' ? '지번주소' : '도로명주소'}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-snug">
                        {activeKoreanAddress || resolvedPlace.formattedAddress}
                      </p>
                      {(detailAddress || buildingName) && (
                        <p className="text-[11px] font-semibold text-red-700">
                          상세: {detailAddress || buildingName}
                        </p>
                      )}
                      <p className="text-[10px] font-mono text-slate-500 pt-0.5 border-t border-slate-200">
                        GPS: {resolvedPlace.location.lat.toFixed(5)},{' '}
                        {resolvedPlace.location.lng.toFixed(5)}
                      </p>
                    </div>
                  </InfoWindow>
                )}
              </>
            )}
          </Map>
        </APIProvider>
      </motion.div>

      {/* Bottom Active Coordinates & Address Summary Bar */}
      {resolvedPlace && (
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-semibold truncate">
              {zonecode ? `[${zonecode}] ` : ''}
              {resolvedPlace.formattedAddress}
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
            {resolvedPlace.location.lat.toFixed(5)}, {resolvedPlace.location.lng.toFixed(5)}
          </span>
        </div>
      )}
    </motion.div>
  );
};
