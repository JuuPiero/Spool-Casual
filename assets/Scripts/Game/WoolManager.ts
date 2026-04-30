import { _decorator, Color, Component } from 'cc';
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

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    public init(levelData: NewLevelData) {
        // 1. Thu thập tất cả RaySlot từ spline chính và sub rays
        this.slots = [];
        this.splineInstantiate.items.forEach(item => {
            this.slots.push(item.getComponent(RaySlot));
        });

        const allItems: any[] = [...this.splineInstantiate.items];
        for (const sub of this.subRays) {
            if (!sub.splineInstantiate) continue;
            allItems.push(...sub.splineInstantiate.items);
        }

        const total = allItems.length;
        const spoolManager = ServiceLocator.get(SpoolManager);
        if (!spoolManager || spoolManager.spools.length === 0) return;

        // 2. Chia capacity cho các spool (giữ nguyên logic chia đều của bạn)
        const base = Math.floor(total / spoolManager.spools.length);
        const extra = total % spoolManager.spools.length;

        // Mảng chứa các "khối màu"
        let colorBlocks: Color[] = [];

        for (let i = 0; i < spoolManager.spools.length; i++) {
            const spool = spoolManager.spools[i];
            const cap = base + (i < extra ? 1 : 0);
            spool.capacity = cap;

            // Tính toán kích thước khối (nửa capacity)
            // Ví dụ: cap = 10 -> khối size 5. cap = 11 -> khối size 5 và 6.
            const halfSize = Math.floor(cap / 2);
            const remainingSize = cap - halfSize;

            // Tạo 2 khối màu liên tục cho Spool này
            for (let j = 0; j < halfSize; j++) colorBlocks.push(spool.color);
            // Đánh dấu để lát nữa xáo trộn nhưng vẫn giữ tính liên tục của khối? 
            // Không, ý bạn là các wool TRONG khối liên tục, nhưng VỊ TRÍ khối thì ngẫu nhiên.
        }

        // 3. Logic tạo chuỗi màu theo khối (Chunking)
        const finalColorSequence: Color[] = this.generateChunkedSequence(spoolManager.spools, base, extra);

        // 4. Gán màu và index
        for (let i = 0; i < allItems.length; i++) {
            const raySlot = allItems[i].getComponent(RaySlot);
            if (raySlot) {
                raySlot.index = i;
                raySlot.wool?.setColor(finalColorSequence[i]);
            }
        }

        // 5. Di chuyển
        if (this.splineInstantiate && allItems.length > 0) {
            this.calculateRelativeDistances();
            if (this.autoMove) this.startMoving();
        }
    }
    private generateChunkedSequence(spools: Spool[], base: number, extra: number): Color[] {
        type ColorChunk = { color: Color, size: number };
        let chunks: ColorChunk[] = [];

        // Bước 1: Chia mỗi Spool thành 2 chunks (mỗi chunk ~50% capacity)
        for (let i = 0; i < spools.length; i++) {
            const cap = base + (i < extra ? 1 : 0);
            const firstChunkSize = Math.floor(cap / 2);
            const secondChunkSize = cap - firstChunkSize;

            if (firstChunkSize > 0) chunks.push({ color: spools[i].color, size: firstChunkSize });
            if (secondChunkSize > 0) chunks.push({ color: spools[i].color, size: secondChunkSize });
        }

        // Bước 2: Xáo trộn các Chunks (Vị trí các khối màu sẽ ngẫu nhiên)
        this.shuffleArray(chunks);

        // Bước 3: Trải phẳng các chunks thành mảng màu đơn lẻ
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