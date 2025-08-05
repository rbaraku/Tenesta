import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import Card from './Card';
import { Colors } from '../../constants';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              {this.props.fallbackMessage || 
               'An unexpected error occurred. Please try again.'}
            </Text>
            {__DEV__ && this.state.error && (
              <Text style={styles.errorDetails}>
                {this.state.error.toString()}
              </Text>
            )}
            <Button
              title="Try Again"
              onPress={this.handleRetry}
              style={styles.retryButton}
              variant="outline"
            />
          </View>
        </Card>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  errorDetails: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  retryButton: {
    marginTop: 8,
  },
});

export default ErrorBoundary;