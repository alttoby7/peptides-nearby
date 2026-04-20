import { z } from "zod";

// Enums
export const ProviderTypeSchema = z.enum(["clinic", "pharmacy", "wellness-center"]);
export type ProviderType = z.infer<typeof ProviderTypeSchema>;

export const ProviderStatusSchema = z.enum(["active", "pending", "closed"]);
export type ProviderStatus = z.infer<typeof ProviderStatusSchema>;

export const InsuranceSchema = z.enum(["accepted", "not-accepted", "varies", "unknown"]);
export type Insurance = z.infer<typeof InsuranceSchema>;

export const VerificationTierSchema = z.enum(["listed", "verified", "claimed", "trusted"]);
export type VerificationTier = z.infer<typeof VerificationTierSchema>;

// Address
export const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  state: z.string(),
  stateCode: z.string(),
  zip: z.string(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type Address = z.infer<typeof AddressSchema>;

// Telehealth
export const TelehealthSchema = z.object({
  available: z.boolean(),
  statesServed: z.array(z.string()).default([]),
  visitTypes: z.array(z.enum(["video", "phone", "async"])).default([]),
});

// Pricing signals
export const PricingSchema = z.object({
  consultFee: z.string().optional(),
  acceptsHSA: z.boolean().optional(),
  acceptsFSA: z.boolean().optional(),
  membershipAvailable: z.boolean().optional(),
  financingAvailable: z.boolean().optional(),
});

// Pharmacy-specific details
export const PharmacyDetailsSchema = z.object({
  compoundingType: z.enum(["503A", "503B", "both"]).optional(),
  pcabAccredited: z.boolean().optional(),
  shipsToStates: z.array(z.string()).optional(),
});

// Consultation details
export const ConsultationSchema = z.object({
  requiresLabs: z.boolean().optional(),
  initialLabsIncluded: z.boolean().optional(),
  followUpCadence: z.string().optional(),
  refillPolicy: z.string().optional(),
});

// Provider specialties (secondary classification, additive to primary type)
export const SpecialtySchema = z.enum([
  "medspa", "sports-recovery", "functional-medicine",
  "longevity-clinic", "weight-loss-clinic", "hormone-clinic",
]);
export type Specialty = z.infer<typeof SpecialtySchema>;

// Clinical focus areas (what conditions/goals the provider treats)
export const ClinicalFocusSchema = z.enum([
  "metabolic-weight-loss", "tissue-repair-injury", "cognitive-neuro",
  "growth-hormone", "immune-longevity", "sexual-wellness",
]);
export type ClinicalFocus = z.infer<typeof ClinicalFocusSchema>;

// Delivery methods offered
export const DeliveryMethodSchema = z.enum([
  "injectable", "oral", "nasal-spray", "topical",
]);
export type DeliveryMethod = z.infer<typeof DeliveryMethodSchema>;

// Business model
export const BusinessModelSchema = z.enum([
  "membership", "pay-per-treatment", "telehealth-hybrid",
]);
export type BusinessModel = z.infer<typeof BusinessModelSchema>;

// Trust signals
export const TrustSignalsSchema = z.object({
  pcabAccredited: z.boolean().default(false),
  coaAvailable: z.boolean().default(false),
  medicalSupervision: z.boolean().default(false),
  boardCertified: z.array(z.string()).default([]),
});
export type TrustSignals = z.infer<typeof TrustSignalsSchema>;

// Provider (source record)
export const ProviderSchema = z.object({
  slug: z.string(),
  name: z.string(),
  type: ProviderTypeSchema,
  status: ProviderStatusSchema,
  address: AddressSchema,
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().optional(),
  description: z.string(),
  bookingUrl: z.string().optional(),
  googleMapsUrl: z.string().optional(),
  services: z.array(z.string()),
  peptides: z.array(z.string()),
  insurance: InsuranceSchema,
  hours: z.record(z.string(), z.object({
    open: z.string(),
    close: z.string(),
  })).nullable().optional(),
  featured: z.boolean().default(false),
  verified: z.boolean().default(false),
  lastVerified: z.string().optional(),
  // New fields (all optional for backward compat)
  telehealth: TelehealthSchema.optional(),
  pricing: PricingSchema.optional(),
  pharmacyDetails: PharmacyDetailsSchema.optional(),
  consultation: ConsultationSchema.optional(),
  verificationTier: VerificationTierSchema.default("listed"),
  treatmentGoals: z.array(z.string()).default([]),
  // 5-dimension framework
  specialties: z.array(SpecialtySchema).default([]),
  clinicalFocus: z.array(ClinicalFocusSchema).default([]),
  deliveryMethods: z.array(DeliveryMethodSchema).default([]),
  businessModel: BusinessModelSchema.optional(),
  trustSignals: TrustSignalsSchema.default({}),
});
export type Provider = z.infer<typeof ProviderSchema>;

// Search index entry (lightweight for client-side search)
export const SearchIndexEntrySchema = z.object({
  slug: z.string(),
  name: z.string(),
  city: z.string(),
  stateCode: z.string(),
  type: ProviderTypeSchema,
  peptides: z.array(z.string()),
  services: z.array(z.string()),
  treatmentGoals: z.array(z.string()),
  verificationTier: VerificationTierSchema,
  insurance: InsuranceSchema,
  telehealthAvailable: z.boolean(),
  specialties: z.array(z.string()).default([]),
  clinicalFocus: z.array(z.string()).default([]),
  deliveryMethods: z.array(z.string()).default([]),
  trustSignalCount: z.number().default(0),
  businessModel: z.string().optional(),
});
export type SearchIndexEntry = z.infer<typeof SearchIndexEntrySchema>;

// Map index entry (lightweight for map rendering)
export const MapIndexEntrySchema = z.object({
  slug: z.string(),
  name: z.string(),
  type: ProviderTypeSchema,
  lat: z.number(),
  lng: z.number(),
  city: z.string(),
  stateCode: z.string(),
});
export type MapIndexEntry = z.infer<typeof MapIndexEntrySchema>;

// Provider review (exported from Supabase, approved only)
export const ProviderReviewSchema = z.object({
  id: z.string(),
  providerSlug: z.string(),
  reviewerName: z.string(),
  rating: z.number().int().min(1).max(5),
  visitDate: z.string(),
  visitType: z.enum(["in-person", "telehealth"]),
  title: z.string(),
  body: z.string(),
  peptidesUsed: z.array(z.string()),
  wouldRecommend: z.boolean(),
  verifiedVisit: z.boolean(),
  createdAt: z.string(),
});
export type ProviderReview = z.infer<typeof ProviderReviewSchema>;

// City (build artifact)
export const CitySchema = z.object({
  slug: z.string(),
  name: z.string(),
  stateCode: z.string(),
  state: z.string(),
  stateSlug: z.string(),
  providerCount: z.number(),
  clinicCount: z.number(),
  pharmacyCount: z.number(),
  wellnessCenterCount: z.number(),
  providers: z.array(z.string()),
  services: z.array(z.string()),
  peptides: z.array(z.string()),
});
export type City = z.infer<typeof CitySchema>;

// State (build artifact)
export const StateSchema = z.object({
  slug: z.string(),
  name: z.string(),
  code: z.string(),
  providerCount: z.number(),
  cityCount: z.number(),
  cities: z.array(z.string()),
});
export type State = z.infer<typeof StateSchema>;

// Service (build artifact)
export const ServiceSchema = z.object({
  slug: z.string(),
  name: z.string(),
  type: z.enum(["peptide", "therapy", "treatment"]),
  providerCount: z.number(),
  cityCount: z.number(),
  description: z.string(),
});
export type Service = z.infer<typeof ServiceSchema>;
