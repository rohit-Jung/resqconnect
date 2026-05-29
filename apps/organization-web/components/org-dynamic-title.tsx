'use client';

import { useEffect } from 'react';

import { useOrgProfile } from '@/services/organization/auth.api';

export function OrgDynamicTitle() {
  const { data } = useOrgProfile();
  const orgName = data?.data?.data?.user?.name;
  const logo = data?.data?.data?.user?.logo;

  useEffect(() => {
    if (orgName) {
      document.title = `${orgName} | Resqconnect`;
    }
  }, [orgName]);

  useEffect(() => {
    if (!logo) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logo;
  }, [logo]);

  return null;
}
