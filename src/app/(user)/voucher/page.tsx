import type { Metadata } from "next";
import { getVouchers } from "@/lib/api";
import { VoucherPageContent } from "./VoucherPageContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Voucher & Mã giảm giá | THRIFT.VN Vietnam",
    description:
      "Khám phá các voucher và mã giảm giá hấp dẫn từ THRIFT.VN Vietnam. Tiết kiệm khi mua sắm thời trang xa xỉ chính hãng.",
  };
}

export default async function VoucherPage() {
  const vouchers = await getVouchers();
  return <VoucherPageContent initialVouchers={vouchers} />;
}
