import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { PieChart } from 'react-native-svg-charts';
import { Text as SVGText } from 'react-native-svg';

interface StatsChartProps {
  totalMinutes: number;
  totalSessions: number;
  averageLength: number;
}

export default function StatsChart({ totalMinutes, totalSessions, averageLength }: StatsChartProps) {
  const data = [
    {
      key: 1,
      value: totalMinutes,
      svg: { fill: '#6366f1' },
      arc: { cornerRadius: 5 }
    },
    {
      key: 2,
      value: totalSessions,
      svg: { fill: '#818cf8' },
      arc: { cornerRadius: 5 }
    },
    {
      key: 3,
      value: averageLength,
      svg: { fill: '#a5b4fc' },
      arc: { cornerRadius: 5 }
    }
  ];

  const Labels = ({ slices }: any) => {
    return slices.map((slice: any, index: number) => {
      const { labelCentroid, pieCentroid, data } = slice;
      return (
        <SVGText
          key={index}
          x={pieCentroid[0]}
          y={pieCentroid[1]}
          fill="white"
          textAnchor="middle"
          alignmentBaseline="middle"
          fontSize={12}
          fontWeight="bold"
        >
          {data.value}
        </SVGText>
      );
    });
  };

  return (
    <View style={styles.container}>
      <PieChart
        style={styles.chart}
        data={data}
        innerRadius="70%"
        outerRadius="95%"
        padAngle={0.02}
      >
        <Labels />
      </PieChart>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#6366f1' }]} />
          <Text style={styles.legendText}>Total Minutes</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#818cf8' }]} />
          <Text style={styles.legendText}>Total Sessions</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#a5b4fc' }]} />
          <Text style={styles.legendText}>Avg. Length</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  chart: {
    height: 200,
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    color: '#666',
    fontSize: 14,
  },
});