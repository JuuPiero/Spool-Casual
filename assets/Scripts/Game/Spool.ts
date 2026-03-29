import { _decorator, CCBoolean, CCInteger, Color, Component, instantiate, Label, Line, MeshRenderer, Node, Tween, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
import { ServiceLocator } from '../ServiceLocator';
import { SlotManager } from './SlotManager';
import { SpoolManager } from './SpoolManager';
import { SpoolData } from './LevelData';
import { Slot } from './Slot';
import { RaySlot } from './RaySlot';
import { RopeBezierWave3D } from '../../Deps/iKame/scripts/rope/RopeBezierWave3D';
import { GameConfig } from './GameConfigSA';
import { SoundManager } from '../SoundManager';
import { darkenColor } from '../ultils';
import { TutorialController } from './UI/TutorialController';
const { ccclass, property } = _decorator;


@ccclass('Spool')
export class Spool extends Clickable {

    public data: SpoolData;

    @property(CCInteger)
    public capacity: number = 0;

    @property(CCInteger)
    public count: number = 0;

    public currentCapacity: number;

    @property(CCBoolean)
    public isFlying: boolean = false;

    @property(Color)
    public color: Color;

    public row: number = 0;
    public col: number = 0;

    @property({ type: MeshRenderer })
    public renderers: MeshRenderer[] = [];

    private isInSlot: boolean = false;

    @property({ type: Node })
    public woolsView: Node[] = [];

    public isCollecting: boolean;

    @property(Node)
    public inActiveView: Node;

    @property(Line)
    public line: Line;

    public slot: Slot;
    public spoolManager: SpoolManager;
    public rope: RopeBezierWave3D;

    private tempVec3 = new Vec3();

    protected start(): void {
        this.open();

        if (this.isBlocked()) {
            this.close();
        }

        this.spoolManager = ServiceLocator.get(SpoolManager);
    }

    public isFull() {
        return this.count === this.capacity;
    }

    public collectWool(raySlot: RaySlot) {
        if (this.isFlying || this.isCollecting) return;

        this.startCollecting(raySlot);

        const wool = raySlot.wool;
        const items = wool.woolItems;

        const start = wool.startPoint.worldPosition.clone();
        const end = wool.endPoint.worldPosition.clone();

        let t = { value: 0 };

        tween(t)
            .to(0.2, { value: 1 }, {
                easing: "quadOut",
                onUpdate: () => {
                    const smooth = Math.sin(t.value * Math.PI * 0.5);
                    Vec3.lerp(this.tempVec3, start, end, smooth);
                    this.rope.endPoint.setWorldPosition(this.tempVec3);

                    const progress = t.value * items.length;
                    const currentIndex = Math.floor(progress);

                    this.updateWoolItems(items, progress, currentIndex);
                },
                onComplete: () => {
                    this.finishCollecting(raySlot);
                }
            })
            .start();

        this.count = Math.min(this.capacity, this.count + 1);

        if (this.isFull()) {
            this.collectedDone();
        }
    }


    private shakeTween: Tween<Node> | null = null;
    private startShake() {
        if (this.shakeTween) {
            this.shakeTween.stop();
            this.shakeTween = null;
        }

        this.shakeTween = tween(this.node)
            .sequence(
                tween().by(0.2, { eulerAngles: new Vec3(0, 0, 20) }),
                tween().by(0.2, { eulerAngles: new Vec3(0, 0, -30) }),
                tween().by(0.2, { eulerAngles: new Vec3(0, 0, 20) }),
            )
            .repeatForever()
            .start();
    }
    private stopShake() {
        if (this.shakeTween) {
            this.shakeTween.stop();
            this.shakeTween = null;
        }
    }

    private startCollecting(raySlot: RaySlot) {
        this.rope.node.active = false;
        const startPos = this.rope.startPoint.worldPosition.clone();
        const endPos = raySlot.wool.woolItems[0].worldPosition.clone();


        this.resetRopeToStraightLine(startPos, endPos);

        this.rope.endPoint.setWorldPosition(endPos);

        this.rope.node.active = true;
        this.rope.setColor(this.color);
        this.isCollecting = true;
        raySlot.isCollecting = true;
        this.startShake();
    }

    private resetRopeToStraightLine(startPos: Vec3, endPos: Vec3) {
        if (!this.rope || !this.rope['points']) return;

        // Reset the rope's internal points to a straight line
        const pointCount = this.rope['pointCount'];
        for (let idx = 0; idx < pointCount; idx++) {
            const t = idx / (pointCount - 1);
            const pos = new Vec3();
            Vec3.lerp(pos, startPos, endPos, t);

            if (this.rope['points'][idx]) {
                this.rope['points'][idx].pos.set(pos);
                this.rope['points'][idx].prev.set(pos);
            }
        }

        // Reset rest lengths to match straight line
        if (this.rope['rest']) {
            for (let i = 0; i < this.rope['rest'].length; i++) {
                const t1 = i / (pointCount - 1);
                const t2 = (i + 1) / (pointCount - 1);
                const p1 = new Vec3();
                const p2 = new Vec3();
                Vec3.lerp(p1, startPos, endPos, t1);
                Vec3.lerp(p2, startPos, endPos, t2);
                this.rope['rest'][i] = Vec3.distance(p1, p2);
            }
        }

        // Reset velocity history
        if (this.rope['prevStartPos'] && this.rope['prevEndPos']) {
            this.rope['prevStartPos'].set(startPos);
            this.rope['prevEndPos'].set(endPos);
        }

        if (this.rope['lastStart'] && this.rope['lastEnd']) {
            this.rope['lastStart'].set(startPos);
            this.rope['lastEnd'].set(endPos);
        }

        // Force immediate line update
        this.rope.updateLine();
    }

    private updateWoolItems(items: Node[], progress: number, currentIndex: number) {
        for (let i = 0; i <= currentIndex && i < items.length; i++) {
            const item = items[i];

            const clamped = Math.max(0, Math.min(1, progress - i));
            const smooth = Math.sin(clamped * Math.PI * 0.5);
            const scaleX = 1 - smooth;

            this.tempVec3.set(scaleX, item.scale.y, item.scale.z);
            item.setScale(this.tempVec3);
        }
    }


    private updateRopeFollow(items: Node[], currentIndex: number) {
        if (!this.rope.node.isValid) return;

        const followIndex = Math.min(currentIndex, items.length - 1);
        const target = items[followIndex];

        if (target) {
            const pos = target.worldPosition;
            this.rope.endPoint.setWorldPosition(pos);
        }

        if (!this.slot.labelProcess.node.active) {
            this.slot.labelProcess.node.active = true;
        }
    }
    private finishCollecting(raySlot: RaySlot) {
        this.stopShake();
        this.rope.node.active = false;
        this.isCollecting = false;
        raySlot.isCollecting = false;
        raySlot.wool.node.active = false;
        raySlot.wool = null;
        this.syncWoolsView();
    }

    public collectedDone() {
        this.isFlying = true;
        SoundManager.instance.playOneShot('Success');

        const effect = instantiate(ServiceLocator.get(GameConfig).completedEffect);
        effect.setParent(this.node);

        tween(this.node)
            .by(0.1, { eulerAngles: new Vec3(0, 0, 20) })
            .by(0.1, { eulerAngles: new Vec3(0, 0, -40) })
            .by(0.1, { eulerAngles: new Vec3(0, 0, 20) })
            .to(0.2, { scale: Vec3.ZERO }, { easing: "backIn" })
            .call(() => this.finishSpool())
            .start();
    }

    private finishSpool() {
        this.node.active = false;

        this.slot.labelProcess.node.active = false;
        this.slot.setProcess(0);

        this.spoolManager.remove(this);
        this.slot.spool = null;

        this.spoolManager.checkWin();
    }

    protected onDestroy(): void {
        this.rope.node.active = false;
    }


    public onClick() {
        if (this.isFlying || this.isInSlot) return;

        if (this.isBlocked()) {
            SoundManager.instance.playOneShot('Failed');
            return;
        }
        const tut = ServiceLocator.get(TutorialController)
        if (tut && tut.node.active) {
            tut.node.active = false
        }

        const slot = ServiceLocator.get(SlotManager).getAvailableSlot();

        if (!slot) {
            SoundManager.instance.playOneShot('Failed');
            return;
        }


        this.activateNextSpool();

        SoundManager.instance.playOneShot('Click');

        this.moveToSlot(slot);
    }

    private activateNextSpool() {
        const spool = this.spoolManager.getSpool(this.row - 1, this.col);
        if (spool) spool.open();
    }

    private moveToSlot(slot: Slot) {
        this.isFlying = true;
        this.isInSlot = true;

        this.slot = slot;
        slot.setSpool(this);
        slot.setProcess(0);
        slot.labelProcess.node.active = true;

        const targetPos = slot.node.worldPosition.clone();
        targetPos.y = this.node.y;

        const localTarget = new Vec3();
        this.node.parent!.inverseTransformPoint(localTarget, targetPos);

        if (this.rope) this.rope.node.active = false;

        tween(this.node)
            .to(0.2, {
                position: localTarget,
                eulerAngles: new Vec3(-90, 90, 90)
            }, { easing: "quadOut" })
            .call(() => {
                this.isFlying = false;
                this.rope.startPoint.setPosition(Vec3.ZERO);
                this.rope.endPoint.setPosition(Vec3.ZERO);
            })
            .start();
    }

    private syncWoolsView() {
        if (!this.node || !this.woolsView.length || this.capacity <= 0) return;

        const capacityPerItem = this.capacity / this.woolsView.length;

        for (let i = 0; i < this.woolsView.length; i++) {
            const item = this.woolsView[i];

            const filled = this.count - i * capacityPerItem;
            const ratio = Math.max(0, Math.min(1, filled / capacityPerItem));

            item.active = ratio > 0;

            if (item.active) {
                item.setScale(ratio, ratio, ratio);
            } else {
                item.setScale(Vec3.ZERO);
            }
        }

        this.slot?.setProcess(Math.round(this.count / this.capacity * 100));
    }

    public open() {
        this.setRendererActive(true);
        this.woolsView.forEach(item => item.active = false);
    }

    public close() {
        this.setRendererActive(false);
        this.inActiveView.active = true;
    }

    private setRendererActive(active: boolean) {
        this.renderers.forEach(renderer => {
            renderer.node.active = active;

            const mat = renderer.getMaterialInstance(0);

            if (active) {
                mat.setProperty("color", this.color);
                mat.setProperty('lineWidth', 70);
            } else {
                mat.setProperty('lineWidth', 0);
            }
        });
    }

    private isBlocked(): boolean {
        const spools = ServiceLocator.get(SpoolManager).spools;

        return spools.some(s =>
            s !== this &&
            s.col === this.col &&
            s.row > this.row &&
            !s.isInSlot
        );
    }
}