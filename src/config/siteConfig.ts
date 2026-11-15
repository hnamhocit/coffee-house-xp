export interface SiteConfig {
  name: string;
  shortName: string;
  slogan: string;
  tagline: string;
  description: string;
  address: string;
  addressShort: string;
  district: string;
  city: string;
  hotline: string;
  hotlineDisplay: string;
  zalo: string;
  facebookUrl: string; // Để trống theo yêu cầu, chủ quán có thể thêm link sau
  openingHours: string;
  openingDays: string;
  googleMapsUrl: string;
  googleMapsEmbed: string;
  bankInfo: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    bankShortCode: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "Xuân Phạm Coffee House",
  shortName: "Xuân Phạm Coffee House",
  slogan: "Chậm lại một nhịp giữa bộn bề phố thị, tìm chút an yên dưới bóng tre xanh.",
  tagline: "Chậm lại một nhịp giữa bộn bề phố thị, tìm chút an yên dưới bóng tre xanh.",
  description: "Xuân Phạm Coffee House tại 905 Hùng Vương, Phú Mỹ, Thủ Dầu Một, Bình Dương. Không gian vườn tre xanh mát tự nhiên, cà phê rang mộc nguyên chất, matcha latte kem muối, trà đào tươi mát. Giá bình dân 10k - 30k.",
  address: "905 Hùng Vương, Phường Phú Mỹ, TP. Thủ Dầu Một, Tỉnh Bình Dương",
  addressShort: "905 Hùng Vương, P. Phú Mỹ, Thủ Dầu Một, Bình Dương",
  district: "Phú Mỹ, TP. Thủ Dầu Một",
  city: "Bình Dương",
  hotline: "0365777113",
  hotlineDisplay: "0365 777 113",
  zalo: "0365777113",
  // Facebook của chủ quán: Để trống theo yêu cầu của bạn, bạn có thể dán link facebook vào đây khi cần
  facebookUrl: "", 
  openingHours: "06:00 - 22:00",
  openingDays: "Tất cả các ngày trong tuần (T2 - CN)",
  googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=905+H%C3%B9ng+V%C6%B0%C6%A1ng,+Ph%C3%BA+M%E1%BB%B9,+Th%E1%BB%A7+D%E1%BA%A7u+M%E1%BB%99t,+B%C3%ACnh+D%C6%B0%C6%A1ng",
  // Google maps embed chính xác cho đường Hùng Vương, Phường Phú Mỹ, Thủ Dầu Một
  googleMapsEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.164727878144!2d106.6791!3d11.0185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3174d75d6918a597%3A0x46328325603b5a75!2zxJAxrW5nIEjDuW5nIFbGsMahbmcsIFBow7ogTTe7LCBUaOG7pyBE4bqndSBN4buZLCBCw6xuaCBExrDGoW5n!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn",
  bankInfo: {
    bankName: "Techcombank",
    accountNumber: "3657771130",
    accountHolder: "PHAM THI THANH XUAN",
    bankShortCode: "TCB",
  },
};
