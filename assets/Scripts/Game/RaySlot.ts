import { _decorator, Component } from 'cc';
import { SplineAnimate } from '../SplineAnimate';
import { Wool } from './Wool';
const { ccclass, property } = _decorator;

@ccclass('RaySlot')
export class RaySlot extends Component {

    @property(Wool)
    public wool: Wool

    @property(SplineAnimate)
    public splineItem: SplineAnimate

    public isCollecting = false
    public canCollect = false;

    @property
    public index: number

    protected onLoad(): void {
        this.splineItem = this.getComponent(SplineAnimate)
    }
}