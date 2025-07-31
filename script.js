const canvasWrapper = document.getElementById('canvasWrapper');
const canvas = document.getElementById('canvas');
const canvasWidthInput = document.getElementById('canvasWidth');
const canvasHeightInput = document.getElementById('canvasHeight');
const keepSquareInput = document.getElementById('keepSquare');
const leftClickInput = document.getElementById('leftClick');
const rightClickInput = document.getElementById('rightClick');
const generateCanvasBtn = document.getElementById('generateCanvas');
const showMatrixBtn = document.getElementById('showMatrix');
const copyMatrixBtn = document.getElementById('copyMatrix');
const copyHexBtn = document.getElementById('copyHex');
const matrixOutput = document.getElementById('matrixOutput');
const hexOutput = document.getElementById('hexOutput');
const importBmpInput = document.getElementById('importBmp');
const invertColorsBtn = document.getElementById('invertColors');
const bucketToolBtn = document.getElementById('bucketTool');

let width = parseInt(canvasWidthInput.value);
let height = parseInt(canvasHeightInput.value);
let matrix = [];

let isDragging = false;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;
let scale = 1;
let isBucketTool = false;

let isDrawing = false;
let drawValue = 1;

// Mantener cuadrado
canvasWidthInput.addEventListener('input', () => {
  if (keepSquareInput.checked) {
    canvasHeightInput.value = canvasWidthInput.value;
  }
});
canvasHeightInput.addEventListener('input', () => {
  if (keepSquareInput.checked) {
    canvasWidthInput.value = canvasHeightInput.value;
  }
});

// Crear lienzo
function createCanvas() {
  width = parseInt(canvasWidthInput.value);
  height = parseInt(canvasHeightInput.value);

  canvas.style.gridTemplateColumns = `repeat(${width}, 20px)`;
  canvas.style.gridTemplateRows = `repeat(${height}, 20px)`;

  matrix = Array(height).fill().map(() => Array(width).fill(0));
  canvas.innerHTML = '';

  // Eventos Mouse
  canvas.addEventListener('mousedown', (e) => {
    if (!e.target.classList.contains('pixel')) return;
    e.preventDefault();
    const x = parseInt(e.target.dataset.x);
    const y = parseInt(e.target.dataset.y);
    drawValue = (e.button === 0 ? leftClickInput.value : rightClickInput.value);

    if (isBucketTool) {
      const oldValue = matrix[y][x];
      if (oldValue != drawValue) {
        floodFill(x, y, oldValue, parseInt(drawValue));
        redrawCanvas();
      }
    } else {
      isDrawing = true;
      paintPixel(e.target, x, y, drawValue);
    }
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing || !e.target.classList.contains('pixel') || isBucketTool) return;
    paintPixel(e.target, parseInt(e.target.dataset.x), parseInt(e.target.dataset.y), drawValue);
  });

  canvas.addEventListener('mouseup', () => { isDrawing = false; });
  canvas.addEventListener('mouseleave', () => { isDrawing = false; });

  // Eventos Táctiles (dibujo y cubeta)
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target || !target.classList.contains('pixel')) return;

    const x = parseInt(target.dataset.x);
    const y = parseInt(target.dataset.y);
    drawValue = leftClickInput.value;

    if (isBucketTool) {
      const oldValue = matrix[y][x];
      if (oldValue != drawValue) {
        floodFill(x, y, oldValue, parseInt(drawValue));
        redrawCanvas();
      }
    } else {
      isDrawing = true;
      paintPixel(target, x, y, drawValue);
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!isDrawing || isBucketTool) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target || !target.classList.contains('pixel')) return;

    paintPixel(target, parseInt(target.dataset.x), parseInt(target.dataset.y), drawValue);
  });

  canvas.addEventListener('touchend', () => {
    isDrawing = false;
  });

  // Crear píxeles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = document.createElement('div');
      pixel.classList.add('pixel');
      pixel.dataset.x = x;
      pixel.dataset.y = y;
      canvas.appendChild(pixel);
    }
  }
  updateMatrixOutput();
  updateHexOutput();
  resetTransform();
}

// Pintar pixel
function paintPixel(pixel, x, y, value) {
  matrix[y][x] = parseInt(value);
  pixel.style.background = value == 1 ? 'black' : 'white';
  updateMatrixOutput();
  updateHexOutput();
}

// Redibujar canvas
function redrawCanvas() {
  const pixels = canvas.querySelectorAll('.pixel');
  pixels.forEach((pixel) => {
    const x = parseInt(pixel.dataset.x);
    const y = parseInt(pixel.dataset.y);
    pixel.style.background = matrix[y][x] === 1 ? 'black' : 'white';
  });
  updateMatrixOutput();
  updateHexOutput();
}

