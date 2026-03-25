import { _decorator, CCBoolean, CCInteger, Color, Component, Line, MeshRenderer, Node, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
import { ServiceLocator } from '../ServiceLocator';
import { SlotManager } from './SlotManager';
import { SpoolManager } from './SpoolManager';
import { SpoolData } from './LevelData';
import { Wool } from './Wool';
const { ccclass, property } = _decorator;


@ccclass('Spool')
export class Spool extends Clickable {

    public data: SpoolData;

    // public static maxCapacity: number = 20;
    @property(CCInteger)
    public capacity: number = 0;

    @property(CCInteger)
    public count: number = 0;


    public currentCapacity: number;

    @property(CCBoolean)
    public isFlying: boolean = false;


    @property(Color)
    public color: Color


    public row: number = 0;
    public col: number = 0;


    @property({ type: MeshRenderer })
    public renderers: MeshRenderer[] = []

    private isInSlot: boolean = false;

    @property({ type: Node })
    public woolsView: Node[] = []

    public isCollecting: boolean

    @property(Node)
    public inActiveView: Node;

    @property(Line)
    public line: Line;

    protected start(): void {

        this.renderers.forEach(renderer => {
            const mat = renderer.getMaterialInstance(0);
            mat.setProperty("baseColor", this.color);
        })
        this.woolsView.forEach(item => {
            item.active = false
        })

        if (this.isBlocked()) {
            console.log("tắt spool");
            this.renderers.forEach(renderer => {
                renderer.node.active = false
            })
            this.inActiveView.active = true

        }
    }
    // public roolWool(wool: Wool) {

    //     this.count++
    //     let t = { value: 0 };
    //     const to = this.node.worldPosition.clone();
    //     const currentFrom = wool.node.worldPosition.clone();
    //     const mid = currentFrom.clone().add(to).multiplyScalar(0.5);
    //     mid.x += 1.5;
    //     const dynamicPoints = this.GetBezierPoints(currentFrom, mid, to, 30);
    //     tween(t)
    //         .to(0.5, { value: 1 }, {
    //             onUpdate: () => {
    //                 if (!this.isFlying) {
    //                     const maxIndex = Math.floor(t.value * (dynamicPoints.length - 1));
    //                     const currentPoints = dynamicPoints.slice(0, maxIndex + 1);
    //                     this.drawPath(currentPoints, this.color);
    //                     // phóng to dần sợi chỉ của cuộn
    //                     const activeCount = Math.floor(t.value * this.woolsView.length);
    //                     for (let i = 0; i < activeCount; i++) {
    //                         const item = this.woolsView[i];
    //                         if (!item.active) {
    //                             item.active = true;
    //                             tween(item)
    //                                 .to(0.2, { scale: Vec3.ONE })
    //                                 .start();
    //                         }
    //                     }
    //                     // thu nhỏ dần dợi chỉ
    //                     const woolItemsLenght = Math.floor(t.value * wool.woolItems.length);
    //                     for (let i = 0; i < woolItemsLenght; i++) {
    //                         const item = wool.woolItems[i];
    //                         const currentScale = item.scale.clone(); 
    //                         tween(item)
    //                             .to(0.5, {
    //                                 scale: new Vec3(0, currentScale.y, currentScale.z)
    //                             }).call(() => {
    //                                 wool.node.active = false
    //                             })
    //                             .start();
    //                     }
    //                 }
    //             }
    //         }).call(() => {
    //             this.drawPath([]);
    //         })
    //         .start();
    //     // this.drawPath(currentPoints, this.color);
    //     if (this.count === this.capacity) {
    //         //TODO: cuộn đủ len
    //     }
    // }
    public roolWool(wool: Wool) {
        if (this.isFlying) {
            this.scheduleOnce(() => {
                this.roolWool(wool);
            }, 0.35);
            return;
        }

        this.count++;

        const to = this.node.worldPosition.clone();
        const from = wool.node.worldPosition.clone();

        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.x += 1.5;

        const points = this.GetBezierPoints(from, mid, to, 40);

        let t = { value: 0 };

        tween(t)
            .to(0.5, { value: 1 }, {
                onUpdate: () => {
                    const total = points.length - 1;
                    const exactIndex = t.value * total;

                    const currentIndex = Math.floor(exactIndex);
                    const nextIndex = Math.min(currentIndex + 1, total);
                    const alpha = exactIndex - currentIndex;

                    // 👉 nội suy điểm cuối để mượt
                    const lastPoint = new Vec3();
                    lastPoint.y += Math.sin(t.value * Math.PI) * 0.2;
                    Vec3.lerp(lastPoint, points[currentIndex], points[nextIndex], alpha);

                    const currentPoints: Vec3[] = [];

                    for (let i = 0; i < currentIndex; i++) {
                        currentPoints.push(points[i]);
                    }

                    currentPoints.push(lastPoint);

                    this.drawPath(currentPoints, this.color);
                    const activeCount = Math.floor(t.value * this.woolsView.length);
                    for (let i = 0; i < activeCount; i++) {
                        const item = this.woolsView[i];
                        if (!item.active) {
                            item.active = true;

                            item.setScale(Vec3.ZERO);
                            tween(item)
                                .to(0.2, { scale: Vec3.ONE })
                                .start();
                        }
                    }

                    // =========================
                    // 👉 wool shrink (anti spam tween)
                    // =========================
                    // const woolCount = Math.floor(t.value * wool.woolItems.length);

                    // for (let i = 0; i < woolCount; i++) {
                    //     const item = wool.woolItems[i] as any;
                    //     if (!item._animated) {
                    //         item._animated = true;
                    //         const currentScale = item.scale.clone();
                    //         tween(item)
                    //             .to(0.5, {
                    //                 scale: new Vec3(0, currentScale.y, currentScale.z)
                    //             })
                    //             .start();
                    //     }
                    // }
                    const woolItemsLenght = Math.floor(t.value * wool.woolItems.length);
                    for (let i = 0; i < woolItemsLenght; i++) {
                        const item = wool.woolItems[i];
                        const currentScale = item.scale.clone();
                        tween(item)
                            .to(0.5, {
                                scale: new Vec3(0, currentScale.y, currentScale.z)
                            }).call(() => {
                                wool.node.active = false
                            })
                            .start();
                    }
                }
            })
            .call(() => {
                this.drawPath([]);

                // tắt wool sau khi hoàn tất
                wool.node.active = false;
            })
            .start();

        if (this.count === this.capacity) {
            // TODO: full spool
        }
    }
    public drawPath(points: Vec3[], color: Color | null = null) {
        if (!this.line) return;

        if (color) {
            this.line.color.color = color;
        }

        const localPoints: Vec3[] = [];

        for (let i = 0; i < points.length; i++) {
            const out = new Vec3();
            this.node.inverseTransformPoint(out, points[i]);
            localPoints.push(out);
        }

        this.line.positions = localPoints;
    }
    public GetBezierPoints(p0: Vec3, p1: Vec3, p2: Vec3, segments: number = 20): Vec3[] {
        const points: Vec3[] = [];

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;

            const a = p0.clone().multiplyScalar((1 - t) * (1 - t));
            const b = p1.clone().multiplyScalar(2 * (1 - t) * t);
            const c = p2.clone().multiplyScalar(t * t);

            const point = a.add(b).add(c);
            points.push(point);
        }

        return points;
    }


    public onClick() {
        if (this.isFlying || this.isInSlot) return;

        if (this.isBlocked()) {
            console.log("bị che");
            return;
        }


        const slotManager = ServiceLocator.get(SlotManager)
        const spoolManager = ServiceLocator.get(SpoolManager)

        const slot = slotManager.getAvailableSlot()

        if (!slot) {
            console.log('hết')
            return;
        }

        const spool = spoolManager.getSpool(this.row - 1, this.col)
        console.log(`Clicked ${this.row}, ${this.col}`)

        if (spool) {
            console.log(`active spool bottom ${this.row - 1}, ${this.col}`);
            spool.open()
        }

        this.isFlying = true;
        slot.setSpool(this);
        this.isInSlot = true

        const index = spoolManager.spools.indexOf(this)
        spoolManager.spools.splice(index, 1)


        const targetPos = slot.node.worldPosition.clone();
        targetPos.y = this.node.y

        const parent = this.node.parent!;
        const localTarget = new Vec3();
        parent.inverseTransformPoint(localTarget, targetPos);

        tween(this.node)
            .to(0.3, {
                position: localTarget,
                eulerAngles: new Vec3(0, 0, 90)
            }, {
                easing: "quadOut"
            })
            .call(() => {
                this.isFlying = false;
            })
            .start();
    }

    public open() {
        this.renderers.forEach(renderer => {
            renderer.node.active = true
        })
        this.woolsView.forEach(item => {
            item.active = false
        })
    }


    private isBlocked(): boolean {
        const spoolManager = ServiceLocator.get(SpoolManager)

        for (const s of spoolManager.spools) {
            if (s === this) continue;

            // cùng cột và nằm trên
            if (s.col === this.col && s.row > this.row) {
                return true;
            }
        }

        return false;
    }
}
