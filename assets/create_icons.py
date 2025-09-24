#!/usr/bin/env python3
"""
Create PNG icons for Asocial Chrome Extension
"""

from PIL import Image, ImageDraw
import os

def create_anarchy_icon(size):
    """Create an anarchy symbol icon"""
    # Create black background
    img = Image.new('RGB', (size, size), 'black')
    draw = ImageDraw.Draw(img)
    
    # Calculate dimensions
    center = size // 2
    radius = int(size * 0.35)
    line_width = max(1, size // 12)
    
    # Draw circle
    circle_bbox = [center - radius, center - radius, center + radius, center + radius]
    draw.arc(circle_bbox, 0, 360, fill='red', width=line_width)
    
    # Draw A
    a_width = int(radius * 0.8)
    a_height = int(radius * 1.2)
    a_x = center - a_width // 2
    a_y = center - a_height // 2
    
    # Left diagonal
    draw.line([a_x, a_y + a_height, a_x + a_width // 2, a_y], fill='red', width=line_width)
    # Right diagonal
    draw.line([a_x + a_width // 2, a_y, a_x + a_width, a_y + a_height], fill='red', width=line_width)
    # Horizontal bar
    bar_y = a_y + int(a_height * 0.6)
    draw.line([a_x + int(a_width * 0.2), bar_y, a_x + int(a_width * 0.8), bar_y], fill='red', width=line_width)
    
    return img

def main():
    """Create all required icon sizes"""
    sizes = [16, 48, 128]
    
    for size in sizes:
        icon = create_anarchy_icon(size)
        filename = f"icon{size}.png"
        icon.save(filename)
        print(f"Created {filename} ({size}x{size})")

if __name__ == "__main__":
    main()

