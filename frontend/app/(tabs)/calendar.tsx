import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getTodayNepaliDate,
  formatNepaliDate,
  toNepaliDigits,
  NEPALI_MONTHS,
  NEPALI_DAYS,
  getFestivalsForMonth,
  getFestivalsForDate,
  getTithi,
  getMonthCalendar,
  getDaysInBsMonth,
  NepaliDate,
  Festival,
} from '@/utils/nepaliCalendar';

export default function CalendarScreen() {
  const [currentDate, setCurrentDate] = useState<NepaliDate | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [selectedYear, setSelectedYear] = useState<number>(2081);
  const [todayTithi, setTodayTithi] = useState<{ nepali: string; english: string; paksha: string } | null>(null);
  const [monthCalendar, setMonthCalendar] = useState<(number | null)[][]>([]);
  const [monthFestivals, setMonthFestivals] = useState<Festival[]>([]);

  useEffect(() => {
    const today = getTodayNepaliDate();
    setCurrentDate(today);
    setSelectedMonth(today.month);
    setSelectedYear(today.year);
    setTodayTithi(getTithi(new Date()));
  }, []);

  useEffect(() => {
    setMonthCalendar(getMonthCalendar(selectedYear, selectedMonth));
    setMonthFestivals(getFestivalsForMonth(selectedMonth));
  }, [selectedMonth, selectedYear]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToToday = () => {
    if (currentDate) {
      setSelectedMonth(currentDate.month);
      setSelectedYear(currentDate.year);
    }
  };

  const isToday = (day: number): boolean => {
    return currentDate !== null && 
           day === currentDate.day && 
           selectedMonth === currentDate.month && 
           selectedYear === currentDate.year;
  };

  const getDayFestivals = (day: number): Festival[] => {
    return getFestivalsForDate(selectedMonth, day);
  };

  const getFestivalTypeColor = (type: string): string => {
    switch (type) {
      case 'major': return '#EF4444';
      case 'minor': return '#F59E0B';
      case 'government': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  if (!currentDate) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Ionicons name="calendar" size={24} color="#10B981" />
          </View>
          <View>
            <Text style={styles.headerTitle}>नेपाली पात्रो</Text>
            <Text style={styles.headerSubtitle}>Nepali Calendar</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Today's Date Card */}
        <View style={styles.todayCard}>
          <View style={styles.todayMain}>
            <Text style={styles.todayDay}>{toNepaliDigits(currentDate.day)}</Text>
            <View style={styles.todayDetails}>
              <Text style={styles.todayMonthYear}>
                {NEPALI_MONTHS[currentDate.month - 1].nepali} {toNepaliDigits(currentDate.year)}
              </Text>
              <Text style={styles.todayEnglish}>
                {NEPALI_MONTHS[currentDate.month - 1].english} {currentDate.year} BS
              </Text>
              <Text style={styles.todayDayName}>
                {NEPALI_DAYS[currentDate.dayOfWeek].nepali}
              </Text>
            </View>
          </View>
          
          {/* Today's Tithi */}
          {todayTithi && (
            <View style={styles.tithiContainer}>
              <View style={styles.tithiIcon}>
                <Ionicons name="moon" size={16} color="#F59E0B" />
              </View>
              <View>
                <Text style={styles.tithiLabel}>आजको तिथि / Today's Tithi</Text>
                <Text style={styles.tithiText}>
                  {todayTithi.nepali} ({todayTithi.english})
                </Text>
                <Text style={styles.pakshaText}>{todayTithi.paksha}</Text>
              </View>
            </View>
          )}

          {/* Today's Festivals */}
          {getDayFestivals(currentDate.day).length > 0 && selectedMonth === currentDate.month && selectedYear === currentDate.year && (
            <View style={styles.todayFestival}>
              <Ionicons name="star" size={16} color="#EF4444" />
              <Text style={styles.todayFestivalText}>
                {getDayFestivals(currentDate.day).map(f => f.nameNepali).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousMonth}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToToday}>
            <View style={styles.monthTitle}>
              <Text style={styles.monthText}>
                {NEPALI_MONTHS[selectedMonth - 1].nepali} {toNepaliDigits(selectedYear)}
              </Text>
              <Text style={styles.monthEnglish}>
                {NEPALI_MONTHS[selectedMonth - 1].english} {selectedYear}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <Ionicons name="chevron-forward" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarContainer}>
          {/* Day Headers */}
          <View style={styles.dayHeaders}>
            {NEPALI_DAYS.map((day, index) => (
              <View key={index} style={styles.dayHeader}>
                <Text style={[
                  styles.dayHeaderText,
                  index === 6 && styles.saturdayText,
                ]}>
                  {day.short}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar Days */}
          {monthCalendar.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {week.map((day, dayIndex) => {
                const festivals = day ? getDayFestivals(day) : [];
                const hasMajorFestival = festivals.some(f => f.type === 'major');
                
                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.dayCell,
                      isToday(day || 0) && styles.todayCell,
                    ]}
                  >
                    {day && (
                      <>
                        <Text style={[
                          styles.dayText,
                          dayIndex === 6 && styles.saturdayText,
                          isToday(day) && styles.todayText,
                        ]}>
                          {toNepaliDigits(day)}
                        </Text>
                        {hasMajorFestival && (
                          <View style={styles.festivalDot} />
                        )}
                      </>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Festivals List */}
        <View style={styles.festivalsSection}>
          <Text style={styles.sectionTitle}>
            यस महिनाका पर्वहरू / Festivals this month
          </Text>
          
          {monthFestivals.length === 0 ? (
            <View style={styles.noFestivals}>
              <Text style={styles.noFestivalsText}>
                यस महिना कुनै प्रमुख पर्व छैन
              </Text>
              <Text style={styles.noFestivalsSubtext}>
                No major festivals this month
              </Text>
            </View>
          ) : (
            monthFestivals.map((festival, index) => (
              <View key={index} style={styles.festivalItem}>
                <View style={styles.festivalDate}>
                  <Text style={styles.festivalDateText}>
                    {toNepaliDigits(festival.date.day)}
                  </Text>
                </View>
                <View style={styles.festivalInfo}>
                  <View style={styles.festivalHeader}>
                    <Text style={styles.festivalName}>{festival.nameNepali}</Text>
                    <View style={[
                      styles.festivalTypeBadge,
                      { backgroundColor: getFestivalTypeColor(festival.type) + '20' }
                    ]}>
                      <View style={[
                        styles.festivalTypeDot,
                        { backgroundColor: getFestivalTypeColor(festival.type) }
                      ]} />
                    </View>
                  </View>
                  <Text style={styles.festivalNameEn}>{festival.name}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>प्रमुख पर्व / Major Festival</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>सानो पर्व / Minor Festival</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>सरकारी बिदा / Government Holiday</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#1A1A24',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D3D',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#10B981' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  todayCard: {
    backgroundColor: '#1A1A24',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#10B981' + '40',
  },
  todayMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todayDay: {
    fontSize: 64,
    fontWeight: '700',
    color: '#10B981',
    marginRight: 16,
  },
  todayDetails: {
    flex: 1,
  },
  todayMonthYear: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  todayEnglish: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  todayDayName: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 4,
  },
  tithiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3D',
  },
  tithiIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F59E0B' + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  tithiLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tithiText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 2,
  },
  pakshaText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
  },
  todayFestival: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2D2D3D',
    gap: 8,
  },
  todayFestivalText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2D2D3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monthEnglish: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  calendarContainer: {
    backgroundColor: '#1A1A24',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 12,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  saturdayText: {
    color: '#EF4444',
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 8,
  },
  todayCell: {
    backgroundColor: '#10B981',
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  festivalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EF4444',
    marginTop: 2,
  },
  festivalsSection: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  noFestivals: {
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  noFestivalsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  noFestivalsSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  festivalItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  festivalDate: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#2D2D3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  festivalDateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  festivalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  festivalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  festivalName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  festivalTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  festivalTypeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  festivalNameEn: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 2,
  },
  legend: {
    margin: 16,
    backgroundColor: '#1A1A24',
    borderRadius: 12,
    padding: 16,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
});
