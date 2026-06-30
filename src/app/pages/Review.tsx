import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { CheckCircle, XCircle, AlertCircle, FileText, Eye, Loader2 } from "lucide-react";
import { useDocumentsQuery } from "../api/hooks";
import { toast } from "sonner";

type DocItem = {
  id: string;
  name: string;
  type: string;
  status: string;
  confidence: number;
  uploadedAt: string;
  vendor?: string;
};

type ApprovalState = Record<string, "approved" | "rejected">;

export default function Review() {
  const navigate = useNavigate();
  const { data: docsData, isLoading, isError } = useDocumentsQuery({ page: 1, pageSize: 50 });

  const [activeTab, setActiveTab] = useState("pending");
  const [pending, setPending] = useState<DocItem[]>([]);
  const [lowConf, setLowConf] = useState<DocItem[]>([]);
  const [flagged, setFlagged] = useState<DocItem[]>([]);
  const [approvals, setApprovals] = useState<ApprovalState>({});

  // Sync state from query data
  useEffect(() => {
    if (docsData?.items) {
      const items = docsData.items.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        type: doc.type,
        status: doc.status,
        confidence: doc.confidence ?? 100,
        uploadedAt: doc.uploadedAt,
        vendor: doc.vendor,
      }));

      // Group documents dynamically
      setPending(items.filter((d: any) => d.status.toLowerCase() === "uploaded" || d.status.toLowerCase() === "processing"));
      setLowConf(items.filter((d: any) => d.status.toLowerCase() === "completed" && d.confidence < 85));
      setFlagged(items.filter((d: any) => d.status.toLowerCase() === "failed"));
    }
  }, [docsData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        <span className="ml-2 text-gray-600 font-medium">Loading human review cabinet...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-20 text-red-600 font-medium">
        Failed to load documents list. Check your database connection.
      </div>
    );
  }

  const approve = (id: string, list: DocItem[], setList: (d: DocItem[]) => void) => {
    setApprovals((prev) => ({ ...prev, [id]: "approved" }));
    toast.success("Document approved successfully.");
    setTimeout(() => setList(list.filter((d) => d.id !== id)), 800);
  };

  const reject = (id: string, list: DocItem[], setList: (d: DocItem[]) => void) => {
    setApprovals((prev) => ({ ...prev, [id]: "rejected" }));
    toast.error("Document flagged as rejected.");
    setTimeout(() => setList(list.filter((d) => d.id !== id)), 800);
  };

  const approveAll = () => {
    if (activeTab === "pending" && pending.length > 0) {
      pending.forEach((d) => setApprovals((prev) => ({ ...prev, [d.id]: "approved" })));
      toast.success(`Approved all ${pending.length} pending items.`);
      setTimeout(() => setPending([]), 800);
    } else if (activeTab === "low-confidence" && lowConf.length > 0) {
      lowConf.forEach((d) => setApprovals((prev) => ({ ...prev, [d.id]: "approved" })));
      toast.success(`Approved all ${lowConf.length} low-confidence items.`);
      setTimeout(() => setLowConf([]), 800);
    }
  };

  const rejectAll = () => {
    if (activeTab === "pending" && pending.length > 0) {
      pending.forEach((d) => setApprovals((prev) => ({ ...prev, [d.id]: "rejected" })));
      toast.error(`Flagged all ${pending.length} pending items as rejected.`);
      setTimeout(() => setPending([]), 800);
    }
  };

  const rowClass = (id: string) => {
    const state = approvals[id];
    if (state === "approved") return "bg-green-50/70 opacity-60 transition-all duration-300";
    if (state === "rejected") return "bg-red-50/70 opacity-60 transition-all duration-300";
    return "hover:bg-gray-50 transition-colors";
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status.toLowerCase();
    if (s === "completed") return "bg-green-100 text-green-700 hover:bg-green-100";
    if (s === "processing") return "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 animate-pulse";
    if (s === "uploaded") return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    if (s === "failed") return "bg-red-100 text-red-700 hover:bg-red-100";
    return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  };

  const ActionButtons = ({ doc, list, setList }: { doc: DocItem; list: DocItem[]; setList: (d: DocItem[]) => void }) => (
    <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate(`/app/documents/${doc.id}`)}
      >
        <Eye className="h-4 w-4 mr-1.5" />
        Review
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-green-600 hover:text-green-700 hover:bg-green-50 active:scale-95 transition-all"
        disabled={!!approvals[doc.id]}
        onClick={() => approve(doc.id, list, setList)}
      >
        <CheckCircle className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-all"
        disabled={!!approvals[doc.id]}
        onClick={() => reject(doc.id, list, setList)}
      >
        <XCircle className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Human Review</h1>
          <p className="text-gray-600 mt-1">Documents requiring manual verification</p>
        </div>
        {(activeTab === "pending" && pending.length > 0) || (activeTab === "low-confidence" && lowConf.length > 0) ? (
          <div className="flex gap-2">
            <Button variant="outline" className="active:scale-95 transition-transform" onClick={approveAll}>
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              Approve All
            </Button>
            <Button variant="outline" className="text-red-600 hover:text-red-700 active:scale-95 transition-transform" onClick={rejectAll}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject All
            </Button>
          </div>
        ) : null}
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { label: "Pending Review", count: pending.length, color: "text-blue-600", tab: "pending" },
          { label: "Low Confidence ( < 85% )", count: lowConf.length, color: "text-yellow-600", tab: "low-confidence" },
          { label: "Flagged / Failed", count: flagged.length, color: "text-red-600", tab: "flagged" },
        ].map(({ label, count, color, tab }) => (
          <Card
            key={label}
            className={`cursor-pointer hover:shadow-md active:scale-[0.98] transition-all ${activeTab === tab ? "border-green-600 bg-green-50/5" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-gray-600">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${color}`}>{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="low-confidence">Low Confidence ({lowConf.length})</TabsTrigger>
              <TabsTrigger value="flagged">Flagged ({flagged.length})</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent>
            {/* Pending */}
            <TabsContent value="pending" className="mt-0">
              {pending.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4 animate-bounce" />
                  <p className="text-gray-600 font-medium">All caught up!</p>
                  <p className="text-sm text-gray-400 mt-1">No documents pending review</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className={rowClass(doc.id)}
                          onClick={() => navigate(`/app/documents/${doc.id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              {doc.name}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                          <TableCell>
                            <Badge className={getStatusBadgeClass(doc.status)}>{doc.status}</Badge>
                          </TableCell>
                          <TableCell><span className="text-yellow-600 font-medium">{doc.confidence}%</span></TableCell>
                          <TableCell className="text-gray-500">{doc.uploadedAt}</TableCell>
                          <TableCell className="text-right">
                            {approvals[doc.id] ? (
                              <Badge className={approvals[doc.id] === "approved" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                {approvals[doc.id] === "approved" ? "Approved" : "Rejected"}
                              </Badge>
                            ) : (
                              <ActionButtons doc={doc} list={pending} setList={setPending} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Low Confidence */}
            <TabsContent value="low-confidence" className="mt-0">
              {lowConf.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-600 font-medium">All completed extractions pass quality threshold ( &gt;= 85% )</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead>Confidence</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lowConf.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className={rowClass(doc.id)}
                          onClick={() => navigate(`/app/documents/${doc.id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              {doc.name}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                          <TableCell><span className="text-sm text-gray-600">{doc.vendor || "-"}</span></TableCell>
                          <TableCell><span className="text-yellow-600 font-bold">{doc.confidence}%</span></TableCell>
                          <TableCell className="text-gray-500">{doc.uploadedAt}</TableCell>
                          <TableCell className="text-right">
                            {approvals[doc.id] ? (
                              <Badge className={approvals[doc.id] === "approved" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                {approvals[doc.id] === "approved" ? "Approved" : "Rejected"}
                              </Badge>
                            ) : (
                              <ActionButtons doc={doc} list={lowConf} setList={setLowConf} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* Flagged */}
            <TabsContent value="flagged" className="mt-0">
              {flagged.length === 0 ? (
                <div className="text-center py-16">
                  <CheckCircle className="h-12 w-12 mx-auto text-green-400 mb-4" />
                  <p className="text-gray-600 font-medium">No flagged or failed documents</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flagged.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className={rowClass(doc.id)}
                          onClick={() => navigate(`/app/documents/${doc.id}`)}
                          style={{ cursor: "pointer" }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-red-500 animate-pulse" />
                              {doc.name}
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline">{doc.type}</Badge></TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-700 border-red-200">FAILED</Badge>
                          </TableCell>
                          <TableCell className="text-gray-500">{doc.uploadedAt}</TableCell>
                          <TableCell className="text-right">
                            {approvals[doc.id] ? (
                              <Badge className={approvals[doc.id] === "approved" ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                                {approvals[doc.id] === "approved" ? "Approved" : "Rejected"}
                              </Badge>
                            ) : (
                              <ActionButtons doc={doc} list={flagged} setList={setFlagged} />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
