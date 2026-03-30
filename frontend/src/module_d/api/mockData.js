/**
 * Mock Data — Module D (PBI 4.4 & 4.5)
 * 
 * 按照数据库 Schema 结构组织的模拟数据：
 * - users: id, username, role, ...
 * - resources: id, title, description, category_id, contributor_id, status, place, ...
 * - categories: id, name, ...
 * - tags: id, name
 */

export const MOCK_USERS = [
  { id: 101, username: "HeritageLover", role: "VIEWER", avatar_url: null },
  { id: 103, username: "LakeLover", role: "CONTRIBUTOR", avatar_url: null },
  { id: 104, username: "StoryTeller", role: "CONTRIBUTOR", avatar_url: null },
  { id: 105, username: "FestivalFan", role: "VIEWER", avatar_url: null },
  { id: 106, username: "MusicLover", role: "VIEWER", avatar_url: null },
  { id: 107, username: "Chronicler", role: "CONTRIBUTOR", avatar_url: null },
  { id: 108, username: "MarketGoer", role: "VIEWER", avatar_url: null },
  { id: 109, username: "SilkRoadScholar", role: "CONTRIBUTOR", avatar_url: null }
];

export const MOCK_CATEGORIES = [
  { id: 1, name: "Architecture", description: "Historic buildings and structures" },
  { id: 2, name: "Traditions", description: "Local customs and festivals" }
];

export const MOCK_TAGS = [
  { id: 1, name: "Ancient" },
  { id: 2, name: "Stone" },
  { id: 3, name: "Bridge" },
  { id: 4, name: "River" },
  { id: 5, name: "History" },
  { id: 6, name: "Community" },
  { id: 7, name: "Silk Road" },
  { id: 8, name: "Artifacts" },
  { id: 10, name: "Music" },
  { id: 11, name: "Stories" },
  { id: 12, name: "Market" }
];

