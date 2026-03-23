import { _decorator, CCFloat, CCInteger, Component, instantiate, Node, Prefab, Vec3 } from 'cc';
import { Spool } from './Spool';
const { ccclass, property } = _decorator;

@ccclass('SpoolManager')
export class SpoolManager extends Component {

    @property(CCInteger)
    public rows: number
    @property(CCInteger)
    public columns: number


    @property(CCFloat)
    public spacing: number

    public spools: Spool[] = []

    @property(Prefab)
    public spoolPrefab: Prefab

    protected start(): void {
        this.spawnGrid();
    }

    private spawnGrid() {
        this.spools = [];

        // Tính offset để grid nằm giữa
        const totalWidth = (this.columns - 1) * this.spacing;
        const totalHeight = (this.rows - 1) * this.spacing;

        const startX = -totalWidth / 2;
        const startY = totalHeight / 2;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {

                const node = instantiate(this.spoolPrefab);
                node.setParent(this.node);

                const x = startX + col * this.spacing;
                const y = startY - row * this.spacing;

                node.setPosition(new Vec3(x, 0, y));

                const spool = node.getComponent(Spool);
                if (spool) {
                    this.spools.push(spool);
                }
            }
        }
    }


}


