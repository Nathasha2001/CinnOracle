import React, { useState } from 'react';
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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../App';
import { predictQuality, QualityPredictionInput } from '../src/api/client';

export default function NewAnalysis() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [weightBefore, setWeightBefore] = useState<string>('');
  const [weightAfter, setWeightAfter] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [dryingDays, setDryingDays] = useState<string>('');

  const [cinnamonColor, setCinnamonColor] = useState<
    'Light Golden' | 'Golden Brown' | 'Dark Brown'
  >('Golden Brown');
  const [breakageLevel, setBreakageLevel] = useState<'Low' | 'Medium' | 'High'>(
    'Low'
  );
  const [rollTightness, setRollTightness] = useState<
    'Tight' | 'Medium' | 'Loose'
  >('Medium');
  const [aromaStrength, setAromaStrength] = useState<
    'Strong' | 'Medium' | 'Weak'
  >('Strong');

  const formatNumber = (value: string): string => {
    // Remove commas and non-numeric characters
    const numValue = value.replace(/[^0-9]/g, '');
    if (numValue === '') return '';
    // Add commas for thousands
    return parseInt(numValue, 10).toLocaleString();
  };

  const parseNumber = (value: string): number => {
    const numValue = value.replace(/[^0-9]/g, '');
    return numValue === '' ? 0 : parseInt(numValue, 10);
  };

  const increment = (currentValue: string, setValue: (value: string) => void) => {
    const num = parseNumber(currentValue);
    setValue(formatNumber((num + 1).toString()));
  };

  const decrement = (currentValue: string, setValue: (value: string) => void) => {
    const num = parseNumber(currentValue);
    if (num > 0) {
      setValue(formatNumber((num - 1).toString()));
    }
  };

  const handleWeightBeforeChange = (text: string) => {
    setWeightBefore(formatNumber(text));
  };

  const handleWeightAfterChange = (text: string) => {
    setWeightAfter(formatNumber(text));
  };

  const handleTemperatureChange = (text: string) => {
    setTemperature(formatNumber(text));
  };

  const handleDryingDaysChange = (text: string) => {
    setDryingDays(formatNumber(text));
  };

  const handlePredict = async () => {
    const weightBeforeNum = parseNumber(weightBefore);
    const weightAfterNum = parseNumber(weightAfter);
    const temperatureNum = parseNumber(temperature);
    const dryingDaysNum = parseNumber(dryingDays);

    // Validate inputs
    if (weightBeforeNum === 0 || weightAfterNum === 0 || temperatureNum === 0) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    // Weight after drying must be lower than or equal to weight before drying
    if (weightAfterNum > weightBeforeNum) {
      Alert.alert(
        'Validation Error',
        'Weight after drying must be lower than or equal to weight before drying',
      );
      return;
    }

    try {
      // Call the quality prediction API
      const qualityInput: QualityPredictionInput = {
        weight_before: weightBeforeNum,
        weight_after: weightAfterNum,
        temperature: temperatureNum,
        drying_days: dryingDaysNum,
        color: cinnamonColor,
        breakage_level: breakageLevel,
        roll_tightness: rollTightness,
        aroma_strength: aromaStrength,
      };

      const qualityResponse = await predictQuality(qualityInput);

      // Calculate weight loss for display
      const weightLoss = ((weightBeforeNum - weightAfterNum) / weightBeforeNum) * 100;

      // Generate batch ID
      const batchId = `#${Math.floor(Math.random() * 9000) + 1000}`;
      const district = 'Galle';
      const harvestDate = new Date().toISOString();

      // include selling meta for backend save
      qualityInput.district = district;
      qualityInput.harvest_date = harvestDate;

      navigation.navigate('PricePrediction', {
        result: {
          quality: qualityResponse.standard_grade,
          qualityLevel: qualityResponse.quality,
          standardGrade: qualityResponse.standard_grade,
          weight_loss_percent: qualityResponse.weight_loss_percent,
          batchId: batchId,
          district,
          harvestDate,
          inputs: {
            weightBefore: weightBeforeNum,
            weightAfter: weightAfterNum,
            temperature: temperatureNum,
            dryingDays: dryingDaysNum,
            cinnamonColor,
            breakageLevel,
            rollTightness,
            aromaStrength,
          },
        },
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to predict quality. Please try again.');
      console.error('Quality prediction error:', error);
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
        <Text style={styles.headerTitle}>New Harvest Analysis</Text>
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
        <Text style={styles.sectionTitle}>Measured Details</Text>

        {/* Weight Before Drying Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Weight Before Drying</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => decrement(weightBefore, setWeightBefore)}
            >
              <MaterialIcons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.inputField, styles.inputFieldEmpty]}>
              <TextInput
                style={styles.inputText}
                value={weightBefore}
                onChangeText={handleWeightBeforeChange}
                keyboardType="numeric"
                placeholder=""
              />
              {weightBefore === '' ? (
                <View style={[styles.placeholderOverlay, { pointerEvents: 'none' }]}>
                  <Text style={styles.inputPlaceholder}>(kg)</Text>
                </View>
              ) : (
                <Text style={styles.inputUnit}>(kg)</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => increment(weightBefore, setWeightBefore)}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Weight After Drying Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Weight After Drying</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => decrement(weightAfter, setWeightAfter)}
            >
              <MaterialIcons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.inputField, styles.inputFieldEmpty]}>
              <TextInput
                style={styles.inputText}
                value={weightAfter}
                onChangeText={handleWeightAfterChange}
                keyboardType="numeric"
                placeholder=""
              />
              {weightAfter === '' ? (
                <View style={[styles.placeholderOverlay, { pointerEvents: 'none' }]}>
                  <Text style={styles.inputPlaceholder}>(kg)</Text>
                </View>
              ) : (
                <Text style={styles.inputUnit}>(kg)</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => increment(weightAfter, setWeightAfter)}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Temperature Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Drying Temperature</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => decrement(temperature, setTemperature)}
            >
              <MaterialIcons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.inputField, styles.inputFieldEmpty]}>
              <TextInput
                style={styles.inputText}
                value={temperature}
                onChangeText={handleTemperatureChange}
                keyboardType="numeric"
                placeholder=""
              />
              {temperature === '' ? (
                <View style={[styles.placeholderOverlay, { pointerEvents: 'none' }]}>
                  <Text style={styles.inputPlaceholder}>(°C)</Text>
                </View>
              ) : (
                <Text style={styles.inputUnit}>(°C)</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => increment(temperature, setTemperature)}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Drying Days Card */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Drying Days</Text>
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => decrement(dryingDays, setDryingDays)}
            >
              <MaterialIcons name="remove" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={[styles.inputField, styles.inputFieldEmpty]}>
              <TextInput
                style={styles.inputText}
                value={dryingDays}
                onChangeText={handleDryingDaysChange}
                keyboardType="numeric"
                placeholder=""
              />
              {dryingDays === '' ? (
                <View style={[styles.placeholderOverlay, { pointerEvents: 'none' }]}>
                  <Text style={styles.inputPlaceholder}>(days)</Text>
                </View>
              ) : (
                <Text style={styles.inputUnit}>(days)</Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => increment(dryingDays, setDryingDays)}
            >
              <MaterialIcons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Harvest Condition</Text>

        <View style={styles.conditionCard}>
          <View style={styles.conditionGroup}>
            <Text style={styles.conditionLabel}>Cinnamon Color</Text>
            <View style={styles.chipRow}>
              {['Light Golden', 'Golden Brown', 'Dark Brown'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    cinnamonColor === option && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setCinnamonColor(
                      option as 'Light Golden' | 'Golden Brown' | 'Dark Brown'
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      cinnamonColor === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.conditionGroup}>
            <Text style={styles.conditionLabel}>Breakage Level</Text>
            <View style={styles.chipRow}>
              {['Low', 'Medium', 'High'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    breakageLevel === option && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setBreakageLevel(option as 'Low' | 'Medium' | 'High')
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      breakageLevel === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.conditionGroup}>
            <Text style={styles.conditionLabel}>Roll Tightness</Text>
            <View style={styles.chipRow}>
              {['Tight', 'Medium', 'Loose'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    rollTightness === option && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setRollTightness(option as 'Tight' | 'Medium' | 'Loose')
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      rollTightness === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.conditionGroup}>
            <Text style={styles.conditionLabel}>Aroma Strength</Text>
            <View style={styles.chipRow}>
              {['Strong', 'Medium', 'Weak'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.chip,
                    aromaStrength === option && styles.chipSelected,
                  ]}
                  onPress={() =>
                    setAromaStrength(option as 'Strong' | 'Medium' | 'Weak')
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      aromaStrength === option && styles.chipTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Analyze Button */}
        <TouchableOpacity style={styles.predictButton} onPress={handlePredict}>
          <Text style={styles.predictButtonText}>Analyze Harvest</Text>
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: 40,
    height: 40,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    minHeight: 52,
    position: 'relative',
  },
  inputFieldFilled: {
    borderWidth: 2,
    borderColor: '#4CAF50',
    backgroundColor: '#FFFFFF',
  },
  inputFieldEmpty: {
    backgroundColor: '#E8F5E9',
    borderWidth: 0,
  },
  inputText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    padding: 0,
    flex: 1,
  },
  inputUnit: {
    fontSize: 14,
    color: '#999999',
    marginLeft: 6,
  },
  placeholderOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  inputPlaceholder: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  conditionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  conditionGroup: {
    marginBottom: 16,
  },
  conditionLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontWeight: '500',
  },
  chipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 12,
    color: '#388E3C',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  predictButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  predictButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
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

