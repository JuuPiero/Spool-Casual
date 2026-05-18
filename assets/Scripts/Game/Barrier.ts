import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Barrier')
export class Barrier extends Component {
    @property(Node) public openVisual: Node = null

    public isOpened = false;

    public open() {
        if (this.isOpened) return;
        this.isOpened = true;

        if (!this.openVisual) return;
        tween(this.openVisual)
            .stop()
            .to(0.3, { eulerAngles: new Vec3(-60, 0, 0) }, { easing: 'backOut' })
            .start();
    }

    public close() {
        this.isOpened = false;

        if (!this.openVisual) return;
        tween(this.openVisual)
            .stop()
            .to(0.3, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'quadOut' })
            .start();
    }
}


