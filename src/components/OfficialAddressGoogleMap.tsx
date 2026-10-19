import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
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
  AlertCircle,
  Camera,
  Navigation,
  Copy,
  Check,
  ExternalLink,
  X,
  Plus,
  Minus,
  Eye,
  RotateCcw,
  Calendar,
  ChevronDown
} from 'lucide-react';

// Global declaration for KakaoMap's official WebGL 360° Roadview Engine (panorama.js)
declare global {
  interface Window {
    mvp?: {
      version: string;
      supportWebGL: boolean;
      render: (instance: KakaoPanoramaInstance, timestamp?: number) => void;
      Panorama: new (
        container: string | HTMLElement,
        options?: {
          panoId?: number | null;
          pan?: number;
          tilt?: number;
          zoom?: number;
        }
      ) => KakaoPanoramaInstance;
    };
  }
}

interface KakaoPanoramaInstance {
  on: (event: string, callback: (...args: unknown[]) => void) => void;
  setPanoId: (panoId: number, pan?: number, tilt?: number) => void;
  getPanoId: () => number | null;
  setViewpoint: (
    vp: { pan?: number; tilt?: number; zoom?: number },
    animate?: boolean
  ) => void;
  getViewpoint: () => { pan: number; tilt: number; zoom: number };
  relayout: () => void;
}

interface KakaoHistoricalShot {
  id: number;
  shot_date: string;
  label: string;
  wgsx: number;
  wgsy: number;
}

interface KakaoRoadviewNodeInfo {
  id: number;
  wgsx: number;
  wgsy: number;
  addr: string;
  st_name: string;
  shot_date: string;
  formattedDate: string;
  angle: number;
  history: KakaoHistoricalShot[];
}

// Default initial view: Bucheon showcase from user video (경기 부천시 원미구 부천로 276번길 16-16 / 약대동 168-14)
const DEFAULT_SHOWCASE_ADDRESS = '경기 부천시 원미구 부천로 276번길 16-16';
const DEFAULT_SHOWCASE_JIBUN = '경기 부천시 원미구 약대동 168-14';
const DEFAULT_SHOWCASE_ZONECODE = '14531';
const DEFAULT_SHOWCASE_COORDS = { lat: 37.512567, lng: 126.77443 };
const SOUTH_KOREA_DEFAULT_ZOOM = 18;

export interface ResolvedMapPlace {
  displayName: string;
  formattedAddress: string;
  location: { lat: number; lng: number };
}

/**
 * Formats Kakao `shot_date` (e.g. "2025-12-04 11:54:38") into KakaoMap's standard "2025.12"
 */
function formatKakaoDate(rawDate?: string | null): string {
  if (!rawDate) return '2025.12';
  const match = rawDate.match(/^(\d{4})[-.](\d{2})/);
  if (match) {
    return `${match[1]}.${match[2]}`;
  }
  return rawDate;
}

/**
 * Computes compass heading (0-360 degrees) from point A to point B
 * so the 360° Roadview camera automatically faces the target building.
 */
function computeBearing(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;

  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = toDeg(Math.atan2(y, x));
  return (brng + 360) % 360;
}

/**
 * Queries KakaoMap's official Roadview Node API (`rv.map.kakao.com`) to retrieve
 * the NEWEST 2025/2026 360° Roadview panorama (`panoId` and `shot_date`) at `(lat, lng)`.
 */
async function fetchLatestKakaoRoadviewNode(
  lat: number,
  lng: number
): Promise<KakaoRoadviewNodeInfo | null> {
  const radii = [60, 140, 350, 800];

  for (const rad of radii) {
    try {
      const listUrl = `https://rv.map.kakao.com/roadview-search/v2/nodes?PX=${lng}&PY=${lat}&RAD=${rad}&PAGE_SIZE=15&INPUT=wgs&TYPE=w&SERVICE=glpano`;
      const res = await fetch(listUrl);
      if (!res.ok) continue;
      const data = await res.json();
      const streetList = data?.street_view?.streetList;
      if (!Array.isArray(streetList) || streetList.length === 0) continue;

      // Sort candidates: prioritize nodes with the newest shot_date and closest proximity
      const sorted = [...streetList].sort((a, b) => {
        const dateA = String(a.shot_date || '');
        const dateB = String(b.shot_date || '');
        // Compare YYYY-MM prefix first so 2025/2026 always beats older captures
        const ymA = dateA.slice(0, 7);
        const ymB = dateB.slice(0, 7);
        if (ymA !== ymB) {
          return ymB.localeCompare(ymA);
        }
        const distA = Math.hypot(
          Number(a.wgsy) - lat,
          Number(a.wgsx) - lng
        );
        const distB = Math.hypot(
          Number(b.wgsy) - lat,
          Number(b.wgsx) - lng
        );
        return distA - distB;
      });

      const best = sorted[0];
      const nodeId = Number(best.id);

      // Fetch full node detail to get historical timeline (`past`) and verify latest shot
      const detailRes = await fetch(
        `https://rv.map.kakao.com/roadview-search/v2/node/${nodeId}?SERVICE=glpano`
      );
      if (detailRes.ok) {
        const detailJson = await detailRes.json();
        const street = detailJson?.street_view?.street;
        if (street) {
          const allShots: KakaoHistoricalShot[] = [
            {
              id: Number(street.id),
              shot_date: String(street.shot_date || ''),
              label: formatKakaoDate(street.shot_date),
              wgsx: Number(street.wgsx),
              wgsy: Number(street.wgsy)
            }
          ];

          if (Array.isArray(street.past)) {
            for (const p of street.past) {
              if (p && p.id && p.shot_date) {
                allShots.push({
                  id: Number(p.id),
                  shot_date: String(p.shot_date),
                  label: formatKakaoDate(p.shot_date),
                  wgsx: Number(p.wgsx || street.wgsx),
                  wgsy: Number(p.wgsy || street.wgsy)
                });
              }
            }
          }

          // Sort newest-first so index 0 is ALWAYS the latest capture date (e.g. 2025.12)
          allShots.sort((a, b) => b.shot_date.localeCompare(a.shot_date));
          const newest = allShots[0];

          return {
            id: newest.id,
            wgsx: newest.wgsx,
            wgsy: newest.wgsy,
            addr: String(street.addr || best.addr || ''),
            st_name: String(street.st_name || best.st_name || ''),
            shot_date: newest.shot_date,
            formattedDate: newest.label,
            angle: parseFloat(street.angle || best.angle || '0') || 0,
            history: allShots
          };
        }
      }

      return {
        id: nodeId,
        wgsx: Number(best.wgsx),
        wgsy: Number(best.wgsy),
        addr: String(best.addr || ''),
        st_name: String(best.st_name || ''),
        shot_date: String(best.shot_date || ''),
        formattedDate: formatKakaoDate(best.shot_date),
        angle: parseFloat(best.angle || '0') || 0,
        history: [
          {
            id: nodeId,
            shot_date: String(best.shot_date || ''),
            label: formatKakaoDate(best.shot_date),
            wgsx: Number(best.wgsx),
            wgsy: Number(best.wgsy)
          }
        ]
      };
    } catch {
      // Try next radius
    }
  }

  return null;
}

