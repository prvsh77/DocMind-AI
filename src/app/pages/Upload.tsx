import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Upload as UploadIcon, FileText, File, Image, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { Progress } from "../components/ui/progress";
import { useUploadDocumentMutation, useDocumentsQuery } from "../api/hooks";
import { toast } from "sonner";
import { toApiError } from "../lib/api-error";

const supportedFormats = [
  { name: "PDF", icon: FileText, color: "text-red-500" },
  { name: "PNG", icon: Image, color: "text-purple-500" },
  { name: "JPG", icon: Image, color: "text-green-500" },
  { name: "JPEG", icon: Image, color: "text-blue-500" },
];

const STEPS = [
  { name: "Uploading", duration: 800 },
  { name: "Processing", duration: 1000 },
  { name: "OCR", duration: 1500 },
  { name: "Classification", duration: 1200 },
  { name: "Extraction", duration: 1800 },
  { name: "Embedding", duration: 1000 },
  { name: "Completed", duration: 500 },
];

export default function Upload() {
  const navigate = useNavigate();
  const uploadDocument = useUploadDocumentMutation();
  const { data: docsData } = useDocumentsQuery();
  
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [fileName, setFileName] = useState("document.pdf");
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalProgress = currentStep < 0 ? 0 : Math.min(100, Math.round(((currentStep + 1) / STEPS.length) * 100));

  useEffect(() => {
    if (!isProcessing) return;
    if (currentStep < STEPS.length - 1) {
      const duration = currentStep < 0 ? 300 : STEPS[currentStep].duration;
      stepTimerRef.current = setTimeout(() => setCurrentStep((s) => s + 1), duration);
    }
    return () => { if (stepTimerRef.current) clearTimeout(stepTimerRef.current); };
  }, [isProcessing, currentStep]);

  const startProcessing = (name?: string) => {
    setFileName(name ?? "Selected document");
    setCurrentStep(-1);
    setIsProcessing(true);
    setTimeout(() => setCurrentStep(0), 200);
  };

  const uploadFile = async (file: File) => {
    startProcessing(file.name);

    try {
      const uploaded = await uploadDocument.mutateAsync(file);
      toast.success("Document uploaded successfully.");
      const documentId = uploaded?.id ?? uploaded?.document?.id;
      if (documentId) {
        navigate(`/app/documents/${documentId}`);
      } else {
        setIsProcessing(false);
      }
    } catch (error) {
      setIsProcessing(false);
      setCurrentStep(-1);
      toast.error(toApiError(error).message);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void uploadFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void uploadFile(file);
  };

  // Get real upload history from documents query
  const recentDocs = (docsData?.items || []).slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Documents</h1>
        <p className="text-gray-600 mt-1">Upload and process your documents with AI</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Drop Zone */}
          {!isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle>Upload Files</CardTitle>
                <CardDescription>Drag and drop files or browse from your computer</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-lg p-12 text-center transition-all duration-200 cursor-pointer
                    ${isDragging
                      ? "border-green-500 bg-green-50 scale-[1.01]"
                      : "border-gray-300 hover:border-green-400 hover:bg-gray-50"
                    }
                  `}
                >
                  <UploadIcon className={`h-16 w-16 mx-auto mb-4 transition-colors ${isDragging ? "text-green-500" : "text-gray-400"}`} />
                  <h3 className="text-lg font-semibold mb-2">
                    {isDragging ? "Drop files here" : "Drag & drop files here"}
                  </h3>
                  <p className="text-gray-500 mb-4">or</p>
                  <label htmlFor="file-upload">
                    <Button className="bg-green-600 hover:bg-green-700 active:scale-95 transition-transform" asChild>
                      <span>Browse Files</span>
                    </Button>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileSelect}
                      accept=".pdf,.png,.jpg,.jpeg"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-4">Maximum file size: 20 MB</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Processing Screen */}
          {isProcessing && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 text-green-600 animate-spin" />
                  Processing Document
                </CardTitle>
                <CardDescription>{fileName}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {STEPS.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isActive = index === currentStep;
                    const isPending = index > currentStep;
                    return (
                      <div
                        key={step.name}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-all duration-300 ${
                          isActive ? "bg-blue-50 border border-blue-200" : isCompleted ? "bg-green-50" : ""
                        }`}
                      >
                        <div className={`
                          flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300
                          ${isCompleted ? "bg-green-500 text-white animate-pulse" : isActive ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-400"}
                        `}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : isActive ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="text-sm font-semibold">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${isActive ? "text-blue-700 font-bold" : isCompleted ? "text-green-700" : "text-gray-400"}`}>
                            {step.name}
                          </p>
                          {isActive && (
                            <p className="text-xs text-blue-500 mt-0.5 animate-pulse">In progress...</p>
                          )}
                          {isCompleted && (
                            <p className="text-xs text-green-500 mt-0.5">Done</p>
                          )}
                        </div>
                        {isPending && (
                          <span className="text-xs text-gray-300">Pending</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Overall Progress</span>
                    <span className="font-bold text-green-600">{totalProgress}%</span>
                  </div>
                  <Progress value={totalProgress} className="h-2.5 bg-gray-100" />
                  {totalProgress === 100 && (
                    <p className="text-sm text-center text-green-600 mt-3 font-semibold animate-bounce">
                      Processing complete! Redirecting to dashboard...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upload History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Documents Log</CardTitle>
              <CardDescription>Latest uploads in your corporate cabinet</CardDescription>
            </CardHeader>
            <CardContent>
              {recentDocs.length > 0 ? (
                <div className="space-y-3">
                  {recentDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/app/documents/${doc.id}`)}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{doc.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{doc.type}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{doc.uploadedAt}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                        doc.status.toLowerCase() === "completed"
                          ? "bg-green-100 text-green-700"
                          : doc.status.toLowerCase() === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">No documents processed yet.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supported Formats</CardTitle>
              <CardDescription>File types we accept</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {supportedFormats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div key={format.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <Icon className={`h-5 w-5 ${format.color}`} />
                      <span className="font-medium">{format.name}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upload Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2"><span className="text-green-600">•</span><span>Ensure documents are clear and readable</span></li>
                <li className="flex gap-2"><span className="text-green-600">•</span><span>Higher resolution images give better results</span></li>
                <li className="flex gap-2"><span className="text-green-600">•</span><span>You can upload multiple files at once</span></li>
                <li className="flex gap-2"><span className="text-green-600">•</span><span>Processing time depends on document size</span></li>
              </ul>
            </CardContent>
          </Card>

          {isProcessing && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                  <div>
                    <p className="font-medium text-blue-800 text-sm">Processing in progress</p>
                    <p className="text-xs text-blue-600 mt-0.5">Estimated time: ~10 seconds</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
