Berikut adalah draft lengkap untuk file **`API-DOCS.md`**. File ini disusun dengan format standar dokumentasi API yang profesional, menggunakan IP Production kamu, dan siap untuk dikumpulkan sebagai bagian dari tugas akhir.

Silakan **Copy-Paste** konten di bawah ini ke dalam file baru bernama `API-DOCS.md` di repository kamu.

-----

# 📖 Library System API Documentation

Dokumentasi lengkap untuk **Library System API**. API ini di-deploy menggunakan AWS EC2 dan siap untuk digunakan.

**Base URL Production:**

```
http://54.157.58.176:3000
```

-----

## 🔐 Authentication & Authorization

API ini menggunakan **JWT (JSON Web Token)** untuk autentikasi.

  * **Public Endpoints:** Tidak memerlukan token (misal: Login, Register, Get Books).
  * **Protected Endpoints:** Memerlukan header `Authorization`.

**Format Header:**

```http
Authorization: Bearer <your_access_token>
```

-----

## 🧪 Test Credentials (Seeded Data)

Gunakan akun berikut untuk pengujian aplikasi:

| Role | Username | Password | Deskripsi |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin` | `Admin123!` | Akses penuh (CRUD Buku, Kategori, User) |
| **MEMBER** | `user1` | `Password123!` | Hanya bisa meminjam & lihat profil |
| **MEMBER** | `user2` | `Password123!` | Hanya bisa meminjam & lihat profil |

-----

## 1\. System Endpoints

### Health Check

Mengecek apakah server berjalan dengan normal.

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/health`

### Root Endpoint

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/`

-----

## 2\. Authentication Endpoints

### Register User

Mendaftarkan pengguna baru (Role default: MEMBER).

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/auth/register`
  * **Body:**
    ```json
    {
      "username": "newuser",
      "email": "newuser@example.com",
      "password": "StrongPassword123!",
      "name": "New User Name"
    }
    ```

### Login

Masuk untuk mendapatkan Access Token dan Refresh Token.

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/auth/login`
  * **Body:**
    ```json
    {
      "username": "admin",
      "password": "Admin123!"
    }
    ```

### Refresh Token

Memperbarui Access Token yang kadaluarsa.

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/auth/refresh-token`
  * **Body:**
    ```json
    {
      "refreshToken": "ey..."
    }
    ```

### Get Current Profile

Melihat profil user yang sedang login.

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/auth/me`
  * **Header:** `Authorization: Bearer <token>`

### Logout

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/auth/logout`
  * **Header:** `Authorization: Bearer <token>`

-----

## 3\. Book Endpoints

### Get All Books (Public)

Mengambil daftar buku dengan fitur filtering dan pagination.

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/books`
  * **Query Parameters (Optional):**
      * `page`: Nomor halaman (default: 1)
      * `limit`: Data per halaman (default: 10)
      * `search`: Cari judul/deskripsi
      * `author`: Filter berdasarkan penulis
      * `sortBy`: `title`, `stock`, dll.
      * `order`: `asc` atau `desc`

### Get Book Detail

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/books/:id`

### Create Book (Admin Only)

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/books`
  * **Header:** `Authorization: Bearer <admin_token>`
  * **Body:**
    ```json
    {
      "title": "Clean Architecture",
      "author": "Robert C. Martin",
      "stock": 10,
      "description": "A Craftsman's Guide to Software Structure",
    }
    ```

### Update Book (Admin Only)

  * **Method:** `PUT`
  * **URL:** `http://54.157.58.176:3000/api/books/:id`
  * **Header:** `Authorization: Bearer <admin_token>`
  * **Body:**
    ```json
    {
      "stock": 15,
      "description": "Updated description"
    }
    ```

### Delete Book (Admin Only)

  * **Method:** `DELETE`
  * **URL:** `http://54.157.58.176:3000/api/books/:id`
  * **Header:** `Authorization: Bearer <admin_token>`

-----

## 4\. Category Endpoints

### Get All Categories

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/categories`

### Create Category (Admin Only)

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/categories`
  * **Header:** `Authorization: Bearer <admin_token>`
  * **Body:**
    ```json
    {
      "name": "Artificial Intelligence"
    }
    ```

### Update Category (Admin Only)

  * **Method:** `PUT`
  * **URL:** `http://54.157.58.176:3000/api/categories/:id`
  * **Header:** `Authorization: Bearer <admin_token>`
  * **Body:**
    ```json
    {
      "name": "AI & Machine Learning"
    }
    ```

### Delete Category (Admin Only)

  * **Method:** `DELETE`
  * **URL:** `http://54.157.58.176:3000/api/categories/:id`
  * **Header:** `Authorization: Bearer <admin_token>`

-----

## 5\. Loan Endpoints

### Create Loan (Borrow Book)

Meminjam buku.

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/loans`
  * **Header:** `Authorization: Bearer <user_token>`
  * **Body:**
    ```json
    {
      "bookId": 1,
      "dueDays": 7
    }
    ```

### Get All Loans (User History)

Melihat history peminjaman. Admin bisa melihat semua, User hanya miliknya sendiri.

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/loans`
  * **Header:** `Authorization: Bearer <token>`
  * **Query Params:** `?status=BORROWED` atau `?status=RETURNED`

### Get Loan Detail

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/loans/:id`
  * **Header:** `Authorization: Bearer <token>`

### Cancel Loan

Membatalkan peminjaman.

  * **Method:** `DELETE`
  * **URL:** `http://54.157.58.176:3000/api/loans/:id/cancel`
  * **Header:** `Authorization: Bearer <token>`

### Force Return (Admin Only)

Admin memaksa pengembalian buku (misal jika user lupa konfirmasi).

  * **Method:** `POST`
  * **URL:** `http://54.157.58.176:3000/api/loans/:id/force-return`
  * **Header:** `Authorization: Bearer <admin_token>`

-----

## 6\. User Endpoints

### Get All Users (Admin Only)

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/users`
  * **Header:** `Authorization: Bearer <admin_token>`

### Get User Detail

  * **Method:** `GET`
  * **URL:** `http://54.157.58.176:3000/api/users/:id`
  * **Header:** `Authorization: Bearer <token>`

### Update User Profile

Update data diri sendiri.

  * **Method:** `PUT`
  * **URL:** `http://54.157.58.176:3000/api/users/:id`
  * **Header:** `Authorization: Bearer <token>`
  * **Body:**
    ```json
    {
      "name": "New Name",
      "email": "newemail@example.com"
    }
    ```

### Update User Role (Admin Only)

Mengubah role user menjadi ADMIN atau MEMBER.

  * **Method:** `PATCH`
  * **URL:** `http://54.157.58.176:3000/api/users/:id/role`
  * **Header:** `Authorization: Bearer <admin_token>`
  * **Body:**
    ```json
    {
      "role": "ADMIN"
    }
    ```
