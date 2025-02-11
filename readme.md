# TKML (Tonstake Markup Language)

TKML is a lightweight markup language and rendering engine designed for building fast, mobile-friendly web applications with minimal configuration. It provides a set of pre-styled components that follow modern design principles.

## Features

- 🎨 Pre-styled components with dark/light mode support
- 📱 Mobile-first responsive design
- 🔄 Built-in navigation system with browser history support
- ⚡ Streaming XML parser for fast rendering
- 🎯 Zero CSS/JS configuration needed
- 🔌 Extensible component system

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <title>TKML App</title>
    <link rel="stylesheet" href="./styles.min.css">
    <script src="./tkml.min.js"></script>
</head>
<body>
    <div id="container"></div>
    <script>
        const container = document.getElementById('container');
        const tkml = new TKML(container, { dark: true });
        tkml.load('index.tkml');
    </script>
</body>
</html>
```

## Components

### `<title>`
Renders a page title or section header.
```xml
<title>Welcome to TKML</title>
```

### `<desc>`
Renders descriptive text with muted styling.
```xml
<desc>This is a description text</desc>
```

### `<button>`
Interactive button element with loading state.
```xml
<button href="/action">Click me</button>
```
Attributes:
- `href`: URL to navigate to
- `preload`: Set to "true" to preload the target page

### `<a>`
Link element with loading animation.
```xml
<a href="/page">Go to page</a>
```
Attributes:
- `href`: URL to navigate to
- `preload`: Set to "true" to preload the target page

### `<input>`
Input field with loading state. The `name` attribute specifies the parameter name for submission. When data is entered into this field and submitted, the user will be redirected to the URL specified in the `href` attribute, and the content entered will be sent as a parameter with the name specified in the `name` attribute. The text will be sent in a POST request as JSON.

```xml
<input placeholder="Enter text" href="/submit" name="query"/>
```
Attributes:
- `placeholder`: Placeholder text
- `value`: Initial value
- `type`: Input type
- `href`: URL to submit to
- `name`: Parameter name for submission

### `<list>`
Container for list items with dividers.
```xml
<list>
    <desc>First item</desc>
    <desc>Second item</desc>
</list>
```

### `<code>`
Code block with syntax highlighting.
```xml
<code lang="javascript">
function hello() {
    console.log("Hello world!");
}
</code>
```
Attributes:
- `lang`: Programming language for syntax highlighting

### `<br>`
Line break element.
```xml
Line 1<br/>Line 2
```

## Example TKML Document

```xml
<title>Welcome to TKML</title>
<desc>
    Build beautiful mobile apps without worrying about CSS or JavaScript.
</desc>

<list>
    <title>Getting Started</title>
    <desc>
        TKML makes it easy to create mobile-friendly interfaces
        with pre-styled components and automatic dark mode support.
    </desc>
    <button href="/start">Get Started</button>
</list>

<list>
    <title>Documentation</title>
    <desc>Read our comprehensive guides and API documentation</desc>
    <a href="/docs">Browse Documentation</a>
</list>

<alert>New features available!</alert>
```

### Automatic Dark Mode

```javascript
// Automatically detects system preference
new TKML(container);

// Force dark mode
new TKML(container, { dark: true });
```

### Navigation with History

All navigation is handled automatically through `href` attributes. The library manages browser history and provides smooth transitions between pages.

## Development

1. Install dependencies:
```bash
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
