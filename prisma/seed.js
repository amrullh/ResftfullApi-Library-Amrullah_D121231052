const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Memulai seeding database...');

    // Hapus semua data 
    console.log('🗑️  Menghapus data lama...');
    await prisma.loan.deleteMany();
    await prisma.book.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('✅ Data lama dihapus');

    console.log('👥 Membuat users...');

    // 1. Admin user
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const admin = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@perpustakaan.com',
            password: adminPassword,
            name: 'Administrator',
            role: 'ADMIN'
        }
    });
    console.log(`✅ Admin created: ${admin.username} (${admin.role})`);

    // 2. Regular users
    const users = [];
    const userData = [
        { username: 'user1', email: 'user1@mail.com', name: 'User Satu' },
        { username: 'user2', email: 'user2@mail.com', name: 'User Dua' },
        { username: 'user3', email: 'user3@mail.com', name: 'User Tiga' }
    ];

    for (const data of userData) {
        const password = await bcrypt.hash('Password123!', 10);
        const user = await prisma.user.create({
            data: {
                ...data,
                password,
                role: 'MEMBER'
            }
        });
        users.push(user);
        console.log(`✅ User created: ${user.username} (${user.role})`);
    }

    // BUAT CATEGORIES 
    console.log('🏷️  Membuat categories...');

    const categories = await Promise.all([
        prisma.category.create({ data: { name: 'Fiksi' } }),
        prisma.category.create({ data: { name: 'Non-Fiksi' } }),
        prisma.category.create({ data: { name: 'Sains' } }),
        prisma.category.create({ data: { name: 'Sejarah' } }),
        prisma.category.create({ data: { name: 'Teknologi' } })
    ]);

    categories.forEach(cat => {
        console.log(`✅ Category created: ${cat.name}`);
    });

    //  BUAT BOOKS
    console.log('📚 Membuat books...');

    const books = await Promise.all([
        prisma.book.create({
            data: {
                title: 'White Night',
                author: 'Fyodor Dostoevsky',
                stock: 5,
                description: 'Novel klasik Rusia tentang cinta dan pengorbanan',
                categories: {
                    connect: [{ id: categories[0].id }] // Fiksi
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'The Crime and Punishment',
                author: 'Fyodor Dostoevsky',
                stock: 3,
                description: 'Novel filosofis tentang moralitas dan penyesalan',
                categories: {
                    connect: [{ id: categories[0].id }, { id: categories[3].id }] // Fiksi, Sejarah
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'Introduction to Algorithms',
                author: 'Thomas H. Cormen',
                stock: 7,
                description: 'Buku algoritma terbaik untuk pemula hingga expert',
                categories: {
                    connect: [{ id: categories[2].id }, { id: categories[4].id }] // Sains, Teknologi
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'Clean Code',
                author: 'Robert C. Martin',
                stock: 4,
                description: 'Panduan praktis menulis kode yang bersih dan maintainable',
                categories: {
                    connect: [{ id: categories[4].id }] // Teknologi
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'Sapiens: A Brief History of Humankind',
                author: 'Yuval Noah Harari',
                stock: 6,
                description: 'Sejarah peradaban manusia dari zaman batu hingga sekarang',
                categories: {
                    connect: [{ id: categories[1].id }, { id: categories[3].id }] // Non-Fiksi, Sejarah
                }
            }
        })
    ]);

    books.forEach(book => {
        console.log(`✅ Book created: "${book.title}" by ${book.author}`);
    });

    //  BUAT LOANS 
    console.log('📖 Membuat loans...');

    // Hitung due date: 7 hari dari sekarang
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    const loans = await Promise.all([
        prisma.loan.create({
            data: {
                userId: users[0].id,    // user1
                bookId: books[0].id,    // White Night
                dueDate: dueDate,
                status: 'BORROWED'
            }
        }),
        prisma.loan.create({
            data: {
                userId: users[1].id,    // user2
                bookId: books[2].id,    // Introduction to Algorithms
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 hari
                status: 'BORROWED'
            }
        }),
        // Loan yang sudah dikembalikan
        prisma.loan.create({
            data: {
                userId: users[2].id,    // user3
                bookId: books[3].id,    // Clean Code
                dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 hari yang lalu
                returnDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 hari yang lalu
                status: 'RETURNED'
            }
        })
    ]);

    console.log(`✅ ${loans.length} loans created`);

    // FINAL SUMMARY
    console.log('\n SEEDING BERHASIL!');
    console.log('='.repeat(40));
    console.log(' DATA SUMMARY:');
    console.log(` Users: ${users.length + 1} (1 admin, ${users.length} members)`);
    console.log(` Books: ${books.length}`);
    console.log(`  Categories: ${categories.length}`);
    console.log(` Loans: ${loans.length} (2 active, 1 returned)`);

    console.log('\n TESTING CREDENTIALS:');
    console.log('='.repeat(40));
    console.log(' ADMIN:');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('  Email: admin@perpustakaan.com');
    console.log('  Role: ADMIN');

    console.log('\n👤 MEMBER USERS:');
    console.log('  Username: user1 / user2 / user3');
    console.log('  Password: Password123!');
    console.log('  Role: MEMBER');

    console.log('\n🌐 TEST ENDPOINTS:');
    console.log('  GET  /health              - Health check');
    console.log('  POST /api/auth/login      - Login dengan credentials di atas');
    console.log('  GET  /api/books           - Lihat daftar buku');
    console.log('  GET  /api/categories      - Lihat kategori');

    console.log('\n🚀 Selamat menggunakan API Perpustakaan!');
}

main()
    .catch((error) => {
        console.error('Seeding gagal:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });