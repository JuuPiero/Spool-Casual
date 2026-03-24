import { _decorator, CCFloat, CCInteger, Color, Component, instantiate, Node, tween, Vec3 } from 'cc';
import { Wool } from './Wool';
import { Spline } from '../Spline';
import { ServiceLocator } from '../ServiceLocator';
import { SpoolManager } from './SpoolManager';
import { GameConfig } from './GameConfigSA';
const { ccclass, property } = _decorator;

@ccclass('WoolManager')
export class WoolManager extends Component {

    @property(CCInteger)
    public maxColumns: number = 5;

    @property(CCFloat)
    public speed: number = 200;
   
    public wools: Wool[] = [];

    public spline: Spline


    public woolByColor: Color[] = []

    public getStartPos() : Vec3 {
        return this.spline.points[0].position.clone()
    }

    protected onLoad(): void {
        ServiceLocator.register(WoolManager, this)
        this.spline = this.getComponent(Spline)
    }

    protected start(): void {
        const spools = ServiceLocator.get(SpoolManager).spools

        for (let i = 0; i < spools.length; i++) {
            const node = instantiate(ServiceLocator.get(GameConfig).woolPrefab)
            node.setParent(this.node)
            const wool = node.getComponent(Wool)
            wool.setColor(spools[i].color)
            wool.currentIndex = i
            node.setPosition(this.spline.points[i].position.clone())
            this.wools.push(wool)
        }
    }
 
}