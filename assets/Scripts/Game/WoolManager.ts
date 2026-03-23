import { _decorator, CCInteger, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('WoolManager')
export class WoolManager extends Component {
    @property(CCInteger)
    public maxColumns: number
}


