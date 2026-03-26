import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3, Quat } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';

import { WoolManager } from './WoolManager';

import { RaySlot } from './RaySlot';
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;
    private woolManager: WoolManager


    private collider: BoxCollider;

    public contains(point: Vec3): boolean {
        if (!this.collider) {
            return false;
        }

        // Convert world point to the local space of matchZone node
        const localPoint = new Vec3();
        this.node.inverseTransformPoint(localPoint, point);

        const localCenter = this.collider.center;
        const halfSize = this.collider.size.clone().multiplyScalar(0.5);

        const dx = Math.abs(localPoint.x - localCenter.x);
        const dy = Math.abs(localPoint.y - localCenter.y);
        const dz = Math.abs(localPoint.z - localCenter.z);

        // Make hit test slightly tolerant to reduce misses.
        const tolerance = 0.01;

        return dx <= halfSize.x + tolerance &&
            dy <= halfSize.y + tolerance &&
            dz <= halfSize.z + tolerance;
    }

    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
        this.woolManager = ServiceLocator.get(WoolManager);
    }


    protected onLoad(): void {
        ServiceLocator.register(MatchZone, this)
        this.collider = this.getComponent(BoxCollider);
        if (this.collider) {
            // this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
            this.collider.on('onTriggerStay', this.onTriggerEnter, this);

        }
    }
    protected onDestroy(): void {
        // this.collider.off('onTriggerEnter', this.onTriggerEnter, this);
            this.collider.off('onTriggerStay', this.onTriggerEnter, this);
    }

    onTriggerEnter(event: ITriggerEvent) {
        const slots = this.slotManager.slots
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot) return
        if(!raySlot.wool) return
        

        for (const slot of slots) {
            if (slot.spool && !slot.spool.isCollecting && !slot.spool.isFull() && !raySlot.isCollecting && !raySlot.isAvaialble() 
                && slot.spool.color.equals(raySlot.wool.color)) {
                slot.spool.collectWool(raySlot);
                break; // Collect to first matching slot only
            }
        }
    }

    
}