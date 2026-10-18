export interface AddressRecord {
  id: string;
  zonecode: string; // 5-digit Korea Post code (우편번호)
  sido: string; // 시/도
  sidoKhmer: string;
  sigungu: string; // 시/군/구
  sigunguKhmer: string;
  bname: string; // 법정동/읍/면
  bnameKhmer: string;
  roadName: string; // 도로명 + 건물번호
  roadNameKhmer: string;
  roadAddress: string; // 전체 도로명주소
  jibunAddress: string; // 전체 지번주소
  buildingName: string; // 건물명
  buildingNameKhmer: string;
  sampleDetail: string; // 상세주소 예시 (동/층/호)
  category: 'villa' | 'apartment' | 'dormitory' | 'commercial';
  categoryKhmer: string;
  regionTagKhmer: string;
  keywords: string[];
}

export interface DeliveryMemoPreset {
  id: string;
  korean: string;
  khmer: string;
  pronunciationKhmer: string;
  category: 'location' | 'contact' | 'care';
  categoryLabelKhmer: string;
  usageNoteKhmer: string;
}

export interface SavedCustomerAddress {
  id: string;
  recipientName: string;
  phone: string;
  zonecode: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  buildingName: string;
  bname: string;
  deliveryMemo: string;
  entranceCode: string; // 공동현관 비밀번호
  labelTag: 'customer' | 'home' | 'dormitory' | 'vip';
  isFavorite: boolean;
  useCount: number;
  lastUsedAt: string;
  noteKhmer?: string;
}

export const DELIVERY_MEMO_PRESETS: DeliveryMemoPreset[] = [
  {
    id: 'door-front',
    korean: '문 앞에 놓아주세요',
    khmer: 'សូមទុកឥវ៉ាន់នៅមុខទ្វារបន្ទប់',
    pronunciationKhmer: 'មុន អាប់-ផេ ណូ-អា-ជូ-សេ-យ៉ូ',
    category: 'location',
    categoryLabelKhmer: 'ទីតាំងទុកឥវ៉ាន់',
    usageNoteKhmer: 'ប្រើញឹកញាប់បំផុតសម្រាប់វីឡា (빌라), បន្ទប់ជួល (원룸) និងអាផាតមិន'
  },
  {
    id: 'security-office',
    korean: '부재 시 경비실에 맡겨주세요',
    khmer: 'បើមិននៅ សូមផ្ញើទុកនៅបន្ទប់សន្តិសុខ (경비실)',
    pronunciationKhmer: 'ភូ-ជេ ស៊ី ខ្យង-ប៊ី-ស៊ីល-អេ ម៉ាត់-ក្យ-ជូ-សេ-យ៉ូ',
    category: 'location',
    categoryLabelKhmer: 'ទីតាំងទុកឥវ៉ាន់',
    usageNoteKhmer: 'សាកសមសម្រាប់អាផាតមិនធំៗ ឬអគារដែលមានសន្តិសុខយាម'
  },
  {
    id: 'dorm-office',
    korean: '기숙사 관리실(수위실)에 맡겨주세요',
    khmer: 'សូមទុកនៅបន្ទប់គ្រប់គ្រងអន្តេវាសិកដ្ឋាន / បន្ទប់សន្តិសុខរោងចក្រ',
    pronunciationKhmer: 'គី-ស៊ុក-សា ក្វាន់-លី-ស៊ីល-អេ ម៉ាត់-ក្យ-ជូ-សេ-យ៉ូ',
    category: 'location',
    categoryLabelKhmer: 'ទីតាំងទុកឥវ៉ាន់',
    usageNoteKhmer: 'ល្អបំផុតសម្រាប់ពលករស្នាក់នៅក្នុងរោងចក្រ ឬកន្លែងស្នាក់នៅរួម'
  },
  {
    id: 'parcel-box',
    korean: '무인택배함에 넣어주세요',
    khmer: 'សូមដាក់ក្នុងទូរទទួលឥវ៉ាន់ស្វ័យប្រវត្តិ (택배함)',
    pronunciationKhmer: 'មូ-អ៊ីន-ថេក-ប៉េ-ហាំ-អេ ណ-អ-ជូ-សេ-យ៉ូ',
    category: 'location',
    categoryLabelKhmer: 'ទីតាំងទុកឥវ៉ាន់',
    usageNoteKhmer: 'សម្រាប់អគារដែលមានទូរដែកដាក់ឥវ៉ាន់ដោយប្រើលេខកូដ'
  },
  {
    id: 'call-before',
    korean: '배송 전 미리 연락 바랍니다',
    khmer: 'សូមទាក់ទងមកមុនពេលដឹកជញ្ជូនដល់',
    pronunciationKhmer: 'ភេ-សុង ចន មី-រី យ៉ន់-ឡាក់ ប៉ា-រ៉ាំ-នី-ដា',
    category: 'contact',
    categoryLabelKhmer: 'ការទាក់ទង',
    usageNoteKhmer: 'ឱ្យអ្នកដឹកជញ្ជូនតេ ឬផ្ញើសារប្រាប់មុនពេលមកដល់'
  },
  {
    id: 'call-if-absent',
    korean: '부재 시 전화 또는 문자 주세요',
    khmer: 'បើមិនឃើញមនុស្ស សូមតេ ឬផ្ញើសារមកលេខទូរស័ព្ទ',
    pronunciationKhmer: 'ភូ-ជេ ស៊ី ចន-ហ្វា តូ-នឹន មុន-ចា ជូ-សេ-យ៉ូ',
    category: 'contact',
    categoryLabelKhmer: 'ការទាក់ទង',
    usageNoteKhmer: 'ការពារកុំឱ្យបាត់ឥវ៉ាន់នៅពេលអតិថិជនចេញទៅធ្វើការ'
  },
  {
    id: 'photo-after',
    korean: '배송 완료 후 사진 문자 부탁드립니다',
    khmer: 'ពេលដាក់ឥវ៉ាន់រួច សូមជួយថតរូបផ្ញើតាមសារ (SMS)',
    pronunciationKhmer: 'ភេ-សុង វ៉ាន់-រ្យ៉ូ ហ៊ូ សា-ជីន មុន-ចា ភូ-ថាក់-ឌឺ-រីម-នី-ដា',
    category: 'contact',
    categoryLabelKhmer: 'ការទាក់ទង',
    usageNoteKhmer: 'ងាយស្រួលផ្ទៀងផ្ទាត់ថាឥវ៉ាន់បានដាក់ត្រឹមត្រូវមុខបន្ទប់'
  },
  {
    id: 'fragile-care',
    korean: '파손주의! 깨지기 쉬운 물품입니다',
    khmer: 'ប្រយ័ត្នបែកបាក់! ទំនិញងាយបែក សូមថ្នមដៃ',
    pronunciationKhmer: 'ផា-សុន-ជូ-អ៊ី! កេ-ជី-គី ស្វី-អ៊ុន មូល-ភូម-អ៊ីម-នី-ដា',
    category: 'care',
    categoryLabelKhmer: 'ការប្រុងប្រយ័ត្នទំនិញ',
    usageNoteKhmer: 'សម្រាប់គ្រឿងសម្អាង ដបកែវ គ្រឿងអេឡិចត្រូនិក ឬរបស់ងាយបែក'
  },
  {
    id: 'fresh-food',
    korean: '냉동/신선식품입니다. 빠른 배송 부탁드립니다',
    khmer: 'ជាអាហារក្លាសេ/បន្លែស្រស់ សូមជួយដឹកជញ្ជូនឱ្យរហ័ស',
    pronunciationKhmer: 'ណេង-ដុង/ស៊ីន-សន់-ស៊ីក-ភូម-អ៊ីម-នី-ដា ប៉ា-រឹន ភេ-សុង ភូ-ថាក់-ឌឺ-រីម-នី-ដា',
    category: 'care',
    categoryLabelKhmer: 'ការប្រុងប្រយ័ត្នទំនិញ',
    usageNoteKhmer: 'សំខាន់ខ្លាំងសម្រាប់ផ្ញើម្ហូបខ្មែរ ត្រី សាច់ ឬបន្លែស្រស់តាម 우체국 택배'
  }
];

