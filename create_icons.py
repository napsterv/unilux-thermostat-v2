from PIL import Image
import os

os.makedirs('static', exist_ok=True)
img192 = Image.new('RGB', (192, 192), color = (25, 118, 210))
img192.save('static/pwa-192x192.png')
img512 = Image.new('RGB', (512, 512), color = (25, 118, 210))
img512.save('static/pwa-512x512.png')
print("Icons created in static/")
