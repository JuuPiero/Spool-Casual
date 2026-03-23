import { _decorator, Color, Component, MeshRenderer, Node } from 'cc';
import { Clickable } from '../Clickable';
// import { SpoolData } from './LevelData';
import { getRandomColor } from '../ultils';
const { ccclass, property } = _decorator;

@ccclass('Spool')
export class Spool extends Clickable {

    // public data: SpoolData;


    @property(Color)
    public color: Color


    @property({ type: MeshRenderer })
    public renderers: MeshRenderer[] = []


    protected start(): void {
        this.color = getRandomColor()
        // console.log(this.color)

        this.renderers.forEach(renderer => {
            const mat = renderer.getMaterialInstance(0);
            mat.setProperty("baseColor", this.color); 
        })
    }

    public onClick() {
        console.log("Clicked")
    }
}


