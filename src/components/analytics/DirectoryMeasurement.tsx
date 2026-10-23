"use client";

import { useEffect } from "react";
import {
  trackDirectoryImpression,
  trackProviderCallClick,
  trackProviderSiteClick,
  type DirectorySurface,
  type ProviderDestination,
} from "@/lib/analytics/measurement";

export function DirectoryImpression({ surface, surfaceKey }: { surface: DirectorySurface; surfaceKey: string }) {
  useEffect(() => {
    trackDirectoryImpression(surface, surfaceKey);
  }, [surface, surfaceKey]);

  return null;
}

type TrackedProviderLinkProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  measurement: "call" | ProviderDestination;
};

export function TrackedProviderLink({ measurement, onClick, ...props }: TrackedProviderLinkProps) {
  return (
    <a
      {...props}
      onClick={(event) => {
        if (measurement === "call") trackProviderCallClick();
        else trackProviderSiteClick(measurement);
        onClick?.(event);
      }}
    />
  );
}

