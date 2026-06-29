import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  mobile: z.string().regex(/^\d{10}$/, "Mobile number must be exactly 10 digits"),
  village: z.string().min(2, "Village name must be at least 2 characters"),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  imageBase64: z.string().optional(),
});

export const jcbWorkSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  machineId: z.string().min(1, "Machine is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  ratePerHour: z.coerce.number().min(1, "Rate per hour must be positive"),
  dieselCost: z.coerce.number().min(0, "Diesel cost must be zero or positive"),
  operatorName: z.string().min(2, "Operator name is required"),
  advancePaid: z.coerce.number().min(0, "Advance paid must be zero or positive"),
  notes: z.string().optional().or(z.literal("")),
});

export const tractorOperationSchema = z.object({
  workType: z.enum([
    "PLOUGHING", "ROTAVATOR", "CULTIVATOR", "SEED_DRILL", "TROLLEY", "LEVELER", "OTHERS",
    "HAL_JOTAI", "TAWA_JOTAI", "HARROW", "PUDDLING", "SOIL_FILLING", "SAND_TRANSPORT", 
    "BRICK_TRANSPORT", "FERTILIZER_SPREADING", "WATER_TANK_SUPPLY", "TROLLEY_TRANSPORT"
  ]),
  pricingMethod: z.enum(["RATE_PER_UNIT", "FIXED_TOTAL"]).default("RATE_PER_UNIT"),
  area: z.coerce.number().min(0).optional(),
  ratePerArea: z.coerce.number().min(0).optional(),
  landUnit: z.string().default("Bigha").optional(),
  numberOfPasses: z.coerce.number().min(1).optional(),
  tripCount: z.coerce.number().min(0).optional(),
  ratePerTrip: z.coerce.number().min(0).optional(),
  fixedTotalAmount: z.coerce.number().min(0).optional(),
});

export const tractorWorkSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  machineId: z.string().min(1, "Machine is required"),
  date: z.string().min(1, "Date is required"),
  operations: z.array(tractorOperationSchema).min(1, "At least one operation is required"),
  driverCharge: z.coerce.number().min(0).optional(),
  helperCharge: z.coerce.number().min(0).optional(),
  foodExpense: z.coerce.number().min(0).optional(),
  otherExpense: z.coerce.number().min(0).optional(),
  dieselCost: z.coerce.number().min(0).optional(),
  advancePaid: z.coerce.number().min(0, "Advance paid must be zero or positive"),
  operatorName: z.string().min(2, "Operator name is required"),
  notes: z.string().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  amount: z.coerce.number().min(1, "Amount must be positive"),
  method: z.enum(["CASH", "UPI", "BANK"]),
  referenceId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  date: z.string().optional(),
});
