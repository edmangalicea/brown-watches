import { METHOD_2_STRAP_CATALOG } from "./method-2-catalog";
import type { DeckMethod, StrapCatalogItem } from "./strap-types";

export type { DeckMethod, StrapCatalogItem } from "./strap-types";

type StrapCatalogGroup = {
  sectionId: string;
  sectionRank: number;
  sectionTitle: string;
  items: Array<{ strapRank: number; tier: string; title: string; url: string; image: string }>;
};

const METHOD_1_STRAP_GROUPS: StrapCatalogGroup[] = [
  {
    sectionId: "soft-etaupe-everyday-neutral",
    sectionRank: 1,
    sectionTitle: "Soft Etaupe Everyday Neutral",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Suede Etaupe Leather watch strap", url: "https://tunsstore.com/product/suede-etaupe-leather-watch-strap/", image: "/images/tuns/suede-14-scaled-19c9970488.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "butero etaupe leather watch strap", url: "https://tunsstore.com/product/butero-etaupe-leather-watch-strap/", image: "/images/tuns/butero-4-scaled-22efe0ee17.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Nubuck begie watch strap", url: "https://tunsstore.com/product/nubuck-begie-watch-strap/", image: "/images/tuns/nubuck-4-scaled-592d2103d1.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Cartier togo etaupe leather watch strap", url: "https://tunsstore.com/product/cartier-togo-etaupe-leather-watch-strap/", image: "/images/tuns/togo-carti-3-22c843cd8b.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "Omega box calf etaupe Leather watch strap", url: "https://tunsstore.com/product/omega-box-calf-etaupe-leather-watch-strap/", image: "/images/tuns/box-omega-33-5b8ccf3fde.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Rally butero etaupe leather watch strap", url: "https://tunsstore.com/product/rally-butero-etaupe-leather-watch-strap/", image: "/images/tuns/rally-15-scaled-7ecaa4f2c8.jpg" },
      { strapRank: 7, tier: "Broader Fallback", title: "epsom cream leather watch strap", url: "https://tunsstore.com/product/epsom-begie-leather-watch-strap/", image: "/images/tuns/IMG_1630-scaled-bd91d636ed.jpg" },
      { strapRank: 8, tier: "Dress Fallback", title: "Etaupe alligator round pattern Leather watch strap", url: "https://tunsstore.com/product/etaupe-alligator-round-pattern-leather-watch-strap/", image: "/images/tuns/ALLIGATOR-54-scaled-473ab3bde5.jpg" },
      { strapRank: 9, tier: "Dress Fallback", title: "Etaupe alligator leather cartier watch strap", url: "https://tunsstore.com/product/etaupe-alligator-leather-cartier-watch-strap/", image: "/images/tuns/alli-carti-1-6b9e9a1c7f.jpg" },
      { strapRank: 10, tier: "Dress Fallback", title: "Alligator henglong etaupe Leather watch strap", url: "https://tunsstore.com/product/alligator-nino-etaupe-leather-watch-strap/", image: "/images/tuns/alligator-14-scaled-b3141c22ef.jpg" }
    ]
  },
  {
    sectionId: "deep-dark-brown-nubuck",
    sectionRank: 2,
    sectionTitle: "Deep Dark-Brown Nubuck",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Nubuck dark brown watch strap", url: "https://tunsstore.com/product/nubuck-dark-brown-watch-strap/", image: "/images/tuns/IMG_2262-scaled-b243c0b784.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Nubuck smooth sepia watch strap", url: "https://tunsstore.com/product/nubuck-smooth-sepia-watch-strap/", image: "/images/tuns/NUBUCK-56-scaled-3e19920136.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Nubuck smooth brown watch strap", url: "https://tunsstore.com/product/nubuck-smooth-brown-watch-strap/", image: "/images/tuns/NUBUCK-82-scaled-599a1599dc.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Nubuck brown watch strap", url: "https://tunsstore.com/product/nubuck-brown-watch-strap/", image: "/images/tuns/MG_3416-scaled-f98bf941e8.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "Nubuck smooth patina tan brown watch strap", url: "https://tunsstore.com/product/nubuck-smooth-patina-watch-strap/", image: "/images/tuns/NUBUCK-52-scaled-db0a2dc663.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Embossed calf leather , Nubuck brown watch strap", url: "https://tunsstore.com/product/nubuck-brown-watch-strap-embossed-calf-leather/", image: "/images/tuns/MG_3378-scaled-e5455ba9a6.jpg" },
      { strapRank: 7, tier: "Broader Fallback", title: "Nubuck tan brown watch strap", url: "https://tunsstore.com/product/nubuck-smooth-tan-brown-watch-strap/", image: "/images/tuns/NUBUCK-37-scaled-dc90d6075d.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "Nubuck smooth conag watch strap", url: "https://tunsstore.com/product/nubuck-smooth-conag-watch-strap/", image: "/images/tuns/NUBUCK-39-scaled-439311313e.jpg" },
      { strapRank: 9, tier: "Dress Fallback", title: "Alligator nubuck brown leather watch strap", url: "https://tunsstore.com/product/alligator-nubuck-brown-leather-watch-strap/", image: "/images/tuns/alligator-12-scaled-4253cdedef.jpg" },
      { strapRank: 10, tier: "Late Fallback", title: "Nubuck smooth tan orange watch strap", url: "https://tunsstore.com/product/nubuck-smooth-tan-orange-watch-strap/", image: "/images/tuns/NUBUCK-scaled-c4756de1d6.jpg" }
    ]
  },
  {
    sectionId: "graphite-suede-soft-grey-matte",
    sectionRank: 3,
    sectionTitle: "Graphite Suede / Soft Grey Matte",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Suede dark grey Leather watch strap", url: "https://tunsstore.com/product/suede-dark-grey-leather-watch-strap/", image: "/images/tuns/z6736392640401_1ba93c0b80fcc55baab6a793f63da444-1-8a40f412ff.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Nubuck Grey watch strap", url: "https://tunsstore.com/product/nubuck-grey-watch-strap/", image: "/images/tuns/nubuck-8-scaled-3f7e78d52e.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Suede Gray Leather watch strap", url: "https://tunsstore.com/product/suede-gray-leather-watch-strap/", image: "/images/tuns/suede-4-scaled-90d101562c.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Pueblo Grey leather watch strap", url: "https://tunsstore.com/product/pueblo-grey-leather-watch-strap/", image: "/images/tuns/MG_3050-scaled-981e3a7a71.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "Museum patina gray leather watch strap", url: "https://tunsstore.com/product/museum-patina-gray-leather-watch-strap/", image: "/images/tuns/museum-20-67173e00d3.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Waxy steel gray watch strap", url: "https://tunsstore.com/product/waxy-steel-gray-watch-strap/", image: "/images/tuns/waxy-38-scaled-459e77f7d7.jpg" },
      { strapRank: 7, tier: "Broader Fallback", title: "Waxy Gray watch strap", url: "https://tunsstore.com/product/waxy-gray-watch-strap/", image: "/images/tuns/waxy-57-scaled-723522a10c.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "vachetta gray Leather watch strap", url: "https://tunsstore.com/product/vachetta-gray-leather-watch-strap/", image: "/images/tuns/VACHETTA-2-scaled-425fcd1ee7.jpg" },
      { strapRank: 9, tier: "Structured Fallback", title: "Epi grayLeather watch strap", url: "https://tunsstore.com/product/epi-grayleather-watch-strap/", image: "/images/tuns/epi-1-scaled-2d4ddf9859.jpg" },
      { strapRank: 10, tier: "Watch-Specific Fallback", title: "cartier Togo gray leather watch strap", url: "https://tunsstore.com/product/cartier-navy-blue-togo-leather-watch-strap-copy/", image: "/images/tuns/togo-carti-15-3b6957ea76.jpg" }
    ]
  },
  {
    sectionId: "ink-navy-refined-texture",
    sectionRank: 4,
    sectionTitle: "Ink Navy Refined Texture",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Alran suly navy watch strap", url: "https://tunsstore.com/product/allran-sully-navi-watch-strap/", image: "/images/tuns/allran-22-scaled-2e19ebeb2b.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Babele navy blue watch strap", url: "https://tunsstore.com/product/babele-navi-blue-watch-strap-3/", image: "/images/tuns/babele-21-scaled-fcb5870f4d.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Pueblo dark navy leather watch strap", url: "https://tunsstore.com/product/pueblo-dark-navi-leather-watch-strap/", image: "/images/tuns/MG_3475-scaled-6c3c914448.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Suede navy blue Leather watch strap", url: "https://tunsstore.com/product/suede-navi-blue-leather-watch-strap/", image: "/images/tuns/MG_3413-scaled-ce97352472.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "butero navy leather watch strap", url: "https://tunsstore.com/product/butero-navi-leather-watch-strap/", image: "/images/tuns/butero-3-scaled-2cb92f2957.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Alaska navy leather watch strap", url: "https://tunsstore.com/product/alaska-black-leather-watch-strap-copy/", image: "/images/tuns/alaska-2-scaled-6d27851eb7.jpg" },
      { strapRank: 7, tier: "Watch-Specific Fallback", title: "cartier Navy blue leather watch strap", url: "https://tunsstore.com/product/cartier-navy-blue-togo-leather-watch-strap/", image: "/images/tuns/togo-carti-19-32c999e715.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "Bison Navy leather watch strap", url: "https://tunsstore.com/product/bison-dark-blue-leather-watch-strap/", image: "/images/tuns/bo-rung-4-scaled-a3478f0ba2.jpg" },
      { strapRank: 9, tier: "Collector Fallback", title: "Shell cordovan shinki navy watch strap", url: "https://tunsstore.com/product/shell-cordovan-shinki-navy-watch-strap/", image: "/images/tuns/shell-2-scaled-ac780fad4e.jpg" },
      { strapRank: 10, tier: "Watch-Specific Fallback", title: "Omega Claps Babele navy blue watch strap", url: "https://tunsstore.com/product/omega-claps-babele-navi-bluewatch-strap/", image: "/images/tuns/babele-54-scaled-25547e8144.jpg" }
    ]
  },
  {
    sectionId: "black-formal-minimal",
    sectionRank: 5,
    sectionTitle: "Black Formal Minimal",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Box Calf black Leather watch strap", url: "https://tunsstore.com/product/boxcafl-black-leather-watch-strap-2/", image: "/images/tuns/IMG_1213-scaled-755cff11df.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Alran sully Black watch strap", url: "https://tunsstore.com/product/allran-sully-black-watch-strap/", image: "/images/tuns/IMG_1745-scaled-53a8b7fab2.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Swift Black Leather watch strap", url: "https://tunsstore.com/product/swilf-black-leather-watch-strap/", image: "/images/tuns/MG_3333-scaled-9949e2addb.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "butero black leather watch strap", url: "https://tunsstore.com/product/butero-black-leather-watch-strap/", image: "/images/tuns/butero-14-scaled-802382bad2.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "vachetta Black Leather watch strap", url: "https://tunsstore.com/product/vachetta-black-leather-watch-strap/", image: "/images/tuns/IMG_1695-scaled-54f3c5950c.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "minimalist style vachetta black Leather watch strap", url: "https://tunsstore.com/product/minimalist-style-vachetta-black-leather-watch-strap/", image: "/images/tuns/MG_3313-scaled-2a9e11480d.jpg" },
      { strapRank: 7, tier: "Structured Fallback", title: "epsom black leather watch strap", url: "https://tunsstore.com/product/epsom-black-leather-watch-strap/", image: "/images/tuns/epsom-12-scaled-74ce32d760.jpg" },
      { strapRank: 8, tier: "Structured Fallback", title: "Epi Black Leather watch strap", url: "https://tunsstore.com/product/epi-black-leather-watch-strap/", image: "/images/tuns/z6956623311416_250de431dd8ee6039410f698003a22df-5b4bb03372.jpg" },
      { strapRank: 9, tier: "Broader Fallback", title: "Alaska black leather watch strap", url: "https://tunsstore.com/product/alaska-black-leather-watch-strap/", image: "/images/tuns/alaska-13-scaled-f84db71925.jpg" },
      { strapRank: 10, tier: "Sport Fallback", title: "Rally Box Calf Black Leather watch strap", url: "https://tunsstore.com/product/boxcafl-black-leather-watch-strap/", image: "/images/tuns/IMG_1890-scaled-7cb57115c1.jpg" }
    ]
  },
  {
    sectionId: "dark-brown-polished-minimal",
    sectionRank: 6,
    sectionTitle: "Dark-Brown Polished Minimal",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Alran suly dark brown watch strap", url: "https://tunsstore.com/product/allran-sully-dark-brown-watch-strap/", image: "/images/tuns/IMG_1818-scaled-33e42c46e2.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "butero dark brown leather watch strap", url: "https://tunsstore.com/product/butero-dark-brown-leather-watch-strap/", image: "/images/tuns/IMG_1731-scaled-d88f3a4297.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Babele brown watch strap", url: "https://tunsstore.com/product/babele-brown-watch-strap/", image: "/images/tuns/babele-14-scaled-c5df902c65.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Omega box calf dark brown Leather watch strap", url: "https://tunsstore.com/product/omega-box-calf-dark-brown-gray-leather-watch-strap/", image: "/images/tuns/box-omega-25-6db790c038.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "Tuscany dark brown leather watch strap", url: "https://tunsstore.com/product/tuscany-dark-brown-leather-watch-strap/", image: "/images/tuns/TUSCANY-11-scaled-986eabeb02.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Maya Brown Leather watch strap", url: "https://tunsstore.com/product/maya-brown-leather-watch-strap/", image: "/images/tuns/z7004316826544_d87f4e6608c773437e76243417a99135-fa8fe454e9.jpg" },
      { strapRank: 7, tier: "Broader Fallback", title: "vachetta Dark brown Leather watch strap", url: "https://tunsstore.com/product/vachetta-dark-brown-leather-watch-strap/", image: "/images/tuns/MG_3450-scaled-c5b9c72e1a.jpg" },
      { strapRank: 8, tier: "Rugged-Leaning Fallback", title: "Chromepak horween sepia watch strap", url: "https://tunsstore.com/product/chromepak-horween-sepia-watch-strap/", image: "/images/tuns/sap-3-scaled-51724d5020.jpg" },
      { strapRank: 9, tier: "Rugged-Leaning Fallback", title: "chromepak horween tobaco Leather watch strap", url: "https://tunsstore.com/product/chromepak-horween-leather-watch-strap/", image: "/images/tuns/SAP-WAX-5-0e1539e8eb.jpg" },
      { strapRank: 10, tier: "Rugged-Leaning Fallback", title: "Waxy tobacco leather watch strap", url: "https://tunsstore.com/product/waxy-tobacco-leather-watch-strap/", image: "/images/tuns/WAXY-3-scaled-c82020e43e.jpg" }
    ]
  },
  {
    sectionId: "soft-black-matte-casual",
    sectionRank: 7,
    sectionTitle: "Soft Black Matte Casual",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Nubuck smooth black watch strap", url: "https://tunsstore.com/product/nubuck-smooth-black-watch-strap/", image: "/images/tuns/NUBUCK-33-scaled-ec80432bb9.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Suede Black Leather watch strap", url: "https://tunsstore.com/product/suede-black-leather-watch-strap/", image: "/images/tuns/IMG_1976-scaled-e21bef152d.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Babele black watch strap", url: "https://tunsstore.com/product/babele-black-watch-strap/", image: "/images/tuns/babele-29-scaled-84785bfb25.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Pueblo black leather watch strap", url: "https://tunsstore.com/product/pueblo-black-leather-watch-strap/", image: "/images/tuns/PUEBLO-12-scaled-d4c7f88af0.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "Bison black leather watch strap", url: "https://tunsstore.com/product/bison-black-leather-watch-strap/", image: "/images/tuns/bo-rung-10-scaled-a33f47dd91.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "chromepak horween black Leather watch strap", url: "https://tunsstore.com/product/chromepak-horween-black-leather-watch-strap/", image: "/images/tuns/SAP-WAX-15-89b5b9012f.jpg" },
      { strapRank: 7, tier: "Sport Fallback", title: "Rally butero black leather watch strap", url: "https://tunsstore.com/product/rally-butero-black-leather-watch-strap/", image: "/images/tuns/rally-19-scaled-fac2720bcd.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "Alaska black leather watch strap", url: "https://tunsstore.com/product/alaska-black-leather-watch-strap/", image: "/images/tuns/alaska-13-scaled-f84db71925.jpg" },
      { strapRank: 9, tier: "Utility Fallback", title: "vegtan black Leather watch strap", url: "https://tunsstore.com/product/vegtan-black-leather-watch-strap/", image: "/images/tuns/IMG_2119-scaled-47e3defba6.jpg" },
      { strapRank: 10, tier: "Utility Fallback", title: "Embossed cowhide vegtan Black watch strap", url: "https://tunsstore.com/product/embossed-cowhide-vegtan-black-watch-strap/", image: "/images/tuns/dap-van-13-scaled-74074d3713.jpg" }
    ]
  },
  {
    sectionId: "slate-grey-structured-leather",
    sectionRank: 8,
    sectionTitle: "Slate-Grey Structured Leather",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "epsom dark grey leather watch strap", url: "https://tunsstore.com/product/babele-navi-blue-watch-strap-2/", image: "/images/tuns/IMG_1775-scaled-401fb43c2a.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "epsom grey leather watch strap", url: "https://tunsstore.com/product/epsom-grey-leather-watch-strap/", image: "/images/tuns/IMG_1788-scaled-0ba2b0b88c.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Swift gray Leather watch strap", url: "https://tunsstore.com/product/swift-gray-leather-watch-strap/", image: "/images/tuns/MG_3339-scaled-4f1f402cac.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Epi grayLeather watch strap", url: "https://tunsstore.com/product/epi-grayleather-watch-strap/", image: "/images/tuns/epi-1-scaled-2d4ddf9859.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "cartier Togo gray leather watch strap", url: "https://tunsstore.com/product/cartier-navy-blue-togo-leather-watch-strap-copy/", image: "/images/tuns/togo-carti-15-3b6957ea76.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Museum patina gray leather watch strap", url: "https://tunsstore.com/product/museum-patina-gray-leather-watch-strap/", image: "/images/tuns/museum-20-67173e00d3.jpg" },
      { strapRank: 7, tier: "Watch-Specific Fallback", title: "Gray Bison leather cartier watch strap", url: "https://tunsstore.com/product/gray-bison-leather-cartier-watch-strap/", image: "/images/tuns/bo-rung-carti-5-6271a74d66.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "vachetta gray Leather watch strap", url: "https://tunsstore.com/product/vachetta-gray-leather-watch-strap/", image: "/images/tuns/VACHETTA-2-scaled-425fcd1ee7.jpg" },
      { strapRank: 9, tier: "Dress Fallback", title: "Alligator nubuck gray leather watch strap", url: "https://tunsstore.com/product/alligator-nubuck-gray-leather-watch-strap/", image: "/images/tuns/alligator-30-scaled-fd8025a7e6.jpg" },
      { strapRank: 10, tier: "Dress Fallback", title: "dark gray alligator leather cartier watch strap", url: "https://tunsstore.com/product/dark-gray-alligator-leather-cartier-watch-strap/", image: "/images/tuns/z7048002822594_e1aee2bcf569a06e5b342b0b7cc328b6-1e025b48f1.jpg" }
    ]
  },
  {
    sectionId: "muted-blue-accent",
    sectionRank: 9,
    sectionTitle: "Muted Blue Accent",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Suede dark blue Leather watch strap", url: "https://tunsstore.com/product/suede-dark-blue-leather-watch-strap/", image: "/images/tuns/suede-6-scaled-df016285db.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Suede navy blue Leather watch strap", url: "https://tunsstore.com/product/suede-navi-blue-leather-watch-strap/", image: "/images/tuns/MG_3413-scaled-ce97352472.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Natural grain veg dark blue leather watch strap", url: "https://tunsstore.com/product/veg-bung-dark-blue-leather-watch-strap/", image: "/images/tuns/BUTERO-4-ec57a5087b.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Alaska blue leather watch strap", url: "https://tunsstore.com/product/alaska-blue-leather-watch-strap/", image: "/images/tuns/alaska-15-scaled-7b604c6994.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "butero navy leather watch strap", url: "https://tunsstore.com/product/butero-navi-leather-watch-strap/", image: "/images/tuns/butero-3-scaled-2cb92f2957.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Babele navy blue watch strap", url: "https://tunsstore.com/product/babele-navi-blue-watch-strap-3/", image: "/images/tuns/babele-21-scaled-fcb5870f4d.jpg" },
      { strapRank: 7, tier: "Dress Fallback", title: "Museum patina blue leather watch strap", url: "https://tunsstore.com/product/museum-patina-blue-leather-watch-strap/", image: "/images/tuns/museum-5-21d2a07fa4.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "Bison Navy leather watch strap", url: "https://tunsstore.com/product/bison-dark-blue-leather-watch-strap/", image: "/images/tuns/bo-rung-4-scaled-a3478f0ba2.jpg" },
      { strapRank: 9, tier: "Watch-Specific Fallback", title: "cartier Navy blue leather watch strap", url: "https://tunsstore.com/product/cartier-navy-blue-togo-leather-watch-strap/", image: "/images/tuns/togo-carti-19-32c999e715.jpg" },
      { strapRank: 10, tier: "Broader Fallback", title: "Pueblo dark navy leather watch strap", url: "https://tunsstore.com/product/pueblo-dark-navi-leather-watch-strap/", image: "/images/tuns/MG_3475-scaled-6c3c914448.jpg" }
    ]
  },
  {
    sectionId: "one-controlled-matte-exotic",
    sectionRank: 10,
    sectionTitle: "One Controlled Matte Exotic",
    items: [
      { strapRank: 1, tier: "Purest Pick", title: "Alligator nubuck navy leather watch strap", url: "https://tunsstore.com/product/alligator-nubuck-navy-leather-watch-strap/", image: "/images/tuns/alligator-27-scaled-158bcd20c3.jpg" },
      { strapRank: 2, tier: "Purest Pick", title: "Alligator nubuck gray leather watch strap", url: "https://tunsstore.com/product/alligator-nubuck-gray-leather-watch-strap/", image: "/images/tuns/alligator-30-scaled-fd8025a7e6.jpg" },
      { strapRank: 3, tier: "Purest Pick", title: "Alligator nino stone gray Leather watch strap", url: "https://tunsstore.com/product/alligator-nino-stone-gray-leather-watch-strap/", image: "/images/tuns/alligator-33-scaled-e17498b0a4.jpg" },
      { strapRank: 4, tier: "Purest Pick", title: "Alligator Dark navy leather watch strap", url: "https://tunsstore.com/product/alligator-dark-navy-leather-watch-strap/", image: "/images/tuns/alligator-10-scaled-e4b56dc4f8.jpg" },
      { strapRank: 5, tier: "Purest Pick", title: "dark gray alligator leather cartier watch strap", url: "https://tunsstore.com/product/dark-gray-alligator-leather-cartier-watch-strap/", image: "/images/tuns/z7048002822594_e1aee2bcf569a06e5b342b0b7cc328b6-1e025b48f1.jpg" },
      { strapRank: 6, tier: "Broader Fallback", title: "Alligator henglong etaupe Leather watch strap", url: "https://tunsstore.com/product/alligator-nino-etaupe-leather-watch-strap/", image: "/images/tuns/alligator-14-scaled-b3141c22ef.jpg" },
      { strapRank: 7, tier: "Broader Fallback", title: "Etaupe alligator leather cartier watch strap", url: "https://tunsstore.com/product/etaupe-alligator-leather-cartier-watch-strap/", image: "/images/tuns/alli-carti-1-6b9e9a1c7f.jpg" },
      { strapRank: 8, tier: "Broader Fallback", title: "Etaupe alligator round pattern Leather watch strap", url: "https://tunsstore.com/product/etaupe-alligator-round-pattern-leather-watch-strap/", image: "/images/tuns/ALLIGATOR-54-scaled-473ab3bde5.jpg" },
      { strapRank: 9, tier: "Broader Fallback", title: "Alligator nubuck brown leather watch strap", url: "https://tunsstore.com/product/alligator-nubuck-brown-leather-watch-strap/", image: "/images/tuns/alligator-12-scaled-4253cdedef.jpg" },
      { strapRank: 10, tier: "Late Fallback", title: "black alligator leather cartier watch strap", url: "https://tunsstore.com/product/black-alligator-leather-cartier-watch-strap/", image: "/images/tuns/alli-carti-39-aa264116cf.jpg" }
    ]
  }
];

export const METHOD_1_STRAP_CATALOG: StrapCatalogItem[] = METHOD_1_STRAP_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    id: item.url,
    method: "v1",
    sectionId: group.sectionId,
    sectionRank: group.sectionRank,
    sectionTitle: group.sectionTitle,
    strapRank: item.strapRank,
    tier: item.tier,
    title: item.title,
    url: item.url,
    image: item.image
  }))
);

export { METHOD_2_STRAP_CATALOG };

export const STRAP_CATALOG_BY_METHOD = {
  v1: METHOD_1_STRAP_CATALOG,
  v2: METHOD_2_STRAP_CATALOG
} satisfies Record<DeckMethod, StrapCatalogItem[]>;
