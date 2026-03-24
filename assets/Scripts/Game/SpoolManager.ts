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

    @property(CCInteger)
    public rows: number

    @property(CCFloat)
    public spacing: number

    @property({ type: Spool })
    public spools: Spool[] = []



    protected onLoad(): void {
        ServiceLocator.register(SpoolManager, this)
    }

    protected start(): void {
        this.spawnGrid();

        // ServiceLocator.get(WoolManager).generateWools()
    }

    private spawnGrid() {
        this.spools = [];

        const gameConfig = ServiceLocator.get(GameConfig)
        const levelData = ServiceLocator.get(GameManager).currentLevelData

        const spoolDatas = levelData.spools
        const total = spoolDatas.length;

        const columns = levelData.columns;
        const rows = Math.ceil(total / columns);

        // 👉 kích thước grid
        const totalWidth = (columns - 1) * this.spacing;
        const totalDepth = (rows - 1) * this.spacing; // Z

        // 👉 căn giữa
        const startX = -totalWidth / 2;
        const startZ = totalDepth / 2; // bắt đầu từ dưới (z lớn)

        for (let i = 0; i < total; i++) {

            const row = Math.floor(i / columns); // 0,1,2...
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

            // 👉 X: trái -> phải
            const x = startX + col * this.spacing;

            // 👉 Z: trên -> dưới (QUAN TRỌNG)
            const z = startZ - row * this.spacing;

            node.setPosition(new Vec3(x, 0, z))

            if (spool) {
                this.spools.push(spool);
            }
        }
    }


}


