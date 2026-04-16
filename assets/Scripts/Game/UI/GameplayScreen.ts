import { _decorator, Component, Node, tween, Vec3 } from 'cc';
import { ScreenBase } from '../../Navigation/ScreenBase';
const { ccclass, property } = _decorator;

@ccclass('GameplayScreen')
export class GameplayScreen extends ScreenBase {
    


    @property({type: Node})
    public headLine: Node = null;

    protected start(): void {

        
        tween(this.headLine)
            .to(0.5, { scale: new Vec3(1.1, 1.1, 1.1) })
            .to(0.5, { scale: new Vec3(1, 1, 1) }) 
            .union()
            .repeatForever()
            .start();
      
    }


    // protected onLoad(): void {
    //     this.installBtn?.node.on(Button.EventType.CLICK, this.install, this);
    //     this?.node.on(Button.EventType.CLICK, this.install, this);

    // }
    // protected onDestroy(): void {
    //     this.installBtn?.node.off(Button.EventType.CLICK, this.install, this);
    //     this?.node.off(Button.EventType.CLICK, this.install, this);
    // }

    // install() { 
    //     ServiceLocator.get(GameManager).installGame()
    // }
    
}

