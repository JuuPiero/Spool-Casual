import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3, Quat, PhysicsSystem } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';

import { WoolManager } from './WoolManager';

import { RaySlot } from './RaySlot';
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;

    private collider: BoxCollider;

    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
    }

    protected onLoad(): void {
        ServiceLocator.register(MatchZone, this)
        this.collider = this.getComponent(BoxCollider);
        if (this.collider) {
            this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
            this.collider.on('onTriggerStay', this.onTriggerEnter, this);
            // this.collider.on('onTriggerExit', this.onTriggerEnter, this);

        }
    }
    protected onDestroy(): void {
        this.collider?.off('onTriggerEnter', this.onTriggerEnter, this);
        this.collider?.off('onTriggerStay', this.onTriggerEnter, this);
        // this.collider?.off('onTriggerExit', this.onTriggerEnter, this);
    }

    onTriggerEnter(event: ITriggerEvent) {
        const slots = this.slotManager.slots
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot) return
        if(!raySlot.wool) return
        if (raySlot.isCollecting) return;
        for (const slot of slots) {
            if (slot.spool && !slot.spool.isCollecting && !slot.spool.isFull() 
                && slot.spool.color.equals(raySlot.wool.color)) {
                slot.spool.collectWool(raySlot);
                break; 
            }
        }
    }
}