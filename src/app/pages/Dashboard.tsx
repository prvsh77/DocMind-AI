import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { FileText, FileCheck, Landmark, BarChart3, Database, MessageSquare, TrendingUp, Clock, ArrowRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useDocumentStatsQuery, useDocumentsQuery } from "../api/hooks";

const TYPE_COLORS: Record<string, string> = {
  "Invoice": "#10b981",       // green
  "Contract": "#8b5cf6",      // purple
  "Receipt": "#f97316",       // orange
  "Bank Statement": "#6366f1",// indigo
  "Resume": "#ec4899",        // pink
  "Other": "#6b7280"          // gray
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, isError } = useDocumentStatsQuery();
  const { data: docsData, isLoading: docsLoading } = useDocumentsQuery();

  if (statsLoading || docsLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-28 animate-pulse bg-gray-50 border-gray-100" />
          ))}
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="h-80 animate-pulse bg-gray-50 border-gray-100" />
          <Card className="h-80 animate-pulse bg-gray-50 border-gray-100" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-600 font-medium">
        Failed to load dashboard metrics. Please verify the backend connection.
      </div>
    );
  }

  // Filter processing queue from real documents
  const processingQueue = (docsData?.items || []).filter(
    (d) => d.status.toLowerCase() === "uploaded" || d.status.toLowerCase() === "processing"
  );

  const statsItems = [
    { name: "Total Documents", value: stats.totalDocuments, icon: FileText, change: "All uploads", color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Processed Success", value: stats.documentsProcessed, icon: FileCheck, change: "OCR extracted", color: "text-green-600", bg: "bg-green-50" },
    { name: "Avg AI Confidence", value: `${stats.averageConfidence}%`, icon: Database, change: "Extraction accuracy", color: "text-purple-600", bg: "bg-purple-50" },
    { name: "Semantic Searches", value: stats.totalSearches, icon: BarChart3, change: "Queries run", color: "text-orange-600", bg: "bg-orange-50" },
    { name: "AI Chats", value: stats.totalAIChats, icon: MessageSquare, change: "RAG sessions", color: "text-indigo-600", bg: "bg-indigo-50" },
    { name: "Unique Types", value: Object.keys(stats.documentTypes).length, icon: Landmark, change: "Classified categories", color: "text-pink-600", bg: "bg-pink-50" },
  ];

  // Map type distribution charts color keys
  const pieData = stats.charts.documentTypeDistribution.map((item: any) => ({
    name: item.type,
    value: item.value,
    color: TYPE_COLORS[item.type] || "#6b7280"
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your documents.</p>
        </div>
        <button
          onClick={() => navigate("/app/upload")}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
        >
          Upload Documents
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statsItems.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.name}
              className="hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150 cursor-pointer"
              onClick={() => navigate("/app/documents")}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.name}
                </CardTitle>
                <div className={`p-1.5 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload trend */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader>
            <CardTitle>Document Upload Trend</CardTitle>
            <CardDescription>Monthly document uploads over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.charts.uploadsPerMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.charts.uploadsPerMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
                No uploads history yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document type distribution */}
        <Card className="hover:shadow-sm transition-shadow">
          <CardHeader>
            <CardTitle>Document Distribution</CardTitle>
            <CardDescription>Breakdown by document type</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-sm text-gray-500">
                No documents found to categorize.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Uploads */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Uploads</CardTitle>
            <CardDescription>Latest documents processed</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentUploads.length > 0 ? (
              <div className="space-y-1">
                {stats.recentUploads.map((upload) => (
                  <div
                    key={upload.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer active:bg-gray-100 transition-colors"
                    onClick={() => navigate(`/app/documents/${upload.id}`)}
                  >
                    <div className="flex-shrink-0 w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{upload.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{upload.uploadedAt}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        upload.status.toLowerCase() === "completed"
                          ? "bg-green-100 text-green-700"
                          : upload.status.toLowerCase() === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {upload.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-12">No recent documents uploaded.</p>
            )}
          </CardContent>
        </Card>

        {/* Processing Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Active Processing Status</CardTitle>
            <CardDescription>Documents currently being analyzed in pipeline</CardDescription>
          </CardHeader>
          <CardContent>
            {processingQueue.length > 0 ? (
              <div className="space-y-6">
                {processingQueue.map((item) => (
                  <div key={item.id}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm truncate max-w-[70%]">{item.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        item.status.toLowerCase() === "processing" ? "bg-yellow-50 text-yellow-700 border border-yellow-200 animate-pulse" : "bg-blue-50 text-blue-700"
                      }`}>{item.status.toUpperCase()}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-green-500 h-1.5 rounded-full animate-pulse transition-all duration-1000"
                        style={{ width: item.status.toLowerCase() === "processing" ? "65%" : "15%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-12 text-center text-gray-500">
                <FileCheck className="h-10 w-10 text-gray-300 mb-3" />
                <p className="text-sm">All documents processed.</p>
                <p className="text-xs text-gray-400 mt-1">Pipeline is idle and ready for uploads.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Upload New", desc: "Add documents", href: "/app/upload", color: "bg-green-600 text-white hover:bg-green-700 shadow-sm" },
          { label: "AI Search", desc: "Find documents", href: "/app/search", color: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm" },
          { label: "AI RAG Chat", desc: "Answer questions", href: "/app/chat", color: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm" },
          { label: "Document List", desc: "View all logs", href: "/app/documents", color: "bg-purple-600 text-white hover:bg-purple-700 shadow-sm" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.href)}
            className={`${action.color} rounded-lg p-4 text-left active:scale-[0.97] transition-all duration-150`}
          >
            <p className="font-semibold text-base">{action.label}</p>
            <p className="text-xs opacity-90 mt-1">{action.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
