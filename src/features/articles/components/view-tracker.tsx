"use client";

import { useEffect } from "react";
import { trackArticleView } from "@/features/articles/actions";

/** Client island that records one view per page load. */
export function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    void trackArticleView(articleId);
  }, [articleId]);
  return null;
}
