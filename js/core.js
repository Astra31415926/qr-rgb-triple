let currentChannel = 'B'; // По умолчанию ищем синий

function setChannel(ch) {
    currentChannel = ch;
    document.getElementById("scanMessage").textContent = "Ищем канал: " + ch;
}

// Функция для генерации одного QR-слоя
async function getQRData(text, size) {
    if (!text) return null;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff`;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = qrUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, size, size).data);
        };
        img.onerror = () => resolve(null);
    });
}

document.getElementById("generateBtn").addEventListener("click", async () => {
    const size = 300;
    const txtR = document.getElementById("inputRed").value.trim();
    const txtG = document.getElementById("inputGreen").value.trim();
    const txtB = document.getElementById("inputBlue").value.trim();

    const dataR = await getQRData(txtR, size);
    const dataG = await getQRData(txtG, size);
    const dataB = await getQRData(txtB, size);

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const finalImg = ctx.createImageData(size, size);
    const d = finalImg.data;

    for (let i = 0; i < d.length; i += 4) {
        // Если в ч/б коде пиксель черный (<128), активируем цвет в канале
        d[i]     = (dataR && dataR[i] < 128) ? 255 : 0;   // Red канал
        d[i + 1] = (dataG && dataG[i] < 128) ? 255 : 0;   // Green канал
        d[i + 2] = (dataB && dataB[i] < 128) ? 255 : 0;   // Blue канал
        d[i + 3] = 255; // Альфа
    }

    ctx.putImageData(finalImg, 0, 0);
    const resultDiv = document.getElementById("qrResult");
    resultDiv.innerHTML = '';
    const imgElement = document.createElement("img");
    imgElement.src = canvas.toDataURL("image/png");
    resultDiv.appendChild(imgElement);
});

// === СЕКЦИЯ СКАНЕРА ===
const scanBtn = document.getElementById("scanBtn");
const scannerOverlay = document.getElementById("scannerOverlay");
const video = document.getElementById("video");
const closeScanner = document.getElementById("closeScanner");
const scanResult = document.getElementById("scanResult");

let scanning = false;
let stream = null;

scanBtn.addEventListener("click", async () => {
    try {
        scannerOverlay.style.display = "flex";
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.play();
        scanning = true;
        setChannel('B');
        requestAnimationFrame(scanFrame);
    } catch (err) { alert("Камера недоступна"); }
});

closeScanner.addEventListener("click", () => {
    scanning = false;
    scannerOverlay.style.display = "none";
    if (stream) stream.getTracks().forEach(t => t.stop());
});

function scanFrame() {
    if (!scanning) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const bwData = new Uint8ClampedArray(data.length);

        for (let i = 0; i < data.length; i += 4) {
            let val = 255;
            // Фильтруем пиксель в зависимости от выбранного канала
            if (currentChannel === 'R' && data[i] > 150) val = 0;
            if (currentChannel === 'G' && data[i+1] > 150) val = 0;
            if (currentChannel === 'B' && data[i+2] > 150) val = 0;

            bwData[i] = bwData[i+1] = bwData[i+2] = val;
            bwData[i+3] = 255;
        }

        const code = jsQR(bwData, canvas.width, canvas.height);
        if (code) {
            scanResult.innerHTML = `<strong>[${currentChannel}] Найдено:</strong> ` + code.data;
            // Не закрываем сканер сразу, чтобы можно было переключить канал
        }
    }
    requestAnimationFrame(scanFrame);
}