export const KOREAN_ADDRESS_DIRECTORY: AddressRecord[] = [
  {
    id: 'ansan-wongok-1',
    zonecode: '15380',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '안산시 단원구',
    sigunguKhmer: 'ក្រុងអាន់សាន់ ខណ្ឌដាន់វ៉ន (Ansan-si Danwon-gu)',
    bname: '원곡동',
    bnameKhmer: 'សង្កាត់វ៉នគុក-ដុង (Wongok-dong)',
    roadName: '다문화길 24',
    roadNameKhmer: 'ផ្លូវ ដាមុនហ្វា-គីល លេខ 24',
    roadAddress: '경기도 안산시 단원구 다문화길 24',
    jibunAddress: '경기도 안산시 단원구 원곡동 785-1',
    buildingName: '한마음빌라',
    buildingNameKhmer: 'ហាន់ម៉ាអឹម វីឡា (Hanmaeum Villa)',
    sampleDetail: '201호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'អាន់សាន់ (Ansan)',
    keywords: ['안산', '단원구', '원곡동', '다문화길', 'អាន់សាន់', 'វ៉នគុកដុង', 'ansan', 'wongok', '15380']
  },
  {
    id: 'ansan-seonbu-2',
    zonecode: '15236',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '안산시 단원구',
    sigunguKhmer: 'ក្រុងអាន់សាន់ ខណ្ឌដាន់វ៉ន (Ansan-si Danwon-gu)',
    bname: '선부동',
    bnameKhmer: 'សង្កាត់សន់ប៊ូ-ដុង (Seonbu-dong)',
    roadName: '선부광장1로 56',
    roadNameKhmer: 'ផ្លូវ សន់ប៊ូក្វាំងចាំង 1-រ៉ូ លេខ 56',
    roadAddress: '경기도 안산시 단원구 선부광장1로 56',
    jibunAddress: '경기도 안산시 단원구 선부동 1076-12',
    buildingName: '공작한양아파트',
    buildingNameKhmer: 'អាផាតមិន គង់ចាក់ហាន់យ៉ាំង',
    sampleDetail: '104동 502호',
    category: 'apartment',
    categoryKhmer: 'អាផាតមិន (아파트)',
    regionTagKhmer: 'អាន់សាន់ (Ansan)',
    keywords: ['안산', '선부동', 'អាន់សាន់', 'សន់ប៊ូដុង', 'ansan', 'seonbu', '15236']
  },
  {
    id: 'gimhae-seosang-1',
    zonecode: '50918',
    sido: '경상남도',
    sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង (Gyeongsangnam-do)',
    sigungu: '김해시',
    sigunguKhmer: 'ក្រុងគីមហេ (Gimhae-si)',
    bname: '서상동',
    bnameKhmer: 'សង្កាត់ស-សាំង-ដុង (Seosang-dong)',
    roadName: '분성로335번길 12',
    roadNameKhmer: 'ផ្លូវ ភុនសង់-រ៉ូ 335-បនគីល លេខ 12',
    roadAddress: '경상남도 김해시 분성로335번길 12',
    jibunAddress: '경상남도 김해시 서상동 82-4',
    buildingName: '금강빌라',
    buildingNameKhmer: 'គឹមហ្គាំង វីឡា (Geumgang Villa)',
    sampleDetail: '3층 302호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'គីមហេ (Gimhae)',
    keywords: ['김해', '경남', '서상동', '분성로', 'គីមហេ', 'gimhae', '50918']
  },
  {
    id: 'gimhae-jinyeong-2',
    zonecode: '50864',
    sido: '경상남도',
    sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង (Gyeongsangnam-do)',
    sigungu: '김해시',
    sigunguKhmer: 'ក្រុងគីមហេ (Gimhae-si)',
    bname: '진영읍',
    bnameKhmer: 'ទីប្រជុំជនជីនយ៉ង-អ៊ឹប (Jinyeong-eup)',
    roadName: '진영산단로 45',
    roadNameKhmer: 'ផ្លូវ ជីនយ៉ងសាន់ដាន់-រ៉ូ លេខ 45',
    roadAddress: '경상남도 김해시 진영읍 진영산단로 45',
    jibunAddress: '경상남도 김해시 진영읍 죽곡리 342-1',
    buildingName: '태광정밀 기숙사',
    buildingNameKhmer: 'អន្តេវាសិកដ្ឋានរោងចក្រ ថេក្វាំង',
    sampleDetail: '기숙사 B동 204호',
    category: 'dormitory',
    categoryKhmer: 'រោងចក្រ / អន្តេវាសិកដ្ឋាន (공장/기숙사)',
    regionTagKhmer: 'គីមហេ (Gimhae)',
    keywords: ['김해', '진영읍', '죽곡리', 'គីមហេ', 'ជីនយ៉ង', 'gimhae', 'jinyeong', '50864']
  },
  {
    id: 'hwaseong-hyangnam-1',
    zonecode: '18592',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '화성시',
    sigunguKhmer: 'ក្រុងហ្វាសង់ (Hwaseong-si)',
    bname: '향남읍',
    bnameKhmer: 'ទីប្រជុំជនហ្យាំងណាំ-អ៊ឹប (Hyangnam-eup)',
    roadName: '발안공단로 92-12',
    roadNameKhmer: 'ផ្លូវ ផាល់អានគង់ដាន់-រ៉ូ លេខ 92-12',
    roadAddress: '경기도 화성시 향남읍 발안공단로 92-12',
    jibunAddress: '경기도 화성시 향남읍 구문천리 925-3',
    buildingName: '발안테크노밸리 기숙사',
    buildingNameKhmer: 'អន្តេវាសិកដ្ឋាន ផាល់អាន (Balan Dormitory)',
    sampleDetail: 'A동 305호',
    category: 'dormitory',
    categoryKhmer: 'រោងចក្រ / អន្តេវាសិកដ្ឋាន (공장/기숙사)',
    regionTagKhmer: 'ហ្វាសង់ / ផាល់អាន (Hwaseong)',
    keywords: ['화성', '향남', '발안', '구문천리', 'ហ្វាសង់', 'ផាល់អាន', 'ហ្យាំងណាំ', 'hwaseong', 'hyangnam', 'balan', '18592']
  },
  {
    id: 'pyeongtaek-poseung-1',
    zonecode: '17957',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '평택시',
    sigunguKhmer: 'ក្រុងផ្យុងថេក (Pyeongtaek-si)',
    bname: '포승읍',
    bnameKhmer: 'ទីប្រជុំជនផូស៊ឹង-អ៊ឹប (Poseung-eup)',
    roadName: '포승공단로 118',
    roadNameKhmer: 'ផ្លូវ ផូស៊ឹងគង់ដាន់-រ៉ូ លេខ 118',
    roadAddress: '경기도 평택시 포승읍 포승공단로 118',
    jibunAddress: '경기도 평택시 포승읍 내기리 658-2',
    buildingName: '포승스마트빌',
    buildingNameKhmer: 'ផូស៊ឹង ស្មាតវីល (Poseung Smartvill)',
    sampleDetail: '403호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'ផ្យុងថេក (Pyeongtaek)',
    keywords: ['평택', '포승읍', 'ផ្យុងថេក', 'ផូស៊ឹង', 'pyeongtaek', 'poseung', '17957']
  },
  {
    id: 'incheon-bupyeong-1',
    zonecode: '21394',
    sido: '인천광역시',
    sidoKhmer: 'ទីក្រុងអ៊ីនឆន (Incheon Metropolitan City)',
    sigungu: '부평구',
    sigunguKhmer: 'ខណ្ឌភូផ្យង (Bupyeong-gu)',
    bname: '부평동',
    bnameKhmer: 'សង្កាត់ភូផ្យង-ដុង (Bupyeong-dong)',
    roadName: '부평대로 88',
    roadNameKhmer: 'មហាវិថី ភូផ្យង-ដេរ៉ូ លេខ 88',
    roadAddress: '인천광역시 부평구 부평대로 88',
    jibunAddress: '인천광역시 부평구 부평동 194-23',
    buildingName: '부평현대오피스텔',
    buildingNameKhmer: 'អគារ ភូផ្យង ហ្យន់ដេ អូភីសថេល',
    sampleDetail: '7층 712호',
    category: 'apartment',
    categoryKhmer: 'អាផាតមិន / អូភីសថេល (오피스텔)',
    regionTagKhmer: 'អ៊ីនឆន (Incheon)',
    keywords: ['인천', '부평구', '부평동', 'អ៊ីនឆន', 'ភូផ្យង', 'incheon', 'bupyeong', '21394']
  },
  {
    id: 'cheonan-seobuk-1',
    zonecode: '31079',
    sido: '충청남도',
    sidoKhmer: 'ខេត្តឈុងឆងខាងត្បូង (Chungcheongnam-do)',
    sigungu: '천안시 서북구',
    sigunguKhmer: 'ក្រុងឆន់អាន ខណ្ឌសប៊ុក (Cheonan-si Seobuk-gu)',
    bname: '성정동',
    bnameKhmer: 'សង្កាត់សង់ចង់-ដុង (Seongjeong-dong)',
    roadName: '동서대로 129',
    roadNameKhmer: 'មហាវិថី ដុងស-ដេរ៉ូ លេខ 129',
    roadAddress: '충청남도 천안시 서북구 동서대로 129',
    jibunAddress: '충청남도 천안시 서북구 성정동 652-8',
    buildingName: '스타팰리스',
    buildingNameKhmer: 'អគារ ស្តាផាលេស (Star Palace)',
    sampleDetail: '508호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'ឆន់អាន (Cheonan)',
    keywords: ['천안', '서북구', '성정동', 'ឆន់អាន', 'cheonan', '31079']
  },
  {
    id: 'pocheon-soheul-1',
    zonecode: '11175',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '포천시',
    sigunguKhmer: 'ក្រុងផូឆន (Pocheon-si)',
    bname: '소흘읍',
    bnameKhmer: 'ទីប្រជុំជនសូហ៊ឹល-អ៊ឹប (Soheul-eup)',
    roadName: '호국로 623',
    roadNameKhmer: 'ផ្លូវ ហូគុក-រ៉ូ លេខ 623',
    roadAddress: '경기도 포천시 소흘읍 호국로 623',
    jibunAddress: '경기도 포천시 소흘읍 송우리 148-11',
    buildingName: '송우그린빌라',
    buildingNameKhmer: 'សុងអ៊ូ គ្រីនវីឡា (Songu Green Villa)',
    sampleDetail: '나동 202호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'ផូឆន / សុងអ៊ូរី (Pocheon)',
    keywords: ['포천', '소흘읍', '송우리', 'ផូឆន', 'សុងអ៊ូរី', 'pocheon', 'songuri', '11175']
  },
  {
    id: 'gwangju-gonjiam-1',
    zonecode: '12811',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '광주시',
    sigunguKhmer: 'ក្រុងក្វាំងជូ (Gwangju-si, Gyeonggi)',
    bname: '곤지암읍',
    bnameKhmer: 'ទីប្រជុំជនគុនជីអាំ-អ៊ឹប (Gonjiam-eup)',
    roadName: '경충대로 731',
    roadNameKhmer: 'មហាវិថី ខ្យងឈុង-ដេរ៉ូ លេខ 731',
    roadAddress: '경기도 광주시 곤지암읍 경충대로 731',
    jibunAddress: '경기도 광주시 곤지암읍 곤지암리 445-6',
    buildingName: '곤지암빌리지',
    buildingNameKhmer: 'គុនជីអាំ វីលីជ (Gonjiam Village)',
    sampleDetail: '101동 301호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'ក្វាំងជូ ខ្យងគី (Gwangju)',
    keywords: ['광주시', '곤지암', 'ក្វាំងជូ', 'គុនជីអាំ', 'gwangju', 'gonjiam', '12811']
  },
  {
    id: 'siheung-jeongwang-1',
    zonecode: '15049',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '시흥시',
    sigunguKhmer: 'ក្រុងស៊ីហ៊ឹង (Siheung-si)',
    bname: '정왕동',
    bnameKhmer: 'សង្កាត់ចង់វ៉ាំង-ដុង (Jeongwang-dong)',
    roadName: '정왕대로 174',
    roadNameKhmer: 'មហាវិថី ចង់វ៉ាំង-ដេរ៉ូ លេខ 174',
    roadAddress: '경기도 시흥시 정왕대로 174',
    jibunAddress: '경기도 시흥시 정왕동 1732-8',
    buildingName: '세종프라자',
    buildingNameKhmer: 'អគារ សេជុងផ្លាហ្សា (Sejong Plaza)',
    sampleDetail: '2층 205호',
    category: 'commercial',
    categoryKhmer: 'ហាង / អគារពាណិជ្ជកម្ម (상가/매장)',
    regionTagKhmer: 'ស៊ីហ៊ឹង (Siheung)',
    keywords: ['시흥', '정왕동', 'ស៊ីហ៊ឹង', 'ចង់វ៉ាំងដុង', 'siheung', 'jeongwang', '15049']
  },
  {
    id: 'seoul-guro-1',
    zonecode: '08311',
    sido: '서울특별시',
    sidoKhmer: 'ទីក្រុងសេអ៊ូល (Seoul Metropolitan City)',
    sigungu: '구로구',
    sigunguKhmer: 'ខណ្ឌគូរ៉ូ (Guro-gu)',
    bname: '가리봉동',
    bnameKhmer: 'សង្កាត់កាពីបុង-ដុង (Garibong-dong)',
    roadName: '디지털로 182',
    roadNameKhmer: 'ផ្លូវ ឌីជីថល-រ៉ូ លេខ 182',
    roadAddress: '서울특별시 구로구 디지털로 182',
    jibunAddress: '서울특별시 구로구 가리봉동 125-4',
    buildingName: '가리봉스위트빌',
    buildingNameKhmer: 'កាពីបុង ស្វីតវីល',
    sampleDetail: '401호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'សេអ៊ូល (Seoul)',
    keywords: ['서울', '구로구', '가리봉동', 'សេអ៊ូល', 'គូរ៉ូ', 'seoul', 'guro', '08311']
  },
  {
    id: 'daegu-dalseong-1',
    zonecode: '42982',
    sido: '대구광역시',
    sidoKhmer: 'ទីក្រុងថេគូ (Daegu Metropolitan City)',
    sigungu: '달성군',
    sigunguKhmer: 'ស្រុកដាល់សង់ (Dalseong-gun)',
    bname: '논공읍',
    bnameKhmer: 'ទីប្រជុំជនណុនគង់-អ៊ឹប (Nongong-eup)',
    roadName: '논공로 697',
    roadNameKhmer: 'ផ្លូវ ណុនគង់-រ៉ូ លេខ 697',
    roadAddress: '대구광역시 달성군 논공읍 논공로 697',
    jibunAddress: '대구광역시 달성군 논공읍 북리 803-5',
    buildingName: '청구타운',
    buildingNameKhmer: 'អាផាតមិន ឆងគូថោន',
    sampleDetail: '102동 804호',
    category: 'apartment',
    categoryKhmer: 'អាផាតមិន (아파트)',
    regionTagKhmer: 'ថេគូ (Daegu)',
    keywords: ['대구', '달성군', '논공읍', 'ថេគូ', 'daegu', 'dalseong', '42982']
  },
  {
    id: 'busan-sasang-1',
    zonecode: '46978',
    sido: '부산광역시',
    sidoKhmer: 'ទីក្រុងប៊ូសាន (Busan Metropolitan City)',
    sigungu: '사상구',
    sigunguKhmer: 'ខណ្ឌសាសាំង (Sasang-gu)',
    bname: '괘법동',
    bnameKhmer: 'សង្កាត់ក្វេបប់-ដុង (Gwaebeop-dong)',
    roadName: '사상로 201',
    roadNameKhmer: 'ផ្លូវ សាសាំង-រ៉ូ លេខ 201',
    roadAddress: '부산광역시 사상구 사상로 201',
    jibunAddress: '부산광역시 사상구 괘법동 535-14',
    buildingName: '사상센트럴빌',
    buildingNameKhmer: 'សាសាំង សេនត្រល់វីល',
    sampleDetail: '6층 603호',
    category: 'apartment',
    categoryKhmer: 'អាផាតមិន / អូភីសថេល (오피스텔)',
    regionTagKhmer: 'ប៊ូសាន (Busan)',
    keywords: ['부산', '사상구', '괘법동', 'ប៊ូសាន', 'busan', 'sasang', '46978']
  },
  {
    id: 'gimpo-daegot-1',
    zonecode: '10040',
    sido: '경기도',
    sidoKhmer: 'ខេត្តខ្យងគី (Gyeonggi-do)',
    sigungu: '김포시',
    sigunguKhmer: 'ក្រុងគីមផូ (Gimpo-si)',
    bname: '대곶면',
    bnameKhmer: 'ឃុំដេកុត-ម្យ៉ន (Daegot-myeon)',
    roadName: '송마로 129-59',
    roadNameKhmer: 'ផ្លូវ សុងម៉ា-រ៉ូ លេខ 129-59',
    roadAddress: '경기도 김포시 대곶면 송마로 129-59',
    jibunAddress: '경기도 김포시 대곶면 송마리 38-2',
    buildingName: '(주) 다승',
    buildingNameKhmer: 'ក្រុមហ៊ុន/រោងចក្រ ដាស៊ឹង ((주) 다승)',
    sampleDetail: '(주) 다승',
    category: 'dormitory',
    categoryKhmer: 'រោងចក្រ / ក្រុមហ៊ុន (공장/회사)',
    regionTagKhmer: 'គីមផូ (Gimpo)',
    keywords: ['김포', '대곶면', '송마로', '다승', 'គីមផូ', 'ដេកុត', 'gimpo', 'daegot', '10040']
  },
  {
    id: 'eumseong-daeso-1',
    zonecode: '27659',
    sido: '충청북도',
    sidoKhmer: 'ខេត្តឈុងឆងខាងជើង (Chungcheongbuk-do)',
    sigungu: '음성군',
    sigunguKhmer: 'ស្រុកអ៊ឹមសង់ (Eumseong-gun)',
    bname: '대소면',
    bnameKhmer: 'ឃុំដេសូ-ម្យ៉ន (Daeso-myeon)',
    roadName: '대금로 421',
    roadNameKhmer: 'ផ្លូវ ដេគឹម-រ៉ូ លេខ 421',
    roadAddress: '충청북도 음성군 대소면 대금로 421',
    jibunAddress: '충청북도 음성군 대소면 오산리 132-7',
    buildingName: '대소현대빌라',
    buildingNameKhmer: 'ដេសូ ហ្យន់ដេ វីឡា',
    sampleDetail: 'A동 103호',
    category: 'villa',
    categoryKhmer: 'វីឡា / បន្ទប់ជួល (빌라/원룸)',
    regionTagKhmer: 'អ៊ឹមសង់ (Eumseong)',
    keywords: ['음성', '대소면', '충북', 'អ៊ឹមសង់', 'ដេសូ', 'eumseong', 'daeso', '27659']
  }
];

