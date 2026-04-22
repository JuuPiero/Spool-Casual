import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3, Quat, PhysicsSystem, Vec2 } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';

import { WoolManager } from './WoolManager';

import { RaySlot } from './RaySlot';
import { GameManager, GameState } from './GameManager';
import { SplineAnimate } from '../SplineAnimate';
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;
    public woolManager: WoolManager;
    public gameManager: GameManager
    private collider: BoxCollider;

    public itemsInMatchZone: Set<RaySlot> = new Set<RaySlot>


    public onNewItemEnter: Function = null;


    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
        this.woolManager = ServiceLocator.get(WoolManager);
        this.gameManager = ServiceLocator.get(GameManager)

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
        const raySlot = event.otherCollider.getComponent(RaySlot);
        if (!raySlot) return;

        raySlot.canCollect = false;
        raySlot.isCollecting = false;
        this.itemsInMatchZone.delete(raySlot);

        // BỔ SUNG: Tìm xem có Spool nào đang chứa raySlot này trong queue không và xóa nó đi
        const allSlots = this.slotManager.slots;
        for (const slot of allSlots) {
            if (slot.spool && slot.spool.queue.length > 0) {
                const index = slot.spool.queue.indexOf(raySlot);
                if (index !== -1) {
                    slot.spool.queue.splice(index, 1);
                }
            }
        }
    }



    onTriggerEnter(event: ITriggerEvent) {
        if (this.gameManager.state !== GameState.PLAY) return


        const raySlot = event.otherCollider.getComponent(RaySlot);
        if (!raySlot || !raySlot.wool) return;
        if (raySlot.isCollecting) return;

        raySlot.canCollect = true;

        const slots = this.slotManager.slots;

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
    public checkExistingItems() {
        if (this.itemsInMatchZone.size === 0) return;

      const sortedItems = Array.from(this.itemsInMatchZone)
        .sort((a, b) => {
            // Lấy distance hiện tại từ component SplineAnimate
            const distA = a.getComponent(SplineAnimate).getDistance();
            const distB = b.getComponent(SplineAnimate).getDistance();
            // Sắp xếp để thằng có distance nhỏ hơn (đi trước) được ưu tiên
            return distA - distB; 
        });

        for (const raySlot of sortedItems) {
            if (!raySlot || !raySlot.wool || raySlot.isCollecting || !raySlot.canCollect) continue;

            // Tìm Spool phù hợp nhất
            const eligibleSlots = this.slotManager.slots
                .filter(slot => {
                    const spool = slot.spool;
                    return spool && !spool.isFull() && spool.color.equals(raySlot.wool.color);
                })
                .sort((a, b) => (b.spool?.count || 0) - (a.spool?.count || 0));

            for (const slot of eligibleSlots) {
                const spool = slot.spool;
                if (spool && spool.queue.indexOf(raySlot) === -1) {
                    this.itemsInMatchZone.delete(raySlot);
                    spool.insertSorted(raySlot); 

                    if (!spool.isCollecting) {
                        spool.collects();
                    }
                    break;
                }
            }
        }
    }
}