import { _decorator, CCBoolean, Color, Component, MeshRenderer, Node, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
// import { SpoolData } from './LevelData';
import { getRandomColor } from '../ultils';
import { ServiceLocator } from '../ServiceLocator';
import { SlotManager } from './SlotManager';
import { SpoolManager } from './SpoolManager';
import { SpoolData } from './LevelData';
const { ccclass, property } = _decorator;




@ccclass('Spool')
export class Spool extends Clickable {

    public data: SpoolData;

    public static maxCapacity: number = 20;

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

    protected start(): void {
        // this.color = getRandomColor()

        this.renderers.forEach(renderer => {
            const mat = renderer.getMaterialInstance(0);
            mat.setProperty("baseColor", this.color);
        })
    }

    public onClick() {
        if (this.isFlying || this.isInSlot) return;

        if (this.isBlocked()) {
            console.log("bị che");
            return;
        }

        console.log("Clicked")

        const slotManager = ServiceLocator.get(SlotManager)
        const spoolManager = ServiceLocator.get(SpoolManager)

        const slot = slotManager.getAvailableSlot()

        if (!slot) {
            console.log('hết')
            return;
        }

        this.isFlying = true;
        slot.setSpool(this);
        this.isInSlot = true

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

                const index = spoolManager.spools.indexOf(this)
                spoolManager.spools.splice(index, 1)
            })
            .start();
    }


    private isBlocked(): boolean {
        const spoolManager = ServiceLocator.get(SpoolManager)

        for (const s of spoolManager.spools) {
            if (s === this) continue;

            // cùng cột và nằm trên mình
            if (s.col === this.col && s.row > this.row) {
                return true;
            }
        }

        return false;
    }
}


