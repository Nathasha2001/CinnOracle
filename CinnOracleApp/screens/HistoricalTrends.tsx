import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { getPredictions, deletePrediction, PredictionRecord } from '../src/api/client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DISTRICT_OPTIONS = [
  { label: 'All Districts', value: '' },
  { label: 'Galle District', value: 'Galle' },
  { label: 'Matara District', value: 'Matara' },
  { label: 'Kalutara District', value: 'Kalutara' },
  { label: 'Badulla District', value: 'Badulla' },
  { label: 'Colombo District', value: 'Colombo' },
  { label: 'Gampaha District', value: 'Gampaha' },
  { label: 'Hambantota District', value: 'Hambantota' },
  { label: 'Kurunegala District', value: 'Kurunegala' },
  { label: 'Monaragala District', value: 'Monaragala' },
  { label: 'Ratnapura District', value: 'Ratnapura' },
];

export default function HistoricalTrends() {
  const navigation = useNavigation<NavigationProp>();

  const [selectedDistrict, setSelectedDistrict] = useState(
    DISTRICT_OPTIONS[1].label,
  );
  const [showDistrictDropdown, setShowDistrictDropdown] = useState(false);
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatDate = (raw: string | null | undefined) => {
    if (!raw) return '—';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    });
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPredictions(50, 0);
        setHistory(res.predictions || []);
      } catch (e) {
        console.error('Failed to load prediction history', e);
        setError('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedDistrictValue =
    DISTRICT_OPTIONS.find((d) => d.label === selectedDistrict)?.value || '';

  const buildChartData = () => {
    const filteredHistory =
      selectedDistrictValue === ''
        ? history
        : history.filter((item) => item.district === selectedDistrictValue);
    const buckets: { [key: string]: { sum: number; count: number } } = {};

    filteredHistory.forEach((item) => {
      const rawDate = item.harvest_date || item.created_at;
      if (!rawDate || item.estimated_price == null) return;

      const d = new Date(rawDate);
      if (Number.isNaN(d.getTime())) return;

      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!buckets[key]) {
        buckets[key] = { sum: 0, count: 0 };
      }
      buckets[key].sum += item.estimated_price;
      buckets[key].count += 1;
    });

    const entries = Object.entries(buckets)
      .map(([key, v]) => {
        const [yearStr, monthStr] = key.split('-');
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10);
        const date = new Date(year, month - 1, 1);
        return {
          date,
          label: date.toLocaleString('default', { month: 'short' }),
          value: v.count > 0 ? v.sum / v.count : 0,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const lastSix = entries.slice(-6);

    return lastSix.map((e) => ({
      label: e.label,
      value: Math.round(e.value),
    }));
  };

  const chartData = buildChartData();

  const averagePrice =
    chartData.length > 0
      ? Math.round(
          chartData.reduce((sum, point) => sum + point.value, 0) /
            chartData.length,
        )
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Historical Trends</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Track cinnamon prices by district and time period
        </Text>

        {/* Filter chips */}
        <View style={styles.chipRow}>
          <TouchableOpacity
            style={styles.filterChip}
            onPress={() => setShowDistrictDropdown((prev) => !prev)}
          >
            <View style={styles.chipIconCircle}>
              <Ionicons name="location-outline" size={14} color="#2E7D32" />
            </View>
            <Text style={styles.filterChipText}>{selectedDistrict}</Text>
            <Ionicons
              name={showDistrictDropdown ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#2E7D32"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.filterChip}>
            <View style={styles.chipIconCircle}>
              <Ionicons name="calendar-outline" size={14} color="#2E7D32" />
            </View>
            <Text style={styles.filterChipText}>Last 6 Months</Text>
          </TouchableOpacity>
        </View>

        {/* Price trends card */}
        {showDistrictDropdown && (
          <View style={styles.dropdown}>
            {DISTRICT_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.label}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedDistrict(opt.label);
                  setShowDistrictDropdown(false);
                }}
              >
                <Text
                  style={[
                    styles.dropdownItemText,
                    opt.label === selectedDistrict &&
                      styles.dropdownItemTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Price trends card */}
        <View style={styles.trendCard}>
          <View style={styles.trendHeaderRow}>
            <View>
              <Text style={styles.trendTitle}>Cinnamon Price Trends</Text>
              <Text style={styles.trendSubtitle}>
                Last 6 Months • {selectedDistrict}
              </Text>
            </View>
            <View style={styles.avgPriceBlock}>
              <Text style={styles.avgPriceLabel}>Average Price</Text>
              <Text style={styles.avgPriceValue}>
                Rs. {averagePrice.toLocaleString()} / kg
              </Text>
            </View>
          </View>

          {/* Simple line chart */}
          <View style={styles.lineChart}>
            <View style={styles.lineChartGrid} />
            <View style={styles.lineChartInner}>
              {chartData.map((point, index) => {
                const maxValue = 4400;
                const minValue = 3200;
                const ratio =
                  (point.value - minValue) / (maxValue - minValue || 1);
                const y = (1 - ratio) * 100;
                return (
                  <View key={point.label} style={styles.linePointWrapper}>
                    <View
                      style={[
                        styles.linePoint,
                        { bottom: `${y}%` },
                      ]}
                    />
                  </View>
                );
              })}
            </View>
            <View style={styles.lineChartLabels}>
              {chartData.map((point) => (
                <Text key={point.label} style={styles.chartMonthLabel}>
                  {point.label}
                </Text>
              ))}
            </View>
          </View>

          {/* Change cards */}
          <View style={styles.changeRow}>
            <View style={[styles.changeCard, styles.changeCardPositive]}>
              <Text style={styles.changeValue}>↑ 7.5%</Text>
              <Text style={styles.changeLabel}>since Mar '24</Text>
            </View>
            <View style={[styles.changeCard, styles.changeCardNegative]}>
              <Text style={styles.changeValue}>↓ 3.8%</Text>
              <Text style={styles.changeLabel}>from last month</Text>
            </View>
          </View>
        </View>

        {/* History list */}
        <View style={styles.historyHeaderRow}>
          <View style={styles.historyTitleLeft}>
            <Text style={styles.historyTitle}>History</Text>
          </View>
          <TouchableOpacity style={styles.historyFilterChip}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color="#2E7D32"
              style={{ marginRight: 4 }}
            />
            <Text style={styles.historyFilterText}>Monthly Averages</Text>
            <MaterialIcons
              name="chevron-right"
              size={18}
              color="#2E7D32"
              style={{ marginLeft: 2 }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.historyListCard}>
          {loading && (
            <Text style={styles.historyMonth}>Loading history...</Text>
          )}
          {error && !loading && (
            <Text style={styles.historyMonth}>{error}</Text>
          )}
          {!loading && !error && history.length === 0 && (
            <Text style={styles.historyMonth}>No predictions saved yet.</Text>
          )}
          {!loading &&
            !error &&
            history
              .filter((item) =>
                selectedDistrictValue === ''
                  ? true
                  : item.district === selectedDistrictValue,
              )
              .map((item, index, filtered) => {
              const isLast = index === filtered.length - 1;
              const dateLabel =
                item.harvest_date || item.created_at || '';
              const quality =
                item.quality_level || item.predicted_quality || '';
              const grade =
                item.standard_grade || item.predicted_standard_grade || '';
              const batchId = item.batch_id || item._id;
              return (
                <View
                  key={item._id}
                  style={[
                    styles.historyRow,
                    isLast && { borderBottomWidth: 0 },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.historyMain}
                    activeOpacity={0.8}
                    onPress={() => {
                      navigation.navigate('Report', {
                        batchData: {
                          batchId: batchId,
                          qualityLevel: quality,
                          standardGrade: grade,
                          price: item.estimated_price,
                          district: item.district,
                          date: dateLabel,
                          inputs: {
                            weightBefore: item.weight_before,
                            weightAfter: item.weight_after,
                            temperature: item.temperature,
                            dryingDays: item.drying_days,
                            cinnamonColor: item.color,
                            breakageLevel: item.breakage_level,
                            rollTightness: item.roll_tightness,
                            aromaStrength: item.aroma_strength,
                          },
                          markets: item.market_suggestions || undefined,
                          reason: item.reason || undefined,
                        },
                      });
                    }}
                  >
                    <Text style={styles.historyMonth}>
                      {formatDate(dateLabel)}
                    </Text>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyPrice}>
                        {item.estimated_price != null
                          ? `Rs. ${item.estimated_price.toLocaleString()} / kg`
                          : '—'}
                      </Text>
                      <Text style={styles.historyChange}>
                        {quality && grade ? `${quality} • ${grade}` : ''}
                      </Text>
                      <Text style={styles.historyBatch}>
                        {batchId ? `Batch ID: ${batchId}` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                    onPress={async () => {
                      try {
                        setDeletingId(item._id);
                        await deletePrediction(item._id);
                        setHistory((prev) =>
                          prev.filter((p) => p._id !== item._id)
                        );
                      } catch (e) {
                        console.error('Failed to delete prediction', e);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={20}
                      color={
                        deletingId === item._id ? '#B0BEC5' : '#B0BEC5'
                      }
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('CinnOracleMain')}
        >
          <MaterialIcons name="home" size={24} color="#9E9E9E" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('NewAnalysis')}
        >
          <MaterialIcons name="analytics" size={24} color="#9E9E9E" />
          <Text style={styles.navLabel}>Analysis</Text>
        </TouchableOpacity>

        <View style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="history" size={24} color="#FFFFFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>History</Text>
        </View>

        <TouchableOpacity style={styles.navItem}>
          <MaterialIcons name="settings" size={24} color="#9E9E9E" />
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  headerIcon: {
    padding: 4,
    width: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
    marginBottom: 14,
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flex: 1,
    marginRight: 8,
  },
  chipIconCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginRight: 4,
  },
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  dropdownItemText: {
    fontSize: 13,
    color: '#424242',
  },
  dropdownItemTextActive: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  trendHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  trendSubtitle: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  avgPriceBlock: {
    alignItems: 'flex-end',
  },
  avgPriceLabel: {
    fontSize: 11,
    color: '#9E9E9E',
    marginBottom: 2,
  },
  avgPriceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  lineChart: {
    marginTop: 8,
    marginBottom: 12,
  },
  lineChartGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 24,
    borderRadius: 10,
    backgroundColor: '#F5FFF7',
  },
  lineChartInner: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingBottom: 16,
  },
  linePointWrapper: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#27ae60',
  },
  lineChartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  chartMonthLabel: {
    fontSize: 11,
    color: '#7f8c8d',
  },
  changeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  changeCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  changeCardPositive: {
    backgroundColor: '#E8F5E9',
  },
  changeCardNegative: {
    backgroundColor: '#FFEBEE',
  },
  changeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  changeLabel: {
    fontSize: 12,
    color: '#757575',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  historyFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  historyFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  historyListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyMonth: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyPrice: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  historyChange: {
    fontSize: 12,
    marginTop: 2,
  },
  historyBatch: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  deleteButton: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#9E9E9E',
    marginTop: 2,
  },
  navItemActive: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navLabelActive: {
    color: '#FFFFFF',
  },
});

