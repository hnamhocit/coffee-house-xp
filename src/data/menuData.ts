export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  image: string;
  badge?: "Best Seller" | "Mới" | "Thanh Mát" | "Đậm Đà" | "Ưu Đãi";
  allowCustomization?: boolean;
}

export type MenuCategory = 
  | "all"
  | "best-seller"
  | "coffee"
  | "matcha"
  | "tra"
  | "nuoc-ep"
  | "sinh-to"
  | "sua-tuoi"
  | "tra-nong"
  | "nuoc-ngot"
  | "khac";

export interface CategoryInfo {
  id: MenuCategory;
  label: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: "all", label: "Tất Cả Món" },
  { id: "best-seller", label: "🔥 Bán Chạy Nhất" },
  { id: "coffee", label: "Cà Phê & Cacao" },
  { id: "matcha", label: "Matcha Latte" },
  { id: "tra", label: "Trà Trái Cây" },
  { id: "nuoc-ep", label: "Nước Ép Tươi" },
  { id: "sinh-to", label: "Sinh Tố" },
  { id: "sua-tuoi", label: "Sữa Tươi & Flan" },
  { id: "tra-nong", label: "Trà Nóng (Free Bình 2)" },
  { id: "nuoc-ngot", label: "Nước Ngọt" },
  { id: "khac", label: "Thuốc Lá & Khác" },
];

