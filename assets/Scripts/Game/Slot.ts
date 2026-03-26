import { _decorator, Component, Node } from 'cc';
import { Spool } from './Spool';
const { ccclass, property } = _decorator;

@ccclass('Slot')
export class Slot extends Component {

    @property(Spool)
    public spool?: Spool = null


    public isAvailable(): boolean {

        return !this.spool
    }

    public setSpool(spool: Spool) {
        this.spool = spool
    }


}


