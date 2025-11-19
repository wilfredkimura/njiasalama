# Njia Salama 🚴

**Njia Salama** (Swahili for "Safe Path") is a community-driven web application designed to help cyclists in Kenya navigate safer routes by reporting and avoiding road hazards.

![Njia Salama](https://img.shields.io/badge/Built%20with-SvelteKit-FF3E00?style=for-the-badge&logo=svelte)
![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?style=for-the-badge&logo=vercel)

## 🌟 Features

### 🗺️ Interactive Hazard Map
- **Real-time hazard visualization**: View all reported road hazards on an interactive map
- **Geolocation support**: Automatically centers on your current location
- **Custom hazard markers**: Small orange dots indicate hazard locations
- **Click for details**: Tap any hazard to see type, severity, reporter, and community feedback

### 🛣️ Safe Route Planning
- **Smart routing**: Plan routes between any two locations
- **Hazard-aware scoring**: Routes are scored based on proximity to reported hazards
- **Alternative routes**: View up to 3 alternative routes with different safety scores
- **Interactive route selection**: Click any route to make it active
- **Draggable pins**: Adjust start and end points by dragging markers
- **Weather integration**: See current weather conditions for start and end locations
- **Hazard summary**: Collapsible list of hazards along your selected route

### ⚠️ Community Hazard Reporting
- **Easy reporting**: Drop a pin and describe the hazard
- **Hazard types**: Pothole, poor lighting, dangerous intersection, narrow road, steep hill, loose gravel, and more
- **Severity ratings**: Rate hazards from 1-5 to help others assess risk
- **User attribution**: See who reported each hazard (requires login)

### 💬 Community Engagement
- **Voting system**: Vote "Still Here?" or "Fixed?" to keep data accurate
- **One vote per user**: Each account can cast one vote per hazard (can be changed)
- **Comments**: Discuss hazards with other users
- **Real-time updates**: See vote counts and comments instantly

### 🔐 User Authentication
- **Supabase Auth**: Secure email/password authentication
- **Profile system**: Automatic profile creation with usernames
- **Protected actions**: Voting and commenting require login
- **Hazard attribution**: Track who reported each hazard

### 📱 Progressive Web App (PWA)
- **Installable**: Add to home screen on mobile devices
- **Standalone mode**: Launches without browser UI
- **Custom icon**: Branded app icon with "Njia Salama" text
- **Offline support**: LocalStorage fallback for hazard data

### 🎨 Modern UI/UX
- **Glassmorphism design**: Semi-transparent, blurred UI elements
- **Responsive layout**: Works on desktop, tablet, and mobile
- **Welcome popup**: Interactive tutorial for new users
- **Smooth animations**: Svelte transitions for polished interactions
- **Accessibility**: Keyboard navigation and ARIA labels

## 🛠️ Tech Stack

### Frontend
- **[SvelteKit](https://kit.svelte.dev/)**: Modern web framework
- **[Leaflet.js](https://leafletjs.com/)**: Interactive maps
- **[Tailwind CSS](https://tailwindcss.com/)**: Utility-first styling

### Backend & Services
- **[Supabase](https://supabase.com/)**: 
  - PostgreSQL database with PostGIS
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication
- **[OSRM](http://project-osrm.org/)**: Route calculation with alternatives
- **[Nominatim](https://nominatim.org/)**: Location search and geocoding
- **[Open-Meteo](https://open-meteo.com/)**: Weather data

### Deployment
- **[Vercel](https://vercel.com/)**: Serverless deployment
- **[@sveltejs/adapter-vercel](https://www.npmjs.com/package/@sveltejs/adapter-vercel)**: SvelteKit adapter

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/njiasalama.git
   cd njiasalama
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up Supabase database**
   
   Follow the instructions in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) to:
   - Create the `hazards` table
   - Create the `profiles` table
   - Create the `hazard_votes` table
   - Create the `hazard_comments` table
   - Enable PostGIS extension
   - Set up Row Level Security policies
   - Configure authentication

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the app**
   
   Navigate to `http://localhost:5173`

## 📦 Building for Production

```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 🌐 Deployment

### Vercel Deployment

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy**
   ```bash
   vercel
   ```

3. **Set environment variables in Vercel**
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

4. **Configure Supabase**
   - Add your Vercel deployment URL to Supabase's allowed redirect URLs
   - Update authentication settings as needed

## 📁 Project Structure

```
njiasalama/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable Svelte components
│   │   │   ├── Map.svelte
│   │   │   ├── HazardSheet.svelte
│   │   │   ├── AddHazardForm.svelte
│   │   │   ├── Navbar.svelte
│   │   │   └── UserMenu.svelte
│   │   ├── stores/            # Svelte stores for state management
│   │   │   ├── hazardStore.js
│   │   │   ├── routeStore.js
│   │   │   ├── authStore.js
│   │   │   └── mapStore.js
│   │   └── supabaseClient.js  # Supabase initialization
│   ├── routes/                # SvelteKit routes
│   │   ├── +layout.svelte     # Global layout
│   │   ├── +page.svelte       # Home page (map view)
│   │   ├── plan/              # Route planning page
│   │   ├── add/               # Hazard reporting page
│   │   ├── login/             # Login page
│   │   └── signup/            # Signup page
│   └── app.html               # HTML template
├── static/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   └── logo.svg               # App icon
├── SUPABASE_SETUP.md          # Database setup guide
└── README.md                  # This file
```

## 🗄️ Database Schema

### `hazards` Table
- `id` (uuid, primary key)
- `hazard_type` (text): Type of hazard
- `severity_rating` (integer): 1-5 severity scale
- `location` (geography/POINT): PostGIS point
- `created_at` (timestamp)
- `created_by` (uuid): References auth.users

### `profiles` Table
- `id` (uuid, primary key): References auth.users
- `username` (text, unique)
- `created_at` (timestamp)

### `hazard_votes` Table
- `id` (uuid, primary key)
- `hazard_id` (uuid): References hazards
- `user_id` (uuid): References auth.users
- `vote_type` (text): 'still_here' or 'fixed'
- `created_at` (timestamp)
- **Unique constraint**: (hazard_id, user_id)

### `hazard_comments` Table
- `id` (uuid, primary key)
- `hazard_id` (uuid): References hazards
- `user_id` (uuid): References auth.users
- `content` (text)
- `created_at` (timestamp)

## 🔒 Security

- **Row Level Security (RLS)**: All tables have RLS enabled
- **Authentication required**: Voting and commenting require login
- **User ownership**: Users can only modify their own votes and comments
- **Public read access**: Hazards are visible to all users
- **Secure defaults**: `created_by` automatically set to `auth.uid()`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Kimura Mutahi**
- Portfolio: [wilfredkimuraportfolio.vercel.app](https://wilfredkimuraportfolio.vercel.app)

## 🙏 Acknowledgments

- OpenStreetMap contributors for map data
- Supabase team for the amazing backend platform
- SvelteKit community for the excellent framework
- All cyclists in Kenya who make our roads safer by reporting hazards

---

**Made with ❤️ for safer cycling in Kenya**
