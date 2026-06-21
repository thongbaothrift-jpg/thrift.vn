"use client";

import { useState } from "react";
import { ReviewsSection } from "@/components/ReviewsSection";

interface Props {
  productId: string;
  productName: string;
  productImage?: string;
}

export function ProductReviews({ productId, productName, productImage }: Props) {
  return (
    <ReviewsSection
      productId={productId}
      productName={productName}
      productImage={productImage}
    />
  );
}