// Official Korea Post (우체국) 5-digit Zonecode automatic lookup table by district/city
export const AUTO_POSTAL_CODE_LOOKUP: Array<{
  pattern: RegExp;
  zonecode: string;
  sido: string;
  sidoKhmer: string;
  sigunguKhmer: string;
}> = [
  { pattern: /안산.*단원|원곡동|선부동|초지동|고잔동/, zonecode: '15380', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងអាន់សាន់ ខណ្ឌដាន់វ៉ន' },
  { pattern: /안산.*상록|본오동|사동|이동|일동/, zonecode: '15585', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងអាន់សាន់ ខណ្ឌសាំងរ៉ុក' },
  { pattern: /김해.*진영/, zonecode: '50864', sido: '경상남도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង', sigunguKhmer: 'ក្រុងគីមហេ (ជីនយ៉ង)' },
  { pattern: /김해|서상동|부원동|내동|어방동|삼계동|한림면|주촌면/, zonecode: '50918', sido: '경상남도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង', sigunguKhmer: 'ក្រុងគីមហេ' },
  { pattern: /화성.*향남|발안|구문천/, zonecode: '18592', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងហ្វាសង់ (ហ្យាំងណាំ/ផាល់អាន)' },
  { pattern: /화성|남양읍|팔탄면|우정읍|봉담읍|병점|동탄/, zonecode: '18274', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងហ្វាសង់' },
  { pattern: /평택.*포승/, zonecode: '17957', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងផ្យុងថេក (ផូស៊ឹង)' },
  { pattern: /평택|안중읍|팽성읍|청북읍|송탄|고덕/, zonecode: '17901', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងផ្យុងថេក' },
  { pattern: /시흥|정왕동|시화/, zonecode: '15049', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងស៊ីហ៊ឹង' },
  { pattern: /포천|소흘읍|송우리|가산면|내촌면/, zonecode: '11175', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងផូឆន' },
  { pattern: /김포.*대곶|송마로|송마리/, zonecode: '10040', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងគីមផូ (ដេកុត-ម្យ៉ន)' },
  { pattern: /김포|양촌읍|통진읍|월곶면|하성면/, zonecode: '10048', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងគីមផូ' },
  { pattern: /광주시|곤지암|초월읍|오포|경안동/, zonecode: '12811', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងក្វាំងជូ (ខ្យងគី)' },
  { pattern: /수원|팔달구|권선구|영통구|장안구/, zonecode: '16455', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងស៊ូវ៉ន' },
  { pattern: /양주시|양주|광적면|백석읍|회천/, zonecode: '11498', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងយ៉ាំងជូ' },
  { pattern: /이천시|이천|부발읍|장호원/, zonecode: '17379', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងអ៊ីឆន' },
  { pattern: /안성시|안성|공도읍|대덕면|미양면/, zonecode: '17561', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងអាន់សង់' },
  { pattern: /파주시|파주|금촌|문산읍|조리읍/, zonecode: '10924', sido: '경기도', sidoKhmer: 'ខេត្តខ្យងគី', sigunguKhmer: 'ក្រុងផាជូ' },
  { pattern: /인천.*부평/, zonecode: '21394', sido: '인천광역시', sidoKhmer: 'ទីក្រុងអ៊ីនឆន', sigunguKhmer: 'ខណ្ឌភូផ្យង' },
  { pattern: /인천.*남동|논현|고잔|구월/, zonecode: '21633', sido: '인천광역시', sidoKhmer: 'ទីក្រុងអ៊ីនឆន', sigunguKhmer: 'ខណ្ឌណាំដុង' },
  { pattern: /인천.*서구|검단|청라|가좌/, zonecode: '22784', sido: '인천광역시', sidoKhmer: 'ទីក្រុងអ៊ីនឆន', sigunguKhmer: 'ខណ្ឌស៊-គូ' },
  { pattern: /천안.*서북|성정동|두정동|성환읍|직산읍/, zonecode: '31079', sido: '충청남도', sidoKhmer: 'ខេត្តឈុងឆងខាងត្បូង', sigunguKhmer: 'ក្រុងឆន់អាន ខណ្ឌសប៊ុក' },
  { pattern: /천안.*동남|신부동|병천면|목천읍/, zonecode: '31127', sido: '충청남도', sidoKhmer: 'ខេត្តឈុងឆងខាងត្បូង', sigunguKhmer: 'ក្រុងឆន់អាន ខណ្ឌដុងណាំ' },
  { pattern: /아산시|아산|둔포면|배방읍|신창면/, zonecode: '31512', sido: '충청남도', sidoKhmer: 'ខេត្តឈុងឆងខាងត្បូង', sigunguKhmer: 'ក្រុងអាសាន់' },
  { pattern: /음성군|음성|대소면|금왕읍|삼성면|맹동면/, zonecode: '27659', sido: '충청북도', sidoKhmer: 'ខេត្តឈុងឆងខាងជើង', sigunguKhmer: 'ស្រុកអ៊ឹមសង់' },
  { pattern: /진천군|진천|광혜원면|덕산읍/, zonecode: '27832', sido: '충청북도', sidoKhmer: 'ខេត្តឈុងឆងខាងជើង', sigunguKhmer: 'ស្រុកជីនឆន' },
  { pattern: /청주시|청주|흥덕구|청원구|오창읍|오송읍/, zonecode: '28426', sido: '충청북도', sidoKhmer: 'ខេត្តឈុងឆងខាងជើង', sigunguKhmer: 'ក្រុងឆងជូ' },
  { pattern: /대구.*달성|논공읍|다사읍|현풍읍/, zonecode: '42982', sido: '대구광역시', sidoKhmer: 'ទីក្រុងថេគូ', sigunguKhmer: 'ស្រុកដាល់សង់' },
  { pattern: /대구.*달서|성서|신당동/, zonecode: '42709', sido: '대구광역시', sidoKhmer: 'ទីក្រុងថេគូ', sigunguKhmer: 'ខណ្ឌដាល់ស៊' },
  { pattern: /부산.*사상|괘법동|감전동|학장동/, zonecode: '46978', sido: '부산광역시', sidoKhmer: 'ទីក្រុងប៊ូសាន', sigunguKhmer: 'ខណ្ឌសាសាំង' },
  { pattern: /부산.*강서|녹산|명지|대저/, zonecode: '46752', sido: '부산광역시', sidoKhmer: 'ទីក្រុងប៊ូសាន', sigunguKhmer: 'ខណ្ឌកាំងស៊' },
  { pattern: /창원|성산구|의창구|진해|마산/, zonecode: '51435', sido: '경상남도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង', sigunguKhmer: 'ក្រុងឆាំងវ៉ន' },
  { pattern: /양산시|양산|물금읍|웅상/, zonecode: '50624', sido: '경상남도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង', sigunguKhmer: 'ក្រុងយ៉ាំងសាន់' },
  { pattern: /거제시|거제|고현동|아주동/, zonecode: '53257', sido: '경상남도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងត្បូង', sigunguKhmer: 'ក្រុងកជេ' },
  { pattern: /경주시|경주|외동읍|안강읍/, zonecode: '38172', sido: '경상북도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងជើង', sigunguKhmer: 'ក្រុងខ្យងជូ' },
  { pattern: /구미시|구미|인동|진미동|공단동/, zonecode: '39388', sido: '경상북도', sidoKhmer: 'ខេត្តខ្យងសាំងខាងជើង', sigunguKhmer: 'ក្រុងគូមី' },
  { pattern: /광주.*광산|하남|평동|월곡동/, zonecode: '62430', sido: '광주광역시', sidoKhmer: 'ទីក្រុងក្វាំងជូ', sigunguKhmer: 'ខណ្ឌក្វាំងសាន់' },
  { pattern: /영암군|삼호읍|대불/, zonecode: '58457', sido: '전라남도', sidoKhmer: 'ខេត្តចនឡាខាងត្បូង', sigunguKhmer: 'ស្រុកយ៉ងអាំ (សាំហូ)' },
  { pattern: /제주시|제주|애월읍|한림읍/, zonecode: '63122', sido: '제주특별자치도', sidoKhmer: 'កោះជេជូ', sigunguKhmer: 'ក្រុងជេជូ' },
  { pattern: /서귀포시|서귀포|대정읍|성산읍/, zonecode: '63565', sido: '제주특별자치도', sidoKhmer: 'កោះជេជូ', sigunguKhmer: 'ក្រុងស៊ក្វីផូ' },
  { pattern: /서울.*구로|가리봉|구로동/, zonecode: '08311', sido: '서울특별시', sidoKhmer: 'ទីក្រុងសេអ៊ូល', sigunguKhmer: 'ខណ្ឌគូរ៉ូ' },
  { pattern: /서울.*영등포|대림동|영등포동/, zonecode: '07442', sido: '서울특별시', sidoKhmer: 'ទីក្រុងសេអ៊ូល', sigunguKhmer: 'ខណ្ឌយ៉ងឌឹងផូ' },
  { pattern: /서울/, zonecode: '04524', sido: '서울특별시', sidoKhmer: 'ទីក្រុងសេអ៊ូល', sigunguKhmer: 'តំបន់សេអ៊ូល' }
];

export const INITIAL_SAVED_ADDRESSES: SavedCustomerAddress[] = [
  {
    id: 'saved-1',
    recipientName: 'សុខា វណ្ណា (Sokha Vanna)',
    phone: '010-4829-1920',
    zonecode: '15380',
    roadAddress: '경기도 안산시 단원구 다문화길 24',
    jibunAddress: '경기도 안산시 단원구 원곡동 785-1',
    detailAddress: '한마음빌라 201호',
    buildingName: '한마음빌라',
    bname: '원곡동',
    deliveryMemo: '문 앞에 놓아주세요 (공동현관: #1234*)',
    entranceCode: '#1234*',
    labelTag: 'vip',
    isFavorite: true,
    useCount: 14,
    lastUsedAt: '2026-10-17',
    noteKhmer: 'អតិថិជនប្រចាំ កម្ម៉ង់គ្រឿងទេសខ្មែររៀងរាល់ថ្ងៃសៅរ៍'
  },
  {
    id: 'saved-2',
    recipientName: 'ចាន់ ធារ៉ា (Chan Theara)',
    phone: '010-8371-5504',
    zonecode: '18592',
    roadAddress: '경기도 화성시 향남읍 발안공단로 92-12',
    jibunAddress: '경기도 화성시 향남읍 구문천리 925-3',
    detailAddress: '발안테크노밸리 기숙사 A동 305호',
    buildingName: '발안테크노밸리 기숙사',
    bname: '향남읍',
    deliveryMemo: '기숙사 관리실(수위실)에 맡겨주세요',
    entranceCode: '자유출입',
    labelTag: 'dormitory',
    isFavorite: true,
    useCount: 8,
    lastUsedAt: '2026-10-15',
    noteKhmer: 'ធ្វើការវេនថ្ងៃ សូមដាក់នៅបន្ទប់គ្រប់គ្រងអន្តេវាសិកដ្ឋាន'
  },
  {
    id: 'saved-3',
    recipientName: 'ម៉ៅ ស្រីពៅ (Mao Sreypov)',
    phone: '010-2940-7781',
    zonecode: '50918',
    roadAddress: '경상남도 김해시 분성로335번길 12',
    jibunAddress: '경상남도 김해시 서상동 82-4',
    detailAddress: '금강빌라 3층 302호',
    buildingName: '금강빌라',
    bname: '서상동',
    deliveryMemo: '냉동/신선식품입니다. 빠른 배송 부탁드립니다',
    entranceCode: '종 2580',
    labelTag: 'customer',
    isFavorite: false,
    useCount: 5,
    lastUsedAt: '2026-10-12',
    noteKhmer: 'ផ្ញើម្ហូបក្លាសេទៅគីមហេ'
  }
];

export interface ParsedKoreanAddressResult {
  recipientName: string;
  phone: string;
  zonecode: string;
  zonecodeAutoDetected: boolean;
  sido: string;
  sidoKhmer: string;
  sigungu: string;
  sigunguKhmer: string;
  bname: string;
  roadName: string;
  jibunPart: string;
  roadAddress: string;
  jibunAddress: string;
  detailAddress: string;
  buildingName: string;
  cleanSearchQuery: string;
  detectedType: 'R' | 'J';
}

export interface AddressValidationDiagnosis {
  originalInput: string;
  hasIssue: boolean;
  isUnrecognized: boolean;
  issueMessagesKhmer: string[];
  correctedQuery: string;
  extractedDetail: string;
  matchedRecords: AddressRecord[];
}

const SIDO_NORMALIZER: Record<string, { full: string; khmer: string }> = {
  '서울': { full: '서울특별시', khmer: 'ទីក្រុងសេអ៊ូល (Seoul)' },
  '서울시': { full: '서울특별시', khmer: 'ទីក្រុងសេអ៊ូល (Seoul)' },
  '서울특별시': { full: '서울특별시', khmer: 'ទីក្រុងសេអ៊ូល (Seoul)' },
  '경기': { full: '경기도', khmer: 'ខេត្តខ្យងគី (Gyeonggi-do)' },
  '경기도': { full: '경기도', khmer: 'ខេត្តខ្យងគី (Gyeonggi-do)' },
  '인천': { full: '인천광역시', khmer: 'ទីក្រុងអ៊ីនឆន (Incheon)' },
  '인천시': { full: '인천광역시', khmer: 'ទីក្រុងអ៊ីនឆន (Incheon)' },
  '인천광역시': { full: '인천광역시', khmer: 'ទីក្រុងអ៊ីនឆន (Incheon)' },
  '경남': { full: '경상남도', khmer: 'ខេត្តខ្យងសាំងខាងត្បូង (Gyeongnam)' },
  '경상남도': { full: '경상남도', khmer: 'ខេត្តខ្យងសាំងខាងត្បូង (Gyeongnam)' },
  '경북': { full: '경상북도', khmer: 'ខេត្តខ្យងសាំងខាងជើង (Gyeongbuk)' },
  '경상북도': { full: '경상북도', khmer: 'ខេត្តខ្យងសាំងខាងជើង (Gyeongbuk)' },
  '충남': { full: '충청남도', khmer: 'ខេត្តឈុងឆងខាងត្បូង (Chungnam)' },
  '충청남도': { full: '충청남도', khmer: 'ខេត្តឈុងឆងខាងត្បូង (Chungnam)' },
  '충북': { full: '충청북도', khmer: 'ខេត្តឈុងឆងខាងជើង (Chungbuk)' },
  '충청북도': { full: '충청북도', khmer: 'ខេត្តឈុងឆងខាងជើង (Chungbuk)' },
  '전남': { full: '전라남도', khmer: 'ខេត្តចនឡាខាងត្បូង (Jeonnam)' },
  '전라남도': { full: '전라남도', khmer: 'ខេត្តចនឡាខាងត្បូង (Jeonnam)' },
  '전북': { full: '전북특별자치도', khmer: 'ខេត្តចនឡាខាងជើង (Jeonbuk)' },
  '전라북도': { full: '전북특별자치도', khmer: 'ខេត្តចនឡាខាងជើង (Jeonbuk)' },
  '전북특별자치도': { full: '전북특별자치도', khmer: 'ខេត្តចនឡាខាងជើង (Jeonbuk)' },
  '부산': { full: '부산광역시', khmer: 'ទីក្រុងប៊ូសាន (Busan)' },
  '부산시': { full: '부산광역시', khmer: 'ទីក្រុងប៊ូសាន (Busan)' },
  '부산광역시': { full: '부산광역시', khmer: 'ទីក្រុងប៊ូសាន (Busan)' },
  '대구': { full: '대구광역시', khmer: 'ទីក្រុងថេគូ (Daegu)' },
  '대구시': { full: '대구광역시', khmer: 'ទីក្រុងថេគូ (Daegu)' },
  '대구광역시': { full: '대구광역시', khmer: 'ទីក្រុងថេគូ (Daegu)' },
  '광주': { full: '광주광역시', khmer: 'ទីក្រុងក្វាំងជូ (Gwangju Metro)' },
  '광주광역시': { full: '광주광역시', khmer: 'ទីក្រុងក្វាំងជូ (Gwangju Metro)' },
  '대전': { full: '대전광역시', khmer: 'ទីក្រុងថេចន (Daejeon)' },
  '대전광역시': { full: '대전광역시', khmer: 'ទីក្រុងថេចន (Daejeon)' },
  '울산': { full: '울산광역시', khmer: 'ទីក្រុងអ៊ុលសាន់ (Ulsan)' },
  '울산광역시': { full: '울산광역시', khmer: 'ទីក្រុងអ៊ុលសាន់ (Ulsan)' },
  '세종': { full: '세종특별자치시', khmer: 'ទីក្រុងសេជុង (Sejong)' },
  '세종특별자치시': { full: '세종특별자치시', khmer: 'ទីក្រុងសេជុង (Sejong)' },
  '강원': { full: '강원특별자치도', khmer: 'ខេត្តកាំងវ៉ន (Gangwon)' },
  '강원도': { full: '강원특별자치도', khmer: 'ខេត្តកាំងវ៉ន (Gangwon)' },
  '강원특별자치도': { full: '강원특별자치도', khmer: 'ខេត្តកាំងវ៉ន (Gangwon)' },
  '제주': { full: '제주특별자치도', khmer: 'កោះជេជូ (Jeju)' },
  '제주도': { full: '제주특별자치도', khmer: 'កោះជេជូ (Jeju)' },
  '제주특별자치도': { full: '제주특별자치도', khmer: 'កោះជេជូ (Jeju)' }
};

export function formatKoreanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  if (digits.length === 10 && digits.startsWith('02')) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (digits.length === 12 && digits.startsWith('050')) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}`;
  }
  return raw.trim();
}

export function resolvePostalCodeFromAddress(addressText: string): {
  zonecode: string;
  sidoKhmer: string;
  sigunguKhmer: string;
} {
  for (const rule of AUTO_POSTAL_CODE_LOOKUP) {
    if (rule.pattern.test(addressText)) {
      return {
        zonecode: rule.zonecode,
        sidoKhmer: rule.sidoKhmer,
        sigunguKhmer: rule.sigunguKhmer
      };
    }
  }
  return {
    zonecode: '',
    sidoKhmer: 'ប្រទេសកូរ៉េខាងត្បូង',
    sigunguKhmer: 'តំបន់រដ្ឋបាលកូរ៉េ'
  };
}

export function parseKoreanAddressText(rawText: string): ParsedKoreanAddressResult {
  let working = rawText.trim();

  // Auto-space attached road/lot numbers like "송마로129-59" -> "송마로 129-59" or "원곡동785-1" -> "원곡동 785-1"
  working = working.replace(/([가-힣]+(?:로|길|번길|동|리|읍|면))(\d+(?:-\d+)?)/g, '$1 $2');

  // 1. Extract Korean mobile/phone number if present
  const phoneRegex = /(01[016789][-\s.]?\d{3,4}[-\s.]?\d{4}|050\d[-\s.]?\d{3,4}[-\s.]?\d{4}|0[2-6][1-5]?[-\s.]?\d{3,4}[-\s.]?\d{4})/;
  const phoneMatch = working.match(phoneRegex);
  const phone = phoneMatch ? formatKoreanPhone(phoneMatch[0]) : '';
  if (phoneMatch) {
    working = working.replace(phoneMatch[0], ' ').trim();
  }

  // 2. Extract 5-digit postal code [12345] or (12345) or standalone 5 digits at start/end
  const zoneRegex = /(?:\[|\(|우편번호\s*:?\s*)?(\b\d{5}\b)(?:\]|\))?/;
  const zoneMatch = working.match(zoneRegex);
  let zonecode = zoneMatch ? zoneMatch[1] : '';
  let zonecodeAutoDetected = false;
  if (zoneMatch) {
    working = working.replace(zoneMatch[0], ' ').trim();
  }

  // Clean up common labels like 주소:, 이름:, 연락처:, 성함:
  working = working
    .replace(/(받는\s*분|받는사람|수령인|이름|성함|연락처|전화번호|주소|배송지)\s*[:：]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 3. Separate recipient name if separated by slash, newline, or Khmer characters at start
  let recipientName = '';
  const khmerNameMatch = working.match(/^([\u1780-\u17FF\s]+(?:\([A-Za-z\s]+\))?)/);
  if (khmerNameMatch && khmerNameMatch[1].trim().length >= 2) {
    recipientName = khmerNameMatch[1].trim();
    working = working.replace(khmerNameMatch[0], ' ').trim();
  }

  // Check if separated by / or |
  const partsBySep = working.split(/[\/|\n]+/).map(s => s.trim()).filter(Boolean);
  let addressCore = working;
  if (partsBySep.length >= 2) {
    const addrParts: string[] = [];
    for (const p of partsBySep) {
      if (/(시|도|군|구|읍|면|동|리|로|길|번길|호|층|빌라|아파트|기숙사|\(주\)|주식회사)/.test(p)) {
        addrParts.push(p);
      } else if (!recipientName && p.length <= 20) {
        recipientName = p;
      } else {
        addrParts.push(p);
      }
    }
    if (addrParts.length > 0) {
      addressCore = addrParts.join(' ');
    }
  }

  // 4. Parse Korean address tokens
  const tokens = addressCore.split(/\s+/).filter(Boolean);
  let sido = '';
  let sidoKhmer = '';
  let sigungu = '';
  let bname = '';
  let roadName = '';
  let jibunPart = '';
  let detectedType: 'R' | 'J' = 'R';
  let detailTokens: string[] = [];

  if (tokens.length > 0 && SIDO_NORMALIZER[tokens[0]]) {
    const norm = SIDO_NORMALIZER[tokens[0]];
    sido = norm.full;
    sidoKhmer = norm.khmer;
    tokens.shift();
  }

  // Sigungu (e.g., 안산시 단원구 or 김포시 or 달성군)
  while (tokens.length > 0 && /(시|군|구)$/.test(tokens[0])) {
    sigungu = sigungu ? `${sigungu} ${tokens[0]}` : tokens[0];
    tokens.shift();
  }

  // Eup / Myeon / Dong (if before road name or jibun)
  if (tokens.length > 0 && /(읍|면|동|가)$/.test(tokens[0])) {
    bname = tokens[0];
    tokens.shift();
  }

  // Check if next token is Ri (리) -> Jibun address
  if (tokens.length > 0 && /(리)$/.test(tokens[0])) {
    const riToken = tokens.shift()!;
    bname = bname ? `${bname} ${riToken}` : riToken;
    detectedType = 'J';
    if (tokens.length > 0 && /^(산?\d+(-\d+)?)(번지)?$/.test(tokens[0])) {
      const lotNo = tokens.shift()!.replace('번지', '');
      jibunPart = `${bname} ${lotNo}`.trim();
      roadName = lotNo;
    } else {
      jibunPart = bname;
    }
  } else if (tokens.length > 0 && /(로|길|번길)$/.test(tokens[0])) {
    // Road name + building number (e.g. 송마로 129-59, 다문화길 24, 분성로335번길 12)
    detectedType = 'R';
    roadName = tokens.shift()!;
    if (tokens.length > 0 && /^\d+(-\d+)?(번지)?$/.test(tokens[0])) {
      roadName = `${roadName} ${tokens.shift()!.replace('번지', '')}`;
    }
  } else if (tokens.length > 0 && /^(산?\d+(-\d+)?)(번지)?$/.test(tokens[0])) {
    // Jibun number directly after dong/eup/myeon (e.g., 원곡동 785-1)
    detectedType = 'J';
    const lotNo = tokens.shift()!.replace('번지', '');
    jibunPart = `${bname} ${lotNo}`.trim();
    roadName = lotNo;
  }

  // Remaining tokens are detail address (company name like (주) 다승, building name, dong, floor, ho)
  detailTokens = tokens;
  const detailAddress = detailTokens.join(' ').trim();

  // Auto-resolve postal code if not explicitly in input
  const fullCombined = `${sido} ${sigungu} ${bname} ${roadName} ${detailAddress}`.trim();
  const resolved = resolvePostalCodeFromAddress(fullCombined);
  if (!zonecode && resolved.zonecode) {
    zonecode = resolved.zonecode;
    zonecodeAutoDetected = true;
  }
  if (!sidoKhmer && resolved.sidoKhmer) {
    sidoKhmer = resolved.sidoKhmer;
  }

  // Check if this matches a known record in KOREAN_ADDRESS_DIRECTORY to enrich both roadAddress & jibunAddress
  const matchedRec = KOREAN_ADDRESS_DIRECTORY.find(
    (rec) =>
      (roadName && rec.roadAddress.includes(roadName)) ||
      (jibunPart && rec.jibunAddress.includes(jibunPart))
  );

  const baseRoadAddress =
    detectedType === 'R'
      ? [sido, sigungu, bname && !/(동|가)$/.test(bname) ? bname : '', roadName]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim() || addressCore
      : matchedRec
      ? matchedRec.roadAddress
      : [sido, sigungu, bname, roadName].filter(Boolean).join(' ').trim();

  const baseJibunAddress =
    detectedType === 'J'
      ? [sido, sigungu, jibunPart || `${bname} ${roadName}`.trim()]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
      : matchedRec
      ? matchedRec.jibunAddress
      : [sido, sigungu, bname].filter(Boolean).join(' ').trim();

  // Clean search query for official Korea Post / Daum Postcode lookup (road/jibun without trailing room/company detail)
  const cleanSearchQuery =
    detectedType === 'J'
      ? [sido, sigungu, jibunPart || bname].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim()
      : [sido, sigungu, bname && !/(동|가)$/.test(bname) ? bname : '', roadName]
          .filter(Boolean)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim() ||
        addressCore
          .replace(/\(주\).*$|주식회사.*$|\d+동\s*\d+호.*$|\d+층.*$|\d+호.*$/g, '')
          .trim();

  return {
    recipientName,
    phone,
    zonecode: zonecode || (matchedRec ? matchedRec.zonecode : ''),
    zonecodeAutoDetected,
    sido: sido || (matchedRec ? matchedRec.sido : ''),
    sidoKhmer,
    sigungu: sigungu || (matchedRec ? matchedRec.sigungu : ''),
    sigunguKhmer: resolved.sigunguKhmer,
    bname: bname || (matchedRec ? matchedRec.bname : ''),
    roadName: detectedType === 'R' ? roadName : matchedRec ? matchedRec.roadName : roadName,
    jibunPart:
      jibunPart ||
      (matchedRec
        ? matchedRec.jibunAddress
            .replace(matchedRec.sido, '')
            .replace(matchedRec.sigungu, '')
            .trim()
        : `${bname} ${roadName}`.trim()),
    roadAddress: baseRoadAddress,
    jibunAddress: baseJibunAddress,
    detailAddress,
    buildingName: detailAddress || (matchedRec ? matchedRec.buildingName : ''),
    cleanSearchQuery,
    detectedType
  };
}

// Validate user search query, detect errors/typos/mixed details, and suggest the corrected Korea Post address
export function validateAndCorrectKoreanAddress(rawInput: string): AddressValidationDiagnosis {
  const original = rawInput.trim();
  if (!original) {
    return {
      originalInput: '',
      hasIssue: false,
      isUnrecognized: false,
      issueMessagesKhmer: [],
      correctedQuery: '',
      extractedDetail: '',
      matchedRecords: []
    };
  }

  const issueMessagesKhmer: string[] = [];
  let working = original;

  // 1. Check for ambiguous province names like "경상도", "충청도", "전라도"
  if (/^경상도\b/.test(working)) {
    if (/김해|창원|양산|거제|진주|통영|사천|밀양|함안|창녕/.test(working)) {
      working = working.replace(/^경상도/, '경상남도');
      issueMessagesKhmer.push(
        'ឈ្មោះខេត្ត "경상도" មិនត្រឹមត្រូវតាមស្តង់ដារ 우체국 ទេ — ប្រព័ន្ធបានកែតម្រូវទៅជា "경상남도" (ខេត្តខ្យងសាំងខាងត្បូង)។'
      );
    } else {
      working = working.replace(/^경상도/, '경상북도');
      issueMessagesKhmer.push(
        'ឈ្មោះខេត្ត "경상도" មិនត្រឹមត្រូវតាមស្តង់ដារ 우체국 ទេ — ប្រព័ន្ធបានកែតម្រូវទៅជា "경상북도" (ខេត្តខ្យងសាំងខាងជើង)។'
      );
    }
  }
  if (/^충청도\b/.test(working)) {
    if (/천안|아산|당진|서산|논산|공주|보령|홍성/.test(working)) {
      working = working.replace(/^충청도/, '충청남도');
      issueMessagesKhmer.push(
        'ឈ្មោះខេត្ត "충청도" មិនត្រឹមត្រូវទេ — ប្រព័ន្ធបានកែតម្រូវទៅជា "충청남도" (ខេត្តឈុងឆងខាងត្បូង)។'
      );
    } else {
      working = working.replace(/^충청도/, '충청북도');
      issueMessagesKhmer.push(
        'ឈ្មោះខេត្ត "충청도" មិនត្រឹមត្រូវទេ — ប្រព័ន្ធបានកែតម្រូវទៅជា "충청북도" (ខេត្តឈុងឆងខាងជើង)។'
      );
    }
  }

  // 2. Check if road/dong name and building number lack a space (e.g., 송마로129-59)
  if (/([가-힣]+(?:로|길|번길|동|리))(\d+)/.test(working)) {
    working = working.replace(/([가-힣]+(?:로|길|번길|동|리))(\d+)/g, '$1 $2');
    issueMessagesKhmer.push(
      'ឈ្មោះផ្លូវ/សង្កាត់ និងលេខអគារសរសេរជាប់គ្នា — ប្រព័ន្ធបានដកឃ្លាឱ្យត្រឹមត្រូវតាមស្តង់ដារ 우체국។'
    );
  }

  // 3. Parse the working string to see if trailing detail/company name is mixed in
  const parsed = parseKoreanAddressText(working);
  if (parsed.detailAddress && parsed.cleanSearchQuery && parsed.cleanSearchQuery !== working) {
    issueMessagesKhmer.push(
      `រកឃើញអាសយដ្ឋានលម្អិត ឬឈ្មោះក្រុមហ៊ុន/បន្ទប់ ("${parsed.detailAddress}") លាយក្នុងពាក្យស្វែងរក — ប្រព័ន្ធបានញែកទុកក្នុងប្រអប់លម្អិត (상세주소) ហើយស្វែងរកតាមអាសយដ្ឋានគោល "${parsed.cleanSearchQuery}" វិញ។`
    );
  }

  // 4. Check if the user typed an incomplete or slightly misspelled address that matches our directory
  const qLower = working.toLowerCase();
  const matchedRecords = KOREAN_ADDRESS_DIRECTORY.filter((item) => {
    const roadBase = item.roadName.split(' ')[0];
    return (
      item.roadAddress.toLowerCase().includes(qLower) ||
      item.jibunAddress.toLowerCase().includes(qLower) ||
      qLower.includes(item.roadAddress.toLowerCase()) ||
      qLower.includes(item.jibunAddress.toLowerCase()) ||
      (roadBase && working.includes(roadBase)) ||
      (item.bname && working.includes(item.bname)) ||
      item.keywords.some((k) => k.toLowerCase() === qLower || qLower.includes(k.toLowerCase()))
    );
  });

  // Check if user wrote wrong road suffix (e.g. 송마길 instead of 송마로, 다문화로 instead of 다문화길)
  for (const rec of KOREAN_ADDRESS_DIRECTORY) {
    const trueRoadWord = rec.roadName.split(' ')[0]; // e.g. 송마로, 다문화길
    const stem = trueRoadWord.replace(/(대로|번길|로|길)$/, '');
    if (stem.length >= 2 && working.includes(stem) && !working.includes(trueRoadWord)) {
      const wrongRoadMatch = working.match(new RegExp(`${stem}(?:대로|번길|로|길)`));
      if (wrongRoadMatch) {
        working = working.replace(wrongRoadMatch[0], trueRoadWord);
        issueMessagesKhmer.push(
          `ឈ្មោះផ្លូវ "${wrongRoadMatch[0]}" មិនត្រឹមត្រូវទេ — អាសយដ្ឋានត្រឹមត្រូវតាម 우체국 គឺ "${rec.roadAddress}" (${rec.jibunAddress})។`
        );
        if (!matchedRecords.some((m) => m.id === rec.id)) {
          matchedRecords.unshift(rec);
        }
      }
    }
  }

  // Check if input has no valid Korean address structure at all (when non-Khmer)
  const hasKoreanChars = /[가-힣]/.test(working);
  const hasAddressUnit = /(시|도|군|구|읍|면|동|리|로|길|번길|\d{5})/.test(working);
  let isUnrecognized = false;

  if (hasKoreanChars && !hasAddressUnit && matchedRecords.length === 0) {
    isUnrecognized = true;
    issueMessagesKhmer.push(
      `អាសយដ្ឋាន "${original}" ដែលបានវាយបញ្ចូលមិនត្រឹមត្រូវតាមទម្រង់ប្រៃសណីយ៍កូរ៉េ (ខ្វះឈ្មោះទីក្រុង/ខេត្ត 시·도, សង្កាត់ 읍·면·동 ឬឈ្មោះផ្លូវ 로·길)។ សូមពិនិត្យអាសយដ្ឋានត្រឹមត្រូវខាងក្រោម។`
    );
  } else if (!hasKoreanChars && matchedRecords.length === 0 && !/^\d{5}$/.test(working)) {
    isUnrecognized = true;
    issueMessagesKhmer.push(
      `រកមិនឃើញអាសយដ្ឋាន "${original}" ទេ។ សូមវាយជាអក្សរកូរ៉េ (ឧ. 경기도 김포시 대곶면 송마로 129-59) ឬជ្រើសរើសពីអាសយដ្ឋានត្រឹមត្រូវខាងក្រោម។`
    );
  } else if (hasKoreanChars && !/\d/.test(working) && matchedRecords.length > 0) {
    issueMessagesKhmer.push(
      `អាសយដ្ឋាន "${original}" មិនទាន់មានលេខអគារ (건물번호) ឬលេខដីឡូត៍ (번지) ពេញលេញទេ — ខាងក្រោមនេះជាអាសយដ្ឋានពេញលេញដែលត្រឹមត្រូវតាមស្តង់ដារ 우체국។`
    );
  }

  const finalCorrected =
    isUnrecognized && matchedRecords.length > 0
      ? matchedRecords[0].roadAddress
      : parsed.cleanSearchQuery || working;

  return {
    originalInput: original,
    hasIssue: issueMessagesKhmer.length > 0,
    isUnrecognized,
    issueMessagesKhmer,
    correctedQuery: finalCorrected,
    extractedDetail: parsed.detailAddress,
    matchedRecords: matchedRecords.slice(0, 4)
  };
}
