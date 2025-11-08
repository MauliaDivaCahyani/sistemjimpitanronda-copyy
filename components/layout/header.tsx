"use client"
import {
  Search,
  Bell,
  Settings,
  User,
  Moon,
  Sun,
  LogOut,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  UserCheck,
  Building,
  DollarSign,
  Heart,
  FileText,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState, useEffect } from "react"
import Link from "next/link"

interface HeaderProps {
  title: string
  subtitle?: string
  onOpenMenu?: () => void
  userRole?: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning"
  timestamp: string
  read: boolean
}

interface Person {
  id: string
  name: string
  type: "warga" | "petugas"
  nik?: string
  phone?: string
  address?: string
  position?: string
}

interface SearchResult {
  id: string
  title: string
  subtitle: string
  type: "warga" | "petugas" | "rumah" | "transaksi" | "kampanye" | "laporan"
  url: string
}

const samplePeople: Person[] = [
  {
    id: "1",
    name: "Ahmad Rizki",
    type: "warga",
    nik: "3201234567890123",
    phone: "081234567890",
    address: "Jl. Merdeka No. 123, RT 01/RW 02",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    type: "warga",
    nik: "3201234567890124",
    phone: "081234567891",
    address: "Jl. Sudirman No. 45, RT 02/RW 03",
  },
  {
    id: "3",
    name: "Budi Santoso",
    type: "petugas",
    phone: "081234567892",
    position: "Ketua RT 01",
  },
  {
    id: "4",
    name: "Dewi Sartika",
    type: "petugas",
    phone: "081234567893",
    position: "Bendahara",
  },
  {
    id: "5",
    name: "Andi Wijaya",
    type: "warga",
    nik: "3201234567890125",
    phone: "081234567894",
    address: "Jl. Pahlawan No. 67, RT 03/RW 01",
  },
]

const sampleNotifications: Notification[] = [
  {
    id: "1",
    title: "Donasi Baru",
    message: "Anda menerima donasi sebesar Rp 500.000 dari Ahmad Rizki",
    type: "success",
    timestamp: "2 menit yang lalu",
    read: false,
  },
  {
    id: "2",
    title: "Target Tercapai",
    message: 'Kampanye "Bantuan Pendidikan" telah mencapai 75% dari target',
    type: "info",
    timestamp: "1 jam yang lalu",
    read: false,
  },
  {
    id: "3",
    title: "Peringatan",
    message: 'Kampanye "Renovasi Masjid" akan berakhir dalam 3 hari',
    type: "warning",
    timestamp: "3 jam yang lalu",
    read: false,
  },
]

const sampleSearchData: SearchResult[] = [
  // Data Warga
  {
    id: "w1",
    title: "Ahmad Rizki",
    subtitle: "NIK: 3201234567890123 • Jl. Merdeka No. 123",
    type: "warga",
    url: "/data-warga?search=Ahmad Rizki",
  },
  {
    id: "w2",
    title: "Siti Nurhaliza",
    subtitle: "NIK: 3201234567890124 • Jl. Sudirman No. 45",
    type: "warga",
    url: "/data-warga?search=Siti Nurhaliza",
  },
  {
    id: "w3",
    title: "Andi Wijaya",
    subtitle: "NIK: 3201234567890125 • Jl. Pahlawan No. 67",
    type: "warga",
    url: "/data-warga?search=Andi Wijaya",
  },

  // Data Petugas
  {
    id: "p1",
    title: "Budi Santoso",
    subtitle: "Ketua RT 01 • 081234567892",
    type: "petugas",
    url: "/data-petugas?search=Budi Santoso",
  },
  {
    id: "p2",
    title: "Dewi Sartika",
    subtitle: "Bendahara • 081234567893",
    type: "petugas",
    url: "/data-petugas?search=Dewi Sartika",
  },

  // Data Rumah
  {
    id: "r1",
    title: "Rumah Ahmad Rizki",
    subtitle: "Jl. Merdeka No. 123, RT 01/RW 02",
    type: "rumah",
    url: "/data-rumah?search=Jl. Merdeka No. 123",
  },
  {
    id: "r2",
    title: "Rumah Siti Nurhaliza",
    subtitle: "Jl. Sudirman No. 45, RT 02/RW 03",
    type: "rumah",
    url: "/data-rumah?search=Jl. Sudirman No. 45",
  },

  // Transaksi Dana
  {
    id: "t1",
    title: "Donasi Pendidikan",
    subtitle: "Rp 500.000 • 20 Sep 2024",
    type: "transaksi",
    url: "/transaksi-dana?search=Donasi Pendidikan",
  },
  {
    id: "t2",
    title: "Bantuan Kesehatan",
    subtitle: "Rp 750.000 • 19 Sep 2024",
    type: "transaksi",
    url: "/transaksi-dana?search=Bantuan Kesehatan",
  },

  // Kampanye
  {
    id: "k1",
    title: "Renovasi Masjid",
    subtitle: "Target: Rp 50.000.000 • Progress: 65%",
    type: "kampanye",
    url: "/kampanye?search=Renovasi Masjid",
  },
  {
    id: "k2",
    title: "Bantuan Pendidikan Anak",
    subtitle: "Target: Rp 25.000.000 • Progress: 80%",
    type: "kampanye",
    url: "/kampanye?search=Bantuan Pendidikan",
  },

  // Laporan
  {
    id: "l1",
    title: "Laporan Bulanan September",
    subtitle: "Total Dana: Rp 15.500.000 • 45 Transaksi",
    type: "laporan",
    url: "/laporan?month=september",
  },
  {
    id: "l2",
    title: "Laporan Absensi Petugas",
    subtitle: "Minggu ke-3 September 2024",
    type: "laporan",
    url: "/absensi?week=3",
  },
]

