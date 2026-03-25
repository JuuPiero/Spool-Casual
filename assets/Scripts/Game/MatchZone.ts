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
const { ccclass, property } = _decorator;

@ccclass('MatchZone')
export class MatchZone extends Component {

    private slotManager: SlotManager;
    private woolManager: WoolManager

    protected start() {
        this.slotManager = ServiceLocator.get(SlotManager);
        this.woolManager = ServiceLocator.get(WoolManager);
    }


    protected onLoad(): void {
        let collider = this.getComponent(BoxCollider);
        if (collider) {
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    onTriggerEnter(event: ITriggerEvent) {
        const slots = this.slotManager.slots
        const wool = event.otherCollider.getComponent(Wool)
        if (!wool) return
        // console.log(wool.node.name);
        for (const slot of slots) {
            if (slot.spool) {
                if (slot.spool.color.equals(wool.color)) {
                    this.playCollectAnimation(wool, slot.spool);
                    slot.spool = null;
                    return;
                }
                // if (slot.spool.color.equals(wool.color)) {
                //     // sửa thành tween với animation kéo len xuống cuộn len

                //     /* wool có khoảng 7 mesh con là các sợi len: wool.woolItems
                //         spool có khoảng 5 mesh con là các sợi quấn xung quanh : slot.spool.woolsView
                //         dùng Line vẽ 1 đường cong với 2 điểm (dùng bezier để suy ra các điểm khác rồi vẽ đường cong)
                //         điểm dầu là từ 1 item của  wool.woolItems, điểm 2 là 1 item của slot.spool.woolsView
                //         các item của slot.spool.woolsView cũng sẽ active từng cái (mặc định các item này inactive) và scale dần từ 0 -> 1
                //     */
                //     // vẽ đường chỉ test


                //     const from = wool.node.worldPosition;
                //     const to = slot.spool.node.worldPosition;

                //     slot.spool.woolsView.forEach(item => {
                //         // thêm tween để active từng cái và scale dần từng cái
                //         item.active = true

                //     })

                //     const mid = from.clone().add(to).multiplyScalar(0.5);
                //     mid.x += 2.5; // chỉnh độ cong ở đây

                //     const curvePoints = this.GetBezierPoints(from, mid, to, 20);

                //     Gizmos.instance.DrawPath(curvePoints, wool.color);
                //     this.woolManager.remove(wool)
                //     wool.node.active = false
                //     wool.node.setParent(null)
                //     wool.node.destroy()

                //     slot.spool.node.active = false
                //     slot.spool = null
                //     // Delay rồi mới xóa line
                //     // Gizmos.instance.DrawPath([]);

                //     console.log('matched')

                //     if (this.woolManager.wools.length == 0) {
                //         console.log('win');
                //         EventBus.emit(GameEvent.LEVEL_COMPLETED)

                //         ServiceLocator.get(NavigationContainer).stack.navigate('EndgameScreen')
                //     }
                //     return
                // }
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



    private playCollectAnimation(wool: Wool, spool: Spool) {
       

        // const fullPoints = this.GetBezierPoints(from, mid, to, 30);

        let t = { value: 0 };

        // reset spool view
        spool.woolsView.forEach(item => {
            item.active = false;
            item.setScale(Vec3.ZERO);
        });

        tween(t)
            .to(0.6, { value: 1 }, {
                
                onUpdate: () => {
                    // const from = wool.node.worldPosition.clone();
                    const to = spool.node.worldPosition.clone();
                    const currentFrom = wool.node.worldPosition.clone();

                    // rebuild curve từ vị trí hiện tại
                    const mid = currentFrom.clone().add(to).multiplyScalar(0.5);
                    mid.x += 1.5;

                    const dynamicPoints = this.GetBezierPoints(currentFrom, mid, to, 30);

                    const maxIndex = Math.floor(t.value * (dynamicPoints.length - 1));
                    const currentPoints = dynamicPoints.slice(0, maxIndex + 1);

                    Gizmos.instance.DrawPath(currentPoints, wool.color);

                    // const pos = dynamicPoints[maxIndex];
                    // wool.node.setWorldPosition(pos);

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
                }
            })
            .call(() => {
                Gizmos.instance.DrawPath([]);
                this.woolManager.remove(wool);
                wool.node.destroy();
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