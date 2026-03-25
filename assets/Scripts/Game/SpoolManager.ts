import { _decorator, CCFloat, CCInteger, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { Spool } from './Spool';
import { ServiceLocator } from '../ServiceLocator';
import { GameConfig } from './GameConfigSA';
import { WoolManager } from './WoolManager';
import { getRandomColor } from '../ultils';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('SpoolManager')
export class SpoolManager extends Component {


    @property(CCFloat)
    public spacing: number

    @property({ type: Spool })
    public spools: Spool[] = []

    public spoolsMap: Map<string, Spool> = new Map<string, Spool>()


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
                this.spoolsMap.set(`${row}_${col}`, spool)
            }
        }

    }


}


