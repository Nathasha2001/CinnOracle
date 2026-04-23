import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getPredictions, type PredictionRecord } from '../src/api/client';
import AppBottomNav from '../components/AppBottomNav';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Report'>;
type ReportRouteProp = RouteProp<RootStackParamList, 'Report'>;

const mapGradeToQuality = (grade?: string | null): string => {
  const g = (grade || '').trim().toUpperCase();
  if (g === 'ALBA' || g === 'C5 SPECIAL' || g === 'C5') return 'High Quality';
  if (g === 'C4' || g === 'H1') return 'Medium Quality';
  return 'Low Quality';
};

export default function Report() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReportRouteProp>();
  const { batchData } = route.params ?? { batchData: null };
  const [predictions, setPredictions] = useState<PredictionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  // Fetch all predictions from backend on component mount
  useEffect(() => {
    fetchPredictionHistory();
  }, []);

  const fetchPredictionHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getPredictions(100, 0);
      setPredictions(response.predictions);
    } catch (err) {
      console.error('Failed to fetch predictions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const grade = batchData?.standardGrade || batchData?.quality || 'C5';
  const quality = batchData?.qualityLevel || mapGradeToQuality(grade);
  const district = batchData?.district || 'Galle District';
  const userType = batchData?.inputs?.moistureMode === 'moisture_tool' ? 'Large Scale' : 'Farmer Level';
  const pricePerKg = Number(batchData?.price || 0);
  const harvestQty = Number(batchData?.inputs?.harvestQuantityKg || batchData?.inputs?.weightAfter || 0);
  const totalIncome = Number(batchData?.estimatedTotalIncome || pricePerKg * harvestQty || 0);
  const batchId = batchData?.batchId || `#PRD-${new Date().getFullYear()}-00024`;
  const calculated = batchData?.calculatedValues || {};
  const markets = (batchData?.markets || batchData?.recommendedMarketplaces || []).map((m: any) =>
    typeof m === 'string' ? { name: m, description: '' } : m
  );
  const dateStr = batchData?.date
    ? new Date(batchData.date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    : new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const createHtml = () => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>CinnOracle Prediction Report</title>
    <style>
      @page {
        size: letter;
        margin: 0.5in;
      }
      @media print {
        body { 
          margin: 0;
          padding: 0;
          background: white;
        }
        .container {
          max-width: 100%;
          padding: 0.5in;
          box-shadow: none;
        }
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
        background: white;
        padding: 0;
        color: #333;
        line-height: 1.6;
        width: 100%;
      }
      .container {
        width: 100%;
        background: white;
        padding: 0.5in;
      }
      .header {
        text-align: center;
        margin-bottom: 40px;
        border-bottom: 3px solid #0B5E2D;
        padding-bottom: 25px;
      }
      .logo-text {
        font-size: 44px;
        font-weight: 900;
        color: #0B5E2D;
        margin-bottom: 5px;
        letter-spacing: 2px;
      }
      .report-title {
        font-size: 32px;
        font-weight: 700;
        color: #1a1a1a;
        margin-top: 15px;
      }
      .report-subtitle {
        font-size: 16px;
        color: #666;
        margin-top: 10px;
      }
      
      .section {
        margin-bottom: 35px;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 22px;
        font-weight: 700;
        color: #0B5E2D;
        margin-bottom: 18px;
        padding-bottom: 12px;
        border-bottom: 2px solid #0B5E2D;
      }
      
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 25px;
        margin-bottom: 20px;
      }
      
      .highlight-box {
        background: linear-gradient(135deg, #0B5E2D 0%, #1a7d3a 100%);
        color: white;
        padding: 30px;
        border-radius: 8px;
        margin-bottom: 20px;
      }
      
      .highlight-box .label {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .highlight-box .value {
        font-size: 40px;
        font-weight: 900;
        letter-spacing: 1px;
      }
      
      .info-box {
        background: #f9f9f9;
        border-left: 4px solid #0B5E2D;
        padding: 20px 25px;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      
      .info-row {
        display: grid;
        grid-template-columns: 35% 65%;
        margin-bottom: 15px;
        font-size: 15px;
      }
      
      .info-row:last-child {
        margin-bottom: 0;
      }
      
      .info-label {
        font-weight: 600;
        color: #0B5E2D;
      }
      
      .info-value {
        color: #333;
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
      }
      
      .stat-card {
        background: #e8f5e9;
        border: 2px solid #c8e6c9;
        padding: 25px;
        border-radius: 8px;
        text-align: center;
      }
      
      .stat-card .label {
        font-size: 13px;
        color: #4c6f55;
        margin-bottom: 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      }
      
      .stat-card .value {
        font-size: 28px;
        font-weight: 800;
        color: #0B5E2D;
      }
      
      .marketplace-list {
        list-style: none;
      }
      
      .marketplace-list li {
        padding: 14px 16px;
        background: #f9f9f9;
        margin-bottom: 12px;
        border-radius: 4px;
        border-left: 4px solid #0B5E2D;
        font-size: 15px;
      }
      
      .marketplace-list li:before {
        content: "🏪 ";
        margin-right: 10px;
      }
      
      .footer {
        margin-top: 45px;
        padding-top: 25px;
        border-top: 2px solid #e0e0e0;
        text-align: center;
        font-size: 13px;
        color: #999;
      }
      
      .timestamp {
        color: #666;
        font-size: 14px;
        margin-bottom: 20px;
      }
      
      .quality-badge {
        display: inline-block;
        background: #0B5E2D;
        color: white;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        margin-left: 15px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo-text">CinnOracle</div>
        <div class="report-title">PREDICTION REPORT</div>
        <div class="report-subtitle">Cinnamon Quality & Price Analysis</div>
        <div class="timestamp">Generated on ${dateStr}</div>
      </div>

      <!-- Prediction Summary Section -->
      <div class="section">
        <div class="highlight-box">
          <div class="label">Predicted Grade</div>
          <div class="value">${grade} <span class="quality-badge">${quality}</span></div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="section">
        <div class="section-title">Financial Summary</div>
        <div class="grid-2">
          <div class="stat-card">
            <div class="label">Price per Kg</div>
            <div class="value">Rs. ${pricePerKg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
          <div class="stat-card">
            <div class="label">Estimated Total Income</div>
            <div class="value">Rs. ${totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
          </div>
        </div>
      </div>

      <!-- Prediction Details -->
      <div class="section">
        <div class="section-title">Prediction Details</div>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Prediction ID:</span>
            <span class="info-value">${batchId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">District:</span>
            <span class="info-value">${district}</span>
          </div>
          <div class="info-row">
            <span class="info-label">User Type:</span>
            <span class="info-value">${userType}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Harvest Quantity:</span>
            <span class="info-value">${harvestQty} kg</span>
          </div>
        </div>
      </div>

      <!-- Input Parameters -->
      <div class="section">
        <div class="section-title">Harvest Parameters</div>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Diameter:</span>
            <span class="info-value">${batchData?.inputs?.diameter ?? '—'} mm</span>
          </div>
          <div class="info-row">
            <span class="info-label">Drying Days:</span>
            <span class="info-value">${batchData?.inputs?.dryingDays ?? '—'} days</span>
          </div>
          <div class="info-row">
            <span class="info-label">Cinnamon Color:</span>
            <span class="info-value">${batchData?.inputs?.cinnamonColor ?? '—'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Visual Mould:</span>
            <span class="info-value">${batchData?.inputs?.visualMould ?? '—'}</span>
          </div>
        </div>
      </div>

      <!-- Calculated Environmental Data -->
      <div class="section">
        <div class="section-title">Environmental Data Analysis</div>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Estimated Moisture:</span>
            <span class="info-value">${calculated.estimated_moisture_percentage ?? 'N/A'} %</span>
          </div>
          <div class="info-row">
            <span class="info-label">Temperature (8 AM):</span>
            <span class="info-value">${calculated.avg_temp_8am_c ?? '—'} °C</span>
          </div>
          <div class="info-row">
            <span class="info-label">Temperature (12 PM):</span>
            <span class="info-value">${calculated.avg_temp_12pm_c ?? '—'} °C</span>
          </div>
          <div class="info-row">
            <span class="info-label">Temperature (6 PM):</span>
            <span class="info-value">${calculated.avg_temp_6pm_c ?? '—'} °C</span>
          </div>
          <div class="info-row">
            <span class="info-label">Overall Average Temperature:</span>
            <span class="info-value">${calculated.overall_average_temperature_c ?? '—'} °C</span>
          </div>
        </div>
      </div>

      <!-- Recommended Marketplaces -->
      <div class="section">
        <div class="section-title">Recommended Marketplaces</div>
        <ul class="marketplace-list">
          ${(markets.length ? markets : [{ name: 'Galle Cinnamon Market', description: '' }])
            .map((m: any) => `<li>${m.name}${m.description ? ` - ${m.description}` : ''}</li>`)
            .join('')}
        </ul>
      </div>

      <!-- Footer -->
      <div class="footer">
        <p style="margin-bottom: 10px;"><strong>Disclaimer:</strong> This prediction is generated based on provided input values and AI model estimates. Actual market prices may vary based on current market conditions, quality verification, and buyer preferences.</p>
        <p>© 2026 CinnOracle. All rights reserved.</p>
      </div>
    </div>
  </body>
  </html>`;

  const handleDownloadReport = async () => {
    if (!batchData) {
      Alert.alert('Error', 'No report data available.');
      return;
    }

    try {
      const { uri } = await Print.printToFileAsync({ html: createHtml(), base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Download Report',
      });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to generate report.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B5E2D" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Prediction Details</Text>
        <TouchableOpacity onPress={handleDownloadReport}>
          <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'current' && styles.tabActive]}
          onPress={() => setActiveTab('current')}
        >
          <Text style={[styles.tabText, activeTab === 'current' && styles.tabTextActive]}>Current Report</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
            All Predictions ({predictions.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'current' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
          <View style={styles.topGradeRow}>
            <View style={styles.gradeIcon}><MaterialIcons name="workspace-premium" size={18} color="#2E7D32" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Predicted Grade</Text>
              <View style={styles.gradeRow}>
                <Text style={styles.gradeText}>{grade}</Text>
                <View style={styles.qualityPill}><Text style={styles.qualityPillText}>{quality}</Text></View>
              </View>
            </View>
          </View>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Prediction ID</Text><Text style={styles.metaValue}>{batchId}</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>District</Text><Text style={styles.metaValue}>{district}</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Date & Time</Text><Text style={styles.metaValue}>{dateStr}</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>Harvest Quantity</Text><Text style={styles.metaValue}>{harvestQty} kg</Text></View>
            <View style={styles.metaItem}><Text style={styles.metaLabel}>User Type</Text><Text style={styles.metaValue}>{userType}</Text></View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Predicted Price (per kg)</Text>
              <Text style={styles.statValue}>Rs. {pricePerKg.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Estimated Total Income</Text>
              <Text style={styles.statValue}>Rs. {totalIncome.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Calculated Values</Text>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Estimated Moisture Percentage</Text><Text style={styles.dataValue}>{calculated.estimated_moisture_percentage ?? 'N/A'} %</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Average Temperature (8 AM)</Text><Text style={styles.dataValue}>{calculated.avg_temp_8am_c ?? '—'} °C</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Average Temperature (12 PM)</Text><Text style={styles.dataValue}>{calculated.avg_temp_12pm_c ?? '—'} °C</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Average Temperature (6 PM)</Text><Text style={styles.dataValue}>{calculated.avg_temp_6pm_c ?? '—'} °C</Text></View>
          <View style={[styles.dataRow, styles.noBorder]}><Text style={styles.dataLabel}>Overall Average Temperature</Text><Text style={styles.dataValue}>{calculated.overall_average_temperature_c ?? '—'} °C</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Input Summary</Text>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Diameter</Text><Text style={styles.dataValue}>{batchData?.inputs?.diameter ?? '—'} mm</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Drying Days</Text><Text style={styles.dataValue}>{batchData?.inputs?.dryingDays ?? '—'} Days</Text></View>
          <View style={styles.dataRow}><Text style={styles.dataLabel}>Color</Text><Text style={styles.dataValue}>{batchData?.inputs?.cinnamonColor ?? '—'}</Text></View>
          <View style={[styles.dataRow, styles.noBorder]}><Text style={styles.dataLabel}>Visual Mould</Text><Text style={styles.dataValue}>{batchData?.inputs?.visualMould ?? '—'}</Text></View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Recommended Marketplaces</Text>
          {(markets.length ? markets : [{ name: 'Galle Cinnamon Market', description: 'Local Market' }]).map((m: any) => (
            <View key={m.name} style={styles.marketRow}>
              <MaterialIcons name="storefront" size={16} color="#2E7D32" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.marketName}>{m.name}</Text>
                {!!m.description && <Text style={styles.marketDesc}>{m.description}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E9E9E" />
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadReport}>
          <Ionicons name="download-outline" size={18} color="#FFFFFF" />
          <Text style={styles.downloadText}>Download Report</Text>
        </TouchableOpacity>
      </ScrollView>
      )}

      {activeTab === 'history' && (
        <View style={styles.historyContainer}>
          {loading ? (
            <View style={styles.centerContent}>
              <ActivityIndicator size="large" color="#0B5E2D" />
              <Text style={styles.loadingText}>Loading predictions...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerContent}>
              <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchPredictionHistory}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : predictions.length === 0 ? (
            <View style={styles.centerContent}>
              <Ionicons name="folder-open-outline" size={48} color="#999" />
              <Text style={styles.emptyText}>No predictions saved yet</Text>
            </View>
          ) : (
            <FlatList
              data={predictions}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.predictionCard}>
                  <View style={styles.predictionHeader}>
                    <View>
                      <Text style={styles.predictionGrade}>{item.predicted_quality}</Text>
                      <Text style={styles.predictionDate}>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.predictionBadge}>
                      <Text style={styles.predictionBadgeText}>{item.quality_level}</Text>
                    </View>
                  </View>

                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Batch ID</Text>
                    <Text style={styles.predictionValue}>{item.batch_id}</Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>District</Text>
                    <Text style={styles.predictionValue}>{item.district}</Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Harvest Quantity</Text>
                    <Text style={styles.predictionValue}>{item.harvest_quantity_kg} kg</Text>
                  </View>
                  <View style={styles.predictionRow}>
                    <Text style={styles.predictionLabel}>Price per kg</Text>
                    <Text style={styles.predictionValue}>Rs. {item.estimated_price?.toLocaleString()}</Text>
                  </View>
                  <View style={[styles.predictionRow, styles.noBorder]}>
                    <Text style={styles.predictionLabel}>Total Income</Text>
                    <Text style={styles.predictionValueBold}>Rs. {(item.harvest_quantity_kg * (item.estimated_price || 0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                  </View>
                </View>
              )}
              scrollEnabled={true}
            />
          )}
        </View>
      )}
      <AppBottomNav active="history" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F3' },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#0B5E2D',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#757575',
  },
  tabTextActive: {
    color: '#0B5E2D',
    fontWeight: '700',
  },
  historyContainer: {
    flex: 1,
    backgroundColor: '#F2F4F3',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#E74C3C',
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0B5E2D',
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  predictionGrade: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B5E2D',
  },
  predictionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  predictionBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  predictionBadgeText: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  predictionLabel: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  predictionValue: {
    fontSize: 12,
    color: '#1E1E1E',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  predictionValueBold: {
    fontSize: 13,
    color: '#0B5E2D',
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  header: {
    backgroundColor: '#0B5E2D',
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700' },
  content: { padding: 12, paddingBottom: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    padding: 12,
    marginBottom: 10,
  },
  topGradeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  gradeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  label: { fontSize: 12, color: '#666' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradeText: { fontSize: 33, fontWeight: '800', color: '#1E1E1E' },
  qualityPill: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  qualityPillText: { color: '#2E7D32', fontSize: 11, fontWeight: '700' },
  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  metaItem: { width: '50%', marginBottom: 8 },
  metaLabel: { fontSize: 11, color: '#757575' },
  metaValue: { fontSize: 12, color: '#1E1E1E', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, backgroundColor: '#F6FAF7', borderRadius: 8, borderWidth: 1, borderColor: '#E1ECE3', padding: 10 },
  statTitle: { fontSize: 11, color: '#4C6F55', marginBottom: 4 },
  statValue: { fontSize: 20, color: '#0B5E2D', fontWeight: '800' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#222', marginBottom: 6 },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  noBorder: { borderBottomWidth: 0 },
  dataLabel: { fontSize: 13, color: '#424242', flex: 1, paddingRight: 8 },
  dataValue: { fontSize: 13, color: '#1E1E1E', fontWeight: '600' },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    paddingVertical: 8,
  },
  marketName: { fontSize: 13, color: '#1E1E1E', fontWeight: '600' },
  marketDesc: { fontSize: 11, color: '#7A7A7A', marginTop: 2 },
  downloadButton: {
    backgroundColor: '#0B7A33',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
    marginBottom: 12,
  },
  downloadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});

