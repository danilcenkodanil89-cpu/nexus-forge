const fs = require('fs');
const path = require('path');

function createBitmap(width, height) {
  const rowSize = Math.ceil((width * 4) / 4) * 4;
  const imageSize = rowSize * height;
  
  const dibHeader = Buffer.alloc(40);
  dibHeader.writeUInt32LE(40, 0);
  dibHeader.writeInt32LE(width, 4);
  dibHeader.writeInt32LE(height * 2, 8);
  dibHeader.writeUInt16LE(1, 12);
  dibHeader.writeUInt16LE(32, 14);
  dibHeader.writeUInt32LE(0, 16);
  dibHeader.writeUInt32LE(imageSize * 2, 20);
  dibHeader.writeInt32LE(0, 24);
  dibHeader.writeInt32LE(0, 28);
  dibHeader.writeUInt32LE(0, 32);
  dibHeader.writeUInt32LE(0, 36);

  return {
    width,
    height,
    rowSize,
    dibHeader,
    xorData: Buffer.alloc(imageSize),
    
    setPixel(x, y, r, g, b, a) {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const row = (height - 1 - y);
      const idx = row * rowSize + x * 4;
      this.xorData[idx] = b;
      this.xorData[idx + 1] = g;
      this.xorData[idx + 2] = r;
      this.xorData[idx + 3] = a;
    }
  };
}

function drawGradient(bitmap, colorStops) {
  const { width, height } = bitmap;
  for (let y = 0; y < height; y++) {
    const t = y / height;
    let c1 = colorStops[0], c2 = colorStops[colorStops.length - 1];
    let localT = t;
    
    for (let i = 0; i < colorStops.length - 1; i++) {
      if (t >= colorStops[i].pos && t <= colorStops[i + 1].pos) {
        c1 = colorStops[i];
        c2 = colorStops[i + 1];
        localT = (t - c1.pos) / (c2.pos - c1.pos);
        break;
      }
    }
    
    const r = Math.round(c1.r + (c2.r - c1.r) * localT);
    const g = Math.round(c1.g + (c2.g - c1.g) * localT);
    const b = Math.round(c1.b + (c2.b - c1.b) * localT);
    
    for (let x = 0; x < width; x++) {
      bitmap.setPixel(x, y, r, g, b, 255);
    }
  }
}

