import { _decorator, CCFloat, CCInteger, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { Slot } from './Slot';
import { GameConfig } from './GameConfigSA';
const { ccclass, property } = _decorator;

@ccclass('SlotManager')
export class SlotManager extends Component {
    
    // @property(Prefab)
    // public slotPrefab: Prefab

    @property(CCInteger)
    public slotCount: number

    @property(CCFloat)
    public spacing: number
    
    @property({ type: Slot })
    public slots: Slot[] = []

    onLoad() {
        ServiceLocator.register(SlotManager, this)
    }

    protected start(): void {
        this.spawnSlots();
    }

    private spawnSlots() {
        this.slots = [];

        // tổng chiều dài hàng ngang
        const totalWidth = (this.slotCount - 1) * this.spacing;

        const gameConfig = ServiceLocator.get(GameConfig)

        // điểm bắt đầu để căn giữa
        const startX = -totalWidth / 2;

        for (let i = 0; i < this.slotCount; i++) {
            const node = instantiate(gameConfig.slotPrefab);
            node.setParent(this.node);
            node.name = `slot_${i}`

            const x = startX + i * this.spacing;
            node.setPosition(new Vec3(x, -1, 0));

            const slot = node.getComponent(Slot);
            if (slot) {
                this.slots.push(slot);
            }
        }
    }

    public getAvailableSlot(): Slot | null {
        for (const slot of this.slots) {
            if(slot.isAvailable()) return slot
        }
        return null
        
    }
    

   
}


