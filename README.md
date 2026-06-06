# EDUsphere

A comprehensive full-stack educational platform built with modern web technologies for exam preparation and learning management.

**Live Demo:** [https://examshala.vercel.app](https://examshala.vercel.app)

## 📋 Overview

EDUsphere is an advanced educational management system designed to streamline exam preparation, learning, and educational content delivery. The platform provides a robust backend API and an intuitive frontend interface for managing examinations, user authentication, workspace administration, and personalized learning experiences.

## 🛠️ Tech Stack

### Frontend
- **Next.js** 16.1.6 - React framework for production
- **React** 19.2.3 - UI library
- **TypeScript** (98.5%) - Type-safe JavaScript development
- **Tailwind CSS** 4 - Utility-first CSS framework
- **Recharts** 3.8.1 - Data visualization for analytics
- **Zustand** 5.0.13 - Lightweight state management
- **Lucide React** - Modern icon library
- **Clsx** - Utility for conditional className management

### Backend
- **Node.js** with **Express.js** 5.2.1 - Server framework
- **TypeScript** - Type-safe backend code
- **Prisma** 7.7.0 - ORM for database management
- **PostgreSQL** - Primary relational database
- **JWT (jsonwebtoken)** - Secure token-based authentication
- **Bcryptjs** - Password hashing and encryption
- **CORS** - Cross-origin resource sharing support

### Database & ORM
- **Prisma Adapter for PostgreSQL** - Optimized database adapter
- **PostgreSQL Driver (pg)** 8.20.0 - Database connection management

## 📊 Language Composition
- **TypeScript:** 98.5%
- **JavaScript:** 1.5%

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL database (v12 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chintaladinakar/examshala-v2.git
   cd examshala-v2
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   
   # Configure environment variables
   cp .env.example .env
   
   # Generate Prisma client
   npm run prisma:generate
   
   # Run database migrations
   npm run prisma:migrate
   
   # Seed admin user (optional)
   npm run seed:admin
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   
   # Configure environment variables
   cp .env.example .env.local
   ```

## 📝 Available Scripts

### Backend

- `npm run dev` - Start development server with hot reload (nodemon + ts-node)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production build
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run seed:admin` - Seed admin user to database
- `npm run migrate:workspaces` - Migrate workspace data

### Frontend

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Run production server
- `npm run lint` - Run ESLint for code quality

## 📁 Project Structure

```
examshala-v2/
├── backend/                      # Express.js + Prisma backend API
│   ├── src/
│   │   ├── server.ts            # Main server entry point
│   │   ├── scripts/             # Database scripts
│   │   │   ├── seed-admin.ts    # Admin user seeding
│   │   │   └── migrate-workspaces.ts
│   │   └── generated/prisma/    # Prisma client (generated)
│   ├── .env                     # Environment configuration
│   └── package.json
├── frontend/                     # Next.js + React frontend
│   ├── app/                     # App directory (Next.js 13+)
│   ├── components/              # React components
│   ├── public/                  # Static assets
│   ├── .env.local               # Frontend environment config
│   └── package.json
└── README.md
```

## 🔐 Authentication & Security

- **JWT-based Authentication** - Secure token-based user sessions
- **Password Hashing** - Bcryptjs for secure password storage
- **CORS Configuration** - Protected API endpoints
- **Token Validation** - Middleware-based request validation

## 💾 Database Architecture

EDUsphere uses **Prisma ORM** to manage PostgreSQL database interactions:
- Type-safe database queries
- Automated migration management
- Workspace isolation for multi-tenant support
- Optimized query performance with Prisma adapter

## 🌐 API Features

The backend exposes RESTful API endpoints for:
- **User Management** - Authentication, registration, profile management
- **Exam Management** - Create, update, delete, and track examinations
- **Workspace Management** - Multi-tenant workspace support
- **Dashboard & Analytics** - Performance metrics and user insights
- **Educational Content** - Course and learning material management

## ✨ Key Features

- 🔐 **Secure Authentication** - JWT-based login and registration
- 📚 **Exam Management** - Comprehensive exam creation and administration
- 📊 **Analytics Dashboard** - Real-time performance visualization
- 🏢 **Workspace Support** - Multi-workspace administration
- 📱 **Responsive Design** - Mobile-first, fully responsive interface
- 📈 **Performance Tracking** - Detailed analytics and progress reports
- 🎨 **Modern UI** - Clean, intuitive user interface
- ⚡ **High Performance** - Optimized for speed and scalability

## 📦 Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Express.js | 5.2.1 | Backend API framework |
| Next.js | 16.1.6 | React framework & SSR |
| React | 19.2.3 | UI library |
| Prisma | 7.7.0 | Database ORM |
| PostgreSQL | 8.20.0 | Database driver |
| Tailwind CSS | 4 | Styling framework |
| Zustand | 5.0.13 | State management |
| Recharts | 3.8.1 | Data visualization |
| JWT | 9.0.3 | Authentication tokens |
| Bcryptjs | 3.0.3 | Password encryption |

## 🏗️ Development Workflow

1. **Create a feature branch** from `main`
2. **Make your changes** following the TypeScript conventions
3. **Test thoroughly** using the development servers
4. **Submit a Pull Request** with detailed description
5. **Code review** and merge to main

## 📋 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/edusphere
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=EDUsphere
```

## 🤝 Contributing

We welcome contributions! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Dinakara Chintala**
- GitHub: [@Chintaladinakar](https://github.com/Chintaladinakar)
- Repository: [examshala-v2](https://github.com/Chintaladinakar/examshala-v2)

## 🔗 Links

- **Repository:** [https://github.com/Chintaladinakar/examshala-v2](https://github.com/Chintaladinakar/examshala-v2)
- **Live Demo:** [https://examshala.vercel.app](https://examshala.vercel.app)
- **Issues:** [Report a bug](https://github.com/Chintaladinakar/examshala-v2/issues)

## 💬 Support

For questions, feedback, or support:
- Open an issue on [GitHub Issues](https://github.com/Chintaladinakar/examshala-v2/issues)
- Check existing documentation and FAQs
- Review closed issues for solutions

---

**Last Updated:** June 2026

Made with ❤️ by the EDUsphere team
