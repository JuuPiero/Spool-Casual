import { _decorator, BoxCollider, CCBoolean, Color, Component, log, MeshRenderer, Node, Quat, Vec3 } from 'cc';
import { Spline } from '../Spline';
import { ServiceLocator } from '../ServiceLocator';
import { WoolManager } from './WoolManager';
import { MatchZone } from './MatchZone';
import { SlotManager } from './SlotManager';
import { Spool } from './Spool';

const { ccclass, property } = _decorator;

@ccclass('Wool')
export class Wool extends Component {

    @property(Color)
    public color: Color;

    @property({ type: Node })
    public woolItems: Node[] = []

    @property({ type: CCBoolean })
    public isCollected = false
    @property({ type: CCBoolean })
    public isCollecting = false

    public collect() {
        this.woolItems.forEach(item => {
            item.active = false
        })
        this.isCollected = true
        this.isCollecting = false
    }

    
    public isMatched(spool: Spool) {
        return !spool.isCollecting && !spool.isFull() && spool.color.equals(this.color)
    }

    public setColor(color: Color) {
        const items = this.node.getComponentsInChildren(MeshRenderer);
        this.color = color;

        for (const element of items) {
            element.material.setProperty("albedo", color);
        }
    }
}