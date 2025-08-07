# 🪨 Rock Wise AI

An advanced AI-powered geological identification system that analyzes rock and mineral specimens using multiple AI models for comprehensive and accurate results.

## 🌟 Features

- **Multi-AI Analysis**: Combines Gemini, OpenAI GPT-4.1, and Anthropic Claude for enhanced accuracy
- **Image Upload**: Drag-and-drop or click to upload rock specimen photos
- **Comprehensive Results**: Detailed geological information including:
  - Rock/mineral identification
  - Formation type (Igneous, Sedimentary, Metamorphic)
  - Mineral composition
  - Hardness rating (Mohs scale)
  - Formation process
  - Common locations
  - Visual features detected
  - Fascinating geological facts
- **Interactive Chat**: Ask follow-up questions about your rock specimens
- **Confidence Scoring**: AI confidence levels for identification accuracy
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm installed
- Supabase account (for AI API management)
- API keys for AI services (optional - see configuration below)

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd rock-wise-ai
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

## ⚙️ Configuration

### AI API Keys

The application uses multiple AI services for enhanced accuracy. You can configure API keys in your Supabase project settings:

1. **Gemini API Key** (`GEMINI_API_KEY`)
   - Get your key from [Google AI Studio](https://ai.google.dev/gemini-api)
   - Free tier available

2. **OpenAI API Key** (`OPENAI_API_KEY`)
   - Get your key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Uses GPT-4.1-2025-04-14 model

3. **Anthropic API Key** (`ANTHROPIC_API_KEY`)
   - Get your key from [Anthropic Console](https://console.anthropic.com/)
   - Uses Claude-3-5-Sonnet model

### Setting Up API Keys

1. Go to your Supabase project dashboard
2. Navigate to Settings → Edge Functions → Secrets
3. Add your API keys using the names above
4. The application will automatically use available APIs and combine results

## 🧠 How It Works

1. **Image Upload**: Users upload a photo of their rock specimen
2. **Multi-AI Processing**: The image is simultaneously analyzed by:
   - Google Gemini (free, fast analysis)
   - OpenAI GPT-4.1 (detailed visual analysis)
   - Anthropic Claude (geological expertise)
3. **Result Combination**: The system combines all analyses:
   - Finds consensus on rock identification
   - Merges visual features from all AIs
   - Calculates weighted confidence scores
   - Provides comprehensive geological data
4. **Interactive Results**: Users can ask follow-up questions via the chat interface

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Backend**: Supabase Edge Functions
- **AI Services**: Google Gemini, OpenAI GPT-4.1, Anthropic Claude
- **Build Tool**: Vite
- **Deployment**: Vercel/Netlify compatible

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── ChatBot.tsx         # Interactive chat interface
│   ├── RockResults.tsx     # Results display component
│   └── RockUploader.tsx    # Image upload component
├── pages/
│   └── Index.tsx           # Main application page
├── integrations/
│   └── supabase/           # Supabase client setup
└── lib/
    └── utils.ts            # Utility functions

supabase/
├── functions/
│   ├── identify-rock/      # Multi-AI rock identification
│   └── rock-chat/          # Interactive chat functionality
└── config.toml             # Supabase configuration
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features

1. **New AI Service**: Add analysis function in `supabase/functions/identify-rock/index.ts`
2. **UI Components**: Create in `src/components/` using shadcn/ui patterns
3. **Chat Features**: Extend `supabase/functions/rock-chat/index.ts`

## 🌐 Deployment

### Via Lovable

1. Open your [Lovable project](https://lovable.dev/projects/f1f55208-9182-458a-82f4-261ab7395f31)
2. Click Share → Publish
3. Your app will be deployed instantly

### Manual Deployment

The app is compatible with any static hosting service:

- **Vercel**: Connect your GitHub repo
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions workflow

Build command: `npm run build`
Output directory: `dist`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google Gemini for free high-quality image analysis
- OpenAI for advanced vision capabilities
- Anthropic for geological expertise
- Supabase for seamless backend infrastructure
- shadcn/ui for beautiful components

## 📞 Support

- Documentation: [Lovable Docs](https://docs.lovable.dev/)
- Community: [Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- Issues: Create an issue in this repository

---

**Built with ❤️ using Lovable**