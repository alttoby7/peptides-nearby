"use client";

import dynamic from "next/dynamic";

const CityMap = dynamic(() => import("./CityMap"), { ssr: false });

interface CityMapWrapperProps {
  city: string;
  stateCode: string;
}

export default function CityMapWrapper({ city, stateCode }: CityMapWrapperProps) {
  return <CityMap city={city} stateCode={stateCode} />;
}
