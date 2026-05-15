import { _decorator, CCInteger, Color, Component, instantiate, Label, log, math, MeshRenderer, Node, Vec2, Vec3 } from 'cc';
import { Spool } from '../Spool';
import { PipelineData } from '../LevelDataSA';
import { SpoolManager } from '../SpoolManager';
import { PlayableColorConfig } from '../../Data/ColorConfig';
import { ServiceLocator } from '../../ServiceLocator';
import { IGridItem } from '../IGridItem';
import { GameConfig } from '../GameConfigSA';
import { EventBus } from '../../EventBus';
const { ccclass, property } = _decorator;

@ccclass('Pipeline')
export class Pipeline extends Component implements IGridItem {
    @property(Vec2) position: Vec2;

    @property(CCInteger) public colorIds: number[] = [];
    @property(Spool) public currentSpool: Spool = null;

    @property(Node) public visual: Node = null;

    @property(Node) public popPos: Node = null;


    @property(Label) public label: Label = null;


    colorConfig: PlayableColorConfig = null
    gameConfig: GameConfig = null;

    public pipelineData: PipelineData = null;

    private targetPosition: Vec3 = new Vec3();


    private spoolManager: SpoolManager = null;

    public getPositon() {
        return this.position;
    }

    protected start(): void {
        this.gameConfig = ServiceLocator.get(GameConfig);
        this.spoolManager = ServiceLocator.get(SpoolManager);
        EventBus.on('SPOOL_FINISHED', this.onSpoolFinished);

    }

    protected onDestroy(): void {
        // Unsubscribe event listener khi pipeline bị destroy
        EventBus.off('SPOOL_FINISHED', this.onSpoolFinished);
    }

    public init(pipelineData: PipelineData, spoolManager: SpoolManager) {
        this.pipelineData = pipelineData;
        this.position = new Vec2(pipelineData.x, pipelineData.y);

        this.colorIds = [...pipelineData.ids];

        // const angle = this.normalizeAngle(pipelineData.rotate);
        
        switch (pipelineData.rotate) {
            case 0:
            case 360: 
                this.currentSpool = spoolManager.getSpool(pipelineData.x, pipelineData.y + 1);
                break;
            case -90:
                this.currentSpool = spoolManager.getSpool(pipelineData.x + 1, pipelineData.y );
                break;
            case -270:
                this.currentSpool = spoolManager.getSpool(pipelineData.x - 1, pipelineData.y);
                break;
            default:
                break;
        }

        if (this.currentSpool) {
            this.targetPosition = this.currentSpool.node.getWorldPosition().clone();
            // Thay vì gán onExit, listen đến event khi spool này finish
        }

        this.setColor(pipelineData.ids[0]);
        const rotate = pipelineData.rotate;
        // rotate visual
        this.visual.setRotationFromEuler(0, pipelineData.rotate, 0);

        this.updateUI();
    }

    public updateUI() {
        this.label.string = this.colorIds.length.toString();
    }

    public setColor(colorId: number) {
        const colorConfig = ServiceLocator.get(PlayableColorConfig)

        const mat = this.visual.getComponentInChildren(MeshRenderer).getMaterialInstance(1);

        mat.setProperty("color", colorConfig.getMainColor(colorId));
    }

    pop = () => {
        console.log("Pop");
        
        return;
        const colorId = this.colorIds.pop()
        this.updateUI();
        const node = instantiate(this.gameConfig.spoolPrefab);
        node.setParent(this.spoolManager.node);
        node.setWorldPosition(this.targetPosition);
        const spool = node.getComponent(Spool);
        spool.capacity = 20;
        spool.color = this.colorConfig.getMainColor(colorId) || Color.WHITE;
        spool.clickFunc = () => {
            this.spoolManager.onSpoolSelected(spool)
        }
        this.spoolManager.spools.push(spool);
        this.spoolManager.spoolsMap.set(`${this.currentSpool.position.x}_${this.currentSpool.position.y}`, spool);
    }

    onSpoolFinished = (finishedSpool: Spool) => {
        // Chỉ gọi pop khi spool finish là currentSpool của Pipeline này
        if (finishedSpool === this.currentSpool) {
            this.pop();
        }
    }

    private normalizeAngle(angle: number): number {
        angle %= 360;

        if (angle < 0)
            angle += 360;

        return angle;
    }

    private angleToDir(angle: number) {

        angle = ((Math.round(angle / 90) * 90) % 360 + 360) % 360;

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