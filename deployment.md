Dokumen ini berisi detail teknis, konfigurasi server, dan langkah-langkah deployment untuk aplikasi **Library System API** ke layanan cloud AWS EC2. Laporan ini disusun sebagai syarat penyelesaian Final Project Mata Kuliah Pemrograman Web.

## 1\. Project Information

| Informasi | Detail |
| :--- | :--- |
| **Repository GitHub** | [https://github.com/amrullh/library-system-api] |
| **Production Base URL** | `http://54.157.58.176:3000/api` |
| **Health Check URL** | `http://54.157.58.176:3000/health` |
| **Tech Stack** | Node.js, Express, Prisma ORM, SQLite, PM2 |

## 2\. AWS EC2 Infrastructure Details

Spesifikasi server yang digunakan untuk deployment ini:

  * **Instance ID:** `i-08b432f3a16a63a5a`
  * **Instance Type:** `t2.micro` (Free Tier Eligible)
  * **Operating System:** Ubuntu Server 22.04 LTS
  * **Public IPv4:** `54.157.58.176`
  * **Region:** us-east-1 (N. Virginia)
  * **Security Group Rules (Inbound):**
      * `22` (SSH) - Akses Remote
      * `80` (HTTP) - Web Server Standard
      * `443` (HTTPS) - Secure Web
      * `3000` (Custom TCP) - **Port Aplikasi Node.js**

## 3\. Environment Configuration

File `.env` di server production dikonfigurasi sebagai berikut:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration (SQLite File)
DATABASE_URL="file:./dev.db"

# Security (JWT Secrets)
# Secret key yang kuat digunakan untuk signing token di production
JWT_SECRET="Elden-Ring-Is-The-Best-Game-Ever-1234567890-!@#$%^&*()-+=[]{}|;:',.<>/?`~"
JWT_REFRESH_SECRET="and-Dark-souls-also"
```

## 4\. Deployment Steps (Step-by-Step)

Berikut adalah langkah-langkah teknis yang dilakukan dari inisialisasi server hingga aplikasi live:

### A. Persiapan Server (Initial Setup)

1.  **Akses SSH:** Masuk ke instance AWS menggunakan private key.
    ```bash
    ssh -i "labsuser.pem" ubuntu@54.157.58.176
    ```
2.  **Update Package System:**
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
3.  **Instalasi Dependencies Utama:**
    ```bash
    # Install Node.js v18
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs

    # Install Git & PM2
    sudo apt install git -y
    sudo npm install -g pm2
    ```

### B. Deployment Aplikasi & Database

1.  **Clone Repository:**
    ```bash
    git clone [LINK_GITHUB_KAMU] library-system-api
    cd library-system-api
    ```
2.  **Install Project Dependencies:**
    ```bash
    npm install
    ```
3.  **Setup Environment Variables:**
    Membuat file `.env` dengan `nano .env` dan menempelkan konfigurasi production.
4.  **Database Migration & Seeding:**
    Menginisialisasi database SQLite dan mengisi data awal (Admin, Buku, Kategori).
    ```bash
    npx prisma generate
    npx prisma migrate deploy
    npm run seed
    ```
    *Output Seeding:* Sukses membuat 1 Admin, 3 User Regular, 5 Kategori, 5 Buku, dan 3 Data Peminjaman.

### C. Process Management (PM2)

Agar aplikasi berjalan di latar belakang (background) dan auto-restart:

1.  **Start Aplikasi:**
    ```bash
    pm2 start src/app.js --name library-api
    ```
2.  **Setup Startup Script:**
    ```bash
    pm2 startup
    # Menjalankan command output dari PM2 untuk mengunci process ke systemd
    pm2 save
    ```

### D. Konfigurasi Firewall (Crucial Step)

Agar aplikasi bisa diakses publik melalui port 3000:

1.  Masuk ke **AWS Console** \> **EC2** \> **Security Groups**.
2.  Edit **Inbound Rules**.
3.  Menambahkan Rule: **Custom TCP**, Port **3000**, Source **0.0.0.0/0**.

## 5\. Test Credentials (Untuk Penguji)

Berdasarkan data seeding yang telah dijalankan, berikut akun yang dapat digunakan untuk pengujian:

### 👑 Role: ADMIN

Akun ini memiliki akses penuh (CRUD Buku, Kategori, Users).

  * **Email:** `admin@perpustakaan.com`
  * **Password:** `Admin123!`

### 👤 Role: MEMBER

Akun ini hanya bisa meminjam buku dan melihat profil.

  * **Email:** `user1@mail.com`
  * **Password:** `Password123!`

*(Tersedia juga `user2@mail.com` dan `user3@mail.com` dengan password yang sama)*

## 6\. Verification & Troubleshooting

### Verifikasi Deployment

1.  **Health Check:** Akses `http://54.157.58.176:3000/health` -\> Response `200 OK`.
2.  **Login Test:** Mengirim POST request ke `/api/auth/login` menggunakan kredensial Admin di atas -\> Berhasil mendapatkan JWT Token.

### Masalah yang Dihadapi & Solusi

  * **Isu:** *Connection Timed Out* saat mengakses via Postman.
  * **Analisis:** Port 3000 belum dibuka di AWS Security Group (default hanya 22, 80, 443).
  * **Solusi:** Menambahkan aturan *Inbound Rule* untuk Port 3000 di dashboard EC2. Akses berhasil segera setelah aturan disimpan.

## 7\. Maintenance Commands

Panduan ringkas untuk pemeliharaan server:

  * **Cek Log Aplikasi:** `pm2 logs library-api`
  * **Restart Aplikasi:** `pm2 restart library-api`
  * **Update Code:**
    ```bash
    git pull origin main
    npm install
    npx prisma migrate deploy
    pm2 restart library-api
    ```