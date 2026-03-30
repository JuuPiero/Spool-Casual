import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3, Quat, PhysicsSystem } from 'cc';
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

    onTriggerStay(event: ITriggerEvent) {
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot) return
        if (!raySlot.wool) return
        raySlot.canCollect = true;

        // if (raySlot.isCollecting) return;
        // if (!raySlot.canCollect) return;

        // let index = this.woolManager.slots.indexOf(raySlot);

        // // for (let i = 0; i < array.length; i++) {
        // //     const element = array[i];
        // // }
        // const slots = this.slotManager.slots
        // while (this.woolManager.slots[index].wool.color.equals(raySlot.wool.color) && index >= 0) {
        //     for (const slot of slots) {
        //         if (slot.spool && !slot.spool.isFull() && slot.spool.color.equals(raySlot.wool.color)) {
        //             slot.spool.collectWool(this.woolManager.slots[index]);
        //         }
        //     }
        //     index--;
        //     if(!this.woolManager.slots[index].wool.color.equals(raySlot.wool.color)) {
        //         break
        //     }
        // }
    }
    onTriggerEnter(event: ITriggerEvent) {
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot) return
        if (!raySlot.wool) return
        raySlot.canCollect = true;

        if (raySlot.isCollecting) return;
        // 0 1 2 3 4 5 6 7 8 9 10 -> l: 11
        // const index = this.woolManager.slots.indexOf(raySlot);

        const slots = this.slotManager.slots

        for (const slot of slots) {
            if (slot.spool && !slot.spool.isFull() && slot.spool.color.equals(raySlot.wool.color)) {
                slot.spool.collectWool(raySlot);

                // if (index > 0) {
                //     for (let i = index; i >= 0; i--) {
                //         slot.spool.queue.push(this.woolManager.slots[i]);
                //     }
                // }
                // if (slot.spool.queue.length > 0) {
                //     for (const queuedRaySlot of slot.spool.queue) {
                //         if (!queuedRaySlot.canCollect) continue;
                //         slot.spool.collectWool(queuedRaySlot);
                //     }
                // }


                // if (slot.spool.isCollecting && slot.spool.queue.indexOf(raySlot) === -1) {
                //     slot.spool.queue.push(raySlot);
                // }
                // else {
                //     if(slot.spool.queue.length > 0) {
                //         // const nextRaySlot = slot.spool.queue.shift()!;
                //         for (const queuedRaySlot of slot.spool.queue) {
                //             if(!queuedRaySlot.canCollect) continue;
                //             slot.spool.collectWool(queuedRaySlot);
                //         }
                //     }
                //     else {
                //         slot.spool.collectWool(raySlot);
                //     }
                // }

                break;
            }
        }
    }
}