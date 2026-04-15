import { _decorator, CCBoolean, CCInteger, Color, Component, instantiate, MeshRenderer, Node, Tween, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { Slot } from './Slot';
import { RaySlot } from './RaySlot';
import { RopeBezierWave3D } from '../../Deps/iKame/scripts/rope/RopeBezierWave3D';
import { GameConfig } from './GameConfigSA';
import { SoundManager } from '../SoundManager';
import { MatchZone } from './MatchZone';

const { ccclass, property } = _decorator;


@ccclass('Spool')
export class Spool extends Clickable {

    // public data: SpoolData;

    public clickFunc: Function

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

    public isInSlot: boolean = false;

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
        this.clickFunc?.()

    }

    public activateNextSpools() {
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
        const down = this.spoolManager.getSpool(this.row + 1, this.col);
        if (down && !down.isOpen) {
            down.isOpen = true;
            down.open();
        }
    }

    public moveToSlot(slot: Slot, onDone?: Function) {
        this.isFlying = true;
        this.isInSlot = true;
        slot.setProcess(0);
        slot.labelProcess.node.active = true;

        const targetPos = slot.placePos.worldPosition.clone();
        // targetPos.y = this.node.y;
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
                // Lấy danh sách wool cần add trước khi xóa khỏi itemsInMatchZone
                const itemsToAdd: RaySlot[] = [];
                for (const raySlot of itemsInMatchZone) {
                    if (raySlot.wool && raySlot.wool.color.equals(this.color) && !this.isFull()) {
                        itemsToAdd.push(raySlot);
                    }
                }
                // Thêm vào queue và xóa khỏi set
                for (const raySlot of itemsToAdd) {
                    this.queue.push(raySlot);
                    itemsInMatchZone.delete(raySlot);
                }

                this.collects()
                Spool.delay = false
                onDone?.()
            })
            .start();
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

        while (this.queue.length > 0 && !this.isFull()) { // Thêm điều kiện !this.isFull()
            this.queue.sort((a, b) => b.index - a.index);

            const item = this.queue.shift();
            if (!item || !item.wool) continue;

            // Kiểm tra lại spool còn chỗ không
            if (this.isFull()) {
                // Nếu đã đầy, trả item lại queue và thoát
                this.queue.unshift(item);
                break;
            }

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

        // SỬA TẠI ĐÂY: Trả lại các item dư thừa cho MatchZone
    if (this.queue.length > 0) {
        const matchZone = ServiceLocator.get(MatchZone);
        while (this.queue.length > 0) {
            const item = this.queue.pop(); // Lấy từ queue ra
            if (item) {
                item.isCollecting = false; 
                // Thêm lại vào tập hợp chờ của MatchZone
                matchZone.itemsInMatchZone.add(item);
            }
        }
        // Sau khi trả lại, chúng ta kích hoạt một đợt kiểm tra mới trên MatchZone
        matchZone.checkExistingItems(); 
    }
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
        return this.row !== 0;
    }
}