export const MENU_ITEMS: MenuItem[] = [
  // BEST SELLERS (Grouped first for maximum sales)
  {
    id: "cf-muoi",
    name: "Coffee Muối",
    category: "coffee",
    price: 25000,
    image: "/images/drinks/cf-muoi.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "matcha-kem-muoi",
    name: "Matcha Latte Kem Muối",
    category: "matcha",
    price: 30000,
    image: "/images/drinks/matcha-latte.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "tra-dao",
    name: "Trà Đào",
    category: "tra",
    price: 25000,
    image: "/images/drinks/tra-dao.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "st-bo",
    name: "Sinh Tố Bơ",
    category: "sinh-to",
    price: 30000,
    image: "/images/drinks/st-bo.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "bac-xiu",
    name: "Bạc Xỉu",
    category: "coffee",
    price: 25000,
    image: "/images/drinks/bac-xiu.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "st-duong-den-flan",
    name: "Sữa Tươi Đường Đen Bánh Flan",
    category: "sua-tuoi",
    price: 30000,
    image: "/images/drinks/st-duong-den.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "tra-nong-binh",
    name: "Ấm Trà Nóng Thảo Mộc",
    category: "tra-nong",
    price: 10000,
    image: "/images/drinks/tra-nong.jpg",
    badge: "Ưu Đãi",
    allowCustomization: false,
  },

  // COFFEE & CACAO
  {
    id: "cf-sua-da",
    name: "Coffee Sữa Đá",
    category: "coffee",
    price: 22000,
    image: "/images/drinks/cf-sua-da.jpg",
    badge: "Đậm Đà",
    allowCustomization: true,
  },
  {
    id: "cf-da",
    name: "Coffee Đá",
    category: "coffee",
    price: 18000,
    image: "/images/drinks/cf-da.jpg",
    badge: "Đậm Đà",
    allowCustomization: true,
  },
  {
    id: "cf-nong",
    name: "Coffee Nóng",
    category: "coffee",
    price: 15000,
    image: "/images/drinks/cf-nong.jpg",
    allowCustomization: true,
  },
  {
    id: "cf-sua-nong",
    name: "Coffee Sữa Nóng",
    category: "coffee",
    price: 20000,
    image: "/images/drinks/cf-sua-da.jpg",
    allowCustomization: true,
  },
  {
    id: "cacao-sua-da",
    name: "Cacao Sữa Đá",
    category: "coffee",
    price: 25000,
    image: "/images/drinks/cacao.jpg",
    allowCustomization: true,
  },
  {
    id: "cacao-nong",
    name: "Cacao Nóng",
    category: "coffee",
    price: 20000,
    image: "/images/drinks/cacao.jpg",
    allowCustomization: true,
  },
  {
    id: "sua-nong",
    name: "Sữa Nóng",
    category: "coffee",
    price: 20000,
    image: "/images/drinks/cf-nong.jpg",
    allowCustomization: false,
  },

  // MATCHA LATTE & CACAO
  {
    id: "coco-matcha",
    name: "Coco Matcha",
    category: "matcha",
    price: 30000,
    image: "/images/drinks/coco-matcha.jpg",
    badge: "Mới",
    allowCustomization: true,
  },
  {
    id: "matcha-latte",
    name: "Matcha Latte",
    category: "matcha",
    price: 25000,
    image: "/images/drinks/matcha-latte.jpg",
    allowCustomization: true,
  },
  {
    id: "cacao-latte-kem-muoi",
    name: "Cacao Latte Kem Muối",
    category: "matcha",
    price: 30000,
    image: "/images/drinks/cacao.jpg",
    badge: "Đậm Đà",
    allowCustomization: true,
  },
  {
    id: "cacao-latte",
    name: "Cacao Latte",
    category: "matcha",
    price: 25000,
    image: "/images/drinks/cacao.jpg",
    allowCustomization: true,
  },
  {
    id: "cacao-dam-milo",
    name: "Cacao Dầm Milo",
    category: "matcha",
    price: 20000,
    image: "/images/drinks/cacao.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },

  // TRÀ & DỪA LẠNH
  {
    id: "dua-lanh",
    name: "Dừa Lạnh",
    category: "tra",
    price: 25000,
    image: "/images/drinks/dua-lanh.jpg",
    badge: "Thanh Mát",
    allowCustomization: false,
  },
  {
    id: "tra-thao-moc",
    name: "Trà Thảo Mộc",
    category: "tra",
    price: 20000,
    image: "/images/drinks/tra-thao-moc.jpg",
    badge: "Thanh Mát",
    allowCustomization: true,
  },
  {
    id: "lipton-da",
    name: "Lipton Đá",
    category: "tra",
    price: 25000,
    image: "/images/drinks/tra-dao.jpg",
    allowCustomization: true,
  },
  {
    id: "tra-tac",
    name: "Trà Tắc",
    category: "tra",
    price: 20000,
    image: "/images/drinks/tra-tac.jpg",
    badge: "Thanh Mát",
    allowCustomization: true,
  },
  {
    id: "tra-chanh",
    name: "Trà Chanh",
    category: "tra",
    price: 20000,
    image: "/images/drinks/tra-tac.jpg",
    allowCustomization: true,
  },

  // NƯỚC ÉP TRÁI CÂY TƯƠI
  {
    id: "ep-cam",
    name: "Nước Ép Cam",
    category: "nuoc-ep",
    price: 25000,
    image: "/images/drinks/ep-cam.jpg",
    badge: "Thanh Mát",
    allowCustomization: true,
  },
  {
    id: "ep-thom",
    name: "Nước Ép Thơm",
    category: "nuoc-ep",
    price: 25000,
    image: "/images/drinks/ep-thom.jpg",
    allowCustomization: true,
  },
  {
    id: "ep-chanh-day",
    name: "Nước Ép Chanh Dây",
    category: "nuoc-ep",
    price: 20000,
    image: "/images/drinks/ep-cam.jpg",
    allowCustomization: true,
  },
  {
    id: "ep-dua-hau",
    name: "Nước Ép Dưa Hấu",
    category: "nuoc-ep",
    price: 25000,
    image: "/images/drinks/ep-dua-hau.jpg",
    badge: "Thanh Mát",
    allowCustomization: true,
  },
  {
    id: "ep-ca-rot",
    name: "Nước Ép Cà Rốt",
    category: "nuoc-ep",
    price: 25000,
    image: "/images/drinks/ep-cam.jpg",
    allowCustomization: true,
  },
  {
    id: "ep-oi",
    name: "Nước Ép Ổi",
    category: "nuoc-ep",
    price: 25000,
    image: "/images/drinks/ep-oi.jpg",
    badge: "Thanh Mát",
    allowCustomization: true,
  },
  {
    id: "ep-tao",
    name: "Nước Ép Táo",
    category: "nuoc-ep",
    price: 30000,
    image: "/images/drinks/ep-cam.jpg",
    allowCustomization: true,
  },
  {
    id: "ep-dua-luoi",
    name: "Nước Ép Dưa Lưới",
    category: "nuoc-ep",
    price: 30000,
    image: "/images/drinks/ep-thom.jpg",
    badge: "Mới",
    allowCustomization: true,
  },
  {
    id: "ep-mix",
    name: "Nước Ép Mix Tự Chọn",
    category: "nuoc-ep",
    price: 30000,
    image: "/images/drinks/ep-cam.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },

  // SINH TỐ TRÁI CÂY
  {
    id: "st-sambo",
    name: "Sinh Tố Sambo",
    category: "sinh-to",
    price: 30000,
    image: "/images/drinks/st-bo.jpg",
    allowCustomization: true,
  },
  {
    id: "st-dau",
    name: "Sinh Tố Dâu",
    category: "sinh-to",
    price: 30000,
    image: "/images/drinks/st-dau.jpg",
    allowCustomization: true,
  },
  {
    id: "st-mang-cau",
    name: "Sinh Tố Mãng Cầu",
    category: "sinh-to",
    price: 30000,
    image: "/images/drinks/st-bo.jpg",
    badge: "Best Seller",
    allowCustomization: true,
  },
  {
    id: "st-dua",
    name: "Sinh Tố Dừa",
    category: "sinh-to",
    price: 25000,
    image: "/images/drinks/dua-lanh.jpg",
    allowCustomization: true,
  },

  // SỮA TƯƠI & BÁNH FLAN
  {
    id: "st-duong-den",
    name: "Sữa Tươi Đường Đen",
    category: "sua-tuoi",
    price: 25000,
    image: "/images/drinks/st-duong-den.jpg",
    allowCustomization: true,
  },
  {
    id: "sua-chua-trai-cay",
    name: "Sữa Chua Trái Cây",
    category: "sua-tuoi",
    price: 25000,
    image: "/images/drinks/st-dau.jpg",
    badge: "Thanh Mát",
    allowCustomization: false,
  },
  {
    id: "banh-flan",
    name: "Bánh Flan",
    category: "sua-tuoi",
    price: 20000,
    image: "/images/drinks/banh-flan.jpg",
    badge: "Best Seller",
    allowCustomization: false,
  },

  // TRÀ NÓNG
  {
    id: "lipton-nong",
    name: "Lipton Nóng",
    category: "tra-nong",
    price: 20000,
    image: "/images/drinks/tra-nong.jpg",
    allowCustomization: true,
  },
  {
    id: "tra-gung-nong",
    name: "Trà Gừng Nóng",
    category: "tra-nong",
    price: 20000,
    image: "/images/drinks/tra-nong.jpg",
    badge: "Thanh Mát",
    allowCustomization: true,
  },
  {
    id: "chanh-nong",
    name: "Chanh Nóng",
    category: "tra-nong",
    price: 20000,
    image: "/images/drinks/tra-nong.jpg",
    allowCustomization: true,
  },

  // NƯỚC NGỌT
  {
    id: "bo-huc",
    name: "Bò Húc (Red Bull)",
    category: "nuoc-ngot",
    price: 22000,
    image: "/images/drinks/cf-da.jpg",
    allowCustomization: false,
  },
  {
    id: "pepsi",
    name: "Pepsi / Coca / Sting / Ô Long",
    category: "nuoc-ngot",
    price: 20000,
    image: "/images/drinks/cf-da.jpg",
    allowCustomization: false,
  },

  // THUỐC LÁ & KHÁC
  {
    id: "craven-classic",
    name: "Craven Classic / Demi / 555 / Sài Gòn Bạc",
    category: "khac",
    price: 30000,
    image: "/images/drinks/cf-nong.jpg",
    allowCustomization: false,
  },
  {
    id: "khan-lanh",
    name: "Khăn Lạnh",
    category: "khac",
    price: 2000,
    image: "/images/drinks/dua-lanh.jpg",
    allowCustomization: false,
  },
];
