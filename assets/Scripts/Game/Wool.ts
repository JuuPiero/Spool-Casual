import { _decorator, Color, Component, MeshRenderer, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Wool')
export class Wool extends Component {

    @property(MeshRenderer)
    public renderer: MeshRenderer;

    public setColor(color: Color) {
        const mat = this.renderer.getMaterialInstance(0);
        mat.setProperty("baseColor", color);
    }
}


