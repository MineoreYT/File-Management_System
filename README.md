# File Management System

A modern, full-stack file management system built with React, Node.js, and SQLite.

![File Management System](https://img.shields.io/badge/React-19.2.0-blue)
![Node.js](https://img.shields.io/badge/Node.js-Express-green)
![SQLite](https://img.shields.io/badge/Database-SQLite-lightgrey)
![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-blue)

## 🚀 Features

### 🔐 User Management
- User registration and authentication
- JWT-based session management
- User profiles with storage quotas (1GB default)

### 📁 File Operations
- Upload files (single and multiple)
- Download files with preview
- Delete files
- Rename files
- Move files between folders
- File preview (images, PDFs, text files)

### 📂 Folder Management
- Create folders
- Delete folders (with contents)
- Rename folders
- Navigate folder hierarchy
- Breadcrumb navigation

### 🔍 Search & Filter
- Search files by name
- Filter by file type
- Sort by name, size, date
- Advanced filtering options

### 🎨 UI Features
- Grid and list view toggle
- Drag and drop file upload
- Right-click context menu
- Responsive design
- Loading states and error handling
- Storage usage visualization
- File preview modal

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite3** - Database
- **Multer** - File upload handling
- **bcrypt** - Password hashing
- **JWT** - Authentication tokens

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MineoreYT/File-Management_System.git
cd File-Management_System
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

### 3. Environment Configuration

**Server Environment Variables:**

Create `server/.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
NODE_ENV=development
```

**Client Environment Variables:**

The `client/.env` file is already configured:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Start the Application

**Start Backend Server:**
```bash
cd server
npm start
# or for development with auto-reload:
npm run dev
```

**Start Frontend Development Server:**
```bash
cd client
npm run dev
```

### 5. Access the Application

Open your browser and navigate to: **http://localhost:5173**

## 📖 Usage Guide

### First Time Setup

1. **Register Account** - Create a new user account
2. **Login** - Use your credentials to access the system
3. **Upload Files** - Start by uploading your first files
4. **Create Folders** - Organize your files into folders

### File Management

- **Upload**: Click "Upload" button or drag & drop files
- **Preview**: Click on any file to preview (images, PDFs, text)
- **Download**: Use download button in preview or context menu
- **Organize**: Create folders and move files around
- **Search**: Use the search bar to find files quickly

## 🔧 Configuration

### Storage Limits

**Default Limits:**
- User Storage Quota: 1GB per user
- File Upload Limit: 100MB per file
- Batch Upload: 10 files at once

**To modify limits, edit:**
- User quota: `server/src/models/schema.sql`
- File size: `server/src/middleware/upload.js`

### Supported File Types

- **Images**: JPG, PNG, GIF, SVG, WebP (with preview)
- **Documents**: PDF (with preview), TXT, MD (with preview)
- **Archives**: ZIP, RAR, TAR
- **Media**: MP4, AVI, MP3, WAV
- **All other file types** supported for upload/download

## 🏗️ Project Structure

```
file-management-system/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
│   └── public/
├── server/                # Node.js backend
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   └── routes/        # API routes
│   └── uploads/           # File storage
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

### Files
- `GET /api/files` - Get files in folder
- `POST /api/files/upload` - Upload files
- `GET /api/files/:id/download` - Download file
- `GET /api/files/:id/preview` - Preview file
- `PUT /api/files/:id/rename` - Rename file
- `PUT /api/files/:id/move` - Move file
- `DELETE /api/files/:id` - Delete file

### Folders
- `GET /api/folders` - Get folders
- `GET /api/folders/tree` - Get folder tree
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Rename folder
- `DELETE /api/folders/:id` - Delete folder

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token authentication
- File access control by user
- Storage quota enforcement
- Input validation and sanitization
- Secure file serving

## 🚀 Development

### Available Scripts

**Server:**
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

**Client:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**MineoreYT**
- GitHub: [@MineoreYT](https://github.com/MineoreYT)
- Email: mineoreyt@gmail.com

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by popular file management systems
- Thanks to the open-source community

---

⭐ **Star this repository if you found it helpful!**