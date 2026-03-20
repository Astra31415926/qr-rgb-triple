// 1. Функция определения минимальной версии (размера сетки) для текста
function getRequiredVersion(text) {
    const len = text.length;
    if (len === 0) return 1;
    if (len <= 25) return 2;   // Сетка 25x25
    if (len <= 47) return 4;   // Сетка 33x33
    if (len <= 77) return 6;   // Сетка 41x41
    if (len <= 114) return 8;  // Сетка 49x49
    return 10;                 // Сетка 57x57 (до 174 симв.)
}

// 2. Получение данных QR-кода с API
async function getQRData(text, canvasSize, version) {
    if (!text) return null;
    
    // margin=0 убирает рамки, которые сдвигают сетку
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${canvasSize}x${canvasSize}&data=${encodeURIComponent(text)}&version=${version}&margin=0&format=png`;
    
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = qrUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvasSize;
            canvas.height = canvasSize;
            const ctx = canvas.getContext("2d");
            // Рисуем строго в границы холста
            ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
            resolve(ctx.getImageData(0, 0, canvasSize, canvasSize).data);
        };
        img.onerror = () => resolve(null);
    });
}

// 3. Основная логика генерации при клике
document.getElementById("generateBtn").addEventListener("click", async () => {
    const canvasSize = 300; // Фиксированный размер в пикселях
    const tR = document.getElementById("inputRed").value;
    const tG = document.getElementById("inputGreen").value;
    const tB = document.getElementById("inputBlue").value;

    // Вычисляем общую версию для всех по самой длинной строке
    const version = Math.max(getRequiredVersion(tR), getRequiredVersion(tG), getRequiredVersion(tB));

    // Загружаем все три канала одновременно
    const [dataR, dataG, dataB] = await Promise.all([
        getQRData(tR, canvasSize, version),
        getQRData(tG, canvasSize, version),
        getQRData(tB, canvasSize, version)
    ]);

    const canvas = document.createElement("canvas");
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext("2d");
    const finalImg = ctx.createImageData(canvasSize, canvasSize);
    const d = finalImg.data;

    // Смешиваем каналы: если пиксель QR черный (< 128), зажигаем соответствующий цвет
    for (let i = 0; i < d.length; i += 4) {
        d[i]     = (dataR && dataR[i] < 128) ? 255 : 0; // Красный
        d[i + 1] = (dataG && dataG[i] < 128) ? 255 : 0; // Зеленый
        d[i + 2] = (dataB && dataB[i] < 128) ? 255 : 0; // Синий
        d[i + 3] = 255; // Прозрачность (непрозрачно)
    }

    ctx.putImageData(finalImg, 0, 0);
    
    // Вывод результата на страницу
    const resultDiv = document.getElementById("qrResult");
    resultDiv.innerHTML = "";
    const resultImg = new Image();
    resultImg.src = canvas.toDataURL();
    resultImg.style.border = "10px solid white"; // Добавляем визуальную рамку для удобства сканирования
    resultDiv.appendChild(resultImg);
});
