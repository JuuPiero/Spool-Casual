import { _decorator, Camera, Component, Node, UITransform, Vec3 } from 'cc';
import { ServiceLocator } from '../../ServiceLocator';
import { SpoolManager } from '../SpoolManager';
const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {
    // @property(Node)
    // target3D: Node = null;

    @property(Node)
    public uiNode: Node = null;

    @property(Camera)
    camera: Camera = null;

    private tempPos: Vec3 = new Vec3();
    private screenPos: Vec3 = new Vec3();
    private uiPos: Vec3 = new Vec3();
    protected onLoad(): void {
        ServiceLocator.register(TutorialController, this)
    }

    protected start(): void {
        // const spools = ServiceLocator.get(SpoolManager).spools
        // this.setPos(spools[spools.length - 1])
           
    }
    public setPos(target3D: Node) {
        if (!target3D || !this.uiNode || !this.camera) return;

        // 1. lấy world position
        this.tempPos = target3D.position.clone();

        // 2. convert sang screen space
        this.camera.worldToScreen(this.tempPos, this.screenPos);

        // 3. convert sang UI space
        const uiTransform = this.uiNode.parent.getComponent(UITransform);
        uiTransform.convertToNodeSpaceAR(
            new Vec3(this.screenPos.x, this.screenPos.y, 0),
            this.uiPos
        );

        this.uiNode.setPosition(this.uiPos);
    }
}


