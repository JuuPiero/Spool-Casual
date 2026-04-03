import { _decorator, CCFloat, CCInteger, Color, Component, instantiate, Node, tween, Vec3 } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { SplineInstantiate } from '../SplineInstantiate';
import { SubRay } from './SubRay';
import { RaySlot } from './RaySlot';
import { SplineAnimate } from '../SplineAnimate';
import { GameManager } from './GameManager';
import { print } from '../ultils';
const { ccclass, property } = _decorator;

// @ccclass('FragmentData')
// export class FragmentData {
//     @property({ type: Color })
//     public color!: Color;
//     @property(RaySlot)
//     public raySlots: RaySlot[] = [];
// }



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

    @property({ type: SubRay })
    public subRays: SubRay[] = []
    @property({ type: RaySlot })
    public slots: RaySlot[] = []



    protected onLoad(): void {
        ServiceLocator.register(WoolManager, this)
        if (!this.splineInstantiate) {
            this.splineInstantiate = this.node.getComponent(SplineInstantiate);
        }
    }


    protected start(): void {

        const spoolManager = ServiceLocator.get(SpoolManager)

        this.scheduleOnce(() => {
            const newLevelData = ServiceLocator.get(GameManager).newLevelData

            this.splineInstantiate.items.forEach(item => {
                this.slots.push(item.getComponent(RaySlot))
            });

            const allItems: SplineAnimate[] = [...this.splineInstantiate.items];

            for (let i = 0; i < this.subRays.length; i++) {
                const sub = this.subRays[i];
                if (!sub.splineInstantiate) continue;
                const items = sub.splineInstantiate.items;
                for (let j = 0; j < items.length; j++) {
                    allItems.push(items[j]);
                }
            }
            for (let i = 0; i < allItems.length; i++) {
                const raySlot = allItems[i].getComponent(RaySlot);
                if (raySlot) {
                    raySlot.index = i;
                }
            }

            const total = allItems.length;

            const spoolManager = ServiceLocator.get(SpoolManager);

            const base = Math.floor(total / spoolManager.spools.length);
            const extra = total % spoolManager.spools.length;

            const passengersQueues = newLevelData.passengersQueuesData
            let itemInMainRay: number[] = []
            const subRayList = []

            // const capacityMap = new Map<Color, number>()


            for (const subRay of passengersQueues) {
                const temp = [...subRay.colorTypesQueue]
                const half = temp.splice(0, Math.floor(temp.length / 2));
                itemInMainRay = [...itemInMainRay, ...half]
                subRayList.push(temp)
            }
            console.log(itemInMainRay);
            console.log(subRayList);
            

            let index = 0;
            // print(spoolManager.spools.length + " spools")
            // print(allItems.length + " rayslots")
            
            for (let i = 0; i < spoolManager.spools.length; i++) {
                const count = base + (i < extra ? 1 : 0);
                spoolManager.spools[i].capacity = count;
                console.log(`${i}: ${spoolManager.spools[i].row}_${spoolManager.spools[i].col}: ${spoolManager.spools[i].capacity}`);
                // capacityMap.set(spoolManager.spools[i].color, spoolManager.spools[i].capacity)
                for (let j = 0; j < count; j++) {
                    const raySlot = allItems[index].getComponent(RaySlot);
                    raySlot?.wool?.setColor(spoolManager.spools[i].color);

                    index++;
                }
            }

            // capacityMap.forEach((k, v) => {
            //     print(`${k}_${v}`)
            // })

            if (this.splineInstantiate && allItems.length > 0) {
                this.calculateRelativeDistances();

                if (this.autoMove) {
                    this.startMoving();
                }
            }

        }, 0);
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
                let newDist = currentDist - this.speed * dt;

                const totalLength = leadItem.getTotalLength();
                if (newDist < 0) {
                    newDist += totalLength;
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
        }
        else {
            for (const item of items) {
                if (item && item.isValid && item.isMovingNow()) {
                    const currentDist = item.getDistance();
                    let newDist = currentDist - this.speed * dt;

                    const totalLength = item.getTotalLength();
                    if (newDist < 0) {
                        newDist += totalLength;
                    }
                    item.setDistance(newDist);
                }
            }
        }
    }


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
    public getAllRaySlots(): RaySlot[] {
        const result: RaySlot[] = [];

        // main spline trước
        for (let i = 0; i < this.splineInstantiate.items.length; i++) {
            const slot = this.splineInstantiate.items[i].getComponent(RaySlot);
            if (slot) result.push(slot);
        }

        // sub rays nối tiếp
        for (let i = 0; i < this.subRays.length; i++) {
            const sub = this.subRays[i];
            if (!sub.splineInstantiate) continue;

            const items = sub.splineInstantiate.items;

            for (let j = 0; j < items.length; j++) {
                const slot = items[j].getComponent(RaySlot);
                if (slot) result.push(slot);
            }
        }

        return result;
    }

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

    public setSpeed(speed: number): void {
        this.speed = speed;
    }

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

    public isMovingNow(): boolean {
        return this.isMoving;
    }
}