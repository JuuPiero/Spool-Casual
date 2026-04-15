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

    public itemsInMatchZone: Set<RaySlot> = new Set<RaySlot>


    public onNewItemEnter: Function = null;


    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
        this.woolManager = ServiceLocator.get(WoolManager);

    }

    protected onLoad(): void {
        ServiceLocator.register(MatchZone, this)
        this.collider = this.getComponent(BoxCollider);
        this.collider?.on('onTriggerEnter', this.onTriggerEnter, this);
        this.collider?.on('onTriggerExit', this.onTriggerExit, this);
    }
    protected onDestroy(): void {
        this.collider?.off('onTriggerEnter', this.onTriggerEnter, this);
        this.collider?.off('onTriggerExit', this.onTriggerExit, this);
    }
    onTriggerExit(event: ITriggerEvent) {
        const raySlot = event.otherCollider.getComponent(RaySlot)
        if (!raySlot) return
        if (!raySlot.wool) return
        raySlot.canCollect = false;
        this.itemsInMatchZone.delete(raySlot)
    }



    onTriggerEnter(event: ITriggerEvent) {
        const raySlot = event.otherCollider.getComponent(RaySlot);
        if (!raySlot || !raySlot.wool) return;
        if (raySlot.isCollecting) return;

        raySlot.canCollect = true;

        const slots = this.slotManager.slots;

        // Lọc và sắp xếp các slot có spool phù hợp theo count giảm dần
        const eligibleSlots = slots
            .filter(slot => {
                const spool = slot.spool;
                return spool && !spool.isFull() && spool.color.equals(raySlot.wool.color);
            })
            .sort((a, b) => (b.spool?.count || 0) - (a.spool?.count || 0));

        // Duyệt qua các slot đã được sắp xếp
        for (const slot of eligibleSlots) {
            const spool = slot.spool;
            if (!spool) continue;

            if (spool.queue.indexOf(raySlot) === -1) {
                spool.insertSorted(raySlot);
                // Chỉ gọi collects nếu spool không đang collect
                if (!spool.isCollecting) {
                    spool.collects();
                }
            }

            return;
        }

        // nếu chưa có spool phù hợp => giữ lại
        this.itemsInMatchZone.add(raySlot);
    }
// Hàm mới để quét lại các item đang kẹt trong zone
public checkExistingItems() {
    if (this.itemsInMatchZone.size === 0) return;

    // Chuyển Set thành Array để duyệt và xử lý
    const currentItems = Array.from(this.itemsInMatchZone);

    for (const raySlot of currentItems) {
        if (!raySlot || !raySlot.wool || raySlot.isCollecting) continue;

        const slots = this.slotManager.slots;
        const eligibleSlots = slots
            .filter(slot => {
                const spool = slot.spool;
                return spool && !spool.isFull() && spool.color.equals(raySlot.wool.color);
            })
            .sort((a, b) => (b.spool?.count || 0) - (a.spool?.count || 0));

        for (const slot of eligibleSlots) {
            const spool = slot.spool;
            if (!spool) continue;

            if (spool.queue.indexOf(raySlot) === -1) {
                // Xóa khỏi danh sách chờ của MatchZone trước khi add vào Spool
                this.itemsInMatchZone.delete(raySlot); 
                spool.insertSorted(raySlot);
                
                if (!spool.isCollecting) {
                    spool.collects();
                }
                break; // Tìm được spool rồi thì chuyển sang raySlot tiếp theo
            }
        }
    }
}

}