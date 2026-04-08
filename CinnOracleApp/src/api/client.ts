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
// From ipconfig: Wi‑Fi = 10.58.54.251; Ethernet = 192.168.98.1, 192.168.174.1
const LAN_IP: string | null = null;

function getBaseUrl() {
  if (Platform.OS === "android") {
    // Android Emulator: host machine localhost is 10.0.2.2
    // Android Physical device: must use your laptop LAN IP
    if (LAN_IP && Constants.isDevice) {
      return `http://${LAN_IP}:${DEFAULT_PORT}`;
    }
    return `http://10.0.2.2:${DEFAULT_PORT}`;
  }

  // iOS simulator / web dev / real iPhone
  if (Platform.OS === "ios" || Platform.OS === "web") {
    // Prefer LAN_IP so real devices can reach your laptop
    if (LAN_IP) {
      return `http://${LAN_IP}:${DEFAULT_PORT}`;
    }
    // Fallback for simulators when backend is on same machine
    return `http://localhost:${DEFAULT_PORT}`;
  }

  // Other platforms (or if you want forced LAN IP)
  if (LAN_IP) {
    return `http://${LAN_IP}:${DEFAULT_PORT}`;
  }

  return `http://localhost:${DEFAULT_PORT}`;
}

const BASE_URL = getBaseUrl();

// ===== Quality Prediction Interfaces =====
export interface QualityPredictionInput {
  weight_before: number;
  weight_after: number;
  temperature: number;
  drying_days?: number;
  color?: string;
  breakage_level?: string;
  roll_tightness?: string;
  aroma_strength?: string;
  district?: string;
  harvest_date?: string;
}

export interface QualityPredictionResponse {
  quality: string;
  standard_grade: string;
  weight_loss_percent: number;
  message: string;
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
  weight_before: number;
  weight_after: number;
  temperature: number;
  district: string;
  harvest_date?: string | null;
  drying_days?: number | null;
  color?: string | null;
  breakage_level?: string | null;
  roll_tightness?: string | null;
  aroma_strength?: string | null;
  quality_level?: string | null;
  standard_grade?: string | null;
  predicted_quality: string;
  predicted_standard_grade: string;
  weight_loss_percent: number;
  estimated_price?: number | null;
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

// ===== Quality Prediction API =====
export async function predictQuality(input: QualityPredictionInput): Promise<QualityPredictionResponse> {
  try {
    const response = await fetch(`${BASE_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      throw new Error(`Quality prediction failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Quality prediction error:", error);
    throw error;
  }
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

// ===== Legacy function for backward compatibility =====
export async function predictQualityAndPrice(payload: any) {
  return predictQuality(payload);
}
