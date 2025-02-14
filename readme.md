# TKML (Template Kit Markup Language)

TKML isn't just a markup language; it's like your retro '90s game console for web apps! No need for CSS or JS—just plug in your components in XML format and play. We've sprinkled in some '90s vibes and a dash of HTTP/1.1 nostalgia to keep things fun and simple.

TKML is designed for building fast, mobile-friendly web applications with minimal configuration. Think of it as your trusty sidekick, providing a set of pre-styled components that follow modern design principles, so you can focus on creating awesome content without sweating the small stuff.

You can create the simplest TKML app by uploading an `index.tkml` page to your website. This page serves as the entry point for your application. Here's a basic example:

1. **Create an `index.tkml` file**: This file will contain your TKML markup. For instance:

   ```xml
   <title>Hello</title>
   <desc>
       Hello world! This is a minimal TKML website.
   </desc>
   ```

2. **Upload the file to your server**: Place the `index.tkml` file in the root directory of your website or any accessible path.

3. **Access your TKML app**: Go to http://tkml.app, and type `example.com/index.tkml` in input field.

This simple setup will render a page with a title and a description, demonstrating the basic structure of a TKML document.

## Features

- 🎨 Pre-styled components with dark/light mode support
- 📱 Mobile-first responsive design
- 🔄 Built-in navigation system with browser history support
- ⚡ Streaming XML parser for fast rendering
- 🎯 Zero CSS/JS configuration needed
- 🔌 Extensible component system

## Quick Start
This example demonstrates how to embed a TKML app within your own application
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
