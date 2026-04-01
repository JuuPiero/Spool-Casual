import { _decorator, CCFloat, CCInteger, Component, director, instantiate, Node, Prefab, Vec3 } from 'cc';
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


    protected onLoad(): void {
        ServiceLocator.register(SpoolManager, this)
    }

    protected start(): void {
        this.spawnGrid();
    }

    
    public getSpool(row: number, col: number): Spool | undefined {
        return this.spoolsMap.get(`${row}_${col}`)
    }

    private spawnGrid() {
        this.spools = [];

        const gameConfig = ServiceLocator.get(GameConfig)
        

        const levelData = ServiceLocator.get(GameManager).currentLevelData

        const spoolDatas = levelData.spools
        
        const total = spoolDatas.length;

        const columns = levelData.columns;
        const rows = Math.ceil(total / columns);

        const totalWidth = (columns - 1) * this.spacing;
        const totalDepth = (rows - 1) * this.spacing; // Z

        const startX = -totalWidth / 2;
        const startZ = totalDepth / 2; // bắt đầu từ dưới (z lớn)

        for (let i = 0; i < total; i++) {

            const row = Math.floor(i / columns); 
            const col = i % columns;

            const node = instantiate(gameConfig.spoolPrefab);
           
           
            const spool = node.getComponent(Spool)

            if (spool) {
                spool.row = row;
                spool.col = col;

                const data = spoolDatas[i];
                spool.data = data;
                spool.color = gameConfig.colors[data.colorIndex];
            }

            node.name = `Spool_(${row}, ${col})`
            node.setParent(this.node);

            const x = startX + col * this.spacing;
            const z = startZ - row * this.spacing;

            node.setPosition(new Vec3(x, 0, z))

            if (spool) {
                this.spools.push(spool);
                // const rope = ropeNode.getComponent(RopeBezierWave3D)
                // this.ropes.push(rope);
                // rope.startPoint.setPosition(Vec3.ZERO)
                // rope.endPoint.setPosition(Vec3.ZERO)
                // rope.initIfNeeded(true);
                // rope.node.active = false
                // spool.rope = rope
                this.spoolsMap.set(`${row}_${col}`, spool)
            }
        }


    }


    public remove(spool: Spool) {
        const index = this.spools.indexOf(spool)
        this.spools.splice(index, 1)
        this.spoolsMap.delete(`Spool_(${spool.row}, ${spool.col})`)
    }

    public checkWin() {
        if(this.spools.length == 0) {
            console.log('win');
            SoundManager.instance.playOneShot('Win')
            const confetiEffect = instantiate(ServiceLocator.get(GameConfig).confettiEffect)
            const scene = director.getScene();
            confetiEffect.setParent(scene)
            ServiceLocator.get(NavigationContainer).stack.navigate('EndCard')
            EventBus.emit(GameEvent.LEVEL_COMPLETED)
            super_html_playable.game_end()
        }
       
    }

}


