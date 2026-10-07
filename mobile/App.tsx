import React, { useRef, useState } from 'react';
import { StyleSheet, SafeAreaView, View, ActivityIndicator, Text, TouchableOpacity, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const WEB_APP_URL = 'https://smartchama.vercel.app';

export default function App() {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleRetry = () => {
    setError(false);
    setLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0F0C" />
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorMessage}>Unable to connect to SmartChama. Please check your network.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_APP_URL }}
          style={styles.webview}
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError(true);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.loadingText}>Loading SmartChama...</Text>
            </View>
          )}
          allowsBackForwardNavigationGestures={true}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F0C',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0B0F0C',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0B0F0C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#8FA196',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#0B0F0C',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  errorMessage: {
    color: '#8FA196',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
