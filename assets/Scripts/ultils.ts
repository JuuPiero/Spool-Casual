import { Color } from "cc";


function getRandomColor(): Color {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return new Color(r, g, b, 255); // 255 là alpha (độ đậm)
}

export {
    getRandomColor
}