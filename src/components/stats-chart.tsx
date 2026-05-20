import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface ChartData {
  value: number;
  label: string;
  frontColor?: string;
}

interface StatsChartProps {
  data: ChartData[];
  title: string;
  maxValue?: number;
  type?: 'bar' | 'line';
}

export function StatsChart({
  data,
  title,
  maxValue = 100,
  type = 'bar',
}: StatsChartProps) {
  const chartData = data.map((item) => ({
    value: item.value,
    label: item.label,
    frontColor: item.frontColor || '#d4af37',
    labelTextStyle: { color: '#aaa', fontSize: 10 },
  }));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <BarChart
          data={chartData}
          height={220}
          width={300}
          barWidth={24}
          spacing={8}
          maxValue={maxValue}
          noOfSections={5}
          barBorderRadius={4}
          showGradient
          gradientColor="#d4af37"
          xAxisColor="#333"
          yAxisColor="#333"
          yAxisTextStyle={{ color: '#aaa', fontSize: 10 }}
          xAxisLabelTextStyle={{ color: '#aaa', fontSize: 10 }}
          backgroundColor="transparent"
          isAnimated
          animationDuration={1000}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
