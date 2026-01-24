import type { Region, RegionPricing, Coordinates } from "./types";

// Region bounding boxes (approximate)
interface RegionBounds {
  region: Region;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

const REGION_BOUNDS: RegionBounds[] = [
  // South America
  {
    region: "south_america",
    minLat: -56,
    maxLat: 13,
    minLng: -82,
    maxLng: -34,
  },
  // North America (USA, Canada, Mexico)
  {
    region: "north_america",
    minLat: 14,
    maxLat: 72,
    minLng: -170,
    maxLng: -52,
  },
  // Europe
  {
    region: "europe",
    minLat: 35,
    maxLat: 72,
    minLng: -25,
    maxLng: 45,
  },
  // Asia
  {
    region: "asia",
    minLat: -10,
    maxLat: 55,
    minLng: 45,
    maxLng: 180,
  },
  // Oceania (Australia, NZ, Pacific)
  {
    region: "oceania",
    minLat: -50,
    maxLat: 0,
    minLng: 110,
    maxLng: 180,
  },
  // Africa
  {
    region: "africa",
    minLat: -35,
    maxLat: 37,
    minLng: -18,
    maxLng: 52,
  },
];

// Pricing configuration by region (in USD cents)
const REGION_PRICING: Record<Region, RegionPricing> = {
  south_america: {
    region: "south_america",
    monthlyPrice: 299, // $2.99 USD
    yearlyPrice: 2499, // $24.99 USD (~30% discount)
    currency: "USD",
    currencySymbol: "$",
  },
  north_america: {
    region: "north_america",
    monthlyPrice: 699, // $6.99 USD
    yearlyPrice: 5999, // $59.99 USD (~28% discount)
    currency: "USD",
    currencySymbol: "$",
  },
  europe: {
    region: "europe",
    monthlyPrice: 599, // $5.99 USD
    yearlyPrice: 4999, // $49.99 USD (~30% discount)
    currency: "USD",
    currencySymbol: "$",
  },
  asia: {
    region: "asia",
    monthlyPrice: 399, // $3.99 USD
    yearlyPrice: 3499, // $34.99 USD (~27% discount)
    currency: "USD",
    currencySymbol: "$",
  },
  oceania: {
    region: "oceania",
    monthlyPrice: 599, // $5.99 USD
    yearlyPrice: 4999, // $49.99 USD (~30% discount)
    currency: "USD",
    currencySymbol: "$",
  },
  africa: {
    region: "africa",
    monthlyPrice: 299, // $2.99 USD
    yearlyPrice: 2499, // $24.99 USD (~30% discount)
    currency: "USD",
    currencySymbol: "$",
  },
};

// Detect region from coordinates
export function detectRegion(coords: Coordinates): Region {
  const { lat, lng } = coords;

  for (const bounds of REGION_BOUNDS) {
    if (
      lat >= bounds.minLat &&
      lat <= bounds.maxLat &&
      lng >= bounds.minLng &&
      lng <= bounds.maxLng
    ) {
      return bounds.region;
    }
  }

  // Default to South America (app's primary market)
  return "south_america";
}

// Get pricing for a region
export function getRegionPricing(region: Region): RegionPricing {
  return REGION_PRICING[region];
}

// Get pricing from coordinates
export function getPricingFromCoordinates(coords: Coordinates): RegionPricing {
  const region = detectRegion(coords);
  return getRegionPricing(region);
}

// Format price for display
export function formatPrice(priceInCents: number, currency: string = "USD"): string {
  const price = priceInCents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

// Get yearly savings percentage
export function getYearlySavingsPercentage(region: Region): number {
  const pricing = REGION_PRICING[region];
  const monthlyAnnual = pricing.monthlyPrice * 12;
  const savings = ((monthlyAnnual - pricing.yearlyPrice) / monthlyAnnual) * 100;
  return Math.round(savings);
}

// Check if coordinates are in a supported region
export function isSupportedRegion(coords: Coordinates): boolean {
  const region = detectRegion(coords);
  return region in REGION_PRICING;
}

// Get all pricing options for comparison
export function getAllPricingOptions(): RegionPricing[] {
  return Object.values(REGION_PRICING);
}

// Country code to region mapping (for users with known country)
const COUNTRY_TO_REGION: Record<string, Region> = {
  // South America
  AR: "south_america", // Argentina
  BO: "south_america", // Bolivia
  BR: "south_america", // Brazil
  CL: "south_america", // Chile
  CO: "south_america", // Colombia
  EC: "south_america", // Ecuador
  GY: "south_america", // Guyana
  PY: "south_america", // Paraguay
  PE: "south_america", // Peru
  SR: "south_america", // Suriname
  UY: "south_america", // Uruguay
  VE: "south_america", // Venezuela

  // North America
  US: "north_america", // United States
  CA: "north_america", // Canada
  MX: "north_america", // Mexico

  // Europe (major countries)
  GB: "europe",
  DE: "europe",
  FR: "europe",
  ES: "europe",
  IT: "europe",
  NL: "europe",
  PT: "europe",
  PL: "europe",

  // Asia (major countries)
  CN: "asia",
  JP: "asia",
  KR: "asia",
  IN: "asia",
  ID: "asia",
  TH: "asia",
  VN: "asia",
  PH: "asia",

  // Oceania
  AU: "oceania",
  NZ: "oceania",

  // Africa (major countries)
  ZA: "africa",
  EG: "africa",
  NG: "africa",
  KE: "africa",
  MA: "africa",
};

// Get region from country code
export function getRegionFromCountryCode(countryCode: string): Region {
  const upperCode = countryCode.toUpperCase();
  return COUNTRY_TO_REGION[upperCode] ?? "south_america";
}

// Export types
export type { Region, RegionPricing, Coordinates };
