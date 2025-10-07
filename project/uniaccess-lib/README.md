# UniAccess Library

## Usage Instructions

The UniAccess library provides a set of tools for accessing and managing user data effectively. Follow the steps below to use the library in your project:

### Installation
To install the UniAccess library, you can include it directly from GitHub Pages using the following script tag:
```html
<script src="https://yourusername.github.io/Extension_Final/project/uniaccess-lib/uniaccess.js"></script>
```

### Basic Usage
Once you have included the library in your project, you can start using it as follows:
```javascript
// Example of initializing the library
const uniAccess = new UniAccess();

// Example of accessing user data
uniAccess.getUserData(userId).then(data => {
    console.log(data);
}).catch(error => {
    console.error('Error fetching user data:', error);
});
```

## Embedding via GitHub Pages
To host your project on GitHub Pages:
1. Go to your repository settings.
2. Scroll down to the "GitHub Pages" section.
3. Select the branch you want to use (usually `main`) and click "Save".
4. Your project will be published at `https://yourusername.github.io/Extension_Final/`.

Make sure to replace `yourusername` with your GitHub username in the script tag.

## License
This project is licensed under the MIT License. See the LICENSE file for details.