import { Suspense } from "react";

import { SearchPanel } from "@/components/search/search-panel";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPanel />
    </Suspense>
  );
}
