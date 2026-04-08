import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Report'>;
type ReportRouteProp = RouteProp<RootStackParamList, 'Report'>;

export default function Report() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ReportRouteProp>();
  const { batchData } = route.params ?? { batchData: null };

  // Prefer an explicit qualityLevel and standardGrade from navigation, fall back to legacy fields
  const rawQualityLevel =
    batchData?.qualityLevel || batchData?.quality || batchData?.grade || null;
  const standardGrade =
    batchData?.standardGrade || batchData?.standard_grade || null;

  const getQualityLabel = (quality: string | null) => {
    if (!quality) return '—';

    // If already a friendly label, return as-is
    if (
      quality === 'High Quality' ||
      quality === 'Medium Quality' ||
      quality === 'Low Quality'
    ) {
      return quality;
    }

    switch (quality) {
      case 'Premium':
        return 'Premium Quality';
      case 'Grade A':
        return 'High Quality';
      case 'Grade B':
        return 'Medium Quality';
      default:
        return quality;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    // If dateString is already formatted, return it
    if (dateString.includes(',')) return dateString;
    // Otherwise format it
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const handleDownloadPDF = () => {
    if (!batchData) {
      Alert.alert('Error', 'No report data available.');
      return;
    }

    const qualityLabel = getQualityLabel(rawQualityLevel);

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            .card { border: 1px solid #e5e5e5; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
            .title { font-weight: 700; color: #2E7D32; margin-bottom: 8px; }
            .row { display:flex; justify-content:space-between; margin: 6px 0; font-size: 13px; }
            .muted { color: #666; }
            .big { font-size: 22px; font-weight: 800; margin-top: 6px; }
            .pill { display:inline-block; padding:4px 10px; border-radius:999px; background:#E8F5E9; font-size:11px; font-weight:600; color:#2E7D32; }
            ul { margin: 8px 0 0 18px; padding: 0; }
            li { margin: 4px 0; }
            .info { background:#E8F5E9; border-radius:12px; padding:10px; margin-top:10px; font-size:12px; }
          </style>
        </head>
        <body>
          <h1>Harvest Report</h1>

          <div class="card">
            <div class="title">Batch Information</div>
            <div class="row"><span class="muted">Batch ID</span><span>${batchData.batchId ?? ''}</span></div>
            <div class="row"><span class="muted">District</span><span>${batchData.district ?? ''}</span></div>
            <div class="row"><span class="muted">Harvest Date</span><span>${formatDate(batchData.date ?? '')}</span></div>
          </div>

          <div class="card">
            <div class="title">Prediction Summary</div>
            <div class="row"><span class="muted">Quality Level</span><span>${qualityLabel}</span></div>
            <div class="row"><span class="muted">Standard Grade</span><span>${standardGrade ?? ''}</span></div>
            <div class="big">${batchData.price != null ? `${Number(batchData.price).toLocaleString()} LKR/kg` : '—'}</div>
            <div class="muted">Estimated price per kg</div>
          </div>

          <div class="card">
            <div class="title">Farmer Inputs</div>
            <div class="row"><span class="muted">Quality Level</span><span class="pill">${qualityLabel}</span></div>
            <div class="row"><span class="muted">Weight Before Drying</span><span>${batchData.inputs?.weightBefore ?? ''}</span></div>
            <div class="row"><span class="muted">Weight After Drying</span><span>${batchData.inputs?.weightAfter ?? ''}</span></div>
            <div class="row"><span class="muted">Drying Temperature</span><span>${batchData.inputs?.temperature ?? ''}</span></div>
            <div class="row"><span class="muted">Drying Days</span><span>${batchData.inputs?.dryingDays ?? ''}</span></div>
            <div class="row"><span class="muted">Color</span><span>${batchData.inputs?.cinnamonColor ?? ''}</span></div>
            <div class="row"><span class="muted">Breakage Level</span><span>${batchData.inputs?.breakageLevel ?? ''}</span></div>
            <div class="row"><span class="muted">Roll Tightness</span><span>${batchData.inputs?.rollTightness ?? ''}</span></div>
            <div class="row"><span class="muted">Aroma Strength</span><span>${batchData.inputs?.aromaStrength ?? ''}</span></div>
          </div>

          <div class="card">
            <div class="title">Market Suggestions</div>
            <ul>
              ${
                (batchData.markets && Array.isArray(batchData.markets)
                  ? batchData.markets
                  : [
                      { name: 'Galle Local Cinnamon Market' },
                      { name: 'Southern Regional Wholesale Market' },
                      { name: 'Matara Cinnamon Traders' },
                    ]
                )
                  .map((m: any) => `<li>${m.name}${m.description ? ' - ' + m.description : ''}</li>`)
                  .join('')
              }
            </ul>
          </div>

          <div class="info">
            ${batchData.reason
              ? batchData.reason
              : 'This report provides an estimated market value and suggested selling locations based on model predictions.'}
          </div>
        </body>
      </html>
    `;

    (async () => {
      try {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Download PDF Report',
        });
      } catch (e) {
        console.error('PDF generation failed:', e);
        Alert.alert('Error', 'Failed to generate PDF.');
      }
    })();
  };

  const handleShareReport = () => {
    handleDownloadPDF();
  };

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
        <Text style={styles.headerTitle}>Harvest Report</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Report Card */}
        <View style={styles.reportCard}>
          {/* Report Icon */}
          <View style={styles.iconCircle}>
            <MaterialIcons name="assignment" size={40} color="#2E7D32" />
          </View>

          {/* Batch Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Batch Information</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.row}>
                <Text style={styles.label}>Batch ID:</Text>
                <Text style={styles.value}>{batchData?.batchId ?? '#2048'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>District:</Text>
                <Text style={styles.value}>{batchData?.district ?? '—'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Harvest Date:</Text>
                <Text style={styles.value}>
                  {formatDate(batchData?.date ?? new Date().toISOString())}
                </Text>
              </View>
            </View>
          </View>

          {/* Farmer Inputs */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Farmer Inputs</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.inputsHeaderRow}>
                <Text style={styles.inputsHeaderLabel}>Quality Level:</Text>
                <View style={styles.qualityPill}>
                  <Text style={styles.qualityPillText}>
                    {getQualityLabel(rawQualityLevel)}
                  </Text>
                </View>
              </View>
              <View style={styles.inputsGrid}>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Weight Before Drying</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.weightBefore
                      ? `${batchData.inputs.weightBefore.toLocaleString()} g`
                      : '—'}
                  </Text>
                  <Text style={styles.inputLabel}>Drying Temperature</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.temperature
                      ? `${batchData.inputs.temperature.toFixed(1)}°C`
                      : '—'}
                  </Text>
                  <Text style={styles.inputLabel}>Color</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.cinnamonColor ?? '—'}
                  </Text>
                  <Text style={styles.inputLabel}>Roll Tightness</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.rollTightness ?? '—'}
                  </Text>
                </View>
                <View style={styles.inputCol}>
                  <Text style={styles.inputLabel}>Weight After Drying</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.weightAfter
                      ? `${batchData.inputs.weightAfter.toLocaleString()} g`
                      : '—'}
                  </Text>
                  <Text style={styles.inputLabel}>Drying Days</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.dryingDays
                      ? `${batchData.inputs.dryingDays} days`
                      : '—'}
                  </Text>
                  <Text style={styles.inputLabel}>Breakage Level</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.breakageLevel ?? '—'}
                  </Text>
                  <Text style={styles.inputLabel}>Aroma Strength</Text>
                  <Text style={styles.inputValue}>
                    {batchData?.inputs?.aromaStrength ?? '—'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Prediction Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Prediction Summary</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Quality Level:</Text>
                <Text style={styles.value}>{getQualityLabel(rawQualityLevel)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.label}>Price:</Text>
                <Text style={styles.summaryPrice}>
                  {batchData?.price
                    ? `${batchData.price.toLocaleString()} LKR/kg`
                    : '—'}
                </Text>
              </View>
            </View>
          </View>

          {/* Market Suggestions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>Market Suggestions</Text>
            </View>
            <View style={styles.sectionBody}>
              {(batchData?.markets && Array.isArray(batchData.markets)
                ? batchData.markets
                : [
                    { name: 'Galle Local Cinnamon Market' },
                    { name: 'Southern Regional Wholesale Market' },
                    { name: 'Matara Cinnamon Traders' },
                  ]
              ).map((m: any) => (
                <View key={m.name} style={styles.marketRow}>
                  <View style={styles.marketIconCircle}>
                    <MaterialIcons
                      name="place"
                      size={16}
                      color="#2E7D32"
                    />
                  </View>
                  <Text style={styles.marketText}>{m.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Info note */}
          <View style={styles.infoCard}>
            <View style={styles.infoIconCircle}>
              <MaterialIcons
                name="info-outline"
                size={18}
                color="#2E7D32"
              />
            </View>
            <Text style={styles.infoText}>
              This report provides an estimated market value and suggested
              selling locations based on model predictions.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.downloadPDFButton}
          onPress={handleDownloadPDF}
          activeOpacity={0.85}
        >
          <MaterialIcons name="picture-as-pdf" size={24} color="#FFFFFF" />
          <Text style={styles.downloadPDFButtonText}>Download PDF</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShareReport}
          activeOpacity={0.85}
        >
          <MaterialIcons name="share" size={24} color="#000000" />
          <Text style={styles.shareButtonText}>Share Report</Text>
        </TouchableOpacity>
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
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5E9',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  section: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  sectionHeader: {
    backgroundColor: '#E5F4E8',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E7D32',
  },
  sectionBody: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    color: '#666666',
  },
  value: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
  },
  inputsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputsHeaderLabel: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '500',
  },
  qualityPill: {
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  qualityPillText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  inputsGrid: {
    flexDirection: 'row',
    marginTop: 4,
  },
  inputCol: {
    flex: 1,
    marginRight: 12,
  },
  inputLabel: {
    fontSize: 12,
    color: '#888888',
  },
  inputValue: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  marketIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  marketText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '500',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
  },
  downloadPDFButton: {
    backgroundColor: '#27ae60',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    gap: 12,
  },
  downloadPDFButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  shareButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  shareButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
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

