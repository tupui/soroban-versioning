/**
 * Launchtube Test Component
 * Simple component to test Launchtube integration
 */

import { useState } from 'react';
import { runAllLaunchtubeTests } from '../utils/testLaunchtube';

export default function LaunchtubeTest() {
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunning, setIsRunning] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    try {
      const results = await runAllLaunchtubeTests();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
      setTestResults({
        overall: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="launchtube-test bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Launchtube Integration Test</h3>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Running...' : 'Run Tests'}
        </button>
      </div>

      {testResults && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div className={`p-3 rounded-md ${testResults.overall ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getStatusIcon(testResults.overall)}</span>
              <span className={`font-medium ${getStatusColor(testResults.overall)}`}>
                {testResults.overall ? 'All tests passed!' : 'Some tests failed'}
              </span>
            </div>
          </div>

          {/* Individual Test Results */}
          {testResults.results && (
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">Test Results:</h4>
              
              {/* Configuration Test */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <span>{getStatusIcon(testResults.results.config.success)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">Configuration</div>
                  <div className={`text-sm ${getStatusColor(testResults.results.config.success)}`}>
                    {testResults.results.config.message}
                  </div>
                  {testResults.results.config.details && (
                    <pre className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(testResults.results.config.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              {/* Connectivity Test */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <span>{getStatusIcon(testResults.results.connectivity.success)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">Connectivity</div>
                  <div className={`text-sm ${getStatusColor(testResults.results.connectivity.success)}`}>
                    {testResults.results.connectivity.message}
                  </div>
                  {testResults.results.connectivity.details && (
                    <pre className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(testResults.results.connectivity.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>

              {/* Credits Test */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                <span>{getStatusIcon(testResults.results.credits.success)}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">Credits</div>
                  <div className={`text-sm ${getStatusColor(testResults.results.credits.success)}`}>
                    {testResults.results.credits.message}
                  </div>
                  {testResults.results.credits.details && (
                    <pre className="text-xs text-gray-600 mt-1">
                      {JSON.stringify(testResults.results.credits.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {testResults.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-sm text-red-800">
                <strong>Error:</strong> {testResults.error}
              </div>
            </div>
          )}
        </div>
      )}

      {!testResults && !isRunning && (
        <div className="text-sm text-gray-600">
          Click "Run Tests" to verify your Launchtube integration setup.
        </div>
      )}
    </div>
  );
}