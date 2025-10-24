"use client"
import { useState } from "react"
import { Bell, CheckCircle, AlertCircle, Clock, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning"
  timestamp: string
  read: boolean
}

const allNotifications: Notification[] = [
  {
    id: "1",
    title: "Donasi Baru",
    message: 'Anda menerima donasi sebesar Rp 500.000 dari Ahmad Rizki untuk kampanye "Bantuan Pendidikan Anak Yatim"',
    type: "success",
    timestamp: "2 menit yang lalu",
    read: false,
  },
  {
    id: "2",
    title: "Target Tercapai",
    message: 'Kampanye "Bantuan Pendidikan" telah mencapai 75% dari target sebesar Rp 10.000.000',
    type: "info",
    timestamp: "1 jam yang lalu",
    read: false,
  },
  {
    id: "3",
    title: "Peringatan",
    message: 'Kampanye "Renovasi Masjid" akan berakhir dalam 3 hari. Pastikan untuk mempromosikan kampanye ini.',
    type: "warning",
    timestamp: "3 jam yang lalu",
    read: false,
  },
  {
    id: "4",
    title: "Donasi Berhasil",
    message: "Donasi sebesar Rp 250.000 dari Siti Nurhaliza telah berhasil diproses",
    type: "success",
    timestamp: "1 hari yang lalu",
    read: true,
  },
  {
    id: "5",
    title: "Kampanye Baru",
    message: 'Kampanye "Bantuan Korban Bencana" telah berhasil dibuat dan dipublikasikan',
    type: "info",
    timestamp: "2 hari yang lalu",
    read: true,
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(allNotifications)

  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      default:
        return <Clock className="h-5 w-5 text-blue-500" />
    }
  }

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <Card className={`mb-4 ${!notification.read ? "border-l-4 border-l-blue-500 bg-muted/30" : ""}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            {getNotificationIcon(notification.type)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm">{notification.title}</h3>
                {!notification.read && <div className="h-2 w-2 bg-blue-500 rounded-full" />}
              </div>
              <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
              <p className="text-xs text-muted-foreground">{notification.timestamp}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!notification.read && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)} className="text-xs">
                Tandai Dibaca
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteNotification(notification.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Notifikasi</h1>
          {unreadNotifications.length > 0 && (
            <Badge variant="secondary">{unreadNotifications.length} belum dibaca</Badge>
          )}
        </div>
        {unreadNotifications.length > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Tandai Semua Dibaca
          </Button>
        )}
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Semua ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Belum Dibaca ({unreadNotifications.length})</TabsTrigger>
          <TabsTrigger value="read">Sudah Dibaca ({readNotifications.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Tidak ada notifikasi</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => <NotificationCard key={notification.id} notification={notification} />)
          )}
        </TabsContent>

        <TabsContent value="unread" className="mt-6">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-muted-foreground">Semua notifikasi sudah dibaca</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>

        <TabsContent value="read" className="mt-6">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Tidak ada notifikasi yang sudah dibaca</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
