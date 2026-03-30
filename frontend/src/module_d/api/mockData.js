/**
 * Mock Data for Module D (PBI 4.4 & 4.5)
 * These are temporary data structures to simulate backend responses.
 */

export const MOCK_RESOURCES = [
  {
    id: 1,
    title: "Suzhou Classical Gardens",
    description: "The Classical Gardens of Suzhou are a group of gardens in Suzhou, Jiangsu province, China, which have been added to the UNESCO World Heritage List. Spanning a period of nearly one thousand years, from the Northern Song to the late Qing dynasties, these gardens, most of them built by scholars, standardized many of the key features of classical Chinese garden design with landscapes, hills and rivers, and strategic placement of pavilions and trees.",
    status: "APPROVED",
    place: "Suzhou, Jiangsu",
    copyright_declaration: "Public Domain - UNESCO Heritage Site",
    external_link: "https://whc.unesco.org/en/list/813",
    created_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-25T14:30:00Z",
    comment_count: 2,
    like_count: 15,
    category: { id: 1, name: "Architecture" },
    contributor: { id: 101, username: "HeritageLover" },
    media: [
      { id: 1, media_type: "COVER", file_url: "https://images.unsplash.com/photo-1599571234389-bb0899a13467?q=80&w=1000", file_name: "garden_main.jpg" },
      { id: 2, media_type: "DETAIL", file_url: "https://images.unsplash.com/photo-1584646098378-0874589d76b1?q=80&w=1000", file_name: "pavilion.jpg" },
      { id: 3, media_type: "DETAIL", file_url: "https://images.unsplash.com/photo-1528660493888-ab6f4761e036?q=80&w=1000", file_name: "bridge.jpg" }
    ],
    tags: [
      { id: 1, name: "Garden" },
      { id: 2, name: "UNESCO" }
    ]
  },
  {
    id: 2,
    title: "Empty Resource Example",
    description: "", // Empty for testing 'Not provided'
    status: "ARCHIVED",
    place: "",
    copyright_declaration: "",
    external_link: "",
    created_at: "2026-03-28T09:00:00Z",
    updated_at: "2026-03-28T09:00:00Z",
    comment_count: 0,
    like_count: 0,
    category: null,
    contributor: { id: 102, username: "Newbie" },
    media: [
      { id: 4, media_type: "COVER", file_url: "https://via.placeholder.com/1000x600?text=No+Image", file_name: "placeholder.jpg" }
    ],
    tags: []
  }
];

export const MOCK_COMMENTS = [
  {
    id: 1,
    resource_id: 1,
    user: { id: 201, username: "Traveler_A", avatar_url: null },
    content: "This garden is absolutely breathtaking! I visited last year and the atmosphere is so peaceful.",
    created_at: "2026-03-26T08:15:00Z"
  },
  {
    id: 2,
    resource_id: 1,
    user: { id: 202, username: "HistoryBuff", avatar_url: null },
    content: "The architectural details are fascinating. Does anyone know more about the specific stones used in the rockeries?",
    created_at: "2026-03-27T11:45:00Z"
  }
];
