import { _decorator, Button, Component, Label, Node, tween, Vec3 } from 'cc';
import { ServiceLocator } from '../../ServiceLocator';
import { ScreenBase } from '../../Navigation/ScreenBase';
import { GameManager } from '../GameManager';
const { ccclass, property } = _decorator;

@ccclass('EndGameScreen')
export class EndGameScreen extends ScreenBase {
    @property({type: Button})
    public installBtn: Button = null;

    @property({type: Label})
    public title: Label = null;

    protected start(): void {
        // tween(this.title.node)
        //     .to(0.5, { scale: new Vec3(1.1, 1.1, 1.1) })
        //     .to(0.5, { scale: new Vec3(1, 1, 1) }) 
        //     .union()
        //     .repeatForever()
        //     .start();
        tween(this.installBtn.node)
            .to(0.5, { scale: new Vec3(1.1, 1.1, 1.1) }) 
            .to(0.5, { scale: new Vec3(1, 1, 1) }) 
            .union()
            .repeatForever()
            .start();
    }

    protected onLoad(): void {
        this.installBtn?.node.on(Button.EventType.CLICK, this.install, this);
    }
    protected onDestroy(): void {
        this.installBtn?.node.off(Button.EventType.CLICK, this.install, this);
    }

    install() { 
        ServiceLocator.get(GameManager).installGame()
    }
    
}


