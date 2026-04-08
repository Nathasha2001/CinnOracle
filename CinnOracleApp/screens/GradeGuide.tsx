import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { getGrades, GradesResponse } from '../src/api/client';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GradeGuide() {
  const navigation = useNavigation<NavigationProp>();
  const [gradesData, setGradesData] = useState<GradesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setIsLoading(true);
        const data = await getGrades();
        setGradesData(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch grades:', err);
        setError('Failed to load grades data');
        // Keep showing the page with fallback data
      } finally {
        setIsLoading(false);
      }
    };

    fetchGrades();
  }, []);

  const renderGradeCard = (
    title: string,
    subtitle: string,
    bulletPoints: string[],
  ) => (
    <View style={styles.gradeCard} key={title}>
      <View style={styles.gradeCardHeader}>
        <View>
          <Text style={styles.gradeTitle}>{title}</Text>
          <Text style={styles.gradeSubtitle}>{subtitle}</Text>
        </View>
      </View>

      {bulletPoints.map((point) => (
        <View style={styles.bulletRow} key={point}>
          <MaterialIcons name="circle" size={6} color="#9E9E9E" />
          <Text style={styles.bulletText}>{point}</Text>
        </View>
      ))}
    </View>
  );

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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Cinnamon Grade Guide</Text>
          <Text style={styles.headerSubtitle}>
            Understand cinnamon quality levels
          </Text>
        </View>
        <View style={styles.headerIcon} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B4513" />
            <Text style={styles.loadingText}>Loading grades information...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.errorSubtext}>Showing default information</Text>
          </View>
        )}
        {/* High Quality Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.qualityDot, styles.highDot]} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>High Quality</Text>
            <Text style={styles.sectionDescription}>
              These grades have the best appearance and highest market price.
            </Text>
          </View>
        </View>

        {renderGradeCard('Alba', 'Highest quality cinnamon', [
          'Very thin sticks (quills)',
          'Light golden color',
          'Very tightly rolled',
          'Strong aroma',
          'Usually sold to export markets',
          'Gets the highest price',
        ])}

        {renderGradeCard('C5 Special', 'Very good quality cinnamon', [
          'Thin sticks',
          'Light golden color',
          'Low breakage',
          'Good aroma',
          'High export demand',
        ])}

        {renderGradeCard('C5', 'Good quality cinnamon', [
          'Slightly thicker than premium grades',
          'Good color and aroma',
          'Suitable for export and local markets',
        ])}

        {/* Medium Quality Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.qualityDot, styles.mediumDot]} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Medium Quality</Text>
            <Text style={styles.sectionDescription}>
              These grades have moderate quality and fair market price.
            </Text>
          </View>
        </View>

        {renderGradeCard('C4', 'Medium quality cinnamon', [
          'Slightly thicker sticks',
          'Golden brown color',
          'Moderate aroma',
          'Stable market price',
        ])}

        {renderGradeCard('H1', 'Lower medium grade', [
          'Thicker sticks',
          'Less uniform rolls',
          'More breakage than higher grades',
          'Lower price than premium grades',
        ])}

        {/* Low Quality Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.qualityDot, styles.lowDot]} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Low Quality</Text>
            <Text style={styles.sectionDescription}>
              These grades usually have lower market prices and are often used
              for processing.
            </Text>
          </View>
        </View>

        {renderGradeCard('H2', 'Thick cinnamon sticks', [
          'More broken pieces',
          'Lower aroma',
          'Lower market price',
        ])}

        {renderGradeCard('Heen', 'Thin broken cinnamon pieces', [
          'Often used for cinnamon powder production',
          'Mixed color and aroma',
          'Not usually sold as whole sticks',
        ])}

        {renderGradeCard('Gorosu', 'Very thick and rough bark', [
          'Lowest quality grade',
          'Mostly used for industrial processing',
        ])}

        {/* How CinnOracle Helps */}
        <View style={styles.helpCard}>
          <View style={styles.helpHeaderRow}>
            <View style={styles.helpIcon}>
              <MaterialIcons name="lightbulb-outline" size={16} color="#27ae60" />
            </View>
            <Text style={styles.helpTitle}>How CinnOracle Helps</Text>
          </View>
          <Text style={styles.helpBody}>
            CinnOracle analyzes your cinnamon harvest and predicts:
          </Text>
          <View style={styles.helpList}>
            <Text style={styles.helpBullet}>• The quality grade</Text>
            <Text style={styles.helpBullet}>• The estimated market price</Text>
            <Text style={styles.helpBullet}>
              • The best marketplace to sell your harvest
            </Text>
          </View>
          <Text style={styles.helpBody}>
            This helps farmers avoid under-pricing, track price trends, and make
            better selling decisions.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <View style={[styles.navItem, styles.navItemActive]}>
          <MaterialIcons name="home" size={24} color="#FFFFFF" />
          <Text style={[styles.navLabel, styles.navLabelActive]}>Home</Text>
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('NewAnalysis')}
        >
          <MaterialIcons name="analytics" size={24} color="#9E9E9E" />
          <Text style={styles.navLabel}>Analysis</Text>
        </TouchableOpacity>

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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerIcon: {
    width: 32,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  qualityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
    marginRight: 8,
  },
  highDot: {
    backgroundColor: '#4CAF50',
  },
  mediumDot: {
    backgroundColor: '#FFC107',
  },
  lowDot: {
    backgroundColor: '#F44336',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  sectionDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  gradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gradeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  gradeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  gradeSubtitle: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
  },
  bulletText: {
    fontSize: 12,
    color: '#424242',
    marginLeft: 6,
    flex: 1,
    lineHeight: 18,
  },
  helpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  helpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  helpBody: {
    fontSize: 12,
    color: '#424242',
    marginBottom: 6,
    lineHeight: 18,
  },
  helpList: {
    marginBottom: 6,
  },
  helpBullet: {
    fontSize: 12,
    color: '#424242',
    lineHeight: 18,
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#757575',
    marginTop: 12,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 12,
    color: '#C62828',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 11,
    color: '#E57373',
    marginTop: 4,
  },
});

