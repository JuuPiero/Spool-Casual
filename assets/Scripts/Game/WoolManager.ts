import { _decorator, CCFloat, CCInteger, Color, Component, Node, tween, Vec3 } from 'cc';
import { Wool } from './Wool';
import { Spline } from '../Spline';
import { ServiceLocator } from '../ServiceLocator';
const { ccclass, property } = _decorator;

@ccclass('WoolManager')
export class WoolManager extends Component {

    @property(CCInteger)
    public maxColumns: number = 5;


    @property(CCFloat)
    public spacingX: number = 1;   // khoảng cách giữa các lane
    @property(CCFloat)
    public spacingZ: number = 1;   // khoảng cách giữa các "toa"

    @property(CCFloat)
    public speed: number = 200;

   
    public wools: Wool[] = [];


    public spline: Spline
    

    protected onLoad(): void {
        ServiceLocator.register(WoolManager, this)
        this.spline = this.getComponent(Spline)
    }
 
}