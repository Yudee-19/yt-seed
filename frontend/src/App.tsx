import { useState, useEffect } from "react";
import { pipelineAPI } from "./services/api";
import type { ProgressResponse, DownloadResponse, Channel } from "./types/api";

function App() {
    const [sheetUrl, setSheetUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [_taskId, setTaskId] = useState<string | null>(null);
    const [message, setMessage] = useState("");
    const [progress, setProgress] = useState<ProgressResponse | null>(null);
    const [channels, setChannels] = useState<Channel[]>([]);
    const [downloadLoading, setDownloadLoading] = useState(false);

    // Poll for progress updates every 5 seconds
    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const data = await pipelineAPI.getProgress();
                setProgress(data);
            } catch (error) {
                console.error("Error fetching progress:", error);
            }
        };

        fetchProgress();
        const interval = setInterval(fetchProgress, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleStartPipeline = async () => {
        if (!sheetUrl.trim()) {
            setMessage("Please enter a valid Google Sheets URL");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const response = await pipelineAPI.startPipeline(sheetUrl);
            setTaskId(response.task_id);
            setMessage(`✅ ${response.message} (Task ID: ${response.task_id})`);
            setSheetUrl("");
        } catch (error: any) {
            setMessage(
                `❌ Error: ${error.response?.data?.detail || error.message}`
            );
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadChannels = async () => {
        setDownloadLoading(true);
        setMessage("");

        try {
            const response: DownloadResponse =
                await pipelineAPI.downloadTier1And2();

            if (response.status === "success" && response.channels) {
                setChannels(response.channels);
                setMessage(`✅ Downloaded ${response.total_channels} channels`);
            } else if (response.status === "empty") {
                setMessage(`ℹ️ ${response.message}`);
                setChannels([]);
            }
        } catch (error: any) {
            setMessage(
                `❌ Error: ${error.response?.data?.detail || error.message}`
            );
        } finally {
            setDownloadLoading(false);
        }
    };

    const handleExportToCSV = () => {
        if (channels.length === 0) return;

        const headers = [
            "Tier",
            "Channel Name",
            "Channel URL",
            "Reason",
            "Run Tag",
        ];
        const rows = channels.map((ch) => [
            ch.tier,
            ch.Discovered_Channel_Name,
            ch.Discovered_Channel_URL,
            ch.reason,
            ch.Discovered_From_Run || ch.run_tag || "",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tier1_tier2_channels_${
            new Date().toISOString().split("T")[0]
        }.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800";
            case "started":
                return "bg-blue-100 text-blue-800";
            case "skipped":
                return "bg-yellow-100 text-yellow-800";
            case "failed":
                return "bg-red-100 text-red-800";
            case "paused_due_to_quota":
                return "bg-orange-100 text-orange-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🚀 Kajkarma AI Pipeline
                    </h1>
                    <p className="text-gray-600">
                        YouTube Channel Discovery & Analysis Platform
                    </p>
                </div>

                {/* Start Pipeline Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Start New Pipeline
                    </h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter Google Sheets URL..."
                            value={sheetUrl}
                            onChange={(e) => setSheetUrl(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            disabled={loading}
                        />
                        <button
                            onClick={handleStartPipeline}
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Starting..." : "Start Pipeline"}
                        </button>
                    </div>
                    {message && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                            {message}
                        </div>
                    )}
                </div>

                {/* Progress Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Pipeline Progress
                    </h2>
                    {progress?.status === "success" && progress.data ? (
                        <div className="space-y-4">
                            {Object.entries(progress.data).map(
                                ([status, runTags]) => (
                                    <div key={status}>
                                        <h3 className="text-sm font-medium text-gray-700 mb-2 capitalize">
                                            {status.replace(/_/g, " ")}
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {runTags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                                                        status
                                                    )}`}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500">
                            No progress data available yet.
                        </p>
                    )}
                </div>

                {/* Download Section */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Download Results
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Download all Tier 1 and Tier 2 channels from completed
                        runs
                    </p>
                    <button
                        onClick={handleDownloadChannels}
                        disabled={downloadLoading}
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {downloadLoading
                            ? "Loading..."
                            : "Download Tier 1 & 2 Channels"}
                    </button>
                </div>

                {/* Results Table */}
                {channels.length > 0 && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Results ({channels.length} channels)
                            </h2>
                            <button
                                onClick={handleExportToCSV}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                Export to CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tier
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Channel Name
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            URL
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Reason
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Run Tag
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {channels.map((channel, index) => (
                                        <tr
                                            key={index}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        channel.tier === 1
                                                            ? "bg-purple-100 text-purple-800"
                                                            : "bg-blue-100 text-blue-800"
                                                    }`}
                                                >
                                                    Tier {channel.tier}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {
                                                    channel.Discovered_Channel_Name
                                                }
                                            </td>
                                            <td className="px-4 py-3 text-sm text-blue-600">
                                                <a
                                                    href={
                                                        channel.Discovered_Channel_URL
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:underline"
                                                >
                                                    View Channel
                                                </a>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                                                {channel.reason}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {channel.Discovered_From_Run ||
                                                    channel.run_tag ||
                                                    "N/A"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
