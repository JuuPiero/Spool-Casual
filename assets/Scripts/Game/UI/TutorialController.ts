import { _decorator, Camera, Component, Node, tween, UITransform, Vec3 } from 'cc';
import { ServiceLocator } from '../../ServiceLocator';
import { SpoolManager } from '../SpoolManager';
const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {

    protected onLoad(): void {
        ServiceLocator.register(TutorialController, this)
    }
    protected start(): void {
        this.startRotateLoop()
    }
    startRotateLoop() {
        tween(this.node)
            .repeatForever(
                tween()
                    .to(0.2, { eulerAngles: new Vec3(0, 0, -15) })
                    .to(0.2, { eulerAngles: new Vec3(0, 0, 15) })
            )
            .start();
    }
}


