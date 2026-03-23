import { _decorator, CCBoolean, Color, Component, MeshRenderer, Node, tween, Vec3 } from 'cc';
import { Clickable } from '../Clickable';
// import { SpoolData } from './LevelData';
import { getRandomColor } from '../ultils';
import { ServiceLocator } from '../ServiceLocator';
import { SlotManager } from './SlotManager';
const { ccclass, property } = _decorator;

@ccclass('Spool')
export class Spool extends Clickable {

    // public data: SpoolData;



    public currentCapacity: number;

    @property(CCBoolean)
    public isFlying: boolean = false;


    @property(Color)
    public color: Color


    @property({ type: MeshRenderer })
    public renderers: MeshRenderer[] = []

    private isInSlot: boolean = false;

    protected start(): void {
        this.color = getRandomColor()

        this.renderers.forEach(renderer => {
            const mat = renderer.getMaterialInstance(0);
            mat.setProperty("baseColor", this.color);
        })
    }

    public onClick() {
        console.log("Clicked")
        if (this.isFlying || this.isInSlot) return;

        const slotManager = ServiceLocator.get(SlotManager)

        const slot = slotManager.getAvailableSlot()

        if (!slot) {
            console.log('hết')
            return;
        }
        this.isFlying = true;
        slot.setSpool(this);
        this.isInSlot = true

        // lấy world position của slot
        const targetPos = slot.node.worldPosition.clone();
        targetPos.y = this.node.y
        // convert về local space của parent spool
        const parent = this.node.parent!;
        const localTarget = new Vec3();
        parent.inverseTransformPoint(localTarget, targetPos);
        tween(this.node)
            .to(0.3, {
                position: localTarget,
            }, {
                easing: "quadOut"
            })
            .call(() => {
                this.isFlying = false;

                // gán vào slot (logic game)
            })
            .start();

    }
}


