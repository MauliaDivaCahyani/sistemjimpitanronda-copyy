"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authenticateUser } from "@/lib/auth"
import type { User } from "@/types/auth"
import { Eye, EyeOff, Loader2, Phone, UserIcon } from "lucide-react"

interface LoginFormProps {
  onLogin: (user: User) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPhonePassword, setShowPhonePassword] = useState(false)
  const [showUsernamePassword, setShowUsernamePassword] = useState(false)

  const [phoneLogin, setPhoneLogin] = useState({
    nomorHp: "",
    password: "",
  })

  const [usernameLogin, setUsernameLogin] = useState({
    username: "",
    password: "",
  })

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await authenticateUser(phoneLogin.nomorHp, phoneLogin.password, "phone")
      if (user) {
        onLogin(user)
      } else {
        setError("Nomor HP tidak ditemukan atau tidak aktif")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUsernameLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const user = await authenticateUser(usernameLogin.username, usernameLogin.password, "username")
      if (user) {
        onLogin(user)
      } else {
        setError("Username tidak ditemukan atau tidak aktif")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
            <span className="text-2xl font-bold text-primary-foreground">DW</span>
          </div>
          <CardTitle className="text-2xl font-bold">Dana Warga</CardTitle>
          <CardDescription>Sistem Informasi Manajemen Pengumpulan Dana Warga</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="warga" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="warga" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Warga
              </TabsTrigger>
              <TabsTrigger value="petugas" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Petugas/Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="warga">
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor HP</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={phoneLogin.nomorHp}
                    onChange={(e) => setPhoneLogin((prev) => ({ ...prev, nomorHp: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="phone-password"
                      type={showPhonePassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={phoneLogin.password}
                      onChange={(e) => setPhoneLogin((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPhonePassword(!showPhonePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPhonePassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk sebagai Warga
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="petugas">
              <form onSubmit={handleUsernameLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Masukkan username"
                    value={usernameLogin.username}
                    onChange={(e) => setUsernameLogin((prev) => ({ ...prev, username: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="username-password"
                      type={showUsernamePassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      value={usernameLogin.password}
                      onChange={(e) => setUsernameLogin((prev) => ({ ...prev, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowUsernamePassword(!showUsernamePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showUsernamePassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Masuk sebagai Petugas/Admin
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
