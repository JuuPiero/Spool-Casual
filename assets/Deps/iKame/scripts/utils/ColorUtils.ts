import { Color } from "cc";

export function getRandomColorHex(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export function getRandomColor(out: Color = null): Color {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    
    if (!out) out = new Color();
    out.set(r, g, b, 255);
    return out;
}

export function colorToHex(color: Color): string 
{
    return `#${((1 << 24) + (color.r << 16) + (color.g << 8) + color.b).toString(16).slice(1).toUpperCase()}`;
}

export function hexToColor(hex: string, out: Color = null): Color {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    if (!out) out = new Color();
    out.set(r, g, b, 255);
    return out;
}

export function getColorArray(color: Color): number[]
{
    return [ color.r / 255, color.g / 255, color.b / 255, color.a / 255 ];
}

export function darkenColor(ogColor: Color, factor: number = 0.8): Color
{
    return new Color(ogColor.r * factor, ogColor.g * factor, ogColor.b * factor, ogColor.a);
}
