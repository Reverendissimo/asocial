/**
 * Icon Generation Utility - UNUSED (development tool)
 * 
 * COMMENTED OUT: This is a development utility for generating icons
 * Keep for testing purposes - can be uncommented if icon generation is needed
 */

/*
/**
 * Icon Generation Utility - UNUSED (development tool)
 * 
 * COMMENTED OUT: This is a development utility for generating icons
 * Keep for testing purposes - can be uncommented if icon generation is needed
 */

/*
const fs = require('fs');
const path = require('path');

// Simple SVG to PNG conversion would require additional libraries
// For now, let's create a simple HTML file that generates the icons

const iconHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Asocial Icon Generator</title>
    <style>
        body { background: #000; margin: 20px; }
        canvas { border: 1px solid #333; margin: 10px; }
        button { margin: 10px; padding: 10px; }
    </style>
</head>
<body>
    <h2>Asocial Extension Icons</h2>
    <p>Right-click each canvas and "Save image as" to download the icons:</p>
    
    <div>
        <h3>16x16 Icon</h3>
        <canvas id="icon16" width="16" height="16"></canvas>
        <button onclick="downloadIcon('icon16', 'icon16.png')">Download 16x16</button>
    </div>
    
    <div>
        <h3>48x48 Icon</h3>
        <canvas id="icon48" width="48" height="48"></canvas>
        <button onclick="downloadIcon('icon48', 'icon48.png')">Download 48x48</button>
    </div>
    
    <div>
        <h3>128x128 Icon</h3>
        <canvas id="icon128" width="128" height="128"></canvas>
        <button onclick="downloadIcon('icon128', 'icon128.png')">Download 128x128</button>
    </div>
    
    <script>
        function createAnarchyIcon(canvasId, size) {
            const canvas = document.getElementById(canvasId);
            const ctx = canvas.getContext('2d');
            
            // Black background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, size, size);
            
            // Red anarchy symbol
            ctx.strokeStyle = '#FF0000';
            ctx.fillStyle = '#FF0000';
            ctx.lineWidth = Math.max(1, size / 12);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            const centerX = size / 2;
            const centerY = size / 2;
            const radius = size * 0.35;
            
            // Draw circle
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Draw A
            const aWidth = radius * 0.8;
            const aHeight = radius * 1.2;
            const aX = centerX - aWidth / 2;
            const aY = centerY - aHeight / 2;
            
            ctx.beginPath();
            // Left diagonal
            ctx.moveTo(aX, aY + aHeight);
            ctx.lineTo(aX + aWidth / 2, aY);
            // Right diagonal  
            ctx.moveTo(aX + aWidth / 2, aY);
            ctx.lineTo(aX + aWidth, aY + aHeight);
            // Horizontal bar
            const barY = aY + aHeight * 0.6;
            ctx.moveTo(aX + aWidth * 0.2, barY);
            ctx.lineTo(aX + aWidth * 0.8, barY);
            ctx.stroke();
        }
        
        // Create all icons
        createAnarchyIcon('icon16', 16);
        createAnarchyIcon('icon48', 48);
        createAnarchyIcon('icon128', 128);
        
        // Download function
        function downloadIcon(canvasId, filename) {
            const canvas = document.getElementById(canvasId);
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }
    </script>
</body>
</html>
`;

// Write the HTML file
fs.writeFileSync('generate_icons.html', iconHTML);

console.log('Icon generator created!');
console.log('Open generate_icons.html in your browser to create and download the icons.');
console.log('Save them as icon16.png, icon48.png, and icon128.png in the assets/ folder.');

*/