function drawRoundedRect(bitmap, x, y, w, h, radius, r, g, b, a) {
  for (let py = 0; py < bitmap.height; py++) {
    for (let px = 0; px < bitmap.width; px++) {
      const relX = px - x;
      const relY = py - y;
      
      if (relX < 0 || relX >= w || relY < 0 || relY >= h) continue;
      
      let inside = true;
      
      if (relX < radius && relY < radius) {
        const dx = radius - relX;
        const dy = radius - relY;
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (relX >= w - radius && relY < radius) {
        const dx = relX - (w - radius);
        const dy = radius - relY;
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (relX < radius && relY >= h - radius) {
        const dx = radius - relX;
        const dy = relY - (h - radius);
        if (dx * dx + dy * dy > radius * radius) inside = false;
      } else if (relX >= w - radius && relY >= h - radius) {
        const dx = relX - (w - radius);
        const dy = relY - (h - radius);
        if (dx * dx + dy * dy > radius * radius) inside = false;
      }
      
      if (inside) {
        bitmap.setPixel(px, py, r, g, b, a);
      }
    }
  }
}

function drawDiamond(bitmap, cx, cy, size, r, g, b, a) {
  for (let py = 0; py < bitmap.height; py++) {
    for (let px = 0; px < bitmap.width; px++) {
      const dx = Math.abs(px - cx);
      const dy = Math.abs(py - cy);
      if (dx + dy <= size) {
        bitmap.setPixel(px, py, r, g, b, a);
      }
    }
  }
}

function drawCircle(bitmap, cx, cy, radius, r, g, b, a) {
  for (let py = 0; py < bitmap.height; py++) {
    for (let px = 0; px < bitmap.width; px++) {
      const dx = px - cx;
      const dy = py - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        bitmap.setPixel(px, py, r, g, b, a);
      }
    }
  }
}

function generateIconImage(size) {
  const bitmap = createBitmap(size, size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      bitmap.setPixel(x, y, 0, 0, 0, 0);
    }
  }
  
  const padding = Math.floor(size * 0.08);
  const innerSize = size - padding * 2;
  const radius = Math.floor(size * 0.18);
  
  const bg = createBitmap(innerSize, innerSize);
  drawGradient(bg, [
    { pos: 0, r: 99, g: 102, b: 241 },
    { pos: 0.5, r: 124, g: 58, b: 237 },
    { pos: 1, r: 139, g: 92, b: 246 }
  ]);
  
  const mask = createBitmap(innerSize, innerSize);
  drawRoundedRect(mask, 0, 0, innerSize, innerSize, radius, 255, 255, 255, 255);
  
  for (let y = 0; y < innerSize; y++) {
    for (let x = 0; x < innerSize; x++) {
      const maskIdx = y * mask.rowSize + x * 4;
      const alpha = mask.xorData[maskIdx + 3] / 255;
      if (alpha > 0) {
        const bgIdx = y * bg.rowSize + x * 4;
        const b = bg.xorData[bgIdx];
        const g = bg.xorData[bgIdx + 1];
        const r = bg.xorData[bgIdx + 2];
        bitmap.setPixel(x + padding, y + padding, r, g, b, 255);
      }
    }
  }
  
  const symbolSize = Math.floor(innerSize * 0.35);
  const centerX = Math.floor(size / 2);
  const centerY = Math.floor(size / 2);
  
  drawDiamond(bitmap, centerX, centerY, symbolSize, 255, 255, 255, 230);
  
  const dotRadius = Math.floor(symbolSize * 0.35);
  drawCircle(bitmap, centerX, centerY, dotRadius, 99, 102, 241, 255);
  drawCircle(bitmap, centerX, centerY, Math.floor(dotRadius * 0.4), 255, 255, 255, 255);
  
  return bitmap;
}

function encodeBMP(bitmap) {
  const { width, height, rowSize, dibHeader, xorData } = bitmap;
  const imageSize = rowSize * height;
  
  const fileHeader = Buffer.alloc(14);
  fileHeader[0] = 0x42;
  fileHeader[1] = 0x4D;
  fileHeader.writeUInt32LE(14 + 40 + imageSize, 2);
  fileHeader.writeUInt16LE(0, 6);
  fileHeader.writeUInt16LE(0, 8);
  fileHeader.writeUInt32LE(14 + 40, 10);
  
  return Buffer.concat([fileHeader, dibHeader, xorData]);
}

function encodeICO(images) {
  const numImages = images.length;
  const headerSize = 6 + numImages * 16;
  
  let offset = headerSize;
  const imageBuffers = [];
  const dirEntries = [];
  
  for (const img of images) {
    const bmp = encodeBMP(img);
    const entry = Buffer.alloc(16);
    entry[0] = img.width;
    entry[1] = img.height;
    entry[2] = 0;
    entry[3] = 0;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(bmp.length, 8);
    entry.writeUInt32LE(offset, 12);
    
    dirEntries.push(entry);
    imageBuffers.push(bmp);
    offset += bmp.length;
  }
  
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(numImages, 4);
  
  return Buffer.concat([
    header,
    ...dirEntries,
    ...imageBuffers
  ]);
}

console.log('Generating BMP-based ICO for NSIS...');

const sizes = [16, 32, 48, 64, 128, 256];
const images = sizes.map(size => {
  console.log(`  Generating ${size}x${size}...`);
  return generateIconImage(size);
});

const icoBuffer = encodeICO(images);
const icoPath = path.join(__dirname, 'nexus-forge-nsis.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`✓ NSIS ICO saved: ${icoPath}`);
console.log('Done! Use nexus-forge-nsis.ico for NSIS installer.');