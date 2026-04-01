import { Color } from "cc";


function getRandomColor(): Color {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return new Color(r, g, b, 255); // 255 là alpha (độ đậm)
}


function darkenColor(color, percent) {
    let r = color.r * (1 - percent);
    let g = color.g * (1 - percent);
    let b = color.b * (1 - percent);

    return new Color(r, g, b, color.a);
}

export {
    getRandomColor,
    darkenColor,
}