// Flood Fill (cubeta)
function floodFill(x, y, oldValue, newValue) {
  if (x < 0 || x >= width || y < 0 || y >= height) return;
  if (matrix[y][x] !== oldValue) return;

  matrix[y][x] = newValue;
  floodFill(x + 1, y, oldValue, newValue);
  floodFill(x - 1, y, oldValue, newValue);
  floodFill(x, y + 1, oldValue, newValue);
  floodFill(x, y - 1, oldValue, newValue);
}

// Mostrar matriz
function updateMatrixOutput() {
  matrixOutput.textContent = matrix.map(row => row.join(' ')).join('\n');
  copyMatrixBtn.style.display = 'inline-block';
}

// Mostrar HEX
function updateHexOutput() {
  let hexText = '';
  let bytesPerRow = Math.ceil(width / 8);

  for (let y = 0; y < height; y++) {
    let rowBytes = [];
    for (let byteIndex = 0; byteIndex < bytesPerRow; byteIndex++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        let x = byteIndex * 8 + bit;
        byte = (byte << 1) | (x < width && matrix[y][x] === 1 ? 1 : 0);
      }
      rowBytes.push(`0x${byte.toString(16).padStart(2, '0').toUpperCase()}`);
    }
    hexText += '  ' + rowBytes.join(', ') + ',\n';
  }
  hexOutput.textContent = hexText.trim();
  copyHexBtn.style.display = 'inline-block';
}

// Copiar botones
copyMatrixBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(matrixOutput.textContent);
});
copyHexBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(hexOutput.textContent);
});

// Importar BMP
importBmpInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      width = img.width;
      height = img.height;
      canvasWidthInput.value = width;
      canvasHeightInput.value = height;
      createCanvas();

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, img.width, img.height);

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const index = (y * img.width + x) * 4;
          const r = imgData.data[index];
          const g = imgData.data[index + 1];
          const b = imgData.data[index + 2];
          const avg = (r + g + b) / 3;
          matrix[y][x] = avg < 128 ? 1 : 0;
        }
      }

      redrawCanvas();
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

// ------- ZOOM Y PAN --------
function resetTransform() {
  offsetX = 0;
  offsetY = 0;
  scale = 1;
  updateTransform();
}

function updateTransform() {
  canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}

// Zoom con rueda
canvasWrapper.addEventListener('wheel', (e) => {
  e.preventDefault();
  scale += e.deltaY < 0 ? 0.1 : -0.1;
  scale = Math.min(Math.max(scale, 0.5), 4);
  updateTransform();
});

// Pan con mouse
canvasWrapper.addEventListener('mousedown', (e) => {
  if (e.button === 1 || !e.target.classList.contains('pixel')) {
    isDragging = true;
    startX = e.clientX - offsetX;
    startY = e.clientY - offsetY;
    canvasWrapper.classList.add('dragging');
  }
});
canvasWrapper.addEventListener('mouseup', () => {
  isDragging = false;
  canvasWrapper.classList.remove('dragging');
});
canvasWrapper.addEventListener('mouseleave', () => {
  isDragging = false;
  canvasWrapper.classList.remove('dragging');
});
canvasWrapper.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  updateTransform();
});

// Pan y Zoom táctil
let lastDistance = 0;
canvasWrapper.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    lastDistance = getDistance(e.touches[0], e.touches[1]);
  } else if (e.touches.length === 1 && !e.target.classList.contains('pixel')) {
    isDragging = true;
    startX = e.touches[0].clientX - offsetX;
    startY = e.touches[0].clientY - offsetY;
  }
});

canvasWrapper.addEventListener('touchmove', (e) => {
  if (e.touches.length === 2) {
    // pinch-to-zoom
    const distance = getDistance(e.touches[0], e.touches[1]);
    if (lastDistance !== 0) {
      const delta = distance - lastDistance;
      scale += delta * 0.005;
      scale = Math.min(Math.max(scale, 0.5), 4);
      updateTransform();
    }
    lastDistance = distance;
  } else if (isDragging && e.touches.length === 1) {
    offsetX = e.touches[0].clientX - startX;
    offsetY = e.touches[0].clientY - startY;
    updateTransform();
  }
});

canvasWrapper.addEventListener('touchend', () => {
  isDragging = false;
  lastDistance = 0;
});

function getDistance(touch1, touch2) {
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// Inicializar
generateCanvasBtn.addEventListener('click', createCanvas);
showMatrixBtn.addEventListener('click', updateMatrixOutput);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
createCanvas();

// Invertir colores
invertColorsBtn.addEventListener('click', () => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      matrix[y][x] = matrix[y][x] === 1 ? 0 : 1;
    }
  }
  redrawCanvas();
});

// Activar cubeta
bucketToolBtn.addEventListener('click', () => {
  isBucketTool = !isBucketTool;
  bucketToolBtn.style.background = isBucketTool ? '#ffcc00' : '#5fcde4';
});
