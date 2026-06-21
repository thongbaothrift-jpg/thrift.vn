import { AdminReturnRequestDetail } from "@/components/admin/return-requests/ReturnRequestDetailClient";

export default function ReturnRequestDetailPage({ params }: { params: { id: string } }) {
  return <AdminReturnRequestDetail returnRequestId={params.id} />;
}
