import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import metroService from './src/services/gtfs/metroService';
import testGTFSService from './src/services/gtfs/testService';
import verifyRealData from './src/services/gtfs/verifyRealData';
import testOBAService from './src/services/onebusaway/testObaService';
import obaService from './src/services/onebusaway/obaService';
import testSTService from './src/services/soundtransit/testStService';

export default function App() {
  const [status, setStatus] = useState('Initializing...');
  const [routesCount, setRoutesCount] = useState(0);
  const [stopsCount, setStopsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [testResults, setTestResults] = useState('');

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      setStatus('Loading GTFS data...');
      setIsLoading(true);

      // Initialize the service (loads from storage or fetches)
      const initialized = await metroService.initialize();

      if (initialized) {
        const routes = metroService.getRoutes();
        const stops = metroService.stops || [];
        setRoutesCount(routes.length);
        setStopsCount(stops.length);
        setStatus('GTFS data loaded successfully!');
      } else {
        setStatus('Failed to load GTFS data');
      }
    } catch (error) {
      console.error('Error initializing:', error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runTests = async () => {
    setTestResults('Running tests...\n');
    setIsLoading(true);

    try {
      // Capture console.log output
      const originalLog = console.log;
      let logOutput = '';

      console.log = (...args) => {
        const message = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ');
        logOutput += message + '\n';
        originalLog(...args);
      };

      await testGTFSService();

      console.log = originalLog;
      setTestResults(logOutput || 'Tests completed (check console for details)');
    } catch (error) {
      setTestResults(`Test error: ${error.message}\n${error.stack}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Seattle Wayfare</Text>
        <Text style={styles.subtitle}>Intelligent Transit Companion</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GTFS Service Status</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" style={styles.loader} />
          ) : null}
          <Text style={styles.statusText}>{status}</Text>

          {routesCount > 0 && (
            <View style={styles.statsContainer}>
              <Text style={styles.statText}>📊 Routes: {routesCount.toLocaleString()}</Text>
              <Text style={styles.statText}>📍 Stops: {stopsCount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={runTests}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Run GTFS Tests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
          onPress={async () => {
            setTestResults('Verifying real data...\n');
            setIsLoading(true);
            try {
              const originalLog = console.log;
              let logOutput = '';
              console.log = (...args) => {
                const message = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                logOutput += message + '\n';
                originalLog(...args);
              };
              await verifyRealData();
              console.log = originalLog;
              setTestResults(logOutput);
            } catch (error) {
              setTestResults(`Verification error: ${error.message}`);
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Verify Real Data</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
          onPress={async () => {
            setTestResults('Testing OneBusAway API...\n');
            setIsLoading(true);
            try {
              const originalLog = console.log;
              let logOutput = '';
              console.log = (...args) => {
                const message = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                logOutput += message + '\n';
                originalLog(...args);
              };
              await testOBAService();
              console.log = originalLog;
              setTestResults(logOutput);
            } catch (error) {
              setTestResults(`OBA Test error: ${error.message}\n${error.stack}`);
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {obaService.isConfigured() ? 'Test OneBusAway API' : 'Test OBA (No API Key)'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
          onPress={async () => {
            setTestResults('Testing Sound Transit API...\n');
            setIsLoading(true);
            try {
              const originalLog = console.log;
              let logOutput = '';
              console.log = (...args) => {
                const message = args.map(arg => 
                  typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
                ).join(' ');
                logOutput += message + '\n';
                originalLog(...args);
              };
              await testSTService();
              console.log = originalLog;
              setTestResults(logOutput);
            } catch (error) {
              setTestResults(`ST Test error: ${error.message}\n${error.stack}`);
            } finally {
              setIsLoading(false);
            }
          }}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Test Sound Transit Alerts</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, isLoading && styles.buttonDisabled]}
          onPress={initializeService}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>Reload GTFS Data</Text>
        </TouchableOpacity>

        {testResults ? (
          <View style={styles.testResults}>
            <Text style={styles.testResultsTitle}>Test Results:</Text>
            <Text style={styles.testResultsText}>{testResults}</Text>
          </View>
        ) : null}

        <Text style={styles.infoText}>
          💡 Metro bundler is running - changes will hot reload automatically!
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E3A8A',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E5E7EB',
    marginBottom: 30,
  },
  section: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 12,
  },
  loader: {
    marginBottom: 12,
  },
  statsContainer: {
    marginTop: 8,
  },
  statText: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonSecondary: {
    backgroundColor: '#6B7280',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  testResults: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  testResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  testResultsText: {
    fontSize: 12,
    color: '#E5E7EB',
    fontFamily: 'monospace',
  },
  infoText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 20,
    textAlign: 'center',
  },
});

