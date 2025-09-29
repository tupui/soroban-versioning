/**
 * Launchtube Integration Test Utilities
 * Helper functions for testing Launchtube functionality
 */

import { 
  isLaunchtubeEnabled, 
  checkLaunchtubeHealth, 
  getLaunchtubeCredits 
} from '../service/LaunchtubeService';
import { 
  getLaunchtubeConfig, 
  isValidLaunchtubeToken 
} from './launchtubeConfig';

export interface LaunchtubeTestResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Test Launchtube configuration
 */
export async function testLaunchtubeConfig(): Promise<LaunchtubeTestResult> {
  try {
    const config = getLaunchtubeConfig();
    
    if (!config.enabled) {
      return {
        success: false,
        message: "Launchtube is not enabled. Set PUBLIC_USE_LAUNCHTUBE=true in your .env file."
      };
    }

    if (!config.token) {
      return {
        success: false,
        message: "No Launchtube token configured. Set PUBLIC_LAUNCHTUBE_TOKEN in your .env file."
      };
    }

    if (!isValidLaunchtubeToken(config.token)) {
      return {
        success: false,
        message: "Invalid Launchtube token format. Token should be a valid JWT."
      };
    }

    return {
      success: true,
      message: "Launchtube configuration is valid",
      details: {
        enabled: config.enabled,
        hasToken: !!config.token,
        tokenValid: true
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Configuration test failed: ${error.message}`
    };
  }
}

/**
 * Test Launchtube connectivity
 */
export async function testLaunchtubeConnectivity(): Promise<LaunchtubeTestResult> {
  try {
    if (!isLaunchtubeEnabled()) {
      return {
        success: false,
        message: "Launchtube is not enabled"
      };
    }

    const health = await checkLaunchtubeHealth();
    
    if (!health.isHealthy) {
      return {
        success: false,
        message: `Launchtube connectivity failed: ${health.error || 'Unknown error'}`
      };
    }

    return {
      success: true,
      message: "Launchtube connectivity successful",
      details: {
        credits: health.credits,
        healthy: health.isHealthy
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Connectivity test failed: ${error.message}`
    };
  }
}

/**
 * Test Launchtube credits
 */
export async function testLaunchtubeCredits(): Promise<LaunchtubeTestResult> {
  try {
    if (!isLaunchtubeEnabled()) {
      return {
        success: false,
        message: "Launchtube is not enabled"
      };
    }

    const credits = await getLaunchtubeCredits();
    
    if (credits <= 0) {
      return {
        success: false,
        message: "No Launchtube credits available"
      };
    }

    if (credits < 1000) {
      return {
        success: true,
        message: `Low credits warning: ${credits} stroops remaining`,
        details: { credits, level: 'low' }
      };
    }

    return {
      success: true,
      message: `Credits available: ${credits} stroops`,
      details: { credits, level: 'good' }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Credits test failed: ${error.message}`
    };
  }
}

/**
 * Run all Launchtube tests
 */
export async function runAllLaunchtubeTests(): Promise<{
  overall: boolean;
  results: {
    config: LaunchtubeTestResult;
    connectivity: LaunchtubeTestResult;
    credits: LaunchtubeTestResult;
  };
}> {
  const results = {
    config: await testLaunchtubeConfig(),
    connectivity: await testLaunchtubeConnectivity(),
    credits: await testLaunchtubeCredits()
  };

  const overall = Object.values(results).every(result => result.success);

  return { overall, results };
}

/**
 * Console-friendly test runner
 */
export async function runLaunchtubeTests(): Promise<void> {
  console.group('🚀 Launchtube Integration Tests');
  
  const { overall, results } = await runAllLaunchtubeTests();
  
  // Configuration test
  console.group('⚙️ Configuration');
  if (results.config.success) {
    console.log('✅', results.config.message);
  } else {
    console.error('❌', results.config.message);
  }
  if (results.config.details) {
    console.table(results.config.details);
  }
  console.groupEnd();
  
  // Connectivity test
  console.group('🌐 Connectivity');
  if (results.connectivity.success) {
    console.log('✅', results.connectivity.message);
  } else {
    console.error('❌', results.connectivity.message);
  }
  if (results.connectivity.details) {
    console.table(results.connectivity.details);
  }
  console.groupEnd();
  
  // Credits test
  console.group('💰 Credits');
  if (results.credits.success) {
    console.log('✅', results.credits.message);
  } else {
    console.error('❌', results.credits.message);
  }
  if (results.credits.details) {
    console.table(results.credits.details);
  }
  console.groupEnd();
  
  // Overall result
  if (overall) {
    console.log('🎉 All Launchtube tests passed!');
  } else {
    console.warn('⚠️ Some Launchtube tests failed. Check configuration and connectivity.');
  }
  
  console.groupEnd();
}

/**
 * Quick test function for browser console
 */
(window as any).testLaunchtube = runLaunchtubeTests;