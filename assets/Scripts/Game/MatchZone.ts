import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3, Quat } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';
import { Wool } from './Wool';
import { Gizmos } from '../Gizmos';
import { WoolManager } from './WoolManager';
import { NavigationContainer } from '../Navigation/NavigationContainer';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { Spool } from './Spool';
import { Slot } from './Slot';
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
        const wool = event.otherCollider.getComponent(Wool)
        if (!wool) return
        for (const slot of slots) {
            if (slot.spool && !slot.spool.isCollecting && !slot.spool.isFull() && !wool.isCollecting && !wool.isCollected && slot.spool.color.equals(wool.color)) {
                slot.spool.collectWool(wool);
                break; // Collect to first matching slot only
            }
        }
    }

    
    // public playCollectAnimation(wool: Wool, spool: Spool, slot: Slot) {
    //     let t = { value: 0 };
    //     spool.isCollecting = true;
    //     // reset spool view
    //     spool.woolsView.forEach(item => {
    //         item.active = false;
    //         item.setScale(Vec3.ZERO);
    //     });

    //     tween(t)
    //         .to(0.6, { value: 1 }, {

    //             onUpdate: () => {
    //                 const to = spool.node.worldPosition.clone();
    //                 const currentFrom = wool.node.worldPosition.clone();
    //                 const mid = currentFrom.clone().add(to).multiplyScalar(0.5);
    //                 mid.x += 1.5;
    //                 spool.collectWool(wool)
    //                 // active spool
    //                 const activeCount = Math.floor(t.value * spool.woolsView.length);

    //                 for (let i = 0; i < activeCount; i++) {
    //                     const item = spool.woolsView[i];
    //                     if (!item.active) {
    //                         item.active = true;
    //                         tween(item)
    //                             .to(0.2, { scale: Vec3.ONE })
    //                             .start();
    //                     }
    //                     spool.count++
    //                 }
    //                 const woolItemsLenght = Math.floor(t.value * wool.woolItems.length);
    //                 for (let i = 0; i < woolItemsLenght; i++) {
    //                     const item = wool.woolItems[i];
    //                     const currentScale = item.scale.clone(); // lấy scale hiện tại
    //                     tween(item)
    //                         .to(0.5, {
    //                             scale: new Vec3(0, currentScale.y, currentScale.z)
    //                         }).call(() => {
    //                             // wool.node.active = false
    //                             wool.node.destroy()
    //                         })
    //                         .start();
    //                 }
    //             }
    //         })
    //         .call(() => {
    //             // Gizmos.instance.DrawPath([]);
    //             // this.woolManager.remove(wool);
    //             // this.woolManager.remove(wool)
    //             // wool.node.destroy();
    //             // wool.node.active = false
    //             // slot.spool = null;
    //             // spool.node.destroy();
    //         })
    //         .call(() => {
    //             // console.log('check win');
    //             // if (this.woolManager.wools.length == 0) {
    //             //     EventBus.emit(GameEvent.LEVEL_COMPLETED)
    //             //     ServiceLocator.get(NavigationContainer).stack.navigate('EndgameScreen');
    //             // }
    //         })
    //         .start();
    // }
}