import { _decorator, Component, Node } from 'cc';
import { Wool } from './Wool';
const { ccclass, property } = _decorator;

@ccclass('RaySlot')
export class RaySlot extends Component {
    @property(Wool)
    public wool: Wool
    public isCollecting = false
    public index: number = 0;

    public isAvaialble() {
        return this.wool == null
    }
}


