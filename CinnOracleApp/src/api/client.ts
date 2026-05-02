import { Platform } from "react-native";
import Constants from "expo-constants";

/**
 * Backend URL notes:
 * - Android Emulator -> use 10.0.2.2 to reach your computer's localhost
 * - iOS Simulator -> localhost works
 * - Physical device -> use your computer's LAN IP (same Wi‑Fi)
 */
const DEFAULT_PORT = 8000;

// Set this to your current PC LAN IP when testing on a real phone (same Wi‑Fi).
// From ipconfig: Wi‑Fi = 192.168.8.186
const LAN_IP: string | null = "192.168.8.186";

function getBaseUrl() {
  // Use a developer override if set via Expo extra or env vars.
  const expoExtra = (
    (Constants.expoConfig?.extra as { BACKEND_URL?: string } | undefined) ??
    (Constants.manifest?.extra as { BACKEND_URL?: string } | undefined)
  );
  const overrideUrl =
    expoExtra?.BACKEND_URL || (process.env.BACKEND_URL as string | undefined);
  if (overrideUrl) {
    return overrideUrl;
  }

  if (Platform.OS === "android") {
    // Android Emulator: host machine localhost is 10.0.2.2
    // Android Physical device: must use your laptop LAN IP
    if (Constants.isDevice) {
      return LAN_IP ? `http://${LAN_IP}:${DEFAULT_PORT}` : `http://localhost:${DEFAULT_PORT}`;
    }
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  if (Platform.OS === "ios") {
    // iOS simulator: localhost works.
    // Physical device: use your laptop LAN IP.
    if (Constants.isDevice) {
      return LAN_IP ? `http://${LAN_IP}:${DEFAULT_PORT}` : `http://localhost:${DEFAULT_PORT}`;
    }
    return `http://localhost:${DEFAULT_PORT}`;
  }

  if (Platform.OS === "web") {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
    return `http://${hostname || "localhost"}:${DEFAULT_PORT}`;
  }

  if (LAN_IP) {
    return `http://${LAN_IP}:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}

const BASE_URL = getBaseUrl();

export type FarmerMoistureMode = "weights" | "moisture_tool";

export interface TemperatureReadingInput {
  day: number;
  temp_8am: number;
  temp_12pm: number;
  temp_6pm: number;
}

// ===== Unified /predict (FastAPI) =====
export interface CinnOraclePredictRequest {
  user_type: "farmer" | "large_scale";
  weight_before_drying_kg?: number | null;
  weight_after_drying_kg?: number | null;
  moisture_percentage?: number | null;
  farmer_moisture_mode?: FarmerMoistureMode | null;
  diameter_mm: number;
  drying_days: number;
  temperature_readings: TemperatureReadingInput[];
  color: string;
  visual_mould: "Yes" | "No";
  district: string;
  harvest_quantity_kg: number;
}

export interface CinnOracleCalculatedValues {
  estimated_moisture_percentage: number | null;
  avg_temp_8am_c: number;
  avg_temp_12pm_c: number;
  avg_temp_6pm_c: number;
  overall_average_temperature_c: number;
}

export interface CinnOraclePredictResponse {
  predicted_grade: string;
  predicted_price_per_kg: number;
  harvest_quantity_kg: number;
  estimated_total_income: number;
  district: string;
  calculated_values: CinnOracleCalculatedValues;
  recommended_marketplaces: string[];
}

async function readFastApiError(response: Response): Promise<string> {
  try {
    const data: any = await response.json();
    if (data?.detail) {
      if (typeof data.detail === "string") return data.detail;
      if (Array.isArray(data.detail) && data.detail[0]?.msg) {
        return String(data.detail[0].msg);
      }
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

// ===== Price Prediction Interfaces =====
export interface PriceInput {
  quality_grade: string;
  district?: string;
  weight_loss_percent?: number;
  harvest_date?: string;
  quality_level?: string;
  standard_grade?: string;
  weight_before?: number;
  weight_after?: number;
  temperature?: number;
  batch_id?: string;
}

export interface PricePredictionResponse {
  price: number;
  currency: string;
  quality_grade: string;
  district: string;
  quality_level?: string;
  standard_grade?: string;
  market_suggestions?: { name: string; description: string }[];
  reason?: string;
  message: string;
}

// ===== Prediction History Interfaces =====
export interface PredictionRecord {
  _id: string;
  batch_id?: string | null;
  user_type?: "farmer" | "large_scale" | string;
  farmer_moisture_mode?: "weights" | "moisture_tool" | string | null;
  moisture_percentage?: number | null;
  weight_before: number;
  weight_after: number;
  temperature: number;
  temperature_readings?: { day: number; temp_8am: number; temp_12pm: number; temp_6pm: number }[] | null;
  district: string;
  harvest_date?: string | null;
  drying_days?: number | null;
  color?: string | null;
  visual_mould?: string | null;
  quality_level?: string | null;
  standard_grade?: string | null;
  predicted_quality: string;
  predicted_standard_grade: string;
  weight_loss_percent: number;
  estimated_price?: number | null;
  estimated_total_income?: number | null;
  harvest_quantity_kg?: number | null;
  currency: string;
  market_suggestions?: { name: string; description?: string }[] | null;
  reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PredictionHistoryResponse {
  predictions: PredictionRecord[];
  count: number;
}

// ===== Grades Interfaces =====
export interface GradeCharacteristics {
  code: string;
  name: string;
  description: string;
  characteristics: string[];
}

export interface QualityLevelDetails {
  price_range: string;
  market: string;
  temperature_range: string;
  weight_loss_range: string;
}

export interface GradesResponse {
  grades: GradeCharacteristics[];
  quality_levels: {
    [key: string]: QualityLevelDetails;
  };
}

// ===== Health Check =====
export async function checkHealth() {
  try {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === "ok";
  } catch (error) {
    console.error("Health check failed:", error);
    return false;
  }
}

// ===== Unified prediction API =====
export async function predictCinnOracle(
  input: CinnOraclePredictRequest
): Promise<CinnOraclePredictResponse> {
  const response = await fetch(`${BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const msg = await readFastApiError(response);
    throw new Error(msg);
  }

  return await response.json();
}

// ===== Price Prediction API =====
export async function predictPrice(input: PriceInput): Promise<PricePredictionResponse> {
  try {
    const response = await fetch(`${BASE_URL}/predict-price`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Price prediction failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Price prediction error:", error);
    throw error;
  }
}

// ===== Grades Information API =====
export async function getGrades(): Promise<GradesResponse> {
  try {
    const response = await fetch(`${BASE_URL}/grades`);

    if (!response.ok) {
      throw new Error(`Failed to fetch grades: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Grades fetch error:", error);
    throw error;
  }
}

// ===== Prediction History API =====
export async function getPredictions(
  limit: number = 50,
  skip: number = 0
): Promise<PredictionHistoryResponse> {
  try {
    const response = await fetch(
      `${BASE_URL}/predictions?limit=${limit}&skip=${skip}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch prediction history: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Prediction history fetch error:", error);
    throw error;
  }
}

// ===== Delete Prediction API =====
export async function deletePrediction(id: string): Promise<void> {
  try {
    const response = await fetch(`${BASE_URL}/predictions/${id}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 204) {
      throw new Error(`Failed to delete prediction: ${response.status}`);
    }
  } catch (error) {
    console.error("Prediction delete error:", error);
    throw error;
  }
}

// Back-compat alias (older screen code)
export const predictQuality = predictCinnOracle;
export const predictQualityAndPrice = predictCinnOracle;
