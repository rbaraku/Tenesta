import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const Card = ({ children, style }) => (
  <View style={[styles.card, style]}>
    {children}
  </View>
);

const ReportItem = ({ title, description, onPress }) => (
  <TouchableOpacity style={styles.reportItem} onPress={onPress}>
    <View style={styles.reportInfo}>
      <Text style={styles.reportTitle}>{title}</Text>
      <Text style={styles.reportDescription}>{description}</Text>
    </View>
    <Text style={styles.reportArrow}>›</Text>
  </TouchableOpacity>
);

const MetricCard = ({ title, value, change, positive }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricTitle}>{title}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={[
      styles.metricChange,
      positive ? styles.positiveChange : styles.negativeChange
    ]}>
      {change}
    </Text>
  </View>
);

export default function ReportsScreen({ navigation }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const handleGenerateReport = (reportType) => {
    Alert.alert(
      'Generate Report',
      `${reportType} report will be generated and emailed to you shortly.`,
      [{ text: 'OK' }]
    );
  };

  const reports = [
    {
      title: 'Financial Summary',
      description: 'Monthly income, expenses, and profit/loss analysis'
    },
    {
      title: 'Rent Collection Report',
      description: 'Payment status and collection rates by property'
    },
    {
      title: 'Occupancy Report',
      description: 'Vacancy rates and turnover analysis'
    },
    {
      title: 'Maintenance Report',
      description: 'Work orders, costs, and vendor performance'
    },
    {
      title: 'Tenant Report',
      description: 'Lease renewals, demographics, and satisfaction'
    },
    {
      title: 'Tax Report',
      description: 'Income and expense summary for tax preparation'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Reports</Text>
          <Text style={styles.subtitle}>Analytics and financial insights</Text>
        </View>

        {/* Period Selection */}
        <Card>
          <Text style={styles.cardTitle}>Report Period</Text>
          <View style={styles.periodButtons}>
            {['week', 'month', 'quarter', 'year'].map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.selectedPeriod
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodText,
                  selectedPeriod === period && styles.selectedPeriodText
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Key Metrics */}
        <Card>
          <Text style={styles.cardTitle}>Key Metrics - This Month</Text>
          <View style={styles.metricsGrid}>
            <MetricCard
              title="Total Revenue"
              value="$18,500"
              change="+5.2%"
              positive={true}
            />
            <MetricCard
              title="Occupancy Rate"
              value="87.5%"
              change="+2.1%"
              positive={true}
            />
            <MetricCard
              title="Collection Rate"
              value="95.8%"
              change="-1.2%"
              positive={false}
            />
            <MetricCard
              title="Avg. Days Vacant"
              value="12 days"
              change="-3 days"
              positive={true}
            />
          </View>
        </Card>

        {/* Quick Stats */}
        <Card>
          <Text style={styles.cardTitle}>Portfolio Performance</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Properties</Text>
              <Text style={styles.statValue}>8</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Active Leases</Text>
              <Text style={styles.statValue}>7</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Monthly Rent Roll</Text>
              <Text style={styles.statValue}>$18,500</Text>
            </View>
          </View>
        </Card>

        {/* Available Reports */}
        <Card>
          <Text style={styles.cardTitle}>Available Reports</Text>
          {reports.map((report, index) => (
            <ReportItem
              key={index}
              title={report.title}
              description={report.description}
              onPress={() => handleGenerateReport(report.title)}
            />
          ))}
        </Card>

        {/* Export Options */}
        <Card style={styles.lastCard}>
          <Text style={styles.cardTitle}>Export Options</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => Alert.alert('Coming Soon', 'PDF export will be available soon')}
          >
            <Text style={styles.exportButtonText}>📄 Export to PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => Alert.alert('Coming Soon', 'Excel export will be available soon')}
          >
            <Text style={styles.exportButtonText}>📊 Export to Excel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => Alert.alert('Coming Soon', 'Email reports will be available soon')}
          >
            <Text style={styles.exportButtonText}>📧 Email Reports</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#800020',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lastCard: {
    marginBottom: 32,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#800020',
    borderColor: '#800020',
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedPeriodText: {
    color: '#FFFFFF',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 14,
    fontWeight: '600',
  },
  positiveChange: {
    color: '#059669',
  },
  negativeChange: {
    color: '#DC2626',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#800020',
  },
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  reportArrow: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  exportButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
});
