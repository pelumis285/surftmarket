import { z } from "zod";

const optionalEmail = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.email("Enter a valid email address").max(160).optional(),
);

const optionalPhone = z.preprocess(
  (value) => typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().min(7, "Enter a valid phone number").max(40).optional(),
);

const identityFields = {
  email: optionalEmail,
  phone: optionalPhone,
};

export const selfRegistrationRoleSchema = z.enum(["customer", "vendor", "affiliate", "rider"]);

export const registerSchema = z.object({
  action: z.literal("register"),
  name: z.string().trim().min(2, "Enter your full name").max(120),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  role: selfRegistrationRoleSchema.default("customer"),
  ...identityFields,
  cac: z.string().trim().max(60).optional(),
  bank: z.string().trim().max(240).optional(),
  vehicle: z.string().trim().max(40).optional(),
}).refine((data) => data.email || data.phone, {
  message: "Email or phone is required",
  path: ["email"],
});

export const loginSchema = z.object({
  action: z.literal("login"),
  password: z.string().min(1, "Password is required").max(128),
  ...identityFields,
}).refine((data) => data.email || data.phone, {
  message: "Email or phone is required",
  path: ["email"],
});

export const logoutSchema = z.object({ action: z.literal("logout") });

export const authActionSchema = z.discriminatedUnion("action", [
  registerSchema,
  loginSchema,
  logoutSchema,
]);

export function firstValidationError(error: z.ZodError) {
  return error.issues[0]?.message ?? "Invalid request";
}
