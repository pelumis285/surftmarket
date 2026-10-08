"use client";

import { useEffect, useState } from "react";
import { PRODUCTS, type DemoProduct } from "@/lib/demo-data";

export function useCatalogProducts() {
  const [products, setProducts] = useState<DemoProduct[]>(PRODUCTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/catalog", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json() as { ok?: boolean; items?: DemoProduct[] };
        if (response.ok && data.ok && Array.isArray(data.items)) setProducts(data.items);
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") console.error("Unable to load the product catalogue", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return { products, loading };
}
