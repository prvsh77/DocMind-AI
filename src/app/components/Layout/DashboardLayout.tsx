import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  LayoutDashboard,
  Upload,
  FileText,
  Search,
  Bot,
  BarChart3,
  CheckSquare,
  Settings,
  User,
  LogOut,
  Bell,
  Menu,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { toApiError } from "../../lib/api-error";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard, exact: true },
  { name: "Upload", href: "/app/upload", icon: Upload },
  { name: "Documents", href: "/app/documents", icon: FileText },
  { name: "AI Search", href: "/app/search", icon: Search },
  { name: "AI Chat", href: "/app/ai-chat", icon: Bot },
  { name: "Analytics", href: "/app/analytics", icon: BarChart3 },
  { name: "Review", href: "/app/review", icon: CheckSquare },
  { name: "Settings", href: "/app/settings", icon: Settings },
  { name: "Profile", href: "/app/profile", icon: User },
];

const notifications = [
  { id: 1, title: "Document processing completed", body: "Invoice_May_2024.pdf was processed successfully", time: "2 min ago", read: false },
  { id: 2, title: "Review required", body: "3 documents need manual verification", time: "1 hour ago", read: false },
  { id: 3, title: "Weekly report ready", body: "Your analytics summary for the week is ready", time: "3 hours ago", read: true },
];

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [unreadCount, setUnreadCount] = useState(2);

  const displayName = user?.name ?? "DocMind User";
  const displayEmail = user?.email ?? "";
  const initials = useMemo(
    () =>
      displayName
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "DU",
    [displayName],
  );

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      toast.success("You have been logged out.");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(toApiError(error).message);
    }
  }, [logout, navigate]);

  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchValue.trim()) {
      navigate(`/app/search?q=${encodeURIComponent(searchValue)}`);
      setSearchValue("");
    }
  }, [navigate, searchValue]);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-6 border-b">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <FileText className="h-6 w-6 text-green-600" />
              <span className="font-semibold text-lg">DocMind AI</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="px-3 space-y-0.5">
              {navigation.map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.href
                  : location.pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150
                      ${isActive
                        ? "bg-green-50 text-green-700 font-medium shadow-sm"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                      }
                    `}
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${isActive ? "text-green-600" : "text-gray-500"}`} />
                    {item.name}
                    {item.name === "Review" && (
                      <span className="ml-auto bg-yellow-100 text-yellow-700 text-xs font-medium px-1.5 py-0.5 rounded-full">3</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User info + logout */}
          <div className="border-t p-3 space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-green-600 text-white text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                {displayEmail && <p className="text-xs text-gray-500 truncate">{displayEmail}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b sticky top-0 z-30 shadow-sm">
          <div className="h-full px-4 flex items-center justify-between gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search documents... (press Enter)"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-9"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" onClick={markAllRead}>
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    Notifications
                    {unreadCount > 0 && (
                      <span className="text-xs text-green-600 font-normal">{unreadCount} new</span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="py-1">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`px-3 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                        onClick={() => navigate("/app/documents")}
                      >
                        <p className={`text-sm font-medium ${!n.read ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{n.body}</p>
                        <p className="text-gray-400 text-xs mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Profile */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-green-600 text-white text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline text-sm">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/app/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/app/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content with fade transition */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
