# Megan Voice Assistant Chrome Extension

This repository is one of three components that make up the **[Megan Voice Assistant](https://yourmegan.me)** project:

- **[Landing Page](https://github.com/sup1p/super-ex-landing)** - Project website and documentation
- **[Browser Extension](https://github.com/sup1p/super-extension)** - Chrome extension frontend *(this repository)*
- **[Backend API](https://github.com/sup1p/super-ex-back)** - Server-side services and AI integration

---

A comprehensive Chrome extension for Megan, an intelligent voice assistant that provides browser automation, media control, content summarization, note-taking capabilities, translation services, and conversational AI features directly within the browser.

## Overview

This is the frontend component of the Megan Voice Assistant project. The Chrome extension provides a powerful sidebar interface that integrates with web pages to offer voice-controlled browser automation, content management, and AI-powered assistance. Built with modern web technologies, it delivers a seamless user experience across all websites.

## Features

- **Voice Control**: Speech-to-text and text-to-speech capabilities for hands-free operation
- **Smart Sidebar**: Context-aware sidebar that adapts to different websites and content
- **Content Management**: Text summarization, simplification, and note-taking tools
- **Translation Services**: Real-time text and page translation in multiple languages
- **Media Control**: Universal video and audio control across various platforms (YouTube, Spotify, VK, etc.)
- **Browser Automation**: Tab management, web search, and page interaction capabilities
- **AI Chat**: Conversational AI assistant with context-aware responses
- **Note System**: Digital note-taking with cloud synchronization
- **Theme Support**: Light and dark theme modes with automatic detection
- **Cross-Platform**: Works on all major websites and platforms

## Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS for responsive and modern UI design
- **Browser APIs**: Chrome Extension Manifest V3 with modern APIs
- **State Management**: React hooks and context for state management
- **Voice Processing**: Web Speech API integration
- **AI Integration**: RESTful API communication with backend services

## Project Structure

```
super-extension/
├── src/
│   ├── chrome-extension/
│   │   ├── manifest.json
│   │   ├── popup/
│   │   │   └── index.tsx
│   │   ├── options/
│   │   │   └── index.tsx
│   │   ├── public/
│   │   │   ├── icon16.png
│   │   │   ├── icon48.png
│   │   │   ├── icon128.png
│   │   │   └── [other assets]
│   │   └── global.css
│   ├── sidebar/
│   │   ├── index.ts
│   │   ├── Sidebar.tsx
│   │   └── components/
│   │       ├── auth.ts
│   │       ├── chat.ts
│   │       ├── notes.ts
│   │       ├── tools.ts
│   │       ├── navigation.ts
│   │       └── account.ts
│   ├── services/
│   │   ├── auth.ts
│   │   ├── chat.ts
│   │   ├── notes.ts
│   │   ├── translate.ts
│   │   ├── pageTranslate.ts
│   │   ├── translations.ts
│   │   └── voice.ts
│   ├── utils/
│   │   ├── auth-decorator.ts
│   │   └── storage.ts
│   ├── types/
│   │   └── index.ts
│   ├── background.ts
│   ├── content-enhanced.ts
│   ├── main.tsx
│   └── vite-env.d.ts
├── dist/
├── popup.html
├── options.html
├── modal.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## Directory Descriptions

### Chrome Extension Core (`src/chrome-extension/`)
Core extension files and configuration:
- **`manifest.json`** - Chrome extension manifest with permissions and configuration
- **`popup/`** - Extension popup interface components
- **`options/`** - Extension options and settings page
- **`public/`** - Extension icons and static assets
- **`global.css`** - Global styles and CSS variables

### Sidebar Interface (`src/sidebar/`)
Main sidebar application and components:
- **`Sidebar.tsx`** - Main sidebar component and layout
- **`index.ts`** - Sidebar initialization and core functionality
- **`components/`** - Modular sidebar components:
  - **`auth.ts`** - Authentication and user management
  - **`chat.ts`** - AI chat interface and conversation management
  - **`notes.ts`** - Note-taking and management system
  - **`tools.ts`** - Utility tools and browser automation
  - **`navigation.ts`** - Navigation and menu components
  - **`account.ts`** - User account and profile management

### Services (`src/services/`)
Business logic and external service integrations:
- **`auth.ts`** - Authentication service and user session management
- **`chat.ts`** - Chat service for AI communication
- **`notes.ts`** - Notes service for data persistence and management
- **`translate.ts`** - Text translation service
- **`pageTranslate.ts`** - Page-level translation functionality
- **`translations.ts`** - Translation management and localization
- **`voice.ts`** - Voice processing and speech recognition services

### Utilities (`src/utils/`)
Helper functions and utilities:
- **`auth-decorator.ts`** - Authentication decorators and middleware
- **`storage.ts`** - Chrome storage utilities and data persistence

### Core Scripts
- **`background.ts`** - Service worker for background tasks and message handling
- **`content-enhanced.ts`** - Content script for page integration and DOM manipulation
- **`main.tsx`** - Main React application entry point

### Configuration Files
- **`vite.config.ts`** - Vite build configuration with Chrome extension optimizations
- **`tailwind.config.js`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`package.json`** - Project dependencies and scripts

## Installation

### Prerequisites
- Node.js 18+ and npm
- Chrome browser (version 88+)
- Git

### Development Setup

1. **Clone the repository:**
```bash
git clone https://github.com/sup1p/super-extension.git
cd super-extension
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start development server:**
```bash
npm run dev
```

4. **Build for production:**
```bash
npm run build
```

## Loading the Extension

1. **Build the extension:**
```bash
npm run build
```

2. **Load in Chrome:**
   - Open `chrome://extensions/` in Chrome
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project

3. **Access the extension:**
   - Click the extension icon in the toolbar
   - Use the sidebar interface on any webpage
   - Access popup and options through the extension menu

## Development

### Hot Reload Development
The extension supports hot reloading during development:
- Run `npm run dev` for development mode
- Access popup at `popup-local.html`
- Access options at `options-local.html`
- Changes automatically reflect in the extension

### Building and Testing
```bash
# Build for production
npm run build

# Lint code
npm run lint

# Preview build
npm run preview
```

### Adding New Features

#### Adding New Sidebar Components
1. Create component in `src/sidebar/components/`
2. Register in `src/sidebar/index.ts`
3. Add navigation in `src/sidebar/components/navigation.ts`

#### Adding New Services
1. Create service in `src/services/`
2. Implement business logic
3. Export for use in components

#### Adding New Background Scripts
1. Create script in `src/`
2. Add to `vite.config.ts` build configuration
3. Update `manifest.json` if needed

### Chrome Extension Development

#### Manifest Configuration
The extension uses Manifest V3 with the following permissions:
- `activeTab` - Access to current tab
- `scripting` - Execute scripts in tabs
- `storage` - Data persistence
- `tabs` - Tab management
- `contextMenus` - Right-click menu integration

#### Content Scripts
- **`content-enhanced.ts`** - Main content script for page integration
- Handles media control, text selection, and page interactions
- Integrates with the sidebar interface

#### Background Scripts
- **`background.ts`** - Service worker for background tasks
- Manages tab communication and message handling
- Handles extension lifecycle events

## Features in Detail

### Voice Control System
- Speech-to-text using Web Speech API
- Text-to-speech for AI responses
- Voice command recognition and execution

### Smart Sidebar
- Context-aware interface that adapts to website content
- Floating action button for easy access
- Draggable and resizable interface
- Theme-aware styling (light/dark mode)

### Content Management
- **Text Summarization**: AI-powered content summarization
- **Text Simplification**: Content simplification for better readability
- **Note Taking**: Cloud-synchronized note system
- **Selection Tools**: Text selection and processing utilities

### Translation Services
- **Text Translation**: Translate selected text in real-time
- **Page Translation**: Full webpage translation
- **Multi-language Support**: Support for multiple languages
- **Context Preservation**: Maintains formatting and structure

### Media Control
- **Universal Control**: Works across YouTube, Spotify, VK, Apple Music
- **Voice Commands**: "Play", "Pause", "Next", "Previous", etc.
- **Platform Detection**: Automatically detects media platforms
- **Custom Controls**: Platform-specific control implementations

### Browser Automation
- **Tab Management**: List, switch, and manage browser tabs
- **Web Search**: Voice-activated web search
- **Page Interaction**: Click links, buttons, and form elements
- **Content Extraction**: Extract and process page content

## Configuration

### Environment Variables
Create a `.env` file for configuration:
```bash
# API endpoints
VITE_API_URL=https://your-api-endpoint.com
VITE_WS_URL=wss://your-websocket-endpoint.com

# Feature flags
VITE_ENABLE_VOICE=true
VITE_ENABLE_TRANSLATION=true
```

### Build Configuration
The `vite.config.ts` file configures:
- React plugin for JSX support
- Static asset copying for extension files
- Build optimization for Chrome extension
- Entry point configuration for all extension components

## Deployment

### Production Build
```bash
npm run build
```

The build process:
1. Compiles TypeScript to JavaScript
2. Bundles React components
3. Copies static assets to `dist/`
4. Generates optimized extension files

### Extension Distribution
- **Development**: Load unpacked from `dist/` folder
- **Production**: Package as `.crx` file for distribution
- **Chrome Web Store**: Submit for public distribution

## Contributing

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Submit a pull request**

### Development Guidelines
- Follow TypeScript best practices
- Use functional components with React hooks
- Implement proper error handling
- Add comprehensive error logging
- Test across different websites and platforms

## Troubleshooting

### Common Issues

#### Extension Not Loading
- Check Chrome version compatibility
- Verify manifest.json syntax
- Check console for build errors

#### Sidebar Not Appearing
- Ensure content script is loaded
- Check for JavaScript errors
- Verify extension permissions

#### Voice Features Not Working
- Check microphone permissions
- Verify Web Speech API support
- Test in HTTPS environment

### Debug Mode
Enable debug logging:
```typescript
// In background.ts or content scripts
const DEBUG = true;
if (DEBUG) console.log('Debug info:', data);
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- **Documentation**: [https://yourmegan.me](https://yourmegan.me)
- **Issues**: [GitHub Issues](https://github.com/sup1p/super-extension/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sup1p/super-extension/discussions)

## Acknowledgments

- Chrome Extension development community
- React and TypeScript communities
- Vite build tool contributors
- Tailwind CSS framework
