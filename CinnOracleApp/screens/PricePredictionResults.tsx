import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import AppBottomNav from '../components/AppBottomNav';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PricePrediction'>;
type PricePredictionRouteProp = RouteProp<RootStackParamList, 'PricePrediction'>;

const mapGradeToQuality = (grade?: string | null): string => {
  if (!grade) return 'Low Quality';
  const g = grade.trim().toUpperCase();
  if (g === 'ALBA' || g === 'C5 SPECIAL' || g === 'C5') return 'High Quality';
  if (g === 'C4' || g === 'H1') return 'Medium Quality';
  return 'Low Quality';
};

export default function PricePredictionResults() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PricePredictionRouteProp>();
  const { result } = route.params ?? { result: null };

  const grade = result?.standardGrade || result?.quality || 'C5';
  const qualityLevel = mapGradeToQuality(grade);
  const pricePerKg = Number(result?.predictedPricePerKg || 0);
  const harvestQty = Number(result?.inputs?.harvestQuantityKg || 0);
  const totalIncome = Number(result?.estimatedTotalIncome || pricePerKg * harvestQty || 0);
  const district = result?.district || 'Galle';
  const calculated = result?.calculatedValues || {};
  const marketplaces: string[] = Array.isArray(result?.recommendedMarketplaces)
    ? result.recommendedMarketplaces
    : [];

  const calculatedRows = [
    { label: 'Estimated Moisture Percentage', value: calculated?.estimated_moisture_percentage },
    { label: 'Average Temperature (8 AM)', value: calculated?.avg_temp_8am_c },
    { label: 'Average Temperature (12 PM)', value: calculated?.avg_temp_12pm_c },
    { label: 'Average Temperature (6 PM)', value: calculated?.avg_temp_6pm_c },
    { label: 'Overall Average Temperature', value: calculated?.overall_average_temperature_c },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A5D2A" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prediction Results</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CinnOracleMain')}>
          <MaterialIcons name="home" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successBanner}>
          <MaterialIcons name="check-circle" size={22} color="#1E8E3E" />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Prediction Completed Successfully!</Text>
            <Text style={styles.successSub}>Here are your cinnamon quality and price predictions.</Text>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Predicted Grade</Text>
            <Text style={styles.statValue}>{grade}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{qualityLevel}</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Predicted Price (per kg)</Text>
            <Text style={styles.statValue}>Rs. {pricePerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            <View style={[styles.badge, { backgroundColor: '#E3F2FD' }]}><Text style={[styles.badgeText, { color: '#1565C0' }]}>Estimated Market Price</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Harvest Quantity</Text>
            <Text style={styles.statValue}>{harvestQty} kg</Text>
            <View style={[styles.badge, { backgroundColor: '#FFF8E1' }]}><Text style={[styles.badgeText, { color: '#8D6E63' }]}>From New Analysis</Text></View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Estimated Total Income</Text>
            <Text style={styles.statValue}>Rs. {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>Calculated</Text></View>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Calculated Values</Text>
          {calculatedRows.map((row) => (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>
                {row.value === null || row.value === undefined
                  ? 'N/A'
                  : `${Number(row.value).toFixed(2)}${row.label.includes('Temperature') ? ' °C' : ' %'}`}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recommended Marketplaces</Text>
          <Text style={styles.sectionSub}>Based on your grade, quantity and district ({district}).</Text>
          {(marketplaces.length ? marketplaces : [`${district} Cinnamon Market`]).map((m) => (
            <View key={m} style={styles.marketRow}>
              <MaterialIcons name="storefront" size={18} color="#2E7D32" />
              <Text style={styles.marketText}>{m}</Text>
              <MaterialIcons name="chevron-right" size={18} color="#9E9E9E" />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.newPredictionButton} onPress={() => navigation.navigate('NewAnalysis')}>
          <MaterialIcons name="autorenew" size={18} color="#FFFFFF" />
          <Text style={styles.newPredictionText}>New Prediction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('HistoricalTrends')}>
          <MaterialIcons name="history" size={18} color="#2E7D32" />
          <Text style={styles.historyButtonText}>Go to History</Text>
        </TouchableOpacity>
      </ScrollView>
      <AppBottomNav active="predict" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F5F4' },
  header: {
    backgroundColor: '#0A5D2A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 24 },
  successBanner: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: { color: '#1B5E20', fontSize: 16, fontWeight: '700' },
  successSub: { color: '#2E7D32', fontSize: 13, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: {
    width: '48.4%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  statLabel: { fontSize: 12, color: '#616161' },
  statValue: { fontSize: 30, color: '#1B5E20', fontWeight: '800', marginVertical: 6 },
  badge: { alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: '#1B5E20', fontSize: 11, fontWeight: '700' },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    marginTop: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F1F1F', marginBottom: 8 },
  sectionSub: { fontSize: 13, color: '#757575', marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F1F1' },
  rowLabel: { color: '#424242', fontSize: 13, flex: 1, paddingRight: 12 },
  rowValue: { color: '#1E1E1E', fontSize: 13, fontWeight: '600' },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F3F3',
  },
  marketText: { flex: 1, fontSize: 14, color: '#1E1E1E', fontWeight: '600' },
  newPredictionButton: {
    marginTop: 16,
    backgroundColor: '#0B7A33',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  newPredictionText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  historyButton: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#CDE8D2',
  },
  historyButtonText: { color: '#2E7D32', fontSize: 15, fontWeight: '700' },
});
