import { _decorator, BoxCollider, Component, ITriggerEvent, Node, tween, Vec3 } from 'cc';
import { SlotManager } from './SlotManager';
import { ServiceLocator } from '../ServiceLocator';
import { Wool } from './Wool';
import { Gizmos } from '../Gizmos';
import { WoolManager } from './WoolManager';
import { NavigationContainer } from '../Navigation/NavigationContainer';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { Spool } from './Spool';
import { Slot } from './Slot';
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;
    private woolManager: WoolManager


    private collider: BoxCollider;

    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
        this.woolManager = ServiceLocator.get(WoolManager);
    }


    protected onLoad(): void {
        this.collider = this.getComponent(BoxCollider);
        if (this.collider) {
            this.collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }
    protected onDestroy(): void {
        this.collider.off('onTriggerEnter', this.onTriggerEnter, this);
    }

    onTriggerEnter(event: ITriggerEvent) {
        const slots = this.slotManager.slots
        const wool = event.otherCollider.getComponent(Wool)
        if (!wool) return
        for (const slot of slots) {
            if (slot.spool && !slot.spool.isCollecting) {
                if (slot.spool.color.equals(wool.color)) {
                    this.playCollectAnimation(wool, slot.spool, slot);
                    // slot.spool = null;
                    return;
                }
               
            }
        }
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



    private playCollectAnimation(wool: Wool, spool: Spool, slot: Slot) {
       
        let t = { value: 0 };
        spool.isCollecting = true;
        // reset spool view
        spool.woolsView.forEach(item => {
            item.active = false;
            item.setScale(Vec3.ZERO);
        });

        tween(t)
            .to(0.6, { value: 1 }, {
                
                onUpdate: () => {
                    const to = spool.node.worldPosition.clone();
                    const currentFrom = wool.node.worldPosition.clone();

                    
                    const mid = currentFrom.clone().add(to).multiplyScalar(0.5);
                    mid.x += 1.5;

                    const dynamicPoints = this.GetBezierPoints(currentFrom, mid, to, 30);

                    const maxIndex = Math.floor(t.value * (dynamicPoints.length - 1));
                    const currentPoints = dynamicPoints.slice(0, maxIndex + 1);

                    Gizmos.instance.DrawPath(currentPoints, wool.color);

                    
                    // active spool
                    const activeCount = Math.floor(t.value * spool.woolsView.length);

                    for (let i = 0; i < activeCount; i++) {
                        const item = spool.woolsView[i];
                        if (!item.active) {
                            item.active = true;
                            tween(item)
                                .to(0.2, { scale: Vec3.ONE })
                                .start();
                        }
                    }
                    const woolItemsLenght = Math.floor(t.value * wool.woolItems.length);
                    for (let i = 0; i < woolItemsLenght; i++) {
                        const item = wool.woolItems[i];
                        tween(item)
                            .to(0.2, { scale: Vec3.ZERO })
                            .start();
                    }
                }
            })
            .call(() => {
                Gizmos.instance.DrawPath([]);
                this.woolManager.remove(wool);
                wool.node.destroy();
                slot.spool = null;
                spool.node.destroy();
            })
            .call(() => {
                if (this.woolManager.wools.length == 0) {
                    EventBus.emit(GameEvent.LEVEL_COMPLETED)
                    ServiceLocator.get(NavigationContainer).stack.navigate('EndgameScreen');
                }
            })
            .start();
    }
}