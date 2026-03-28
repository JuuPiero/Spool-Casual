import { _decorator, CCBoolean, CCInteger, Color, Component, instantiate, Label, Line, MeshRenderer, Node, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
import { ServiceLocator } from '../ServiceLocator';
import { SlotManager } from './SlotManager';
import { SpoolManager } from './SpoolManager';
import { SpoolData } from './LevelData';
import { Wool } from './Wool';
import { Slot } from './Slot';
import { RaySlot } from './RaySlot';
import { RopeBezierWave3D } from '../../Deps/iKame/scripts/rope/RopeBezierWave3D';
import { darkenColor } from '../ultils';
import { GameConfig } from './GameConfigSA';
import { SoundManager } from '../SoundManager';
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


    public rope: RopeBezierWave3D



    protected start(): void {
       
        this.open()
        if (this.isBlocked()) {
            this.close()
        }

       
        this.spoolManager = ServiceLocator.get(SpoolManager)
    }

    public isFull() {
        return this.count == this.capacity
    }
    public collectWool(raySlot: RaySlot) {
        if (this.isFlying || this.isCollecting) {
            return;
        }

        this.rope.node.active = true;
        this.rope.startPoint.setPosition(Vec3.ZERO)
        this.rope.endPoint.setPosition(Vec3.ZERO)
        this.rope.setColor(this.color)
        this.isCollecting = true;
        raySlot.isCollecting = true;

        this.count = Math.min(this.capacity, this.count + 1);

        let t = { value: 0 };
        const items = raySlot.wool.woolItems;
        const totalItems = items.length;

        const tempScale = new Vec3();
        tween(t)
            .to(0.15, { value: 1 }, {
                onUpdate: () => {

                    if (!this.node) return;

                    const progress = t.value * totalItems;
                    const currentIndex = Math.floor(progress);
                    // chỉ update các item cần thiết
                    for (let i = 0; i <= currentIndex && i < totalItems; i++) {
                        const item = items[i];
                        const itemProgress = progress - i;
                        const clamped = Math.max(0, Math.min(1, itemProgress));

                        const smooth = Math.sin(clamped * Math.PI * 0.5);
                        const scaleX = 1 - smooth;

                        // KHÔNG clone nữa
                        tempScale.set(scaleX, item.scale.y, item.scale.z);
                        item.setScale(tempScale);
                    }

                    // rope chỉ follow item hiện tại
                    if (this.rope.node.isValid) {
                        const followIndex = Math.min(currentIndex, totalItems - 1);
                        this.rope.endPoint.setWorldPosition(items[followIndex].worldPosition);

                        if (!this.slot.labelProcess.node.active) {
                            this.slot.labelProcess.node.active = true;
                        }
                    }
                },

                onComplete: () => {
                    this.rope.node.active = false;
                    this.isCollecting = false;
                    raySlot.wool.node.active = false;
                    raySlot.wool = null;
                    raySlot.isCollecting = false;
                    this.syncWoolsView();
                }
            })
            .call(() => {
                // this.rope.startPoint.setPosition(Vec3.ZERO)
                //     this.rope.endPoint.setPosition(Vec3.ZERO)
            })
            .start();

        if (this.count === this.capacity) {
            // CUỘN XONG
            this.isFlying = true;
            // console.log('play sound and vfx');
            SoundManager.instance.playOneShot('Success')
            const effect = instantiate(ServiceLocator.get(GameConfig).completedEffect)
            effect.setParent(this.node)

            tween(this.node)
                .by(0.1, { eulerAngles: new Vec3(0, 0, 20) })
                .by(0.1, { eulerAngles: new Vec3(0, 0, -40) })
                .by(0.1, { eulerAngles: new Vec3(0, 0, 20) })
                .to(0.2, {
                    scale: Vec3.ZERO
                }, {
                    easing: "backIn"
                })
                .call(() => {
                    this.node.active = false;
                    this.slot.labelProcess.node.active = false;
                    this.slot.setProcess(0)
                    this.spoolManager.remove(this);
                    this.slot.spool = null;
                    this.spoolManager.checkWin();
                })
                .start();
        }
    }

    protected onDestroy(): void {
        this.rope.node.active = false
    }

    public drawPath(points: Vec3[], color: Color | null = null) {
        if (!this.line) return;

        if (color) {
            this.line.color.color = color;
        }

        const localPoints: Vec3[] = [];

        for (let i = 0; i < points?.length; i++) {
            const out = new Vec3();
            this.node.inverseTransformPoint(out, points[i]);
            localPoints.push(out);
        }

        this.line.positions = localPoints;
    }

    public onClick() {
        if (this.isFlying || this.isInSlot) return;

        if (this.isBlocked()) {
            SoundManager.instance.playOneShot('Failed')

            return;
        }

        const slotManager = ServiceLocator.get(SlotManager)

        const slot = slotManager.getAvailableSlot()
        if (!slot) {
            SoundManager.instance.playOneShot('Failed')
            return;
        }

        const spool = this.spoolManager.getSpool(this.row - 1, this.col)
        console.log(`Clicked ${this.row}, ${this.col}`)
        if (spool) {
            console.log(`active spool at ${this.row - 1}, ${this.col}`);
            spool.open()
        }
        SoundManager.instance.playOneShot('Click')

        this.isFlying = true;
        slot.setSpool(this);
        this.isInSlot = true
        this.slot = slot
        this.slot.setProcess(0)
        this.slot.labelProcess.node.active = true;

        const targetPos = slot.node.worldPosition.clone();
        targetPos.y = this.node.y

        const parent = this.node.parent!;
        const localTarget = new Vec3();
        parent.inverseTransformPoint(localTarget, targetPos);
        if (this.rope) {
            this.rope.node.active = false
        }

        tween(this.node)
            .to(0.2, {
                position: localTarget,
                eulerAngles: new Vec3(0, 0, 90)
            }, {
                easing: "quadOut"
            })
            .call(() => {
                this.isFlying = false;
                this.rope.startPoint.setPosition(Vec3.ZERO)
                this.rope.endPoint.setPosition(Vec3.ZERO)

            })
            .start();
    }

    private syncWoolsView() {
        if (!this.node) return;
        if (!this.woolsView || this.woolsView.length === 0 || this.capacity <= 0) return;

        const capacityPerItem = this.capacity / this.woolsView.length;

        for (let i = 0; i < this.woolsView.length; i++) {
            const item = this.woolsView[i];

            const filled = this.count - i * capacityPerItem;
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
        this.slot?.setProcess(Math.round(this.count / this.capacity * 100));

    }

    public open() {
        this.renderers.forEach(renderer => {
            renderer.node.active = true
            const mat = renderer.getMaterialInstance(0)
            mat.setProperty("color", this.color);
            mat.setProperty('lineWidth', 70)
        })
        this.woolsView.forEach(item => {
            item.active = false
        })
    }
    public close() {
        this.renderers.forEach(renderer => {
            renderer.node.active = false
            const mat = renderer.getMaterialInstance(0)
            mat.setProperty('lineWidth', 0)
        })
        this.inActiveView.active = true
    }


    private isBlocked(): boolean {
        const spoolManager = ServiceLocator.get(SpoolManager)

        for (const s of spoolManager.spools) {
            if (s === this) continue;

            if (s.col === this.col && s.row > this.row && !s.isInSlot) {
                return true;
            }
        }

        return false;
    }
}