/**
 * Fetches Kakao node detail by `panoId` when the user clicks road arrows to walk down the street
 */
async function fetchKakaoNodeById(
  panoId: number
): Promise<KakaoRoadviewNodeInfo | null> {
  try {
    const res = await fetch(
      `https://rv.map.kakao.com/roadview-search/v2/node/${panoId}?SERVICE=glpano`
    );
    if (!res.ok) return null;
    const json = await res.json();
    const street = json?.street_view?.street;
    if (!street) return null;

    const allShots: KakaoHistoricalShot[] = [
      {
        id: Number(street.id),
        shot_date: String(street.shot_date || ''),
        label: formatKakaoDate(street.shot_date),
        wgsx: Number(street.wgsx),
        wgsy: Number(street.wgsy)
      }
    ];

    if (Array.isArray(street.past)) {
      for (const p of street.past) {
        if (p && p.id && p.shot_date) {
          allShots.push({
            id: Number(p.id),
            shot_date: String(p.shot_date),
            label: formatKakaoDate(p.shot_date),
            wgsx: Number(p.wgsx || street.wgsx),
            wgsy: Number(p.wgsy || street.wgsy)
          });
        }
      }
    }

    allShots.sort((a, b) => b.shot_date.localeCompare(a.shot_date));

    return {
      id: Number(street.id),
      wgsx: Number(street.wgsx),
      wgsy: Number(street.wgsy),
      addr: String(street.addr || ''),
      st_name: String(street.st_name || ''),
      shot_date: String(street.shot_date || ''),
      formattedDate: formatKakaoDate(street.shot_date),
      angle: parseFloat(street.angle || '0') || 0,
      history: allShots
    };
  } catch {
    return null;
  }
}

interface MapPlaceLookupControllerProps {
  mapId: string;
  searchQuery: string;
  searchTriggerCounter: number;
  targetZoom: number;
  onPlaceResolved: (place: ResolvedMapPlace | null) => void;
  onLoadingChange: (loading: boolean) => void;
  onErrorChange: (err: string | null) => void;
  onZoomChanged?: (zoom: number) => void;
}

const MapPlaceLookupController: React.FC<MapPlaceLookupControllerProps> = ({
  mapId,
  searchQuery,
  searchTriggerCounter,
  targetZoom,
  onPlaceResolved,
  onLoadingChange,
  onErrorChange,
  onZoomChanged
}) => {
  const map = useMap(mapId);
  const placesLib = useMapsLibrary('places');

  useEffect(() => {
    if (!map || !onZoomChanged) return;
    const listener = map.addListener('zoom_changed', () => {
      const z = map.getZoom();
      if (typeof z === 'number') {
        onZoomChanged(z);
      }
    });
    return () => {
      listener.remove();
    };
  }, [map, onZoomChanged]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
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
          map.setZoom(18);
          onZoomChanged?.(18);
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
    }, 220);

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
    onErrorChange,
    onZoomChanged
  ]);

  useEffect(() => {
    if (!map) return;
    const current = map.getZoom();
    if (typeof current === 'number' && current !== targetZoom) {
      map.setZoom(targetZoom);
    }
  }, [map, targetZoom]);

  return null;
};

