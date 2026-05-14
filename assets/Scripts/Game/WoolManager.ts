import { _decorator, Color, Component, log, math, RealCurve } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { SplineInstantiate } from '../SplineInstantiate';
import { SubRay } from './SubRay';
import { RaySlot } from './RaySlot';
import { SplineAnimate } from '../SplineAnimate';
import { GameManager } from './GameManager';
import { Spool } from './Spool';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { NewLevelData } from './NewLevelDataSA';
import { LevelData } from './LevelDataSA';
import { PlayableColorConfig } from '../Data/ColorConfig';
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
        this.subRays = this.getComponentsInChildren(SubRay)
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.COLLECT_DONE, this.onCollectDone)
    }
    protected onDisable(): void {
        EventBus.off(GameEvent.COLLECT_DONE, this.onCollectDone)
    }


    onCollectDone = () => {
        const speedMultiplier: number = 1.025;
        // Tăng tốc độ theo phần trăm mỗi khi hoàn thành 1 spool
        // Công thức: Tốc độ mới = Tốc độ cũ * 1.1 (hoặc tùy biến)
        const newSpeed = this.speed * speedMultiplier;

        // giới hạn tốc độ tối đa để tránh lỗi vật lý hoặc giật lag
        const MAX_SPEED = 12;
        this.speed = Math.min(newSpeed, MAX_SPEED);

        console.log(`Speed increased to: ${this.speed.toFixed(2)}`);
    }

    private shuffleArray<T>(array: T[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    @property(RealCurve) public diffCurve: RealCurve = new RealCurve()

    public init(newLevelData: LevelData, colorConfig: PlayableColorConfig) {
        this.slots = [];
        const mainItems = this.splineInstantiate.items;
        
        const mainSplineItems = newLevelData.mainConveyor.colorIds


        for (let i = 0; i < mainSplineItems.length; i++) {

            const raySlot = this.splineInstantiate.items[i].getComponent(RaySlot);
            this.slots.push(raySlot);
            raySlot.wool.setColor(colorConfig.getMainColor(mainSplineItems[i]));
        }


        const subRaysData = newLevelData.conveyors;

        for (let i = 0; i < subRaysData.length; i++) {
            const subRay = this.subRays[i];
            const subRayData = subRaysData[i];
            for (let j = 0; j < subRay.raySlots.length; j++) {
                // console.log("SubRay " + i + " item " + j + " màu: " + colorConfig.getMainColor(subRayData.colorIds[j]));
                const raySlot: RaySlot = subRay.raySlots[j];
                raySlot.wool.setColor(colorConfig.getMainColor(subRayData.colorIds[j]));
            }
        }
    

        // mainItems.forEach(item => {
        //     const raySlot = item.getComponent(RaySlot)
        //     this.slots.push(raySlot);
        //     // raySlot.wool.color = colorConfig.getMainColor()
        // });

        if (this.splineInstantiate) {
            this.calculateRelativeDistances();
            if (this.autoMove) this.startMoving();
        }
        

    }

    public init1(levelData: NewLevelData) {
        // 1. Thu thập RaySlot main ray + sub rays
        this.slots = [];
        const mainItems = this.splineInstantiate.items;
        mainItems.forEach(item => {
            this.slots.push(item.getComponent(RaySlot));
        });

        const allItems: any[] = [...mainItems];
        const subItems: any[] = [];
        for (const sub of this.subRays) {
            if (!sub.splineInstantiate) continue;
            subItems.push(...sub.splineInstantiate.items);
        }
        allItems.push(...subItems);

        const total = allItems.length;
        const spoolManager = ServiceLocator.get(SpoolManager);
        if (!spoolManager || spoolManager.spools.length === 0) return;

        // 2. Chia capacity cho các spool
        const base = Math.floor(total / spoolManager.spools.length);
        const extra = total % spoolManager.spools.length;
        const remainingBySpool = new Map<Spool, number>();
        let temp = true
        for (let i = 0; i < spoolManager.spools.length; i++) {
            const spool = spoolManager.spools[i];
            const cap = base + (i < extra ? 1 : 0);
            if(temp) {
                console.log(cap);
                temp = false
            }
            spool.capacity = cap;
            remainingBySpool.set(spool, cap);
        }

        // 3. Main ray nhận màu theo diffCurve để điều khiển độ khó.
        const mainColorSequence = this.generateMainRaySequenceByDifficulty(spoolManager.spools, mainItems.length, remainingBySpool);

        // 4. Phần len còn lại (sub rays) vẫn giữ logic chunk + shuffle.
        const subColorSequence = this.generateChunkedSequenceFromRemaining(spoolManager.spools, remainingBySpool);

        // 5. Gán màu/index cho main ray
        for (let i = 0; i < mainItems.length; i++) {
            const raySlot = mainItems[i].getComponent(RaySlot);
            if (raySlot) {
                raySlot.index = i;
                raySlot.wool?.setColor(mainColorSequence[i]);
            }
        }

        // 6. Gán màu/index cho sub rays
        for (let i = 0; i < subItems.length; i++) {
            const raySlot = subItems[i].getComponent(RaySlot);
            if (raySlot) {
                raySlot.index = i + mainItems.length;
                raySlot.wool?.setColor(subColorSequence[i]);
            }
        }

        // 7. Di chuyển
        if (this.splineInstantiate && allItems.length > 0) {
            this.calculateRelativeDistances();
            if (this.autoMove) this.startMoving();
        }
    }

    private generateMainRaySequenceByDifficulty(spools: Spool[], mainCount: number, remainingBySpool: Map<Spool, number>): Color[] {
        type SpoolChunk = { spool: Spool, size: number, isDefaultOpen: boolean };

        const sequence: Color[] = [];
        if (mainCount <= 0) return sequence;

        const chunks: SpoolChunk[] = [];

        for (const spool of spools) {
            const cap = remainingBySpool.get(spool) || 0;
            if (cap <= 0) continue;

            const firstChunkSize = Math.floor(cap / 2);
            const secondChunkSize = cap - firstChunkSize;
            const isDefaultOpen = spool.isOpen || spool.row === 0;

            if (firstChunkSize > 0) {
                chunks.push({ spool, size: firstChunkSize, isDefaultOpen });
            }
            if (secondChunkSize > 0) {
                chunks.push({ spool, size: secondChunkSize, isDefaultOpen });
            }
        }

        const pickWeightedChunk = (pool: SpoolChunk[]): SpoolChunk | null => {
            if (pool.length === 0) return null;
            let totalWeight = 0;
            for (const chunk of pool) totalWeight += chunk.size;

            let roll = Math.random() * totalWeight;
            for (const chunk of pool) {
                roll -= chunk.size;
                if (roll <= 0) return chunk;
            }

            return pool[pool.length - 1];
        };

        for (let i = 0; i < mainCount; i++) {
            const t = mainCount <= 1 ? 1 : i / (mainCount - 1);
            const diffValue = this.getCurveValue01(t);

            // Curve thấp => dễ (ưu tiên màu từ spool open mặc định), curve cao => khó.
            const openChance = math.clamp01(0.85 - diffValue * 0.7);
            const preferOpen = Math.random() < openChance;

            const remainingSlots = mainCount - sequence.length;
            if (remainingSlots <= 0) break;

            const primaryFit = chunks.filter(chunk => chunk.size > 0 && chunk.isDefaultOpen === preferOpen && chunk.size <= remainingSlots);
            const secondaryFit = chunks.filter(chunk => chunk.size > 0 && chunk.isDefaultOpen !== preferOpen && chunk.size <= remainingSlots);
            const anyFit = chunks.filter(chunk => chunk.size > 0 && chunk.size <= remainingSlots);

            const primaryAny = chunks.filter(chunk => chunk.size > 0 && chunk.isDefaultOpen === preferOpen);
            const secondaryAny = chunks.filter(chunk => chunk.size > 0 && chunk.isDefaultOpen !== preferOpen);
            const anyChunk = chunks.filter(chunk => chunk.size > 0);

            const picked = pickWeightedChunk(primaryFit)
                ?? pickWeightedChunk(secondaryFit)
                ?? pickWeightedChunk(anyFit)
                ?? pickWeightedChunk(primaryAny)
                ?? pickWeightedChunk(secondaryAny)
                ?? pickWeightedChunk(anyChunk);

            if (!picked) break;

            const useCount = Math.min(picked.size, remainingSlots);
            for (let j = 0; j < useCount; j++) {
                sequence.push(picked.spool.color);
            }

            picked.size -= useCount;
            remainingBySpool.set(picked.spool, (remainingBySpool.get(picked.spool) || 0) - useCount);
        }

        return sequence;
    }

    private getCurveValue01(t: number): number {
        const raw = this.diffCurve ? this.diffCurve.evaluate(math.clamp01(t)) : 0;
        return math.clamp01(raw);
    }

    private generateChunkedSequenceFromRemaining(spools: Spool[], remainingBySpool: Map<Spool, number>): Color[] {
        type ColorChunk = { color: Color, size: number };
        let chunks: ColorChunk[] = [];

        // Bước 1: Chia phần còn lại của mỗi spool thành 2 chunks
        for (const spool of spools) {
            const cap = remainingBySpool.get(spool) || 0;
            if (cap <= 0) continue;

            const firstChunkSize = Math.floor(cap / 2);
            const secondChunkSize = cap - firstChunkSize;

            if (firstChunkSize > 0) chunks.push({ color: spool.color, size: firstChunkSize });
            if (secondChunkSize > 0) chunks.push({ color: spool.color, size: secondChunkSize });
        }

        // Bước 2: Xáo trộn các chunks
        this.shuffleArray(chunks);

        // Bước 3: Trải phẳng chunks thành mảng màu đơn lẻ
        let sequence: Color[] = [];
        for (const chunk of chunks) {
            for (let i = 0; i < chunk.size; i++) {
                sequence.push(chunk.color);
            }
        }

        return sequence;
    }

    private collectingCount: number = 0;

    public setCollecting(isCollecting: boolean) {
        if (isCollecting) this.collectingCount++;
        else this.collectingCount = Math.max(0, this.collectingCount - 1);
    }
    protected update(dt: number): void {
        if (!this.isMoving) return;
        if (!this.splineInstantiate) return;

        // const currentSpeed = this.collectingCount > 0 ? this.speed * 0.6 : this.speed;
        const currentSpeed = this.speed;
        const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));
        if (items.length === 0) return;

        if (this.maintainFormation) {
            const leadItem = items[0];
            if (leadItem && leadItem.isValid) {
                const splineAnimate = leadItem

                const currentDist = splineAnimate.getDistance();
                // let newDist = currentDist - this.speed * dt;
                let newDist = currentDist - currentSpeed * dt;

                const totalLength = splineAnimate.getTotalLength();
                if (newDist < 0) {
                    newDist += totalLength;
                }

                splineAnimate.setDistance(newDist);

                for (let i = 1; i < items.length; i++) {
                    const item = items[i];
                    if (item && item.isValid) {
                        let targetDistance = splineAnimate.getDistance() - this.distances[i];
                        if (targetDistance < 0) {
                            targetDistance += totalLength;
                        }
                        item.setDistance(targetDistance);
                    }
                }
            }
        }
    }

    private calculateRelativeDistances(): void {
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));
        if (items.length === 0) return;

        this.distances = [];
        const leadDistance = items[0].getDistance();

        for (let i = 0; i < items.length; i++) {
            const splineAnimate = items[i]
            let relativeDistance = splineAnimate.getDistance() - leadDistance;
            if (relativeDistance < 0) {
                relativeDistance += splineAnimate.getTotalLength();
            }
            this.distances.push(relativeDistance);
        }
    }

    public updateFormation(): void {
        if (this.maintainFormation && this.splineInstantiate) {
            this.calculateRelativeDistances();

            if (this.isMoving) {
                const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));
                for (const item of items) {
                    if (item && item.isValid && !item.isMovingNow()) {
                        item.startMoving();
                    }
                }
            }
        }
    }

    public recalculateDistances(): void {
        this.calculateRelativeDistances();
    }

    public startMoving(): void {
        if (!this.splineInstantiate) return;

        this.isMoving = true;
        const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));

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
        const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));

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

        const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));
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

}