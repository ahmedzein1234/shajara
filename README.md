# شجرة | Shajara

<div dir="rtl">

## شجرة العائلة العربية

تطبيق ويب حديث لإنشاء وإدارة شجرة العائلة مصمم خصيصاً للعائلات العربية. يدعم التطبيق الأسماء العربية التقليدية بما في ذلك سلسلة النسب (بن فلان بن فلان) والأسماء العائلية والقبلية.

### المميزات

- **دعم كامل للغة العربية**: واجهة مستخدم ثنائية اللغة (عربي/إنجليزي) مع دعم RTL
- **نظام أسماء عربي متقدم**:
  - الاسم الأول
  - سلسلة النسب (بن فلان بن فلان)
  - اسم العائلة/القبيلة
- **معلومات شاملة**: تواريخ الميلاد والوفاة، الأماكن، الأحداث المهمة
- **إدارة الوسائط**: رفع وإدارة الصور والمستندات للأفراد
- **الخرائط التفاعلية**: عرض أماكن الميلاد والوفاة على الخريطة
- **البحث المتقدم**: بحث نصي كامل في الأسماء العربية
- **المشاركة والتعاون**: مشاركة شجرة العائلة مع أفراد العائلة
- **سجل التدقيق**: تتبع جميع التغييرات على البيانات

### التقنيات المستخدمة

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Pages, Workers, D1 Database, R2 Storage
- **Internationalization**: next-intl
- **Infrastructure**: Edge-first architecture for global performance

</div>

---

## Arabic Family Tree Application

A modern web application for creating and managing family trees designed specifically for Arabic families. The application supports traditional Arabic naming conventions including patronymic chains (bin/ibn) and family/tribal names.

### Features

- **Full Arabic Language Support**: Bilingual interface (Arabic/English) with RTL support
- **Advanced Arabic Naming System**:
  - Given name
  - Patronymic chain (bin X bin Y bin Z)
  - Family/tribal name
- **Comprehensive Information**: Birth/death dates, places, life events
- **Media Management**: Upload and manage photos and documents for individuals
- **Interactive Maps**: Display birth and death locations on maps
- **Advanced Search**: Full-text search across Arabic names
- **Sharing & Collaboration**: Share family trees with family members
- **Audit Log**: Track all changes to data

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Cloudflare Pages, Workers, D1 Database, R2 Storage
- **Internationalization**: next-intl
- **Infrastructure**: Edge-first architecture for global performance

---

## Getting Started

### Prerequisites

- Node.js 20 or higher
- npm or yarn
- Cloudflare account (for deployment)
- Wrangler CLI

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/shajara.git
cd shajara
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env.local
```

4. Set up your environment variables (see [Environment Variables](#environment-variables))

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Cloudflare Configuration
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token

# Database
DATABASE_ID=your_d1_database_id

# R2 Storage
R2_BUCKET_NAME=shajara-media
R2_PUBLIC_URL=https://your-r2-bucket.cloudflare.com

# Authentication (Future implementation)
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=ar
```

See `.env.example` for a complete list of required variables.

---

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run cf:build` - Build for Cloudflare Pages
- `npm run deploy` - Build and deploy to Cloudflare Pages
- `npm run db:migrate` - Apply database migrations locally
- `npm run db:migrate:prod` - Apply database migrations to production

### Project Structure

```
shajara/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   ├── lib/             # Utility libraries
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Helper functions
│   └── i18n.ts          # Internationalization config
├── messages/            # Translation files
│   ├── ar.json          # Arabic translations
│   └── en.json          # English translations
├── migrations/          # D1 database migrations
├── public/             # Static assets
├── .github/            # GitHub workflows and templates
└── wrangler.json       # Cloudflare configuration
```

---

## Deployment

### Deploy to Cloudflare Pages

#### Prerequisites

1. Create a Cloudflare account
2. Create a D1 database named `shajara-db`
3. Create an R2 bucket named `shajara-media`
4. Get your Cloudflare Account ID and API Token

#### GitHub Actions Deployment

This project uses GitHub Actions for automated deployments:

1. **Set up GitHub Secrets**:
   - Go to your repository settings
   - Navigate to Secrets and Variables > Actions
   - Add the following secrets:
     - `CLOUDFLARE_ACCOUNT_ID`
     - `CLOUDFLARE_API_TOKEN`

2. **Automatic Deployment**:
   - Push to `main` branch triggers production deployment
   - Pull requests trigger preview deployments with unique URLs

#### Manual Deployment

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Authenticate with Cloudflare:
```bash
wrangler login
```

3. Update `wrangler.json` with your database ID

4. Run migrations:
```bash
npm run db:migrate:prod
```

5. Deploy:
```bash
npm run deploy
```

---

## Database Schema

The application uses Cloudflare D1 (SQLite) with the following main tables:

- **users**: User accounts and preferences
- **trees**: Family tree metadata
- **persons**: Individual family members with Arabic naming support
- **relationships**: Parent, spouse, and sibling relationships
- **events**: Life events (birth, death, marriage, etc.)
- **media**: Media files stored in R2
- **person_media**: Junction table linking media to persons

Full schema: See `migrations/0001_initial_schema.sql`

---

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests and linting: `npm run lint`
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## Roadmap

- [ ] Authentication and user management
- [ ] Interactive family tree visualization
- [ ] PDF export for family trees
- [ ] Timeline view of family events
- [ ] DNA match integration
- [ ] Historical event correlation
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced genealogy reports
- [ ] GEDCOM import/export

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For support, email support@shajara.app or open an issue on GitHub.

---

## Acknowledgments

- Designed for Arabic families worldwide
- Built with modern web technologies
- Powered by Cloudflare's edge network

---

<div dir="rtl">

## الدعم والمساعدة

للحصول على الدعم، يرجى إرسال بريد إلكتروني إلى support@shajara.app أو فتح issue على GitHub.

## الترخيص

هذا المشروع مرخص بموجب رخصة MIT - راجع ملف [LICENSE](LICENSE) للحصول على التفاصيل.

</div>
