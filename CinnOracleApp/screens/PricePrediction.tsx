import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import {
  predictPrice,
  PriceInput,
  PricePredictionResponse,
  getGrades,
} from '../src/api/client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'PricePrediction'>;
type PricePredictionRouteProp = RouteProp<RootStackParamList, 'PricePrediction'>;

// Map cinnamon standard grades to quality levels,
// consistent with the CinnOracleMain page.
const mapGradeToQuality = (grade?: string | null): string => {
  if (!grade) return 'Unknown';
  const g = grade.trim().toUpperCase();

  // High quality: Alba, C5 Special, C5
  if (g === 'ALBA' || g === 'C5 SPECIAL' || g === 'C5') {
    return 'High Quality';
  }

  // Medium quality: C4, H1
  if (g === 'C4' || g === 'H1') {
    return 'Medium Quality';
  }

  // Low quality: H2, HEEN, GOROSU (and anything else not explicitly mapped)
  if (g === 'H2' || g === 'HEEN' || g === 'GOROSU') {
    return 'Low Quality';
  }

  return 'Low Quality';
};

// Available districts from the price prediction dataset
const AVAILABLE_DISTRICTS = [
  'Badulla',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Kalutara',
  'Kurunegala',
  'Matara',
  'Monaragala',
  'Ratnapura',
];

