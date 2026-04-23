import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../App';
import { predictCinnOracle, CinnOraclePredictRequest } from '../src/api/client';
import AppBottomNav from '../components/AppBottomNav';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type UserType = 'Farmer Level' | 'Large Scale';
type ToolType = 'With Tool' | 'Without Tool';
type ColorType = 'Light Brown' | 'Golden Brown' | 'Dark Brown';
type MouldType = 'Yes' | 'No';
type DayTemperature = {
  morning: string;
  noon: string;
  evening: string;
};

export default function NewAnalysis() {
  const navigation = useNavigation<NavigationProp>();

  const [userType, setUserType] = useState<UserType>('Farmer Level');
  const [toolType, setToolType] = useState<ToolType>('Without Tool');
  const [weightBefore, setWeightBefore] = useState('');
  const [weightAfter, setWeightAfter] = useState('');
  const [moistureInput, setMoistureInput] = useState('');
  const [diameter, setDiameter] = useState('');
  const [dryingDays, setDryingDays] = useState('2');
  const [temperatureDays, setTemperatureDays] = useState<DayTemperature[]>([
    { morning: '', noon: '', evening: '' },
    { morning: '', noon: '', evening: '' },
  ]);
  const [color, setColor] = useState<ColorType>('Golden Brown');
  const [visualMould, setVisualMould] = useState<MouldType>('No');
  const [district, setDistrict] = useState('Galle');
  const [harvestQuantityKg, setHarvestQuantityKg] = useState('100');
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  const DISTRICTS = [
    'Badulla',
    'Galle',
    'Hambantota',
    'Gampaha',
    'Ratnapura',
    'Colombo',
    'Matara',
    'Monaragala',
    'Kurunegala',
  ];

  useEffect(() => {
    // Large scale users always have moisture tool,
    // so tool option should not be shown/used.
    if (userType === 'Large Scale') {
      setToolType('With Tool');
    }
  }, [userType]);

  const formatNumericInput = (value: string) => value.replace(/[^\d.]/g, '');
  const toNumber = (value: string) => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const dryingDaysNum = Math.max(1, Math.min(14, Math.floor(toNumber(dryingDays) || 0)));
  const estimatedMoisture = useMemo(() => {
    const before = toNumber(weightBefore);
    const after = toNumber(weightAfter);
    if (before <= 0 || after < 0 || after > before) return null;
    return Number((((before - after) / before) * 100).toFixed(1));
  }, [weightBefore, weightAfter]);

  const syncTemperatureDays = (nextDays: number) => {
    setTemperatureDays((prev) => {
      const normalized = [...prev];
      if (normalized.length < nextDays) {
        while (normalized.length < nextDays) {
          normalized.push({ morning: '', noon: '', evening: '' });
        }
      } else if (normalized.length > nextDays) {
        normalized.length = nextDays;
      }
      return normalized;
    });
  };

  const onChangeDryingDays = (value: string) => {
    const cleaned = formatNumericInput(value);
    setDryingDays(cleaned);
    const nextDays = Math.max(1, Math.min(14, Math.floor(toNumber(cleaned) || 0)));
    syncTemperatureDays(nextDays);
  };

  const averageTemperature = useMemo(() => {
    const values = temperatureDays
      .flatMap((d) => [toNumber(d.morning), toNumber(d.noon), toNumber(d.evening)])
      .filter((v) => v > 0);
    if (values.length === 0) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  }, [temperatureDays]);

  const dayAverage = (day: DayTemperature) => {
    const values = [toNumber(day.morning), toNumber(day.noon), toNumber(day.evening)].filter(
      (v) => v > 0,
    );
    if (values.length === 0) return 0;
    return Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
  };

  const validate = () => {
    if (!diameter || toNumber(diameter) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid diameter.');
      return false;
    }
    if (!harvestQuantityKg || toNumber(harvestQuantityKg) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid harvest quantity (kg).');
      return false;
    }
    if (!dryingDays || toNumber(dryingDays) <= 0) {
      Alert.alert('Validation Error', 'Please enter valid drying days.');
      return false;
    }
    const hasInvalidTemp = temperatureDays.some(
      (d) => toNumber(d.morning) <= 0 || toNumber(d.noon) <= 0 || toNumber(d.evening) <= 0,
    );
    if (hasInvalidTemp) {
      Alert.alert('Validation Error', 'Please enter temperature for every drying day.');
      return false;
    }

    if (userType === 'Farmer Level' && toolType === 'Without Tool') {
      const before = toNumber(weightBefore);
      const after = toNumber(weightAfter);
      if (before <= 0 || after <= 0) {
        Alert.alert('Validation Error', 'Please enter weight before and weight after drying.');
        return false;
      }
      if (after >= before) {
        Alert.alert('Validation Error', 'Weight after drying must be less than weight before drying.');
        return false;
      }
    } else {
      if (!moistureInput || toNumber(moistureInput) <= 0) {
        Alert.alert('Validation Error', 'Please enter moisture percentage.');
        return false;
      }
    }

    return true;
  };

  const handlePredict = async () => {
    if (!validate()) return;

    const backendUserType = userType === 'Large Scale' ? 'large_scale' : 'farmer';
    const moistureMode: 'weights' | 'moisture_tool' | undefined =
      userType === 'Farmer Level'
        ? toolType === 'Without Tool'
          ? 'weights'
          : 'moisture_tool'
        : undefined;

    const moisturePercent =
      userType === 'Farmer Level' && toolType === 'Without Tool'
        ? estimatedMoisture ?? 0
        : toNumber(moistureInput);

    const wBefore = toNumber(weightBefore);
    const wAfter = toNumber(weightAfter);

    const temperature_readings = temperatureDays.slice(0, dryingDaysNum).map((day, idx) => ({
      day: idx + 1,
      temp_8am: toNumber(day.morning),
      temp_12pm: toNumber(day.noon),
      temp_6pm: toNumber(day.evening),
    }));

    const payload: CinnOraclePredictRequest = {
      user_type: backendUserType,
      diameter_mm: toNumber(diameter),
      drying_days: dryingDaysNum,
      temperature_readings,
      color,
      visual_mould: visualMould,
      district,
      harvest_quantity_kg: toNumber(harvestQuantityKg),
      farmer_moisture_mode: moistureMode,
    };

    if (backendUserType === 'farmer') {
      if (moistureMode === 'weights') {
        payload.weight_before_drying_kg = wBefore;
        payload.weight_after_drying_kg = wAfter;
        payload.moisture_percentage = null;
      } else {
        payload.weight_before_drying_kg = null;
        payload.weight_after_drying_kg = null;
        payload.moisture_percentage = toNumber(moistureInput);
      }
    } else {
      payload.moisture_percentage = toNumber(moistureInput);
      payload.weight_before_drying_kg = null;
      payload.weight_after_drying_kg = null;
    }

    const harvestDateIso = new Date().toISOString();

    try {
      const prediction = await predictCinnOracle(payload);
      const batchId = `#${Math.floor(Math.random() * 9000) + 1000}`;

      const displayWeightBefore =
        backendUserType === 'farmer' && moistureMode === 'weights' ? wBefore : 100;
      const displayWeightAfter =
        backendUserType === 'farmer' && moistureMode === 'weights'
          ? wAfter
          : Math.max(0, 100 - toNumber(moistureInput));

      const weightLossPercent =
        displayWeightBefore > 0
          ? Number((((displayWeightBefore - displayWeightAfter) / displayWeightBefore) * 100).toFixed(2))
          : 0;

      navigation.navigate('PricePrediction', {
        result: {
          // legacy fields
          quality: prediction.predicted_grade,
          qualityLevel: prediction.predicted_grade,
          standardGrade: prediction.predicted_grade,
          weight_loss_percent: weightLossPercent,
          batchId,
          district: prediction.district,
          harvestDate: harvestDateIso,
          // new unified fields
          predictedPricePerKg: prediction.predicted_price_per_kg,
          estimatedTotalIncome: prediction.estimated_total_income,
          recommendedMarketplaces: prediction.recommended_marketplaces,
          calculatedValues: prediction.calculated_values,
          inputs: {
            weightBefore: displayWeightBefore,
            weightAfter: displayWeightAfter,
            temperature: averageTemperature,
            dryingDays: dryingDaysNum,
            cinnamonColor: color,
            visualMould,
            moisture: moisturePercent,
            moistureMode: moistureMode ?? 'moisture_tool',
            diameter: toNumber(diameter),
            harvestQuantityKg: toNumber(harvestQuantityKg),
            temperatureReadings: temperature_readings,
          },
        },
      });
    } catch (error: any) {
      console.error('Prediction error:', error);
      Alert.alert('Error', error?.message || 'Failed to run prediction. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Predict Your Cinnamon Quality</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTag}>1. Select User Type</Text>
        <View style={styles.row}>
          {(['Farmer Level', 'Large Scale'] as UserType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.optionCard, userType === type && styles.optionCardActive]}
              onPress={() => setUserType(type)}
            >
              <Text style={[styles.optionTitle, userType === type && styles.optionTitleActive]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {userType !== 'Large Scale' && (
          <>
            <Text style={styles.sectionTag}>2. Moisture (Select Option)</Text>
            <View style={styles.row}>
              {(['With Tool', 'Without Tool'] as ToolType[]).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.optionCard, toolType === type && styles.optionCardActive]}
                  onPress={() => setToolType(type)}
                >
                  <Text style={[styles.optionTitle, toolType === type && styles.optionTitleActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {userType === 'Farmer Level' && toolType === 'Without Tool' ? (
          <View style={styles.card}>
            <Text style={styles.label}>Weight Before Drying (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weightBefore}
              onChangeText={(v) => setWeightBefore(formatNumericInput(v))}
              placeholder="Enter weight before drying"
            />
            <Text style={styles.label}>Weight After Drying (kg)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={weightAfter}
              onChangeText={(v) => setWeightAfter(formatNumericInput(v))}
              placeholder="Enter weight after drying"
            />
            {estimatedMoisture !== null && (
              <>
                <Text style={styles.label}>Moisture Percentage (%)</Text>
                <View style={styles.readOnlyBox}>
                  <Text style={styles.readOnlyText}>{estimatedMoisture}%</Text>
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.label}>Moisture Percentage (%)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={moistureInput}
              onChangeText={(v) => setMoistureInput(formatNumericInput(v))}
              placeholder="Enter moisture percentage"
            />
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.sectionTag}>3. Cinnamon Details</Text>
          <Text style={styles.label}>Diameter (mm)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={diameter}
            onChangeText={(v) => setDiameter(formatNumericInput(v))}
            placeholder="Enter diameter"
          />

          <Text style={styles.label}>Drying Days</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={dryingDays}
            onChangeText={onChangeDryingDays}
            placeholder="Enter drying days"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTag}>4. Temperature (°C)</Text>
          <View style={styles.tempHeaderRow}>
            <Text style={styles.tempHeaderDay}>Day</Text>
            <Text style={styles.tempHeaderCol}>8 AM</Text>
            <Text style={styles.tempHeaderCol}>12 PM</Text>
            <Text style={styles.tempHeaderCol}>6 PM</Text>
            <Text style={styles.tempHeaderAvg}>Average</Text>
          </View>
          {temperatureDays.map((value, idx) => (
            <View key={`day-${idx}`} style={styles.tempRow}>
              <Text style={styles.dayLabel}>Day {idx + 1}</Text>
              <TextInput
                style={[styles.input, styles.tempInput]}
                keyboardType="numeric"
                value={value.morning}
                onChangeText={(v) =>
                  setTemperatureDays((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], morning: formatNumericInput(v) };
                    return next;
                  })
                }
                placeholder="°C"
              />
              <TextInput
                style={[styles.input, styles.tempInput]}
                keyboardType="numeric"
                value={value.noon}
                onChangeText={(v) =>
                  setTemperatureDays((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], noon: formatNumericInput(v) };
                    return next;
                  })
                }
                placeholder="°C"
              />
              <TextInput
                style={[styles.input, styles.tempInput]}
                keyboardType="numeric"
                value={value.evening}
                onChangeText={(v) =>
                  setTemperatureDays((prev) => {
                    const next = [...prev];
                    next[idx] = { ...next[idx], evening: formatNumericInput(v) };
                    return next;
                  })
                }
                placeholder="°C"
              />
              <Text style={styles.dayAvgValue}>{dayAverage(value) > 0 ? `${dayAverage(value)}°C` : '—'}</Text>
            </View>
          ))}
          <Text style={styles.avgText}>
            Overall Average Temperature: {averageTemperature > 0 ? `${averageTemperature} °C` : 'Auto calculated'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTag}>5. Color</Text>
          <View style={styles.rowWrap}>
            {(['Light Brown', 'Golden Brown', 'Dark Brown'] as ColorType[]).map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, color === c && styles.chipActive]}
                onPress={() => setColor(c)}
              >
                <Text style={[styles.chipText, color === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTag}>6. Visual Mould</Text>
          <View style={styles.row}>
            {(['Yes', 'No'] as MouldType[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.optionCard, visualMould === m && styles.optionCardActive]}
                onPress={() => setVisualMould(m)}
              >
                <Text style={[styles.optionTitle, visualMould === m && styles.optionTitleActive]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTag}>7. District</Text>
          <TouchableOpacity
            style={[styles.input, styles.dropdownInput]}
            onPress={() => setShowDistrictModal(true)}
          >
            <Text style={styles.dropdownText}>{district || 'Select district'}</Text>
            <MaterialIcons name="arrow-drop-down" size={22} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTag}>8. Harvest quantity</Text>
          <Text style={styles.label}>Total harvest quantity (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={harvestQuantityKg}
            onChangeText={(v) => setHarvestQuantityKg(formatNumericInput(v))}
            placeholder="e.g. 100"
          />
        </View>

        <TouchableOpacity style={styles.predictButton} onPress={handlePredict}>
          <Text style={styles.predictText}>Predict</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={showDistrictModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity onPress={() => setShowDistrictModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {DISTRICTS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={styles.modalOption}
                  onPress={() => {
                    setDistrict(d);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text style={styles.modalOptionText}>{d}</Text>
                  {district === d && (
                    <MaterialIcons name="check" size={20} color="#2E7D32" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <AppBottomNav active="predict" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#1E1E1E' },
  content: { padding: 16, paddingBottom: 28 },
  sectionTag: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4E342E',
    marginBottom: 10,
  },
  row: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  optionCardActive: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  optionTitle: { fontSize: 14, fontWeight: '600', color: '#424242', textAlign: 'center' },
  optionTitleActive: { color: '#2E7D32' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
    padding: 12,
    marginBottom: 12,
  },
  label: { fontSize: 13, color: '#616161', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 8,
    color: '#1E1E1E',
  },
  dropdownInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    color: '#1E1E1E',
  },
  readOnlyBox: {
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 8,
    backgroundColor: '#F5FFF7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  readOnlyText: { color: '#2E7D32', fontSize: 14, fontWeight: '700' },
  tempRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tempHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  tempHeaderDay: { width: 42, fontSize: 11, color: '#757575', fontWeight: '700' },
  tempHeaderCol: { flex: 1, fontSize: 11, color: '#757575', fontWeight: '700', textAlign: 'center' },
  tempHeaderAvg: { width: 64, fontSize: 11, color: '#757575', fontWeight: '700', textAlign: 'center' },
  dayLabel: { width: 42, fontSize: 12, color: '#555' },
  tempInput: {
    flex: 1,
    marginBottom: 0,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  dayAvgValue: {
    width: 64,
    fontSize: 12,
    color: '#424242',
    textAlign: 'center',
    fontWeight: '600',
  },
  avgText: { marginTop: 4, fontSize: 12, color: '#2E7D32', fontWeight: '600' },
  chip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#2E7D32', backgroundColor: '#F1F8E9' },
  chipText: { color: '#555', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#2E7D32', fontWeight: '700' },
  predictButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 8,
  },
  predictText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    paddingBottom: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E1E1E',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalOptionText: {
    fontSize: 15,
    color: '#333',
  },
});
