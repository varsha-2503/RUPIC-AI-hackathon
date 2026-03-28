# RUPIQ AI - Your AI Financial Advisor

AI-powered financial planning built for India. From health score to FIRE planning, tax optimization to smart investing.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

### 3. Build for Production

```bash
npm run build
```

## Features

### 4 AI-Powered Financial Tools

1. **Money Health Score** - Get a 0-100 financial health score with personalized action plan
2. **FIRE Planner** - Calculate your Financial Independence, Retire Early roadmap
3. **Tax Optimizer** - Maximize tax savings with smart strategies (Indian tax laws)
4. **Investment Guidance** - Custom portfolio strategy with specific fund recommendations

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **AI**: GROQ (Llama 3.1-8b-instant model)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Authentication
- **Build**: Vite
- **Styling**: Custom CSS with CSS Variables (Dark/Light theme)

## Project Structure

```
rupiq-ai/
├── index.html           # Main HTML file
├── src/
│   ├── script.js       # All JavaScript logic + Supabase auth
│   ├── style.css       # All styles
│   └── supabase.js     # Supabase client setup
├── .env                 # Environment variables (Supabase credentials)
└── supabase/
    └── migrations/      # Database schema
```

## Environment Variables

Already configured in `.env`:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Database

The app uses Supabase with two main tables:

1. **financial_profiles** - Stores user financial data
2. **ai_reports** - Stores AI-generated reports

Row Level Security (RLS) is enabled on all tables.

## Authentication

- Email/password authentication via Supabase
- Session persistence across page reloads
- Secure user management

## How to Use

1. **Sign Up** - Create a free account
2. **Choose a Tool** - Select from 4 financial analysis tools
3. **Enter Your Data** - Income, expenses, age, and goals
4. **Get AI Analysis** - Receive personalized financial advice in seconds
5. **Take Action** - Follow the actionable recommendations

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Code Organization

- All CSS is in `src/style.css` (organized by sections)
- All JavaScript is in `src/script.js` (with Supabase integration)
- Supabase utilities are in `src/supabase.js`
- HTML structure is clean and semantic in `index.html`

## Security Notes

- The GROQ API key is currently in the frontend for demo purposes
- For production, move AI calls to a backend/Edge Function
- Supabase handles all authentication and data security
- RLS policies ensure users can only access their own data

## Indian Financial Context

The AI is trained with Indian financial knowledge:

- FY2024-25 tax slabs
- 80C, 80D, HRA deductions
- PPF, NPS, ELSS, SGB instruments
- SIP, mutual fund strategies
- 4% rule for FIRE calculations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES6+ JavaScript support required
- CSS Grid and Flexbox support required

## License

This project was created for educational and personal finance planning purposes.

**Disclaimer**: Not SEBI-registered financial advice. For informational purposes only.

---

Built with GROQ AI & Supabase • Designed for India
