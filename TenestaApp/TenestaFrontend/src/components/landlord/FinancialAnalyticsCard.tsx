import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  ScrollView,
  Dimensions,
} from 'react-native';
import Card from '../common/Card';
import Button from '../common/Button';
import { Colors } from '../../constants';
import { FinancialSummary } from '../../types';

interface FinancialAnalyticsCardProps {
  financialData?: FinancialSummary;
  isLoading?: boolean;
  onViewReports?: () => void;
  onViewExpenses?: () => void;
  style?: ViewStyle;
}

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

const FinancialAnalyticsCard: React.FC<FinancialAnalyticsCardProps> = ({
  financialData,
  isLoading = false,
  onViewReports,
  onViewExpenses,
  style,
}) => {
  if (isLoading) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading financial data...</Text>
        </View>
      </Card>
    );
  }

  if (!financialData) {
    return (
      <Card style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.cardTitle}>Financial Analytics</Text>
          <Text style={styles.emptyText}>No financial data available</Text>
        </View>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${Math.round(value)}%`;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 5) return Colors.success;
    if (growth > 0) return Colors.info;
    if (growth > -5) return Colors.warning;
    return Colors.error;
  };

  const profitMargin = financialData.monthlyIncome > 0 
    ? (financialData.netIncome / financialData.monthlyIncome) * 100 
    : 0;

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 20) return Colors.success;
    if (margin >= 10) return Colors.warning;
    return Colors.error;
  };

  // Sort expense categories by amount
  const sortedExpenses = [...financialData.expenseCategories]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4); // Show top 4 categories

  return (
    <Card style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.cardTitle}>Financial Analytics</Text>
        <Button
          title="View Reports"
          onPress={onViewReports}
          variant="text"
          size="small"
        />
      </View>

      {/* Monthly Summary */}
      <View style={styles.monthlySection}>
        <Text style={styles.sectionTitle}>This Month</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Income</Text>
            <Text style={[styles.summaryValue, styles.incomeValue]}>
              {formatCurrency(financialData.monthlyIncome)}
            </Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Expenses</Text>
            <Text style={[styles.summaryValue, styles.expenseValue]}>
              {formatCurrency(financialData.monthlyExpenses)}
            </Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net Income</Text>
            <Text style={[
              styles.summaryValue,
              financialData.netIncome >= 0 ? styles.positiveValue : styles.negativeValue
            ]}>
              {formatCurrency(financialData.netIncome)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Key Metrics */}
      <View style={styles.metricsSection}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Profit Margin</Text>
          <Text style={[styles.metricValue, { color: getProfitMarginColor(profitMargin) }]}>
            {Math.round(profitMargin)}%
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>YTD Income</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(financialData.ytdIncome)}
          </Text>
        </View>
        
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Income Growth</Text>
          <Text style={[styles.metricValue, { color: getGrowthColor(financialData.incomeGrowth) }]}>
            {formatPercent(financialData.incomeGrowth)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Expense Breakdown */}
      <View style={styles.expensesSection}>
        <View style={styles.expensesHeader}>
          <Text style={styles.sectionTitle}>Top Expenses</Text>
          <Button
            title="View All"
            onPress={onViewExpenses}
            variant="text"
            size="small"
          />
        </View>
        
        <ScrollView 
          style={styles.expensesScrollView}
          showsVerticalScrollIndicator={false}
        >
          {sortedExpenses.map((expense, index) => (
            <View key={expense.category} style={styles.expenseItem}>
              <View style={styles.expenseInfo}>
                <Text style={styles.expenseCategory}>
                  {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
                </Text>
                <View style={styles.expenseAmountRow}>
                  <Text style={styles.expenseAmount}>
                    {formatCurrency(expense.amount)}
                  </Text>
                  <Text style={styles.expensePercentage}>
                    ({expense.percentage}%)
                  </Text>
                </View>
              </View>
              
              <View style={styles.expenseBar}>
                <View 
                  style={[
                    styles.expenseBarFill, 
                    { 
                      width: `${expense.percentage}%`,
                      backgroundColor: index === 0 ? Colors.primary : 
                                     index === 1 ? Colors.secondary :
                                     index === 2 ? Colors.info : Colors.textLight
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Performance Alerts */}
      {profitMargin < 10 && (
        <View style={styles.performanceAlert}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>⚠️</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              Low profit margin ({Math.round(profitMargin)}%)
            </Text>
            <Text style={styles.alertSubtitle}>
              Consider reviewing expenses or adjusting rent prices
            </Text>
          </View>
        </View>
      )}

      {financialData.incomeGrowth < -10 && (
        <View style={styles.performanceAlert}>
          <View style={styles.alertIcon}>
            <Text style={styles.alertIconText}>📉</Text>
          </View>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>
              Income decline ({formatPercent(financialData.incomeGrowth)})
            </Text>
            <Text style={styles.alertSubtitle}>
              Review occupancy rates and market pricing
            </Text>
          </View>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: isTablet ? 24 : 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '600',
    color: Colors.text,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  monthlySection: {
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: 'bold',
  },
  incomeValue: {
    color: Colors.success,
  },
  expenseValue: {
    color: Colors.error,
  },
  positiveValue: {
    color: Colors.success,
  },
  negativeValue: {
    color: Colors.error,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 16,
  },
  metricsSection: {
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  expensesSection: {
    marginBottom: 16,
  },
  expensesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  expensesScrollView: {
    maxHeight: isTablet ? 160 : 120,
  },
  expenseItem: {
    marginBottom: 12,
  },
  expenseInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  expenseCategory: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  expenseAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseAmount: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  expensePercentage: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  expenseBar: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  expenseBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  performanceAlert: {
    flexDirection: 'row',
    backgroundColor: Colors.warning + '15',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
    marginBottom: 8,
  },
  alertIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  alertIconText: {
    fontSize: 20,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});

export default FinancialAnalyticsCard;