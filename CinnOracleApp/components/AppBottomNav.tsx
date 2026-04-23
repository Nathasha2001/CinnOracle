import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type NavKey = 'home' | 'predict' | 'history' | 'grade';

type Props = {
  active: NavKey;
};

export default function AppBottomNav({ active }: Props) {
  const navigation = useNavigation<NavigationProp>();

  const navItems: Array<{
    key: NavKey;
    label: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    route: keyof RootStackParamList;
  }> = [
    { key: 'home', label: 'Home', icon: 'home', route: 'CinnOracleMain' },
    { key: 'predict', label: 'Predict', icon: 'grass', route: 'NewAnalysis' },
    { key: 'history', label: 'History', icon: 'history', route: 'HistoricalTrends' },
    { key: 'grade', label: 'Grade Guide', icon: 'menu-book', route: 'GradeGuide' },
  ];

  return (
    <View style={styles.bottomNav}>
      {navItems.map((item) => {
        const isActive = item.key === active;
        return (
          <TouchableOpacity
            key={item.key}
            style={[styles.navItem, isActive && styles.navItemActive]}
            onPress={() => navigation.navigate(item.route)}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={item.icon}
              size={22}
              color={isActive ? '#FFFFFF' : '#9E9E9E'}
            />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#0B5E2D',
  },
  navLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#9E9E9E',
  },
  navLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
