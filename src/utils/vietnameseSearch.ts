/**
 * vietnameseSearch.ts
 * Tiện ích tìm kiếm tiếng Việt thông minh & Blur/Fuzzy search cho Xuân Phạm Coffee House.
 *
 * Hỗ trợ:
 * 1. Không dấu & có dấu (tiếng Việt đầy đủ)
 * 2. Blur / Fuzzy search (lỗi gõ phím, hoán đổi ký tự: "pe" -> "ep", "cofe" -> "coffee", "mathca" -> "matcha")
 * 3. Viết liền không khoảng trắng ("caphe" -> "cà phê", "trasua" -> "trà sữa")
 * 4. Từ viết tắt phổ biến ("cf" -> "cà phê", "st" -> "sinh tố", "ts" -> "trà sữa", "bx" -> "bạc xỉu")
 * 5. Tìm kiếm đa trường (tên món, danh mục, mô tả)
 */

/**
 * Loại bỏ dấu tiếng Việt chuẩn Unicode NFD
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Tính khoảng cách Damerau-Levenshtein (hỗ trợ xóa, thêm, thay thế và hoán đổi 2 ký tự liền nhau)
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // xóa
        matrix[i][j - 1] + 1, // chèn
        matrix[i - 1][j - 1] + cost // thay thế
      );

      // Hoán vị liền kề (transposition: "pe" <-> "ep")
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[al][bl];
}

/**
 * Kiểm tra 2 từ ngắn có phải là hoán vị / đảo chữ của nhau không (ví dụ "pe" và "ep")
 */
function isAnagram(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return a.split('').sort().join('') === b.split('').sort().join('');
}

/**
 * Danh sách từ viết tắt & đồng nghĩa phổ biến trong ngành cà phê / đồ uống
 */
const ABBREVIATION_MAP: Record<string, string[]> = {
  cf: ['ca phe', 'coffee', 'cafe'],
  cafe: ['ca phe', 'coffee'],
  caffe: ['ca phe', 'coffee', 'cafe'],
  coffe: ['ca phe', 'coffee', 'cafe'],
  coffee: ['ca phe', 'cafe'],
  caphe: ['ca phe', 'coffee'],
  cfs: ['ca phe sua'],
  cfd: ['ca phe den'],
  ts: ['tra sua'],
  trasua: ['tra sua'],
  st: ['sinh to'],
  sinhto: ['sinh to'],
  td: ['tra dao'],
  tradao: ['tra dao'],
  tx: ['tra xoai'],
  tc: ['tra chanh', 'tran chau'],
  bx: ['bac xiu', 'bac siu'],
  bacxiu: ['bac xiu'],
  bacsiu: ['bac xiu'],
  pe: ['ep', 'nuoc ep'],
  ep: ['pe'],
  nuocpe: ['nuoc ep'],
  nuocep: ['nuoc ep'],
  matcha: ['macha'],
  macha: ['matcha'],
};

/**
 * Kiểm tra xem queryToken có khớp mờ (fuzzy match) với targetToken không
 */
function matchSingleToken(queryTok: string, targetTok: string): boolean {
  if (queryTok === targetTok) return true;
  if (targetTok.startsWith(queryTok)) return true;
  if (targetTok.includes(queryTok)) return true;

  // Hoán vị / đảo chữ của nhau (VD: "pe" <-> "ep")
  if (isAnagram(queryTok, targetTok)) return true;

  // Đối với từ chỉ có 1-2 ký tự: KHÔNG cho phép sai khác thay thế (trừ hoán vị đã check ở trên)
  if (queryTok.length <= 2) return false;

  // Damerau-Levenshtein cho từ từ 3 ký tự trở lên
  const dist = damerauLevenshtein(queryTok, targetTok);
  if (queryTok.length === 3 && dist <= 1) return true;
  if (queryTok.length >= 4 && dist <= (queryTok.length <= 5 ? 1 : 2)) return true;

  return false;
}

/**
 * Hàm tìm kiếm mờ tiếng Việt chính (Fuzzy Vietnamese Search)
 * Trả về boolean: target có khớp với query hay không
 */
