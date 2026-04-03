import { _decorator, CCBoolean, CCInteger, Color, Component, instantiate, MeshRenderer, Node, Tween, tween, Vec3 } from 'cc';
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
import { MatchZone } from './MatchZone';
import { SOUNDS } from './Sounds';
import { WoolManager } from './WoolManager';
const { ccclass, property } = _decorator;


@ccclass('Spool')
export class Spool extends Clickable {

    // public data: SpoolData;

    @property(CCInteger)
    public capacity: number = 0;

    @property(CCInteger)
    public count: number = 0;

    // public currentCapacity: number;

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

    public isOpen: boolean = false;

    protected start(): void {
        this.spoolManager = ServiceLocator.get(SpoolManager);
        this.rope = this.getComponentInChildren(RopeBezierWave3D)!;
        this.rope?.setColor(this.color);

        this.baseRotation = new Vec3(-90, 90, 90)

        const mat = this.rope.getComponent(MeshRenderer).getMaterialInstance(0)
        mat.setProperty('fill', 0)

        this.isOpen = !this.isBlocked();
        if (this.isOpen) {
            this.open();
        } else {
            this.close();
        }
    }

    public isFull() {
        return this.count === this.capacity;
    }


    private tempVec3: Vec3 = new Vec3()
    private wiggleTween: Tween<Node> | null = null;
    private baseRotation: Vec3 = new Vec3();

    startWiggle() {
        this.wiggleTween?.stop();

        const left = this.baseRotation.clone().add3f(0, -10, 0);
        const right = this.baseRotation.clone().add3f(0, 10, 0);

        this.wiggleTween = tween(this.node)
            .repeatForever(
                tween()
                    .to(0.2, { eulerAngles: left })
                    .to(0.2, { eulerAngles: right })
            )
            .start();
    }

    stopWiggle() {
        this.wiggleTween?.stop();
        this.wiggleTween = null;

        tween(this.node)
            .to(0.1, { eulerAngles: new Vec3(-90, 90, 90) }) // reset về base
            .start();
    }

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


    static delay = false

    public onClick() {
        if (Spool.delay) return
        if (this.isFlying || this.isInSlot) return;
        if (!this.isOpen) {
            SoundManager.instance.playOneShot(SOUNDS.FAILED);
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
        Spool.delay = true

        this.activateNextSpools();
        SoundManager.instance.playOneShot(SOUNDS.CLICK);
        this.moveToSlot(slot);
    }

    private activateNextSpools() {
        const right = this.spoolManager.getSpool(this.row, this.col + 1);
        if (right && !right.isOpen) {
            right.isOpen = true;
            right.open();
        }
        const left = this.spoolManager.getSpool(this.row, this.col - 1);
        if (left && !left.isOpen) {
            left.isOpen = true;
            left.open();
        }
        const down = this.spoolManager.getSpool(this.row - 1, this.col);
        if (down && !down.isOpen) {
            down.isOpen = true;
            down.open();
        }
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
                    if (raySlot.wool.color.equals(this.color) && !this.isFull()) {
                        this.queue.push(raySlot)
                        itemsInMatchZone.delete(raySlot)
                    }
                }
                this.collects()
                Spool.delay = false
                
                console.log('move done, check lose');
                this.checkLose()
            })
            .start();
    }

    public checkLose() {
        const slotManager = ServiceLocator.get(SlotManager);
        const woolManager = ServiceLocator.get(WoolManager);
        
        // Kiểm tra nếu còn slot trống
        const availableSlot = slotManager.getAvailableSlot();
        if (availableSlot) {
            return; // Còn slot trống, chưa thua
        }
        
        // Nếu không còn slot trống, kiểm tra xem có RaySlot nào trùng màu với spool trong slot
        for (const raySlot of woolManager.slots) {
            if (!raySlot.wool) continue;
            for (const slot of slotManager.slots) {
                if (slot.spool && raySlot.wool.color.equals(slot.spool.color)) {
                    return; // Có RaySlot trùng màu, chưa thua
                }
            }
        }
        
        // Không có RaySlot trùng màu, thua
        console.log('Lose');
        // Thêm logic thua : gọi game over
    }


    @property(RaySlot)
    public queue: RaySlot[] = [];

    public async collects() {
        if (this.isCollecting) return;
        this.isCollecting = true;
        this.rope.node.active = true;
        const mat = this.rope.getComponent(MeshRenderer).getMaterialInstance(0);
        mat.setProperty('fill', 1);
        this.startWiggle();

        while (this.queue.length > 0) {
            this.queue.sort((a, b) => b.index - a.index);

            const item = this.queue.shift();
            if (!item || !item.wool) continue;
            this.count++;
            this.syncWoolsView();

            item.isCollecting = true;

           
            // animation wool
            tween(item.wool.node)
                .to(0.2, { eulerAngles: new Vec3(0, 50, 0) })
                .start();

            tween(item.wool.node)
                .to(0.2, { scale: Vec3.ZERO })
                .start();

            // rope anim
            const start = item.wool.startPoint.worldPosition.clone();
            const end = item.wool.endPoint.worldPosition.clone();

            let t = { value: 0 };

            tween(t)
                .to(0.25, { value: 1 }, {
                    easing: "quadOut",
                    onUpdate: () => {
                        Vec3.lerp(this.tempVec3, start, end, t.value);
                        this.rope.endPoint.setWorldPosition(this.tempVec3);
                    }
                })
                .start();

            await this.delay(0.1);
           

            if (item.wool) {
                item.wool.node.active = false;
                item.wool = null;
            }

            item.isCollecting = false;
        }

        this.stopWiggle();

        mat.setProperty('fill', 0);

        this.isCollecting = false;
    }



    delay(time: number) { return new Promise(resolve => { this.scheduleOnce(resolve, time); }); }


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

            mat.setProperty("color", this.color);

            if (active) {
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
        const newLevelData = ServiceLocator.get(GameManager).newLevelData;
        const maxRow = newLevelData.gridHeight - 1;
        return this.row !== maxRow;
    }
}