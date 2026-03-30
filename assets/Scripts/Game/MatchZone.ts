import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3, Quat, PhysicsSystem, Vec2 } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';

import { WoolManager } from './WoolManager';

import { RaySlot } from './RaySlot';
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;
    public woolManager: WoolManager;

    private collider: BoxCollider;

    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
        this.woolManager = ServiceLocator.get(WoolManager);
    }

    protected onLoad(): void {
        ServiceLocator.register(MatchZone, this)
        this.collider = this.getComponent(BoxCollider);
        this.collider?.on('onTriggerEnter', this.onTriggerEnter, this);
        this.collider?.on('onTriggerStay', this.onTriggerEnter, this);
        this.collider?.on('onTriggerExit', this.onTriggerExit, this);
    }
    protected onDestroy(): void {
        this.collider?.off('onTriggerEnter', this.onTriggerEnter, this);
        this.collider?.off('onTriggerStay', this.onTriggerEnter, this);
        this.collider?.off('onTriggerExit', this.onTriggerExit, this);
    }
    onTriggerExit(event: ITriggerEvent) {
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot) return
        if (!raySlot.wool) return
        raySlot.canCollect = false;

    }
    // onTriggerStay(event: ITriggerEvent) {
    //     const raySlot = event.otherCollider.getComponent(RaySlot)
    //     if (!raySlot) return
    //     if (!raySlot.wool) return
    //     raySlot.canCollect = true;
    //     // this.onTriggerEnter(event)
    // }
    onTriggerEnter(event: ITriggerEvent) {
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot || !raySlot.wool ) return
        if(raySlot.isCollecting) return;
        raySlot.canCollect = true;

        const slots = this.slotManager.slots
        for (const slot of slots) {
            if (slot.spool && !slot.spool.isFull() && slot.spool.color.equals(raySlot.wool.color)) {
                if (slot.spool.isFlying || slot.spool.isCollecting) continue;
                slot.spool.collectWool(raySlot);
                return;
            }
        }
    }
}