import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const QUERY_KEYS = {
  orders: ["orders"] as const,
  adminOrders: ["orders", "admin"] as const,
};

const fetchUserOrders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          name,
          image_url
        )
      ),
      addresses (*)
    `)
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};


const fetchAllOrders = async () => {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products (
          name,
          image_url
        )
      ),
      addresses (*)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

export const useOrders = () => {
  return useQuery({
    queryKey: QUERY_KEYS.orders,
    queryFn: fetchUserOrders,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useAdminOrders = () => {
  return useQuery({
    queryKey: QUERY_KEYS.adminOrders,
    queryFn: fetchAllOrders,
    staleTime: 0,
  });
};
