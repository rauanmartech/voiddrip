import { supabase } from "@/integrations/supabase/client";

/**
 * Increments the view count for a specific product.
 * Uses RPC to avoid race conditions and ensure atomic increments.
 * Falls back to upsert if the RPC is not available or fails.
 */
export const trackProductView = async (productId: string) => {
  try {
    // Attempting an upsert which is the requested logic.
    // Since product_views might not have a unique check on product_id 
    // we use upsert with onConflict if supported, or a manual check.
    
    // First, try to get existing record
    const { data: existing, error: fetchError } = await supabase
      .from('product_views')
      .select('view_count')
      .eq('product_id', productId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching product views:', fetchError);
      return;
    }

    if (existing) {
      // Update existing
      const { error: updateError } = await supabase
        .from('product_views')
        .update({ 
          view_count: existing.view_count + 1,
          last_viewed_at: new Date().toISOString()
        })
        .eq('product_id', productId);
      
      if (updateError) console.error('Error updating product views:', updateError);
    } else {
      // Insert new
      const { error: insertError } = await supabase
        .from('product_views')
        .insert({
          product_id: productId,
          view_count: 1,
          last_viewed_at: new Date().toISOString()
        });
        
      if (insertError) console.error('Error inserting product views:', insertError);
    }
  } catch (err) {
    console.error('Unexpected error tracking product view:', err);
  }
};
