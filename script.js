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

let width = parseInt(canvasWidthInput.value);
let height = parseInt(canvasHeightInput.value);
let matrix = [];

let isDragging = false;
let startX = 0;
let startY = 0;
let offsetX = 0;
let offsetY = 0;
let scale = 1;

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

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = document.createElement('div');
      pixel.classList.add('pixel');
      pixel.dataset.x = x;
      pixel.dataset.y = y;

      pixel.addEventListener('mousedown', (e) => {
        e.preventDefault();
        if (e.button === 1) return; // rueda no pinta
        const colorValue = e.button === 0 ? leftClickInput.value : rightClickInput.value;
        paintPixel(pixel, x, y, colorValue);
      });

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

      // Canvas temporal
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

      // Dibujar importado
      const pixels = canvas.querySelectorAll('.pixel');
      pixels.forEach((pixel) => {
        const x = parseInt(pixel.dataset.x);
        const y = parseInt(pixel.dataset.y);
        pixel.style.background = matrix[y][x] === 1 ? 'black' : 'white';
      });

      updateMatrixOutput();
      updateHexOutput();
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

// Pan (rueda o clic fuera de píxeles)
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

// Inicializar
generateCanvasBtn.addEventListener('click', createCanvas);
showMatrixBtn.addEventListener('click', updateMatrixOutput);
createCanvas();
canvas.addEventListener('contextmenu', (e) => e.preventDefault());


const invertColorsBtn = document.getElementById('invertColors'); // Seleccionamos el botón

// Evento para invertir
invertColorsBtn.addEventListener('click', () => {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      matrix[y][x] = matrix[y][x] === 1 ? 0 : 1;
    }
  }
  // Actualizamos la vista de los píxeles
  const pixels = canvas.querySelectorAll('.pixel');
  pixels.forEach((pixel) => {
    const x = parseInt(pixel.dataset.x);
    const y = parseInt(pixel.dataset.y);
    pixel.style.background = matrix[y][x] === 1 ? 'black' : 'white';
  });
  updateMatrixOutput();
  updateHexOutput();
});
