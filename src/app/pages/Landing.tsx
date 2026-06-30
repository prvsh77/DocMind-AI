import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { FileText, Zap, Brain, Search, BarChart3, Shield, Upload, CheckCircle2, ChevronDown } from "lucide-react";

const scrollTo = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
};

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b sticky top-0 bg-white z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => scrollTo("hero")}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <FileText className="h-8 w-8 text-green-600" />
              <span className="text-xl font-semibold">DocMind AI</span>
            </button>
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo("features")} className="text-sm hover:text-green-600 transition-colors">Features</button>
              <button onClick={() => scrollTo("how-it-works")} className="text-sm hover:text-green-600 transition-colors">How It Works</button>
              <button onClick={() => scrollTo("pricing")} className="text-sm hover:text-green-600 transition-colors">Pricing</button>
              <button onClick={() => scrollTo("faq")} className="text-sm hover:text-green-600 transition-colors">Resources</button>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/login")}>Login</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate("/register")}>Get Started</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-bold mb-6">
              Intelligent Document Processing Made Easy
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Extract, classify, and analyze documents using advanced AI. Transform your document workflow with automated OCR, data extraction, and intelligent search.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 active:scale-95 transition-transform" onClick={() => navigate("/register")}>
                Start Free Trial
              </Button>
              <Button size="lg" variant="outline" className="active:scale-95 transition-transform" onClick={() => scrollTo("how-it-works")}>
                Request Demo
              </Button>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Trusted by 5000+ companies worldwide
            </p>
            <button
              onClick={() => scrollTo("features")}
              className="mt-12 flex items-center gap-2 mx-auto text-gray-400 hover:text-green-600 transition-colors animate-bounce"
            >
              <ChevronDown className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Trusted Companies */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-12 flex-wrap opacity-60">
            <span className="text-2xl font-semibold">Microsoft</span>
            <span className="text-2xl font-semibold">amazon</span>
            <span className="text-2xl font-semibold">Deloitte.</span>
            <span className="text-2xl font-semibold">Google</span>
            <span className="text-2xl font-semibold">ORACLE</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Powerful Features</h2>
            <p className="text-gray-600">Everything you need to manage your documents intelligently</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "AI-Powered OCR", desc: "Extract text from any document with industry-leading accuracy" },
              { icon: Zap, title: "Auto Classification", desc: "Automatically categorize invoices, receipts, contracts, and more" },
              { icon: Search, title: "Smart Search", desc: "Find documents using natural language queries" },
              { icon: BarChart3, title: "Analytics Dashboard", desc: "Track processing metrics and document insights" },
              { icon: Shield, title: "Secure & Compliant", desc: "Enterprise-grade security with SOC2 compliance" },
              { icon: Upload, title: "Batch Processing", desc: "Process hundreds of documents simultaneously" },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-default">
                <CardHeader>
                  <Icon className="h-10 w-10 text-green-600 mb-2" />
                  <CardTitle>{title}</CardTitle>
                  <CardDescription>{desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-gray-600">Simple, automated, and intelligent</p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="space-y-8">
              {[
                { step: 1, title: "Upload Documents", desc: "Drag & drop or browse files (PDF, DOCX, PNG, JPG)" },
                { step: 2, title: "AI Processing", desc: "OCR extraction, classification, and data validation" },
                { step: 3, title: "Review & Approve", desc: "Verify extracted data with confidence scores" },
                { step: 4, title: "Search & Analyze", desc: "Query documents and get instant insights" },
              ].map((item) => (
                <div key={item.step} className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Supported Documents */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Supported Documents</h2>
            <p className="text-gray-600">Works with all your business documents</p>
          </div>
          <div className="grid md:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {["Invoices", "Receipts", "Contracts", "Resumes", "Bank Statements"].map((doc) => (
              <Card key={doc} className="text-center hover:shadow-md hover:-translate-y-1 transition-all duration-200 cursor-default">
                <CardHeader>
                  <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                  <CardTitle className="text-base">{doc}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-gray-600">Choose the plan that fits your needs</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Starter", price: "₹999", docs: "100 documents/month", features: ["Basic OCR", "5 Users", "Email Support"] },
              { name: "Professional", price: "₹2,499", docs: "500 documents/month", features: ["Advanced AI", "20 Users", "Priority Support", "API Access"], popular: true },
              { name: "Enterprise", price: "Custom", docs: "Unlimited documents", features: ["Custom AI Models", "Unlimited Users", "24/7 Support", "Dedicated Manager"] },
            ].map((plan) => (
              <Card
                key={plan.name}
                className={`${plan.popular ? "border-green-600 border-2 relative" : ""} hover:shadow-lg transition-shadow duration-200`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm">
                    Most Popular
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-3xl font-bold mt-2">{plan.price}<span className="text-base text-gray-500">/mo</span></div>
                  <CardDescription>{plan.docs}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full active:scale-95 transition-transform"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate(plan.name === "Enterprise" ? "#" : "/register")}
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600">Everything you need to know about DocMind AI</p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "How accurate is the OCR?", a: "Our AI-powered OCR achieves 98.5% accuracy on standard business documents. For handwritten content, accuracy averages around 94%." },
              { q: "What file formats are supported?", a: "We support PDF, DOCX, PNG, JPG, JPEG, and TIFF formats. Maximum file size is 10 MB per document." },
              { q: "Is my data secure?", a: "Yes. All documents are encrypted in transit and at rest. We are SOC2 Type II certified and GDPR compliant." },
              { q: "Can I integrate with my existing systems?", a: "Absolutely. DocMind AI offers a RESTful API and webhooks, plus native integrations with popular ERPs and CRMs." },
            ].map(({ q, a }) => (
              <Card key={q} className="hover:shadow-sm transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">{q}</CardTitle>
                  <CardDescription className="text-gray-600 mt-1">{a}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="border-t py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-6 w-6 text-green-600" />
                <span className="font-semibold">DocMind AI</span>
              </div>
              <p className="text-sm text-gray-400">
                Intelligent document processing powered by AI
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><button onClick={() => scrollTo("features")} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo("pricing")} className="hover:text-white transition-colors">Pricing</button></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            © 2026 DocMind AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
