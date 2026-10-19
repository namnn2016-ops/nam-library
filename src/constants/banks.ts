export interface BankInfo {
  bin: string;
  code: string;
  shortName: string;
  name: string;
}

export const VIETNAMESE_BANKS: BankInfo[] = [
  { bin: '970422', code: 'MB', shortName: 'MBBank', name: 'Ngân hàng Quân Đội (MBBank)' },
  { bin: '970436', code: 'VCB', shortName: 'Vietcombank', name: 'Ngân hàng Ngoại Thương (Vietcombank)' },
  { bin: '970407', code: 'TCB', shortName: 'Techcombank', name: 'Ngân hàng Kỹ Thương (Techcombank)' },
  { bin: '970415', code: 'CTG', shortName: 'VietinBank', name: 'Ngân hàng Công Thương (VietinBank)' },
  { bin: '970418', code: 'BIDV', shortName: 'BIDV', name: 'Ngân hàng Đầu tư & Phát triển (BIDV)' },
  { bin: '970405', code: 'VBA', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp & PT Nông thôn (Agribank)' },
  { bin: '970416', code: 'ACB', shortName: 'ACB', name: 'Ngân hàng Á Châu (ACB)' },
  { bin: '970432', code: 'VPB', shortName: 'VPBank', name: 'Ngân hàng Việt Nam Thịnh Vượng (VPBank)' },
  { bin: '970423', code: 'TPB', shortName: 'TPBank', name: 'Ngân hàng Tiên Phong (TPBank)' },
  { bin: '970403', code: 'STB', shortName: 'Sacombank', name: 'Ngân hàng Sài Gòn Thương Tín (Sacombank)' },
  { bin: '970437', code: 'HDB', shortName: 'HDBank', name: 'Ngân hàng Phát triển TP.HCM (HDBank)' },
  { bin: '970441', code: 'VIB', shortName: 'VIB', name: 'Ngân hàng Quốc tế (VIB)' },
  { bin: '970443', code: 'SHB', shortName: 'SHB', name: 'Ngân hàng Sài Gòn - Hà Nội (SHB)' },
  { bin: '970426', code: 'MSB', shortName: 'MSB', name: 'Ngân hàng Hàng Hải (MSB)' },
  { bin: '970440', code: 'SEAB', shortName: 'SeABank', name: 'Ngân hàng Đông Nam Á (SeABank)' },
  { bin: '970448', code: 'OCB', shortName: 'OCB', name: 'Ngân hàng Phương Đông (OCB)' },
  { bin: '970449', code: 'LPB', shortName: 'LPBank', name: 'Ngân hàng Lộc Phát Việt Nam (LPBank)' },
  { bin: '970431', code: 'EIB', shortName: 'Eximbank', name: 'Ngân hàng Xuất Nhập Khẩu (Eximbank)' },
  { bin: '970409', code: 'BAB', shortName: 'BacABank', name: 'Ngân hàng Bắc Á (BacABank)' },
  { bin: '970412', code: 'PVCB', shortName: 'PVcomBank', name: 'Ngân hàng Đại Chúng (PVcomBank)' },
  { bin: '546034', code: 'CAKE', shortName: 'Cake', name: 'Ngân hàng số Cake by VPBank' },
  { bin: '963388', code: 'TIMO', shortName: 'Timo', name: 'Ngân hàng số Timo by BVBank' },
  { bin: '970452', code: 'KLB', shortName: 'Kienlongbank', name: 'Ngân hàng Kiên Long (Kienlongbank)' },
  { bin: '970428', code: 'NAB', shortName: 'NamABank', name: 'Ngân hàng Nam Á (NamABank)' },
  { bin: '970433', code: 'VBB', shortName: 'VietBank', name: 'Ngân hàng Việt Nam Thương Tín (VietBank)' },
];

export function getVietQrUrl(params: {
  bankBinOrCode: string;
  accountNo: string;
  amount?: number;
  memo?: string;
  accountName?: string;
  template?: 'compact2' | 'compact' | 'qr_only';
}): string {
  const template = params.template || 'compact2';
  const query = new URLSearchParams();
  if (params.amount && params.amount > 0) {
    query.set('amount', String(Math.round(params.amount)));
  }
  if (params.memo) {
    query.set('addInfo', params.memo);
  }
  if (params.accountName) {
    query.set('accountName', params.accountName.toUpperCase().trim());
  }
  const qs = query.toString();
  const cleanBank = params.bankBinOrCode.trim();
  const cleanAccount = params.accountNo.trim().replace(/\s+/g, '');
  return `https://img.vietqr.io/image/${cleanBank}-${cleanAccount}-${template}.png${qs ? `?${qs}` : ''}`;
}

export function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function generateCashSuggestions(totalFine: number): number[] {
  if (totalFine <= 0) return [0];

  const standardBills = [10000, 20000, 50000, 100000, 200000, 500000];
  const suggestions: number[] = [totalFine];

  // Nếu số tiền lẻ không tròn theo 10.000đ, thêm mức làm tròn lên gần nhất
  if (totalFine % 10000 !== 0) {
    const round10k = Math.ceil(totalFine / 10000) * 10000;
    if (!suggestions.includes(round10k)) {
      suggestions.push(round10k);
    }
  }

  // Thêm các mệnh giá tiền mặt lớn hơn số tiền phạt
  for (const bill of standardBills) {
    if (bill > totalFine && !suggestions.includes(bill)) {
      suggestions.push(bill);
    }
  }

  return suggestions.sort((a, b) => a - b);
}
