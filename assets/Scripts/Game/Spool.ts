import { _decorator, CCBoolean, CCInteger, Color, Component, instantiate, Label, Line, log, MeshRenderer, Node, Tween, tween, Vec3 } from 'cc';
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
import { TutorialController } from './UI/TutorialController';
import { GameManager } from './GameManager';
import { CustomLineMesh } from '../../Deps/iKame/scripts/rope/CustomLineMesh';
import { MatchZone } from './MatchZone';
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

    public spoolManager: SpoolManager;

    @property(Slot)
    public slot: Slot = null;

    @property(RopeBezierWave3D)
    public rope: RopeBezierWave3D;

    protected start(): void {
        this.spoolManager = ServiceLocator.get(SpoolManager);
        this.rope = this.getComponentInChildren(RopeBezierWave3D)!;
        this.rope?.setColor(this.color);
        this.open();

        if (this.isBlocked()) {
            this.close();
        }
    }

    public isFull() {
        return this.count === this.capacity;
    }


    private tempVec3: Vec3 = new Vec3()


    public collectedDone() {
        this.isFlying = true;
        SoundManager.instance.playOneShot('Success');

        const effect = instantiate(ServiceLocator.get(GameConfig).completedEffect);
        effect.setParent(this.node);

        tween(this.node)
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
            console.log('out of slot');
            return;
        }

        this.activateNextSpools();
        SoundManager.instance.playOneShot('Click');
        this.moveToSlot(slot);
    }

    private activateNextSpools() {
        const right = this.spoolManager.getSpool(this.row, this.col + 1);
        if (right) right.open();
        const left = this.spoolManager.getSpool(this.row, this.col - 1);
        if (left) left.open();
        const down = this.spoolManager.getSpool(this.row - 1, this.col);
        if (down) down.open();
    }

    private moveToSlot(slot: Slot) {
        this.isFlying = true;
        this.isInSlot = true;
        slot.setProcess(0);
        slot.labelProcess.node.active = true;

        const targetPos = slot.node.worldPosition.clone();
        targetPos.y = this.node.y;
        const localTarget = new Vec3();
        this.node.parent!.inverseTransformPoint(localTarget, targetPos);
        tween(this.node)
            .to(0.2, {
                position: localTarget,
                eulerAngles: new Vec3(-90, 90, 90),
            }, { easing: "quadOut" })
            .call(() => {
                this.syncWoolsView()
                this.isFlying = false
                this.slot = slot
                slot.setSpool(this)
                const itemsInMatchZone = ServiceLocator.get(MatchZone).itemsInMatchZone
                for (const raySlot of itemsInMatchZone) {
                    // if (!raySlot.wool || !raySlot.wool.color) continue;
                    if (raySlot.wool.color.equals(this.color) && !this.isFull()) {
                        this.queue.push(raySlot)
                        itemsInMatchZone.delete(raySlot)
                    }
                }
                // this.queue.sort((a, b) => a.index - b.index)
                this.collects()

            })
            .start();
    }
    @property(RaySlot)
    public queue: RaySlot[] = [];

    public async collects() {
        if (this.isCollecting) return; // tránh chạy 2 loop
        this.isCollecting = true;

        while (this.queue.length > 0) {
            this.queue.sort((a, b) => a.index - b.index);
            const item = this.queue.shift();

            if (!item || !item.wool) continue;
            // await this.collectOne(item);
            this.rope.getComponent(CustomLineMesh).lineWidth = 0.2
            item.isCollecting = true
            this.rope.endPoint.setWorldPosition(item.wool.endPoint.worldPosition);
            this.count++
            this.syncWoolsView()
            // await this.collectOne(item)
            await this.delay(0.2) /// replace by tween anim
            if (item.wool) {
                item.wool.node.active = false;
                item.wool = null;

            }

            item.isCollecting = false
        }
        this.rope.getComponent(CustomLineMesh).lineWidth = 0


        this.isCollecting = false;
    }

    delay(time: number) { return new Promise(resolve => { this.scheduleOnce(resolve, time); }); }

    public collectOne(item: RaySlot): Promise<void> {
        return new Promise(resolve => {
            if (!item.wool) {
                resolve();
                return;
            }

            const start = this.rope.endPoint.worldPosition.clone();
            const end = item.wool.startPoint.worldPosition.clone();
            let t = { value: 0 };
            const lineMesh = this.rope.getComponent(CustomLineMesh);
            lineMesh.lineWidth = 0.2;

            tween(t)
                .to(0.2, { value: 1 }, {
                    easing: "quadOut",
                    onUpdate: () => {
                        Vec3.lerp(this.tempVec3, start, end, t.value);
                        this.rope.endPoint.setWorldPosition(this.tempVec3);
                    },
                    onComplete: () => {
                        lineMesh.lineWidth = 0;
                        this.syncWoolsView();
                        if (item.wool) {
                            item.wool.node.active = false;
                            item.wool = null;
                        }
                        this.rope.getComponent(CustomLineMesh).lineWidth = 0
                        // this.count = Math.min(this.capacity, this.count + 1);
                        resolve();
                    }
                })
                .start();
        });
    }


    public syncWoolsView() {
        if (!this.node || !this.woolsView.length || this.capacity <= 0) return;

        const capacityPerItem = this.capacity / this.woolsView.length;
        if (capacityPerItem <= 0) return; // Tránh division by zero

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

        if (this.slot) {
            this.slot.setProcess(Math.round(this.count / this.capacity * 100));
        }
        if (this.isFull()) {
            this.collectedDone()
        }
    }

    public open() {
        if (this.isInSlot) return;
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

    public insertSorted(raySlot: RaySlot) {
        const index = this.queue.findIndex(q => q.index > raySlot.index);
        if (index === -1) {
            this.queue.push(raySlot);
        } else {
            this.queue.splice(index, 0, raySlot);
        }
    }

    private isBlocked(): boolean {
        const level = ServiceLocator.get(GameManager).currentLevelData;
        const maxRow = level.rows - 1;
        const maxCol = level.columns - 1;
        const right = this.spoolManager.getSpool(this.row, this.col + 1);
        const left = this.spoolManager.getSpool(this.row, this.col - 1);
        const down = this.spoolManager.getSpool(this.row - 1, this.col);
        const top = this.spoolManager.getSpool(this.row + 1, this.col);
        const blockRight = this.col === maxCol || (right && !right.isInSlot);
        const blockLeft = this.col === 0 || (left && !left.isInSlot);
        const blockDown = this.row === 0 || (down && !down.isInSlot);
        const blockTop = this.row === maxRow ? false : (top && !top.isInSlot);
        return blockRight && blockLeft && blockDown && blockTop;
    }
}