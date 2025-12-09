const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log(' Memulai seeding database...');


    await prisma.loan.deleteMany();
    await prisma.book.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();

    console.log('Data lama dihapus');


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
    }

    console.log(`${users.length + 1} users created`);


    const categories = await Promise.all([
        prisma.category.create({ data: { name: 'Fiksi' } }),
        prisma.category.create({ data: { name: 'Non-Fiksi' } }),
        prisma.category.create({ data: { name: 'Sains' } }),
        prisma.category.create({ data: { name: 'Sejarah' } }),
        prisma.category.create({ data: { name: 'Teknologi' } })
    ]);

    console.log(`${categories.length} categories created`);


    const books = await Promise.all([
        prisma.book.create({
            data: {
                title: 'White Night',
                author: 'Fyodor Dostoevsky',
                stock: 5,
                description: 'Novel klasik Rusia',
                categories: {
                    connect: [{ id: categories[0].id }]
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'The Crime and Punishment',
                author: 'Fyodor Dostoevsky',
                stock: 3,
                description: 'Novel filosofis tentang moralitas',
                categories: {
                    connect: [{ id: categories[0].id }, { id: categories[3].id }]
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'Introduction to Algorithms',
                author: 'Thomas H. Cormen',
                stock: 7,
                description: 'Buku algoritma terbaik',
                categories: {
                    connect: [{ id: categories[2].id }, { id: categories[4].id }]
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'Clean Code',
                author: 'Robert C. Martin',
                stock: 4,
                description: 'Panduan menulis kode yang baik',
                categories: {
                    connect: [{ id: categories[4].id }]
                }
            }
        }),
        prisma.book.create({
            data: {
                title: 'Sapiens: A Brief History of Humankind',
                author: 'Yuval Noah Harari',
                stock: 6,
                description: 'Sejarah peradaban manusia',
                categories: {
                    connect: [{ id: categories[1].id }, { id: categories[3].id }]
                }
            }
        })
    ]);

    console.log(`${books.length} books created`);


    const loans = await Promise.all([
        prisma.loan.create({
            data: {
                userId: users[0].id,
                bookId: books[0].id,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                status: 'BORROWED'
            }
        }),
        prisma.loan.create({
            data: {
                userId: users[1].id,
                bookId: books[2].id,
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                status: 'BORROWED'
            }
        })
    ]);

    console.log(`${loans.length} loans created`);

    console.log('\n🎉 SEEDING BERHASIL!');
    console.log('\n📋 CREDENTIALS UNTUK TESTING:');
    console.log('==========================');
    console.log('👑 ADMIN:');
    console.log('  Username: admin');
    console.log('  Password: Admin123!');
    console.log('  Email: admin@perpustakaan.com');
    console.log('\n👤 REGULAR USERS:');
    console.log('  Username: user1 / user2 / user3');
    console.log('  Password: Password123!');
    console.log('\n🔗 Health check endpoint: GET /health');
}

main()
    .catch((error) => {
        console.error('❌ Seeding gagal:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });