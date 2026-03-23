import { _decorator, CCFloat, CCInteger, Color, Component, instantiate, Node } from 'cc';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { Spool } from './Spool';
import { Wool } from './Wool';
import { GameConfig } from './GameConfigSA';
const { ccclass, property } = _decorator;

@ccclass('WoolManager')
export class WoolManager extends Component {
    @property(CCInteger)
    public maxColumns: number

    private woolsByColor: Map<Color, number> = new Map<Color, number>()

    @property({ type: Wool })
    public wools: Wool[] = []


    @property(CCFloat)
    public spacingX: number = 80;

    @property(CCFloat)
    public spacingY: number = 80;

    protected start(): void {
        this.woolsByColor.clear();

        const spools = ServiceLocator.get(SpoolManager).spools;

        spools.forEach(spool => {
            // console.log(spool.color)
            const current = this.woolsByColor.get(spool.color) ?? 0;
            this.woolsByColor.set(spool.color, current + Spool.maxCapacity);
        });

        this.generateWools();
    }

    private layoutWools() {
        const totalWidth = (this.maxColumns - 1) * this.spacingX;
        const startX = -totalWidth / 2;

        this.wools.forEach((wool, index) => {
            const col = index % this.maxColumns;
            const row = Math.floor(index / this.maxColumns);

            const x = startX + col * this.spacingX;

            // 🔥 Đảo chiều để không đè lên slot/spool
            const z = -row * this.spacingY;

            wool.node.setPosition(x, 0, z);
        });
    }

    private generateWools() {
        this.wools = [];

        this.woolsByColor.forEach((count, color) => {
            for (let i = 0; i < count; i++) {
                const wool = this.createWool(color);
                this.wools.push(wool);
            }
        });

        
        this.layoutWools();
    }

    private createWool(color: Color): Wool {
        const gameConfig = ServiceLocator.get(GameConfig)
        const node = instantiate(gameConfig.woolPrefab)
        node.setParent(this.node)
        const wool = node.getComponent(Wool)
        wool.setColor(color);
        return wool;
    }
}


