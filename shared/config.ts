export const CONFIG = {
  TILE: 32,                 // px ต่อ tile
  FRAME: { W: 64, H: 64 },  // ขนาดเฟรมตัวละคร
  PLAYER_SPEED: 150,        // px/วินาที
  MOVE_SEND_HZ: 10,         // ส่งตำแหน่งกี่ครั้ง/วินาที
  LERP: 0.2,                // ค่า interpolation remote player (0..1)
  CHAT_MAX_LEN: 200,
  NAME_MAX_LEN: 16,
  BUBBLE_MS: 4000,          // อายุ chat bubble
  EMOTE_COOLDOWN_MS: 3000,
  EMOTE_SHOW_MS: 2500,      // อายุ balloon + หน้า emote เหนือหัว
  // px (หน่วยโลก 3D = px/TILE) — จุด StartPoint1 (marker สีแดง = จุดเกิดครั้งแรก
  // ของเกมจริง) ในแมพ G30_NoGuild; อีกสองจุดคือ StartPoint2 (น้ำเงิน, 448,112)
  // และ StartPoint3 (เขียว, -234,-255) ไว้ใช้ตอนมีระบบเดินข้ามแมพ
  SPAWN: { x: -415, y: 346 },
  DEMO_STORE: true,         // เปิดชั้น UI โมเดลรายได้ (mock ทั้งหมด — ดู 12tails-demo-monetization-plan.md)

  // ชุดเริ่มต้น (novice) ที่ทุกตัวใส่ตอนเข้าเกม — costume prefab ชื่อ 'scout'
  // มีครบทั้ง 12 ตัว (ผู้เล่นใหม่ในเกมจริงเริ่มด้วยชุดนี้). null = ร่างเปล่า (nude)
  DEFAULT_OUTFIT: 'scout',
  // อาวุธเริ่มต้น = ชิ้นที่ชื่อขึ้นต้น 'novice' ของแต่ละตัว (resolve จาก equipment-index
  // ตอน runtime — ดู ui/equipmentIndex.ts defaultWeapon)
  DEFAULT_WEAPON_PREFIX: 'novice',

  // ---- ระบบแสดงความรู้สึก (id ตรงชื่อไฟล์จากเกมจริง) ----
  // ลูกโป่งอารมณ์เหนือหัว (assets/ui/bubbles/<id>.png)
  EMOTE_BUBBLES: [
    'smile', 'happy', 'haha', 'heart', 'blush', 'exclaim', 'question',
    'sad', 'tear', 'angry', 'mad', 'wrath', 'panic', 'sweat', 'puke',
    'pervert', 'zzz', 'rock', 'paper', 'scissors',
  ],
  // ท่าทางตัวละคร (เล่น animation clip ในโมเดล; chat ใช้คลิป talk)
  EMOTE_ACTIONS: [
    'sit', 'chat', 'dance', 'wave', 'bow', 'cheer',
    'beg', 'sleep', 'cry', 'laugh', 'pose', 'battle',
  ],

  // ---- ระบบตกปลา (ระบบตกปลา-12หาง.md / context-brief) ----
  // กฎเหล็ก: ผลตัดสินที่ server / ตกปลาให้ "เกล็ด" เท่านั้น ห้ามออก Jil /
  // tier + สีกรอบต้องตรงกับคอสตูมในร้าน (StoreModal RARITY_COLOR) → รู้สึกเป็นเกมเดียว
  FISHING: {
    ENABLED: true,
    PROMPT_KEY: 'KeyF',           // ปุ่มเริ่มตกปลาเมื่ออยู่ในเขตจุด
    MIN_CAST_INTERVAL_MS: 1500,   // กัน spam cast (server บังคับ)
    // ระยะเวลามินิเกมฝั่ง client (แค่ presentation — ผลจริงมาจาก server)
    CAST_MS: 900,                 // เหวี่ยง → เบ็ดตกน้ำ
    WAIT_MIN_MS: 1200,            // รอปลากิน (สุ่มในช่วง)
    WAIT_MAX_MS: 3200,
    HOOK_WINDOW_MS: 1100,         // หน้าต่างกด "ดึง!" หลังปลากิน

    // ความหายาก: สีกรอบตรงกับ StoreModal (common/rare/epic) + legendary ทอง
    // price = ราคาขาย (เกล็ด) / chance = %โอกาสจับที่ server ใช้ตัดสิน + โชว์บนจอ
    TIERS: {
      common:    { labelTH: 'ธรรมดา',    color: '#9a8574', price: 8,   chance: 0.9 },
      rare:      { labelTH: 'หายาก',     color: '#4f8fd6', price: 25,  chance: 0.7 },
      epic:      { labelTH: 'เอปิก',      color: '#a763c8', price: 80,  chance: 0.5 },
      legendary: { labelTH: 'เลเจนดารี่', color: '#f5c542', price: 300, chance: 0.3 },
    },

    // นิยามปลา (data-driven) — assetKey อ้างอิง fishingManifest (placeholder ตอนนี้)
    FISH: [
      { id: 'carp',    nameTH: 'ปลาคาร์ป',      tier: 'common',    assetKey: 'fish.common.carp' },
      { id: 'catfish', nameTH: 'ปลาดุก',        tier: 'common',    assetKey: 'fish.common.catfish' },
      { id: 'trout',   nameTH: 'ปลาเทราต์',     tier: 'rare',      assetKey: 'fish.rare.trout' },
      { id: 'koi',     nameTH: 'ปลาคาร์ปนิชิกิ', tier: 'rare',      assetKey: 'fish.rare.koi' },
      { id: 'puffer',  nameTH: 'ปลาปักเป้า',    tier: 'epic',      assetKey: 'fish.epic.puffer' },
      { id: 'dragon',  nameTH: 'ปลามังกร',      tier: 'legendary', assetKey: 'fish.legendary.dragon' },
    ],

    // จุดตกปลา = trigger zone แบบ data ล้วน (ไม่ raycast เช็กน้ำตอนเล่น — spec §4)
    // path = เส้นกลางลำน้ำ (px โลก เดียวกับ CONFIG.SPAWN) สกัดครั้งเดียวจาก mesh
    // 'GuildRiver' ในแมพ G30_NoGuild (จับคู่ vertex สองฝั่งแล้วหาจุดกึ่งกลาง)
    // อยู่ในโซน = ห่างจากเส้นนี้ ≤ radius (น้ำกว้างจริง ~ครึ่งละ 200px + ยืนริมฝั่งได้)
    SPOTS: [
      {
        id: 'camp-river',
        nameTH: 'แม่น้ำหน้าค่าย',
        radius: 280,
        path: [
          [-636, 2400], [-636, 2160], [-564, 1920], [-408, 1680], [-204, 1440],
          [12, 1200], [216, 960], [528, 720], [888, 480], [1248, 252],
          [1416, 0], [1440, -240], [1404, -480], [1356, -720], [1308, -960],
          [1320, -1200], [1368, -1440], [1464, -1680], [1560, -1920], [1656, -2160],
          [1824, -2400],
        ],
        loot: [
          { fish: 'carp', w: 40 },
          { fish: 'catfish', w: 30 },
          { fish: 'trout', w: 15 },
          { fish: 'koi', w: 9 },
          { fish: 'puffer', w: 5 },
          { fish: 'dragon', w: 1 },
        ],
      },
    ],
  },
} as const;
