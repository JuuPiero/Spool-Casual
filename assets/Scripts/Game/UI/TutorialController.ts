import { _decorator, Camera, Component, Node, Sprite, tween, UITransform, Vec3 } from 'cc';
import { ServiceLocator } from '../../ServiceLocator';
import { SpoolManager } from '../SpoolManager';
import { EventBus } from '../../EventBus';
import { GameEvent } from '../../GameEvent';
const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {

    protected onLoad(): void {
        ServiceLocator.register(TutorialController, this)
    }
    protected onEnable(): void {
        EventBus.on(GameEvent.TOGGLE_VIDEO, this.toggleVideo)
    }
    protected onDisable(): void {
        EventBus.off(GameEvent.TOGGLE_VIDEO, this.toggleVideo)
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

    toggleVideo = () => {
        const sprite = this.getComponent(Sprite)
        if(sprite) sprite.enabled = !sprite.enabled
    }
}


