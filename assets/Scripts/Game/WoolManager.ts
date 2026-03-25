import { _decorator, CCFloat, CCInteger, Color, Component, instantiate, Node, tween, Vec3 } from 'cc';
import { Wool } from './Wool';
import { Spline } from '../Spline';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { SplineInstantiate } from '../SplineInstantiate';
import { SplineAnimate } from '../SplineAnimate';
const { ccclass, property } = _decorator;

@ccclass('WoolManager')
export class WoolManager extends Component {

    // @property(CCInteger)
    // public maxColumns: number = 5;

    // @property(CCFloat)
    // public speed: number = 200;

    // @property(CCFloat)
    // public spacing: number = 5;

    // public wools: Wool[] = [];

    // public spline: Spline


    // public woolByColor: Color[] = []

    // public getStartPos(): Vec3 {
    //     return this.spline.points[0].position.clone()
    // }

    // protected onLoad(): void {
    //     ServiceLocator.register(WoolManager, this)
    //     this.spline = this.getComponent(Spline)
    // }


    // protected start(): void {

    //     const samples = this.spline.getSamples(300);
    //     this.spline.buildLengthTable(samples);

    //     const items = this.node.getComponent(SplineInstantiate).items


    //     for (let i = 0; i < items.length; i++) {
    //         const wool = items[i].getComponent(SplineAnimate)
    //         if(wool) {
    //             wool.init(this.spline, samples, 0)
    //             // console.log('here');
    //             // wool.init(samples, i * this.spacing, this.speed, this.spline);
    //             // wool.setColor(spools[i].color);
    //             // wool.init(samples, i * this.spacing, this.speed, this.spline);
    //             // this.wools.push(wool);
    //         }
    //     }
    // }

    // public remove(wool: Wool) {
    //     const index = this.wools.indexOf(wool)
    //     this.wools.splice(index, 1)
    // }

    @property({ type: SplineInstantiate, tooltip: "Reference đến SplineInstantiate" })
    public splineInstantiate: SplineInstantiate = null!;

    @property({ tooltip: "Tốc độ di chuyển của đoàn tàu (đơn vị: khoảng cách/giây)" })
    public speed: number = 5;

    @property({ tooltip: "Tự động di chuyển khi start" })
    public autoMove: boolean = true;

    @property({ tooltip: "Giữ khoảng cách tương đối như lúc spawn" })
    public maintainFormation: boolean = true;

    private isMoving: boolean = false;
    private distances: number[] = []; // Lưu khoảng cách tương đối giữa các item

    protected start(): void {
        if (!this.splineInstantiate) {
            this.splineInstantiate = this.node.getComponent(SplineInstantiate);
        }

        if (this.splineInstantiate && this.splineInstantiate.items.length > 0) {
            this.calculateRelativeDistances();

            if (this.autoMove) {
                this.startMoving();
            }
        }
    }

    protected update(dt: number): void {
        if (!this.isMoving) return;
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems();
        if (items.length === 0) return;

        if (this.maintainFormation) {
            // Chế độ đoàn tàu: chỉ di chuyển item đầu, các item khác follow theo offset
            const leadItem = items[0];
            if (leadItem && leadItem.isValid) {
                const currentDist = leadItem.getDistance();
                let newDist = currentDist + this.speed * dt;

                const totalLength = leadItem.getTotalLength();
                if (newDist >= totalLength) {
                    newDist -= totalLength;
                }

                leadItem.setDistance(newDist);

                // Cập nhật các item khác dựa vào offset đã lưu
                for (let i = 1; i < items.length; i++) {
                    const item = items[i];
                    if (item && item.isValid) {
                        let targetDistance = leadItem.getDistance() - this.distances[i];
                        if (targetDistance < 0) {
                            targetDistance += totalLength;
                        }
                        item.setDistance(targetDistance);
                    }
                }
            }
        } else {
            // Chế độ bình thường: mỗi item di chuyển độc lập
            for (const item of items) {
                if (item && item.isValid && item.isMovingNow()) {
                    const currentDist = item.getDistance();
                    let newDist = currentDist + this.speed * dt;

                    const totalLength = item.getTotalLength();
                    if (newDist >= totalLength) {
                        newDist -= totalLength;
                    }

                    item.setDistance(newDist);
                }
            }
        }
    }

    /**
     * Tính toán khoảng cách tương đối giữa các item
     */
    private calculateRelativeDistances(): void {
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems();
        if (items.length === 0) return;

        this.distances = [];
        const leadDistance = items[0].getDistance();

        for (let i = 0; i < items.length; i++) {
            let relativeDistance = items[i].getDistance() - leadDistance;
            if (relativeDistance < 0) {
                relativeDistance += items[i].getTotalLength();
            }
            this.distances.push(relativeDistance);
        }
    }

    /**
     * Bắt đầu di chuyển
     */
    public startMoving(): void {
        if (!this.splineInstantiate) return;

        this.isMoving = true;
        const items = this.splineInstantiate.getAllItems();

        if (this.maintainFormation) {
            // Chỉ start item đầu
            if (items.length > 0 && items[0]) {
                items[0].startMoving();
            }
        } else {
            // Start tất cả items
            for (const item of items) {
                if (item && item.isValid) {
                    item.startMoving();
                }
            }
        }
    }

    /**
     * Dừng di chuyển
     */
    public stopMoving(): void {
        if (!this.splineInstantiate) return;

        this.isMoving = false;
        const items = this.splineInstantiate.getAllItems();

        for (const item of items) {
            if (item && item.isValid) {
                item.stopMoving();
            }
        }
    }

    /**
     * Reset tất cả về vị trí ban đầu
     */
    public reset(): void {
        if (!this.splineInstantiate) return;

        const items = this.splineInstantiate.getAllItems();
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item && item.isValid) {
                const originalDistance = this.splineInstantiate.useUniformSpacing
                    ? (i / this.splineInstantiate.count + this.splineInstantiate.startOffset) % 1 * item.getTotalLength()
                    : 0; // Có thể lưu lại startDistance từ lúc instantiate
                item.setDistance(originalDistance);
            }
        }

        this.calculateRelativeDistances();
    }

    /**
     * Set tốc độ di chuyển
     */
    public setSpeed(speed: number): void {
        this.speed = speed;
    }

    /**
     * Lấy tốc độ hiện tại
     */
    public getSpeed(): number {
        return this.speed;
    }

    /**
     * Bật/tắt chế độ giữ formation
     */
    public setMaintainFormation(enable: boolean): void {
        this.maintainFormation = enable;

        if (enable) {
            this.calculateRelativeDistances();
        }
    }

    /**
     * Kiểm tra có đang di chuyển không
     */
    public isMovingNow(): boolean {
        return this.isMoving;
    }
}