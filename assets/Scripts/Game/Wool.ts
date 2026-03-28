import { _decorator, BoxCollider, CCBoolean, Color, Component, log, MeshRenderer, Node, Quat, Vec3 } from 'cc';

import { Spool } from './Spool';
import { darkenColor } from '../ultils';


const { ccclass, property } = _decorator;

@ccclass('Wool')
export class Wool extends Component {

    @property(Color)
    public color: Color = new Color();

    @property({ type: Node })
    public woolItems: Node[] = []

    @property(Node)
    public startPoint: Node
    @property(Node)
    public endPoint: Node

    public setColor(color: Color) {
        const items = this.node.getComponentsInChildren(MeshRenderer);
        this.color = color;

        for (const element of items) {
            const mat = element.getMaterialInstance(0);
            mat.setProperty("color", this.color);
        }
    }
}