import { _decorator, CCFloat, CCInteger, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { Spool } from './Spool';
import { ServiceLocator } from '../ServiceLocator';
import { GameConfig } from './GameConfigSA';
import { WoolManager } from './WoolManager';
import { getRandomColor } from '../ultils';
const { ccclass, property } = _decorator;

@ccclass('SpoolManager')
export class SpoolManager extends Component {

    @property(CCInteger)
    public rows: number
    @property(CCInteger)
    public columns: number


    @property(CCFloat)
    public spacing: number

    @property({ type: Spool })
    public spools: Spool[] = []

    // @property(Prefab)
    // public spoolPrefab: Prefab

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

        // Tính offset để grid nằm giữa
        const totalWidth = (this.columns - 1) * this.spacing;
        const totalHeight = (this.rows - 1) * this.spacing;

        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {

                const node = instantiate(gameConfig.spoolPrefab);
                const spool = node.getComponent(Spool)
                spool.color = getRandomColor()
                node.setParent(this.node);

                const x = startX + col * this.spacing;
                const y = startY - row * this.spacing;

                node.setPosition(new Vec3(x, 0, y))

               

                if(spool) 
                {
                    this.spools.push(spool);
                }
            }
        }
    }


}


