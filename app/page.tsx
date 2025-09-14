"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, MapPin, Navigation, User, Bell, Plus, Clock, ChevronRight, Calendar, Leaf } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type CompostingStage = 0 | 1 | 2 | 3 | 4 | 5

interface LocationData {
  address: string
  lat: number
  lng: number
}

interface GoogleMapsGeocoderResult {
  formatted_address: string
  geometry: {
    location: {
      lat(): number
      lng(): number
    }
  }
}

interface GoogleMapsGeocoder {
  geocode(
    request: { location: { lat: number; lng: number } },
    callback: (results: GoogleMapsGeocoderResult[] | null, status: string) => void,
  ): void
}

interface GoogleMaps {
  Map: any
  Marker: any
  Geocoder: new () => GoogleMapsGeocoder
  SymbolPath: {
    CIRCLE: any
  }
}

declare global {
  interface Window {
    google?: {
      maps?: GoogleMaps
    }
  }
}

export default function HomePage() {
  const [currentPage, setCurrentPage] = useState<
    | "home"
    | "profile"
    | "notifications"
    | "add-location"
    | "location-map"
    | "input-device"
    | "dashboard"
    | "menu-task"
    | "task-pra-kompos"
    | "task-anorganik"
    | "task-ai"
  >("home")
  const [devices, setDevices] = useState<Array<{ id: string; name: string; installDate: string }>>([])
  const [deviceName, setDeviceName] = useState("")
  const [selectedDevice, setSelectedDevice] = useState<{ id: string; name: string; installDate: string } | null>(null)

  const [currentLocation, setCurrentLocation] = useState<LocationData>({
    address: "Sumber pucung",
    lat: -7.9666,
    lng: 112.6326,
  })
  const [hasLocationPermission, setHasLocationPermission] = useState(false)
  const [hasWifiPermission, setHasWifiPermission] = useState(false)

  const [compostingStage, setCompostingStage] = useState<CompostingStage>(0)
  const [stageStartTime, setStageStartTime] = useState<number>(Date.now())

  const [wasteData, setWasteData] = useState({
    sterofoam: 202,
    plastik: 1.5,
    kertasMinyak: 52,
    maxCapacity: 1000, // grams
  })

  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showCalendar, setShowCalendar] = useState(false)
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) return Promise.resolve()

      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places`
        script.async = true
        script.defer = true
        script.onload = resolve
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    loadGoogleMaps().catch(() => {
      console.log("Google Maps failed to load, using fallback")
    })
  }, [])

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder()
        const result = await new Promise<GoogleMapsGeocoderResult[]>((resolve, reject) => {
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results) {
              resolve(results)
            } else {
              reject(status)
            }
          })
        })

        if (result[0]) {
          return result[0].formatted_address
        }
      }
    } catch (error) {
      console.log("Geocoding failed, using fallback")
    }

    // Fallback addresses based on coordinates
    const fallbackAddresses = [
      "Jl. Kenangan Indah No. 3 Kec. Mantan",
      "Jl. Sumber Pucung No. 15",
      "Jl. Malang Raya No. 22",
      "Jl. Sawojajar No. 8",
    ]
    return fallbackAddresses[Math.floor(Math.random() * fallbackAddresses.length)]
  }

  const requestPermissions = async () => {
    try {
      // Request location permission
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          })
        })

        setHasLocationPermission(true)
        const address = await reverseGeocode(position.coords.latitude, position.coords.longitude)
        setCurrentLocation({
          address,
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      }

      // Simulate WiFi permission (browser doesn't have direct WiFi API)
      setHasWifiPermission(true)

      return true
    } catch (error) {
      console.error("Permission denied:", error)
      return false
    }
  }

  const getWasteDataForDate = (date: Date) => {
    const dateKey = date.toDateString()
    const sampleData: Record<string, any> = {
      // September 11, 2025 - Peak at 12pm with 50 total
      [new Date(2025, 8, 11).toDateString()]: {
        hourlyData: [0, 0, 0, 0, 8, 0, 12, 0, 0, 0, 0, 0, 50, 18, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0],
        prediction: "18:00 pm - 01:00 am",
        summary: { anorganik: 28, jam: "12:00 pm", organik: 22 },
        peakHour: 12,
        peakValue: 50,
      },
      // September 12, 2025 - Peak at 1pm with 60 total
      [new Date(2025, 8, 12).toDateString()]: {
        hourlyData: [0, 0, 0, 0, 15, 0, 8, 0, 0, 0, 0, 0, 45, 60, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0],
        prediction: "17:30 pm - 00:30 am",
        summary: { anorganik: 35, jam: "01:00 pm", organik: 25 },
        peakHour: 13,
        peakValue: 60,
      },
      // September 13, 2025 - Peak at 10am with 42 total
      [new Date(2025, 8, 13).toDateString()]: {
        hourlyData: [0, 0, 0, 0, 5, 0, 18, 0, 0, 0, 42, 0, 25, 12, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0],
        prediction: "19:00 pm - 02:00 am",
        summary: { anorganik: 18, jam: "10:00 am", organik: 24 },
        peakHour: 10,
        peakValue: 42,
      },
      // September 14, 2025 - Peak at 3pm with 38 total
      [new Date(2025, 8, 14).toDateString()]: {
        hourlyData: [0, 0, 0, 0, 10, 0, 5, 0, 0, 0, 0, 0, 22, 15, 0, 38, 12, 0, 0, 0, 0, 0, 0, 0],
        prediction: "18:30 pm - 01:30 am",
        summary: { anorganik: 20, jam: "03:00 pm", organik: 18 },
        peakHour: 15,
        peakValue: 38,
      },
      // September 15, 2025 - Peak at 11am with 55 total
      [new Date(2025, 8, 15).toDateString()]: {
        hourlyData: [0, 0, 0, 0, 12, 0, 8, 0, 0, 0, 0, 55, 30, 20, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0],
        prediction: "17:00 pm - 00:00 am",
        summary: { anorganik: 32, jam: "11:00 am", organik: 23 },
        peakHour: 11,
        peakValue: 55,
      },
    }

    return sampleData[dateKey] || sampleData[new Date(2025, 8, 11).toDateString()]
  }

  const currentData = getWasteDataForDate(selectedDate)

  useEffect(() => {
    if (currentPage === "task-pra-kompos" && compostingStage > 0 && compostingStage < 5) {
      const stageDurations = {
        1: 30 * 60 * 1000, // 30 minutes for heating
        2: 60 * 60 * 1000, // 1 hour for grinding
        3: 2 * 60 * 1000, // 2 minutes for cooling
        4: 0, // immediate completion
      }

      const duration = stageDurations[compostingStage as keyof typeof stageDurations]
      if (duration > 0) {
        const timer = setTimeout(() => {
          setCompostingStage((prev) => (prev + 1) as CompostingStage)
          setStageStartTime(Date.now())
        }, duration)

        return () => clearTimeout(timer)
      }
    }
  }, [compostingStage, currentPage, stageStartTime])

  const generateDeviceId = () => {
    return String(Math.floor(100000 + Math.random() * 900000)).substring(0, 6)
  }

  const getCurrentDate = () => {
    return new Date()
      .toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
      .replace(/\//g, "")
  }

  const resetToHome = () => {
    setCurrentPage("home")
    setDevices([])
    setDeviceName("")
    setSelectedDevice(null)
    setCompostingStage(0)
    setStageStartTime(Date.now())
  }

  const getRemainingTime = () => {
    const stageDurations = {
      1: 30 * 60 * 1000, // 30 minutes
      2: 60 * 60 * 1000, // 1 hour
      3: 2 * 60 * 1000, // 2 minutes
    }

    const duration = stageDurations[compostingStage as keyof typeof stageDurations]
    if (!duration) return ""

    const elapsed = Date.now() - stageStartTime
    const remaining = Math.max(0, duration - elapsed)

    if (remaining === 0) return "Selesai"

    const minutes = Math.ceil(remaining / (60 * 1000))
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `Dalam waktu ${hours} jam ${minutes % 60} menit lagi`
    } else {
      return `Dalam waktu ${minutes} menit lagi`
    }
  }

  const renderAddLocationPage = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col justify-center">
        <div className="max-w-sm mx-auto w-full space-y-8">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold text-foreground">
              WTRASH is requesting the following access permissions
            </h1>
          </div>

          {/* Permission Card */}
          <Card className="p-6 bg-card border-border rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-card-foreground mb-2">Location</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Find locations, add devices, get a Wi-Fi network list, and perform scene automation.
                </p>
              </div>
            </div>
          </Card>

          {/* Add Location Button */}
          <Button
            className="w-full h-12 bg-[#66B4C1] hover:bg-[#5aa3b0] text-white font-medium rounded-xl"
            onClick={async () => {
              const permissionGranted = await requestPermissions()
              if (permissionGranted) {
                setCurrentPage("location-map")
              } else {
                alert("Location permission denied. Please enable location access to continue.")
              }
            }}
          >
            Add Location
          </Button>
        </div>
      </main>
    </div>
  )

  const renderLocationMapPage = () => (
    <div className="min-h-screen bg-background relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center p-4 bg-background/80 backdrop-blur-sm border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("add-location")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-green-50">
        {window.google && window.google.maps ? (
          // Google Maps container
          <div
            id="google-map"
            className="w-full h-full"
            ref={(el) => {
              if (el && window.google && !el.hasChildNodes()) {
                const map = new window.google.maps.Map(el, {
                  center: { lat: currentLocation.lat, lng: currentLocation.lng },
                  zoom: 16,
                  styles: [
                    {
                      featureType: "all",
                      elementType: "geometry.fill",
                      stylers: [{ color: "#f0f9ff" }],
                    },
                  ],
                })

                new window.google.maps.Marker({
                  position: { lat: currentLocation.lat, lng: currentLocation.lng },
                  map: map,
                  icon: {
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 8,
                    fillColor: "#66B4C1",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  },
                })
              }
            }}
          />
        ) : (
          // Fallback simulated map
          <div className="absolute inset-0 opacity-30">
            <svg className="w-full h-full" viewBox="0 0 400 800">
              <line x1="0" y1="200" x2="400" y2="200" stroke="#94a3b8" strokeWidth="2" />
              <line x1="0" y1="400" x2="400" y2="400" stroke="#94a3b8" strokeWidth="2" />
              <line x1="0" y1="600" x2="400" y2="600" stroke="#94a3b8" strokeWidth="2" />
              <line x1="100" y1="0" x2="100" y2="800" stroke="#94a3b8" strokeWidth="2" />
              <line x1="200" y1="0" x2="200" y2="800" stroke="#94a3b8" strokeWidth="3" />
              <line x1="300" y1="0" x2="300" y2="800" stroke="#94a3b8" strokeWidth="2" />
              <rect x="20" y="220" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="120" y="220" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="220" y="220" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="320" y="220" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="20" y="420" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="120" y="420" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="220" y="420" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
              <rect x="320" y="420" width="60" height="60" fill="#e2e8f0" opacity="0.7" />
            </svg>
          </div>
        )}
      </div>

      {/* Location Marker */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="w-8 h-8 bg-[#66B4C1] rounded-full flex items-center justify-center shadow-lg">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        {/* Marker bubble */}
        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-[#66B4C1] text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap shadow-lg">
          Temukan W-Trashmu! Mohon periksa kembali lokasi peta.
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#66B4C1]"></div>
        </div>
      </div>

      <div className="absolute top-20 left-4 right-4 z-20">
        <Card className="p-4 bg-white/95 backdrop-blur-sm border border-border rounded-xl shadow-lg">
          <h3 className="font-bold text-card-foreground mb-1">Titik W-Trash</h3>
          <p className="text-sm text-muted-foreground">{currentLocation.address}</p>
        </Card>
      </div>

      {/* Continue Button */}
      <div className="absolute bottom-6 left-4 right-4 z-20">
        <Button
          className="w-full h-12 bg-[#66B4C1] hover:bg-[#5aa3b0] text-white font-medium rounded-xl"
          onClick={() => {
            setCurrentPage("input-device")
          }}
        >
          Continue
        </Button>
      </div>

      {/* Floating Location Button */}
      <Button
        size="icon"
        className="absolute bottom-24 right-6 z-20 w-12 h-12 bg-white hover:bg-gray-50 text-gray-600 rounded-full shadow-lg border border-border"
        onClick={async () => {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject)
            })

            const address = await reverseGeocode(position.coords.latitude, position.coords.longitude)
            setCurrentLocation({
              address,
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            })

            // Re-render Google Map if available
            const mapEl = document.getElementById("google-map")
            if (mapEl && window.google) {
              const map = new window.google.maps.Map(mapEl, {
                center: { lat: position.coords.latitude, lng: position.coords.longitude },
                zoom: 16,
              })

              new window.google.maps.Marker({
                position: { lat: position.coords.latitude, lng: position.coords.longitude },
                map: map,
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#66B4C1",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                },
              })
            }
          } catch (error) {
            alert("Unable to get current location")
          }
        }}
      >
        <Navigation className="h-5 w-5" />
      </Button>
    </div>
  )

  const renderHomePage = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setCurrentPage("profile")}
          >
            <User className="h-5 w-5" />
          </Button>
          <div>
            <p className="font-semibold text-foreground">Loyna</p>
            <p className="text-sm text-muted-foreground">{devices.length} Device</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setCurrentPage("notifications")}
        >
          <Bell className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Promotional Banner */}
        <Card className="p-6 bg-card border-border rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Support to SDG's Program</p>
              <h2 className="text-lg font-bold text-card-foreground leading-tight">
                Dengan W-Trash kita dapat mewujudkan 1 hari 1 Pra-Kompos
              </h2>
            </div>
            <div className="ml-4 flex-shrink-0">
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-16 mx-auto mb-1 flex items-center justify-center">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cuplikan%20layar%202025-09-11%20173809-405pMozAKzdnOnGqRvUxUd1YzJTAN5.png"
                      alt="W-Trash Character"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">W-Trash</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Device Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Add Devices Button */}
          <Button
            variant="ghost"
            className="h-32 rounded-2xl bg-[#EEFDFF] hover:bg-[#EEFDFF]/80 border-2 border-dashed border-[#66B4C1]/30 flex flex-col items-center justify-center gap-2"
            onClick={() => setCurrentPage("add-location")}
          >
            <Plus className="h-8 w-8 text-[#66B4C1]" />
            <span className="text-sm font-medium text-[#66B4C1]">Add Devices</span>
          </Button>

          {/* Device Cards */}
          {devices.map((device) => (
            <Card
              key={device.id}
              className="h-32 p-4 bg-card border-border rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedDevice(device)
                setCurrentPage("menu-task")
              }}
            >
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cuplikan%20layar%202025-09-11%20173809-405pMozAKzdnOnGqRvUxUd1YzJTAN5.png"
                  alt="Device"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <p className="font-semibold text-card-foreground text-sm">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.id}</p>
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )

  const renderProfilePage = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center p-4 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")} className="mr-3">
          ←
        </Button>
        <h1 className="text-lg font-semibold">Profile Kamu</h1>
      </header>

      {/* Profile Content */}
      <main className="p-4 space-y-4">
        {/* User Profile Section */}
        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-card-foreground">Nama</p>
              <p className="text-sm text-muted-foreground">
                {devices.length} {devices.length === 1 ? "Device" : "Devices"}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            →
          </Button>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">📍</div>
              <span className="font-medium text-card-foreground">Lokasi Kamu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentLocation.address.split(",")[0] || currentLocation.address}
              </span>
              <Button variant="ghost" size="icon">
                →
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">📱</div>
              <span className="font-medium text-card-foreground">Devices Kamu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {devices.length} {devices.length === 1 ? "Device" : "Devices"}
              </span>
              <Button variant="ghost" size="icon">
                →
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )

  const renderNotificationsPage = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center p-4 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("home")} className="mr-3">
          ←
        </Button>
        <h1 className="text-lg font-semibold">Notifikasi Kamu</h1>
      </header>

      {/* Notifications Content */}
      <main className="p-4 space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border">
            <Avatar className="w-12 h-12 bg-primary">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">📱</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-semibold text-card-foreground">Device 1</p>
              <p className="text-sm text-muted-foreground">Segera ambil tindakan dan cek!</p>
            </div>
            <span className="text-xs text-muted-foreground">24 Mei</span>
          </div>
        ))}
      </main>
    </div>
  )

  const renderInputDevicePage = () => (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center p-4 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("location-map")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col">
        {/* Illustration */}
        <div className="flex justify-center mb-8">
          <div className="w-48 h-32 bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl flex items-center justify-center relative overflow-hidden">
            {/* Laptop illustration */}
            <div className="relative">
              {/* Laptop screen */}
              <div className="w-20 h-12 bg-gray-800 rounded-t-lg relative">
                <div className="w-16 h-8 bg-white rounded-sm absolute top-1 left-2 flex items-center justify-center">
                  <div className="text-xs text-gray-600">📊</div>
                </div>
              </div>
              {/* Laptop base */}
              <div className="w-24 h-2 bg-gray-600 rounded-b-lg"></div>

              {/* Hands */}
              <div className="absolute -bottom-2 -left-4 w-8 h-6 bg-orange-200 rounded-full transform rotate-12"></div>
              <div className="absolute -bottom-2 -right-4 w-8 h-6 bg-orange-200 rounded-full transform -rotate-12"></div>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-2 right-4 w-6 h-6 bg-white rounded-lg shadow-sm flex items-center justify-center">
              <div className="w-3 h-3 bg-teal-400 rounded"></div>
            </div>
            <div className="absolute bottom-4 left-4 w-4 h-4 bg-white rounded-full shadow-sm"></div>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6 flex-1">
          {/* Device Name Input */}
          <div className="space-y-2">
            <Label htmlFor="device-name" className="text-sm font-medium text-foreground">
              Nama Devicemu
            </Label>
            <Input
              id="device-name"
              type="text"
              placeholder="Ketik namamu..."
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="h-12 bg-muted border-border rounded-xl"
            />
          </div>

          {/* Device ID (Disabled) */}
          <div className="space-y-2">
            <Label htmlFor="device-id" className="text-sm font-medium text-foreground">
              ID Device*
            </Label>
            <Input
              id="device-id"
              type="text"
              value={generateDeviceId()}
              disabled
              className="h-12 bg-muted/50 border-border rounded-xl text-muted-foreground"
            />
          </div>

          {/* Installation Date (Disabled) */}
          <div className="space-y-2">
            <Label htmlFor="install-date" className="text-sm font-medium text-foreground">
              Tanggal Instalasi Device*
            </Label>
            <Input
              id="install-date"
              type="text"
              value={getCurrentDate()}
              disabled
              className="h-12 bg-muted/50 border-border rounded-xl text-muted-foreground"
            />
          </div>
        </div>

        {/* Done Button */}
        <div className="mt-8">
          <Button
            className="w-full h-12 bg-[#66B4C1] hover:bg-[#5aa3b0] text-white font-medium rounded-xl"
            onClick={() => {
              if (deviceName.trim()) {
                const newDevice = {
                  id: generateDeviceId(),
                  name: deviceName.trim(),
                  installDate: getCurrentDate(),
                }
                setDevices([...devices, newDevice])
                setDeviceName("")
                setCurrentPage("dashboard")
              } else {
                alert("Please enter a device name")
              }
            }}
            disabled={!deviceName.trim()}
          >
            Done
          </Button>
        </div>
      </main>
    </div>
  )

  const renderDashboardPage = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-background border-b border-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setCurrentPage("profile")}
          >
            <User className="h-5 w-5" />
          </Button>
          <div>
            <p className="font-semibold text-foreground">Loyna</p>
            <p className="text-sm text-muted-foreground">{devices.length} Device</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={resetToHome} className="text-xs px-3 py-1 h-8 bg-transparent">
            Reset
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setCurrentPage("notifications")}
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-6">
        {/* Promotional Banner */}
        <Card className="p-6 bg-card border-border rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-2">Support to SDG's Program</p>
              <h2 className="text-lg font-bold text-card-foreground leading-tight">
                Dengan W-Trash kita dapat mewujudkan 1 hari 1 Pra-Kompos
              </h2>
            </div>
            <div className="ml-4 flex-shrink-0">
              <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-16 mx-auto mb-1 flex items-center justify-center">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cuplikan%20layar%202025-09-11%20173809-405pMozAKzdnOnGqRvUxUd1YzJTAN5.png"
                      alt="W-Trash Character"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">W-Trash</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Device Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Device Cards */}
          {devices.map((device) => (
            <Card
              key={device.id}
              className="h-32 p-4 bg-card border-border rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setSelectedDevice(device)
                setCurrentPage("menu-task")
              }}
            >
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
                <img
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Cuplikan%20layar%202025-09-11%20173809-405pMozAKzdnOnGqRvUxUd1YzJTAN5.png"
                  alt="Device"
                  className="w-6 h-6 object-contain"
                />
              </div>
              <div>
                <p className="font-semibold text-card-foreground text-sm">{device.name}</p>
                <p className="text-xs text-muted-foreground">{device.id}</p>
              </div>
            </Card>
          ))}

          {/* Add Devices Button */}
          <Button
            variant="ghost"
            className="h-32 rounded-2xl bg-[#EEFDFF] hover:bg-[#EEFDFF]/80 border-2 border-dashed border-[#66B4C1]/30 flex flex-col items-center justify-center gap-2"
            onClick={() => setCurrentPage("add-location")}
          >
            <Plus className="h-8 w-8 text-[#66B4C1]" />
            <span className="text-sm font-medium text-[#66B4C1]">Add Devices</span>
          </Button>
        </div>

        {/* Success Message for new device */}
        {devices.length > 0 && (
          <div className="text-center py-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              Device berhasil ditambahkan! Klik device untuk melihat detail.
            </p>
            <Button variant="outline" size="sm" onClick={resetToHome} className="text-xs bg-transparent">
              Coba Lagi dari Awal
            </Button>
          </div>
        )}
      </main>
    </div>
  )

  const renderMenuTaskPage = () => (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center p-4 bg-background border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => setCurrentPage("dashboard")} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-lg font-semibold text-foreground">Menu Task</h1>
          {selectedDevice && <p className="text-sm text-muted-foreground">{selectedDevice.name}</p>}
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {/* Task Menu Cards */}
        <Card
          className="p-4 bg-card border-border rounded-xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => {
            setCompostingStage(0)
            setStageStartTime(Date.now())
            setCurrentPage("task-pra-kompos")
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Support to SDG's Program</p>
              <h3 className="font-semibold text-card-foreground">W-Trash Bagian Pra Kompos!</h3>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-4 bg-card border-border rounded-xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setCurrentPage("task-anorganik")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Support to SDG's Program</p>
              <h3 className="font-semibold text-card-foreground">W-Trash Sampah Anorganikmu!</h3>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>

        <Card
          className="p-4 bg-card border-border rounded-xl hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => setCurrentPage("task-ai")}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Support to SDG's Program</p>
              <h3 className="font-semibold text-card-foreground">W-Trash Bagian AI mu!</h3>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </Card>
      </main>
    </div>
  )

  const renderTaskPraKomposPage = () => {
    const getStageText = () => {
      switch (compostingStage) {
        case 0:
          return "W-Trash belum 550 gr, penuhi tempat sampahmu dengan hal-hal yang sehat!"
        case 1:
          return "Tunggu Sampahmu untuk W-Trash Sulap! Jadi apa yah?"
        case 2:
          return "Tunggu Sampahmu untuk W-Trash Sulap! Jadi apa yah?"
        case 3:
          return "Ga sadar udah diujung aja, Pra kompos kamu udah mau siap nih!"
        case 4:
        case 5:
          return "Pra Kompos kamu udah siap, Manfaatin dia dengan baik ya!"
        default:
          return ""
      }
    }

    const getProcessLabel = () => {
      switch (compostingStage) {
        case 0:
          return "Proses Penggilingan"
        case 1:
          return "Proses Pemanasan"
        case 2:
          return "Proses Penggilingan"
        case 3:
          return "Proses Pendinginan"
        case 4:
        case 5:
          return "Proses Pendinginan"
        default:
          return "Proses Penggilingan"
      }
    }

    const getProgressPercentage = () => {
      return Math.min((compostingStage / 4) * 100, 100)
    }

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center p-4 bg-background border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage("menu-task")} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Proses Pra-Komposmu</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-6">
          {/* W-Trash Character */}
          <div className="flex justify-center">
            <div className="relative">
              {/* W-Trash Container */}
              <div className="w-32 h-40 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-full rounded-b-lg relative">
                {/* Top lid */}
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-slate-400 rounded-full"></div>
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-slate-500 rounded-full"></div>

                {/* W-Trash label */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-slate-600 font-semibold">
                  W-Trash
                </div>

                {/* Face */}
                <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-20 h-12 bg-white rounded-lg">
                  {/* Eyes */}
                  <div className="absolute top-2 left-3 w-3 h-4 bg-black rounded-full"></div>
                  <div className="absolute top-2 right-3 w-3 h-4 bg-black rounded-full"></div>
                  {/* Smile */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-black rounded-full"></div>
                </div>

                {/* Bottom section */}
                <div className="absolute bottom-2 left-2 right-2 h-4 bg-slate-500 rounded"></div>
              </div>

              {/* Process bubble */}
              <div className="absolute -right-4 top-8 bg-white border border-border rounded-lg px-3 py-2 shadow-lg">
                <div className="text-xs font-medium text-foreground">{getProcessLabel()}</div>
                <div className="absolute left-0 top-1/2 transform -translate-x-1 -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-white"></div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-4">
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#66B4C1] transition-all duration-1000 ease-out"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Status Card */}
          <Card className="p-4 bg-card border-border rounded-xl">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  W-Trash Proses {getProcessLabel().replace("Proses ", "")}
                </p>
                <h3 className="font-semibold text-card-foreground leading-tight">{getStageText()}</h3>
              </div>

              {compostingStage > 0 && compostingStage < 4 && (
                <div className="text-sm text-[#66B4C1] font-medium">{getRemainingTime()}</div>
              )}

              {compostingStage === 0 && (
                <Button
                  className="w-full mt-4 bg-[#66B4C1] hover:bg-[#5aa3b0] text-white"
                  onClick={() => {
                    setCompostingStage(1)
                    setStageStartTime(Date.now())
                  }}
                >
                  Mulai Proses
                </Button>
              )}
            </div>
          </Card>

          {/* Items List */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-foreground mb-3">Barang yang boleh dimasukkan</h4>
              <div className="space-y-2">
                {[
                  "Limbah makanan",
                  "Selembat kertas",
                  "Styrofoam",
                  "Cup Plastik, kemasan botol",
                  "Sisa rambut",
                  "Limbah Alat Tulis Kantor",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-3">Barang yang tidak dapat dimasukkan</h4>
              <div className="space-y-2">
                {[
                  "Tulang besar dan keras",
                  "Kemasan botol kaleng",
                  "Trash Back",
                  "Sampah B3",
                  "Sampah Logam/elektronik",
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const renderTaskAnorganikPage = () => {
    const totalWaste = wasteData.sterofoam + wasteData.plastik * 1000 + wasteData.kertasMinyak // Convert kg to grams
    const fillPercentage = Math.min((totalWaste / wasteData.maxCapacity) * 100, 100)
    const isContainerFull = fillPercentage >= 80

    const wasteTypes = [
      { name: "Sterofoam", amount: `${wasteData.sterofoam} gr`, color: "#7DD3FC" },
      {
        name: "Plastik",
        amount: wasteData.plastik >= 1000 ? `${(wasteData.plastik / 1000).toFixed(1)} kg` : `${wasteData.plastik} gr`,
        color: "#0EA5E9",
      },
      { name: "Kertas Minyak", amount: `${wasteData.kertasMinyak} gr`, color: "#0284C7" },
    ]

    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="flex items-center p-4 bg-background border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setCurrentPage("menu-task")} className="mr-3">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Pantau Sampah Anorganik</h1>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-6">
          {/* Banner Section */}
          <Card className="p-4 bg-card border-border rounded-xl">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Support to SDG's Program</p>
              <h2 className="font-bold text-card-foreground leading-tight">
                Pantau – memantau Sampah Anorganikmu dan Manfaatkanlah!
              </h2>
            </div>
          </Card>

          {/* Container Visualization and Waste List */}
          <div className="flex items-center gap-6">
            {/* Cylindrical Container */}
            <div className="flex-shrink-0">
              <div className="relative w-24 h-64 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden">
                {/* Container fill with gradient layers */}
                <div className="absolute bottom-0 left-0 right-0 transition-all duration-1000">
                  {/* Bottom layer - darkest */}
                  <div
                    className="w-full bg-gradient-to-t from-[#0284C7] to-[#0EA5E9]"
                    style={{ height: `${Math.min(fillPercentage * 0.4, 40)}%` }}
                  ></div>
                  {/* Middle layer */}
                  <div
                    className="w-full bg-gradient-to-t from-[#0EA5E9] to-[#7DD3FC]"
                    style={{ height: `${Math.min(fillPercentage * 0.35, 35)}%` }}
                  ></div>
                  {/* Top layer - lightest */}
                  <div
                    className="w-full bg-gradient-to-t from-[#7DD3FC] to-[#BAE6FD]"
                    style={{ height: `${Math.min(fillPercentage * 0.25, 25)}%` }}
                  ></div>
                </div>

                {/* Container top rim */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-20 h-2 bg-gray-300 rounded-full"></div>
              </div>
            </div>

            {/* Waste Types List */}
            <div className="flex-1 space-y-3">
              {wasteTypes.map((waste, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-card rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: waste.color }}></div>
                    <span className="text-sm font-medium text-card-foreground">{waste.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-card-foreground">{waste.amount}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <Button
              className={`w-full h-12 font-medium rounded-xl transition-all ${
                isContainerFull
                  ? "bg-[#66B4C1] hover:bg-[#5aa3b0] text-white"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
              disabled={!isContainerFull}
              onClick={() => {
                if (isContainerFull) {
                  // Simulate WhatsApp redirect
                  const message = encodeURIComponent("Tempat sampah sudah penuh, mohon segera dikosongkan!")
                  const whatsappUrl = `https://wa.me/6281234567890?text=${message}`
                  window.open(whatsappUrl, "_blank")
                }
              }}
            >
              Tempat sampah Penuh {isContainerFull ? "" : ">"}
            </Button>
          </div>

          {/* Debug button to simulate container filling */}
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs bg-transparent"
              onClick={() => {
                setWasteData((prev) => ({
                  ...prev,
                  plastik: prev.plastik >= 1000 ? 2000 : 2000, // Toggle between states
                }))
              }}
            >
              {wasteData.plastik >= 1000 ? "Reset Container" : "Fill Container (Demo)"}
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const renderTaskAIPage = () => {
    const formatDate = (date: Date) => {
      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ]
      return `${days[date.getDay()]}, ${date.getDate()}, ${date.getFullYear()}`
    }

    const formatCalendarDate = (date: Date) => {
      const months = [
        "Januari",
        "Februari",
        "Maret",
        "April",
        "Mei",
        "Juni",
        "Juli",
        "Agustus",
        "September",
        "Oktober",
        "November",
        "Desember",
      ]
      return months[date.getMonth()]
    }

    const maxValue = Math.max(...currentData.hourlyData)

    return (
      <div className="min-h-screen bg-background relative">
        {/* Header */}
        <header className="flex items-center justify-between p-4 bg-background border-b border-border">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => setCurrentPage("menu-task")} className="mr-3">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Grafik pembuangan sampah</h1>
          </div>

          {/* Date Dropdown */}
          <Button
            variant="outline"
            onClick={() => setShowCalendar(true)}
            className="text-sm px-3 py-1 h-8 border-teal-500 text-teal-600 hover:bg-teal-50"
          >
            {formatDate(selectedDate)}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </header>

        {/* Main Content */}
        <main className="p-4 space-y-6">
          {/* Chart Section */}
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="h-80 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-muted-foreground py-4">
                <span>100</span>
                <span>80</span>
                <span>50</span>
                <span>20</span>
                <span>10</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-8 h-full flex items-end justify-between px-2 pb-10">
                {currentData.hourlyData.map((value: number, index: number) => (
                  <div
                    key={index}
                    className="flex flex-col items-center relative group cursor-pointer"
                    onMouseEnter={() => setHoveredHour(index)}
                    onMouseLeave={() => setHoveredHour(null)}
                  >
                    {/* Tooltip */}
                    {hoveredHour === index && value > 0 && (
                      <div className="absolute bottom-full mb-2 bg-white border border-border rounded-lg px-3 py-2 shadow-lg z-10 whitespace-nowrap">
                        <div className="text-xs font-medium text-foreground">{value} Sampah</div>
                        <div className="text-xs text-muted-foreground">
                          {String(index).padStart(2, "0")}:00 - {String(index + 1).padStart(2, "0")}:00
                        </div>
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      className="w-3 bg-teal-500 rounded-t-sm transition-all duration-200 hover:bg-teal-600"
                      style={{
                        height: `${Math.max((value / maxValue) * 240, value > 0 ? 8 : 0)}px`,
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-2 left-8 right-2 flex justify-between text-xs text-muted-foreground px-2">
                <span>0</span>
                <span>4</span>
                <span>8</span>
                <span>12</span>
                <span>16</span>
                <span>20</span>
                <span>24</span>
              </div>
            </div>
          </div>

          {/* AI Prediction Card */}
          <Card className="p-4 bg-card border-border rounded-xl">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-teal-600">Prediksi AI</h3>
              <div className="text-xl font-bold text-foreground">{currentData.prediction}</div>
              <p className="text-sm text-muted-foreground">waktu berjalannya Pra kompos W-trash</p>
            </div>
          </Card>

          {/* Summary Card */}
          <Card className="p-4 bg-card border-border rounded-xl">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Waktu Padat Wtrash</h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{currentData.summary.anorganik}</div>
                    <div className="text-xs text-muted-foreground">Anorganik</div>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{currentData.summary.jam}</div>
                    <div className="text-xs text-muted-foreground">Jam</div>
                  </div>
                </div>

                <div className="flex flex-col items-center space-y-2">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Leaf className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-foreground">{currentData.summary.organik}</div>
                    <div className="text-xs text-muted-foreground">Organik</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </main>

        {/* Calendar Popup */}
        {showCalendar && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-sm">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-teal-600">{formatCalendarDate(selectedDate)}</h3>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                    {day}
                  </div>
                ))}

                {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                  const isSelected = day === selectedDate.getDate()
                  const testDate = new Date(2025, 8, day) // September 2025
                  const hasData = [11, 12, 13, 14, 15].includes(day)

                  return (
                    <button
                      key={day}
                      onClick={() => {
                        setSelectedDate(testDate)
                      }}
                      disabled={!hasData}
                      className={`p-2 text-sm rounded-full transition-colors ${
                        isSelected
                          ? "bg-teal-500 text-white"
                          : hasData
                            ? "text-foreground hover:bg-teal-50 hover:text-teal-600"
                            : "text-muted-foreground/50 cursor-not-allowed"
                      }`}
                    >
                      {day}
                    </button>
                  )
                })}
              </div>

              <Button
                onClick={() => setShowCalendar(false)}
                className="w-full bg-teal-500 hover:bg-teal-600 text-white"
              >
                Select
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render current page
  switch (currentPage) {
    case "add-location":
      return renderAddLocationPage()
    case "location-map":
      return renderLocationMapPage()
    case "input-device":
      return renderInputDevicePage()
    case "dashboard":
      return renderDashboardPage()
    case "profile":
      return renderProfilePage()
    case "notifications":
      return renderNotificationsPage()
    case "menu-task":
      return renderMenuTaskPage()
    case "task-pra-kompos":
      return renderTaskPraKomposPage()
    case "task-anorganik":
      return renderTaskAnorganikPage()
    case "task-ai":
      return renderTaskAIPage()
    default:
      return renderHomePage()
  }
}

declare global {
  interface Window {
    google: any
  }
}