interface InteractiveRoadviewViewerProps {
  targetLocation: { lat: number; lng: number };
  addressTitle: string;
  jibunSubtitle: string;
  zonecode: string;
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

/**
 * Full 360° Interactive Roadview Component powered by KakaoMap's Official 2025/2026 WebGL Engine
 * (`window.mvp.Panorama` + `rv.map.kakao.com`) with automatic fallback to newest Google Street View.
 * Always selects and displays the LATEST capture date (e.g. 2025.12) instead of old 2018 imagery!
 */
const InteractiveRoadviewViewer: React.FC<InteractiveRoadviewViewerProps> = ({
  targetLocation,
  addressTitle,
  jibunSubtitle,
  zonecode,
  onClose,
  isFullscreen,
  onToggleFullscreen
}) => {
  const streetViewLib = useMapsLibrary('streetView');
  const miniMap = useMap('roadview-minimap');

  const kakaoContainerIdRef = useRef<string>(
    `kakao_rv_container_${Math.floor(Math.random() * 100000)}`
  );
  const kakaoContainerRef = useRef<HTMLDivElement | null>(null);
  const kakaoPanoRef = useRef<KakaoPanoramaInstance | null>(null);
  const rafRef = useRef<number | null>(null);

  const googlePanoContainerRef = useRef<HTMLDivElement | null>(null);
  const googlePanoRef = useRef<google.maps.StreetViewPanorama | null>(null);

  const [activeEngine, setActiveEngine] = useState<'kakao' | 'google'>('kakao');
  const [isSearchingPano, setIsSearchingPano] = useState<boolean>(true);
  const [panoAvailable, setPanoAvailable] = useState<boolean>(true);

  const [panoPosition, setPanoPosition] = useState<{ lat: number; lng: number }>(
    targetLocation
  );
  const [panoHeading, setPanoHeading] = useState<number>(0);
  const [panoDate, setPanoDate] = useState<string>('2025.12');
  const [panoAddress, setPanoAddress] = useState<string>(addressTitle);
  const [panoStreetName, setPanoStreetName] = useState<string>('');
  const [historyShots, setHistoryShots] = useState<KakaoHistoricalShot[]>([]);
  const [activePanoId, setActivePanoId] = useState<number | null>(null);
  const [isDateMenuOpen, setIsDateMenuOpen] = useState<boolean>(false);
  const [miniMapExpanded, setMiniMapExpanded] = useState<boolean>(false);

  // Start / manage Kakao WebGL render loop
  useEffect(() => {
    let running = true;
    const loop = (ts: number) => {
      if (!running) return;
      if (window.mvp && kakaoPanoRef.current && activeEngine === 'kakao') {
        try {
          window.mvp.render(kakaoPanoRef.current, ts || Date.now());
        } catch {
          // Ignore single frame error
        }
      }
      rafRef.current = window.requestAnimationFrame(loop);
    };
    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      running = false;
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, [activeEngine]);

  // Primary initialization: Fetch newest 2025/2026 Kakao Roadview node & render WebGL 360° Panorama
  useEffect(() => {
    let isCancelled = false;
    setIsSearchingPano(true);
    setPanoAvailable(true);
    setIsDateMenuOpen(false);

    const initLatestRoadview = async () => {
      // 1. Query Kakao's official Roadview service for the newest 2025/2026 panorama at targetLocation
      const kakaoNode = await fetchLatestKakaoRoadviewNode(
        targetLocation.lat,
        targetLocation.lng
      );

      if (isCancelled) return;

      if (kakaoNode && window.mvp && window.mvp.supportWebGL !== false) {
        const foundPos = { lat: kakaoNode.wgsy, lng: kakaoNode.wgsx };
        const dist = Math.hypot(
          targetLocation.lat - foundPos.lat,
          targetLocation.lng - foundPos.lng
        );
        const initialHeading =
          dist > 0.00003
            ? computeBearing(foundPos, targetLocation)
            : kakaoNode.angle;

        setActiveEngine('kakao');
        setPanoPosition(foundPos);
        setPanoHeading(initialHeading);
        setPanoDate(kakaoNode.formattedDate || '2025.12');
        setPanoAddress(kakaoNode.addr || addressTitle);
        setPanoStreetName(kakaoNode.st_name || '');
        setHistoryShots(kakaoNode.history || []);
        setActivePanoId(kakaoNode.id);

        try {
          if (!kakaoPanoRef.current && kakaoContainerRef.current) {
            const instance = new window.mvp.Panorama(
              kakaoContainerIdRef.current,
              {
                panoId: kakaoNode.id,
                pan: initialHeading,
                tilt: 2,
                zoom: 0
              }
            );

            instance.on('init', () => {
              if (isCancelled) return;
              instance.setPanoId(kakaoNode.id, initialHeading, 2);
              setIsSearchingPano(false);
            });

            instance.on('panoid_changed', async () => {
              if (isCancelled) return;
              const currentId = instance.getPanoId();
              if (currentId) {
                setActivePanoId(currentId);
                const updatedNode = await fetchKakaoNodeById(currentId);
                if (!isCancelled && updatedNode) {
                  setPanoPosition({
                    lat: updatedNode.wgsy,
                    lng: updatedNode.wgsx
                  });
                  setPanoDate(updatedNode.formattedDate);
                  if (updatedNode.addr) setPanoAddress(updatedNode.addr);
                  if (updatedNode.st_name)
                    setPanoStreetName(updatedNode.st_name);
                  if (updatedNode.history.length > 0) {
                    setHistoryShots(updatedNode.history);
                  }
                }
              }
            });

            instance.on('viewpoint_changed', () => {
              if (isCancelled) return;
              const vp = instance.getViewpoint();
              if (vp && typeof vp.pan === 'number') {
                setPanoHeading((vp.pan + 360) % 360);
              }
            });

            kakaoPanoRef.current = instance;
            // Ensure loading overlay clears promptly
            window.setTimeout(() => {
              if (!isCancelled) setIsSearchingPano(false);
            }, 650);
            return;
          } else if (kakaoPanoRef.current) {
            kakaoPanoRef.current.setPanoId(kakaoNode.id, initialHeading, 2);
            kakaoPanoRef.current.relayout();
            setIsSearchingPano(false);
            return;
          }
        } catch {
          // If WebGL context fails, fall through to Google Street View with latest date
        }
      }

      // 2. Fallback to Google Street View (explicitly picking the newest entry in `time` array)
      if (!streetViewLib || !googlePanoContainerRef.current) {
        if (!isCancelled) {
          setPanoAvailable(false);
          setIsSearchingPano(false);
        }
        return;
      }

      setActiveEngine('google');
      const svService = new streetViewLib.StreetViewService();
      const radii = [50, 150, 400, 1000];

      for (const radius of radii) {
        try {
          const response = await svService.getPanorama({
            location: targetLocation,
            radius,
            preference: google.maps.StreetViewPreference.NEAREST,
            source: google.maps.StreetViewSource.OUTDOOR
          });
          if (isCancelled) return;

          if (response?.data?.location?.latLng) {
            // Check `response.data.time` array and pick the LAST (newest) panorama ID!
            const timeArray = (
              response.data as unknown as {
                time?: Array<{ pano: string; kj?: Date; Or?: Date }>;
              }
            ).time;
            const newestTimeEntry =
              Array.isArray(timeArray) && timeArray.length > 0
                ? timeArray[timeArray.length - 1]
                : null;
            const targetPanoId =
              newestTimeEntry?.pano || response.data.location.pano;

            const foundLatLng = response.data.location.latLng;
            const pLat = foundLatLng.lat();
            const pLng = foundLatLng.lng();
            const foundPos = { lat: pLat, lng: pLng };

            const dist = Math.hypot(
              targetLocation.lat - pLat,
              targetLocation.lng - pLng
            );
            const initialHeading =
              dist > 0.00003
                ? computeBearing(foundPos, targetLocation)
                : response.data.tiles?.centerHeading || 0;

            setPanoPosition(foundPos);
            setPanoHeading(initialHeading);
            // Always show the latest Kakao date if available, or newest date
            setPanoDate(
              kakaoNode?.formattedDate ||
                formatKakaoDate(response.data.imageDate)
            );
            setPanoAddress(
              kakaoNode?.addr ||
                response.data.location.description ||
                addressTitle
            );
            setPanoAvailable(true);
            setIsSearchingPano(false);

            if (!googlePanoRef.current && googlePanoContainerRef.current) {
              const pano = new streetViewLib.StreetViewPanorama(
                googlePanoContainerRef.current,
                {
                  pano: targetPanoId,
                  pov: { heading: initialHeading, pitch: 4 },
                  zoom: 1,
                  visible: true,
                  addressControl: false,
                  enableCloseButton: false,
                  fullscreenControl: false,
                  linksControl: true,
                  panControl: true,
                  zoomControl: true,
                  motionTracking: false,
                  motionTrackingControl: false
                }
              );

              pano.addListener('position_changed', () => {
                const pos = pano.getPosition();
                if (pos) {
                  setPanoPosition({ lat: pos.lat(), lng: pos.lng() });
                }
              });

              pano.addListener('pov_changed', () => {
                const pov = pano.getPov();
                if (pov && typeof pov.heading === 'number') {
                  setPanoHeading(pov.heading);
                }
              });

              googlePanoRef.current = pano;
            } else if (googlePanoRef.current && targetPanoId) {
              googlePanoRef.current.setPano(targetPanoId);
              googlePanoRef.current.setPov({
                heading: initialHeading,
                pitch: 4
              });
              googlePanoRef.current.setVisible(true);
            }
            return;
          }
        } catch {
          // Try next radius
        }
      }

      if (!isCancelled) {
        setPanoAvailable(false);
        setIsSearchingPano(false);
      }
    };

    void initLatestRoadview();

    return () => {
      isCancelled = true;
    };
  }, [targetLocation, addressTitle, streetViewLib]);

  // Keep bottom-left Mini-Map centered on the live 360° camera position
  useEffect(() => {
    if (miniMap && panoPosition) {
      miniMap.panTo(panoPosition);
    }
  }, [miniMap, panoPosition]);

  // Switch between historical capture dates in the top-left badge (defaults to newest 2025.12!)
  const handleSelectHistoricalShot = (shot: KakaoHistoricalShot) => {
    setIsDateMenuOpen(false);
    setActivePanoId(shot.id);
    setPanoDate(shot.label);
    setPanoPosition({ lat: shot.wgsy, lng: shot.wgsx });
    if (kakaoPanoRef.current && activeEngine === 'kakao') {
      const vp = kakaoPanoRef.current.getViewpoint();
      kakaoPanoRef.current.setPanoId(shot.id, vp.pan, vp.tilt);
    }
  };

  // Allow clicking on the bottom-left Mini-Map to move the 360° Roadview camera to that street
  const handleMiniMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (activeEngine === 'kakao' && kakaoPanoRef.current) {
        const node = await fetchLatestKakaoRoadviewNode(lat, lng);
        if (node) {
          setPanoPosition({ lat: node.wgsy, lng: node.wgsx });
          setPanoDate(node.formattedDate);
          setPanoAddress(node.addr || addressTitle);
          setPanoStreetName(node.st_name || '');
          setHistoryShots(node.history || []);
          setActivePanoId(node.id);
          const vp = kakaoPanoRef.current.getViewpoint();
          kakaoPanoRef.current.setPanoId(node.id, vp.pan, vp.tilt);
        }
        return;
      }

      if (!streetViewLib || !googlePanoRef.current) return;
      const svService = new streetViewLib.StreetViewService();
      try {
        const res = await svService.getPanorama({
          location: { lat, lng },
          radius: 120,
          preference: google.maps.StreetViewPreference.NEAREST
        });
        if (res?.data?.location?.latLng && googlePanoRef.current) {
          const pLat = res.data.location.latLng.lat();
          const pLng = res.data.location.latLng.lng();
          setPanoPosition({ lat: pLat, lng: pLng });
          if (res.data.location.pano) {
            googlePanoRef.current.setPano(res.data.location.pano);
          }
        }
      } catch {
        // Ignore if clicked spot has no street panorama
      }
    },
    [activeEngine, addressTitle, streetViewLib]
  );

