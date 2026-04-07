import { _decorator, CCFloat, CCInteger, Color, Component, director, instantiate, macro, Node, Prefab, Vec3 } from 'cc';
import { Spool } from './Spool';
import { ServiceLocator } from '../ServiceLocator';
import { GameConfig } from './GameConfigSA';
import { GameManager } from './GameManager';
import { EventBus } from '../EventBus';
import { GameEvent } from '../GameEvent';
import { RopeBezierWave3D } from '../../Deps/iKame/scripts/rope/RopeBezierWave3D';
import { NavigationContainer } from '../Navigation/NavigationContainer';
import { TutorialController } from './UI/TutorialController';
import { SoundManager } from '../SoundManager';
import { WoolManager } from './WoolManager';
import super_html_playable from '../super_html_playable';
import { SOUNDS } from './Sounds';
import { VehicleData } from './NewLevelDataSA';
const { ccclass, property } = _decorator;

@ccclass('SpoolManager')
export class SpoolManager extends Component {


    @property(CCFloat)
    public spacing: number

    @property({ type: Spool })
    public spools: Spool[] = []

    public spoolsMap: Map<string, Spool> = new Map<string, Spool>()

    // @property(Prefab)
    // public ropePrefab: Prefab
    @property({ type: RopeBezierWave3D })
    public ropes: RopeBezierWave3D[] = []


    protected gameManager: GameManager = null

    protected onLoad(): void {
        ServiceLocator.register(SpoolManager, this)
    }

    protected start(): void {
        this.gameManager = ServiceLocator.get(GameManager);
        this.spawnGrid();
        // ServiceLocator.get(WoolManager).onNewGame()
    }

    
    public getSpool(row: number, col: number): Spool | undefined {
        return this.spoolsMap.get(`${row}_${col}`)
    }

    private spawnGrid() {
        this.spools = [];

        const gameConfig = ServiceLocator.get(GameConfig);
        const newLevelData = this.gameManager.newLevelData;


        const columns = newLevelData.gridWidth;
        const rows = newLevelData.gridHeight;

        const totalWidth = (columns - 1) * this.spacing;
        const totalDepth = (rows - 1) * this.spacing;

        const startX = -totalWidth / 2;
        const startZ = -totalDepth / 2;

        for (const vehicle of newLevelData.vehiclesData) {

            const col = vehicle.coordinateX;
            const row = vehicle.coordinateY;

            const node = instantiate(gameConfig.spoolPrefab);
            const spool = node.getComponent(Spool);

            if (!spool) {
                node.removeFromParent();
                continue;
            }

            spool.row = row;
            spool.col = col;
            node.name = `Spool_(${row}, ${col})`;
            node.setParent(this.node);

            // Set color from colorMap
            spool.color = this.gameManager.getLevelColor(vehicle.entityColorType) || Color.WHITE;

            const x = startX + col * this.spacing;
            const z = startZ + row * this.spacing;

            node.setPosition(new Vec3(x, 0, z));

            this.spools.push(spool);
            this.spoolsMap.set(`${row}_${col}`, spool);
        }
    }

    public remove(spool: Spool) {
        const index = this.spools.indexOf(spool)
        if (index >= 0) {
            this.spools.splice(index, 1)
        }
        this.spoolsMap.delete(`${spool.row}_${spool.col}`)
    }

    public checkWin() {
        if(this.spools.length == 0) {
            console.log('win');
            SoundManager.instance.playOneShot(SOUNDS.WIN)
            const confetiEffect = instantiate(ServiceLocator.get(GameConfig).confettiEffect)
            const scene = director.getScene();
            confetiEffect.setParent(scene)
          
            EventBus.emit(GameEvent.LEVEL_COMPLETED)
        }
    }

}


