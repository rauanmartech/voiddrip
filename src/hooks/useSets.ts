import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const QUERY_KEYS = {
  sets: ["product_sets"] as const,
};

export interface SetItem {
  id: string;
  set_id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
    category: string;
  };
}

export interface ProductSet {
  id: string;
  name: string;
  description: string;
  banner_url: string;
  created_at: string;
  set_items: SetItem[];
}

const fetchSets = async (): Promise<ProductSet[]> => {
  const { data, error } = await supabase
    .from("product_sets")
    .select(`
      *,
      set_items (
        id,
        set_id,
        product_id,
        products (
          id,
          name,
          price,
          image_url,
          category,
          description,
          sizes,
          colors,
          stock_quantity
        )
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching sets:", error);
    throw error;
  }

  return data as any;
};

export const useSets = () => {
  return useQuery({
    queryKey: QUERY_KEYS.sets,
    queryFn: fetchSets,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