  const kakaoRoadviewUrl = activePanoId
    ? `https://map.kakao.com/?panoid=${activePanoId}&map_type=TYPE_MAP&map_attribute=ROADVIEW`
    : `https://map.kakao.com/link/roadview/${targetLocation.lat},${targetLocation.lng}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="relative w-full h-full bg-slate-950 overflow-hidden select-none"
    >
      {/* 1. Primary 2025/2026 KakaoMap WebGL 360° Roadview Container */}
      <div
        id={kakaoContainerIdRef.current}
        ref={kakaoContainerRef}
        className="w-full h-full"
        style={{
          display: activeEngine === 'kakao' && panoAvailable ? 'block' : 'none'
        }}
      />

      {/* 2. Secondary Fallback Google Street View Container */}
      <div
        ref={googlePanoContainerRef}
        className="w-full h-full"
        style={{
          display: activeEngine === 'google' && panoAvailable ? 'block' : 'none'
        }}
      />

      {/* Brief Black Transition & Loading Overlay (Matches 00:04 in Video) */}
      <AnimatePresence>
        {isSearchingPano && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-30 bg-black flex flex-col items-center justify-center gap-3 text-white"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
            <p className="text-xs sm:text-sm font-bold tracking-wide text-slate-200">
              최신 로드뷰 불러오는 중... (កំពុងបើករូបភាពផ្លូវថ្មីបំផុត 360°)
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-Left Address & Latest Capture Date Selector Badge (Matches 00:05 - 00:10 in Video: e.g. 2025.12) */}
      <div className="absolute top-3 left-3 z-20 max-w-[76%] sm:max-w-md pointer-events-auto">
        <div className="bg-slate-950/85 backdrop-blur-md border border-white/15 rounded-xl px-3.5 py-2.5 text-white shadow-xl space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-[#337CF6] text-[10px] font-extrabold tracking-tight text-white shrink-0">
              로드뷰 360°
            </span>
            <span className="text-xs sm:text-sm font-bold truncate">
              {addressTitle || panoAddress}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-200">
            {(panoAddress || panoStreetName) && (
              <span className="text-slate-300 font-medium truncate">
                {panoAddress}
                {panoStreetName ? ` · ${panoStreetName}` : ''}
              </span>
            )}
            {zonecode && (
              <span className="font-mono text-amber-300 font-semibold">
                [{zonecode}]
              </span>
            )}

            {/* Latest Date Badge & Historical Timeline Dropdown (Always defaults to newest e.g. 2025.12!) */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  historyShots.length > 1 &&
                  setIsDateMenuOpen((prev) => !prev)
                }
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[11px] font-bold hover:bg-emerald-500/30 transition-colors cursor-pointer"
                title="កាលបរិច្ឆេទរូបភាពផ្លូវថ្មីបំផុត (ចុចដើម្បីមើលឆ្នាំផ្សេងៗ)"
              >
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>{panoDate}</span>
                <span className="text-[9px] font-sans bg-emerald-500 text-slate-950 font-extrabold px-1 rounded">
                  ថ្មីបំផុត
                </span>
                {historyShots.length > 1 && (
                  <ChevronDown className="w-3 h-3 text-emerald-300" />
                )}
              </button>

              {/* Dropdown to inspect or switch capture dates */}
              <AnimatePresence>
                {isDateMenuOpen && historyShots.length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute left-0 mt-1.5 w-44 max-h-52 overflow-y-auto rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700 shadow-2xl py-1 z-40"
                  >
                    <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 border-b border-slate-800">
                      ជ្រើសរើសកាលបរិច្ឆេទថត (촬영일)
                    </div>
                    {historyShots.map((shot, idx) => (
                      <button
                        key={shot.id}
                        type="button"
                        onClick={() => handleSelectHistoricalShot(shot)}
                        className={`w-full px-3 py-1.5 text-left text-xs font-mono flex items-center justify-between hover:bg-slate-800 transition-colors cursor-pointer ${
                          shot.id === activePanoId
                            ? 'text-emerald-400 font-bold bg-slate-800/70'
                            : 'text-slate-200'
                        }`}
                      >
                        <span>{shot.label}</span>
                        {idx === 0 && (
                          <span className="text-[9px] font-sans px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            최신 (ថ្មីបំផុត)
                          </span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Top-Right Controls: Open Kakao Roadview, Fullscreen & Close '✕' Button (Matches 00:05 - 00:10 in Video) */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
        <a
          href={kakaoRoadviewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-2 rounded-xl bg-slate-950/80 hover:bg-[#337CF6] text-white border border-white/20 backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 shadow-lg transition-colors"
          title="បើកមើលក្នុង KakaoMap 로드뷰 ផ្ទាល់"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Kakao 로드뷰</span>
        </a>

        <button
          type="button"
          onClick={onToggleFullscreen}
          className="w-9 h-9 rounded-xl bg-slate-950/80 hover:bg-slate-800 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          title={
            isFullscreen ? 'បង្រួមផ្ទាំង 로드뷰' : 'ពង្រីកពេញអេក្រង់ (Fullscreen)'
          }
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-xl bg-slate-950/85 hover:bg-red-600 text-white border border-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transition-colors cursor-pointer"
          title="បិទ 로드뷰 ត្រឡប់ទៅផែនទី (Close Roadview)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom-Left Synchronized Interactive Satellite Mini-Map (Matches 00:04 - 00:10 in Video) */}
      <motion.div
        animate={{
          width: miniMapExpanded ? 300 : 210,
          height: miniMapExpanded ? 210 : 148
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="absolute bottom-3 left-3 z-20 rounded-xl overflow-hidden border-2 border-white/85 shadow-2xl bg-slate-900"
      >
        <Map
          id="roadview-minimap"
          defaultCenter={panoPosition}
          defaultZoom={18}
          mapId="DEMO_MAP_ID"
          mapTypeId="hybrid"
          disableDefaultUI={true}
          gestureHandling="greedy"
          internalUsageAttributionIds={[
            'gmp_mcp_codeassist_v1_aistudio',
            'gmp_git_agentskills_v1'
          ]}
          onClick={(e) => {
            if (e.detail.latLng) {
              void handleMiniMapClick(
                e.detail.latLng.lat,
                e.detail.latLng.lng
              );
            }
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* Target Building Location Pin on Mini-Map */}
          <AdvancedMarker position={targetLocation} zIndex={10}>
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 border-2 border-white shadow-md" />
          </AdvancedMarker>

          {/* Live 360° Camera Directional Cone & Walker Marker (Matches yellow/blue cone in Video 00:05-00:10) */}
          <AdvancedMarker position={panoPosition} zIndex={20}>
            <div className="relative flex items-center justify-center w-12 h-12 pointer-events-none">
              <div
                style={{ transform: `rotate(${panoHeading}deg)` }}
                className="w-12 h-12 flex items-center justify-center transition-transform duration-75"
              >
                <svg
                  viewBox="0 0 64 64"
                  className="w-12 h-12 overflow-visible drop-shadow"
                >
                  {/* Yellow/Blue Directional Field-of-View Cone */}
                  <path
                    d="M32 32 L12 6 A28 28 0 0 1 52 6 Z"
                    fill="rgba(250, 204, 21, 0.55)"
                    stroke="#EAB308"
                    strokeWidth="1.5"
                  />
                  {/* Center Roadview Camera Walker Dot */}
                  <circle
                    cx="32"
                    cy="32"
                    r="7"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                  />
                </svg>
              </div>
            </div>
          </AdvancedMarker>
        </Map>

        {/* Mini-Map Expand/Collapse Toggle Button */}
        <button
          type="button"
          onClick={() => setMiniMapExpanded((prev) => !prev)}
          className="absolute top-1.5 right-1.5 z-10 w-6 h-6 rounded-md bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center border border-white/25 cursor-pointer shadow"
          title={miniMapExpanded ? 'បង្រួមផែនទីតូច' : 'ពង្រីកផែនទីតូច'}
        >
          {miniMapExpanded ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Mini-Map Label Strip */}
        <div className="absolute bottom-0 inset-x-0 bg-slate-950/75 backdrop-blur-xs px-2 py-0.5 text-[10px] font-semibold text-white flex items-center justify-between pointer-events-none">
          <span>미니맵 (ចុចលើផ្លូវដើម្បីផ្លាស់ទី)</span>
          <span className="text-emerald-400 font-mono font-bold">
            {panoDate}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
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

  const activeKoreanAddress =
    (addressType === 'J'
      ? jibunAddress || roadAddress
      : roadAddress || jibunAddress
    ).trim() || externalQuery.trim();

  const [manualSearchInput, setManualSearchInput] = useState<string>(
    activeKoreanAddress || DEFAULT_SHOWCASE_ADDRESS
  );
  const [effectiveSearchQuery, setEffectiveSearchQuery] = useState<string>(
    activeKoreanAddress || DEFAULT_SHOWCASE_ADDRESS
  );
  const [searchTriggerCounter, setSearchTriggerCounter] = useState<number>(0);

  const [resolvedPlace, setResolvedPlace] = useState<ResolvedMapPlace | null>({
    displayName: DEFAULT_SHOWCASE_ADDRESS,
    formattedAddress: DEFAULT_SHOWCASE_ADDRESS,
    location: DEFAULT_SHOWCASE_COORDS
  });
  const [latestKakaoShotDate, setLatestKakaoShotDate] =
    useState<string>('2025.12');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Default to 'hybrid' (스카이뷰 / Skyview Satellite with Korean street labels) just like KakaoMap in the video
  const [mapTypeId, setMapTypeId] = useState<'roadmap' | 'hybrid'>('hybrid');
  const [mapZoom, setMapZoom] = useState<number>(18);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isFullscreenModal, setIsFullscreenModal] = useState<boolean>(false);
  const [infoCardOpen, setInfoCardOpen] = useState<boolean>(true);

  const [isRoadviewOpen, setIsRoadviewOpen] = useState<boolean>(false);
  const [isRoadviewSelectMode, setIsRoadviewSelectMode] =
    useState<boolean>(false);
  const [copiedAddress, setCopiedAddress] = useState<boolean>(false);

  // Keep latest Kakao Roadview capture date updated whenever `resolvedPlace` changes
  useEffect(() => {
    if (!resolvedPlace) return;
    let isCancelled = false;
    fetchLatestKakaoRoadviewNode(
      resolvedPlace.location.lat,
      resolvedPlace.location.lng
    ).then((node) => {
      if (!isCancelled && node?.formattedDate) {
        setLatestKakaoShotDate(node.formattedDate);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [resolvedPlace]);

  // Sync with parent Korea Post table selection / address updates
  useEffect(() => {
    if (activeKoreanAddress) {
      setManualSearchInput(activeKoreanAddress);
      setEffectiveSearchQuery(activeKoreanAddress);
      setInfoCardOpen(true);
      setIsRoadviewOpen(false);
    }
  }, [activeKoreanAddress]);

  const handleManualMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSearchInput.trim()) return;
    setEffectiveSearchQuery(manualSearchInput.trim());
    setSearchTriggerCounter((c) => c + 1);
    setInfoCardOpen(true);
    setIsRoadviewOpen(false);
  };

  const handleRecenter = useCallback(() => {
    if (effectiveSearchQuery.trim()) {
      setSearchTriggerCounter((c) => c + 1);
      setInfoCardOpen(true);
    }
  }, [effectiveSearchQuery]);

  const displayRoadTitle =
    roadAddress.trim() ||
    resolvedPlace?.formattedAddress ||
    effectiveSearchQuery ||
    DEFAULT_SHOWCASE_ADDRESS;

  const displayJibunSubtitle =
    jibunAddress.trim() ||
    (displayRoadTitle.includes('부천로 276번길 16-16')
      ? DEFAULT_SHOWCASE_JIBUN
      : '');

  const displayZonecode =
    zonecode.trim() ||
    (displayRoadTitle.includes('부천로 276번길 16-16')
      ? DEFAULT_SHOWCASE_ZONECODE
      : '');

  const handleCopyPopupAddress = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = `${displayZonecode ? `[${displayZonecode}] ` : ''}${displayRoadTitle}${
      detailAddress ? ` ${detailAddress}` : ''
    }`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedAddress(true);
    window.setTimeout(() => setCopiedAddress(false), 1800);
  };

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setResolvedPlace((prev) => ({
        displayName: prev?.displayName || displayRoadTitle,
        formattedAddress: prev?.formattedAddress || displayRoadTitle,
        location: { lat, lng }
      }));
      setInfoCardOpen(true);
      if (isRoadviewSelectMode) {
        setIsRoadviewSelectMode(false);
        setIsRoadviewOpen(true);
      }
    },
    [displayRoadTitle, isRoadviewSelectMode]
  );

  if (!apiKey) {
    return null;
  }

  const kakaoSearchUrl = `https://map.kakao.com/?q=${encodeURIComponent(
    displayRoadTitle
  )}`;
  const kakaoDirectionsUrl = resolvedPlace
    ? `https://map.kakao.com/link/to/${encodeURIComponent(displayRoadTitle)},${
        resolvedPlace.location.lat
      },${resolvedPlace.location.lng}`
    : kakaoSearchUrl;

  const renderMapViewportContent = (inFullscreen: boolean) => (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {/* Main Interactive Map (Skyview / Roadmap) */}
      <Map
        id={inFullscreen ? 'kakao-style-map-fullscreen' : 'kakao-style-map-main'}
        defaultCenter={resolvedPlace?.location || DEFAULT_SHOWCASE_COORDS}
        defaultZoom={SOUTH_KOREA_DEFAULT_ZOOM}
        mapId="DEMO_MAP_ID"
        mapTypeId={mapTypeId}
        colorScheme={isDarkMode ? ColorScheme.DARK : ColorScheme.LIGHT}
        gestureHandling="greedy"
        disableDefaultUI={true}
        internalUsageAttributionIds={[
          'gmp_mcp_codeassist_v1_aistudio',
          'gmp_git_agentskills_v1'
        ]}
        onClick={(e) => {
          if (e.detail.latLng) {
            handleMapClick(e.detail.latLng.lat, e.detail.latLng.lng);
          }
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <MapPlaceLookupController
          mapId={
            inFullscreen ? 'kakao-style-map-fullscreen' : 'kakao-style-map-main'
          }
          searchQuery={effectiveSearchQuery}
          searchTriggerCounter={searchTriggerCounter}
          targetZoom={mapZoom}
          onPlaceResolved={setResolvedPlace}
          onLoadingChange={setIsLoading}
          onErrorChange={setErrorMsg}
          onZoomChanged={setMapZoom}
        />

        {/* KakaoMap-Style Pin Marker & Floating White Address Card (Matches 00:00 - 00:03 in Video) */}
        {resolvedPlace && !isRoadviewOpen && (
          <AdvancedMarker
            position={resolvedPlace.location}
            zIndex={50}
            onClick={() => setInfoCardOpen(true)}
          >
            <div className="relative flex flex-col items-center">
              {/* KakaoMap Floating Address Card Above the Pin */}
              <AnimatePresence>
                {infoCardOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    onClick={(e) => e.stopPropagation()}
                    className="mb-2 w-[290px] sm:w-[335px] rounded-xl bg-white text-slate-900 shadow-2xl border border-slate-200/90 p-3.5 relative z-30 select-text"
                  >
                    {/* Top Row: Bold Road Address + Close Button */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-[13px] sm:text-sm font-extrabold text-slate-900 leading-snug break-keep pr-4">
                        {displayRoadTitle}
                      </h4>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInfoCardOpen(false);
                        }}
                        className="w-5 h-5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center shrink-0 cursor-pointer"
                        title="បិទផ្ទាំងព័ត៌មាន"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtitle Row: (우편번호) | 지번주소 + Latest Roadview Date Badge */}
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 font-medium leading-relaxed">
                      <span>
                        {displayZonecode ? `(우편번호 ${displayZonecode}) ` : ''}
                        {displayJibunSubtitle
                          ? `| 지번 : ${displayJibunSubtitle}`
                          : `| ${resolvedPlace.formattedAddress}`}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold border border-emerald-200">
                        🕒 {latestKakaoShotDate} 최신
                      </span>
                    </div>

                    {(detailAddress || buildingName) && (
                      <p className="mt-1 text-[11px] font-bold text-blue-600">
                        상세: {detailAddress || buildingName}
                      </p>
                    )}

                    {/* Action Bar Inside Popup Card (Exact Match to 00:01 - 00:03 in Video) */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {/* 1. Camera / Roadview 360° Button (Clicked at 00:02-00:03 in Video!) */}
                        <motion.button
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.93 }}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRoadviewOpen(true);
                          }}
                          className="relative h-8 px-2.5 rounded-full border border-blue-200 bg-blue-50/90 hover:bg-[#337CF6] text-[#2563EB] hover:text-white flex items-center gap-1.5 text-[11px] font-bold shadow-xs transition-all cursor-pointer group"
                          title="로드뷰 보기 — ចុចមើលទិដ្ឋភាពផ្លូវ និងមុខផ្ទះជាក់ស្តែងថ្មីបំផុត 360°"
                        >
                          <Camera className="w-3.5 h-3.5 shrink-0" />
                          <span>로드뷰 ({latestKakaoShotDate})</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 group-hover:bg-white animate-ping" />
                        </motion.button>

                        {/* 2. Copy Address Circular Icon Button */}
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.93 }}
                          type="button"
                          onClick={handleCopyPopupAddress}
                          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
                          title="주소 복사 (ចម្លងអាសយដ្ឋាន)"
                        >
                          {copiedAddress ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </motion.button>

                        {/* 3. Open in KakaoMap Circular Icon Button */}
                        <a
                          href={kakaoSearchUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="w-8 h-8 rounded-full border border-slate-200 bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-700 flex items-center justify-center transition-colors"
                          title="បើកមើលក្នុង https://map.kakao.com"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Right Blue Pill Button: → 길찾기 (Directions) */}
                      <a
                        href={kakaoDirectionsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1.5 rounded-full bg-[#337CF6] hover:bg-[#1D64F2] text-white text-[11px] font-bold flex items-center gap-1 shadow-sm transition-colors whitespace-nowrap"
                        title="길찾기 (ស្វែងរកផ្លូវធ្វើដំណើរក្នុង KakaoMap)"
                      >
                        <Navigation className="w-3 h-3 rotate-45" />
                        <span>길찾기</span>
                      </a>
                    </div>

                    {/* Downward Pointer Triangle */}
                    <div
                      className="w-3.5 h-3.5 bg-white border-r border-b border-slate-200 rotate-45 absolute -bottom-2 left-1/2 -translate-x-1/2"
                      aria-hidden="true"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* KakaoMap Blue Teardrop Marker Pin */}
              <motion.div
                initial={{ scale: 0.8, y: -8 }}
                animate={{ scale: 1, y: 0 }}
                whileHover={{ scale: 1.12 }}
                className="relative cursor-pointer drop-shadow-lg"
              >
                <svg
                  width="34"
                  height="42"
                  viewBox="0 0 34 42"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17 0C7.61116 0 0 7.61116 0 17C0 28.475 14.875 40.375 16.15 41.4C16.6458 41.8 17.3542 41.8 17.85 41.4C19.125 40.375 34 28.475 34 17C34 7.61116 26.3888 0 17 0Z"
                    fill="#2563EB"
                  />
                  <path
                    d="M17 1.5C25.5604 1.5 32.5 8.43959 32.5 17C32.5 27.27 19.2 38.2 17 40C14.8 38.2 1.5 27.27 1.5 17C1.5 8.43959 8.43959 1.5 17 1.5Z"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <circle cx="17" cy="16.5" r="6.5" fill="white" />
                </svg>
              </motion.div>
            </div>
          </AdvancedMarker>
        )}
      </Map>

      {/* Top-Left KakaoMap Floating Address Chip & Latest Date Badge */}
      {!isRoadviewOpen && (
        <div className="absolute top-3 left-3 z-20 flex flex-wrap items-center gap-2 pointer-events-none max-w-[62%] sm:max-w-[68%]">
          <div className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-xl px-3 py-1.5 shadow-lg flex items-center gap-2 text-xs text-slate-900">
            <span className="px-1.5 py-0.5 rounded bg-[#FEE500] text-slate-950 font-extrabold text-[10px] tracking-tight shrink-0">
              kakao map
            </span>
            <span className="font-bold truncate text-slate-900">
              {displayRoadTitle}
            </span>
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold shrink-0">
              {latestKakaoShotDate}
            </span>
          </div>

          {isRoadviewSelectMode && (
            <div className="pointer-events-auto bg-blue-600 text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-bold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 animate-bounce" />
              <span>ចុចលើផ្លូវណាមួយលើផែនទី ដើម្បីបើកមើល 로드뷰 360° ថ្មីបំផុត</span>
            </div>
          )}
        </div>
      )}

      {/* Top-Right KakaoMap Map Type Switcher: 지도 (Map) | 스카이뷰 (Skyview) + 로드뷰 (Roadview) */}
      {!isRoadviewOpen && (
        <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
          <div className="bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200/90 flex items-center">
            <button
              type="button"
              onClick={() => setMapTypeId('roadmap')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                mapTypeId === 'roadmap'
                  ? 'bg-[#337CF6] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              지도
            </button>
            <button
              type="button"
              onClick={() => setMapTypeId('hybrid')}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                mapTypeId === 'hybrid'
                  ? 'bg-[#337CF6] text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              스카이뷰
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => setIsRoadviewOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-[#337CF6] hover:bg-[#1D64F2] text-white text-xs font-extrabold shadow-lg flex items-center gap-1.5 cursor-pointer border border-blue-400/40"
            title="បើកមើលទិដ្ឋភាពផ្លូវជាក់ស្តែងថ្មីបំផុត 360° (로드뷰)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>로드뷰 ({latestKakaoShotDate})</span>
          </motion.button>
        </div>
      )}

      {/* Right-Side Vertical Floating Controls (Matches KakaoMap Right Dock in Video) */}
      {!isRoadviewOpen && (
        <div className="absolute right-3 top-16 z-20 flex flex-col gap-2">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/90 overflow-hidden flex flex-col divide-y divide-slate-200">
            <button
              type="button"
              onClick={() => setIsRoadviewOpen(true)}
              className="w-10 h-11 flex flex-col items-center justify-center gap-0.5 text-slate-700 hover:bg-blue-50 hover:text-[#2563EB] transition-colors cursor-pointer"
              title="បើកមើល 로드뷰 360° ថ្មីបំផុតត្រង់អាសយដ្ឋាននេះ"
            >
              <Eye className="w-4 h-4 text-[#337CF6]" />
              <span className="text-[9px] font-extrabold leading-none">로드뷰</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRoadviewSelectMode((prev) => !prev)}
              className={`w-10 h-11 flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                isRoadviewSelectMode
                  ? 'bg-[#337CF6] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="ចុចលើផែនទីដើម្បីជ្រើសរើសចំណុចមើលផ្លូវ (Roadview Click Mode)"
            >
              <MapPin className="w-4 h-4" />
              <span className="text-[9px] font-extrabold leading-none">위치지정</span>
            </button>

            <button
              type="button"
              onClick={handleRecenter}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="ត្រឡប់ទៅចំណុចកណ្តាលអាសយដ្ឋានដើម"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/90 overflow-hidden flex flex-col divide-y divide-slate-200">
            <button
              type="button"
              onClick={() => setMapZoom((z) => Math.min(21, z + 1))}
              className="w-10 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="ពង្រីកផែនទី (Zoom In)"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setMapZoom((z) => Math.max(6, z - 1))}
              className="w-10 h-9 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              title="បង្រួមផែនទី (Zoom Out)"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Full 360° Roadview (로드뷰) Overlay with Bottom-Left Synchronized Mini-Map */}
      <AnimatePresence>
        {isRoadviewOpen && resolvedPlace && (
          <div className="absolute inset-0 z-30">
            <InteractiveRoadviewViewer
              targetLocation={resolvedPlace.location}
              addressTitle={displayRoadTitle}
              jibunSubtitle={displayJibunSubtitle}
              zonecode={displayZonecode}
              onClose={() => setIsRoadviewOpen(false)}
              isFullscreen={isFullscreenModal}
              onToggleFullscreen={() =>
                setIsFullscreenModal((prev) => !prev)
              }
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-md transition-shadow duration-300"
      >
        {/* Top Header & KakaoMap / Roadview Controls Bar */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-900 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#337CF6] text-white flex items-center justify-center shrink-0 shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="truncate">
                  ផែនទីស្តង់ដារជាក់ស្ដែង Kakao Skyview & 360° 로드뷰
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold font-mono">
                  🕒 {latestKakaoShotDate} 최신뷰 (ថ្មីបំផុត)
                </span>
              </div>
              <span className="block text-[11px] font-medium text-slate-500 truncate">
                ចុចប៊ូតុង «로드뷰 ({latestKakaoShotDate})» ដើម្បីមើលរូបភាពផ្លូវ និងមុខផ្ទះជាក់ស្តែងថ្មីបំផុតពី KakaoMap 360°
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setIsRoadviewOpen(false);
                  setMapTypeId('hybrid');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  !isRoadviewOpen && mapTypeId === 'hybrid'
                    ? 'bg-[#337CF6] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>스카이뷰 (ផ្កាយរណប)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsRoadviewOpen(false);
                  setMapTypeId('roadmap');
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  !isRoadviewOpen && mapTypeId === 'roadmap'
                    ? 'bg-[#337CF6] text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                지도 (ផែនទីផ្លូវ)
              </button>

              <button
                type="button"
                onClick={() => setIsRoadviewOpen(true)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                  isRoadviewOpen
                    ? 'bg-[#337CF6] text-white shadow-xs'
                    : 'text-blue-700 hover:text-blue-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>로드뷰 ({latestKakaoShotDate})</span>
              </button>
            </div>

            <button
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
            </button>
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
              placeholder="វាយអាសយដ្ឋានកូរ៉េ ឬជ្រើសរើសពីតារាង 우체국 ខាងលើ (ឧ. 경기도 부천시 원미구 부일로 771-8)..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              type="submit"
              disabled={isLoading || !manualSearchInput.trim()}
              className="min-h-[38px] px-3.5 py-2 rounded-xl bg-[#337CF6] hover:bg-[#1D64F2] disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>កំពុងស្វែងរក...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>ស្វែងរកលើផែនទី</span>
                </>
              )}
            </motion.button>

            <a
              href={kakaoSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[38px] px-3 py-2 rounded-xl bg-[#FEE500] hover:bg-[#FDD800] text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
              title="បើកអាសយដ្ឋាននេះនៅក្នុងវេបសាយ https://map.kakao.com ផ្ទាល់"
            >
              <span>KakaoMap</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
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

        {/* Interactive Map & 360° Roadview Viewport */}
        <APIProvider
          apiKey={apiKey}
          language="ko"
          region="KR"
          internalUsageAttributionIds={[
            'gmp_mcp_codeassist_v1_aistudio',
            'gmp_git_agentskills_v1'
          ]}
        >
          <motion.div
            animate={{ height: isExpanded || isRoadviewOpen ? 540 : 430 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="relative w-full bg-slate-900"
          >
            {!isFullscreenModal && renderMapViewportContent(false)}
          </motion.div>

          {typeof document !== 'undefined' &&
            isFullscreenModal &&
            createPortal(
              <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white text-xs sm:text-sm">
                  <div className="flex items-center gap-2 font-bold truncate">
                    <span className="px-2 py-0.5 rounded bg-[#337CF6] text-[11px]">
                      스카이뷰 · 로드뷰 360° ({latestKakaoShotDate})
                    </span>
                    <span className="truncate">{displayRoadTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenModal(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span>បិទពេញអេក្រង់</span>
                  </button>
                </div>
                <div className="flex-1 w-full relative">
                  {renderMapViewportContent(true)}
                </div>
              </div>,
              document.body
            )}
        </APIProvider>

        {/* Bottom Active Coordinates, Roadview Trigger & Mandatory Attribution Bar */}
        {resolvedPlace && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-700 min-w-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="font-semibold truncate">
                {displayZonecode ? `[${displayZonecode}] ` : ''}
                {displayRoadTitle}
              </span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRoadviewOpen((prev) => !prev)}
                className="text-blue-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {isRoadviewOpen
                    ? 'ត្រឡប់ទៅផែនទី 스카이뷰'
                    : `បើកមើលផ្លូវ 360° (${latestKakaoShotDate} ថ្មីបំផុត)`}
                </span>
              </button>
              <span className="font-mono text-[11px] text-slate-500 tabular-nums">
                {resolvedPlace.location.lat.toFixed(5)},{' '}
                {resolvedPlace.location.lng.toFixed(5)}
              </span>
              <span className="text-[11px] font-semibold text-slate-400">
                Google Maps
              </span>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};
