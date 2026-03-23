import { _decorator, Component, Node } from 'cc';
import { Spool } from './Spool';
const { ccclass, property } = _decorator;

@ccclass('Slot')
export class Slot extends Component {
    public spool?: Spool
    

}


