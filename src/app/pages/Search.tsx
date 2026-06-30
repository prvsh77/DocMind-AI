import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Search as SearchIcon, FileText, Sparkles, Loader2, Download } from "lucide-react";
import { useDocumentSearchQuery } from "../api/hooks";
import { toast } from "sonner";

const suggestedQueries = [
  "Invoices over ₹50,000",
  "Amazon invoices from last month",
  "Receipts this month",
  "Contracts expiring soon",
  "Documents from Microsoft",
  "Bank statements from HDFC",
];

export default function Search() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [submittedQuery, setSubmittedQuery] = useState(searchParams.get("q") ?? "");
  const [hasSearched, setHasSearched] = useState(!!searchParams.get("q"));

  // Fetch search results from backend API via hook
  const { data: results = [], isLoading, isError } = useDocumentSearchQuery(
    submittedQuery,
    Boolean(submittedQuery.trim())
  );

  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery && urlQuery !== query) {
      setQuery(urlQuery);
      triggerSearch(urlQuery);
    }
  }, [searchParams]);

  const triggerSearch = (q: string) => {
    if (!q.trim()) return;
    setSubmittedQuery(q);
    setHasSearched(true);
  };

  const handleSearch = () => triggerSearch(query);

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    triggerSearch(suggestion);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (results.length === 0) return;
    
    const headers = ["Document ID", "Filename", "Type", "Vendor", "Amount", "Date", "Match Confidence", "AI Summary", "Excerpt"];
    const rows = results.map((r) => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      r.type,
      `"${r.vendor.replace(/"/g, '""')}"`,
      `"${r.amount.replace(/"/g, '""')}"`,
      r.date,
      `${r.confidence}%`,
      `"${(r.summary || "").replace(/"/g, '""')}"`,
      `"${r.excerpt.replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `search_export_${submittedQuery.toLowerCase().replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Search results exported as CSV.");
  };

  // Keyword highlighting helper
  const highlightText = (text: string, searchStr: string) => {
    if (!searchStr.trim()) return text;
    const parts = searchStr.split(/\s+/).filter((p) => p.length > 2);
    if (parts.length === 0) return text;
    
    const escapedParts = parts.map(p => p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const regex = new RegExp(`(${escapedParts.join("|")})`, "gi");
    return text.replace(regex, "<mark class='bg-yellow-100 font-semibold px-0.5 text-black rounded'>$1</mark>");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold">AI Search</h1>
        <p className="text-gray-600 mt-1">Search your documents using natural language</p>
      </div>

      {/* Search Box */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 animate-pulse" />
              <Input
                type="text"
                placeholder="Ask anything about your documents..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="pl-11 h-12 text-base focus:border-green-400"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-green-600 hover:bg-green-700 h-12 px-8 active:scale-95 transition-transform"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <SearchIcon className="h-5 w-5 mr-2" />}
              Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Queries */}
      {!hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Example Queries</CardTitle>
            <CardDescription>Try one of these popular searches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {suggestedQueries.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4 text-left hover:border-green-300 hover:bg-green-50 active:scale-[0.98] transition-all"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <SearchIcon className="h-4 w-4 mr-3 flex-shrink-0 text-green-600" />
                  <span>{suggestion}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin text-green-600" />
          <span>Searching with AI...</span>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="text-center py-12 text-red-600 font-medium">
          Failed to retrieve search results. Please check your backend connection.
        </div>
      )}

      {/* Search Results */}
      {hasSearched && !isLoading && !isError && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Search Results</h2>
            <div className="flex items-center gap-3">
              <p className="text-gray-600">{results.length} documents found</p>
              {results.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  className="h-8 text-xs flex items-center gap-1.5 hover:bg-gray-50"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => { setHasSearched(false); setQuery(""); setSubmittedQuery(""); }}>
                Clear
              </Button>
            </div>
          </div>

          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <Card
                  key={result.id}
                  className="hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 cursor-pointer"
                  onClick={() => navigate(`/app/documents/${result.id}`)}
                >
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-left">
                            <p className="font-semibold text-lg hover:text-green-600 transition-colors">
                              {result.name}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">{result.type}</Badge>
                              <span className="text-sm text-gray-600">{result.vendor}</span>
                              <span className="text-sm text-gray-400">•</span>
                              <span className="text-sm text-gray-600">{result.date}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-green-600">{result.amount}</p>
                            <p className="text-xs text-gray-500 mt-1">{result.confidence}% match</p>
                          </div>
                        </div>

                        {/* AI Summary */}
                        {result.summary && (
                          <div className="mt-3 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md p-2.5 text-left">
                            <span className="font-semibold text-green-700">AI Summary: </span>
                            {result.summary}
                          </div>
                        )}

                        {/* Text Excerpt snippet containing keywords */}
                        <p 
                          className="text-gray-600 mt-3 leading-relaxed text-sm text-left"
                          dangerouslySetInnerHTML={{ __html: highlightText(result.excerpt, submittedQuery) }}
                        />
                        
                        <div className="flex gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
                          <Button variant="outline" size="sm" onClick={() => navigate(`/app/documents/${result.id}`)}>
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <SearchIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No results found</h3>
                  <p className="text-gray-600">Try a different search query</p>
                  <Button className="mt-4" variant="outline" onClick={() => { setHasSearched(false); setQuery(""); setSubmittedQuery(""); }}>
                    Clear Search
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tips */}
      {!hasSearched && (
        <Card>
          <CardHeader>
            <CardTitle>Search Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2"><span className="text-green-600">•</span><span>Use natural language — ask questions as you would to a person</span></li>
              <li className="flex gap-2"><span className="text-green-600">•</span><span>Filter by amount, date, vendor, or document type</span></li>
              <li className="flex gap-2"><span className="text-green-600">•</span><span>Combine multiple criteria for more specific results</span></li>
              <li className="flex gap-2"><span className="text-green-600">•</span><span>AI understands context and finds semantically similar documents</span></li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
