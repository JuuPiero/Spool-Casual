import { _decorator, Button, Component, Node, tween, Vec3 } from 'cc';
import { ServiceLocator } from '../../ServiceLocator';
import { GameManager } from '../GameManager';
import super_html_playable from '../../super_html_playable';
const { ccclass, property } = _decorator;
@ccclass('CTA')
export class CTA extends Component {
    @property({ type: Button })
    public installBtn: Button = null;

    @property({ type: Node })
    public logo: Node = null;

    protected start(): void {
        // tween(this.logo)
        //     .to(0.5, { scale: new Vec3(0.4, 0.4, 1.1) })
        //     .to(0.5, { scale: new Vec3(0.3, 0.3, 1) }) 
        //     .union()
        //     .repeatForever()
        //     .start();

        tween(this.installBtn.node)
            .to(0.5, { scale: new Vec3(0.55, 0.55, 1) })
            .to(0.5, { scale: new Vec3(0.5, 0.5, 1) })
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
        // ServiceLocator.get(GameManager).installGame()
        super_html_playable.download()
    }

}