export default function PricePrediction() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<PricePredictionRouteProp>();
  const { result } = route.params ?? { result: null };

  // user-provided selling details
  const [districtInput, setDistrictInput] = useState<string>('');
  const [harvestDateInput, setHarvestDateInput] = useState<string>('');
  const [qualityInput, setQualityInput] = useState<string>('');
  const [gradeInput, setGradeInput] = useState<string>('');
  const [hasEstimated, setHasEstimated] = useState(false);
  const [estimatedPrice, setEstimatedPrice] = useState<number | null>(null);

  // District dropdown modal
  const [showDistrictModal, setShowDistrictModal] = useState(false);

  // Date picker modal
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Initialize inputs from result data
  useEffect(() => {
    if (result) {
      const calculatedQualityLevel = mapGradeToQuality(result.standardGrade);

      setDistrictInput(result.district || 'Galle');
      setGradeInput(result.standardGrade || '');
      setQualityInput(calculatedQualityLevel);
      setHarvestDateInput(
        result.harvestDate
          ? new Date(result.harvestDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    }
  }, [result]);

  // Call price API when user inputs or quality results change
  useEffect(() => {
    // Price API will be called manually when Estimate Price button is clicked
    // This useEffect is kept for future use if needed
  }, [gradeInput, districtInput, result?.weight_loss_percent]);

  const standardGrade = result?.standardGrade ?? 'C5';
  const qualityLevel = mapGradeToQuality(standardGrade);

  const district = districtInput || result?.district || 'Galle';

  const harvestDateLabel =
    harvestDateInput ||
    (result?.harvestDate
      ? new Date(result.harvestDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]);

  // determine which quality level to use for suggestions (user input overrides result)
  const effectiveQualityLevel = qualityInput || qualityLevel;

  const getReasonAndMarkets = () => {
    if (effectiveQualityLevel === 'High Quality') {
      return {
        reason:
          'High-quality cinnamon usually gets better prices in export and auction markets.',
        markets: [
          {
            name: 'Galle Local Cinnamon Market',
            description: 'Good for high-quality cinnamon sales',
          },
          {
            name: 'Southern Regional Wholesale Market',
            description: 'Suitable for export-grade cinnamon and bulk buyers',
          },
          {
            name: 'Matara Cinnamon Traders',
            description: 'Can offer better prices for premium grades',
          },
        ],
      };
    }

    if (effectiveQualityLevel === 'Medium Quality') {
      return {
        reason:
          'Medium-quality cinnamon is suitable for local and regional wholesale markets.',
        markets: [
          {
            name: 'Galle Local Cinnamon Market',
            description: 'Stable demand for medium-grade cinnamon',
          },
          {
            name: 'Southern Regional Wholesale Market',
            description: 'Good for regional buyers and wholesalers',
          },
          {
            name: 'Matara Cinnamon Traders',
            description: 'Suitable for blended and everyday products',
          },
        ],
      };
    }

    return {
      reason:
        'Lower-quality cinnamon is commonly sold to processing and powder buyers.',
      markets: [
        {
          name: 'Galle Local Cinnamon Market',
          description: 'Standard prices for lower-grade cinnamon',
        },
        {
          name: 'Southern Regional Wholesale Market',
          description: 'Buyers for cinnamon powder and industrial uses',
        },
        {
          name: 'Matara Cinnamon Traders',
          description: 'Often purchase lower grades for processing',
        },
      ],
    };
  };

  const [markets, setMarkets] = useState<{ name: string; description: string }[]>([]);
  const [reason, setReason] = useState<string>('');

  const handleEstimatePrice = async () => {
    if (!districtInput || !harvestDateInput) {
      console.log('Please enter district and harvest date before estimating.');
      return;
    }

    try {
      const payload: PriceInput = {
        quality_grade: gradeInput || result?.standardGrade || 'C5',
        district: districtInput,
        weight_loss_percent: result?.weight_loss_percent,
        harvest_date: harvestDateInput,
        quality_level: mapGradeToQuality(gradeInput || result?.standardGrade || 'C5'),
        standard_grade: standardGrade,
        weight_before: result?.inputs?.weightBefore,
        weight_after: result?.inputs?.weightAfter,
        temperature: result?.inputs?.temperature,
        batch_id: result?.batchId,
      };
      const response: PricePredictionResponse = await predictPrice(payload);
      setEstimatedPrice(response.price);
      if (response.market_suggestions) {
        setMarkets(response.market_suggestions);
      } else {
        const fallback = getReasonAndMarkets();
        setMarkets(fallback.markets);
      }
      if (response.reason) {
        setReason(response.reason);
      } else {
        setReason(getReasonAndMarkets().reason);
      }
      setHasEstimated(true);
    } catch (error) {
      console.error('Price prediction failed:', error);
      setEstimatedPrice(null);
      setHasEstimated(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Harvest Result</Text>
        <TouchableOpacity
          style={styles.headerIcon}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="close" size={24} color="#000000" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Analysis Completed Card */}
        <View style={styles.analysisCard}>
          <Text style={styles.analysisTitle}>Quality comes first</Text>
          <Text style={styles.analysisSubtitle}>
            Your analysis result is ready. Now add district and harvest date to
            estimate the current cinnamon market price.
          </Text>

          <View style={styles.analysisQualityRow}>
            <View style={styles.analysisField}>
              <Text style={styles.analysisFieldLabel}>Quality level</Text>
              <View style={styles.analysisFieldBox}>
                <Text style={styles.analysisFieldValue}>{qualityLevel}</Text>
              </View>
            </View>
            <View style={styles.analysisField}>
              <Text style={styles.analysisFieldLabel}>Standard grade</Text>
              <View style={styles.analysisFieldBox}>
                <Text style={styles.analysisFieldValue}>{standardGrade}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Selling Details */}
        <View style={styles.sellingCard}>
          <Text style={styles.sellingTitle}>Selling details</Text>

          <View style={styles.sellingField}>
            <Text style={styles.sellingLabel}>District</Text>
            <View style={styles.sellingFieldInputWrapper}>
              <TouchableOpacity
                style={[styles.sellingInputBox, styles.dropdownContainer]}
                onPress={() => setShowDistrictModal(true)}
              >
                <Text
                  style={[
                    styles.dropdownText,
                    { color: districtInput ? '#000000' : '#BDBDBD' },
                  ]}
                >
                  {districtInput || 'Select district'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sellingField}>
            <Text style={styles.sellingLabel}>Harvest date</Text>
            <TouchableOpacity
              style={[styles.sellingInputBox, styles.dropdownContainer]}
              onPress={() => {
                // Initialize selected date with current harvest date or today
                const initialDate = harvestDateInput
                  ? new Date(harvestDateInput + 'T00:00:00')
                  : new Date();
                setSelectedDate(initialDate);
                setDatePickerVisible(true);
              }}
            >
              <Text style={[styles.dropdownText, { color: harvestDateInput ? '#000000' : '#BDBDBD' }]}>
                {harvestDateInput || 'Select date'}
              </Text>
              <MaterialIcons name="calendar-today" size={20} color="#666666" />
            </TouchableOpacity>
          </View>

          <View style={styles.sellingField}>
            <Text style={styles.sellingLabel}>Quality level</Text>
            <TextInput
              style={styles.sellingInputBox}
              value={qualityInput}
              onChangeText={setQualityInput}
              placeholder="High/Medium/Low Quality"
              placeholderTextColor="#BDBDBD"
            />
          </View>

          <View style={styles.sellingField}>
            <Text style={styles.sellingLabel}>Standard grade</Text>
            <TextInput
              style={styles.sellingInputBox}
              value={gradeInput}
              onChangeText={setGradeInput}
              placeholder="C5, C4, H2, etc."
              placeholderTextColor="#BDBDBD"
            />
          </View>
        </View>

        {/* Estimate Price Button */}
        <TouchableOpacity
          style={styles.estimateButton}
          onPress={handleEstimatePrice}
        >
          <Text style={styles.estimateButtonText}>Estimate Price</Text>
        </TouchableOpacity>

        {hasEstimated && (
          <>
            {/* Estimated Result */}
            <View style={styles.estimatedSection}>
              <Text style={styles.estimatedTitle}>Estimated result</Text>
              <View style={styles.estimatedCard}>
                <View style={styles.estimatedTopRow}>
                  <View style={styles.qualityPill}>
                    <Text style={styles.qualityPillText}>{qualityLevel}</Text>
                  </View>
                  <Text style={styles.estimatedGradeText}>
                    Standard grade: {standardGrade}
                  </Text>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceValue}>
                    {estimatedPrice != null
                      ? `${estimatedPrice.toLocaleString()} LKR`
                      : '—'}
                  </Text>
                  <Text style={styles.priceLabel}>Estimated price per kg</Text>
                </View>
              </View>
            </View>

            {/* Marketplace Suggestions */}
            <View style={styles.marketSection}>
              <Text style={styles.marketTitle}>Marketplace Suggestions</Text>

              <View style={styles.marketList}>
                {markets.map((m) => (
                  <View key={m.name} style={styles.marketRow}>
                    <View style={styles.marketIconCircle}>
                      <MaterialIcons name="place" size={16} color="#2E7D32" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.marketText}>{m.name}</Text>
                      <Text style={styles.marketSubText}>{m.description}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoIconCircle}>
                  <MaterialIcons name="info-outline" size={16} color="#2E7D32" />
                </View>
                <Text style={styles.infoText}>{reason}</Text>
              </View>
            </View>
          </>
        )}

        {/* Grade Guide Shortcut */}
        <TouchableOpacity
          style={styles.gradeGuideLink}
          onPress={() => navigation.navigate('GradeGuide')}
        >
          <Text style={styles.gradeGuideText}>View Grade Guide</Text>
          <MaterialIcons name="chevron-right" size={18} color="#2E7D32" />
        </TouchableOpacity>

        {/* Action Buttons */}
        {hasEstimated && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryAction]}
              onPress={() => {
                if (!result || estimatedPrice == null) return;
                navigation.navigate('Report', {
                  batchData: {
                    batchId: result.batchId,
                    // quality information
                    qualityLevel: effectiveQualityLevel,
                    standardGrade,
                    // price and selling context
                    price: estimatedPrice,
                    district,
                    date:
                      harvestDateInput ||
                      result.harvestDate ||
                      new Date().toISOString(),
                    // original farmer inputs from NewAnalysis
                    inputs: result.inputs,
                    // marketplace suggestions and reasoning from prediction
                    markets,
                    reason,
                  },
                });
              }}
            >
              <MaterialIcons name="description" size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Generate Report</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryAction]}
              onPress={() => navigation.navigate('SavedSuccess')}
            >
              <MaterialIcons name="save" size={20} color="#2E7D32" />
              <Text style={styles.secondaryActionText}>Save to History</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        {/* Kept after estimate for future expansion if needed */}
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Harvest Date</Text>
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              {/* Year Selection */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(newDate.getFullYear() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{selectedDate.getFullYear()}</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(newDate.getFullYear() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Month Selection */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>
                    {selectedDate.toLocaleString('default', { month: 'long' })}
                  </Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Day Selection */}
              <View style={styles.datePickerSection}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() - 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialIcons name="chevron-left" size={24} color="#666666" />
                  </TouchableOpacity>
                  <Text style={styles.datePickerValue}>{selectedDate.getDate()}</Text>
                  <TouchableOpacity
                    style={styles.datePickerButton}
                    onPress={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setDate(newDate.getDate() + 1);
                      setSelectedDate(newDate);
                    }}
                  >
                    <MaterialIcons name="chevron-right" size={24} color="#666666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={[styles.datePickerActionButton, styles.cancelButton]}
                onPress={() => setDatePickerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerActionButton, styles.confirmButton]}
                onPress={() => {
                  // Format date in local time to avoid timezone shifting
                  const year = selectedDate.getFullYear();
                  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(selectedDate.getDate()).padStart(2, '0');
                  const formattedDate = `${year}-${month}-${day}`;
                  setHarvestDateInput(formattedDate);
                  setDatePickerVisible(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* District Selection Modal */}
      <Modal
        visible={showDistrictModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDistrictModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select District</Text>
              <TouchableOpacity
                onPress={() => setShowDistrictModal(false)}
                style={styles.modalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {AVAILABLE_DISTRICTS.map((district) => (
                <TouchableOpacity
                  key={district}
                  style={[
                    styles.modalOption,
                    districtInput === district && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setDistrictInput(district);
                    setShowDistrictModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      districtInput === district && styles.modalOptionTextSelected,
                    ]}
                  >
                    {district}
                  </Text>
                  {districtInput === district && (
                    <MaterialIcons name="check" size={20} color="#2E7D32" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('CinnOracleMain')}
        >
          <MaterialIcons name="home" size={24} color="#9E9E9E" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <View style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="analytics" size={24} color="#FFFFFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Analysis</Text>
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('HistoricalTrends')}
        >
          <MaterialIcons name="history" size={24} color="#9E9E9E" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>

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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    fontWeight: 'bold',
    color: '#000000',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qualityLevelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  gradeText: {
    fontSize: 14,
    color: '#555555',
    marginBottom: 12,
  },
  priceContainer: {
    alignItems: 'center',
    width: '100%',
  },
  priceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  priceLabel: {
    fontSize: 14,
    color: '#999999',
    marginTop: 4,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 4,
  },
  analysisSubtitle: {
    fontSize: 0,
    marginBottom: 0,
  },
  analysisQualityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisField: {
    flex: 1,
    marginRight: 8,
  },
  analysisFieldLabel: {
    fontSize: 11,
    color: '#777777',
    marginBottom: 4,
  },
  analysisFieldBox: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F5FFF7',
    borderWidth: 1,
    borderColor: '#E0F2E9',
  },
  analysisFieldValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
  },
  sellingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  sellingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  sellingSubtitle: {
    fontSize: 0,
    marginBottom: 0,
  },
  sellingField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sellingLabel: {
    width: 90,
    fontSize: 13,
    color: '#777777',
  },
  sellingFieldInputWrapper: {
    flex: 1,
    position: 'relative',
  },
  sellingInputBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    fontSize: 13,
    color: '#000000',
  },
  sellingInputText: {
    fontSize: 13,
    color: '#000000',
  },
  sellingInputPlaceholder: {
    fontSize: 13,
    color: '#BDBDBD',
  },
  estimateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  estimateButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  estimatedSection: {
    marginBottom: 12,
  },
  estimatedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  estimatedSubtitle: {
    fontSize: 0,
    marginBottom: 0,
  },
  estimatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  estimatedTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  qualityPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
  },
  qualityPillText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
  },
  estimatedGradeText: {
    fontSize: 12,
    color: '#555555',
  },
  marketSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  marketTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  marketList: {
    marginBottom: 12,
  },
  marketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
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
  marketSubText: {
    fontSize: 12,
    color: '#555555',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 12,
  },
  infoIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#C8E6C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#424242',
    lineHeight: 18,
  },
  gradeGuideLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    marginBottom: 8,
  },
  gradeGuideText: {
    fontSize: 13,
    color: '#2E7D32',
    fontWeight: '600',
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  primaryAction: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  secondaryAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginLeft: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  secondaryActionText: {
    color: '#2E7D32',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  // District dropdown styles
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: '40%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  modalOptionSelected: {
    backgroundColor: '#F1F8E9',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333333',
  },
  modalOptionTextSelected: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  // Date picker styles
  datePickerContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
  },
  datePickerContainer: {
    padding: 20,
  },
  datePickerSection: {
    marginBottom: 24,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  datePickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  datePickerValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginHorizontal: 24,
    minWidth: 80,
    textAlign: 'center',
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  datePickerActionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
