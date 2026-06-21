import { redirect } from 'next/navigation';

export default function NotFound() {
  // Chuyển hướng tất cả các trang không tồn tại về trang chủ 
  // (Phù hợp để giữ khách từ link web cũ đã lưu trên Google)
  redirect('/');
}
