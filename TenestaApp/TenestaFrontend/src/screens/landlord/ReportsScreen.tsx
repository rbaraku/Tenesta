import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../../store';
import {
  fetchAnalyticsData,
  setTimeRange,
  setSelectedProperty,
  clearError,
  exportReport,
} from '../../store/slices/reportsSlice';
import { Colors, Spacing, Typography } from '../../constants';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import LoadingState from '../../components/common/LoadingState';

type ReportsScreenProps = {
  navigation: StackNavigationProp<any>;
};

const { width: screenWidth } = Dimensions.get('window');

const ReportsScreen: React.FC<ReportsScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    financialMetrics,
    occupancyMetrics,
    paymentMetrics,
    propertyPerformance,
    monthlyTrends,
    isLoading,
    error,
    selectedTimeRange,
    selectedPropertyId,
    lastUpdated,
  } = useSelector((state: RootState) => state.reports);

  const { properties } = useSelector((state: RootState) => state.property);

  const [refreshing, setRefreshing] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'occupancy' | 'collection'>('revenue');

  useEffect(() => {
    dispatch(fetchAnalyticsData(selectedTimeRange));
  }, [dispatch, selectedTimeRange]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchAnalyticsData(selectedTimeRange));
    setRefreshing(false);
  }, [dispatch, selectedTimeRange]);

  const handleTimeRangeChange = (range: typeof selectedTimeRange) => {
    dispatch(setTimeRange(range));
  };

  const handleExportReport = async (format: 'pdf' | 'csv' | 'excel', reportType: string) => {
    try {
      const result = await dispatch(exportReport({ format, reportType }));
      if (exportReport.fulfilled.match(result)) {
        Alert.alert(
          'Export Successful',
          `Your ${reportType} report has been generated and will be available for download.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Export Failed', 'Unable to generate report. Please try again.');
    }
    setShowExportModal(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {[
        { key: 'month', label: 'This Month' },
        { key: 'quarter', label: '3 Months' },
        { key: 'year', label: 'This Year' },
        { key: 'all', label: 'All Time' },
      ].map(range => (
        <TouchableOpacity
          key={range.key}
          style={[
            styles.timeRangeButton,
            selectedTimeRange === range.key && styles.timeRangeButtonActive
          ]}
          onPress={() => handleTimeRangeChange(range.key as any)}
        >
          <Text style={[
            styles.timeRangeButtonText,
            selectedTimeRange === range.key && styles.timeRangeButtonTextActive
          ]}>
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderFinancialMetrics = () => (
    <Card style={styles.metricsCard}>
      <Text style={styles.cardTitle}>💰 Financial Performance</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatCurrency(financialMetrics?.monthlyRevenue || 0)}</Text>
          <Text style={styles.metricLabel}>Monthly Revenue</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatCurrency(financialMetrics?.netIncome || 0)}</Text>
          <Text style={styles.metricLabel}>Net Income</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatPercent(financialMetrics?.collectionRate || 0)}</Text>
          <Text style={styles.metricLabel}>Collection Rate</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatPercent(financialMetrics?.profitMargin || 0)}</Text>
          <Text style={styles.metricLabel}>Profit Margin</Text>
        </View>
      </View>
    </Card>
  );

  const renderOccupancyMetrics = () => (
    <Card style={styles.metricsCard}>
      <Text style={styles.cardTitle}>🏠 Occupancy Analytics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{occupancyMetrics?.totalUnits || 0}</Text>
          <Text style={styles.metricLabel}>Total Units</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{occupancyMetrics?.occupiedUnits || 0}</Text>
          <Text style={styles.metricLabel}>Occupied</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatPercent(occupancyMetrics?.occupancyRate || 0)}</Text>
          <Text style={styles.metricLabel}>Occupancy Rate</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{occupancyMetrics?.daysVacant || 0}</Text>
          <Text style={styles.metricLabel}>Avg Days Vacant</Text>
        </View>
      </View>
    </Card>
  );

  const renderPaymentMetrics = () => (
    <Card style={styles.metricsCard}>
      <Text style={styles.cardTitle}>💳 Payment Analytics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{paymentMetrics?.totalPayments || 0}</Text>
          <Text style={styles.metricLabel}>Total Payments</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{paymentMetrics?.onTimePayments || 0}</Text>
          <Text style={styles.metricLabel}>On Time</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatPercent(paymentMetrics?.onTimeRate || 0)}</Text>
          <Text style={styles.metricLabel}>On Time Rate</Text>
        </View>
        <View style={styles.metricItem}>
          <Text style={styles.metricValue}>{formatCurrency(paymentMetrics?.totalLateFees || 0)}</Text>
          <Text style={styles.metricLabel}>Late Fees</Text>
        </View>
      </View>
    </Card>
  );

  const renderSimpleChart = () => {
    if (!monthlyTrends || monthlyTrends.length === 0) return null;

    const chartData = monthlyTrends.slice(-6); // Last 6 months
    const maxValue = Math.max(...chartData.map(item => {
      switch (selectedChart) {
        case 'revenue': return item.revenue;
        case 'occupancy': return item.occupancyRate;
        case 'collection': return item.collectionRate;
        default: return item.revenue;
      }
    }));

    return (
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.cardTitle}>
            📈 {selectedChart === 'revenue' ? 'Revenue' : selectedChart === 'occupancy' ? 'Occupancy' : 'Collection'} Trends
          </Text>
          <View style={styles.chartSelector}>
            {[
              { key: 'revenue', label: 'Revenue', icon: '💰' },
              { key: 'occupancy', label: 'Occupancy', icon: '🏠' },
              { key: 'collection', label: 'Collection', icon: '💳' },
            ].map(chart => (
              <TouchableOpacity
                key={chart.key}
                style={[
                  styles.chartButton,
                  selectedChart === chart.key && styles.chartButtonActive
                ]}
                onPress={() => setSelectedChart(chart.key as any)}
              >
                <Text style={styles.chartButtonIcon}>{chart.icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.simpleChart}>
          {chartData.map((item, index) => {
            const value = selectedChart === 'revenue' ? item.revenue : 
                         selectedChart === 'occupancy' ? item.occupancyRate : 
                         item.collectionRate;
            const height = (value / maxValue) * 100;
            
            return (
              <View key={index} style={styles.chartBarContainer}>
                <View style={[styles.chartBar, { height: `${height}%` }]} />
                <Text style={styles.chartLabel}>{item.month}</Text>
                <Text style={styles.chartValue}>
                  {selectedChart === 'revenue' ? formatCurrency(value) : formatPercent(value)}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>
    );
  };

  const renderPropertyPerformance = () => (
    <Card style={styles.propertyCard}>
      <Text style={styles.cardTitle}>🏢 Property Performance</Text>
      {propertyPerformance.slice(0, 5).map((property, index) => (
        <View key={property.propertyId} style={styles.propertyItem}>
          <View style={styles.propertyInfo}>
            <Text style={styles.propertyName}>{property.propertyName}</Text>
            <Text style={styles.propertyAddress}>{property.address}</Text>
          </View>
          <View style={styles.propertyMetrics}>
            <Text style={styles.propertyRevenue}>
              {formatCurrency(property.monthlyRevenue)}
            </Text>
            <Text style={styles.propertyOccupancy}>
              {formatPercent(property.occupancyRate)}
            </Text>
          </View>
        </View>
      ))}
    </Card>
  );

  const renderExportModal = () => (
    <Modal
      visible={showExportModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowExportModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Export Report</Text>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setShowExportModal(false)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.exportSectionTitle}>Report Type</Text>
          {[
            { key: 'financial', label: 'Financial Summary', icon: '💰' },
            { key: 'occupancy', label: 'Occupancy Report', icon: '🏠' },
            { key: 'payment', label: 'Payment Analysis', icon: '💳' },
            { key: 'property', label: 'Property Performance', icon: '🏢' },
            { key: 'complete', label: 'Complete Analytics', icon: '📊' },
          ].map(report => (
            <View key={report.key} style={styles.exportRow}>
              <Text style={styles.exportLabel}>
                {report.icon} {report.label}
              </Text>
              <View style={styles.exportButtons}>
                <Button
                  title="PDF"
                  variant="outline"
                  size="small"
                  onPress={() => handleExportReport('pdf', report.key)}
                  style={styles.exportButton}
                />
                <Button
                  title="CSV"
                  variant="outline"
                  size="small"
                  onPress={() => handleExportReport('csv', report.key)}
                  style={styles.exportButton}
                />
                <Button
                  title="Excel"
                  variant="outline"
                  size="small"
                  onPress={() => handleExportReport('excel', report.key)}
                  style={styles.exportButton}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    </Modal>
  );

  if (isLoading && !financialMetrics) {
    return <LoadingState message="Loading analytics data..." />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📊 Reports & Analytics</Text>
        <Text style={styles.subtitle}>
          {lastUpdated && `Last updated: ${new Date(lastUpdated).toLocaleString()}`}
        </Text>
      </View>

      {/* Time Range Selector */}
      {renderTimeRangeSelector()}

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Financial Metrics */}
        {financialMetrics && renderFinancialMetrics()}

        {/* Occupancy Metrics */}
        {occupancyMetrics && renderOccupancyMetrics()}

        {/* Payment Metrics */}
        {paymentMetrics && renderPaymentMetrics()}

        {/* Chart */}
        {renderSimpleChart()}

        {/* Property Performance */}
        {propertyPerformance.length > 0 && renderPropertyPerformance()}

        {/* Export Button */}
        <Card style={styles.exportCard}>
          <Text style={styles.cardTitle}>📄 Export Reports</Text>
          <Text style={styles.exportDescription}>
            Generate detailed reports in PDF, CSV, or Excel format for accounting and analysis.
          </Text>
          <Button
            title="Export Reports"
            variant="primary"
            onPress={() => setShowExportModal(true)}
            style={styles.exportMainButton}
          />
        </Card>

        {/* Insights Section */}
        <Card style={styles.insightsCard}>
          <Text style={styles.cardTitle}>🔍 Key Insights</Text>
          <View style={styles.insights}>
            {financialMetrics && (
              <Text style={styles.insightItem}>
                • Collection rate of {formatPercent(financialMetrics.collectionRate)} is{' '}
                {financialMetrics.collectionRate > 90 ? 'excellent' : 
                 financialMetrics.collectionRate > 80 ? 'good' : 'needs improvement'}
              </Text>
            )}
            {occupancyMetrics && (
              <Text style={styles.insightItem}>
                • Occupancy rate of {formatPercent(occupancyMetrics.occupancyRate)} with{' '}
                {occupancyMetrics.vacantUnits} vacant units
              </Text>
            )}
            {paymentMetrics && (
              <Text style={styles.insightItem}>
                • {paymentMetrics.overduePayments} overdue payments requiring attention
              </Text>
            )}
            <Text style={styles.insightItem}>
              • Consider reviewing properties with occupancy below 85% for optimization
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Export Modal */}
      {renderExportModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.xs,
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  timeRangeButtonText: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: 'bold',
  },
  timeRangeButtonTextActive: {
    color: Colors.white,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  metricsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  metricValue: {
    ...Typography.h2,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
  },
  chartCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  chartSelector: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  chartButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chartButtonIcon: {
    fontSize: 16,
  },
  simpleChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingHorizontal: Spacing.sm,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    backgroundColor: Colors.primary,
    width: 20,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  chartLabel: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  chartValue: {
    ...Typography.caption,
    color: Colors.text,
    fontSize: 10,
  },
  propertyCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyName: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  propertyAddress: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  propertyMetrics: {
    alignItems: 'flex-end',
  },
  propertyRevenue: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  propertyOccupancy: {
    ...Typography.caption,
    color: Colors.text,
  },
  exportCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  exportDescription: {
    ...Typography.body,
    color: Colors.textLight,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  exportMainButton: {
    width: '100%',
  },
  insightsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  insights: {
    gap: Spacing.sm,
  },
  insightItem: {
    ...Typography.body,
    color: Colors.text,
    lineHeight: 24,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    ...Typography.body,
    color: Colors.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  exportSectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  exportLabel: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  exportButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  exportButton: {
    minWidth: 60,
  },
});

export default ReportsScreen;