export const MOCK_RESOURCES = [
  // ── [TEST-D] Old Town Gate (ID: 1) ───────────────────────────────────────
  {
    id: 1,
    title: "[TEST-D] Old Town Gate",
    description: "The historic entrance to the ancient city, preserved for centuries. It stands as a testament to the architectural prowess of the Ming dynasty.",
    category_id: 1,
    contributor_id: 101,
    status: "APPROVED",
    place: "Old Town District",
    copyright_declaration: "Public Domain",
    external_link: "https://en.wikipedia.org/wiki/City_gate",
    created_at: "2025-12-01T10:00:00Z",
    updated_at: "2026-03-25T14:30:00Z",
    like_count: 25,
    comment_count: 6, // 对应 MOCK_COMMENTS 中的数量
    media: [
      { id: 1,  media_type: "COVER",  file_url: "https://picsum.photos/seed/gate_cover/1000/660",   file_name: "gate_main.jpg" },
      { id: 2,  media_type: "DETAIL", file_url: "https://picsum.photos/seed/gate_01/1000/660",      file_name: "gate_detail_1.jpg" },
      { id: 3,  media_type: "DETAIL", file_url: "https://picsum.photos/seed/gate_02/1000/660",      file_name: "gate_detail_2.jpg" },
      { id: 4,  media_type: "DETAIL", file_url: "https://picsum.photos/seed/gate_03/1000/660",      file_name: "gate_detail_3.jpg" },
      { id: 5,  media_type: "DETAIL", file_url: "https://picsum.photos/seed/gate_04/1000/660",      file_name: "gate_detail_4.jpg" },
      { id: 23, media_type: "DETAIL", file_url: "https://picsum.photos/seed/gate_05/1000/660",      file_name: "gate_detail_5.jpg" },
      { id: 24, media_type: "DETAIL", file_url: "https://picsum.photos/seed/gate_06/1000/660",      file_name: "gate_detail_6.jpg" }
    ],
    tag_ids: [1, 2]
  },
  // ── [TEST-D] Ancient Bridge Notes (ID: 2) ────────────────────────────────
  {
    id: 2,
    title: "[TEST-D] Ancient Bridge Notes",
    description: "A collection of architectural notes regarding the stone bridges in the river delta.",
    category_id: 1,
    contributor_id: 103,
    status: "APPROVED",
    place: "River Delta",
    copyright_declaration: "Creative Commons",
    external_link: "https://en.wikipedia.org/wiki/Stone_bridge",
    created_at: "2026-02-15T08:00:00Z",
    updated_at: "2026-03-26T11:00:00Z",
    like_count: 15,
    comment_count: 3, // 对应 MOCK_COMMENTS 中的数量
    media: [
      { id: 6,  media_type: "COVER",  file_url: "https://picsum.photos/seed/bridge_cover/1000/660", file_name: "bridge_main.jpg" },
      { id: 7,  media_type: "DETAIL", file_url: "https://picsum.photos/seed/bridge_01/1000/660",    file_name: "bridge_arch.jpg" },
      { id: 8,  media_type: "DETAIL", file_url: "https://picsum.photos/seed/bridge_02/1000/660",    file_name: "bridge_reflection.jpg" }
    ],
    tag_ids: [3, 4]
  },
  // ── [TEST-D] Local Story Wall (ID: 4) ────────────────────────────────────
  {
    id: 4,
    title: "[TEST-D] Local Story Wall",
    description: "A community-maintained wall where local legends and family histories are inscribed.",
    category_id: 1,
    contributor_id: 104,
    status: "APPROVED",
    place: "Village Center",
    copyright_declaration: "Community Owned",
    external_link: "",
    created_at: "2026-03-20T09:00:00Z",
    updated_at: "2026-03-24T09:00:00Z",
    like_count: 88,
    comment_count: 1, // 对应 MOCK_COMMENTS 中的数量
    media: [
      { id: 10, media_type: "COVER",  file_url: "https://picsum.photos/seed/wall_cover/1000/660",   file_name: "wall_main.jpg" },
      { id: 11, media_type: "DETAIL", file_url: "https://picsum.photos/seed/wall_01/1000/660",      file_name: "wall_inscription.jpg" },
      { id: 25, media_type: "DETAIL", file_url: "https://picsum.photos/seed/wall_02/1000/660",      file_name: "wall_detail_1.jpg" },
      { id: 26, media_type: "DETAIL", file_url: "https://picsum.photos/seed/wall_03/1000/660",      file_name: "wall_detail_2.jpg" }
    ],
    tag_ids: [5, 6]
  },
  // ── [TEST-D] Traditional Festival (ID: 5) ────────────────────────────────
  {
    id: 5,
    title: "[TEST-D] Traditional Festival",
    description: "Annual celebration of local heritage and customs.",
    category_id: 2,
    contributor_id: 105,
    status: "APPROVED",
    place: "Town Square",
    copyright_declaration: "CC BY-SA",
    external_link: "",
    created_at: "2026-03-30T12:00:00Z",
    updated_at: "2026-03-30T12:00:00Z",
    like_count: 5,
    comment_count: 0,
    media: [
      { id: 15, media_type: "COVER",  file_url: "https://picsum.photos/seed/fest_cover/1000/660",   file_name: "fest_main.jpg" }
    ],
    tag_ids: [6]
  },
  // ── [TEST-D] Folk Music Night (ID: 6) ────────────────────────────────────
  {
    id: 6,
    title: "[TEST-D] Folk Music Night",
    description: "A night of traditional music and dance.",
    category_id: 2,
    contributor_id: 106,
    status: "APPROVED",
    place: "Community Hall",
    copyright_declaration: "CC BY-NC",
    external_link: "",
    created_at: "2026-03-25T19:00:00Z",
    updated_at: "2026-03-25T19:00:00Z",
    like_count: 10,
    comment_count: 0,
    media: [
      { id: 16, media_type: "COVER",  file_url: "https://picsum.photos/seed/music_cover/1000/660",  file_name: "music_main.jpg" }
    ],
    tag_ids: [10]
  },
  // ── [TEST-D] Neighborhood Chronicle (ID: 7) ──────────────────────────────
  {
    id: 7,
    title: "[TEST-D] Neighborhood Chronicle",
    description: "A collection of stories from the local neighborhood.",
    category_id: 1,
    contributor_id: 107,
    status: "APPROVED",
    place: "Neighborhood Center",
    copyright_declaration: "Public Domain",
    external_link: "",
    created_at: "2026-03-15T10:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    like_count: 30,
    comment_count: 0,
    media: [
      { id: 17, media_type: "COVER",  file_url: "https://picsum.photos/seed/chron_cover/1000/660",  file_name: "chron_main.jpg" }
    ],
    tag_ids: [11]
  },
  // ── [TEST-D] Riverside Market (ID: 8) ────────────────────────────────────
  {
    id: 8,
    title: "[TEST-D] Riverside Market",
    description: "A bustling market by the river, active for over a century.",
    category_id: 2,
    contributor_id: 108,
    status: "APPROVED",
    place: "Riverside",
    copyright_declaration: "CC BY-ND",
    external_link: "",
    created_at: "2026-01-30T08:00:00Z",
    updated_at: "2026-01-30T08:00:00Z",
    like_count: 2,
    comment_count: 0,
    media: [
      { id: 18, media_type: "COVER",  file_url: "https://picsum.photos/seed/market_cover/1000/660", file_name: "market_main.jpg" }
    ],
    tag_ids: [12]
  },
  // ── ARCHIVED — 仅用于演示"归档"详情页效果 ────────────────────────────────
  {
    id: 3,
    title: "[TEST-D] Archived Silk Road Artifacts",
    description: "A curated collection of artifacts excavated along the ancient Silk Road trade routes.",
    category_id: 1,
    contributor_id: 109,
    status: "ARCHIVED",
    place: "Dunhuang, Gansu, China",
    copyright_declaration: "National Museum",
    external_link: "https://en.wikipedia.org/wiki/Silk_Road",
    created_at: "2026-01-10T09:00:00Z",
    updated_at: "2026-03-01T16:00:00Z",
    like_count: 42,
    comment_count: 2, // 对应 MOCK_COMMENTS 中的数量
    media: [
      { id: 19, media_type: "COVER",  file_url: "https://picsum.photos/seed/sr_cover/1000/660",  file_name: "artifacts_cover.jpg" },
      { id: 20, media_type: "DETAIL", file_url: "https://picsum.photos/seed/sr_01/1000/660",     file_name: "ceramic_vessel.jpg" },
      { id: 21, media_type: "DETAIL", file_url: "https://picsum.photos/seed/sr_02/1000/660",     file_name: "silk_fragment.jpg" }
    ],
    tag_ids: [7, 8]
  }
];

