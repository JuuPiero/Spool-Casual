import { Color } from "cc";


function getRandomColor(): Color {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    return new Color(r, g, b, 255); // 255 là alpha (độ đậm)
}


function  darkenColor(color, percent) {
    // percent: 0-1, càng lớn càng tối (0: giữ nguyên, 1: đen hoàn toàn)
        let r = color.r * (1 - percent);
        let g = color.g * (1 - percent);
        let b = color.b * (1 - percent);
        
        return new Color(r, g, b, color.a);
    }
export {
    getRandomColor,
    darkenColor
}