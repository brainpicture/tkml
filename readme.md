# TKML (Tonstake Markup Language)

TKML is a lightweight markup language and rendering engine designed for building fast, mobile-friendly web applications with minimal configuration. It provides a set of pre-styled components that follow modern design principles.

## Features

- 🎨 Pre-styled components with dark/light mode support
- 📱 Mobile-first responsive design
- 🔄 Built-in navigation system with browser history support
- ⚡ Streaming XML parser for fast rendering
- 🎯 Zero CSS/JS configuration needed
- 🔌 Extensible component system

### Automatic Dark Mode

## Quick Start

## Built-in Components

- `<title>` - Page title/heading with proper font styling
- `<desc>` - Description text with muted color styling
- `<button>` - Action buttons with href support and loading state
- `<a>` - Navigation links with automatic TKML routing
- `<list>` - Container for grouped content with dark background
- `<alert>` - Alert/notification messages
- `<br>` - Line break

## Example TKML Document

### Navigation with History

### Content Grouping

## Development

1. Install dependencies:

```bash:readme.md
npm install
```

2. Start development server with hot reload:
```bash
npm run dev
```

3. Build for production:
```bash
npm run pack
```

## Browser Support

TKML works in all modern browsers that support:
- XMLHttpRequest
- ES6+ JavaScript
- CSS Custom Properties
- Browser History API

## License

MIT
