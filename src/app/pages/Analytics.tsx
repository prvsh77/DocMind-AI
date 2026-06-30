import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { TrendingUp, Clock, Target, Upload, Award, MessageSquare, Search, AlertCircle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useDocumentStatsQuery, useDocumentsQuery } from "../api/hooks";

const TYPE_COLORS: Record<string, string> = {
  "Invoice": "#10b981",       // green
  "Contract": "#8b5cf6",      // purple
  "Receipt": "#f97316",       // orange
  "Bank Statement": "#6366f1",// indigo
  "Resume": "#ec4899",        // pink
  "Other": "#6b7280"          // gray
};

export default function Analytics() {
  const { data: stats, isLoading: statsLoading, isError: statsError } = useDocumentStatsQuery();
  const { data: docsData, isLoading: docsLoading } = useDocumentsQuery({ page: 1, pageSize: 50 });

  if (statsLoading || docsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        <span className="ml-2 text-gray-600 font-medium">Loading analytical dashboard...</span>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="text-center py-20 text-red-600 font-medium">
        Failed to load analytical metrics. Ensure the backend database holds migrations and the seed script is loaded.
      </div>
    );
  }

  // Derive top vendors dynamically from the document logs list
  const documentsList = docsData?.items || [];
  const vendorCounts: Record<string, number> = {};
  const vendorAmounts: Record<string, number> = {};

  documentsList.forEach((d) => {
    if (d.vendor && d.vendor !== "-") {
      vendorCounts[d.vendor] = (vendorCounts[d.vendor] || 0) + 1;
    }
  });

  const sortedVendors = Object.entries(vendorCounts)
    .map(([name, count]) => ({
      name,
      documents: count,
      amount: "Active Source"
    }))
    .sort((a, b) => b.documents - a.documents)
    .slice(0, 5);

  // Compute fallback metadata values
  const totalDocsCount = stats.totalDocuments;
  const processedDocsCount = stats.documentsProcessed;
  const averageConfidence = stats.averageConfidence;
  
  const statsOverview = [
    { name: "Total Documents", value: totalDocsCount, change: "All Uploads", icon: Upload },
    { name: "Processed vault", value: processedDocsCount, change: "Success Rate", icon: Clock },
    { name: "Average Confidence", value: `${averageConfidence}%`, change: "AI Score", icon: Award },
    { name: "Total Queries Ran", value: stats.totalSearches, change: "Search & Chats", icon: Search },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600 mt-1">Insights and metrics from your document processing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsOverview.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.name}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent className="text-left">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly Uploads Trend */}
        <Card>
          <CardHeader className="text-left">
            <CardTitle>Monthly Upload Trend</CardTitle>
            <CardDescription>Documents uploaded over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.charts.uploadsPerMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="uploads" stroke="#10b981" strokeWidth={2} name="Uploaded" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Document Types Distribution */}
        <Card>
          <CardHeader className="text-left">
            <CardTitle>Document Type Distribution</CardTitle>
            <CardDescription>Breakdown by category type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.charts.documentTypeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="type"
                >
                  {stats.charts.documentTypeDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={TYPE_COLORS[entry.type] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* OCR Accuracy */}
        <Card>
          <CardHeader className="text-left">
            <CardTitle>AI Confidence Distribution</CardTitle>
            <CardDescription>Count of processed files by confidence ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.charts.confidenceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" name="Documents Count" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader className="text-left">
            <CardTitle>Top Vendors & Sources</CardTitle>
            <CardDescription>Most frequent document sources in database</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedVendors.length > 0 ? (
              <div className="space-y-4 text-left">
                {sortedVendors.map((vendor, index) => (
                  <div key={vendor.name} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium">{vendor.name}</p>
                        <p className="text-xs text-green-600 font-semibold">{vendor.amount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{vendor.documents} documents</p>
                        <div className="w-24 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full" 
                            style={{ width: `${(vendor.documents / Math.max(...sortedVendors.map(v => v.documents))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <AlertCircle className="h-8 w-8 mb-2 text-gray-400" />
                <p className="text-sm font-medium">No vendors extracted yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Processing Metrics */}
      <div className="grid lg:grid-cols-3 gap-6 text-left">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.charts.processingSuccessRate.map((sr: any) => (
                <div key={sr.status}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-600">{sr.status}</span>
                    <span className="font-semibold">{sr.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className={`h-2 rounded-full ${
                        sr.status === "Completed" ? "bg-green-500" :
                        sr.status === "Failed" ? "bg-red-500" :
                        sr.status === "Processing" ? "bg-yellow-500" : "bg-blue-500"
                      }`} 
                      style={{ width: `${totalDocsCount > 0 ? (sr.value / totalDocsCount) * 100 : 0}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Search Queries</span>
                <span className="font-semibold">{stats.totalSearches}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Chat Prompts</span>
                <span className="font-semibold">{stats.totalAIChats}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Aggregate Ops</span>
                <span className="font-bold text-lg text-green-600">
                  {stats.totalSearches + stats.totalAIChats}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quality Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">OCR Accuracy</span>
                <span className="font-semibold">98.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Classification Accuracy</span>
                <span className="font-semibold">96.8%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Extraction Accuracy</span>
                <span className="font-semibold">94.2%</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Overall System Score</span>
                <span className="font-bold text-lg text-green-600">96.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
