import { supabase } from "@/integrations/supabase/client";

/**
 * Fire all active webhooks for a given event type.
 * Errors are silenced so the main operation is never blocked.
 */
export async function fireWebhooksForEvent(eventType: string, payload: Record<string, unknown>) {
  try {
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("id")
      .eq("event_type", eventType)
      .eq("active", true);

    if (!webhooks || webhooks.length === 0) return;

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      webhooks.map((wh) =>
        supabase.functions.invoke("fire-webhook", {
          body: { webhook_id: wh.id, payload: body },
        })
      )
    );
  } catch {
    // silent – never block the caller
  }
}
