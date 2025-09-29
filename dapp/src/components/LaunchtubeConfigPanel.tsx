/**
 * Launchtube Configuration Panel
 * React component for managing Launchtube settings and status
 */

import { useState, useEffect } from 'react';
import {
    isLaunchtubeEnabled,
    checkLaunchtubeHealth,
    getLaunchtubeCredits
} from '../service/LaunchtubeService';
import {
    getLaunchtubeConfig,
    getLaunchtubeInstructions,
    formatCredits,
    getCreditStatus,
    isValidLaunchtubeToken
} from '../utils/launchtubeConfig';

interface LaunchtubeStatus {
    enabled: boolean;
    healthy: boolean;
    credits?: number;
    error?: string;
    loading: boolean;
}

export default function LaunchtubeConfigPanel() {
    const [status, setStatus] = useState<LaunchtubeStatus>({
        enabled: false,
        healthy: false,
        loading: true
    });
    const [showInstructions, setShowInstructions] = useState(false);

    const config = getLaunchtubeConfig();
    const instructions = getLaunchtubeInstructions();

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        setStatus(prev => ({ ...prev, loading: true }));

        try {
            const enabled = isLaunchtubeEnabled();

            if (!enabled) {
                setStatus({
                    enabled: false,
                    healthy: false,
                    loading: false
                });
                return;
            }

            const health = await checkLaunchtubeHealth();

            setStatus({
                enabled: true,
                healthy: health.isHealthy,
                credits: health.credits,
                error: health.error,
                loading: false
            });
        } catch (error: any) {
            setStatus({
                enabled: config.enabled,
                healthy: false,
                error: error.message,
                loading: false
            });
        }
    };

    const refreshStatus = () => {
        checkStatus();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const renderStatusIndicator = () => {
        if (status.loading) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Checking...</span>
                </div>
            );
        }

        if (!status.enabled) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-sm text-gray-600">Disabled</span>
                </div>
            );
        }

        if (!status.healthy) {
            return (
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-red-600">Error</span>
                    {status.error && (
                        <span className="text-xs text-red-500">({status.error})</span>
                    )}
                </div>
            );
        }

        const creditStatus = status.credits ? getCreditStatus(status.credits) : null;

        return (
            <div className="flex items-center gap-2">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: creditStatus?.color || '#10b981' }}
                ></div>
                <span className="text-sm text-green-600">Active</span>
                {status.credits !== undefined && (
                    <span className="text-sm font-medium">
                        {formatCredits(status.credits)} credits
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="launchtube-config-panel bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Launchtube Status</h3>
                <button
                    onClick={refreshStatus}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                    disabled={status.loading}
                >
                    Refresh
                </button>
            </div>

            <div className="space-y-4">
                {/* Status Display */}
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    {renderStatusIndicator()}
                </div>

                {/* Configuration Info */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Enabled:</span>
                        <span className={`text-sm ${status.enabled ? 'text-green-600' : 'text-gray-500'}`}>
                            {status.enabled ? 'Yes' : 'No'}
                        </span>
                    </div>

                    {config.token && (
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Token:</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-mono text-gray-600">
                                    {isValidLaunchtubeToken(config.token) ? '••••••••' : 'Invalid'}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(config.token!)}
                                    className="text-xs text-blue-600 hover:text-blue-800"
                                    title="Copy token"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Credits Information */}
                {status.enabled && status.healthy && status.credits !== undefined && (
                    <div className="bg-gray-50 rounded-md p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Credits Available:</span>
                            <span className="text-lg font-bold text-gray-900">
                                {status.credits.toLocaleString()}
                            </span>
                        </div>
                        {(() => {
                            const creditStatus = getCreditStatus(status.credits);
                            return (
                                <p className="text-xs" style={{ color: creditStatus.color }}>
                                    {creditStatus.message}
                                </p>
                            );
                        })()}
                    </div>
                )}

                {/* Setup Instructions */}
                {!status.enabled && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-blue-900">Setup Launchtube</h4>
                            <button
                                onClick={() => setShowInstructions(!showInstructions)}
                                className="text-sm text-blue-600 hover:text-blue-800"
                            >
                                {showInstructions ? 'Hide' : 'Show'} Instructions
                            </button>
                        </div>

                        {showInstructions && (
                            <div className="space-y-3">
                                <p className="text-sm text-blue-800">
                                    Launchtube eliminates the need for XLM fees and handles transaction complexity automatically.
                                </p>

                                <ol className="text-sm text-blue-800 space-y-1">
                                    {instructions.steps.map((step, index) => (
                                        <li key={index} className="flex gap-2">
                                            <span className="font-medium">{index + 1}.</span>
                                            <span>{step}</span>
                                        </li>
                                    ))}
                                </ol>

                                <div className="flex gap-2 mt-3">
                                    <a
                                        href={instructions.claimUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Generate Token
                                    </a>
                                    <a
                                        href={instructions.activateUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                    >
                                        Activate Token
                                    </a>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error Display */}
                {status.error && status.enabled && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                        <h4 className="text-sm font-medium text-red-900 mb-1">Error</h4>
                        <p className="text-sm text-red-800">{status.error}</p>
                    </div>
                )}

                {/* Benefits */}
                {status.enabled && status.healthy && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-3">
                        <h4 className="text-sm font-medium text-green-900 mb-2">Benefits Active</h4>
                        <ul className="text-sm text-green-800 space-y-1">
                            <li>• No XLM fees required</li>
                            <li>• Automatic retry handling</li>
                            <li>• Simplified transaction flow</li>
                            <li>• Network optimization</li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}