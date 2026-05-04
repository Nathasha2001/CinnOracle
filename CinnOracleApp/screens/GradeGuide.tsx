import React from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import AppBottomNav from '../components/AppBottomNav';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function GradeGuide() {
  const navigation = useNavigation<NavigationProp>();

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
        {/* High Quality Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.qualityDot, styles.highDot]} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>High Quality</Text>
            <Text style={styles.sectionDescription}>
              These grades have the best appearance, lowest moisture, and highest export value.
            </Text>
          </View>
        </View>

        {renderGradeCard('Alba', 'Highest premium cinnamon', [
          'Very thin quills (6–8 mm)',
          'Light golden color (light brown)',
          'Very tightly rolled layers',
          'Strong, sweet aroma',
          'Export-grade cinnamon',
          'Highest market price',
        ])}

        {renderGradeCard('C5 Special', 'Premium quality cinnamon', [
          'Thin quills (8–10 mm)',
          'Light golden to light brown color',
          'Low breakage and smooth texture',
          'Good aroma',
          'High export demand',
          'High market price',
        ])}

        {/* Medium Quality Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.qualityDot, styles.mediumDot]} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Medium Quality</Text>
            <Text style={styles.sectionDescription}>
              These grades have moderate thickness and are used in both export and local markets.
            </Text>
          </View>
        </View>

        {renderGradeCard('C5', 'Moderate quality cinnamon', [
          'Medium thickness (10–12 mm)',
          'Golden brown color',
          'Moderate aroma',
          'Slightly higher breakage',
          'Used for both export and local markets',
          'Moderate market price',
        ])}

        {renderGradeCard('C4', 'Standard quality cinnamon', [
          'Thicker quills (12–16 mm)',
          'Golden to slightly dark brown color',
          'Average aroma',
          'More breakage compared to premium grades',
          'Common in local markets',
          'Stable market price',
        ])}

        {/* Low Quality Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.qualityDot, styles.lowDot]} />
          <View style={styles.sectionHeaderText}>
            <Text style={styles.sectionTitle}>Low Quality</Text>
            <Text style={styles.sectionDescription}>
              These grades have thicker bark, lower aroma, and are mainly used for processing.
            </Text>
          </View>
        </View>

        {renderGradeCard('H1', 'Low quality cinnamon', [
          'Thick sticks (16–22 mm)',
          'Dark brown color',
          'Less uniform rolling',
          'Lower aroma',
          'Higher breakage',
          'Lower market price',
        ])}

        {renderGradeCard('H2', 'Very low quality cinnamon', [
          'Very thick sticks (22–26 mm)',
          'Dark brown color',
          'High breakage',
          'Weak aroma',
          'Mostly used for processing',
        ])}

        {renderGradeCard('Gorosu', 'Lowest quality cinnamon', [
          'Very thick bark (26mm+)',
          'Rough texture',
          'Very low aroma',
          'Not suitable for export as quills',
          'Used for industrial processing (powder/oil)',
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

      <AppBottomNav active="grade" />
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
});

