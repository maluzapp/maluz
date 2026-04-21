import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function uint8ArrayToUrlBase64(bytes: Uint8Array) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function ensureServiceWorkerRegistration() {
  const existingRegistration = await navigator.serviceWorker.getRegistration("/");
  if (existingRegistration) return existingRegistration;

  await navigator.serviceWorker.register("/sw-push.js", { scope: "/" });
  return navigator.serviceWorker.ready;
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  const getVapidPublicKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("send-notification", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
        body: { action: "get_vapid_public_key" },
      });

      if (!error && data?.public_key) return data.public_key as string;
    } catch (err) {
      console.error("Failed to fetch canonical VAPID key:", err);
    }

    const { data: vapidSetting } = await supabase
      .from("branding_settings")
      .select("value")
      .eq("key", "vapid_public_key")
      .single();

    return vapidSetting?.value ?? "";
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    const subJson = subscription.toJSON();

    await supabase.from("push_subscriptions").upsert(
      {
        user_id: user!.id,
        endpoint: subJson.endpoint!,
        p256dh: subJson.keys!.p256dh!,
        auth: subJson.keys!.auth!,
      },
      { onConflict: "endpoint" }
    );
  };

  const syncSubscription = async (forceRefresh = false, retrying = false) => {
    if (!user || !isSupported) return false;

    try {
      const vapidPublicKey = await getVapidPublicKey();
      if (!vapidPublicKey) {
        console.error("VAPID public key not found in branding_settings");
        return false;
      }

      const reg = await ensureServiceWorkerRegistration();
      let currentSub = await reg.pushManager.getSubscription();
      const desiredKey = urlBase64ToUint8Array(vapidPublicKey);

      const currentKeyBuffer = currentSub?.options?.applicationServerKey;
      const currentKey = currentKeyBuffer
        ? uint8ArrayToUrlBase64(new Uint8Array(currentKeyBuffer))
        : "";
      const needsRefresh = forceRefresh || (!!currentSub && currentKey && currentKey !== vapidPublicKey);

      if (needsRefresh && currentSub) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", currentSub.endpoint);
        await currentSub.unsubscribe();
        currentSub = null;
      }

      if (!currentSub) {
        if (Notification.permission !== "granted") {
          setIsSubscribed(false);
          return false;
        }

        currentSub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: desiredKey,
        });
      }

      await saveSubscription(currentSub);
      setIsSubscribed(true);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const recoverable = !retrying && (message.includes("different application server key") || message.includes("InvalidStateError"));

      if (recoverable) {
        try {
          const reg = await ensureServiceWorkerRegistration();
          const currentSub = await reg.pushManager.getSubscription();
          if (currentSub) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", currentSub.endpoint);
            await currentSub.unsubscribe();
          }
        } catch (cleanupErr) {
          console.error("Push cleanup error:", cleanupErr);
        }

        return syncSubscription(true, true);
      }

      console.error("Push subscription error:", err);
      setIsSubscribed(false);
      return false;
    }
  };

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user || !isSupported) return;
    syncSubscription(false).catch((err) => {
      console.error("Push sync error:", err);
    });
  }, [user, isSupported]);

  const subscribe = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;
      return await syncSubscription(false);
    } catch (err) {
      console.error("Push subscription error:", err);
      return false;
    }
  };

  const unsubscribe = async () => {
    if (!user || !isSupported) return;
    try {
      const reg = await ensureServiceWorkerRegistration();
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe error:", err);
    }
  };

  const refreshSubscription = async () => {
    setPermission(Notification.permission);
    if (Notification.permission !== "granted") return false;
    return syncSubscription(true);
  };

  return { isSubscribed, isSupported, permission, subscribe, unsubscribe, refreshSubscription };
}
