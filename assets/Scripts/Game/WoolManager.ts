import { _decorator, CCFloat, CCInteger, Color, Component, instantiate, Node, tween, Vec3 } from 'cc';
import { Wool } from './Wool';
import { Spline } from '../Spline';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { SplineInstantiate } from '../SplineInstantiate';
import { SubRay } from './SubRay';
import { RaySlot } from './RaySlot';
const { ccclass, property } = _decorator;

@ccclass('WoolManager')
export class WoolManager extends Component {

  

    @property({ type: SplineInstantiate, tooltip: "Reference đến SplineInstantiate" })
    public splineInstantiate: SplineInstantiate = null!;

    @property({})
    public speed: number = 5;

    @property({ tooltip: "Tự động di chuyển khi start" })
    public autoMove: boolean = true;

    @property({ tooltip: "Giữ khoảng cách tương đối như lúc spawn" })
    public maintainFormation: boolean = true;

    private isMoving: boolean = false;
    private distances: number[] = []; // Lưu khoảng cách tương đối giữa các item

    @property({type: SubRay})
    public subRays: SubRay[] = []


    public isCollecting = false


    // public wools: Wool[] = []


    @property({type: RaySlot})
    public slots: RaySlot[] = []

    protected onLoad(): void {
        ServiceLocator.register(WoolManager, this)
    }


    protected start(): void {
        if (!this.splineInstantiate) {
            this.splineInstantiate = this.node.getComponent(SplineInstantiate);
        }
        const spoolManager = ServiceLocator.get(SpoolManager)

        this.splineInstantiate.items.forEach(item => {
            this.slots.push(item.node.getComponent(RaySlot))
        })

        const base = Math.floor(this.splineInstantiate.items.length / spoolManager.spools.length); // 8
        const extra = this.splineInstantiate.items.length % spoolManager.spools.length; // 4
        let threadIndex = 0;
        for (let i = 0; i < spoolManager.spools.length; i++) {
            const count = base + (i < extra ? 1 : 0);
            spoolManager.spools[i].capacity = count
            for (let j = 0; j < count; j++) {
                const raySlot = this.splineInstantiate.items[threadIndex].getComponent(RaySlot)
                raySlot.wool?.setColor(spoolManager.spools[i].color)
                threadIndex++;
            }
        }


        if (this.splineInstantiate && this.splineInstantiate.items.length > 0) {
            this.calculateRelativeDistances();

            if (this.autoMove) {
                this.startMoving();
            }
        }
    }

    protected update(dt: number): void {
        if (!this.isMoving) return;
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems();
        if (items.length === 0) return;

        if (this.maintainFormation) {
            const leadItem = items[0];
            if (leadItem && leadItem.isValid) {
                const currentDist = leadItem.getDistance();
                let newDist = currentDist + this.speed * dt;

                const totalLength = leadItem.getTotalLength();
                if (newDist >= totalLength) {
                    newDist -= totalLength;
                }

                leadItem.setDistance(newDist);

                for (let i = 1; i < items.length; i++) {
                    const item = items[i];
                    if (item && item.isValid) {
                        let targetDistance = leadItem.getDistance() - this.distances[i];
                        if (targetDistance < 0) {
                            targetDistance += totalLength;
                        }
                        item.setDistance(targetDistance);
                    }
                }
            }
        } else {
            for (const item of items) {
                if (item && item.isValid && item.isMovingNow()) {
                    const currentDist = item.getDistance();
                    let newDist = currentDist + this.speed * dt;

                    const totalLength = item.getTotalLength();
                    if (newDist >= totalLength) {
                        newDist -= totalLength;
                    }

                    item.setDistance(newDist);
                }
            }
        }
    }

    /**
     * Tính toán khoảng cách tương đối giữa các item
     */
    private calculateRelativeDistances(): void {
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems();
        if (items.length === 0) return;

        this.distances = [];
        const leadDistance = items[0].getDistance();

        for (let i = 0; i < items.length; i++) {
            let relativeDistance = items[i].getDistance() - leadDistance;
            if (relativeDistance < 0) {
                relativeDistance += items[i].getTotalLength();
            }
            this.distances.push(relativeDistance);
        }
    }

    public updateFormation(): void {
    if (this.maintainFormation && this.splineInstantiate) {
        this.calculateRelativeDistances();
        
        if (this.isMoving) {
            const items = this.splineInstantiate.getAllItems();
            for (const item of items) {
                if (item && item.isValid && !item.isMovingNow()) {
                    item.startMoving();
                }
            }
        }
    }
}

// Hoặc public hóa method calculateRelativeDistances
public recalculateDistances(): void {
    this.calculateRelativeDistances();
}

    
    public startMoving(): void {
        if (!this.splineInstantiate) return;

        this.isMoving = true;
        const items = this.splineInstantiate.getAllItems();

        if (this.maintainFormation) {
            if (items.length > 0 && items[0]) {
                items[0].startMoving();
            }
        } else {
            for (const item of items) {
                if (item && item.isValid) {
                    item.startMoving();
                }
            }
        }
    }

    /**
     * Dừng di chuyển
     */
    public stopMoving(): void {
        if (!this.splineInstantiate) return;

        this.isMoving = false;
        const items = this.splineInstantiate.getAllItems();

        for (const item of items) {
            if (item && item.isValid) {
                item.stopMoving();
            }
        }
    }

    /**
     * Reset tất cả về vị trí ban đầu
     */
    public reset(): void {
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems();
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item && item.isValid) {
                const originalDistance = this.splineInstantiate.useUniformSpacing
                    ? (i / this.splineInstantiate.count + this.splineInstantiate.startOffset) % 1 * item.getTotalLength()
                    : 0; 
                item.setDistance(originalDistance);
            }
        }

        this.calculateRelativeDistances();
    }

    /**
     * Set tốc độ di chuyển
     */
    public setSpeed(speed: number): void {
        this.speed = speed;
    }

    /**
     * Lấy tốc độ hiện tại
     */
    public getSpeed(): number {
        return this.speed;
    }

    /**
     * Bật/tắt chế độ giữ formation
     */
    public setMaintainFormation(enable: boolean): void {
        this.maintainFormation = enable;

        if (enable) {
            this.calculateRelativeDistances();
        }
    }

    /**
     * Kiểm tra có đang di chuyển không
     */
    public isMovingNow(): boolean {
        return this.isMoving;
    }
}