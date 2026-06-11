# IoT Smart Irrigation Backend

Backend service untuk sistem irigasi pintar (*Smart Irrigation*) yang menghubungkan *hardware node* (ESP8266/Mikrokontroler) dengan *dashboard frontend* (React). Sistem ini dibangun menggunakan **Go (Golang)** dengan menerapkan **Clean Architecture** (Domains, Handler, Service, Repository) serta mendukung protokol komunikasi ganda (HTTP dan MQTT).

## 🚀 Fitur Utama

* **Hybrid Ingress (Multi-Protocol):**
    * **HTTP REST API:** Melayani *request* sinkron dari aplikasi klien (Web/Frontend) untuk manajemen data (CRUD jadwal, plot, autentikasi).
    * **MQTT Broker Integration:** Menangani komunikasi asinkron dua arah dengan perangkat keras IoT (Telemetri sensor dan kontrol aktuator secara *real-time*).
* **Real-time Monitoring:** Menerima dan menyimpan pembacaan sensor kelembapan tanah dan ultrasonik (level air tandon) secara presisi.
* **Actuator Control:** Mengirimkan *command payload* ke mikrokontroler untuk menyalakan/mematikan pompa air atau servo secara manual.
* **Automated Scheduling:** Manajemen jadwal irigasi otomatis berdasarkan hari aktif, waktu mulai, dan durasi penyiraman.
* **Security:** Dilengkapi dengan sistem autentikasi JWT (JSON Web Token) dan perlindungan CORS (*Cross-Origin Resource Sharing*).

## 🛠️ Teknologi yang Digunakan

* **Bahasa Pemrograman:** Go (Golang)
* **Database:** MySQL
* **Protokol IoT:** MQTT (Paho MQTT Client)
* **Infrastruktur:** Docker & Docker Compose (Opsional)

## 📁 Struktur Direktori (Clean Architecture)

Proyek ini dipisahkan berdasarkan tanggung jawab teknis untuk memastikan kemudahan pemeliharaan dan skalabilitas:

├── cmd/
│   └── main.go                 # Titik masuk utama aplikasi (Inisialisasi HTTP & MQTT)
├── internal/
│   ├── domains/                # Definisi entitas (Struct) dan antarmuka (Interface)
│   ├── handler/                # Pintu masuk request (HTTP API Controller & MQTT Subscriber)
│   ├── service/                # Logika bisnis sistem irigasi (Usecase)
│   └── repository/             # Akses langsung ke database MySQL (Query SQL)
├── pkg/
│   └── middleware/             # Logika penengah seperti JWT Auth & CORS
└── go.mod

## 📡 Alur Komunikasi Topik MQTT

Backend secara aktif berlangganan (*subscribe*) dan mempublikasikan (*publish*) pesan ke *broker* melalui topik berikut:

| Topik | Tipe | Format Payload (JSON) | Deskripsi |
| :--- | :--- | :--- | :--- |
| `iot/sensors` | Subscribe | `{"plot_id": 1, "soil_moisture_pct": 80}` | Telemetri kelembapan tanah dari ESP8266 |
| `iot/levels` | Subscribe | `{"tank_id": 1, "water_level_cm": 15}` | Jarak ultrasonik pengukur tandon air |
| `iot/control/{id}` | Publish | `{"action": "ON"}` | Mengirim perintah aktuasi pompa ke ESP8266 |

## ⚙️ Prasyarat (Prerequisites)

Sebelum menjalankan aplikasi, pastikan sistem Anda telah terinstal:
* [Go](https://go.dev/) (versi 1.18 atau terbaru)
* MySQL Server
* MQTT Broker (seperti Eclipse Mosquitto, EMQX, atau HiveMQ)
* Docker (Opsional, untuk kontainerisasi)

## 🔧 Instalasi & Konfigurasi

1.  **Kloning repositori ini:**
    git clone https://github.com/username/irrigation-backend.git
    cd irrigation-backend

2.  **Instal dependensi:**
    go mod tidy

3.  **Pengaturan Environment Variables:**
    Atur variabel lingkungan di dalam file `.env` atau langsung di *environment* sistem Anda:
    PORT=8080
    DB_DSN=user_iot:password_iot@tcp(localhost:3307)/iot_irrigation_db?parseTime=true&loc=UTC
    MQTT_BROKER=tcp://localhost:1883
    JWT_SECRET=rahasia_sistem_anda
    
    *(Catatan: Penambahan parameter `?parseTime=true&loc=UTC` pada DSN sangat krusial agar Go dapat melakukan pemindaian tipe data waktu SQL secara akurat).*

## ▶️ Menjalankan Aplikasi

**Secara Lokal (Tanpa Docker):**
go run cmd/main.go

**Menggunakan Docker Compose:**
Jika Anda telah menyertakan `docker-compose.yml`, jalankan perintah berikut untuk menginisiasi server Go bersamaan dengan MySQL dan MQTT Broker:
docker-compose up -d --build

Setelah aplikasi berjalan, log inisialisasi akan muncul di terminal:
Berhasil terhubung ke MQTT Broker
server berjalan di :8080