export function fuzzyMatchVietnamese(query: string, target: string, extraTargetText?: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const qRaw = query.trim();
  const qNorm = removeVietnameseTones(qRaw);
  const tNorm = removeVietnameseTones(target);
  const fullTargetNorm = extraTargetText
    ? `${tNorm} ${removeVietnameseTones(extraTargetText)}`
    : tNorm;

  // 1. Khớp chính xác hoặc chứa chuỗi (cả có dấu lẫn không dấu)
  if (target.toLowerCase().includes(qRaw.toLowerCase())) return true;
  if (fullTargetNorm.includes(qNorm)) return true;

  // 2. Khớp viết liền không dấu / không khoảng trắng (VD: "caphe" -> "ca phe", "trasua" -> "tra sua", "nuocep" -> "nuoc ep")
  const qNoSpace = qNorm.replace(/\s+/g, '');
  const tNoSpace = fullTargetNorm.replace(/\s+/g, '');
  if (tNoSpace.includes(qNoSpace)) return true;

  // 3. Khớp từ viết tắt phổ biến (VD: "cf", "ts", "st", "bx")
  const aliases = ABBREVIATION_MAP[qNorm];
  if (aliases) {
    for (const alias of aliases) {
      if (fullTargetNorm.includes(alias) || tNoSpace.includes(alias.replace(/\s+/g, ''))) {
        return true;
      }
    }
  }

  // Khớp chữ cái đầu (acronyms: "cf" -> "Ca Phe", "td" -> "Tra Dao")
  const targetWords = fullTargetNorm.split(/\s+/).filter(Boolean);
  const initials = targetWords.map((w) => w[0]).join('');
  if (qNoSpace.length >= 2 && initials.includes(qNoSpace)) {
    return true;
  }

  // 4. Phân rã theo từng token từ (Fuzzy matching từng từ)
  const qTokens = qNorm.split(/\s+/).filter(Boolean);
  if (qTokens.length === 0) return true;

  // Mở rộng các token có viết tắt (VD: "pe" -> "ep")
  const expandedQTokens = qTokens.map((tok) => {
    const syns = ABBREVIATION_MAP[tok] || [];
    return [tok, ...syns];
  });

  // Kiểm tra xem MỌI nhóm từ trong query có tìm thấy ít nhất 1 từ tương ứng trong target không
  const targetWordsList = fullTargetNorm.split(/\s+/).filter(Boolean);

  const allTokensMatched = expandedQTokens.every((variants) => {
    return variants.some((variant) => {
      // Nếu variant có khoảng trắng (VD: 'ca phe')
      if (variant.includes(' ')) {
        return fullTargetNorm.includes(variant);
      }
      // Khớp trực tiếp trong full target
      if (fullTargetNorm.includes(variant)) return true;
      // Khớp mờ với từng từ
      return targetWordsList.some((tWord) => matchSingleToken(variant, tWord));
    });
  });

  if (allTokensMatched) return true;

  // 5. Thử Damerau-Levenshtein trên toàn bộ chuỗi nếu chuỗi ngắn
  if (qNoSpace.length >= 3 && Math.abs(qNoSpace.length - tNoSpace.length) <= 2) {
    if (damerauLevenshtein(qNoSpace, tNoSpace) <= 2) {
      return true;
    }
  }

  return false;
}

/**
 * Tính điểm khớp để sắp xếp các kết quả tìm kiếm (Điểm càng cao hiển thị càng trước)
 */
export function getSearchRelevanceScore(query: string, target: string, extraTargetText?: string): number {
  if (!query || !query.trim()) return 100;
  const qNorm = removeVietnameseTones(query);
  const tNorm = removeVietnameseTones(target);

  // Khớp chính xác tuyệt đối
  if (target.toLowerCase() === query.trim().toLowerCase()) return 1000;
  if (tNorm === qNorm) return 900;

  // Bắt đầu bằng query
  if (tNorm.startsWith(qNorm)) return 800;

  // Chứa toàn bộ query
  if (tNorm.includes(qNorm)) return 700;

  // Viết liền
  const qNoSpace = qNorm.replace(/\s+/g, '');
  const tNoSpace = tNorm.replace(/\s+/g, '');
  if (tNoSpace.includes(qNoSpace)) return 600;

  // Khớp trong extra text (category/description)
  if (extraTargetText && removeVietnameseTones(extraTargetText).includes(qNorm)) return 500;

  // Khớp mờ
  if (fuzzyMatchVietnamese(query, target, extraTargetText)) return 400;

  return 0;
}
