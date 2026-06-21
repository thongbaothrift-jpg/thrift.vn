export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Chuyển link Google Drive sang link ảnh trực tiếp.
 * Hỗ trợ:
 *   - https://drive.google.com/file/d/{ID}/view
 *   - https://drive.google.com/open?id={ID}
 *   - https://drive.google.com/uc?id={ID}&export=download
 *   - https://lh3.googleusercontent.com/aida-public/AB6AXu...  (đã là direct link, trả về nguyên)
 */
export function convertDriveLink(url: string): string {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  // Đã là direct link → trả về nguyên (nhưng cần thêm =s0 nếu chưa có)
  if (trimmed.includes('lh3.googleusercontent.com')) {
    if (!trimmed.includes('=')) {
      return `${trimmed}=s0`;
    }
    return trimmed;
  }
  // Lấy ID từ các format Drive thông dụng
  const match = trimmed.match(/(?:[\/?=]id=|\/d\/)([a-zA-Z0-9_-]{10,})/);
  if (match) {
    return `https://lh3.googleusercontent.com/d/${match[1]}=s0`;
  }
  return trimmed;
}
