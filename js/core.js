// Функция подбора минимальной версии QR для заданной длины текста
function getRequiredVersion(text) {
    const len = text.length;
    if (len <= 25) return 2;   // 25x25
    if (len <= 47) return 4;   // 33x33
    if (len <= 77) return 6;   // 41x41
    if (len <= 114) return 8;  // 49x49
    return 10;                 // 57x57 (запас до 174 симв.)
}

async function getQRData(text, size, version) {
    if (!text) return null;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}&bgcolor=ffffff&version=${version}`;
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = qrUrl;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(ctx.getImageData(0, 0, size, size).data);
        };
    });
}

document.getElementById("generateBtn").addEventListener("click", async () => {
    const size = 300;
    const tR = document.getElementById("inputRed").value;
    const tG = document.getElementById("inputGreen").value;
    const tB = document.getElementById("inputBlue").value;

    // Вычисляем макс. версию на основе самого длинного слова
    const version = Math.max(getRequiredVersion(tR), getRequiredVersion(tG), getRequiredVersion(tB));

    const dataR = await getQRData(tR, size, version);
    const dataG = await getQRData(tG, size, version);
    const dataB = await getQRData(tB, size, version);

    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");
    const finalImg = ctx.createImageData(size, size);
    const d = finalImg.data;

    for (let i = 0; i < d.length; i += 4) {
        d[i]     = (dataR && dataR[i] < 128) ? 255 : 0;
        d[i + 1] = (dataG && dataG[i] < 128) ? 255 : 0;
        d[i + 2] = (dataB && dataB[i] < 128) ? 255 : 0;
        d[i + 3] = 255;
    }

    ctx.putImageData(finalImg, 0, 0);
    document.getElementById("qrResult").innerHTML = `<img src="${canvas.toDataURL()}">`;
});
