import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { ArrowLeft, Download, CheckCircle, XCircle, Edit2, FileText, Check, X, Loader2, Sparkles, Copy } from "lucide-react";
import { useDocumentQuery, useDocumentOcrQuery, useProcessDocumentMutation } from "../api/hooks";
import { toast } from "sonner";

export default function DocumentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Fetch document details and OCR raw text via hooks
  const { data: doc, isLoading, isError } = useDocumentQuery(id ?? "");
  const { data: ocrData, isLoading: ocrLoading } = useDocumentOcrQuery(id ?? "");
  const processDocument = useProcessDocumentMutation();

  const [status, setStatus] = useState<string>("");
  const [editMode, setEditMode] = useState(false);
  const [fields, setFields] = useState<any>(null);
  const [actionFeedback, setActionFeedback] = useState<"approved" | "rejected" | null>(null);
  const [leftTab, setLeftTab] = useState<'preview' | 'ocr'>('preview');
  const [isProcessingLocal, setIsProcessingLocal] = useState(false);

  // Sync fields state when doc updates
  useEffect(() => {
    if (doc) {
      setStatus(doc.status);
      setFields(doc.extractedFields || {
        invoiceNumber: "",
        vendor: "",
        vendorAddress: "",
        customerName: "",
        customerAddress: "",
        invoiceDate: "",
        dueDate: "",
        subtotal: "",
        tax: "",
        total: "",
        items: []
      });
    }
  }, [doc]);

  if (isLoading || !fields) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
        <span className="ml-2 text-gray-600 font-medium">Loading document details...</span>
      </div>
    );
  }

  if (isError || !doc) {
    return (
      <div className="text-center py-20 text-red-600 font-medium">
        Failed to load document details. Please verify the document ID and your server connection.
      </div>
    );
  }

  const handleProcess = async () => {
    try {
      setIsProcessingLocal(true);
      toast.loading("Running OCR and classification...");
      await processDocument.mutateAsync(doc.id);
      toast.dismiss();
      toast.success("Document processed successfully!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.detail || "Failed to process document.");
    } finally {
      setIsProcessingLocal(false);
    }
  };

  const handleApprove = () => {
    setStatus("completed");
    setActionFeedback("approved");
    setTimeout(() => { setActionFeedback(null); navigate("/app/documents"); }, 1200);
  };

  const handleReject = () => {
    setStatus("failed");
    setActionFeedback("rejected");
    setTimeout(() => { setActionFeedback(null); navigate("/app/documents"); }, 1200);
  };

  // Clipboard and downloads functions
  const handleCopyOcr = () => {
    if (ocrData?.ocr_text) {
      navigator.clipboard.writeText(ocrData.ocr_text);
      toast.success("OCR text copied to clipboard!");
    } else {
      toast.error("No OCR text available to copy.");
    }
  };

  const handleDownloadOcr = () => {
    if (ocrData?.ocr_text) {
      const element = document.createElement("a");
      const file = new Blob([ocrData.ocr_text], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `${doc.name.replace(/\.[^/.]+$/, "")}_ocr.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      toast.success("Downloaded OCR Text file.");
    } else {
      toast.error("No OCR text available to download.");
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fields, null, 2));
    toast.success("Extracted fields JSON copied to clipboard!");
  };

  const handleDownloadJson = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(fields, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `${doc.name.replace(/\.[^/.]+$/, "")}_extracted.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Downloaded Extracted fields JSON.");
  };

  const ConfidenceBadge = ({ score }: { score: number }) => (
    <div className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center transition-all ${score >= 90 ? "bg-green-100 border border-green-200" : score >= 75 ? "bg-blue-100 border border-blue-200" : "bg-yellow-100 border border-yellow-200"}`}>
      <span className={`text-[10px] font-bold ${score >= 90 ? "text-green-700" : score >= 75 ? "text-blue-700" : "text-yellow-700"}`}>{score}%</span>
    </div>
  );

  const getStatusBadgeClass = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s === "completed") return "bg-green-100 text-green-700 border border-green-200";
    if (s === "failed") return "bg-red-100 text-red-700 border border-red-200";
    if (s === "uploaded") return "bg-blue-100 text-blue-700 border border-blue-200";
    if (s === "processing") return "bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse";
    return "bg-gray-100 text-gray-700 border border-gray-200";
  };

  const renderExtractedFields = () => {
    const docType = doc.type.toLowerCase();
    
    // 1. INVOICE / RECEIPT
    if (docType === "invoice" || docType === "receipt") {
      return (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice / Ref Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="invoiceNumber"
                  value={fields.invoiceNumber || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, invoiceNumber: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.invoiceNumber ?? 100} />
              </div>
            </div>
            <div>
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="invoiceDate"
                  value={fields.invoiceDate || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, invoiceDate: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.date ?? 100} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="vendor">Vendor</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="vendor"
                value={fields.vendor || ""}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, vendor: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.vendor ?? 100} />
            </div>
          </div>

          <div>
            <Label htmlFor="vendorAddress">Vendor Address</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="vendorAddress"
                value={fields.vendorAddress || ""}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, vendorAddress: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.vendorAddress ?? 100} />
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="customerName">Customer Name</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="customerName"
                value={fields.customerName || ""}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, customerName: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.customerName ?? 100} />
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { id: "subtotal", label: "Subtotal", key: "subtotal" as const, scoreKey: "subtotal" },
              { id: "tax", label: "Tax", key: "tax" as const, scoreKey: "taxAmount" },
              { id: "total", label: "Total", key: "total" as const, scoreKey: "totalAmount" },
            ].map(({ id, label, key, scoreKey }) => (
              <div key={id}>
                <Label htmlFor={id}>{label}</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id={id}
                    value={fields[key] || ""}
                    placeholder="No data"
                    readOnly={!editMode}
                    onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
                    className={`${id === "total" ? "font-bold" : ""} ${editMode ? "border-green-400" : ""}`}
                  />
                  <ConfidenceBadge score={doc.confidenceScores?.[scoreKey] ?? 100} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 2. RESUME
    if (docType === "resume") {
      return (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="name"
                  value={fields.name || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, name: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.name ?? 100} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="email"
                  value={fields.email || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, email: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.email ?? 100} />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="phone"
                  value={fields.phone || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, phone: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.phone ?? 100} />
              </div>
            </div>
            <div>
              <Label htmlFor="education">Education</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="education"
                  value={fields.education || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, education: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.education ?? 100} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="experience">Work Experience</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="experience"
                value={fields.experience || ""}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, experience: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.experience ?? 100} />
            </div>
          </div>

          <div>
            <Label>Skills</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {Array.isArray(fields.skills) && fields.skills.length > 0 ? (
                fields.skills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No skills listed</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 3. BANK STATEMENT
    if (docType === "bank statement") {
      return (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="bankName"
                  value={fields.bankName || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, bankName: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.bankName ?? 100} />
              </div>
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="accountNumber"
                  value={fields.accountNumber || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, accountNumber: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.accountNumber ?? 100} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="statementPeriod">Statement Period</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="statementPeriod"
                value={fields.statementPeriod || ""}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, statementPeriod: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.statementPeriod ?? 100} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="openingBalance">Opening Balance</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="openingBalance"
                  value={fields.openingBalance || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, openingBalance: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.openingBalance ?? 100} />
              </div>
            </div>
            <div>
              <Label htmlFor="closingBalance">Closing Balance</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="closingBalance"
                  value={fields.closingBalance || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, closingBalance: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.closingBalance ?? 100} />
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 4. CONTRACT
    if (docType === "contract") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="parties">Parties</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="parties"
                value={Array.isArray(fields.parties) ? fields.parties.join(", ") : (fields.parties || "")}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, parties: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.parties ?? 100} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="effectiveDate"
                  value={fields.effectiveDate || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, effectiveDate: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.effectiveDate ?? 100} />
              </div>
            </div>
            <div>
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="expiryDate"
                  value={fields.expiryDate || ""}
                  placeholder="No data"
                  readOnly={!editMode}
                  onChange={(e) => setFields({ ...fields, expiryDate: e.target.value })}
                  className={editMode ? "border-green-400" : ""}
                />
                <ConfidenceBadge score={doc.confidenceScores?.expiryDate ?? 100} />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="paymentTerms"
                value={fields.paymentTerms || ""}
                placeholder="No data"
                readOnly={!editMode}
                onChange={(e) => setFields({ ...fields, paymentTerms: e.target.value })}
                className={editMode ? "border-green-400" : ""}
              />
              <ConfidenceBadge score={doc.confidenceScores?.paymentTerms ?? 100} />
            </div>
          </div>

          <div>
            <Label>Key Clauses</Label>
            <ul className="list-disc pl-5 mt-2 space-y-1 text-sm text-gray-700 text-left">
              {Array.isArray(fields.keyClauses) && fields.keyClauses.length > 0 ? (
                fields.keyClauses.map((clause: string, idx: number) => (
                  <li key={idx}>{clause}</li>
                ))
              ) : (
                <span className="text-sm text-gray-500">No clauses extracted</span>
              )}
            </ul>
          </div>
        </div>
      );
    }

    // 5. OTHER / DEFAULT
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="description">Description</Label>
          <div className="flex gap-2 mt-1">
            <Input
              id="description"
              value={fields.description || ""}
              placeholder="No data"
              readOnly={!editMode}
              onChange={(e) => setFields({ ...fields, description: e.target.value })}
              className={editMode ? "border-green-400" : ""}
            />
            <ConfidenceBadge score={doc.confidenceScores?.description ?? 100} />
          </div>
        </div>

        <div>
          <Label>Keywords</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            {Array.isArray(fields.keywords) && fields.keywords.length > 0 ? (
              fields.keywords.map((kw: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="bg-gray-100 text-gray-700">
                  {kw}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-500">No keywords extracted</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const showActionsSection = () => {
    const s = status.toLowerCase();
    
    if (s === "uploaded" || s === "failed") {
      return (
        <Button
          className="w-full bg-green-600 hover:bg-green-700 active:scale-95 transition-transform py-5 font-semibold flex items-center justify-center gap-2"
          onClick={handleProcess}
          disabled={isProcessingLocal}
        >
          {isProcessingLocal ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Processing Pipeline...
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Process Document
            </>
          )}
        </Button>
      );
    }

    if (s === "processing") {
      return (
        <Button
          className="w-full bg-yellow-600 hover:bg-yellow-700 active:scale-95 transition-transform py-5 font-semibold flex items-center justify-center gap-2"
          disabled
        >
          <Loader2 className="h-5 w-5 animate-spin" />
          Analyzing Document...
        </Button>
      );
    }

    // Default completed buttons
    return (
      <div className="flex gap-3">
        <Button
          className="flex-1 bg-green-600 hover:bg-green-700 active:scale-[0.97] transition-all"
          onClick={handleApprove}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Approve
        </Button>
        <Button
          variant="outline"
          className="flex-1 text-red-600 border-red-300 hover:bg-red-50 active:scale-[0.97] transition-all"
          onClick={handleReject}
        >
          <XCircle className="h-4 w-4 mr-2" />
          Reject
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/documents")} className="hover:bg-gray-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{doc.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="bg-gray-50 border-gray-200 text-gray-700">{doc.type}</Badge>
              <Badge className={getStatusBadgeClass(status)}>
                {status.toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600 font-medium">Confidence: {doc.confidence}%</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setEditMode(!editMode)}
            className={editMode ? "border-green-600 text-green-600" : ""}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {editMode ? "Save Edits" : "Edit Fields"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left - Document Preview or OCR Text */}
        <Card className="lg:sticky lg:top-20 h-fit">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Document Viewer</CardTitle>
            <div className="flex items-center gap-2">
              {leftTab === 'ocr' && ocrData?.ocr_text && (
                <div className="flex gap-1 mr-2">
                  <Button variant="ghost" size="sm" onClick={handleCopyOcr} className="h-7 text-xs px-2 flex items-center gap-1 hover:bg-gray-100">
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownloadOcr} className="h-7 text-xs px-2 flex items-center gap-1 hover:bg-gray-100">
                    <Download className="h-3 w-3" />
                    TXT
                  </Button>
                </div>
              )}
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-md text-xs">
                <button
                  onClick={() => setLeftTab('preview')}
                  className={`px-3 py-1 rounded transition-colors ${leftTab === 'preview' ? 'bg-white font-medium shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setLeftTab('ocr')}
                  className={`px-3 py-1 rounded transition-colors ${leftTab === 'ocr' ? 'bg-white font-medium shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  OCR Text
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leftTab === 'preview' ? (
              <div className="border rounded-lg bg-gray-50 p-8 min-h-[500px] flex items-center justify-center">
                <div className="text-center">
                  <FileText className="h-24 w-24 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">{doc.name}</p>
                  <p className="text-sm text-gray-400 mt-2">{doc.type} • {doc.confidence}% confidence</p>
                </div>
              </div>
            ) : (
              <div className="min-h-[500px] flex flex-col justify-start">
                {ocrLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
                  </div>
                ) : (
                  <pre className="flex-1 text-left bg-gray-50 p-4 rounded-lg border max-h-[500px] overflow-y-auto font-mono text-xs whitespace-pre-wrap">
                    {ocrData?.ocr_text || "No OCR text extracted yet. Click 'Process Document' on the right to run."}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right - Extracted Data */}
        <div className="space-y-6">
          {/* AI Summary Block */}
          {doc.summary && (
            <Card className="border-green-100 bg-green-50/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-green-800">
                  <Sparkles className="h-4 w-4 text-green-600 animate-pulse" />
                  AI Document Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 leading-relaxed text-left">
                  {doc.summary}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Document Info */}
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>
                  <Label className="text-gray-600 text-xs">Document Type</Label>
                  <p className="font-medium mt-1">{doc.type}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-xs">Status</Label>
                  <p className={`font-medium mt-1 uppercase ${status.toLowerCase() === "failed" ? "text-red-600" : "text-green-600"}`}>{status}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-xs">Uploaded At</Label>
                  <p className="font-medium mt-1 text-sm">{doc.uploadedAt}</p>
                </div>
                <div>
                  <Label className="text-gray-600 text-xs">Processed At</Label>
                  <p className="font-medium mt-1 text-sm">{doc.processedAt || "Pending OCR processing"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Fields */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Extracted Fields</CardTitle>
              {status.toLowerCase() === "completed" && (
                <div className="flex gap-1.5">
                  <Button variant="ghost" size="sm" onClick={handleCopyJson} className="h-7 text-xs px-2 flex items-center gap-1 hover:bg-gray-100">
                    <Copy className="h-3 w-3" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleDownloadJson} className="h-7 text-xs px-2 flex items-center gap-1 hover:bg-gray-100">
                    <Download className="h-3 w-3" />
                    JSON
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {renderExtractedFields()}
            </CardContent>
          </Card>

          {/* Line Items / Bank Transactions */}
          {doc.type.toLowerCase() === "invoice" || doc.type.toLowerCase() === "receipt" ? (
            <Card>
              <CardHeader>
                <CardTitle>Line Items</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.items && fields.items.length > 0 ? (
                  <div className="space-y-2">
                    {fields.items.map((item: any, index: number) => (
                      <div key={index} className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                        <div className="col-span-2">
                          <p className="text-sm font-medium">{item.description}</p>
                        </div>
                        <div className="text-sm text-gray-600">{item.quantity}</div>
                        <div className="text-sm font-medium text-right">{item.amount}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No line items extracted.</p>
                )}
              </CardContent>
            </Card>
          ) : doc.type.toLowerCase() === "bank statement" && fields.transactions ? (
            <Card>
              <CardHeader>
                <CardTitle>Bank Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                {fields.transactions.length > 0 ? (
                  <div className="space-y-2">
                    {fields.transactions.map((tx: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left">
                        <span className="text-sm font-medium">{tx.description || tx.date}</span>
                        <span className="text-sm font-bold text-gray-700">{tx.amount}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No transactions extracted.</p>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Review Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Review Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {actionFeedback ? (
                <div className={`flex items-center justify-center gap-3 py-4 rounded-lg ${actionFeedback === "approved" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                  {actionFeedback === "approved"
                    ? <><Check className="h-5 w-5" /> Document approved! Redirecting...</>
                    : <><X className="h-5 w-5" /> Document rejected. Redirecting...</>
                  }
                </div>
              ) : (
                showActionsSection()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
