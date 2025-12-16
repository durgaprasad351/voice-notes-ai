import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { format, addDays, isSameDay, startOfWeek } from 'date-fns';
import { colors, spacing, typography, borderRadius } from '../constants/theme';

interface CalendarStripProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  markedDates?: string[];
}

export function CalendarStrip({ selectedDate, onSelectDate, markedDates = [] }: CalendarStripProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Generate dates: 2 weeks before + 4 weeks after
  const dates = React.useMemo(() => {
    const today = new Date();
    const start = addDays(today, -7); // Start 1 week ago
    const days = [];
    for (let i = 0; i < 21; i++) {
      days.push(addDays(start, i));
    }
    return days;
  }, []);

  // Scroll to selected date on mount
  useEffect(() => {
    // Wait for layout
    setTimeout(() => {
      if (scrollViewRef.current) {
        const itemWidth = 48 + 8; // width + margin
        const paddingLeft = spacing.lg;
        const screenWidth = Dimensions.get('window').width;
        
        // Find index of today (it's always index 7 in our generation logic)
        const todayIndex = 7;
        
        // Calculate center position
        const targetX = (paddingLeft + (todayIndex * itemWidth)) - (screenWidth / 2) + (48 / 2);
        
        scrollViewRef.current.scrollTo({
          x: Math.max(0, targetX),
          animated: true, // Optional: false for instant
        });
      }
    }, 100);
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const dateStr = format(date, 'yyyy-MM-dd');
          const hasEvent = markedDates.includes(dateStr);
          
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.dateItem,
                isSelected && styles.dateItemSelected,
                isToday && !isSelected && styles.dateItemToday,
                hasEvent && !isSelected && !isToday && styles.dateItemHasEvent
              ]}
              onPress={() => onSelectDate(date)}
            >
              <Text style={[
                styles.dayLabel,
                isSelected && styles.textSelected,
                isToday && !isSelected && styles.textToday,
                hasEvent && !isSelected && !isToday && styles.textHasEvent
              ]}>
                {format(date, 'EEEEE')}
              </Text>
              <Text style={[
                styles.dateNumber,
                isSelected && styles.textSelected,
                isToday && !isSelected && styles.textToday,
                hasEvent && !isSelected && !isToday && styles.textHasEvent
              ]}>
                {format(date, 'd')}
              </Text>
              {(isSelected || hasEvent) && (
                <View style={[
                  styles.dot, 
                  !isSelected && hasEvent && styles.dotHasEvent
                ]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dateItem: {
    width: 48,
    height: 70,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dateItemSelected: {
    backgroundColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  dateItemToday: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateItemHasEvent: {
    backgroundColor: '#E5E7EB', // Visible grey (Gray 200) for days with events
  },
  dayLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  dateNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  textSelected: {
    color: '#FFFFFF',
  },
  textToday: {
    color: colors.accent,
  },
  textHasEvent: {
    color: colors.textPrimary,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 8,
  },
  dotHasEvent: {
    backgroundColor: colors.primary, // Dark dot on light background
    opacity: 0.5,
  }
});

