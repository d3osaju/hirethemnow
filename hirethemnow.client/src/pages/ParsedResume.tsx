import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { resumeAPI } from '../services/api';
import ParsedResumeViewer from '../components/ParsedResumeViewer';
import toast from 'react-hot-toast';
import {
    FileText,
    RefreshCw,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader,
    Upload,
    History
} from 'lucide-react';
import type { ParsedResumeContent, ResumeParsingStatus } from '../types';

const ParsedResume: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [parsingStatus, setParsingStatus] = useState<ResumeParsingStatus | null>(null);
    const [parsedContent, setParsedContent] = useState<ParsedResumeContent | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<Array<{
        id: number;
        fileName: string;
        status: string;
        uploadedAt: string;
        parsedAt: string | null;
    }>>([]);

    useEffect(() => {
        if (user) {
            fetchParsingStatus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchParsingStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            const statusResponse = await resumeAPI.getParsingStatus();

            if (statusResponse.success) {
                setParsingStatus(statusResponse.data as ResumeParsingStatus);

                // If completed, fetch the parsed content
                if (statusResponse.data.status === 'completed') {
                    await fetchParsedContent();
                }
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const error = err as { response?: { status?: number } };
                if (error.response?.status === 404) {
                    setError('No resume found. Please upload a resume first.');
                } else {
                    setError('Failed to load resume status. Please try again.');
                }
            } else {
                setError('Failed to load resume status. Please try again.');
            }
            console.error('Error fetching parsing status:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchParsedContent = async () => {
        try {
            const contentResponse = await resumeAPI.getResumeContent();

            if (contentResponse.success) {
                const parsed = JSON.parse(contentResponse.data.parsedContent);
                setParsedContent(parsed);
            }
        } catch (err) {
            console.error('Error fetching parsed content:', err);
            toast.error('Failed to load parsed content');
        }
    };

    const fetchHistory = async () => {
        try {
            const historyResponse = await resumeAPI.getResumeHistory();
            if (historyResponse.success) {
                setHistory(historyResponse.data);
                setShowHistory(true);
            }
        } catch (err) {
            console.error('Error fetching history:', err);
            toast.error('Failed to load history');
        }
    };

    const handleUpload = async (file: File) => {
        try {
            const response = await resumeAPI.uploadResume(file);
            if (response.success) {
                toast.success('Resume uploaded! Parsing in progress...');
                await fetchParsingStatus();
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Failed to upload resume');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-600" />;
            case 'processing':
                return <Loader className="w-5 h-5 text-blue-600 animate-spin" />;
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-600" />;
            case 'failed':
                return <AlertCircle className="w-5 h-5 text-red-600" />;
            default:
                return <FileText className="w-5 h-5 text-gray-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            case 'processing':
                return 'bg-blue-50 border-blue-200 text-blue-800';
            case 'completed':
                return 'bg-green-50 border-green-200 text-green-800';
            case 'failed':
                return 'bg-red-50 border-red-200 text-red-800';
            default:
                return 'bg-gray-50 border-gray-200 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader className="w-16 h-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading your resume...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-3">No Resume Found</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = '.pdf,.doc,.docx';
                                input.onchange = async (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) {
                                        await handleUpload(file);
                                    }
                                };
                                input.click();
                            }}
                            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Upload className="w-5 h-5 mr-2" />
                            Upload Resume
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show processing state
    if (parsingStatus && (parsingStatus.status === 'pending' || parsingStatus.status === 'processing')) {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <div className="text-center">
                            <div className="relative inline-block mb-6">
                                <div className="bg-blue-50 rounded-full w-24 h-24 flex items-center justify-center animate-pulse">
                                    <FileText className="w-12 h-12 text-blue-600" />
                                </div>
                                {parsingStatus.status === 'processing' && (
                                    <div className="absolute top-0 left-0 w-24 h-24">
                                        <Loader className="w-24 h-24 text-blue-600 animate-spin" />
                                    </div>
                                )}
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-3">
                                {parsingStatus.status === 'pending' ? 'Resume Queued for Parsing' : 'Parsing Your Resume...'}
                            </h2>
                            <p className="text-gray-600 mb-2">
                                {parsingStatus.status === 'pending'
                                    ? 'Your resume is in the queue and will be processed shortly.'
                                    : 'Our AI is extracting and structuring your resume content.'}
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                File: {parsingStatus.fileName}
                            </p>
                            <div className="bg-blue-50 rounded-lg p-4 mb-6 max-w-md mx-auto">
                                <p className="text-sm text-gray-700">
                                    This usually takes 10-15 seconds. Feel free to refresh or navigate away.
                                </p>
                            </div>
                            <button
                                onClick={fetchParsingStatus}
                                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <RefreshCw className="w-5 h-5 mr-2" />
                                Check Status
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show failed state
    if (parsingStatus && parsingStatus.status === 'failed') {
        return (
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="bg-white rounded-lg shadow-sm p-8">
                        <div className="text-center">
                            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">Parsing Failed</h2>
                            <p className="text-gray-600 mb-2">
                                {parsingStatus.error || 'An error occurred while parsing your resume.'}
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                File: {parsingStatus.fileName}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => {
                                        const input = document.createElement('input');
                                        input.type = 'file';
                                        input.accept = '.pdf,.doc,.docx';
                                        input.onchange = async (e) => {
                                            const file = (e.target as HTMLInputElement).files?.[0];
                                            if (file) {
                                                await handleUpload(file);
                                            }
                                        };
                                        input.click();
                                    }}
                                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Upload className="w-5 h-5 mr-2" />
                                    Upload New Resume
                                </button>
                                <button
                                    onClick={fetchHistory}
                                    className="inline-flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <History className="w-5 h-5 mr-2" />
                                    View History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show parsed content
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                                <FileText className="w-8 h-8 mr-3 text-blue-600" />
                                Parsed Resume
                            </h1>
                            <p className="mt-2 text-gray-600">
                                AI-extracted and structured resume content
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchHistory}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                            >
                                <History className="w-4 h-4 mr-2" />
                                History
                            </button>
                            <button
                                onClick={fetchParsingStatus}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center text-sm"
                            >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.pdf,.doc,.docx';
                                    input.onchange = async (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) {
                                            await handleUpload(file);
                                        }
                                    };
                                    input.click();
                                }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Upload New
                            </button>
                        </div>
                    </div>
                </div>

                {/* Status Badge */}
                {parsingStatus && (
                    <div className={`mb-6 rounded-lg border p-4 ${getStatusColor(parsingStatus.status)}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {getStatusIcon(parsingStatus.status)}
                                <div>
                                    <p className="font-medium capitalize">{parsingStatus.status}</p>
                                    <p className="text-sm">
                                        Uploaded: {new Date(parsingStatus.uploadedAt).toLocaleString()}
                                        {parsingStatus.parsedAt && ` • Parsed: ${new Date(parsingStatus.parsedAt).toLocaleString()}`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Parsed Content */}
                {parsedContent && parsingStatus && (
                    <ParsedResumeViewer
                        content={parsedContent}
                        fileName={parsingStatus.fileName}
                        parsedAt={parsingStatus.parsedAt || parsingStatus.uploadedAt}
                    />
                )}

                {/* History Modal */}
                {showHistory && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-900">Resume History</h3>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="p-6">
                                {history.length > 0 ? (
                                    <div className="space-y-4">
                                        {history.map((item) => (
                                            <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        {getStatusIcon(item.status)}
                                                        <div>
                                                            <p className="font-medium text-gray-900">{item.fileName}</p>
                                                            <p className="text-sm text-gray-600">
                                                                Uploaded: {new Date(item.uploadedAt).toLocaleString()}
                                                            </p>
                                                            {item.parsedAt && (
                                                                <p className="text-sm text-gray-600">
                                                                    Parsed: {new Date(item.parsedAt).toLocaleString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-gray-500 py-8">No history found</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ParsedResume;
