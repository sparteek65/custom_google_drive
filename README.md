# 🗄️ Custom Google Drive

A Next.js-powered custom Google Drive implementation with enhanced features and seamless integration.

## 🚀 Features

- Google Drive API Integration
- Modern UI with Next.js 14
- Real-time file management
- Secure authentication
- Responsive design
- Daisy UI

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18.0.0 or higher)
- npm or yarn
- A Google Cloud Platform account

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/custom_google_drive.git
cd custom_google_drive
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
   - Copy the `.env.example` file to `.env.local`
   - Fill in your credentials

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## 🔑 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# .env.example

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Database (if applicable)
DATABASE_URL=your_database_url

# API Keys (if applicable)
NEXT_PUBLIC_API_KEY=your_api_key
```

## 📚 Documentation

For more information about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Drive API](https://developers.google.com/drive)
- [NextAuth.js](https://next-auth.js.org)

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [NextAuth.js](https://next-auth.js.org/)
- [Google Drive API](https://developers.google.com/drive)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- Your Name - [GitHub Profile](https://github.com/yourusername)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for the hosting platform
- Google for the Drive API

---

<p align="center">
  Made with ❤️ by [Your Name]
</p>
