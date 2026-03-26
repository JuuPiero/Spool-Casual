import { _decorator, BoxCollider, Color, Component, log, MeshRenderer, Node, Quat, Vec3 } from 'cc';
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


    private isCollecting = false



    public matchZone: MatchZone

    protected start(): void {
        this.matchZone = ServiceLocator.get(MatchZone)
    }


    
    update(dt: number) {
        if (this.isCollecting) return;

        if (!this.matchZone || !this.matchZone.contains(this.node.worldPosition)) {
            return;
        }

        const slots = ServiceLocator.get(SlotManager).slots;
        for (const slot of slots) {
            if (slot.spool && this.isMatched(slot.spool)) {
                console.log('matched');
                this.isCollecting = true;
                slot.spool.collectWool(this);
                return;
            }
        }
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