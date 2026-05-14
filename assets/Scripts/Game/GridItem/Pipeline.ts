import { _decorator, Component, Label, MeshRenderer, Node } from 'cc';
import { Spool } from '../Spool';
import { PipelineData } from '../LevelDataSA';
import { SpoolManager } from '../SpoolManager';
import { PlayableColorConfig } from '../../Data/ColorConfig';
import { ServiceLocator } from '../../ServiceLocator';
const { ccclass, property } = _decorator;

@ccclass('Pipeline')
export class Pipeline extends Component {
    public colorIds: number[] = [];
    @property(Spool) public currentSpool: Spool = null;

    @property(Node) public visual: Node = null;

    @property(Node) public popPos: Node = null;


    @property(Label) public label: Label = null;


    colorConfig: PlayableColorConfig = null

    public init(pipelineData: PipelineData, spoolManager: SpoolManager) {

        const angle = this.normalizeAngle(pipelineData.rotate);

        const dir = this.angleToDir(angle);

        this.currentSpool = spoolManager.getSpool(
            pipelineData.y + dir.y,
            pipelineData.x + dir.x
        );

        this.setColor(pipelineData.ids[0]);
        const rotate = pipelineData.rotate;
        const angleIndex = ((Math.round(rotate / 90) % 4) + 4) % 4;
        // rotate visual
        this.visual.setRotationFromEuler(0, pipelineData.rotate, 0);

    }

    protected start(): void {
        
    }


    public setColor(colorId: number) {
        const colorConfig = ServiceLocator.get(PlayableColorConfig)
        
        const mat = this.visual.getComponentInChildren(MeshRenderer).getMaterialInstance(1);

        mat.setProperty("color", colorConfig.getMainColor(colorId));
    }

    public Pop() {
        const colorId = this.colorIds.pop()

        // const postion = 

    }

    private normalizeAngle(angle: number): number {
        angle %= 360;

        if (angle < 0)
            angle += 360;

        return angle;
    }

    private angleToDir(angle: number) {

        // làm tròn về bội số 90 gần nhất
        angle = Math.round(angle / 90) * 90 % 360;

        switch (angle) {
            case 0:
                return { x: 0, y: 1 };   // up

            case 90:
                return { x: 1, y: 0 };   // right

            case 180:
                return { x: 0, y: -1 };  // down

            case 270:
                return { x: -1, y: 0 };  // left
        }

        return { x: 0, y: 0 };
    }

}


