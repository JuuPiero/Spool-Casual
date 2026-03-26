import { _decorator, BoxCollider, Color, Component, ITriggerEvent, log, Node, Vec3 } from 'cc';
import { Spline } from '../Spline';
import { SplineInstantiate } from '../SplineInstantiate';
import { Wool } from './Wool';
import { ServiceLocator } from '../ServiceLocator';
import { WoolManager } from './WoolManager';
import { SplineAnimate } from '../SplineAnimate';
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

    public woolManager: WoolManager

    @property({
        type: RaySlot
    })
    public raySlots : RaySlot[] = []

    protected onLoad(): void {
        this.rayTrigger?.on('onTriggerStay', this.onTriggerEnter, this);
    }


    protected start(): void {
        console.log('herre');
        
        this.woolManager = ServiceLocator.get(WoolManager)

        this.splineInstantiate.items.forEach(item => {
            this.raySlots.push(item.node.getComponent(RaySlot))
        })

    }

    protected onDestroy(): void {
        // this.collider.off('onTriggerEnter', this.onTriggerEnter, this);
        this.rayTrigger?.off('onTriggerStay', this.onTriggerEnter, this);
    }



    onTriggerEnter(event: ITriggerEvent) {
        const raySlotTarget = event.otherCollider.getComponent(RaySlot)
        if (!raySlotTarget) return
        if(raySlotTarget.wool) return
        if (!this.splineInstantiate.items.length) return
        for (let i = 0; i < this.raySlots.length; i++) {
            const element = this.raySlots[i];
            if(element.wool) {
                element.wool.node.setParent(raySlotTarget.node)
                raySlotTarget.wool = element.wool
                element.wool = null
                return
            }
            
        }
    }
}
