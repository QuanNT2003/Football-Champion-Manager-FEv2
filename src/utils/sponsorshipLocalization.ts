import type { Language } from '../i18n/types';
import { sponsorshipsEn, sponsorshipsVi } from '../i18n/sponsorships';

// Covers the sponsor catalog in qkaito_football_champion_seed_data.sql.
export const sponsorIndustries: readonly (readonly [string, string])[] = [
  ['Thể thao & Thời trang', 'Sports & Fashion'],
  ['Hàng không & Vận tải', 'Aviation & Transport'],
  ['Công nghệ & Điện tử', 'Technology & Electronics'],
  ['Giải trí & Trò chơi', 'Entertainment & Gaming'],
  ['Dịch vụ Số & Âm nhạc', 'Digital Services & Music'],
  ['Sản xuất Ô tô', 'Automotive Manufacturing'],
  ['Nước giải khát & Năng lượng', 'Soft Drinks & Energy Drinks'],
  ['Nước giải khát', 'Soft Drinks'],
  ['Đồ uống & Bia', 'Beverages & Beer'],
  ['Nước điện giải thể thao', 'Sports Drinks'],
  ['Ngân hàng & Tài chính', 'Banking & Finance'],
  ['Ngân hàng & Đầu tư', 'Banking & Investment'],
  ['Thanh toán Điện tử', 'Electronic Payments'],
  ['Hàng không & Du lịch', 'Aviation & Travel'],
  ['Du lịch & Khách sạn', 'Travel & Hospitality'],
  ['Công nghệ & Phần mềm', 'Technology & Software'],
  ['Điện toán Đám mây', 'Cloud Computing'],
  ['An ninh mạng', 'Cybersecurity'],
  ['Truyền thông & Streaming', 'Media & Streaming'],
  ['Truyền hình & Truyền thông', 'Television & Media'],
  ['Xe điện & Công nghệ', 'Electric Vehicles & Technology'],
  ['Nước uống', 'Drinking Water'],
  ['Tài chính & Đầu tư', 'Finance & Investment'],
  ['Bảo hiểm', 'Insurance'],
  ['Viễn thông', 'Telecommunications'],
  ['Viễn thông & Internet', 'Telecommunications & Internet'],
  ['Internet & Công nghệ', 'Internet & Technology'],
  ['Bán lẻ', 'Retail'],
  ['Thương mại Điện tử', 'E-commerce'],
  ['Bán lẻ & Thương mại', 'Retail & Commerce'],
  ['Logistics & Vận tải', 'Logistics & Transport'],
  ['Chuyển phát & Logistics', 'Delivery & Logistics'],
  ['Năng lượng', 'Energy'],
  ['Năng lượng tái tạo', 'Renewable Energy'],
  ['Dầu khí & Năng lượng', 'Oil, Gas & Energy'],
  ['Ẩm thực & Nhà hàng', 'Food & Restaurants'],
  ['Cà phê & Đồ uống', 'Coffee & Beverages'],
  ['Bất động sản', 'Real Estate'],
  ['Y tế & Dược phẩm', 'Healthcare & Pharmaceuticals'],
  ['Dược phẩm & Công nghệ sinh học', 'Pharmaceuticals & Biotechnology'],
  ['Truyền thông Thể thao', 'Sports Media'],
  ['Truyền thông & Tin tức', 'Media & News'],
  ['Khách sạn & Du lịch', 'Hospitality & Travel'],
  ['Du lịch & Nghỉ dưỡng', 'Travel & Resorts'],
];

const normalize = (value: string) => value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase();
export const sponsorshipLocale = (language: Language) => language === 'vi' ? 'vi-VN' : 'en-US';

export function localizeSponsorIndustry(raw: string, language: Language): string {
  const normalized = normalize(raw);
  const pair = sponsorIndustries.find(values => values.some(value => normalize(value) === normalized));
  return pair ? pair[language === 'vi' ? 0 : 1] : raw.trim();
}

export function localizeSponsorSeason(raw: string, language: Language, seasonNumber?: number): string {
  const number = seasonNumber ?? Number(raw.trim().match(/^(?:Season|Mùa(?:\s+giải)?)\s*(\d+)$/i)?.[1]);
  return Number.isInteger(number) && number > 0 ? `${language === 'vi' ? 'Mùa' : 'Season'} ${number}` : raw;
}

export function formatSponsorAmount(amount: number, language: Language): string {
  return `€${(amount / 1000000).toLocaleString(sponsorshipLocale(language), { maximumFractionDigits: 2 })}M`;
}

const legacyErrors: Record<string, string> = {
  'Không tìm thấy CLB': 'CLUB_NOT_FOUND',
  'Bạn không có quyền quản lý CLB này': 'FORBIDDEN',
  'Thế giới chưa có mùa giải đang hoạt động': 'NO_ACTIVE_SEASON',
  'Chưa cấu hình tiền CASH': 'CASH_NOT_CONFIGURED',
  'Chưa có nhà tài trợ trong hệ thống': 'NO_SPONSORS',
  'Lời mời tài trợ không tồn tại trong mùa này': 'OFFER_NOT_FOUND',
  'Hợp đồng này đã được ký hoặc hết hiệu lực': 'OFFER_UNAVAILABLE',
  'Mỗi CLB chỉ được ký tối đa 4 hợp đồng tài trợ trong một mùa': 'LIMIT_REACHED',
  'Tài khoản tài chính không tồn tại': 'ACCOUNT_NOT_FOUND',
};

/** Store a translation key so changing language also updates an existing alert. */
export function sponsorshipErrorKey(error: unknown, fallback: 'sponsors.load_error' | 'sponsors.sign_error'): string {
  const response = (error as { response?: { status?: number; data?: { code?: string; message?: unknown } } } | null)?.response;
  if (response?.status === 401) return 'sponsors.error.auth_required';
  const payload = response?.data;
  const code = (typeof payload?.code === 'string' ? payload.code.replace(/^SPONSORSHIP_/, '') : undefined)
    || (typeof payload?.message === 'string' ? legacyErrors[payload.message] : undefined);
  const key = `sponsors.error.${code?.toLowerCase()}`;
  return Object.prototype.hasOwnProperty.call(sponsorshipsEn, key) ? key : fallback;
}

export function localizeSponsorshipDescription(description: string | undefined, language: Language): string {
  const dictionary = language === 'vi' ? sponsorshipsVi : sponsorshipsEn;
  if (!description) return dictionary['sponsors.transaction_type'];
  const match = description.match(/^(?:Tài trợ|Sponsorship from)\s+(.+)\s+-\s+((?:Season|Mùa(?:\s+giải)?)\s*\d+)$/i);
  if (!match) return description;
  return dictionary['sponsors.transaction_description']
    .replace('{name}', match[1])
    .replace('{season}', localizeSponsorSeason(match[2], language));
}