export const MOCK_COMMENTS = [
  // Resource 1: Old Town Gate (6 条)
  { id: 1,  resource_id: 1, user_id: 101, content: "Old Town Gate is amazing!", created_at: "2026-03-26T08:15:00Z" },
  { id: 2,  resource_id: 1, user_id: 103, content: "The history here is palpable.", created_at: "2026-03-26T09:20:00Z" },
  { id: 3,  resource_id: 1, user_id: 104, content: "Great for photography at golden hour.", created_at: "2026-03-26T10:30:00Z" },
  { id: 4,  resource_id: 1, user_id: 105, content: "I love visiting this place every year.", created_at: "2026-03-26T11:45:00Z" },
  { id: 5,  resource_id: 1, user_id: 106, content: "A true landmark of the city.", created_at: "2026-03-26T13:00:00Z" },
  { id: 6,  resource_id: 1, user_id: 107, content: "Ming dynasty architecture at its finest.", created_at: "2026-03-26T14:15:00Z" },

  // Resource 2: Ancient Bridge Notes (3 条)
  { id: 7,  resource_id: 2, user_id: 101, content: "These notes are incredibly detailed.", created_at: "2026-03-27T08:15:00Z" },
  { id: 8,  resource_id: 2, user_id: 103, content: "The interlocking stone engineering is impressive — no mortar needed!", created_at: "2026-03-27T09:20:00Z" },
  { id: 9,  resource_id: 2, user_id: 104, content: "I learned so much from this resource.", created_at: "2026-03-27T10:30:00Z" },

  // Resource 4: Local Story Wall (1 条)
  { id: 10, resource_id: 4, user_id: 103, content: "Each brick tells a different family's story. Absolutely love this wall.", created_at: "2026-03-27T11:45:00Z" },

  // Resource 5: Traditional Festival (0 条 — 暂无评论，符合 comment_count=0)

  // Resource 6: Folk Music Night (0 条)

  // Resource 7: Neighborhood Chronicle (0 条)

  // Resource 8: Riverside Market (0 条)

  // Resource 3: Archived Silk Road (2 条，只读演示)
  { id: 11, resource_id: 3, user_id: 105, content: "History preserved in these artifacts. Such a shame the exhibition closed.", created_at: "2026-02-15T10:00:00Z" },
  { id: 12, resource_id: 3, user_id: 106, content: "The silk fragments still retain traces of their original colour.", created_at: "2026-02-15T11:00:00Z" }
];
