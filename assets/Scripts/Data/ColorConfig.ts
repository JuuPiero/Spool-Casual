import {  _decorator, Color } from "cc";
// export class ColorData {
//     public mainColor: Color = Color.WHITE;
//     public shadowColor: Color = Color.WHITE;
// }


const { ccclass, property } = _decorator;

ccclass("PlayableColorData")
export class PlayableColorData {
    public mainColor: string;
    public shadowColor: string;
}

ccclass("PlayableColorConfig")
export class PlayableColorConfig {
    public colors: PlayableColorData[] = []
    public hiddenColor: PlayableColorData = new PlayableColorData();
    public knitColors: string[] = [];
    public knitColorHidden: string;


    public getMainColor(id: number): Color {
        const color = new Color()
        color.fromHEX(this.colors[id].mainColor);
        return color;
    }


    public getShadowColor(id: number): Color {
        const color = new Color()
        color.fromHEX(this.colors[id].shadowColor);
        return color;
    }

}


// export class ColorConfigSA {

//     // private ColorData[] colors;

//     // public getMainColor(id): Color {
//     //     // return colors[id].mainColor;
//     // }
// }