import { _decorator, CCBoolean, CCInteger, Color, Component, Line, MeshRenderer, Node, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
import { ServiceLocator } from '../ServiceLocator';
import { SlotManager } from './SlotManager';
import { SpoolManager } from './SpoolManager';
import { SpoolData } from './LevelData';
import { Wool } from './Wool';
import { Slot } from './Slot';
import { RaySlot } from './RaySlot';
const { ccclass, property } = _decorator;


@ccclass('Spool')
export class Spool extends Clickable {

    public data: SpoolData;

    // public static maxCapacity: number = 20;
    @property(CCInteger)
    public capacity: number = 0;

    @property(CCInteger)
    public count: number = 0; // Count ~ woolsView(count and scale 0 -> 1)


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


    public slot: Slot


    public spoolManager: SpoolManager

    protected start(): void {

        this.renderers.forEach(renderer => {
            const mat = renderer.getMaterialInstance(0);
            mat.setProperty("baseColor", this.color);
        })

        // this.syncWoolsView();

        if (this.isBlocked()) {
            console.log("tắt spool");
            this.renderers.forEach(renderer => {
                renderer.node.active = false
            })
            this.inActiveView.active = true
        }

        this.woolsView.forEach(item => {
            item.active = false
        })
        this.spoolManager = ServiceLocator.get(SpoolManager)
    }

    public isFull() {
        return this.count == this.capacity
    }
    public collectWool(raySlot: RaySlot) {
        if (this.isFlying || this.isCollecting) {
            return;
        }

        this.isCollecting = true;
        raySlot.isCollecting = true
        const previousCount = this.count;
        this.count = Math.min(this.capacity, this.count + 1);

        const targetWoolsCount = Math.min(this.count, this.woolsView.length);
        const newlyAdded = targetWoolsCount - previousCount; // should normally be 1

        const to = this.node.worldPosition.clone();
        const from = raySlot.wool.node.worldPosition.clone();

        const mid = from.clone().add(to).multiplyScalar(0.5);
        mid.x += 1.5;
        const points = this.GetBezierPoints(from, mid, to, 40);

        let t = { value: 0 };

        tween(t)
            .to(0.25, { value: 1 }, {
                onUpdate: () => {
                    if (!this.node) return;
                    const total = points.length - 1;
                    const exactIndex = t.value * total;

                    const currentIndex = Math.floor(exactIndex);
                    const nextIndex = Math.min(currentIndex + 1, total);
                    const alpha = exactIndex - currentIndex;

                    const lastPoint = new Vec3();
                    lastPoint.y += Math.sin(t.value * Math.PI) * 0.2;
                    Vec3.lerp(lastPoint, points[currentIndex], points[nextIndex], alpha);

                    const currentPoints: Vec3[] = [];
                    for (let i = 0; i < currentIndex; i++) {
                        currentPoints.push(points[i]);
                    }
                    currentPoints.push(lastPoint);
                    this.drawPath(currentPoints, this.color);


                    const totalItems = raySlot.wool.woolItems.length;

                    for (let i = 0; i < totalItems; i++) {
                        const item = raySlot.wool.woolItems[i];

                        const itemProgress = t.value * totalItems - i;

                        const clamped = Math.max(0, Math.min(1, itemProgress));

                        const scaleX = 1 - clamped;

                        const currentScale = item.scale.clone();
                        item.setScale(new Vec3(scaleX, currentScale.y, currentScale.z));
                    }
                   
                }
            })
            .call(() => {
                this.drawPath([]);
                raySlot.wool.node.destroy()
                raySlot.wool = null
                raySlot.isCollecting = false
                this.isCollecting = false;
                this.syncWoolsView();
            })
            .start();

        if (this.count === this.capacity) {

            this.spoolManager.remove(this)
            this.slot.spool = null
            this.node.destroy();
            this.spoolManager.checkWin()
            // if()
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
        // const spoolManager = ServiceLocator.get(SpoolManager)

        const slot = slotManager.getAvailableSlot()
        if (!slot) {
            console.log('hết')
            return;
        }

        const spool = this.spoolManager.getSpool(this.row - 1, this.col)
        console.log(`Clicked ${this.row}, ${this.col}`)

        if (spool) {
            console.log(`active spool bottom ${this.row - 1}, ${this.col}`);
            spool.open()
        }

        this.isFlying = true;
        slot.setSpool(this);
        this.isInSlot = true
        this.slot = slot



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

    private syncWoolsView() {
        if (!this.node) return;
        if (!this.woolsView || this.woolsView.length === 0 || this.capacity <= 0) return;

        const capacityPerItem = this.capacity / this.woolsView.length;

        for (let i = 0; i < this.woolsView.length; i++) {
            const item = this.woolsView[i];

            // lượng fill của item này
            const filled = this.count - i * capacityPerItem;

            // clamp từ 0 → capacityPerItem
            const clamped = Math.max(0, Math.min(capacityPerItem, filled));

            const ratio = clamped / capacityPerItem;

            if (ratio > 0) {
                item.active = true;
                item.setScale(new Vec3(ratio, ratio, ratio));
            } else {
                item.active = false;
                item.setScale(Vec3.ZERO);
            }
        }
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
            if (s.col === this.col && s.row > this.row && !s.isInSlot) {
                return true;
            }
        }

        return false;
    }
}
