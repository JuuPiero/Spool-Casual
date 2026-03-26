import { _decorator, BoxCollider, Color, Component, ITriggerEvent, log, Node, Vec3 } from 'cc';
import { Spline } from '../Spline';
import { SplineInstantiate } from '../SplineInstantiate';
import { Wool } from './Wool';
import { ServiceLocator } from '../ServiceLocator';
import { WoolManager } from './WoolManager';
import { SplineAnimate } from '../SplineAnimate';
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

    protected onLoad(): void {
        this.rayTrigger?.on('onTriggerStay', this.onTriggerEnter, this);
    }


    protected start(): void {
        this.woolManager = ServiceLocator.get(WoolManager)

    }

    protected onDestroy(): void {
        // this.collider.off('onTriggerEnter', this.onTriggerEnter, this);
        this.rayTrigger?.off('onTriggerStay', this.onTriggerEnter, this);
    }


    onTriggerEnter(event: ITriggerEvent) {
        const wool = event.otherCollider.getComponent(Wool)
        // if (!wool || !wool.isCollected) return
        // if (!this.splineInstantiate.items.length) return

        // // Lấy item cuối cùng từ SubRay
        // const itemToMove: SplineAnimate = this.splineInstantiate.items[0]
        // const indexToMove = this.splineInstantiate.items?.indexOf(itemToMove)
        // // Chuyển item sang WoolManager
        // itemToMove.node.setParent(this.woolManager.splineInstantiate.parentNode)

        // // Cập nhật danh sách trong WoolManager
        // const woolManagerItems = this.woolManager.splineInstantiate.getAllItems();
        // const oldIndex = woolManagerItems.indexOf(wool.getComponent(SplineAnimate))

        // woolManagerItems[oldIndex] = itemToMove

        // // Cập nhật lại danh sách items của WoolManager (nếu cần)
        // // Nếu SplineInstantiate có mảng items riêng, cần cập nhật nó

        // // Xóa item khỏi SubRay
        // this.splineInstantiate.items.splice(indexToMove, 1)

        // // Cập nhật lại formation trong WoolManager
        // if (this.woolManager.maintainFormation) {
        //     this.woolManager['calculateRelativeDistances'](); // Gọi private method, cần public hóa hoặc tạo method public
        // }

        // return
    }

    public setColorsForItems(spoolColors: Color[], startIndex: number, count: number): number {
        if (!this.splineInstantiate || !this.splineInstantiate.items) return startIndex;
        
        let colorIndex = 0;
        let currentCount = 0;
        let currentStartIndex = startIndex;
        
        for (let i = 0; i < this.splineInstantiate.items.length; i++) {
            if (currentCount >= count) break;
            
            // Tìm spool phù hợp dựa vào currentStartIndex
            while (colorIndex < spoolColors.length && currentStartIndex >= spoolColors.length) {
                currentStartIndex -= spoolColors.length;
                colorIndex++;
            }
            
            if (colorIndex < spoolColors.length) {
                const wool = this.splineInstantiate.items[i].getComponent(Wool);
                if (wool) {
                    wool.setColor(spoolColors[colorIndex]);
                }
                currentStartIndex++;
                currentCount++;
            }
        }
        
        return startIndex + count;
    }
}
