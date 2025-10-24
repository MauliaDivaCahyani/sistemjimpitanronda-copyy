"use client"
import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  User,
  Bell,
  Shield,
  Palette,
  Volume2,
  Globe,
  Smartphone,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
} from "lucide-react"
import type { User as UserType } from "@/types/auth"
import { useSearchParams } from "next/navigation"

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const searchParams = useSearchParams()
  const defaultTab = searchParams.get("tab") || "profile"

  const [profileForm, setProfileForm] = useState({
    nama: "",
    email: "",
    phone: "",
    alamat: "",
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      setProfileForm({
        nama: parsedUser.nama || "",
        email: parsedUser.email || "",
        phone: parsedUser.phone || "",
        alamat: parsedUser.alamat || "",
      })
    }

    const savedTheme = localStorage.getItem("theme")
    const isDark = savedTheme === "dark"
    setIsDarkMode(isDark)

    const savedNotifications = localStorage.getItem("notifications")
    if (savedNotifications) {
      const prefs = JSON.parse(savedNotifications)
      setNotificationsEnabled(prefs.enabled ?? true)
      setEmailNotifications(prefs.email ?? true)
      setPushNotifications(prefs.push ?? true)
    }

    const savedSound = localStorage.getItem("soundEnabled")
    setSoundEnabled(savedSound !== "false")
  }, [])

  const handleThemeToggle = () => {
    const newTheme = !isDarkMode
    setIsDarkMode(newTheme)
    localStorage.setItem("theme", newTheme ? "dark" : "light")
    document.documentElement.classList.toggle("dark", newTheme)
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    if (user) {
      const updatedUser = { ...user, ...profileForm }
      localStorage.setItem("currentUser", JSON.stringify(updatedUser))
      setUser(updatedUser)
    }
    setIsLoading(false)
  }

  const handleSavePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Password baru tidak cocok!")
      return
    }

    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setIsLoading(false)
    alert("Password berhasil diubah!")
  }

  const handleSaveNotifications = () => {
    const prefs = {
      enabled: notificationsEnabled,
      email: emailNotifications,
      push: pushNotifications,
    }
    localStorage.setItem("notifications", JSON.stringify(prefs))
    localStorage.setItem("soundEnabled", soundEnabled.toString())
  }

  return (
    <DashboardLayout title="Pengaturan">
      <div className="max-w-4xl mx-auto space-y-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifikasi
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Keamanan
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Tampilan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Profil</CardTitle>
                <CardDescription>Kelola informasi pribadi dan detail kontak Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
                    {user?.nama?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{user?.nama}</h3>
                    <Badge variant="secondary" className="capitalize">
                      {user?.role?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Nama Lengkap</Label>
                    <Input
                      id="nama"
                      value={profileForm.nama}
                      onChange={(e) => setProfileForm({ ...profileForm, nama: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat</Label>
                    <Input
                      id="alamat"
                      value={profileForm.alamat}
                      onChange={(e) => setProfileForm({ ...profileForm, alamat: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveProfile} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Perubahan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Notifikasi</CardTitle>
                <CardDescription>Kelola bagaimana Anda menerima notifikasi dan pembaruan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Aktifkan Notifikasi</Label>
                    <p className="text-sm text-muted-foreground">Terima notifikasi untuk aktivitas penting</p>
                  </div>
                  <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">Email Notifikasi</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi melalui email</p>
                      </div>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">Push Notifikasi</Label>
                        <p className="text-sm text-muted-foreground">Terima notifikasi push di perangkat</p>
                      </div>
                    </div>
                    <Switch
                      checked={pushNotifications}
                      onCheckedChange={setPushNotifications}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Volume2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label className="text-base">Suara Notifikasi</Label>
                        <p className="text-sm text-muted-foreground">Putar suara untuk notifikasi</p>
                      </div>
                    </div>
                    <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} disabled={!notificationsEnabled} />
                  </div>
                </div>

                <Button onClick={handleSaveNotifications} className="w-full md:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Simpan Pengaturan
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Keamanan Akun</CardTitle>
                <CardDescription>Kelola password dan pengaturan keamanan akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Password Saat Ini</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Password Baru</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Konfirmasi Password Baru</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>

                <Button onClick={handleSavePassword} disabled={isLoading} className="w-full md:w-auto">
                  {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Ubah Password
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Aktivitas Login</CardTitle>
                <CardDescription>Riwayat login dan aktivitas keamanan terbaru</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Login dari Chrome</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date().toLocaleDateString("id-ID")} - Jakarta, Indonesia
                          </p>
                        </div>
                      </div>
                      <Badge variant={i === 1 ? "default" : "secondary"}>{i === 1 ? "Aktif" : "Selesai"}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Tampilan</CardTitle>
                <CardDescription>Sesuaikan tampilan dan tema aplikasi</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Mode Gelap</Label>
                    <p className="text-sm text-muted-foreground">Gunakan tema gelap untuk mengurangi ketegangan mata</p>
                  </div>
                  <Switch checked={isDarkMode} onCheckedChange={handleThemeToggle} />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base">Tema Warna</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg cursor-pointer hover:bg-accent">
                      <div className="w-full h-8 bg-green-500 rounded mb-2"></div>
                      <p className="text-sm font-medium">Hijau (Default)</p>
                    </div>
                    <div className="p-3 border rounded-lg cursor-pointer hover:bg-accent opacity-50">
                      <div className="w-full h-8 bg-blue-500 rounded mb-2"></div>
                      <p className="text-sm font-medium">Biru</p>
                    </div>
                    <div className="p-3 border rounded-lg cursor-pointer hover:bg-accent opacity-50">
                      <div className="w-full h-8 bg-purple-500 rounded mb-2"></div>
                      <p className="text-sm font-medium">Ungu</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
