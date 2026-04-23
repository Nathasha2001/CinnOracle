import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { getPredictions, deletePrediction, PredictionRecord } from '../src/api/client';
import AppBottomNav from '../components/AppBottomNav';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const qualityTagColor = (quality?: string | null) => {
  const q = (quality || '').toLowerCase();
  if (q.includes('high')) return { bg: '#E8F5E9', text: '#2E7D32' };
  if (q.includes('medium')) return { bg: '#FFF3E0', text: '#B26A00' };
  return { bg: '#FFEBEE', text: '#B23A48' };
};

const mapGradeToQuality = (grade?: string | null) => {
  const g = (grade || '').trim().toUpperCase();
  if (g === 'ALBA' || g === 'C5 SPECIAL' || g === 'C5') return 'High Quality';
  if (g === 'C4' || g === 'H1') return 'Medium Quality';
  return 'Low Quality';
};

export default function HistoricalTrends() {
  const navigation = useNavigation<NavigationProp>();
  const [history, setHistory] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getPredictions(100, 0);
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

  const formatDateTime = (raw: string | null | undefined) => {
    if (!raw) return '—';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return raw;
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return history;
    return history.filter((item) => {
      const grade = (item.standard_grade || item.predicted_standard_grade || '').toLowerCase();
      const district = (item.district || '').toLowerCase();
      const date = formatDateTime(item.harvest_date || item.created_at).toLowerCase();
      return grade.includes(q) || district.includes(q) || date.includes(q);
    });
  }, [history, search]);

  const stats = useMemo(() => {
    const totalPredictions = filtered.length;
    const highQualityCount = filtered.filter((item) => {
      const quality = item.quality_level || mapGradeToQuality(item.standard_grade || item.predicted_standard_grade);
      return quality.toLowerCase().includes('high');
    }).length;
    const totalEstimatedIncome = filtered.reduce((sum, item) => {
      const qty = Number(item.weight_after || 0);
      const price = Number(item.estimated_price || 0);
      return sum + qty * price;
    }, 0);
    const avgPrice =
      filtered.length > 0
        ? filtered.reduce((sum, item) => sum + Number(item.estimated_price || 0), 0) / filtered.length
        : 0;

    return {
      totalPredictions,
      highQualityCount,
      totalEstimatedIncome,
      avgPrice,
    };
  }, [filtered]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#757575" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by grade, district or date..."
            placeholderTextColor="#9E9E9E"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="description" size={16} color="#2E7D32" />
            </View>
            <Text style={styles.statValue}>{stats.totalPredictions}</Text>
            <Text style={styles.statLabel}>Total Predictions</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <MaterialIcons name="verified" size={16} color="#1565C0" />
            </View>
            <Text style={styles.statValue}>{stats.highQualityCount}</Text>
            <Text style={styles.statLabel}>High Quality</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="savings" size={16} color="#B26A00" />
            </View>
            <Text style={styles.statValue}>Rs. {Math.round(stats.totalEstimatedIncome).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Estimated Income</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: '#EDE7F6' }]}>
              <MaterialIcons name="trending-up" size={16} color="#5E35B1" />
            </View>
            <Text style={styles.statValue}>Rs. {stats.avgPrice.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Average Price/kg</Text>
          </View>
        </View>

        {loading && <Text style={styles.emptyText}>Loading history...</Text>}
        {error && !loading && <Text style={styles.emptyText}>{error}</Text>}
        {!loading && !error && filtered.length === 0 && (
          <Text style={styles.emptyText}>No predictions found.</Text>
        )}

        {!loading &&
          !error &&
          filtered.map((item) => {
            const quality = item.quality_level || mapGradeToQuality(item.standard_grade || item.predicted_standard_grade);
            const grade = item.standard_grade || item.predicted_standard_grade || '—';
            const tag = qualityTagColor(quality);
            const dateLabel = formatDateTime(item.harvest_date || item.created_at);
            const quantity = Number((item as any).harvest_quantity_kg || item.weight_after || 0);
            const price = Number(item.estimated_price || 0);
            const totalIncome = price * quantity;
            const userType = (item.user_type || '').toLowerCase() === 'large_scale' ? 'Large Scale' : 'Farmer Level';
            const batchId = item.batch_id || item._id;

            return (
              <View key={item._id} style={styles.historyCard}>
                <TouchableOpacity
                  style={styles.historyMain}
                  activeOpacity={0.85}
                  onPress={() => {
                    navigation.navigate('Report', {
                      batchData: {
                        batchId,
                        qualityLevel: quality,
                        standardGrade: grade,
                        price: item.estimated_price,
                        district: item.district,
                        date: item.harvest_date || item.created_at,
                        harvestQuantityKg: item.harvest_quantity_kg,
                        estimatedTotalIncome: item.estimated_total_income,
                        inputs: {
                          weightBefore: item.weight_before,
                          weightAfter: item.weight_after,
                          temperature: item.temperature,
                          dryingDays: item.drying_days,
                          cinnamonColor: item.color,
                          visualMould: item.visual_mould,
                          moisture: item.moisture_percentage,
                          moistureMode: item.farmer_moisture_mode,
                          diameter: item.diameter_mm,
                          harvestQuantityKg: item.harvest_quantity_kg,
                          temperatureReadings: item.temperature_readings,
                        },
                        calculatedValues: {
                          estimated_moisture_percentage: item.estimated_moisture_percentage,
                          avg_temp_8am_c: item.avg_temp_8am_c,
                          avg_temp_12pm_c: item.avg_temp_12pm_c,
                          avg_temp_6pm_c: item.avg_temp_6pm_c,
                          overall_average_temperature_c: item.temperature,
                        },
                        markets: item.market_suggestions || undefined,
                        recommendedMarketplaces: item.market_suggestions?.map((m: any) => m.name) || [],
                        reason: item.reason || undefined,
                      },
                    });
                  }}
                >
                  <View style={styles.leftCol}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="workspace-premium" size={18} color="#2E7D32" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.topRow}>
                        <Text style={styles.dateText}>{dateLabel}</Text>
                        <View style={[styles.qualityTag, { backgroundColor: tag.bg }]}>
                          <Text style={[styles.qualityTagText, { color: tag.text }]}>{quality}</Text>
                        </View>
                      </View>
                      <Text style={styles.gradeText}>{grade}</Text>
                      <Text style={styles.metaText}>{item.district} District • {userType}</Text>
                      <Text style={styles.metaText}>{quantity} kg</Text>
                    </View>
                  </View>

                  <View style={styles.rightCol}>
                    <Text style={styles.priceText}>Rs. {price.toLocaleString(undefined, { maximumFractionDigits: 2 })} <Text style={styles.priceUnit}>/kg</Text></Text>
                    <Text style={styles.totalIncomeText}>Rs. {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                    <Text style={styles.totalIncomeLabel}>Total Income</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.actionButtonsCol}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.viewBtn]}
                    onPress={() => {
                      navigation.navigate('Report', {
                        batchData: {
                          batchId,
                          qualityLevel: quality,
                          standardGrade: grade,
                          price: item.estimated_price,
                          district: item.district,
                          date: item.harvest_date || item.created_at,
                          harvestQuantityKg: item.harvest_quantity_kg,
                          estimatedTotalIncome: item.estimated_total_income,
                          inputs: {
                            weightBefore: item.weight_before,
                            weightAfter: item.weight_after,
                            temperature: item.temperature,
                            dryingDays: item.drying_days,
                            cinnamonColor: item.color,
                            visualMould: item.visual_mould,
                            moisture: item.moisture_percentage,
                            moistureMode: item.farmer_moisture_mode,
                            diameter: item.diameter_mm,
                            harvestQuantityKg: item.harvest_quantity_kg,
                            temperatureReadings: item.temperature_readings,
                          },
                          calculatedValues: {
                            estimated_moisture_percentage: item.estimated_moisture_percentage,
                            avg_temp_8am_c: item.avg_temp_8am_c,
                            avg_temp_12pm_c: item.avg_temp_12pm_c,
                            avg_temp_6pm_c: item.avg_temp_6pm_c,
                            overall_average_temperature_c: item.temperature,
                          },
                          markets: item.market_suggestions || undefined,
                          recommendedMarketplaces: item.market_suggestions?.map((m: any) => m.name) || [],
                          reason: item.reason || undefined,
                        },
                      });
                    }}
                  >
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={async () => {
                      try {
                        setDeletingId(item._id);
                        await deletePrediction(item._id);
                        setHistory((prev) => prev.filter((p) => p._id !== item._id));
                      } catch (e) {
                        console.error('Failed to delete prediction', e);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    <Text style={styles.deleteBtnText}>
                      {deletingId === item._id ? 'Deleting...' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

        <Text style={styles.swipeHint}>Swipe left on any item to delete</Text>
      </ScrollView>

      <AppBottomNav active="history" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F3' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEDED',
  },
  headerIcon: { width: 32, alignItems: 'center' },
  headerTitle: { color: '#000000', fontSize: 20, fontWeight: '700' },
  content: { padding: 14, paddingBottom: 16 },
  searchBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
    height: 48,
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, color: '#1E1E1E' },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  statDivider: { width: 1, backgroundColor: '#EDEDED' },
  statIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 14, fontWeight: '800', color: '#1B1B1B', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#6F6F6F', marginTop: 2, textAlign: 'center' },
  emptyText: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    color: '#616161',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  historyMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  leftCol: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rightCol: { alignItems: 'flex-end', marginLeft: 8 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E7F5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 8, flexWrap: 'wrap' },
  dateText: { fontSize: 11, color: '#757575' },
  qualityTag: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  qualityTagText: { fontSize: 10, fontWeight: '700' },
  gradeText: { fontSize: 23, fontWeight: '800', color: '#1D1D1D' },
  metaText: { fontSize: 14, color: '#5E5E5E', marginTop: 1 },
  priceText: { fontSize: 16, color: '#1E1E1E', fontWeight: '700' },
  priceUnit: { fontSize: 12, color: '#777' },
  totalIncomeText: { fontSize: 16, color: '#166D3A', fontWeight: '800', marginTop: 2 },
  totalIncomeLabel: { fontSize: 11, color: '#777' },
  actionButtonsCol: {
    gap: 6,
    marginLeft: 8,
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
  },
  viewBtn: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#CDE8D2',
  },
  viewBtnText: {
    color: '#2E7D32',
    fontSize: 12,
    fontWeight: '700',
  },
  deleteBtn: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F2C9CD',
  },
  deleteBtnText: {
    color: '#B23A48',
    fontSize: 12,
    fontWeight: '700',
  },
  swipeHint: { textAlign: 'center', color: '#7C7C7C', fontSize: 12, marginTop: 4, marginBottom: 6 },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  navItem: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 6 },
  navItemActive: { backgroundColor: '#0B5E2D', borderRadius: 12, paddingHorizontal: 20 },
  navLabel: { marginTop: 2, fontSize: 11, color: '#9E9E9E' },
  navLabelActive: { color: '#FFFFFF' },
});

