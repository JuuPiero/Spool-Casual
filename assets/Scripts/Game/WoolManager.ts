import { _decorator, Component } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { SplineInstantiate } from '../SplineInstantiate';
import { SubRay } from './SubRay';
import { RaySlot } from './RaySlot';
import { SplineAnimate } from '../SplineAnimate';
import { GameManager } from './GameManager';
import { Spool } from './Spool';
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

    @property({ 
        
        tooltip: 'Curve mau do kho (0: de, 1: kho), lay mau theo ti le tu dau den cuoi hang wool' })
    public difficultyCurveSamples: number[] = [0.1, 0.25, 0.5, 0.75, 0.9];

    @property({ tooltip: 'Do dai cum mau o muc de (cum dai hon = de hon)' })
    public easyRunLength: number = 6;

    @property({ tooltip: 'Do dai cum mau o muc kho (cum ngan hon = kho hon)' })
    public hardRunLength: number = 1;

    @property({ tooltip: 'Do ngau nhien bo sung vao run length (0 = co dinh)' })
    public runLengthJitter: number = 1;

    @property({ tooltip: 'Xac suat tranh lap lai mau o muc de' })
    public easyAvoidRepeatChance: number = 0.1;

    @property({ tooltip: 'Xac suat tranh lap lai mau o muc kho' })
    public hardAvoidRepeatChance: number = 0.9;

    @property({ tooltip: 'Lay them do kho tu level difficultyType' })
    public useLevelDifficultyType: boolean = true;

    @property({ tooltip: 'He so cong them vao difficulty theo difficultyType cua level' })
    public levelDifficultyScale: number = 0.15;



    protected onLoad(): void {
        ServiceLocator.register(WoolManager, this)
        if (!this.splineInstantiate) {
            this.splineInstantiate = this.node.getComponent(SplineInstantiate);
        }
    }

    // protected start(): void {
    //     this.scheduleOnce(() => {
    //         this.splineInstantiate.items.forEach(item => {
    //             this.slots.push(item.getComponent(RaySlot))
    //         });

    //         const allItems: any[] = [...this.splineInstantiate.items];

    //         for (let i = 0; i < this.subRays.length; i++) {
    //             const sub = this.subRays[i];
    //             if (!sub.splineInstantiate) continue;
    //             const items = sub.splineInstantiate.items;
    //             for (let j = 0; j < items.length; j++) {
    //                 allItems.push(items[j]);
    //             }
    //         }
    //         for (let i = 0; i < allItems.length; i++) {
    //             const raySlot = allItems[i].getComponent(RaySlot);
    //             if (raySlot) {
    //                 raySlot.index = i;
    //             }
    //         }

    //         const total = allItems.length;

    //         const spoolManager = ServiceLocator.get(SpoolManager);
    //         const base = Math.floor(total / spoolManager.spools.length);
    //         const extra = total % spoolManager.spools.length;

    //         let index = 0;
    //         for (let i = 0; i < spoolManager.spools.length; i++) {
    //             const count = base + (i < extra ? 1 : 0);
    //             spoolManager.spools[i].capacity = count;
    //             for (let j = 0; j < count; j++) {
    //                 const raySlot = allItems[index].getComponent(RaySlot);
    //                 raySlot?.wool?.setColor(spoolManager.spools[i].color);
    //                 index++;
    //             }
    //         }
    //         if (this.splineInstantiate && allItems.length > 0) {
    //             this.calculateRelativeDistances();
    //             if (this.autoMove) {
    //                 this.startMoving();
    //             }
    //         }

    //     }, 0);
    // }
    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private clamp01(value: number): number {
        return Math.min(1, Math.max(0, value));
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * this.clamp01(t);
    }

    private evaluateDifficulty(normalizedPos: number): number {
        const samples = this.difficultyCurveSamples;
        if (!samples || samples.length === 0) {
            return 0.5;
        }

        if (samples.length === 1) {
            return this.clamp01(samples[0]);
        }

        const t = this.clamp01(normalizedPos);
        const scaled = t * (samples.length - 1);
        const left = Math.floor(scaled);
        const right = Math.min(samples.length - 1, left + 1);
        const localT = scaled - left;

        const curveValue = this.lerp(samples[left], samples[right], localT);

        if (!this.useLevelDifficultyType) {
            return this.clamp01(curveValue);
        }

        const gameManager = ServiceLocator.get(GameManager);
        const levelDifficulty = gameManager?.newLevelData?.difficultyType ?? 0;
        return this.clamp01(curveValue + levelDifficulty * this.levelDifficultyScale);
    }

    private buildSpoolCounts(total: number, spoolManager: SpoolManager): Map<Spool, number> {
        const countMap = new Map<Spool, number>();
        const shuffledSpools = [...spoolManager.spools];
        this.shuffleArray(shuffledSpools);

        const base = Math.floor(total / shuffledSpools.length);
        const extra = total % shuffledSpools.length;

        for (let i = 0; i < shuffledSpools.length; i++) {
            const spool = shuffledSpools[i];
            const count = base + (i < extra ? 1 : 0);
            spool.capacity = count;
            countMap.set(spool, count);
        }

        return countMap;
    }

    private pickWeightedSpool(spoolCounts: Map<Spool, number>, previousSpool: Spool | null, difficulty: number): Spool | null {
        const available = Array.from(spoolCounts.entries()).filter(([, count]) => count > 0);
        if (available.length === 0) return null;
        if (available.length === 1) return available[0][0];

        const avoidRepeatChance = this.lerp(this.easyAvoidRepeatChance, this.hardAvoidRepeatChance, difficulty);
        let candidates = available;

        if (previousSpool && Math.random() < avoidRepeatChance) {
            const nonRepeat = available.filter(([spool]) => spool !== previousSpool);
            if (nonRepeat.length > 0) {
                candidates = nonRepeat;
            }
        }

        let totalWeight = 0;
        for (const [, remaining] of candidates) {
            totalWeight += remaining;
        }

        let roll = Math.random() * totalWeight;
        for (const [spool, remaining] of candidates) {
            roll -= remaining;
            if (roll <= 0) {
                return spool;
            }
        }

        return candidates[candidates.length - 1][0];
    }

    private buildCurveDistribution(total: number, spoolCounts: Map<Spool, number>): Spool[] {
        const sequence: Spool[] = [];
        let previousSpool: Spool | null = null;

        while (sequence.length < total) {
            const normalizedPos = total <= 1 ? 1 : sequence.length / (total - 1);
            const difficulty = this.evaluateDifficulty(normalizedPos);
            const runCenter = this.lerp(this.easyRunLength, this.hardRunLength, difficulty);

            const jitter = this.runLengthJitter > 0
                ? Math.floor((Math.random() * (this.runLengthJitter * 2 + 1)) - this.runLengthJitter)
                : 0;

            const desiredRun = Math.max(1, Math.round(runCenter + jitter));
            const spool = this.pickWeightedSpool(spoolCounts, previousSpool, difficulty);
            if (!spool) break;

            const remaining = spoolCounts.get(spool) ?? 0;
            const runCount = Math.min(desiredRun, remaining, total - sequence.length);

            for (let i = 0; i < runCount; i++) {
                sequence.push(spool);
            }

            const left = remaining - runCount;
            if (left > 0) {
                spoolCounts.set(spool, left);
            } else {
                spoolCounts.delete(spool);
            }

            previousSpool = spool;
        }

        if (sequence.length < total) {
            for (const [spool, remaining] of spoolCounts.entries()) {
                for (let i = 0; i < remaining; i++) {
                    sequence.push(spool);
                }
            }
        }

        return sequence;
    }

    protected start(): void {

        this.scheduleOnce(() => {

            this.splineInstantiate.items.forEach(item => {
                this.slots.push(item.getComponent(RaySlot))
            });

            const allItems: any[] = [...this.splineInstantiate.items];

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
            if (!spoolManager || spoolManager.spools.length === 0) {
                return;
            }

            const spoolCounts = this.buildSpoolCounts(total, spoolManager);
            const colorSequence = this.buildCurveDistribution(total, spoolCounts);

            for (let i = 0; i < allItems.length; i++) {
                const raySlot = allItems[i].getComponent(RaySlot);
                const spool = colorSequence[i];
                raySlot?.wool?.setColor(spool?.color);
            }
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

        const items = this.splineInstantiate.getAllItems().map(item => item.getComponent(SplineAnimate));
        if (items.length === 0) return;

        if (this.maintainFormation) {
            const leadItem = items[0];
            if (leadItem && leadItem.isValid) {
                const splineAnimate = leadItem

                const currentDist = splineAnimate.getDistance();
                let newDist = currentDist - this.speed * dt;

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