export function Header({ title, subtitle, onOpenMenu, userRole }: HeaderProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(sampleNotifications)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([])

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    setIsDarkMode(isDark)
  }, [])

  useEffect(() => {
    const unread = notifications.filter((n) => !n.read).length
    setUnreadCount(unread)
  }, [notifications])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredResults([])
    } else {
      const filtered = sampleSearchData.filter(
        (item) =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()),
      )
      setFilteredResults(filtered)
    }
  }, [searchQuery])

  const toggleTheme = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    document.documentElement.classList.toggle("dark", newTheme)

    try {
      // Simpan dark mode PER USER - gunakan user.id yang pasti ada
      const savedUser = localStorage.getItem("currentUser")
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser)
        const userId = parsedUser.id // Gunakan user.id yang pasti ada
        const userDarkModeKey = `darkMode_user_${userId}`
        localStorage.setItem(userDarkModeKey, newTheme.toString())
        console.log("🌙 Dark mode toggled for user", userId, "(", parsedUser.nama, "):", newTheme, "Key:", userDarkModeKey)
      }
    } catch (error) {
      console.log("LocalStorage not available")
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-primary" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-blue-500" />
    }
  }

  const handleLogout = () => {
    try {
      localStorage.removeItem("currentUser")
      window.location.href = "/"
    } catch (error) {
      console.log("Error during logout")
    }
  }

  const handlePersonSelect = (person: Person) => {
    const targetPage = person.type === "warga" ? "/data-warga" : "/data-petugas"
    window.location.href = `${targetPage}?search=${person.name}`
    setSearchOpen(false)
  }

  const handleResultSelect = (result: SearchResult) => {
    window.location.href = result.url
    setSearchOpen(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warga":
        return <Users className="h-4 w-4 text-blue-500" />
      case "petugas":
        return <UserCheck className="h-4 w-4 text-primary" />
      case "rumah":
        return <Building className="h-4 w-4 text-purple-500" />
      case "transaksi":
        return <DollarSign className="h-4 w-4 text-yellow-500" />
      case "kampanye":
        return <Heart className="h-4 w-4 text-red-500" />
      case "laporan":
        return <FileText className="h-4 w-4 text-gray-500" />
      default:
        return <Search className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "warga":
        return "Data Warga"
      case "petugas":
        return "Data Petugas"
      case "rumah":
        return "Data Rumah"
      case "transaksi":
        return "Transaksi Dana"
      case "kampanye":
        return "Kampanye"
      case "laporan":
        return "Laporan"
      default:
        return "Data"
    }
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Buka menu" onClick={onOpenMenu}>
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-card-foreground">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {userRole !== 'warga' && (
            <Button
              variant="outline"
              className="relative hidden sm:flex w-40 md:w-64 justify-start text-sm text-muted-foreground bg-transparent"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="mr-2 h-4 w-4" />
              Cari data...
              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">{unreadCount}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between p-2">
                <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                    Tandai Semua Dibaca
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />

              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Tidak ada notifikasi</div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className={`flex flex-col items-start p-3 cursor-pointer ${
                        !notification.read ? "bg-muted/50" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2 w-full">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{notification.title}</p>
                            {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notification.timestamp}</p>
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/notifications" className="w-full text-center">
                  Lihat Semua Notifikasi
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Pengaturan</DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings?tab=profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil Saya</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={toggleTheme}>
                {isDarkMode ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                <span>Mode {isDarkMode ? "Terang" : "Gelap"}</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan Lengkap</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Pencarian Global</DialogTitle>
          </DialogHeader>

          <div className="mt-4">
            <Input
              placeholder="Cari warga, petugas, rumah, transaksi, kampanye, atau laporan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              autoFocus
            />
          </div>

          {searchQuery.trim() === "" ? (
            <div className="mt-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Ketik untuk mencari semua data dalam sistem</p>
              <p className="text-sm mt-2">Warga, Petugas, Rumah, Transaksi, Kampanye, dan Laporan</p>
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="mt-6 text-center text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada hasil untuk "{searchQuery}"</p>
              <p className="text-sm mt-2">Coba gunakan kata kunci yang berbeda</p>
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              <div className="text-sm text-muted-foreground mb-4">Ditemukan {filteredResults.length} hasil</div>

              {["warga", "petugas", "rumah", "transaksi", "kampanye", "laporan"].map((type) => {
                const resultsOfType = filteredResults.filter((result) => result.type === type)
                if (resultsOfType.length === 0) return null

                return (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                      {getTypeIcon(type)}
                      {getTypeLabel(type)} ({resultsOfType.length})
                    </div>

                    {resultsOfType.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(result.type)}
                              <h3 className="font-semibold">{result.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center">
            <p className="text-sm text-muted-foreground">
              Gunakan <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘K</kbd> untuk membuka pencarian cepat
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
