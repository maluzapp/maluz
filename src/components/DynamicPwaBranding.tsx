import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_ICON = '/icon-192.png';
const DEFAULT_NAME = 'Maluz';
const DEFAULT_DESCRIPTION = 'Maluz: exercícios personalizados para crianças do 6º ano ao 3º médio. Acenda a luz do saber.';

function upsertHeadLink(rel: string, href: string) {
  let link = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;

  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    document.head.appendChild(link);
  }

  link.href = href;
}

function upsertManifest(manifest: Record<string, unknown>) {
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const manifestUrl = URL.createObjectURL(blob);

  let link = document.head.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.rel = 'manifest';
    document.head.appendChild(link);
  }

  const previous = link.dataset.dynamicManifestUrl;
  if (previous) URL.revokeObjectURL(previous);

  link.href = manifestUrl;
  link.dataset.dynamicManifestUrl = manifestUrl;
}

function getStorageIconUrl() {
  const { data } = supabase.storage.from('logos').getPublicUrl('icon_pwa.png');
  return `${data.publicUrl}?v=${Date.now()}`;
}

export function DynamicPwaBranding() {
  useEffect(() => {
    let mounted = true;

    const applyBranding = async () => {
      const { data } = await supabase
        .from('branding_settings')
        .select('key, value')
        .in('key', ['app_name', 'app_tagline']);

      if (!mounted) return;

      const settings = Object.fromEntries((data ?? []).map((item) => [item.key, item.value]));
      const appName = settings.app_name || DEFAULT_NAME;
      const description = settings.app_tagline || DEFAULT_DESCRIPTION;
      const iconUrl = getStorageIconUrl();

      upsertHeadLink('icon', iconUrl);
      upsertHeadLink('apple-touch-icon', iconUrl);

      const titleMeta = document.head.querySelector('meta[name="apple-mobile-web-app-title"]');
      if (titleMeta) titleMeta.setAttribute('content', appName);

      upsertManifest({
        name: appName,
        short_name: appName,
        description,
        start_url: '/',
        display: 'standalone',
        background_color: '#0A1628',
        theme_color: '#F5C842',
        orientation: 'portrait',
        icons: [
          { src: iconUrl, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
          { src: iconUrl, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      });
    };

    applyBranding();

    const channel = supabase
      .channel('branding-settings-pwa')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branding_settings' }, () => {
        applyBranding();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      const manifestLink = document.head.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
      const manifestUrl = manifestLink?.dataset.dynamicManifestUrl;
      if (manifestUrl) URL.revokeObjectURL(manifestUrl);
    };
  }, []);

  return null;
}