import { _decorator, BoxCollider, Color, Component, ITriggerEvent, log, Node, tween, Vec3 } from 'cc';
import { Spline } from '../Spline';
import { SplineInstantiate } from '../SplineInstantiate';
import { RaySlot } from './RaySlot';
const { ccclass, property } = _decorator;

@ccclass('SubRay')
export class SubRay extends Component {

    @property(Spline)
    public spline: Spline;
    @property(SplineInstantiate)
    public splineInstantiate: SplineInstantiate;
    @property(BoxCollider)
    public rayTrigger: BoxCollider

    @property({
        type: RaySlot
    })
    public raySlots: RaySlot[] = []

    protected onLoad(): void {
        this.rayTrigger?.on('onTriggerStay', this.onTriggerEnter, this);
    }


    protected start(): void {

        this.splineInstantiate.items.forEach(item => {
            this.raySlots.push(item.node.getComponent(RaySlot))
        })

    }

    protected onDestroy(): void {
        this.rayTrigger?.off('onTriggerStay', this.onTriggerEnter, this);
    }


    onTriggerEnter(event: ITriggerEvent) {
        const raySlotTarget = event.otherCollider.getComponent(RaySlot);
        if (!raySlotTarget) return;
        if (raySlotTarget.wool) return;
        if (!this.raySlots.length) return;

        for (let i = 0; i < this.raySlots.length; i++) {
            const slot = this.raySlots[i];

            if (slot.wool) {
                // lấy wool đầu tiên
                const wool = slot.wool;

                wool.node.setParent(raySlotTarget.node);
                raySlotTarget.wool = wool;

                // remove khỏi slot
                slot.wool = null;

                this.shiftWools(i);

                return;
            }
        }
    }
    private shiftWools(startIndex: number) {
        const moveDuration = 0.4;
        const delayStep = 0.1;

        for (let i = startIndex; i < this.raySlots.length - 1; i++) {
            const current = this.raySlots[i];
            const next = this.raySlots[i + 1];

            if (!next.wool) break;

            const wool = next.wool;
            next.wool = null;
            current.wool = wool;

            const worldPos = wool.node.worldPosition.clone();

            wool.node.setParent(current.node);

            const localPos = new Vec3();
            current.node.inverseTransformPoint(localPos, worldPos);

            wool.node.setPosition(localPos);

            tween(wool.node)
                .delay((i - startIndex) * delayStep)
                .to(moveDuration, {
                    position: Vec3.ZERO
                }, {
                    easing: "quadOut"
                })
                .start();
        }
    }
}
